export type NavigationChild = { label: string; href: string };
export type NavigationItem = { label: string; href: string; children?: NavigationChild[] };

/** The site's information architecture. All navigation should derive from this file. */
export const navigation: NavigationItem[] = [

  { label: "Home", href: "/" },

  { label: "Work", href: "/work", children: [
    { label: "Projects", href: "/work/projects" },
    { label: "Resume", href: "/work/resume" },] },

  { label: "Activity", href: "/activity", children: [
    { label: "Overview", href: "/activity" },
    { label: "GitHub", href: "/activity/github" },
    { label: "Timeline", href: "/activity/timeline" },
    { label: "Changelog", href: "/activity/changelog" },] },

  { label: "About", href: "/about", children: [
    { label: "Personal", href: "/about/personal" },
    { label: "Now", href: "/about/now" },] },

  { label: "Contact", href: "/contact" },];

export const isNavigationActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
