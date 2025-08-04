import ProjectCard from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import homeContent from "@/content/home.json";
import { getFeaturedProjects } from "@/lib/content";

const projects = getFeaturedProjects();

export default function Home() {
  return (
    <div>
      <section className="py-20 md:py-32 relative bg-gradient-to-b from-primary/10 to-background">
        <div className="container">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {homeContent.title}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {homeContent.subtitle}
            </p>
            <Link href="/projects">
              <Button size="lg" className="mr-4">
                {homeContent.hero?.ctaText || "Get Started"}
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Featured Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project: any) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
