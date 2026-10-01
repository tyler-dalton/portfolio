export type ProjectCategory = "infrastructure" | "development";
export type ProjectView = "featured" | "all" | ProjectCategory;

export type Project = {
  slug: string;
  number: string;
  period: string;
  title: string;
  organization: string;
  subtitle: string;
  description: string[];
  technologies: string[];
  featured: boolean;
  categories: ProjectCategory[] };

export const projectViews: { id: ProjectView; label: string; href: string }[] = [
  { id: "featured",
    label: "Featured",
    href: "/work/projects/featured" },
  { id: "all",
    label: "All",
    href: "/work/projects/all" },
  { id: "infrastructure",
    label: "Infrastructure",
    href: "/work/projects/infrastructure" },
  { id: "development",
    label: "Development",
    href: "/work/projects/development" },
];

export const projects: Project[] = [
  { slug: "panoptes",
    number: "01",
    period: "Summer 2026",
    title: "Panoptes",
    organization: "Awetomaton",
    subtitle: "Standardized Kubernetes observability platform across RKE2 & OpenShift",
    description: ["Built a standardized Helm-based monitoring platform around Prometheus, Grafana, Thanos, and the Kubernetes monitoring ecosystem. The platform was designed to support multiple Kubernetes distributions from a common deployment strategy.",
      "The project ultimately reached a classified, air-gapped environment at Wright-Patterson Air Force Base during the final week of my internship."],
    technologies: ["Kubernetes", "Helm", "Prometheus", "Grafana", "OpenShift", "RKE2"],
    featured: true,
    categories: ["infrastructure", "development"] },

  { slug: "networking-deployment-bags",
    number: "02",
    period: "Fall 2026",
    title: "Computer Networking Deployment Bags",
    organization: "University of Cincinnati",
    subtitle: "Computer networking, brought into the classroom, with real Cisco equipment",
    description: ["Designed and organized portable Cisco networking lab kits to replace simulated Packet Tracer exercises with hands-on configuration experience.",
      "Each deployment bag contains the routing, switching, cabling, and endpoint hardware needed for students to build, configure, and troubleshoot real network topologies."],
    technologies: ["Cisco IOS", "Project Management", "Routing & Switching"],
    featured: true,
    categories: ["infrastructure"] },
];

export const projectsForView = (view: ProjectView) =>
  projects.filter((project) =>
    view === "all" || (view === "featured" ? project.featured : project.categories.includes(view)));
