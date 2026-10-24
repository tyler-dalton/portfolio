# AGENTS.md — tylerdalton.dev

These instructions apply to the **entire repository**. They are the operating contract for Grok and any other coding agent working on this portfolio.

**Repository:** https://github.com/tyler-dalton/portfolio  
**Production site:** https://tylerdalton.dev  
**Owner:** Tyler Dalton  
**Default branch:** `main`

## 1. Start here

Before making changes, read these files in order:

1. `AGENTS.md` (this file): rules, autonomy and delivery.
2. `docs/PROJECT_BRIEF.md`: verified architecture, routes, current state and product direction.
3. `docs/ROADMAP.md`: ordered tasks, dependencies and acceptance criteria.
4. `docs/ENGINEERING_GUIDE.md`: design, content, data and operational conventions.
5. The specific source files that own the feature you intend to change.

Do not treat this handoff as a substitute for inspecting the *current* code. The documents describe the state on **2026-10-23**; Git and the live deployment can change after that date. If a document disagrees with actual code, inspect the history and update the documentation.

## 2. Mission and product direction

Maintain and extend a **credible, fast, distinctive technical portfolio** for someone working in cybersecurity, systems administration, Kubernetes, infrastructure and automation. The primary audience is engineers, recruiters, hiring managers and collaborators.

Show *real engineering work*, explain decisions, make the content easy to navigate, and keep the author's personality. Favor restraint over decoration. It is a personal site, not an enterprise SaaS dashboard or a template gallery.

The aesthetic is intentionally clean with understated terminal/Linux touches. The dark and light themes, command palette and discoverable Matrix easter egg are **existing features to preserve**, not invitations to overhaul the whole site.

## 3. Authority and autonomy

**Work independently on:**
- Small, scoped bug fixes and refactors, semantic HTML, accessibility, responsiveness and performance.
- Finishing established page shells using *already public, verified information*.
- Automation for public GitHub data, documentation, tests and build/deployment checks.
- Improving case-study presentation without changing the factual claims.
- Creating branches, committing coherent changes and opening pull requests with verification notes.

**Require owner input before:**
- Publishing or changing biography, degrees, GPA, employment, internships, availability, dates, metrics, certifications, titles or other personal/professional claims.
- Creating a new project case study from assumptions, publishing private project information, or adding personal photos, endorsements or testimonials.
- Exposing anything sensitive, proprietary, defense-related or from classified / air-gapped environments beyond language the owner has already approved publicly.
- Changing the domain, deployment provider, accounts, DNS, secrets, security settings, legal claims, budget or public contact identity.
- Changing the site's core information architecture or undertaking a full visual redesign.
- Merging/deploying on the owner's behalf without a separately established authorization policy.

**Default:** operate autonomously in a feature branch, validate, and open a PR. Do not wait for approval on ordinary implementation details. If blocked on a factual claim, deliver the unblocked technical work and identify the *specific* question in the PR. Never fabricate an answer. A public repository is not a safe place for private handoff notes.

## 4. Stack and commands

- **Astro 7**, TypeScript where useful, **Tailwind CSS 4** via Vite, standard HTML/CSS/vanilla JavaScript, MDX content collections.
- Node.js **22.12.0 or newer** and npm (use the checked-in lockfile).
- Static Astro output; there is no server adapter or application backend in the inspected repository.
- Integrations: `@astrojs/mdx`, `@astrojs/sitemap`, `rehype-mermaid`.

Common commands:

```bash
npm ci
npm run dev
npm run build
npm run preview
```

There is currently **no defined test, lint or typecheck npm script**. Do not claim one passed. Run `npm run build` and perform manual/browser checks; introduce focused checks when a change justifies them. If an agent environment specifically supports `astro dev --background` / `astro dev status` / `astro dev logs` / `astro dev stop`, those are optional server-management helpers, not a substitute for the npm scripts.

## 5. Map of the codebase

| Concern | Source of truth |
| --- | --- |
| Site routes | `src/pages/`; Astro file-based routing |
| Shared page shell, metadata and theme initialization | `src/layouts/layout.astro` |
| Primary navigation | `src/data/navigation.ts` and `src/components/header.astro` |
| Command palette | `src/components/command-palette.astro` |
| Styling and tokens | `src/styles/global.css`, `theme.css`, `dark.css`, `light.css`, `matrix.css` |
| Matrix easter egg | `src/scripts/matrix-mode.ts` and `matrix-rain.ts` |
| Project schema | `src/content.config.ts` |
| Project entries / case studies | `src/content/projects/*.mdx` |
| Project filters and order | `src/lib/projects.ts` |
| Cards, lists and featured work | `src/components/projects/` |
| Web resume data | `src/data/resume.ts` |
| Downloadable resume | `public/media/tyler-dalton-resume.pdf` |
| Digital business card and vCard | `src/pages/card.astro`, `src/components/business-card.astro`, `public/media/tyler-dalton.vcf` |
| GitHub graph generation | `scripts/contributions.mjs` and `.github/workflows/update-contributions.yml` |
| Generated graph | `public/github/contributions.svg` |
| Historic, non-authoritative site | `deprecated/` |

**Avoid duplicate sources of truth.** Edit project metadata in MDX, not by hardcoding new cards; update `src/data/navigation.ts` and matching command-palette entries when routes change. Do not migrate old code from `deprecated/` unless a specific feature warrants it.

## 6. Product and implementation rules

1. **Keep it focused.** Change the smallest coherent set of files. No new frontend framework, backend, database, heavyweight animation library or dependency without a demonstrated requirement.
2. **Preserve the identity.** Clean typography, restrained blue accents, readable spacing, practical content, occasional terminal details. No random icons, gratuitous gradients, animated dashboards, badge overload or generic AI marketing copy.
3. **Respect all themes.** Verify dark, light and Matrix modes. Theme tokens are CSS custom properties, not page-specific hardcoded color systems. Honor reduced-motion preferences.
4. **Keep navigation accessible.** Test desktop dropdowns, mobile menu and keyboard focus. Preserve `Ctrl/⌘+K` behavior, dialog focus management and navigation commands.
5. **Be truthful.** Claims must trace to existing published content, owner confirmation or verifiable public repositories. Preserve uncertainty. Do not interpret a GitHub commit as a verified project outcome.
6. **Keep Activity low-maintenance.** Prefer reproducible build-time data from public sources to manual, rapidly stale status text. Exclude bot-generated graph commits from a human-facing changelog.
7. **Do not leak tokens.** GitHub API tokens belong in GitHub Actions secrets / environment variables, never client-side code, committed files or browser fetch URLs containing credentials.
8. **Content first, visual effects second.** All interactive features must degrade gracefully when JavaScript is unavailable or data refresh fails.
9. **No invented metrics.** Do not embellish Panoptes, classified work or personal infrastructure. Existing public claims can be retained without extrapolating them.

## 7. Agent execution loop

For each work session:

1. `git status`; check `main`, open PRs, current roadmap and latest meaningful changes (ignore routine graph-generated commits when judging product progress).
2. Select the **highest-priority unblocked** roadmap item. If it is too large, break it into one useful vertical slice with clear acceptance criteria.
3. Inspect dependencies, keep the style and existing contracts, implement the slice and update related docs.
4. Validate with `npm run build`, preview the affected routes, and check desktop/mobile plus the three themes and relevant interactions.
5. Open a scoped PR. State the problem, solution, affected routes, what was tested, screenshots for visual work, known limitations, and any exact owner decision needed.
6. Update `docs/ROADMAP.md` status/next step and `docs/PROJECT_BRIEF.md` when the actual system changes. Do not mark work done before it is merged.
7. Continue with the next unblocked task when authorized by the agent's working environment. Do not force unrelated changes into the same PR.

Suggested commit style: `feat(area): ...`, `fix(area): ...`, `refactor(area): ...`, `docs: ...`, `chore: ...`.

## 8. Definition of done

A change is done only when:

- It solves the stated problem without breaking unrelated routes.
- The production build succeeds; report test limitations plainly.
- It works at narrow mobile and desktop widths and across relevant themes.
- Keyboard navigation, labels, focus, semantic headings and reduced-motion behavior remain sound.
- Internal/external links, metadata, canonical URLs, images and responsive layouts are checked where affected.
- The PR includes the actual evidence of verification.
- Documentation and backlog are consistent with the changed implementation.
- New public personal/professional assertions have been approved, not guessed.

**Immediate next work:** follow `docs/ROADMAP.md`. Do not replace the existing site with a new design or generate fictitious project content merely to populate empty views.
