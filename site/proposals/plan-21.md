| Field | Value |
| --- | --- |
| gate | G2 |
| opened | 2026-10-04T04:13:36.175Z |
| holder | agent:architect |
| worked by | claude claude-opus-5-5 (2.1.288 (Claude Code)) |

# Is this the right cut of the work, and does each slice stand on its own?

**Recommendation.** Seven criteria moved from slice 14 to slice 15, slice 15 now explicitly builds attachments on Sprint With Us and Team With Us opportunities, and I wrote decision record 0055 to say so.

**Worked by:** claude claude-opus-5-5 (2.1.288 (Claude Code))

I've answered both conditions in this revision, and neither is deferred. Seven criteria moved from slice 14 to slice 15, slice 15 now explicitly builds attachments on Sprint With Us and Team With Us opportunities, and I wrote decision record 0055 to say so. There are still twenty-one slices covering all 248 accepted criteria. Nothing moved apart from the two slices the conditions named.

**Condition 1 (the all-program proposal rules).** R-1.31, R-2.7, R-2.9, R-2.11, R-2.24 and R-2.25 now sit whole in slice 15. Slice 15 depends on slice 14, so their Code With Us cases can still be shown there.
- I moved each criterion whole rather than just its non-Code With Us cases. Splitting them would need new criterion IDs, and those are the spec's to write.
- Slice 14 still builds these rules for Code With Us, and its deliverables now say they are answered for in slice 15.
- Slice 15 now also lists the work the moved tests need:
  - the Proposals tab on the Sprint With Us and Team With Us manage pages, which decision record 0045 had left to "a later slice";
  - attachments on those programs' proposal forms;
  - their proposals on the vendor dashboard;
  - history, one-proposal-per-organization and draft-or-submit rules in all three programs.

**Condition 2 (R-8.20, attachments on the other two programs).** I added the work to slice 15 explicitly and moved R-8.20 there, beside R-8.19 and R-8.25.
- The root cause: slice 10 draws the attachment control on those forms but disabled, because the rebuilt database has no attachment table for those programs. Record 0045 said this work was slice 15's, but slice 15's deliverables never said so.
- Slice 15 now enables the control and restores the old application's attachment tables for both programs where they are missing, as slice 7 did for Code With Us. It also adds a read path for each, so a file is readable through the opportunity it is attached to.
- Decision record 0055 sets this out. I chose slice 15 over reopening slice 10, because slice 10 is already approved and slice 15 already depends on it.
- The same gap would have left the Sprint With Us and Team With Us halves of R-8.19 unbound too, so the plan now notes that as well.

**Elsewhere in plan.md:**
- three new entries in the list of criteria that sit awkwardly;
- the note on R-8.25 and R-8.20 now puts both in slice 15;
- a paragraph in the data section on restoring the tables;
- the coverage table's opportunities row now lists slice 15 (no counts change);
- a paragraph in the coverage-check section recording this revision's moves.

**Hardest to place: R-1.31 and R-2.25.** Their second clause reads the proposals list after the opportunity has closed. A Sprint With Us or Team With Us opportunity only closes when slice 16's deadline hook runs. The ruling found only the screens missing, and did not return the Code With Us cases, so I followed it and put both in slice 15. If checking slice 15 finds the closed half can't be reached, both should move on to slice 16, as R-1.19 once did, and nothing else changes. The plan says this.

**Constitution rules:**
- **J5 (keep the existing schema):** restoring the two attachment tables is the one point that bears on it. The constitution check now says these are the old application's own tables, created only where missing, as was done for Code With Us. If the tech lead reads restoring them as a schema change, it is escalated the same way as the R-1.51 constraint change.
- **P5 (spec as source of truth) and P7 (test integrity):** they shaped the choice to move whole criteria rather than invent split IDs.

**Assumptions:**
- I assumed the old application had opportunity attachment tables for Sprint With Us and Team With Us. R-8.8 describes attachments on those programs' opportunities, which supports this. Record 0055 tells the builder to take the exact table names from the old migration history, because I did not have it to read.
- The quoted message "Files cannot be attached to a Sprint With Us opportunity in this version of the service" comes from the ruling, not from anything in this workspace.

**Not verified:** I couldn't run `node plan/check-coverage.mjs .` because it needed an approval this session couldn't get. I checked by hand that each moved ID now appears only in slice 15. Slice 14 went from 25 criteria to 18 and slice 15 from 10 to 17, so the total stays 248. Whoever next has a shell should run the script.

Neither condition was addressed to a person, so I left nothing for anyone else, and I changed nothing outside `plan/` and `docs/decisions/`.

## Ruling

**Verdict:** return
**By:** agent:tech-lead
**Ruled on:** claude claude-opus-5-5 (2.1.288 (Claude Code))

The question is whether this is the right cut of the work, and whether each slice stands on its own. The architect escalated it for one reason: the plan now restores the Sprint With Us and Team With Us opportunity attachment tables, and it was unclear whether J5 (keep the existing schema) allows that. My ruling on J5: restoring the old application's own tables, and only where the reconstructed baseline lacks them, keeps the existing schema rather than changing it. It is the same move 0029 already made for Code With Us, and it does not loosen the article. The re-cut is sound for the reasons the architect gave. Seven criteria move whole to Slice 15. Slice 15's closure holds every screen their tests open. The count stays at 248. Two parts of the architect's account still decide a return. First, 0002 still says no table or column is added and lists three migrations, and plan.md's J5 paragraph repeats that, so the plan contradicts itself about which migrations exist. Second, 0055 tells the builder to take the table and column names from old migration history, which nobody in this pipeline can read. Build would have to invent the names while believing it had copied them. The coverage script was also not run. This revision would be approved if 0002 and the J5 paragraph listed the 0029 and 0055 restores, if 0055 named its tables and columns itself, and if the coverage check's output were recorded. The two plan revision requests from build-slice-14-2 are answered in substance by this re-cut and stay with this proposal until the revision lands. build-slice-14-2#1, #2 and #3 are owed by build for Slice 14 and are not settled here.

**Conditions:**
- docs/decisions/0002: add rows to its migration table for the Code With Us opportunity attachment table restored under 0029 and the two Sprint With Us and Team With Us opportunity attachment tables restored under 0055. Reword 'No table or column is added' to say that no table or column the old application did not have is added, and that restoring the old application's own tables where the reconstructed baseline lacks them is within J5 by tech-lead ruling. Update the J5 paragraph in plan/plan.md, which still says 'The only migrations are the three named in 0002', to match.
- docs/decisions/0055: replace the instruction that the builder take the table and column names 'from the old application's migration history'. 0007 records that the old repository is not in this workspace, and neither table name appears in the seed records or anywhere else here, so build cannot follow it. Name the two tables and their columns in 0055 itself, modelled on 0029's cwuOpportunityAttachments (opportunity version, file). Say they are the rebuild's own names under 0007's rule for names the seed does not fix, to be reconciled if the old repository becomes available.
- plan/plan.md: run `node plan/check-coverage.mjs .` and record its result in the coverage-check section. If it cannot be run, say so there, and state the hand count of 248 placed criteria with Slice 14 at 18 and Slice 15 at 17 as the evidence relied on.
