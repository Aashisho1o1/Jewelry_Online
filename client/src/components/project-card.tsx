import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Play, ExternalLink } from "lucide-react";

interface ProjectCardProps {
  project: {
    title: string;
    description: string;
    category: string;
    imageUrl: string;
    videoUrl?: string;
    location?: string;
    completionDate?: string;
    featured?: boolean;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const videoId = project.videoUrl ? getYouTubeVideoId(project.videoUrl) : null;

  return (
    <div className="block group">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <AspectRatio ratio={4 / 3}>
            <img
              src={project.imageUrl}
              alt={project.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
            {/* YouTube Video Overlay - Only show if video URL exists */}
            {videoId && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(project.videoUrl, '_blank');
                  }}
                >
                  <Play className="w-4 h-4" />
                  Watch Video
                </Button>
              </div>
            )}
          </AspectRatio>
          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold">{project.title}</h3>
              {project.featured && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  Featured
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {project.description}
            </p>
            
            {/* Project Details */}
            <div className="space-y-1 mb-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Category:</span> {project.category}
              </p>
              {project.location && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Location:</span> {project.location}
                </p>
              )}
              {project.completionDate && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Completed:</span> {new Date(project.completionDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* YouTube Video Link - Only show if video URL exists */}
            {videoId && (
              <div className="pt-3 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(project.videoUrl, '_blank');
                  }}
                >
                  <Play className="w-4 h-4" />
                  Watch Project Video
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
