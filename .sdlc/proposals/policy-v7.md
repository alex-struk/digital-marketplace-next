---
gate: G-POL
question: "Should the oracle run four independent copies, so the acceptance suite can run four tests at once?"
recommendation: "Yes. Every test shares one application and one database today, so the suite runs one test at a time and a calibration takes an hour; the loop needs several more rounds. Four copies cost about 1.3GB of the 10GB free on this machine and should bring a run to roughly twenty minutes."
opened: 2026-09-15T04:45:47.467Z
---

# Should the oracle run four independent copies, so the acceptance suite can run four tests at once?

**Recommendation.** Yes. Every test shares one application and one database today, so the suite runs one test at a time and a calibration takes an hour; the loop needs several more rounds. Four copies cost about 1.3GB of the 10GB free on this machine and should bring a run to roughly twenty minutes.


