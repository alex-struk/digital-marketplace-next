---
stage: "ratify"
title: "ratify"
at: "2026-09-07T04:41:56.497Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify evaluation: 14 accepted, 22 still open, 0 obsolete, 6 replacement(s) added.
Still open:
- D-evaluation-2 (open) — this rule is held only in the database, not in the code that validates a submitted panel, so the observable failure is a stored-data error rather than a field-level message. What a person actually sees when it happens could not be determined without running the old application.
- D-evaluation-4 (inferred) — because the panel is recorded against a version of the opportunity and changing it writes a new version, a panel change also appears in the opportunity's history as an edit, and the count of evaluators the service waits for changes with it.
- D-evaluation-5 (inferred) — the same change made while the opportunity is still a draft notifies nobody.
- D-evaluation-6 (inferred)
- D-evaluation-7 (inferred)
- D-evaluation-8 (inferred) — this is the same closing event that moves the submitted proposals into review and gives each an anonymous proponent name; the evaluation domain inherits that from the proposals domain rather than restating it.
- D-evaluation-9 (inferred) — an evaluator who tries the same thing once the opportunity has moved to consensus is refused as well.
- D-evaluation-11 (inferred)
- D-evaluation-12 (inferred) — the browser form checks each field as it is typed, so this is reachable through the service rather than through the form. Nothing in the code says whether unchecked drafts are intended; a human may want to rule on it.
- D-evaluation-13 (inferred) — one evaluator cannot edit another's evaluation at any point, whatever its state.
- D-evaluation-14 (inferred)
- D-evaluation-15 (inferred) — the shared description of the evaluation interface declares a "submit" action on the single-evaluation route, but the service's own parser accepts only "edit" there and treats anything else as unreadable. The declared interface and the running service therefore disagree; the service is the stricter of the two.
- D-evaluation-16 (inferred) — the count is taken against the panel and the questions of the opportunity's most recent version, so changing the panel during individual evaluation changes how many submissions are awaited.
- D-evaluation-17 (inferred) — an administrator can read an individual evaluation at any stage.
- D-evaluation-18 (inferred) — a consensus is scored against the same rules as an individual evaluation — one score and one comment per question, within the question's maximum.
- D-evaluation-19 (inferred)
- D-evaluation-20 (inferred)
- D-evaluation-22 (inferred) — a proponent that is no longer under review of the questions — withdrawn or disqualified, say — is passed over even if their agreed scores would have placed them.
- D-evaluation-23 (inferred)
- D-evaluation-24 (inferred) — the evaluation instructions are a fixed piece of editable site content, one for each program, so what an evaluator is told can be changed without changing the service.
- D-evaluation-25 (inferred) — the proponents are ordered by their anonymous names, so an evaluator never sees which organization they are scoring while the questions are being evaluated.
- D-evaluation-30 (inferred) — Sprint With Us calls them team questions and carries four proponents forward; Team With Us calls them resource questions and carries three. Team With Us gained its panel about ten months after Sprint With Us did, and its tables were copied from the Sprint With Us ones.