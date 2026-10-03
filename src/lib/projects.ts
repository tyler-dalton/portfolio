import { getCollection, type CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;
export type ProjectView =
  | "featured"
  | "all"
  | "infrastructure"
  | "development"
  | "cybersecurity"
  | "misc";

export const projectViews: { id: ProjectView; label: string; href: string }[] = [
  { id: "featured", label: "Featured", href: "/work/projects/featured" },
  { id: "all", label: "All", href: "/work/projects/all" },
  { id: "infrastructure", label: "Infrastructure", href: "/work/projects/infrastructure" },
  { id: "development", label: "Development", href: "/work/projects/development" },
  { id: "cybersecurity", label: "Cybersecurity", href: "/work/projects/cybersecurity" },
  { id: "misc", label: "Miscellaneous", href: "/work/projects/misc" },
];

function sortProjects(projects: Project[]): Project[] {
  return projects.sort((a, b) =>
    b.data.start.getTime() - a.data.start.getTime() || a.id.localeCompare(b.id),
  );
}

export async function getHomepageProjects(): Promise<Project[]> {
  const projects = (await getCollection("projects"))
    .filter((project) => project.data.show.home)
    .sort((a, b) =>
      a.data.show.home!.order - b.data.show.home!.order ||
      a.id.localeCompare(b.id),
    );

  const orders = projects.map((project) => project.data.show.home!.order);

  if (new Set(orders).size !== orders.length) {
    throw new Error("Each homepage project must have a unique show.home.order.");
  }

  return projects;
}

export async function getProjectsForView(view: ProjectView): Promise<Project[]> {
  const projects = await getCollection("projects");

  return sortProjects(projects.filter((project) => {
    if (view === "all") return true;
    if (view === "featured") return project.data.show.projectFeature;

    return project.data.categories.includes(view);
  }));
}
