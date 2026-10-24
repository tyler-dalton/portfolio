# Engineering and content guide

This is implementation guidance for ongoing contributors. The codebase overrides dated descriptions; the owner overrides assumptions about personal/professional facts.

## Local development and release
```bash
git switch main
git pull --ff-only
npm ci
npm run dev
npm run build
npm run preview
```
Node >=22.12 and npm. Use a feature branch; never assume the deployment integration is correct without checking Cloudflare Pages status. `npm run build` is the currently defined verification command. Do not invent lint/test scripts or claim nonexistent checks passed.

## Astro component conventions
- Prefer Astro components and static output. Use a small, localized browser `<script>` only for interactions.
- Keep the page scaffold in `src/layouts/layout.astro`. Use its metadata props: `title`, `socialTitle`, `description`, `image`, `imageAlt`, and `showChrome`.
- Give each route a meaningful unique title/description and a clear `h1`.
- Add navigation entries in `src/data/navigation.ts`; audit command-palette commands in `src/components/command-palette.astro` when routes change.
- Reuse `SectionHub`, existing project components, and layout utilities; don't introduce a global UI component system for one page.
- Preserve the no-chrome `/card` view, download link and native share/copy fallback.
- No client-side exposure of GitHub tokens or personal data beyond published contact information.

## Design system and tone
Default dark palette uses charcoal/slate with blue accent; light palette uses the inverse; Matrix is the deliberate green easter egg. The primary font is modern sans-serif; use monospace for dates, metadata, technical labels and terminal UI.

CSS comes from `src/styles/global.css` (Tailwind + theme/dark/light/matrix imports). Use tokens such as `var(--page-background)`, `var(--page-foreground)`, `var(--page-secondary)`, `var(--page-muted)`, `var(--page-accent)`, `var(--page-border)`, and terminal variables. Follow the site's existing max-width ~1100px content rhythm.

**Do:** confident headings, practical summaries, whitespace, clear dividers, subtle hover/focus feedback, an occasional terminal detail, real measurements and diagrams where useful.  
**Do not:** gratuitous icon stacks, KPI dashboards for a personal bio, huge glowing cards, generic "passionate about leveraging cutting-edge solutions" copy, cosmetic badges on every element, fake telemetry or invented achievements.

All features must work across light/dark/Matrix. Prefer semantic HTML and user motion preferences; never make animations necessary for comprehension.

## Projects data contract
Collection definition: `src/content.config.ts`; instances: `src/content/projects/*.mdx`; rendering/filtering: `src/lib/projects.ts`, `src/components/projects/`, `src/pages/work/projects/[slug].astro`.

Required metadata: `title`, `period`, `start` (date), `status` in [completed, building, archived, maintained], `categories` (one or more of infrastructure/development/cybersecurity/misc), nonempty `technologies`, `summary`. Optional fields: `subtitle`, `organization`, `role`, `location`, `end`, up to three stats, links, hero/gallery media and show flags.

`show.home.order` is an integer 1–3 and **must be unique across homepage-featured projects**; `getHomepageProjects()` throws otherwise. `show.projectFeature` controls the Featured listing independently; `show.resume` and `show.timeline` are available flags but should not be presumed implemented as automated feeds. Use only verified numbers in stats.

Case-study outline: **Overview → Challenge/constraints → Architecture/tradeoffs → Implementation → Validation/results → Lessons/next steps**, adjusted to the story. Describe *your actual role* and what changed. A planned cluster design is not a deployed production result. When screenshots/architecture diagrams expose sensitive endpoints or network detail, sanitize and obtain approval.

## Resume and content consistency
The web resume is `src/data/resume.ts`; downloadable PDF is `public/media/tyler-dalton-resume.pdf`. These are **not automatically synchronized**. Any real update must reconcile both (or explicitly flag the PDF as pending owner approval).

Related first-person identity appears in homepage, terminal, card, footer, metadata and VCF; check all for consistency. Do not quietly modify degree naming, dates, GPA, availability or employers. Git history is technical evidence, not permission to disclose private career information.

## Activity / automation
`scripts/contributions.mjs` calls GitHub GraphQL using `GH_TOKEN` and optional `GITHUB_USERNAME`; it emits `public/github/contributions.svg`. The scheduled workflow `.github/workflows/update-contributions.yml` runs daily and commits changed SVGs.

Do not replace the current SVG fallback with an unavailable live widget. The homepage fetches and replaces the graph with inline SVG to provide pointer/keyboard tooltips; ensure unenhanced rendering survives any failure. The separate GitHub route currently shows an image and link only. A future activity feed should be simple and cacheable, with explicit distinction between public facts and editorial narrative.

For changelog, identify substantial commits/releases; filter out daily SVG graph commits. For timeline, require verified milestones and source links where appropriate.

## Accessibility / interaction checklist
- Keyboard: reach every interactive control, reveal nav dropdowns, operate command palette, return focus after dialogs.
- Mobile: no horizontal overflow of the page; intentional horizontal scrolling for dense graph is acceptable if understandable.
- Contrast and focus-visible states in all themes.
- Respect `prefers-reduced-motion`, especially Matrix and terminal animations.
- Images have meaningful alt text; decorative assets are silent.
- CTA links resolve; email/VCF/PDF downloads work; external links use safe `rel`.
- Avoid layout shifts, unnecessary network requests and large new client dependencies.

## Verification rubric for PRs
Report exactly what was done: npm install/build, routes previewed, widths/themes checked, keyboard interactions exercised and failures/limitations. Supply before/after screenshots for visual changes. Compare against production where helpful, but remember production may lag `main`.

## Security / privacy
No tokens, session values, credentials, API keys, secrets, private personal contact data, internal system IP addresses, student records or restricted employer details in code or PRs. Do not duplicate private project docs into the public repo. Existing public content does not permit extrapolation about classified deployments. Any contact form needs an actual secure handling and anti-spam plan; prefer mailto for the current scope.

## Documentation discipline
Update `docs/PROJECT_BRIEF.md` when architecture/route capabilities change; update `docs/ROADMAP.md` as tasks are proposed/implemented/merged. Ensure `AGENTS.md` remains short enough to orient future coding agents, with deeper specifics here. Every PR must explain what remains unresolved.
