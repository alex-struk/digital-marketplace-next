| Field | Value |
| --- | --- |
| gate | G-POL |
| opened | 2026-09-29T04:06:03.982Z |
| holder | agent:tech-lead |

# Should a calibration of the old application be named after every eight approved changes to what it measures?

**Recommendation.** Yes. Without a cadence, owed upstream work kept calibration from running for 12 to 31 approved changes at a time; calibrations the project reached on its own came about every eight, one per domain.

This proposal changes the `policy` block of `.sdlc/config.yaml`. A change to policy is ruled at
G-POL, by the seat the policy on `main` names, and approving it merges the change onto `main`.

## The change

| Key | On `main` | Proposed |
|---|---|---|
| `policy.next.calibrate_after` | *not set* | `8` |

## `.sdlc/config.yaml`

```diff
--- main:.sdlc/config.yaml
+++ proposal/policy-calibrate-after:.sdlc/config.yaml
@@ -40,6 +40,8 @@
   budgets: { archaeology: 120, contract: 200, derive-tests: 300, bind-adapter: 999, rule: 80, build: 400, review: 200 }
   agents:
     backend: claude
+  next:
+    calibrate_after: 8
 skills:
   packs:
     - { repo: mattpocock/skills, ref: 3cca18b368ae95cdbdebbff572ccafa662551015, skills: [grilling, domain-modeling, prototype, tdd, code-review] }
```

_Ruled: approve by tech-lead_
