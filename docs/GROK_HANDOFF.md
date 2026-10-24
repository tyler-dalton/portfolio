# Grok handoff — takeover instructions

**Prepared 2026-10-23** from the live GitHub `main` tree, attached project source and prior design discussions. This is a handoff to **manage the coding backlog**, not an instruction to invent public biographical content or bypass reviews.

## What Grok should do immediately
1. Read `AGENTS.md`, `docs/PROJECT_BRIEF.md`, `docs/ROADMAP.md`, `docs/ENGINEERING_GUIDE.md`.
2. Inspect fresh `main`, existing issues/PRs, `package.json`, navigation and all placeholder routes. Do not assume this snapshot remains current.
3. Install dependencies and verify `npm run build`. If environmental constraints prevent building, report them rather than claiming success.
4. Build `/contact` from existing public contact endpoints as the first scoped implementation PR. Verify mobile, dark/light/Matrix and keyboard.
5. Proceed with GitHub activity improvements and small QA checks in separate PRs.
6. Request a small consolidated set of facts for new case studies, accurate resume/availability and About copy rather than asking on every small commit.
7. Keep a brief PR changelog: what changed, why, how verified, exact blockers/owner questions and screenshots for UI work.

## Constraints and known traps
- **AGENTS.md previously existed** but contained only Astro help links and dev server suggestions. It has now been expanded.
- Only **Panoptes** is present as a project MDX file on inspected `main`; project filtering may show empty states, not a bug.
- **Five routes are stubs**: `/contact`, `/about/now`, `/about/personal`, `/activity/timeline`, `/activity/changelog`.
- `/activity/github` currently contains only the generated contributions image and an outbound profile link.
- Homepage has a more elaborate graph tooltip than the dedicated GitHub page.
- **Resume claims may be stale**. Do not update personal status without explicit owner confirmation; don't infer availability from a past conversation and publish it as fact.
- GitHub Actions commits the graph daily. These updates are not user-facing product milestones.
- The owner values **intentional design**: understated, legible, strong content and modest Linux/terminal personality. Don't "improve" by replacing with a flashy, template-looking dashboard.
- Protect the Matrix easter egg and keyboard command palette; they are deliberate and already implemented.
- Keep Panoptes published claims constrained to what is already approved; avoid sensitive deployment specifics.

## Initial acceptance checklist
Before calling the handoff operational, confirm you can:
- Read repository files and write to a separate branch.
- Run or plausibly execute the repo-defined build command (report outcome honestly).
- Open PRs with working screenshots/checklists where feasible.
- Keep backlog up to date without inventing issues or merging without permission.
- Distinguish public-source evidence from proposed facts needing owner approval.

## Suggested opening message to the owner
"I've reviewed the portfolio handoff and current code. I'll work through the roadmap in small PRs, starting with the Contact page and the GitHub Activity experience. I'll preserve the existing visual system and request your approval before changing career facts, publishing new personal content or exposing infrastructure details. I will not merge or deploy without permission."

## Next source-of-truth review
This package intentionally keeps a dated snapshot. Every subsequent significant change should keep `docs/PROJECT_BRIEF.md` and `docs/ROADMAP.md` consistent with the actual branch, and should state whether the work is proposed, in review, merged or deployed.
