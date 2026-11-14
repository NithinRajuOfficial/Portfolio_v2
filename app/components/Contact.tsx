import Image from "next/image";

import { contactEmail, socialMediaList } from "../utils/commonImports";
import RevealSection from "./RevealSection";
import GridLayout from "./GridLayout";

export default function Contact() {
  return (
    <RevealSection
      as="section"
      id="contact"
      className="herobg-gradient-slant px-6 md:px-20 py-16 text-center text-white"
    >
     <GridLayout />
      <h1 className="text-3xl font-semibold pb-2">Get In Touch</h1>

      <p className="max-w-xl mx-auto pb-6 font-light">
        Have a project in mind or just want to say hi? My inbox is always open.
      </p>

      <a
        href={`mailto:${contactEmail}`}
        className="inline-block px-6 py-3 rounded-full bg-white text-darkPurple font-semibold hover:scale-105 duration-300"
      >
        {contactEmail}
      </a>

      <div className="flex justify-center gap-4 pt-8">
        {socialMediaList.map((elm) => (
          <a
            key={elm.label}
            href={elm.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={elm.label}
          >
            <Image
              src={elm.icon}
              alt={elm.label}
              width={32}
              height={32}
              className="w-8 h-auto hover:scale-110 duration-300"
            />
          </a>
        ))}
      </div>
    </RevealSection>
  );
}
