---
gate: G-POL
question: "Should the oracle run four independent copies, so the acceptance suite can run four tests at once?"
recommendation: "Yes. The harness now reads the per-copy variables the pipeline sets: workers comes from SDLC_WORKERS and each worker uses its own SDLC_TARGET_URL_n, SDLC_MAIL_API_n and SDLC_RESET_COMMAND_n, merged in the commit before this one. Measured memory for one copy is 325MB (application 164MB, database 124MB, mail catcher 37MB), so four copies cost about 1.3GB against 10GB free on this machine. Calibration takes an hour today because every test shares one copy, and the loop needs several more rounds."
opened: 2026-09-15T04:48:04.569Z
---

# Should the oracle run four independent copies, so the acceptance suite can run four tests at once?

**Recommendation.** Yes. The harness now reads the per-copy variables the pipeline sets: workers comes from SDLC_WORKERS and each worker uses its own SDLC_TARGET_URL_n, SDLC_MAIL_API_n and SDLC_RESET_COMMAND_n, merged in the commit before this one. Measured memory for one copy is 325MB (application 164MB, database 124MB, mail catcher 37MB), so four copies cost about 1.3GB against 10GB free on this machine. Calibration takes an hour today because every test shares one copy, and the loop needs several more rounds.


