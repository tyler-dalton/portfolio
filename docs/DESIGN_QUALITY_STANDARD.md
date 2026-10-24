# Frontend quality standard — no template-looking output

This file is a permanent standard for **visual-feature** PRs, especially Activity. It does not authorize a wholesale redesign elsewhere.

## The product bar

Treat the portfolio like a carefully authored engineering artifact. The owner wants the site to feel distinctive, premium and clearly intentional. A visually empty page that passes CI is still incomplete if the task called for a data visualization.

### Required behaviors
- **Design from requirements, then build.** Describe the information hierarchy, choose the appropriate visual encoding, then implement; don't throw a component grid at data.
- **Every element must earn its place.** Show real comparison, explanation, navigation or personality. Remove redundant subtitles and decoration.
- **Use graphics purposefully.** Numeric data should become readable relative-length bars, aligned totals, meaningful distributions or time plots—not decorative progress bars or generic KPI cards.
- **Be precise about units.** Commits, contributions, pushes, contributions per repo, repository languages and last-activity timestamps are distinct things.
- **Use restrained visual language.** Consistent line heights, baseline grids, small palette, coherent spacing and subtle transitions. Distinctive is not synonymous with loud.
- **Preserve author identity.** Terminal/Matrix details are deliberate but not a reason to make every section look like a pretend terminal.
- **Build for touch and keyboard.** Accessible labels, contrast, reduced motion and mobile sizing are part of design, not polish after launch.

### Discouraged patterns
- Large repeated cards with one header, generic description and ↗ icon.
- "Your digital journey" / "passionate about innovation" / other anonymous AI-sounding promotional text.
- Grids of all public repos when the task asks for comparison and trend analysis.
- Huge blank areas that lack an information-design purpose.
- Random gradients, glassmorphism, huge glows, unrelated icons and gratuitous badge chips.
- Labels like "SYSTEM MONITOR // GITHUB EXPLORER" that feel like costume UI instead of useful interface.
- Animation that makes the page harder to use.
- Any chart with invented or incorrectly scaled values.

## Workflow for visual PRs

1. Inspect the actual rendered before-state; identify what is missing, not just which file exists.
2. Develop a specific layout plan. State typographic hierarchy, grid, chart conventions, mobile behavior, and empty state before coding.
3. Implement a complete visual slice with real data and controlled components.
4. Run `npm run check` (and relevant more-specific tests). Manual visual inspection is also mandatory.
5. Show screenshots of **actual rendered code**, not a design mock passed off as finished: full page desktop ~1440px, mobile ~390px, at least one alternate theme; include Matrix screenshot if affected.
6. Review at 320px, 375px, 390px, 768px and desktop; inspect chart scales, horizontal overflow, headlines, axes, bars, legibility and touch.
7. Write the PR around design decisions and verification: what the visitor learns, what the graph encodes, source/limitations, tradeoffs, and before/after visuals.
8. Request owner review before merge for a significant visual rebuild.

## Final review questions
- Does the page look designed specifically for this portfolio?
- Would a visitor grasp the most important information in 5 seconds?
- Are the numerical relationships visually honest and legible?
- Did we add something more useful than the original repo list or link hub?
- Does the design work on a real phone, with keyboard and with reduced motion?
- Are all dark/light/Matrix palettes considered?
- Are screenshots and claims verifiable?
- If this could be generated from a generic dashboard template with unchanged structure, what makes it **actually** distinct here?

If answers are weak, iterate before opening a ready-to-merge PR.
