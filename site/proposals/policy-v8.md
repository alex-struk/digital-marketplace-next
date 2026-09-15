| Field | Value |
| --- | --- |
| gate | G-POL |
| opened | 2026-09-15T04:48:04.569Z |
| holder | agent:tech-lead |

# Should the oracle run four independent copies, so the acceptance suite can run four tests at once?

**Recommendation.** Yes. The harness now reads the per-copy variables the pipeline sets: workers comes from SDLC_WORKERS and each worker uses its own SDLC_TARGET_URL_n, SDLC_MAIL_API_n and SDLC_RESET_COMMAND_n, merged in the commit before this one. Measured memory for one copy is 325MB (application 164MB, database 124MB, mail catcher 37MB), so four copies cost about 1.3GB against 10GB free on this machine. Calibration takes an hour today because every test shares one copy, and the loop needs several more rounds.



## Ruling

**Verdict:** approve
**By:** agent:tech-lead

The question is whether the oracle (the old application, run locally as the reference the acceptance tests are checked against) should run four independent copies so the acceptance suite can run four tests at once. Ruling: approve. The whole change is one line, oracle.instances: 4 in .sdlc/config.yaml, plus the proposal page and the run record. Each claim in the proposal checks out against the code. agentic-sdlc src/commands/oracle.mjs:99-101,175-221 reads oracle.instances and starts each copy as its own Compose project with its own ports. src/testrun/playwright.mjs:243-248 sets SDLC_WORKERS to the number of copies and sets SDLC_TARGET_URL_i, SDLC_MAIL_API_i and SDLC_RESET_COMMAND_i for each copy, numbered from 0. The harness (tests/fixtures/index.ts:34-38) picks those by TEST_PARALLEL_INDEX, which also starts at 0, so no worker falls back to a shared copy. tests/playwright.config.ts:18 sets the worker count from SDLC_WORKERS. oracleReseed resets only the copy it is given and refuses a copy number that is not running, so one worker's reset cannot wipe data another test is using. None of the constitution's platform articles (P1-P8) cover the oracle or how tests run, so this is not a platform-article change. No gate is touched, rungs stays empty, the tier is STANDARD, no stage reported low confidence, and all eight checks pass. No refusal or escalation rule applies. The eight test warnings were already present, since no test file changes on this branch, and belong to their own gates. The per-copy memory figure (325MB each, about 1.3GB for four) was not independently measured here; it affects only whether the machine has room, not whether tests stay separate. Evidence that copies share data, or that four copies do not fit on the machine, would bring the change back to lower the instance count.

**Conditions:**
- If `sdlc oracle up` fails to start all four copies, or the machine runs out of memory during calibration, lower oracle.instances in a follow-up proposal that cites the measured figures, rather than working around it.
- The eight existing test warnings (outdated test versions and tests for superseded requirements) are not cleared by this ruling and stay with the gates that own those tests.
