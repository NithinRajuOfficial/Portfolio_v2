import { projectData } from "../utils/commonImports";
import ProjectCard from "./ProjectCard";

export default function ProjectContainer() {
  return (
    <section id="projects" className="px-6 md:px-20 py-10 bg-zinc-300">
      <h1 className="text-2xl font-semibold">My Projects</h1>

      <p className="font-light pb-2">Some of my personal projects:</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {projectData.map((elm, i) => (
          <ProjectCard key={elm.name} {...elm} delay={i * 100} />
        ))}
      </div>
    </section>
  );
}
