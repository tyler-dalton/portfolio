import { getCollection, type CollectionEntry } from "astro:content";

export type Project = CollectionEntry<"projects">;

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
