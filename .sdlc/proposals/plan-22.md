---
gate: G2
question: "Is this the right cut of the work, and does each slice stand on its own?"
recommendation: "I made the three changes the ruling asked for."
opened: 2026-10-04T04:18:21.032Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.288 (Claude Code)"
isolation: "none"
---

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** I made the three changes the ruling asked for.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I made the three changes the ruling asked for. The coverage script still did not run.

Nothing moves between slices in this revision. There are still 21 slices in the same order. Slice 15 still holds the seven criteria the previous re-cut moved into it: R-1.31, R-2.7, R-2.9, R-2.11, R-2.24, R-2.25 and R-8.20. No new decision record was needed. I changed only the two existing records and `plan/plan.md`.

**0002 (keep the existing schema).** The sentence that said no table or column is added now says that no table or column the old application did not have is added. It also says that restoring the old application's own tables where the rebuilt baseline lacks them is within J5 by tech-lead ruling, and I added a matching reason and a way to reverse it. Three rows are new in the migration table: `cwuOpportunityAttachments` (Code With Us, restored under 0029), and `swuOpportunityAttachments` and `twuOpportunityAttachments` (Sprint With Us and Team With Us, restored under 0055).

While doing this I found something the ruling did not mention. Decision record 0012 also adds migrations: it restores the old proposal and evaluation tables the seed writes to, and renames service area 5 back to its old name. The rebuilt baseline (0007) is itself a migration too. If I had written "the only migrations are the six in 0002", the plan would have contradicted itself again, just elsewhere. So 0002 now has a short paragraph pointing to 0007 and 0012 and saying that, together with its six rows, they are every migration the rebuild runs. The repository-layout line and the J5 paragraph in `plan/plan.md` say the same thing, and the J5 paragraph names all six of 0002's migrations by what they do. The "data it inherits" section of the plan was reworded the same way and now names the restored tables.

**0055 (Sprint With Us and Team With Us attachments).** The instruction to take names from the old migration history is gone. The record now names both tables itself. Each has two columns:
- `opportunityVersion`: required, a link to that program's opportunity-version row, deleted along with it.
- `file`: required, a link to `files`.

The two columns together are the key, modelled on 0029's (version, file). One thing is still left to the builder: the name of each program's opportunity-version table. No record in this workspace writes it down, so 0055 tells the builder to read it from the baseline in `app/migrations/`, which is the rebuild's own code and can be read. The new names are marked as the rebuild's own under 0007's rule for names the seed does not fix, to be corrected by a rename migration if the old repository turns up. The record also notes that the tech lead has since ruled the restore within J5.

**Coverage check.** I tried `node plan/check-coverage.mjs .` and then an equivalent inline script. The permission guard blocked both because they needed approval nobody was there to give. The coverage section of `plan/plan.md` now says so plainly and records my hand count of every `criteria:` line in `plan/tasks.md`: 248 placed across 21 slices, with Slice 14 at 18 and Slice 15 at 17, plus the count for every slice. The hand count confirms the total. It does not check for duplicates or missing IDs against the criteria index the way the script does. Whoever next has a shell that can run scripts should run it and paste the output there.

**Constitution rules this revision touched.** Only J5 (keep the existing schema), now described the way the tech lead ruled it. The narrowing of the status check for R-1.51 is still escalated to the tech lead as a schema change and has not been ruled on.

**Assumptions.**
- The ruling that sent this back is the tech-lead ruling the conditions mean, and 0002 cites it as such.
- Sprint With Us and Team With Us each already have an opportunity-version table in the baseline for `opportunityVersion` to point at. Nothing in this workspace names those tables, so this is an assumption.

**Left to others.** build-slice-14-2 #1, #2 and #3 are owed by the Slice 14 build stage, and I did not touch them. The two plan revision requests from build-slice-14-2 stay with this proposal until it lands, as the ruling said. I did not edit anything under `spec`, `design`, `constitution.md` or `.claude/skills`.
