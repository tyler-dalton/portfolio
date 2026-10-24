# Activity — visual analytics design brief

**Owner-directed correction, 2026-10-23.** This document supersedes the old "list public repositories" interpretation of activity. The analytics page must be visually rich, measured and compelling, not a repository directory.

**Epic:** [#45](https://github.com/tyler-dalton/portfolio/issues/45). Implementation issues [#46](https://github.com/tyler-dalton/portfolio/issues/46)–[#51](https://github.com/tyler-dalton/portfolio/issues/51).

## Intent

**Headline:** A look at what I'm building

The page should show real engineering momentum through a deliberately designed sequence of statistics, comparative charts and chronological detail. The visitor should understand what is happening, how activity has changed and which work is active **without needing to read paragraphs**.

The owner wants a high-end custom frontend, not a GitHub API response formatted into cards, a pile of icons, or a generated SaaS admin dashboard.

## Page architecture

| Route | Role |
| --- | --- |
| `/activity` | Compelling activity **overview** with a compact analytics snapshot, not a generic navigation tile hub; route clearly to full GitHub view/timeline/changelog |
| `/activity/github` | Full GitHub **analytics** experience, visual sections described below |
| `/activity/timeline` | **Career / project milestones** as a real vertical timeline with connected nodes |
| `/activity/changelog` | Separate factual **portfolio release** log; don't conflate releases with activity or career timeline |

Keep navigation routes stable. The full dashboard lives at `/activity/github` unless the owner explicitly chooses to make `/activity` the primary full dashboard. Share components and data rather than duplicating the page.

## Required GitHub dashboard visual sequence

### 01 — Title and context
"A look at what I'm building" in confident typography, with at most one short descriptive sentence. Avoid paragraphs about data methodology at the very top. Put source caveats in small, accurate captions.

### 02 — LAST 30 DAYS
Five key numbers:
- **Contributions** (GitHub profile contribution count in rolling 30-day calendar, not automatically commits).
- **Active repos** (number of public repos with qualifying authored commits in window).
- **Active days** (distinct days with at least one GitHub-counted contribution).
- **Longest streak** (consecutive days with contributions; specify if 30-day or one-year period).
- **Current streak** (allow today/yesterday logic to avoid prematurely treating a day in progress as a broken streak).

Desktop: 3 + 2 typography-led metric layout; no need for giant bordered cards. Mobile: adapt to two columns with coherent alignment and one wider cell if needed. Use tabular numerals, clean labels and generous breathing room. No filler subtext.

### 03 — ACTIVITY BY MONTH
Twelve chronological month rows and **horizontal, proportional bars** against a shared maximum. Date label on left, bar in center, exact value at right. Month and year legible when the range crosses January. Label unit: `commits` if audited authored-commit series, otherwise `contributions` if using contribution calendar. A 0-value row shows zero, not a fake minimum bar.

### 04 — ACTIVITY BY DAY
Monday–Sunday row chart with comparable-length bars, same max-scale logic. Set and disclose window (e.g. trailing 90 days). Say whether values are commits or contributions. This shows work habits, not a calendar-day forecast.

### 05 — LANGUAGES
Compact ranked visual breakdown of actual language shares: per-language percentages with a slim bar or single segmented strip and clear textual legend. Source `GET /repos/{owner}/{repo}/languages` reports *bytes classified by language*, so this represents **share of code** in a defined selected-public-repo cohort—not time spent, skill level or commit percentages. Show top languages and `Other` if needed. Avoid misleading tiny slices.

### 06 — RECENT ACTIVITY
An actual vertical spine with small nodes, date labels and daily verified **commit totals** (or explicitly named daily contributions if only available). Keep concise, scannable and human. Don't render verbose commit message feeds or repeated repo cards. Differentiate this activity event rail from the professional milestones route.

### 07 — CONTRIBUTION GRAPH
Reuse the existing GitHub year heatmap and fallback; add large-but-integrated `N contributions this year` summary (using the exact calendar interval indicated by GitHub data, not assuming January-to-December if it's a rolling year). Preserve keyboard and touch usability. Graph color stays within site palette and Matrix variant. Take care of horizontal scroll affordance on iPhone.

### 08 — RECENTLY ACTIVE
Short ranked selection of public repos. **Each row is a comparison, not a marketing card**:
- Name as link
- Proportional horizontal bar scaled against the maximum repo commit total in the same trailing interval
- Exact count appended/adjacent to bar (`N commits` or precisely labeled alternate measure)
- 1–3 actually detected languages, separated by understated dots
- `Last active Oct 23`, based on the latest qualifying event, not just a generic push timestamp when claiming personal activity.
Include only relevant public repos and transparent lookback. Handle sparse data elegantly.

## Timeline route: real chronology
`/activity/timeline` must have a visible connecting vertical rule and circular nodes with aligned time labels, milestone titles and short factual descriptions. Group by year when useful. The current `src/components/dated-entries.astro` ordinary bordered card list **does not satisfy** this. Keep milestones in `src/data/activity.ts` until a genuine content model is needed; do not invent items. If a shared renderer must support two visuals, add deliberate `timeline` and `changelog` variants, not a brittle CSS override.

## Visual direction
- Existing design system: slate/dark and light surfaces, blue accent, Matrix green as opt-in third theme.
- Modern editorial / developer instrumentation quality: high signal density without congestion. Strong number hierarchy, short section headings, proportional visuals, subtle rules, measured whitespace.
- Responsive layouts should feel composed at 320, 375, 390, 768 and 1440px, not just technically fit.
- Prefer Astro + SVG/CSS bars and native HTML; no heavy chart framework unless a concrete limitation justifies it.
- Consistent bar height, baseline, numeric alignment, scale and spacing across comparable chart rows.
- Use meaningful motion sparingly, respect reduced motion and provide visible focus states.
- Avoid fake telemetry, random icons, glow/gradient walls, vanity charts and explanatory microcopy on every element.
- Present missing-data states honestly, but don't let caveats dominate the UI.

## Data contracts and methodology

**The current source is insufficient.** `src/lib/github-repos.ts` only records primary repo language and `pushedAt`; `scripts/contributions.mjs` writes SVG only. Implement [#46](https://github.com/tyler-dalton/portfolio/issues/46) **before** shipping numerical charts.

Use a validated, generated static analytics snapshot with fields for `generatedAt`, `windowStart`, `windowEnd`, `timezone`, `source`, `scope`, `lastSuccessfulRefresh` and explicit units. All numbers displayed must derive from the same documented dataset and appropriate scopes.

- GitHub profile calendar **contributions** include activity types beyond simple commits; do not relabel the calendar as "commits."
- Exact commit metrics require a defined query scope (author identity, public repo set, default branch vs all reachable commits, bot exclusions, UTC window and pagination). If GitHub cannot provide the metric faithfully, use a clear contribution-based alternative. Do not make numbers up.
- "Active repo" cannot mean solely "repo pushed recently," since other authors or bots may push.
- Language percentages use **language-byte weights**, not count of repos whose primary language is X.
- A profile contribution count may include private contributions (without disclosing private repo identities); don't pretend totals reconcile with only public repo commits.
- Separate manual authored activity from scheduled SVG generator commits. Document whether GitHub's own contribution total includes them; do not quietly change its semantics.
- Zero-data, partial-data, rate-limit and stale-data states must remain accurate; never substitute invented numbers just to fill bars.

**Tests:** rolling-date boundaries, leap days/month ends, weekday index, active-day and streak math, normalization, percent rounding, per-repo sorting, sparse language data, zero values, bot commits and missing API fields.

## Review gates

1. Before implementation: a considered wireframe (text sketch, Figma, or code prototype) spelling out the visual hierarchy and layout for desktop/mobile.
2. Before merging: screenshot evidence from the actual running page at desktop and narrow iPhone widths, dark/light/Matrix, and chart correctness checks.
3. The owner reviews the visual execution. `npm run check` passing does **not** imply UX/design approval.
4. No fake UI placeholders in merged production; a transparent empty state is better than invented visuals.
5. Keep the dashboard in focused PRs (data, KPI/charts, language/repo, recent timeline/heatmap, route consolidation) until screenshots demonstrate a coherent whole.
