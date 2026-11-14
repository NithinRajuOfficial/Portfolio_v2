import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Nithin Raju | Software Engineer | Generative AI",
  description:
    "Nithin Raju is a Software Engineer with 5+ years of experience building production-grade web platforms using React, Next.js, TypeScript, and Node.js, with expertise in Generative AI and RAG systems.",
  metadataBase: new URL("https://nithin-raju.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Nithin Raju | Software Engineer | Generative AI",
    description:
      "Nithin Raju is a Software Engineer with 5+ years of experience building production-grade web platforms using React, Next.js, TypeScript, and Node.js, with expertise in Generative AI and RAG systems.",
    url: "https://nithin-raju.vercel.app/",
  },
  twitter: {
    card: "summary",
    title: "Nithin Raju | Software Engineer | Generative AI",
    description:
      "Nithin Raju is a Software Engineer with 5+ years of experience building production-grade web platforms using React, Next.js, TypeScript, and Node.js, with expertise in Generative AI and RAG systems.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
