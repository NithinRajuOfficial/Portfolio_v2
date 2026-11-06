import Image, { type StaticImageData } from "next/image";
import RevealSection from "./RevealSection";

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
      className="w-full flex flex-col gap-2 p-2 justify-between border-4 border-gray-400 rounded-xl text-center shadow-2xl hover:scale-105 transform duration-300 bg-zinc-200"
    >
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

      <p className="text-sm font-light">{about}</p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {tech.map((item) => (
          <span
            key={item}
            className="text-xs font-medium px-2 py-0.5 rounded-full bg-darkPurple text-white"
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
            unoptimized
            className="w-full h-auto"
          />
        </a>
      </div>
    </RevealSection>
  );
}
