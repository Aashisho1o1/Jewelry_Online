import { useState } from "react";
import ProjectCard from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { getProjects } from "@/lib/content";

const projects = getProjects();
// Dynamically create a unique list of categories from the project data
const categories = ["All", ...new Set(projects.map((p) => p.category))];

export default function Projects() {
  const [category, setCategory] = useState("All");

  const filteredProjects =
    category === "All"
      ? projects
      : projects.filter((project) => project.category === category);

  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-8">Our Projects</h1>

      <div className="flex gap-4 mb-12">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>
    </div>
  );
}
