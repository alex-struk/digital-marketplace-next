| Field | Value |
| --- | --- |
| gate | G-POL |
| opened | 2026-09-25T21:53:15.168Z |
| holder | agent:tech-lead |

# Should this project's agents run on Codex?

**Recommendation.** Yes: every stage and ruling on Codex, isolated where decision 0061 requires it; bind-adapter and contract stay on Claude because this project has an oracle and those two cannot run isolated yet.

This proposal changes the `policy` block of `.sdlc/config.yaml`. A change to policy is ruled at
G-POL, by the seat the policy on `main` names, and approving it merges the change onto `main`.

## The change

| Key | On `main` | Proposed |
|---|---|---|
| `policy.agents.backend` | *not set* | `codex` |
| `policy.agents.stages.bind-adapter.backend` | *not set* | `claude` |
| `policy.agents.stages.contract.backend` | *not set* | `claude` |

## `.sdlc/config.yaml`

```diff
--- main:.sdlc/config.yaml
+++ proposal/policy-agents-backend:.sdlc/config.yaml
@@ -38,6 +38,13 @@
   rungs: {}
   triage: { direct_max_files: 3, direct_allowed_paths: [app/] }
   budgets: { archaeology: 120, contract: 200, derive-tests: 300, bind-adapter: 999, rule: 80, build: 400, review: 200 }
+  agents:
+    backend: codex
+    stages:
+      bind-adapter:
+        backend: claude
+      contract:
+        backend: claude
 skills:
   packs:
     - { repo: mattpocock/skills, ref: 3cca18b368ae95cdbdebbff572ccafa662551015, skills: [grilling, domain-modeling, prototype, tdd, code-review] }
```

_Ruled: approve by tech-lead_
