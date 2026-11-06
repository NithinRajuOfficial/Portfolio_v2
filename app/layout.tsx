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
  title: "Nithin Raju | Full Stack Developer",
  description:
    "Nithin Raju is a MERN stack developer specialising in building dynamic, responsive web applications with MongoDB, Express.js, React and Node.js.",
  metadataBase: new URL("https://nithin-raju.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "Nithin Raju | Full Stack Developer",
    description:
      "Nithin Raju is a MERN stack developer specialising in building dynamic, responsive web applications with MongoDB, Express.js, React and Node.js.",
    url: "https://nithin-raju.vercel.app/",
  },
  twitter: {
    card: "summary",
    title: "Nithin Raju | Full Stack Developer",
    description:
      "Nithin Raju is a MERN stack developer specialising in building dynamic, responsive web applications with MongoDB, Express.js, React and Node.js.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
