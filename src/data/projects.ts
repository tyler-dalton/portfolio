export type ProjectCategory = "infrastructure" | "development";
export type ProjectView = "featured" | "all" | ProjectCategory;

export type Project = {
  slug: string;
  number: string;
  period: string;
  title: string;
  organization?: string;
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
    technologies: ["Cisco IOS", "Project Management", "Microsoft Project"],
    featured: true,
    categories: ["infrastructure"] },
  { slug: "k8s-cluster",
    number: "03",
    period: "Ongoing",
    title: "Enterprise-grade Kubernetes Cluster",
    subtitle: "Highly available and secure Kubernetes cluster for enterprise workloads",
    description: ["Currently designing and deploying a Kubernetes cluster with intentions to mimic enterprise environments as closely as possible. Continuously evolving environment for learning how containerized systems work beyond the happy path-deploying services.",
      "Leveraging the opportunity to experiment with the side of Kubernetes that established clusters already have - the setup. Using high availability, shared storage, GitOps and modern DevOps practices as management techniques." ],
    technologies: ["Kubernetes", "DevOps", "Helm", "Argo CD"],
    featured: true,
    categories: ["infrastructure"] },
  { slug: "personal-portfolio",
    number: "04",
    period: "Ongoing",
    title: "Personal Portfolio",
    subtitle: "Personal portfolio intentionally curated over hours of work",
    description: ["A custom-built home for my projects, experience, and technical work. Designed to evolve alongside me rather than exist as a static credibility piece.",
      "Focusing on creating a maintainable architecture while leaving room for personality and experimentation."],
    technologies: ["Astro", "TypeScript", "Tailwind CSS", "GitHub Actions"],
    featured: false,
    categories: ["development"] },
  { slug: "homelab",
    number: "05",
    period: "Ongoing",
    title: "Personal Homelab",
    subtitle: "Self-hosted infrastructure built for learning and experimentation",
    description: ["A multi-node lab that give me full ownership of the infrastructure stack. Bare metal virtualizing Proxmox with a deny-all firewall approach provided by OPNsense.",
      "Built a long-term, flexible, and isolated sandbox environment for experimenting with new technologies, designing infrastructure from scratch, and solving the kinds of operational problems you don't see in guided labs."],
    technologies: ["Proxmox VE", "OPNsense", "Terraform", "Docker"],
    featured: false,
    categories: ["infrastructure"]},
  { slug: "pantheon-agents",
    number: "06",
    period: "Ongoing",
    title: "Pantheon Agentic Environment",
    subtitle: "A governed environment for autonomous agents",
    description: ["An agentic environment designed around specialized AI workers that share context, collaborate through deployed workflows, and operate against a common knowledge base rather than functioning as isolated assistants. Deployed MCP context server using RAG for agentic querying.",
      "Built to explore the harder problems behind autonomous solutions. Balancing what workflows can be completely automated with those that require human oversight. Leveraging an AI harness to provision automated workflows & agent coordination. Each agent is 100% isolated to an individual VM with strict firewall rules only allowing traffic nessacary to complete the desired tasks."],
    technologies: ["MCP", "RAG", "Hermes Agent harness", "Chroma", "VLAN segmentation"],
    featured: false,
    categories: ["infrastructure", "development"] },
  
];

export const projectsForView = (view: ProjectView) =>
  projects.filter((project) =>
    view === "all" || (view === "featured" ? project.featured : project.categories.includes(view)));
