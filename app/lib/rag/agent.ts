/**
 * RAG agent — query-time only (no ingestion).
 * Ported from Web_AI_Agent/index4.js with OpenAI replaced by Gemini 2.0 Flash.
 *
 * Pinecone handles server-side embedding (llama-text-embed-v2) — unchanged.
 * Only the two LLM calls (classifier + synthesizer) now use @google/genai.
 */

import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";

// ─── types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface Classification {
  intent: string;
  company: string | null;
  project: string | null;
  standalone_question: string;
  reason: string;
}

interface PineconeDocument {
  [key: string]: unknown;
  fields?: Record<string, unknown>;
}

// ─── constants ────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 180;
const CHUNK_OVERLAP = 30;

const COMPANIES = ["Tech Mission Solutions", "Vaniyathans Software Solutions"];

const PROJECTS = [
  "Amazing Kids Admin",
  "Service Builder Web",
  "Parent Plus Admin",
  "TMS Website",
  "Service Connect",
  "YourMJ",
  "BuddyPair",
  "DressUpLand",
  "Travel Freaks",
];

const VALID_INTENTS = [
  "company_experience",
  "employment_status",
  "project_details",
  "project_list",
  "project_overview",
  "personal_project_list",
  "personal_project_overview",
  "skills",
  "education",
  "profile",
  "experience_years",
  "general",
];

const GEMINI_MODEL = "gemini-3.5-flash-lite";

// ─── SDK clients (lazy-initialised so they're only created on first call) ─────

let _ai: GoogleGenAI | null = null;
let _namespace: ReturnType<ReturnType<Pinecone["index"]>["namespace"]> | null =
  null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable");
    _ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1beta" } });
  }
  return _ai;
}

function getNamespace() {
  if (!_namespace) {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;
    if (!apiKey)
      throw new Error("Missing PINECONE_API_KEY environment variable");
    if (!indexName)
      throw new Error("Missing PINECONE_INDEX_NAME environment variable");

    const pc = new Pinecone({ apiKey });
    _namespace = pc.index(indexName).namespace("__default__");
  }
  return _namespace;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getField(doc: PineconeDocument, field: string): string {
  return (doc?.[field] ?? doc?.fields?.[field] ?? "") as string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function splitIntoChunks(
  text: string,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP,
): string[] {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const chunks: string[] = [];
  for (let start = 0; start < words.length; start += chunkSize - overlap) {
    chunks.push(words.slice(start, start + chunkSize).join(" "));
    if (start + chunkSize >= words.length) break;
  }
  return chunks;
}

// ─── deterministic question detectors ────────────────────────────────────────

function isExperienceYearsQuestion(userQuestion: string): boolean {
  const q = userQuestion
    .toLowerCase()
    .replace(/[?!.,]+/g, " ")
    .trim();
  return (
    /\b(how many|total|overall|years? of|yrs? of)\b.*\b(experience|exp)\b/.test(q) ||
    /\b(experience|exp)\b.*\b(how many|total|overall|years?|yrs?)\b/.test(q) ||
    /\bhow (long|much).*(work|experience|exp)\b/.test(q)
  );
}

function isEmploymentStatusQuestion(userQuestion: string): boolean {
  const q = userQuestion
    .toLowerCase()
    .replace(/[?!.,]+/g, " ")
    .trim();

  const asksAboutPast =
    /\b(previous|last|past|before|first|former|earlier)\b/.test(q);
  if (asksAboutPast) return false;

  const asksAboutEmployment =
    /\b(employer|employment|employed|working|work|job)\b/.test(q);
  const asksAboutCurrentStatus =
    /\b(current|currently|present|right now|at present|still)\b/.test(q);
  const asksWhoOrWhereWorksNow =
    /\b(who|where)\b.*\b(work|working|employed)\b.*\b(now|currently|present|at present)\b/.test(
      q,
    );

  return (
    (asksAboutEmployment && asksAboutCurrentStatus) || asksWhoOrWhereWorksNow
  );
}

function getProjectQuestionType(
  userQuestion: string,
): "personal" | "professional" | null {
  const q = userQuestion
    .toLowerCase()
    .replace(/[?!.,]+/g, " ")
    .trim();

  const mentionsProjects = /\bprojects?\b/.test(q);
  const asksForOverview =
    /\b(brief|explain|describe|overview|summari[sz]e|details|elaborate|list|show)\b/.test(
      q,
    ) ||
    /\b(tell me about|tell me more about|give me an overview|give me details)\b/.test(
      q,
    );

  if (!mentionsProjects || !asksForOverview) return null;

  if (
    /\b(personal|side|individual|own)\s+projects?\b/.test(q) ||
    /\bprojects?\s+(?:of|from)\s+(?:his\s+)?personal\b/.test(q)
  ) {
    return "personal";
  }

  if (/\b(professional|work|company|corporate)\s+projects?\b/.test(q)) {
    return "professional";
  }

  return "professional";
}

// ─── LLM call #1 — intent classifier (Gemini) ────────────────────────────────

async function classifyQuestion(
  userQuestion: string,
  history: ChatMessage[] = [],
): Promise<Classification> {
  const ai = getAI();

  // Build conversation history for Gemini (role: "user" | "model")
  const historyContents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const systemInstruction = `
You are a query classifier and query rewriter for Nithin Raju's portfolio RAG application.

Understand the latest question, use conversation history to resolve follow-ups,
and return a standalone question with the correct intent.

AVAILABLE INTENTS:
1. company_experience
2. employment_status
3. project_details
4. project_list
5. project_overview
6. personal_project_list
7. personal_project_overview
8. skills
9. education
10. profile
11. experience_years
12. general

KNOWN COMPANIES:
- Tech Mission Solutions
- Vaniyathans Software Solutions

KNOWN PROFESSIONAL PROJECTS:
- Amazing Kids Admin
- Service Builder Web
- Parent Plus Admin
- TMS Website
- Service Connect
- YourMJ
- BuddyPair
- DressUpLand
- Travel Freaks

CONVERSATION RULES:
- Use history to resolve "these projects", "each of them", "the first one", etc.
- If the user explicitly asks about personal projects, use personal project intents.
- If the user explicitly asks about professional projects, use professional project intents.
- Never invent company or project names.
- Questions about past or previous companies are "company_experience", NOT "employment_status".

Return ONLY valid JSON matching this schema:
{
  "intent": "<one of the AVAILABLE INTENTS>",
  "company": "<company name or null>",
  "project": "<project name or null>",
  "standalone_question": "<fully self-contained question>",
  "reason": "<brief explanation>"
}
`.trim();

  const userContent = `Classify this question: ${userQuestion}`;

  let rawText = "";
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        ...historyContents,
        { role: "user", parts: [{ text: userContent }] },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0,
      },
    });
    rawText = response.text ?? "";
  } catch {
    return {
      intent: "general",
      company: null,
      project: null,
      standalone_question: userQuestion,
      reason: "Classification failed.",
    };
  }

  let result: Classification;
  try {
    result = JSON.parse(rawText) as Classification;
  } catch {
    return {
      intent: "general",
      company: null,
      project: null,
      standalone_question: userQuestion,
      reason: "Classification parse failed.",
    };
  }

  // Validate
  if (!VALID_INTENTS.includes(result.intent)) result.intent = "general";
  if (!COMPANIES.includes(result.company ?? "")) result.company = null;
  if (!PROJECTS.includes(result.project ?? "")) result.project = null;
  if (!result.standalone_question?.trim())
    result.standalone_question = userQuestion;

  // Deterministic overrides
  if (isExperienceYearsQuestion(userQuestion)) {
    result.intent = "experience_years";
    result.company = null;
    result.project = null;
    result.standalone_question =
      "What is Nithin's total years of professional experience?";
    result.reason = "The user is asking about total years of experience.";
  } else if (isEmploymentStatusQuestion(userQuestion)) {
    result.intent = "employment_status";
    result.company = null;
    result.project = null;
    result.standalone_question =
      "Determine Nithin's current employment status using only his employment records, roles, and employment dates.";
    result.reason = "The user is asking about current employment status.";
  } else {
    const projectType = getProjectQuestionType(userQuestion);
    if (projectType === "personal") {
      const asksForList = /\b(list|show|name|enumerate)\b/i.test(userQuestion);
      result.intent = asksForList
        ? "personal_project_list"
        : "personal_project_overview";
      result.company = null;
      result.project = null;
      result.standalone_question = asksForList
        ? "List all personal projects Nithin has developed, using his portfolio website."
        : "Provide an overview of all personal projects Nithin has developed, using his portfolio website.";
      result.reason = "The user explicitly requested personal projects.";
    } else if (projectType === "professional") {
      const asksForList = /\b(list|show|name|enumerate)\b/i.test(userQuestion);
      result.intent = asksForList ? "project_list" : "project_overview";
      result.company = null;
      result.project = null;
      result.standalone_question = asksForList
        ? "List all professional projects Nithin has worked on."
        : "Provide a brief overview of all professional projects Nithin has worked on.";
      result.reason = "The user explicitly requested professional projects.";
    }
  }

  return result;
}

// ─── Pinecone retrieval ───────────────────────────────────────────────────────

async function retrieveByMetadata(
  field: string,
  value: string,
): Promise<PineconeDocument[]> {
  const ns = getNamespace();
  const response = await ns.documents.fetch({
    filter: { [field]: { $eq: value } },
    includeFields: [
      "title",
      "chunk_text",
      "url",
      "source",
      "section",
      "company",
      "project",
    ],
    limit: 100,
  });
  return Object.values(
    (response as { documents?: Record<string, PineconeDocument> }).documents ??
      {},
  );
}

async function retrieveSemanticDocuments(
  query: string,
): Promise<PineconeDocument[]> {
  const ns = getNamespace();
  const response = (await ns.documents.search({
    scoreBy: [{ type: "embed", field: "chunk_text", query }],
    topK: 5,
    includeFields: [
      "title",
      "chunk_text",
      "url",
      "source",
      "section",
      "company",
      "project",
    ],
  })) as {
    matches?: PineconeDocument[];
    result?: { hits?: PineconeDocument[] };
  };
  return response.matches ?? response.result?.hits ?? [];
}

function sortProjectDocuments(matches: PineconeDocument[]): PineconeDocument[] {
  return [...matches].sort((a, b) => {
    const ia = PROJECTS.indexOf(getField(a, "project"));
    const ib = PROJECTS.indexOf(getField(b, "project"));
    return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
  });
}

async function retrieveDocuments(
  userQuestion: string,
  classification: Classification,
): Promise<PineconeDocument[]> {
  const { intent, company, project } = classification;

  let matches: PineconeDocument[] = [];

  if (intent === "employment_status") {
    matches = await retrieveByMetadata("section", "professional_experience");
  } else if (intent === "experience_years") {
    // Pull both the profile header (has "Overall Experience: 5.1 Years") and
    // all professional_experience records so we have full date coverage.
    const [profileDocs, expDocs] = await Promise.all([
      retrieveByMetadata("section", "profile"),
      retrieveByMetadata("section", "professional_experience"),
    ]);
    matches = [...profileDocs, ...expDocs];
  } else if (intent === "company_experience" && company) {
    matches = await retrieveByMetadata("company", company);
  } else if (intent === "company_experience") {
    // No specific company — return all professional experience records
    matches = await retrieveByMetadata("section", "professional_experience");
  } else if (intent === "project_list" || intent === "project_overview") {
    matches = await retrieveByMetadata("section", "project");
  } else if (
    intent === "personal_project_list" ||
    intent === "personal_project_overview"
  ) {
    matches = await retrieveByMetadata("section", "website");
  } else if (intent === "project_details" && project) {
    matches = await retrieveByMetadata("project", project);
  } else if (intent === "project_details" && company) {
    matches = await retrieveByMetadata("company", company);
  } else if (intent === "skills") {
    matches = await retrieveByMetadata("section", "skills");
  } else if (intent === "education") {
    matches = await retrieveByMetadata("section", "education");
  } else if (intent === "profile") {
    matches = await retrieveByMetadata("section", "profile");
  } else {
    matches = await retrieveSemanticDocuments(userQuestion);
  }

  if (!matches.length && intent !== "employment_status") {
    matches = await retrieveSemanticDocuments(userQuestion);
  }

  if (intent === "project_list" || intent === "project_overview") {
    matches = sortProjectDocuments(matches);
  }

  return matches;
}

// ─── context builder ──────────────────────────────────────────────────────────

function buildContext(matches: PineconeDocument[]): string {
  return matches
    .map((match, i) => {
      return [
        `Document ${i + 1}`,
        `Title: ${getField(match, "title") || "Untitled"}`,
        `Source: ${getField(match, "source") || "N/A"}`,
        `Section: ${getField(match, "section") || "N/A"}`,
        `Company: ${getField(match, "company") || "N/A"}`,
        `Project: ${getField(match, "project") || "N/A"}`,
        `Content: ${getField(match, "chunk_text")}`,
      ].join("\n");
    })
    .join("\n\n");
}

// ─── employment date helpers ──────────────────────────────────────────────────

function parseEmploymentDate(value: string): Date | null {
  const c = value.trim().replace(/,/g, "");

  // DD/MM/YYYY  e.g. 24/03/2025
  const dmy = c.match(/^(\d{1,2})\/(\d{1,2})\/((?:19|20)\d{2})$/);
  if (dmy) {
    const d = new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])));
    return isNaN(d.getTime()) ? null : d;
  }

  // Month YYYY  e.g. March 2025
  const monthYear = c.match(
    /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})$/i,
  );
  if (monthYear) {
    const d = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    return isNaN(d.getTime()) ? null : d;
  }

  // Bare year  e.g. 2021
  const yearMatch = c.match(/^(19\d\d|20[0-3]\d)$/);
  if (yearMatch) return new Date(Date.UTC(Number(yearMatch[1]), 0, 1));

  return null;
}

function extractEmploymentDates(
  text: string,
): Array<{ value: string; date: Date }> {
  // Matches DD/MM/YYYY, Month YYYY, or bare YYYY
  const datePattern =
    /\b\d{1,2}\/\d{1,2}\/(?:19|20)\d{2}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b|\b(19\d\d|20[0-3]\d)\b/gi;

  return [...text.matchAll(datePattern)]
    .map((m) => ({ value: m[0], date: parseEmploymentDate(m[0])! }))
    .filter((item) => item.date !== null);
}

function hasExplicitCurrentEmployment(text: string): boolean {
  // Covers:  DD/MM/YYYY – present  |  Month YYYY – present  |  YYYY – present
  return /(?:\b\d{1,2}\/\d{1,2}\/(?:19|20)\d{2}\b|\b(?:19|20)\d{2}\b|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})\s*(?:-|–|—|to|till|until)\s*(?:present|current|ongoing|date)/i.test(
    text,
  );
}

// ─── deterministic answer builders ───────────────────────────────────────────

function buildEmploymentStatusAnswer(matches: PineconeDocument[]): string {
  if (!matches.length) {
    return "I couldn't find employment records in Nithin's resume, so I can't determine his current employer.";
  }

  const seen = new Set<string>();
  const records: Array<{ company: string; title: string; content: string }> =
    [];

  for (const m of matches) {
    if (getField(m, "section") !== "professional_experience") continue;
    const company = getField(m, "company");
    const title = getField(m, "title");
    const content = getField(m, "chunk_text");
    if (!content) continue;
    const key = `${company}-${title}-${content}`;
    if (!seen.has(key)) {
      seen.add(key);
      records.push({ company, title, content });
    }
  }

  if (!records.length) {
    return "I couldn't identify employment records in Nithin's resume.";
  }

  const enriched = records.map((r) => {
    const combined = `${r.title}\n${r.content}`;
    const dates = extractEmploymentDates(combined);
    const explicitlyCurrent = hasExplicitCurrentEmployment(combined);
    const endDate = dates.length >= 2 ? dates[dates.length - 1] : null;
    return { ...r, explicitlyCurrent, dates, endDate };
  });

  const current = enriched.filter((r) => r.explicitlyCurrent);

  if (current.length === 1) {
    const c = current[0];
    const role = c.title?.replace(/\s*-\s*.*/, "")?.trim();
    return (
      `According to Nithin's resume, his current employer is ${c.company || "an unspecified company"}` +
      `${role ? `, where he is listed as ${role}` : ""}. ` +
      `The employment record explicitly marks this position as ongoing.`
    );
  }

  if (current.length > 1) {
    const companies = [
      ...new Set(current.map((r) => r.company).filter(Boolean)),
    ];
    return (
      `Nithin's resume contains multiple employment records marked as ongoing: ${companies.join(", ")}. ` +
      `The records don't establish which is his primary current employer.`
    );
  }

  const withEnd = enriched
    .filter((r) => r.endDate)
    .sort((a, b) => b.endDate!.date.getTime() - a.endDate!.date.getTime());

  if (withEnd.length > 0) {
    const latest = withEnd[0];
    const company = latest.company || "an unspecified company";
    const role = latest.title?.replace(/\s*-\s*.*/, "")?.trim();
    const endDate = latest.endDate!.date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const parsedEnd = new Date(latest.endDate!.date);
    parsedEnd.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedEnd < today) {
      return (
        `Nithin's resume lists ${company} as his latest recorded employer` +
        `${role ? `, where he worked as ${role}` : ""}. ` +
        `The listed employment ended on ${endDate}. ` +
        `There is no confirmed information in the available data about any employment after that date.`
      );
    }
  }

  return (
    "Nithin's available employment records don't clearly establish whether he is currently employed " +
    "or identify a current employer."
  );
}

function buildProfessionalProjectList(matches: PineconeDocument[]): string {
  const projectMap = new Map<string, string>();
  for (const m of matches) {
    const project = getField(m, "project");
    const company = getField(m, "company");
    if (project && !projectMap.has(project)) {
      projectMap.set(project, company || "Company not specified");
    }
  }

  if (!projectMap.size) {
    return "I couldn't find professional project records in Nithin's resume.";
  }

  const companyOrder = [
    "Tech Mission Solutions",
    "Vaniyathans Software Solutions",
    "Company not specified",
  ];
  const companyMap = new Map<string, string[]>();
  for (const [project, company] of projectMap.entries()) {
    if (!companyMap.has(company)) companyMap.set(company, []);
    companyMap.get(company)!.push(project);
  }

  const sorted = [...companyMap.entries()].sort(
    (a, b) => companyOrder.indexOf(a[0]) - companyOrder.indexOf(b[0]),
  );

  let answer = `Nithin has worked on ${projectMap.size} professional projects:\n\n`;
  for (const [company, projects] of sorted) {
    answer += `**${company}**\n`;
    projects.forEach((p, i) => {
      answer += `${i + 1}. ${p}\n`;
    });
    answer += "\n";
  }
  return answer.trim();
}

function buildPersonalProjectContext(matches: PineconeDocument[]): string {
  const seen = new Map<string, { title: string; content: string }>();
  for (const m of matches) {
    const title = getField(m, "title") || "Portfolio";
    const content = getField(m, "chunk_text");
    if (!content) continue;
    const key = `${title}-${content}`;
    if (!seen.has(key)) seen.set(key, { title, content });
  }
  return [...seen.values()]
    .map((d) => `Section: ${d.title}\nContent: ${d.content}`)
    .join("\n\n");
}

// ─── identity handler ─────────────────────────────────────────────────────────

function handleAssistantIdentity(userQuestion: string): string | null {
  const q = userQuestion
    .toLowerCase()
    .trim()
    .replace(/[?!.,]+$/g, "");

  const identityPatterns = [
    /\bwho are you\b/,
    /\bwhat are you\b/,
    /\bwho r u\b/,
    /\bwhat r u\b/,
    /\bwho is this\b/,
    /\bmay i know who you are\b/,
    /\bcan you tell me who you are\b/,
    /\bintroduce yourself\b/,
  ];

  if (identityPatterns.some((p) => p.test(q))) {
    return "Hi! I'm an AI-powered portfolio assistant for Nithin Raju, built with Gemini. I can answer questions about his professional experience, personal projects, technical skills, and educational background. I'm an AI assistant, not Nithin himself.";
  }

  if (/\bare you nithin( raju)?\b/.test(q)) {
    return "No, I'm not Nithin Raju. I'm an AI assistant representing his portfolio, powered by Gemini. I can help you learn about his experience, projects, skills, and education.";
  }

  const capabilityPatterns = [
    /\bwhat can you do\b/,
    /\bhow can you help( me)?\b/,
    /\byour capabilities\b/,
  ];

  if (capabilityPatterns.some((p) => p.test(q))) {
    return "I can help you explore Nithin Raju's portfolio. Ask me about his professional experience, personal projects, technologies, skills, or educational background.";
  }

  return null;
}

// ─── LLM call #2 — answer synthesizer (Gemini) ───────────────────────────────

async function synthesizeAnswer(
  userQuestion: string,
  standaloneQuestion: string,
  context: string,
  history: ChatMessage[],
): Promise<string> {
  const ai = getAI();

  const systemInstruction = `
You are an AI assistant for Nithin Raju's portfolio website.
Your job is to answer questions about Nithin using retrieved portfolio and resume information.
The retrieved context is your factual source of truth.

RULES:
- Refer to Nithin in the third person.
- Never claim to be Nithin.
- Distinguish past employment from current employment.
- Never state that an employer is current without explicit confirmation in the context.
- Keep project explanations concise and factual.
- If information is missing from the context, state it clearly.
- Do not add markdown formatting unless the answer naturally calls for a list.
`.trim();

  const historyContents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const userContent =
    `Retrieved portfolio and resume context:\n\n${context}\n\n` +
    `Original user question:\n${userQuestion}\n\n` +
    `Standalone question used for retrieval:\n${standaloneQuestion}\n\n` +
    `Answer the original user question using the retrieved context.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        ...historyContents,
        { role: "user", parts: [{ text: userContent }] },
      ],
      config: {
        systemInstruction,
        temperature: 0,
      },
    });
    return response.text ?? "I couldn't generate an answer. Please try again.";
  } catch {
    return "I encountered an error generating a response. Please try again.";
  }
}

async function synthesizePersonalProjectList(
  userQuestion: string,
  context: string,
): Promise<string> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `You are an AI portfolio assistant for Nithin Raju.\n` +
                `The user wants a list of Nithin's personal projects.\n` +
                `Use ONLY the supplied portfolio website content.\n` +
                `Return a clean numbered list. If none are identifiable, say so clearly.\n\n` +
                `Portfolio website content:\n\n${context}\n\nQuestion:\n${userQuestion}`,
            },
          ],
        },
      ],
      config: { temperature: 0 },
    });
    return (
      response.text ??
      "I couldn't identify personal projects in the portfolio content."
    );
  } catch {
    return "I encountered an error generating a response. Please try again.";
  }
}

// ─── core exported function ───────────────────────────────────────────────────

export async function handleChatMessage({
  userQuestion,
  history = [],
}: {
  userQuestion: string;
  history?: ChatMessage[];
}): Promise<string> {
  // 1. Identity shortcut — no LLM/DB calls
  const identityAnswer = handleAssistantIdentity(userQuestion);
  if (identityAnswer) return identityAnswer;

  // 2. Classify intent
  const classification = await classifyQuestion(userQuestion, history);
  const standaloneQuestion = classification.standalone_question || userQuestion;

  // 3. Retrieve documents from Pinecone
  const matches = await retrieveDocuments(standaloneQuestion, classification);

  // 4. Deterministic: employment status
  if (classification.intent === "employment_status") {
    return buildEmploymentStatusAnswer(matches);
  }

  // 5. Fallback: no docs found
  if (!matches.length) {
    return "I couldn't find relevant information about that in Nithin's portfolio or resume.";
  }

  // 6. Deterministic: professional project list
  if (classification.intent === "project_list") {
    return buildProfessionalProjectList(matches);
  }

  // 7. LLM synthesis: personal project list
  if (classification.intent === "personal_project_list") {
    const context = buildPersonalProjectContext(matches);
    return synthesizePersonalProjectList(userQuestion, context);
  }

  // 8. LLM synthesis: everything else
  const context = buildContext(matches);
  return synthesizeAnswer(userQuestion, standaloneQuestion, context, history);
}
