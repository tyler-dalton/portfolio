/**
 * Public activity copy.
 *
 * Changelog entries are visitor-visible portfolio changes that are still true.
 * Daily contribution-graph commits and unpublished drafts stay out.
 *
 * Timeline entries are milestones that already have a public page or repository.
 * Resume lines whose titles or dates still disagree stay on the resume.
 *
 * A month-only date sorts as the first of that month. The visible label is the claim.
 */

export type DatedEntry = {
  id: string;
  date: string;
  dateLabel: string;
  title: string;
  details: string[];
  href?: string;
  hrefLabel?: string;
  external?: boolean;
};

const isoDate = /^\d{4}-\d{2}(?:-\d{2})?$/;

function byDateDescending(entries: DatedEntry[]): DatedEntry[] {
  const sortKey = (date: string) => (date.length === 7 ? `${date}-01` : date);
  return [...entries].sort((a, b) => {
    const byDate = sortKey(b.date).localeCompare(sortKey(a.date));
    return byDate === 0 ? a.id.localeCompare(b.id) : byDate;
  });
}

function publish(entries: DatedEntry[]): DatedEntry[] {
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!isoDate.test(entry.date)) throw new Error(`Activity entry ${entry.id} needs an ISO date`);
    if (ids.has(entry.id)) throw new Error(`Duplicate activity id ${entry.id}`);
    ids.add(entry.id);
    if (!entry.title.trim() || entry.details.length === 0 || entry.details.some((detail) => !detail.trim())) {
      throw new Error(`Activity entry ${entry.id} is missing copy`);
    }
    if (entry.href && !entry.hrefLabel?.trim()) throw new Error(`Activity entry ${entry.id} is missing a link label`);
  }
  return byDateDescending(entries);
}

const changelogSource: DatedEntry[] = [
  {
    id: "contact-page",
    date: "2026-10-23",
    dateLabel: "October 23, 2026",
    title: "Contact page",
    details: [
      "The contact page lists the public email, GitHub, LinkedIn, digital card, and vCard. It has no form and no phone number.",
      "The homepage contact button opens that page. The footer email remains a mailto link.",
    ],
    href: "/contact",
    hrefLabel: "Contact",
  },
  {
    id: "theme-color",
    date: "2026-10-23",
    dateLabel: "October 23, 2026",
    title: "Theme color and GitHub handle",
    details: [
      "The browser theme-color follows the active dark, light, or Matrix background.",
      "On the homepage, the GitHub handle and its arrow stay on one line.",
    ],
  },
  {
    id: "digital-card",
    date: "2026-10-12",
    dateLabel: "October 12, 2026",
    title: "Digital business card",
    details: [
      "The headerless card can be saved or shared, and the vCard can be downloaded.",
      "The command palette can open the card. The footer version is read from package.json.",
    ],
    href: "/card",
    hrefLabel: "Digital card",
  },
  {
    id: "panoptes-case-study",
    date: "2026-10-02",
    dateLabel: "October 2, 2026",
    title: "Panoptes case study",
    details: [
      "The Panoptes write-up is the published project case study. Project pages can be filtered by category.",
      "The header can switch between light and dark. The command palette shows five matches and wraps with the arrow keys.",
    ],
    href: "/work/projects/panoptes",
    hrefLabel: "Panoptes",
  },
  {
    id: "section-hubs",
    date: "2026-09-30",
    dateLabel: "September 30, 2026",
    title: "Section hubs and web resume",
    details: [
      "Work, Activity, and About each have a section hub.",
      "The web resume is generated from typed data and links the PDF download.",
    ],
    href: "/work/resume",
    hrefLabel: "Resume",
  },
  {
    id: "matrix-theme",
    date: "2026-09-28",
    dateLabel: "September 28, 2026",
    title: "Matrix theme and command palette",
    details: [
      "Matrix is an opt-in theme, opened from the footer rabbit through the command palette.",
      "Light and dark remain the everyday themes.",
    ],
  },
  {
    id: "contribution-graph",
    date: "2026-09-19",
    dateLabel: "September 19, 2026",
    title: "Contribution graph",
    details: [
      "The homepage shows a GitHub contribution graph. A scheduled workflow refreshes the SVG.",
      "Those routine graph commits are not listed in this changelog.",
    ],
    href: "/activity/github",
    hrefLabel: "GitHub activity",
  },
  {
    id: "astro-site",
    date: "2026-09-18",
    dateLabel: "September 18, 2026",
    title: "Astro homepage",
    details: [
      "The homepage, site navigation, and footer shipped on Astro.",
    ],
    href: "/",
    hrefLabel: "Home",
  },
];

const timelineSource: DatedEntry[] = [
  {
    id: "panoptes",
    date: "2026-05-18",
    dateLabel: "May 18 – August 14, 2026",
    title: "Panoptes",
    details: [
      "The published case study describes a portable Kubernetes observability platform for RKE2 and OpenShift, built in summer 2026.",
      "The resume and the case study do not use the same job title for this work, so this page does not pick one.",
    ],
    href: "/work/projects/panoptes",
    hrefLabel: "Read the case study",
  },
  {
    id: "homelab",
    date: "2025-12",
    dateLabel: "December 2025 – Present",
    title: "Personal infrastructure lab",
    details: [
      "The resume lists this lab as owner and operator from December 2025 onward. The public repository holds the notes.",
      "This page does not add network detail beyond that listing.",
    ],
    href: "https://github.com/tyler-dalton/homelab-infra",
    hrefLabel: "homelab-infra",
    external: true,
  },
];

export const changelog = publish(changelogSource);
export const timeline = publish(timelineSource);
