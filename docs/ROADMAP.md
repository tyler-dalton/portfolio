# Portfolio execution roadmap

**Planning baseline:** 2026-10-23. This is a prioritized working queue, not a declaration that the owner approved every proposed copy change. Reconcile with current Git state and add PR/issue links as work begins.

## How to use this queue
Select the highest-priority **unblocked** task, implement one reviewable slice, validate and open a PR. Update the status and links when work changes. Never mark complete merely because a PR exists. Separate coding tasks from public-content approvals.

Statuses: **Ready** = implement without new facts; **Needs facts** = technical skeleton may be prepared but do not publish invented content; **Investigation** = verify the present behavior before deciding scope.

| Priority | Task | Status | Owner decision? |
| --- | --- | --- | --- |
| P0 | Audit content consistency and broken paths | Ready | Only for changes to facts |
| P0 | Keep homepage GitHub handle and arrow together ([#6](https://github.com/tyler-dalton/portfolio/issues/6)) | Merged ([#36](https://github.com/tyler-dalton/portfolio/pull/36)) | No |
| P0 | Finish Contact route | Ready | No for already-public methods |
| P0 | Match the mobile browser top bar to the active theme ([#5](https://github.com/tyler-dalton/portfolio/issues/5)) | In review | No |
| P1 | Make GitHub activity page meaningfully useful | In review | No for verified public GitHub data |
| P1 | Create reusable Activity/Timeline/Changelog content model ([#10](https://github.com/tyler-dalton/portfolio/issues/10), [#11](https://github.com/tyler-dalton/portfolio/issues/11)) | In review | Confirm personal narrative for timeline |
| P1 | Publish additional MDX project case studies | Needs facts | Yes |
| P1 | Fix stale/contradictory career and availability copy | Needs facts | Yes |
| P2 | Finish About / Now and Personal pages | Needs facts | Yes |
| P2 | Curated changelog experience ([#11](https://github.com/tyler-dalton/portfolio/issues/11)) | In review | Confirm whether notable changes should be public |
| P2 | Accessibility, mobile and theme regression coverage | Ready | No |
| P3 | Automated quality checks and low-maintenance content updates ([#14](https://github.com/tyler-dalton/portfolio/issues/14)) | In review | No for non-destructive workflow changes |

## P0.1 — Content, link and accuracy audit
**Status:** In review. No career copy was rewritten. Findings below are the owner questions for P1.4.

**Verified agreements (left unchanged)**
- Email `tldalton54@gmail.com` matches the homepage, footer, card, web resume, vCard, and PDF.
- GitHub profile, LinkedIn profile, homelab repository, fishnet.replit.app, and the Panoptes LinkedIn post respond successfully.
- School, "Junior", graduation May 2029, and GPA 4.00 appear on both the web resume and the PDF.
- Live image paths under `public/` exist. Built routes match `src/pages/`.

**Do not publish until the owner picks a canonical wording**
- Degree line: homepage and card say "Cybersecurity + Systems Administration". Layout metadata says "Cybersecurity and Systems Administration". The terminal profile says "Cyber/Electronic Operations & Warfare + Network/Systems Administration", while its major row says "Cybersecurity + Network/Systems Administration". The web resume and PDF say two B.S. degrees, Cybersecurity and Network/Systems Administration.
- Awetomaton title: web resume "DevOps Engineer Intern"; PDF "Platform Engineer Intern"; Panoptes role "Platform Engineer".
- Teaching assistant end date: web resume "August 2026 – December 2026"; PDF "August 2026 – Present".
- Availability seasons match (Spring 2027 and Summer 2027) but the sentences differ. Confirm the line is still the right public position.
- The PDF name line includes a middle initial the site does not use, and it still prints `homepages.uc.edu/~daltonty/portfolio/`, which now redirects to a UC maintenance page.
- `https://github.com/tyler-dalton/kubernetes-ha-cluster` returns 404 and is not visible to the owner account either. The web resume still links it. The PDF links the GitHub profile instead. Do not guess a replacement URL.
- The PDF and vCard contain a cell number that the visible site does not show. Leave it out of new pages unless the owner asks to display it. The vCard `TITLE` and `ORG` fields are empty.
- Public repos `deployment-bags` and `dotfiles` exist and are not linked from the current site. They are candidates only, not approval to write case studies.

**Safe fix in this pass:** external resume links now use `rel="noopener noreferrer"`.

**Why:** Existing copy is distributed across homepage, terminal, resume data, project MDX, business card and downloadable assets. Inconsistent claims damage credibility.

**Steps**
- Inventory strings for degree names, role, school, graduation, internship dates, availability, current work and email.
- Specifically review `src/components/terminal.astro`, `src/data/resume.ts`, `src/pages/index.astro`, `src/components/business-card.astro`, the PDF and VCF.
- Note existing differences (e.g., terminal text combines "Cyber/Electronic Operations & Warfare" with "Network/Systems Administration" while other sections say "Cybersecurity + Systems Administration").
- Identify stale availability language; the web resume currently says "Available Spring 2027 & Summer 2027" and terminal says "Spring & Summer 2027." **Do not change either based on guesses**—confirm current commitments and preferred public positioning.
- Check links, image 404s, route metadata, output sitemap, and CTA targets. Create a short audit section in the PR.

**Done when:** a single issue/PR documents all inconsistencies; safe technical fixes are made; undecidable facts are presented as exact questions rather than silently rewritten.

## P0.1c — Mobile theme color
**Status:** In review. The shell now sets `theme-color` from the active theme before first paint and again whenever `data-theme` changes, including Matrix. `viewport-fit=cover` lets that background reach the display edge, and the header pads for `safe-area-inset-top`. A real iPhone Safari check is still required; desktop Chromium can only confirm the meta tag.
## P0.1b — Homepage GitHub handle wrap
**Status:** Merged in #36. Narrow viewports were splitting `↗` onto its own line beside the GitHub Contributions heading. The handle and arrow now stay on one line, and the pair stacks under the heading below the `sm` breakpoint.

## P0.2 — Replace Contact placeholder
**Status:** In review. `/contact` lists the public email, GitHub, LinkedIn, `/card`, and vCard. No form and no phone number. The homepage "Contact me" button now opens this page. The footer email remains a `mailto:` link.

**Target:** `src/pages/contact.astro`.

**Steps:** Use existing publicly displayed email, GitHub, LinkedIn, digital card and vCard; design a focused contacts page with semantically labeled links and a useful call-to-action. Prefer mailto links over adding an unneeded server-side form or third-party email service.

**Done when:** `/contact` no longer shows `UnderConstruction`; works on mobile and all themes; relevant internal routes and keyboard controls work; no made-up address or phone number.

## P1.1 — Expand GitHub activity
**Status:** In review. `/activity/github` is an analytics page: 30-day contribution figures, month and weekday bars, language share, a commit rail, the contribution graph, and up to six recently active public repositories. Numbers are recomputed from `src/data/github-analytics.json`. Contribution counts and commit counts stay labeled as different units. Streaks use the full graph, with a one-day grace when the latest calendar day is still empty. The homepage uses the same graph component. Do not merge until the owner has reviewed the rendered pages.

**Target:** `src/pages/activity/github.astro`, plus small reusable components if needed.

**Current baseline:** contribution SVG graph and GitHub profile link. Homepage has a richer hover/focus tooltip enhancement than this page.

**Steps:** Improve explanation of the graph and discoverability of recent real work using public data, preferably reproducible at build time with safe fallbacks. Consider links to selected real repos or public merged PRs *after verification*. Keep APIs authenticated only on server/CI if necessary; avoid publicly embedding a token or creating runtime rate-limit dependency. Keep graph display accessible.

**Done when:** provides more value than merely repeating the homepage graph, is resilient if GitHub fails and does not treat every commit as substantive engineering activity.

## P1.2 — Timeline and changelog data foundation
**Status:** In review. `src/data/activity.ts` holds typed, dated entries. The timeline renders those entries on a vertical spine, grouped by year: the published Panoptes case study (May 18 – August 14, 2026) and the resume's personal infrastructure lab (December 2025 – Present). It does not pick between disagreeing job titles, and it does not repeat other resume lines whose titles or dates still disagree. The changelog still uses `src/components/dated-entries.astro`. It lists visitor-visible portfolio changes and skips daily contribution-graph commits. Month-only dates sort as the first of that month; the visible label is the claim. Do not merge the timeline visual until the owner has reviewed it.

**Targets:** `src/pages/activity/timeline.astro`, `src/pages/activity/changelog.astro`.

**Steps:** Define a small, typed data model (TypeScript data or content collection) and present meaningful entries with date, title, description and optional verified link. Choose source based on requirements; do not invent entries to fill the page. Start with verifiable site version/change history. Separate *portfolio releases* from *career/project milestones*.

**Done when:** each page can render meaningful validated entries, handles zero entries elegantly, and updates do not require custom duplicated markup.

## P1.3 — Add real project case studies
**Targets:** `src/content/projects/*.mdx`; use `src/content/projects/panoptes.mdx` as the schema/layout reference.

**Candidate order** (not publishing authorization):
1. Homelab / infrastructure network, with sanitized public-safe topology and genuine technical choices.
2. Kubernetes high-availability or GitOps cluster, clearly separated into shipped and planned milestones.
3. Linux tooling/dotfiles/rice as a focused technical case study.
4. Relevant networking lab/deployment bag work, with safety and authorization review.

**Steps:** Verify public repo artifacts and owner-supplied facts; collect 1–2 concrete design tradeoffs, outcomes, stack and accurate dates; add truthful MDX with a suitable media set. Use `status: building` when appropriate. Give the best three case studies unique `show.home.order` values 1–3; do not fill every slot just to meet a quota. Keep categories consistent with the content schema.

**Done when:** each published project reads like engineering evidence rather than a feature list, builds successfully, appears in intended filters, and its claims have evidence/owner approval.

## P1.4 — Career and resume consistency
**Targets:** `src/data/resume.ts`, `public/media/tyler-dalton-resume.pdf`, homepage/terminal/other public bios.

**Steps:** Prepare a list of proposed edits; ask the owner to confirm current public degree wording, graduation, availability, positions and upcoming internships. Coordinate changes across all surfaces; ensure PDF is refreshed *from an owner-approved source* and do not mislabel availability.

**Done when:** web/PDF/card/home metadata and bios agree, with no unsupported claims.

## P2.1 — About / Now and Personal
**Targets:** `src/pages/about/now.astro`, `src/pages/about/personal.astro`.

**Now:** concise snapshot of what the owner is actually building/studying/learning; dated or easily updated, not filler.  
**Personal:** grounded voice and interests beyond career; no generic "I love technology" narrative, invasive biography or unsolicited disclosures.

**Done when:** both pages replace placeholders using owner-approved text and preserve site tone.

## P2.2 — Portfolio changelog
**Status:** In review. The log is the typed changelog in P1.2. Add an object with an id, ISO date, visible label, title, and short details. Do not list routine `chore(git contributions)` SVG updates.

Create a human-curated log of meaningful releases. Source from verified product commits/tags when useful; filter out routine `chore(git contributions)` SVG updates, dependency churn and noise. Do not assert an automated change was reviewed unless it was.

**Done when:** visitors can tell what substantively improved and when, and maintainers can update it in minutes.

## P2.3 — Quality, accessibility, polish
Check 320px, 375px, tablet and desktop; light/dark/Matrix; mobile menu; hover/focus dropdowns; command palette Ctrl/⌘+K, arrows/Enter/Escape, return focus; reduced-motion; card sharing; SVG fallback; non-JS/failed network behavior; resume details; PDF download; image alt text, social previews and contrast.

**Done when:** regressions are fixed and checks are documented in PRs.

## P3 — Developer experience and automation
**Status:** In review. `npm run check` runs the analytics tests, builds the site, and runs `scripts/smoke.mjs` against `dist`. The script checks key routes, the theme toggle, the command palette, Matrix enter and exit, the mobile menu, and homepage overflow at 320px. `.github/workflows/ci.yml` runs that check on pull requests and pushes to `main`. The contribution-graph workflow now also writes the analytics snapshot and runs its tests. It still uses the Actions `GITHUB_TOKEN` only on the runner.

Investigate `astro check` / typechecking, focused smoke tests (Playwright is already a dependency), link checking and PR CI. Prefer a very small verification suite over a large test framework. Protect the graph workflow from churn or bad commits but do not break its scheduled job.

**Done when:** PR authors can run documented deterministic checks and CI does not require private services.

## P3.1 — Contribution graph workflow
**Status:** In review. `scripts/contributions.mjs` still fails closed when the token, HTTP call, GraphQL payload, or calendar is missing, and it now also refuses a calendar with no weeks. The scheduled workflow serializes runs, refreshes the SVG, writes `src/data/github-analytics.json`, runs the analytics tests, and refuses an SVG without dated cells or a snapshot without contribution days. The public graph file remains the no-JavaScript fallback. The workflow still uses the Actions `GITHUB_TOKEN` only on the runner.

## First three autonomous PRs (suggested)
1. **Contact page** using only already-public contact links.
2. **Activity GitHub enhancement** with verified, gracefully-degraded public links/data.
3. **Small quality baseline** (build + route/interaction checks), while collecting owner answers required for future case studies and public bio edits.

## Questions to bundle for owner, not block routine work on
- Which professional title and exact degree wording should be used across all public surfaces?
- What should 2027 availability say after accepted commitments?
- Which homelab/Kubernetes/dotfiles repos, diagrams, screenshots and details are approved for publication?
- Which life details, if any, are desired on Personal and Now?
- What constitutes a notable portfolio release for Changelog?
