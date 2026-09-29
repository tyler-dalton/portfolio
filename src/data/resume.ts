export type ResumeLink = { label: string; href: string };
export type ResumeEntry = { organization: string; location?: string; role: string; dates?: string; details?: string[]; bullets?: string[]; link?: ResumeLink };
export type ResumeSection = { title: string; entries?: ResumeEntry[]; skills?: { label: string; values: string }[]; note?: string; open?: boolean };

// Update this file to refresh the web resume. Keep the PDF at
// public/media/tyler-dalton-resume.pdf in sync with these entries.
export const resume = {
  contact: { email: "tldalton54@gmail.com", links: [
    { label: "github.com/tyler-dalton", href: "https://github.com/tyler-dalton" },
    { label: "linkedin.com/in/daltontyler", href: "https://linkedin.com/in/daltontyler/" },
  ] satisfies ResumeLink[] },
  pdfHref: "/media/tyler-dalton-resume.pdf",
  sections: [
    { title: "Education", entries: [{ organization: "University of Cincinnati | School of Information Technology", location: "Cincinnati, Ohio", role: "B.S. Cybersecurity + B.S. Network/Systems Administration", details: ["(Junior) – Graduation: May 2029", "GPA: 4.00"], link: { label: "Relevant Coursework →", href: "/courses" } }] },
    { title: "Work Experience", entries: [
      { organization: "Awetomaton Ltd.", location: "Beavercreek, Ohio", role: "DevOps Engineer Intern", dates: "May 2026 – August 2026", bullets: ["Authored ~97% of the project repository, developing a production-grade Kubernetes observability Helm chart.", "Deployed into a classified, air-gapped environment at Wright-Patterson Air Force Base for RKE2/OpenShift.", "Engineered a portable stack integrating Prometheus, Grafana, custom dashboards, exporters, and deployment runbooks."] },
      { organization: "SoIT Teaching Assistant", location: "Cincinnati, Ohio", role: "Computer Networking & Fundamentals of IT", dates: "August 2026 – December 2026", bullets: ["Designed networking labs using enterprise switching, routing, and physical infrastructure.", "Built standardized, resettable environments for real-world network deployments.", "Mentored 143 students through hands-on instruction, individualized support, and 20 weekly office hours."] },
    ] },
    { title: "Applied Projects", entries: [
      { organization: "Personal Infrastructure Lab", location: "Cincinnati, Ohio", role: "Owner/Operator", dates: "December 2025 – Present", link: { label: "GitHub Repository", href: "https://github.com/tyler-dalton/homelab-infra" }, bullets: ["Host monitoring clients including Grafana and Prometheus for infrastructure scrapes, uptime, and observability.", "Created recursive local DNS with network-wide ad blocking and a globally accessible self-hosted VPN.", "Configured a deny-all OPNsense firewall for traffic control and inter-VLAN routing across a three-node cluster."] },
      { organization: "Kubernetes Enterprise HA Cluster", location: "Cincinnati, Ohio", role: "Owner/Operator", dates: "May 2026 – Present", link: { label: "GitHub Repository", href: "https://github.com/tyler-dalton/kubernetes-ha-cluster" }, bullets: ["Architecting and provisioning a five-node Kubernetes cluster to simulate enterprise production patterns.", "Deploying infrastructure through GitOps with Helm, Kustomize, and CI/CD pipelines.", "Building operational maturity with multi-node scheduling, role-based workloads, and documented runbooks."] },
      { organization: "IT Fundamentals: Modern Problems With Modern Solutions", location: "Cincinnati, Ohio", role: "Project Manager", dates: "August 2025 – December 2025", link: { label: "fishnet.replit.app", href: "https://fishnet.replit.app/" }, bullets: ["Managed a five-student team designing and presenting a phishing-awareness training platform.", "Built collaboration habits that resolved conflicts and kept the team focused and productive.", "Directed an investor-style pitch that earned first place in class rankings."] },
    ] },
    { title: "Skills", skills: [
      { label: "Languages & Templating", values: "YAML, Mustache, Go Templates, Bash, Python, Java, JavaScript, HTML, CSS" }, { label: "Infrastructure & Development", values: "Red Hat OpenShift, RKE2 Kubernetes, Helm, Kustomize, ArgoCD, CI/CD, Terraform, AWS" }, { label: "Databases & Querying", values: "SQL Server, PromQL, SQLite" }, { label: "Linux", values: "Ubuntu, RHEL, Kali, Proxmox, Alma, Fedora, Arch, Mint" }, { label: "Productivity", values: "Excel, Project, Word, PowerPoint, Access, Git" }, { label: "Certifications", values: "Microsoft Office Specialist" },
    ] },
    { title: "Leadership & Extracurriculars", entries: [
      { organization: "Cyber@UC Cybersecurity Club", location: "Cincinnati, Ohio", role: "Cloud Infrastructure Engineer", dates: "January 2026 – Present", bullets: ["Develop and maintain Terraform infrastructure to provision CTF servers, databases, and other services.", "Monitor more than 21 virtual machines for member sandbox access and hands-on skill development.", "Participate in bi-weekly hacking labs to understand and execute internal threat simulations on Linux machines."] },
      { organization: "Mason Youth Football Organization", location: "Mason, Ohio", role: "Offensive Coordinator", dates: "August 2023 – Present", bullets: ["Manage an offense of more than 25 personnel, scout opponents, and develop targeted playbooks.", "Observe defensive tendencies and make real-time game-plan adjustments based on available information."] },
    ] },
    { title: "Availability", note: "Available Spring 2027 & Summer 2027" },
  ] satisfies ResumeSection[],
};
