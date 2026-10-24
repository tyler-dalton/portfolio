export type PublicRepo = {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
};

/** Profile README, not a project. Forks are excluded separately. */
const excludedNames = new Set(["tyler-dalton"]);

/**
 * Last public non-fork repositories verified on 2026-10-24.
 * Used only when the build cannot read the GitHub API.
 */
export const fallbackRepos: PublicRepo[] = [
  {
    name: "portfolio",
    url: "https://github.com/tyler-dalton/portfolio",
    description: "This repository will host all the code that I have wrote in order to host my own portfolio page.",
    language: "Astro",
    pushedAt: "2026-10-24T02:34:40Z",
  },
  {
    name: "homelab-infra",
    url: "https://github.com/tyler-dalton/homelab-infra",
    description: "This is my page to document all major steps in my homelab as I progress. This will act as my refrence point, to keep track of my journey. Follow along if you would like!",
    language: "CSS",
    pushedAt: "2026-10-24T02:18:58Z",
  },
  {
    name: "deployment-bags",
    url: "https://github.com/tyler-dalton/deployment-bags",
    description: "Portable, isolated networking lab environments for students at the University of Cincinnati.",
    language: "Shell",
    pushedAt: "2026-10-24T00:55:10Z",
  },
  {
    name: "dotfiles",
    url: "https://github.com/tyler-dalton/dotfiles",
    description: null,
    language: "Shell",
    pushedAt: "2026-10-20T04:46:37Z",
  },
];

export function selectPublicRepos(payload: unknown): PublicRepo[] {
  if (!Array.isArray(payload)) return [];

  const repos: PublicRepo[] = [];

  for (const item of payload) {
    if (!item || typeof item !== "object") continue;
    const repo = item as Record<string, unknown>;
    if (repo.private !== false || repo.fork !== false || repo.archived !== false) continue;

    const name = repo.name;
    const url = repo.html_url;
    if (typeof name !== "string" || excludedNames.has(name)) continue;
    if (typeof url !== "string" || !url.startsWith("https://github.com/tyler-dalton/")) continue;

    const description = typeof repo.description === "string" && repo.description.trim()
      ? repo.description.trim()
      : null;
    const language = typeof repo.language === "string" && repo.language.trim()
      ? repo.language.trim()
      : null;
    const pushedAt = typeof repo.pushed_at === "string" ? repo.pushed_at : "";

    repos.push({ name, url, description, language, pushedAt });
  }

  return repos.sort((left, right) => right.pushedAt.localeCompare(left.pushedAt));
}

export async function loadPublicRepos(): Promise<{ repos: PublicRepo[]; source: "live" | "snapshot" }> {
  try {
    const response = await fetch("https://api.github.com/users/tyler-dalton/repos?per_page=100&sort=pushed", {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "tylerdalton-portfolio",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`GitHub responded ${response.status}`);

    const repos = selectPublicRepos(await response.json());
    if (!repos.length) throw new Error("GitHub returned no public repositories");

    return { repos, source: "live" };
  } catch {
    return { repos: fallbackRepos, source: "snapshot" };
  }
}
