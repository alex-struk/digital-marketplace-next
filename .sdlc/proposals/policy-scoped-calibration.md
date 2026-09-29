---
gate: G-POL
question: "Should calibration re-run only the rows whose inputs changed, with a full run every fourth calibration?"
recommendation: "Yes. The old application never changes, so a row's result changes only when its test, the adapter, the contract, the seed or the oracle override does; recent calibrations spent 45 to 55 minutes to move one to five rows. Adapter changes re-run every row that is not passing, shared-input changes force a full run, every fourth calibration is full, and the Tests phase closes only on a full run."
opened: 2026-09-29T23:16:08.727Z
---

# Should calibration re-run only the rows whose inputs changed, with a full run every fourth calibration?

**Recommendation.** Yes. The old application never changes, so a row's result changes only when its test, the adapter, the contract, the seed or the oracle override does; recent calibrations spent 45 to 55 minutes to move one to five rows. Adapter changes re-run every row that is not passing, shared-input changes force a full run, every fourth calibration is full, and the Tests phase closes only on a full run.

This proposal changes the `policy` block of `.sdlc/config.yaml`. A change to policy is ruled at
G-POL, by the seat the policy on `main` names, and approving it merges the change onto `main`.

## The change

| Key | On `main` | Proposed |
|---|---|---|
| `policy.calibrate.scope` | *not set* | `changed` |
| `policy.calibrate.full_every` | *not set* | `4` |

## `.sdlc/config.yaml`

```diff
--- main:.sdlc/config.yaml
+++ proposal/policy-scoped-calibration:.sdlc/config.yaml
@@ -42,6 +42,9 @@
     backend: claude
   next:
     calibrate_after: 8
+  calibrate:
+    scope: changed
+    full_every: 4
 skills:
   packs:
     - { repo: mattpocock/skills, ref: 3cca18b368ae95cdbdebbff572ccafa662551015, skills: [grilling, domain-modeling, prototype, tdd, code-review] }
```
