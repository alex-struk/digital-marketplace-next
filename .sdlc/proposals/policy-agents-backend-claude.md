---
gate: G-POL
question: "Should the project's agent turns and agent rulings run on Claude again?"
recommendation: "Yes. Codex ran from the policy-agents-backend change until its weekly quota was nearly used up; the project's owner is continuing the work on Claude and wants the switch recorded as policy so every turn's backend is traceable to a ruling. The per-stage Claude entries for contract and bind-adapter become redundant and are removed."
opened: 2026-09-28T02:07:06.132Z
---

# Should the project's agent turns and agent rulings run on Claude again?

**Recommendation.** Yes. Codex ran from the policy-agents-backend change until its weekly quota was nearly used up; the project's owner is continuing the work on Claude and wants the switch recorded as policy so every turn's backend is traceable to a ruling. The per-stage Claude entries for contract and bind-adapter become redundant and are removed.

This proposal changes the `policy` block of `.sdlc/config.yaml`. A change to policy is ruled at
G-POL, by the seat the policy on `main` names, and approving it merges the change onto `main`.

## The change

| Key | On `main` | Proposed |
|---|---|---|
| `policy.agents.backend` | `codex` | `claude` |
| `policy.agents.stages` | `{ bind-adapter: { backend: claude }, contract: { backend: claude } }` | *not set* |

## `.sdlc/config.yaml`

```diff
--- main:.sdlc/config.yaml
+++ proposal/policy-agents-backend-claude:.sdlc/config.yaml
@@ -39,12 +39,7 @@
   triage: { direct_max_files: 3, direct_allowed_paths: [app/] }
   budgets: { archaeology: 120, contract: 200, derive-tests: 300, bind-adapter: 999, rule: 80, build: 400, review: 200 }
   agents:
+    backend: claude
-    backend: codex
-    stages:
-      bind-adapter:
-        backend: claude
-      contract:
-        backend: claude
 skills:
   packs:
     - { repo: mattpocock/skills, ref: 3cca18b368ae95cdbdebbff572ccafa662551015, skills: [grilling, domain-modeling, prototype, tdd, code-review] }
```
