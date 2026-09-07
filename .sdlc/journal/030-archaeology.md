---
stage: "archaeology"
title: "archaeology files"
at: "2026-09-07T08:41:05.040Z"
cost: 6.7348845
turns: 95
session: "9d80f1e9-3225-4579-a668-4bf14168b9d7"
---

All three deliverables are in place. Here is my journal entry.

---

The files domain is the service's single store for everything a person uploads anywhere in it — attachments on opportunities and proposals, profile pictures, organization logos, and images dropped into formatted text are all one kind of record, differing only in which route they arrive through and who is recorded as allowed to read them. A file is written once and never altered or removed: its name, its content, its uploader and its date are fixed at upload, and read access is decided in the same moment and never revisited. Retrieval is a single request that returns either a short description of the file or its bytes, and the same permission test guards both.

I recovered 24 criteria into `spec/domains/files.md` — six graded `confirmed` where the code and a second source agree, seventeen `inferred` where only the code shows it, and one `open`. Fifteen are `implemented-only`, one `aligned` (the embedded-image behaviour, which the content domain had already deferred to here), one `conflicting`, and seven `defect`. I also added four entries to the contract surface and one persona.

**What conflicted.** The published interface description says a request for a file that does not exist is answered "not found". The code reaches that answer only for an administrator; for everybody else the permission test runs first, finds no grounds to allow a file that is not there, and answers "not authorized" instead. Both readings are defensible — refusing to distinguish "you may not" from "there is nothing here" is a recognised way of not revealing which identifiers exist — but nothing in either source says which was intended, and the administrator exception leaks the distinction to precisely the people who least need it hidden. That is the one criterion left `open`.

The three opportunity programs also disagree with each other, and this one is not a documentation gap but a genuine split in behaviour. Code With Us attachments are uploaded with no read access recorded and rely entirely on a check against the state of the opportunity they hang on, which grants access exactly when the opportunity becomes public — correct, and elegant. Sprint With Us and Team With Us attachments are instead marked readable by anyone at the moment of upload, which defeats that check and leaves a draft opportunity's attachments readable by a signed-out visitor holding the identifier. Separately, the association check exists for two programs only; Team With Us has none, so a Team With Us proposal attachment is unreadable even by the staff member who owns the opportunity. The schema description is also stale — it predates Team With Us entirely and lists none of its tables — which is why I leaned on the migrations rather than the prose for the record shapes.

**What I could not determine.** Whether an image that exceeds both the width and the height limit ends up within both: the two reductions are applied one after another to the same working image, and which of them survives depends on the image library's own semantics rather than on anything this service states. I narrowed that criterion to the single-dimension case, which is unambiguous, and recorded the gap rather than guessing. I could not settle what the correct rule should be for four of the seven defects — the size-limit refusal reported as a service fault, the missing removal path, the fact that attaching a file checks only that it exists and not who uploaded it, and the tolerated image-processing failure — so none of them carries a `replaces`; each has a note saying why the corrected criterion is a decision rather than a finding. I also found no statement anywhere outside the code of the 10-megabyte upload limit, and nothing in the interface tells a person about it before they choose a file, so I cannot say whether that figure is policy or an implementation choice that hardened into one.