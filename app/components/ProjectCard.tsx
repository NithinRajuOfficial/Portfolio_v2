"use client";

import Image, { type StaticImageData } from "next/image";

import RevealSection from "./RevealSection";
import { BorderBeam } from "./BorderBeam";

interface ProjectCardProps {
  name: string;
  about: string;
  tech: string[];
  img: StaticImageData | string;
  codeLink: string;
  github: StaticImageData | string;
  delay: number;
}

export default function ProjectCard({
  name,
  about,
  tech,
  img,
  codeLink,
  github,
  delay,
}: ProjectCardProps) {
  return (
    <RevealSection
      delay={delay}
      className="relative w-full flex flex-col gap-2 p-2 justify-between rounded-xl text-center shadow-2xl hover:scale-105 transform duration-300 bg-darkPurple text-white"
    >
      {/* Running border beam — offset by card index so each starts at a different position */}
      <BorderBeam duration={5} size={80} initialOffset={((delay / 100) * 11) % 100} />

      <div className="aspect-20/13 overflow-hidden rounded-lg relative">
        <Image
          className="object-cover"
          src={img}
          alt={`${name} project screenshot`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <h2 className="font-semibold">{name}</h2>

      <p className="text-sm font-light text-pink/80">{about}</p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {tech.map((item) => (
          <span
            key={item}
            className="text-xs font-medium px-2 py-0.5 rounded-full bg-mediumPurple text-pink border border-lightPurple/40"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="flex justify-center gap-6">
        <a
          href={codeLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${name} source code on GitHub`}
          className="w-8 hover:scale-125 duration-300"
        >
          <Image
            src={github}
            alt="GitHub"
            width={32}
            height={32}
            className="w-full h-auto"
          />
        </a>
      </div>
    </RevealSection>
  );
}
