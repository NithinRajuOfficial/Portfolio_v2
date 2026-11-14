import RevealSection from "./RevealSection";

export default function MainContainer() {
  return (
    <section
      id="about"
      className="relative flex flex-col md:flex-row h-auto px-6 md:px-20 py-12 gap-8 md:gap-16 bg-mediumPurple text-white overflow-hidden"
    >
      {/* Line grid background pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(220,207,237,0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(220,207,237,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      <RevealSection className="relative self-start flex-1">
        <h1 className="text-3xl font-semibold pb-2">About Me</h1>

        <p className="text-xl font-normal leading-8 text-wrap text-pink/90">
          Hi, I&apos;m Nithin Raju, a Software Engineer with 5+ years of
          experience building production-grade web platforms across media
          streaming, admin tooling, marketplaces, and notification systems.
          I&apos;ve worked across React, Next.js, TypeScript, and Node.js, and
          recently expanded into Generative AI — building RAG pipelines,
          semantic search, and LLM-powered features. I care about owning
          features end-to-end — from UI design through API integration,
          feature-flagged rollouts, and clean, scalable architecture.
          Let&apos;s connect if you&apos;re working on something interesting!
        </p>
      </RevealSection>
    </section>
  );
}
