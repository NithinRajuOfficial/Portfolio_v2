import { projectData } from "../utils/commonImports";
import GridLayout from "./GridLayout";
import ProjectCard from "./ProjectCard";

export default function ProjectContainer() {
  return (
    <section
      id="projects"
      className="relative px-6 md:px-20 py-10 bg-mediumPurple text-white overflow-hidden"
    >
      <GridLayout />

      <div className="relative">
        <h1 className="text-2xl font-semibold">My Projects</h1>
        <p className="font-light pb-2 text-pink/80">
          Some of my personal projects:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-black">
          {projectData.map((elm, i) => (
            <ProjectCard key={elm.name} {...elm} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
