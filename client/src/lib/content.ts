import projectsData from '@/content/projects.json';

// You can add basic validation or transformation here if needed
const allProjects = projectsData.projects;

export function getProjects() {
  // Returns a copy to prevent accidental mutation of the original data
  return [...allProjects];
}

export function getFeaturedProjects(count: number = 3) {
  // Returns a specified number of projects, e.g., for a "Featured" section
  return getProjects().slice(0, count);
} 