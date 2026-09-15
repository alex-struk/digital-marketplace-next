---
gate: G-POL
question: "Should the oracle run four independent copies, so the acceptance suite can run four tests at once?"
recommendation: "Yes. Every test shares one application and one database today, so the suite runs one test at a time and a calibration takes an hour; the loop needs several more rounds. Four copies cost about 1.3GB of the 10GB free on this machine and should bring a run to roughly twenty minutes."
opened: 2026-09-15T04:45:47.467Z
---

# Should the oracle run four independent copies, so the acceptance suite can run four tests at once?

**Recommendation.** Yes. Every test shares one application and one database today, so the suite runs one test at a time and a calibration takes an hour; the loop needs several more rounds. Four copies cost about 1.3GB of the 10GB free on this machine and should bring a run to roughly twenty minutes.



## Ruling

**Verdict:** return
**By:** agent:tech-lead

The config line is within policy: STANDARD tier, not a platform article, no gate removed or rung enabled, and the pipeline supports oracle.instances with a separate database, seed and reset for each copy. It still cannot deliver what the proposal cites as its reason. The project's harness pins tests/playwright.config.ts to workers: 1, and tests/fixtures/index.ts reads only the plain SDLC_TARGET_URL / SDLC_RESET_COMMAND / SDLC_MAIL_API, never the per-copy _0.._3 variables. So four copies would start and use memory while the suite still runs one test at a time against copy 0, and calibration stays at about an hour. Raising workers without the per-copy fixtures would be worse: four tests would share one database and calibration would report failures the old app does not have. The '1.3GB of the 10GB free' figure is also unclear: a copy costs memory, and the disk has 822GB free.

**Conditions:**
- Bring tests/playwright.config.ts in line with the pipeline template (workers: Number(process.env.SDLC_WORKERS ?? 1)), in this proposal or a change merged before it
- Bring tests/fixtures/index.ts in line with the pipeline template so each worker uses its own copy's SDLC_TARGET_URL_n, SDLC_RESET_COMMAND_n and SDLC_MAIL_API_n
- State the per-copy cost as measured memory against the machine's actual free memory, not disk
- Resubmit with instances: 4 once the harness reads the per-copy variables; the config line itself can stay as it is
