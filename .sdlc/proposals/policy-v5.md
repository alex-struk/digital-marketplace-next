---
gate: G-POL
question: "Raise the bind-adapter turn budget from 200?"
recommendation: "Yes: bind-adapter 1200. The 2026-09-10 19:29 run hit the cap (error_max_turns) with nothing committed, as did the run before it. tests/generated/surface.d.ts and the returned adapter's own bindings file put the surface at 79 pages and 680 actions and observations; 200 turns is 3.4 members per turn including navigation, which no browser session can meet."
opened: 2026-09-11T02:31:01.327Z
---

# Raise the bind-adapter turn budget from 200?

**Recommendation.** Yes: bind-adapter 1200. The 2026-09-10 19:29 run hit the cap (error_max_turns) with nothing committed, as did the run before it. tests/generated/surface.d.ts and the returned adapter's own bindings file put the surface at 79 pages and 680 actions and observations; 200 turns is 3.4 members per turn including navigation, which no browser session can meet.

Evidence. .sdlc/runs/2026-09-11.md records two bind-adapter failures, the second reported by the runner as error_max_turns. The returned proposal returned/bind-adapter-old carries tests/adapters/old/bindings.yaml naming every page, action and observation of the contract exactly once: 79 pages, 680 members. Resume is not a route: the stage's workspace is a fresh archive each run, and sdlc resume answers 'cannot continue a blind-adapter stage; run it again'. So the budget is the only lever. Sizing. Binding a member means opening its page, finding the control by role or label, and writing the method. At roughly 1.5 turns per member plus per-page navigation, 680 members needs of the order of 1000 turns; 1200 is that with headroom and is still a fail-closed cap rather than an open budget. Precedent. policy-v3's second condition set exactly this route: a cap found too low is raised by a one-line proposal citing the run that hit it, not by an in-flight edit to config.yaml. No other budget moves.
