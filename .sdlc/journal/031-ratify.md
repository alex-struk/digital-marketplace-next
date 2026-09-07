---
stage: "ratify"
title: "ratify files"
at: "2026-09-07T08:44:53.000Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify files: 22 accepted, 8 still open, 0 obsolete, 6 replacement(s) added.
Still open:
- D-files-3 (inferred) — the limit is the length an ordinary file system will accept, not a rule of this service. Nothing else about the name is checked — no character restriction, no extension requirement, and no check that the name matches the content — except on the profile picture and logo route.
- D-files-4 (inferred) — the three kinds recognised are "anyone", "this one named person" and "anyone of this account type"; a statement naming a person must carry a well-formed identifier and one naming an account type must name a type the service knows. Repeated entries are reduced to one before they are recorded.
- D-files-10 (inferred) — this is what makes a Code With Us attachment behave correctly without any read access recorded against the file itself — the attachment is checked against the state of the thing it hangs on, every time it is asked for, so the file becomes readable exactly when its opportunity does.
- D-files-16 (open) — no corrected criterion has been written because there is no removal operation to correct — the service offers no way to delete a file at all, so what a rebuild should do about withdrawn attachments, about a person removing an attachment while editing, and about the storage that accumulates is an unanswered question rather than a broken rule. Removing an attachment in the interface only stops the record referring to it; the file itself is untouched. This bites hardest with R-8.8, where the file was marked readable by anyone and there is no longer an opportunity whose state could take that back.
- D-files-17 (inferred) — leaving the name box empty keeps the original name unchanged. The typed name is held to the same length rule as any other file name, and the error is shown against the attachment rather than against the form as a whole. Only attachments not yet uploaded can be renamed; an attachment already stored is shown read-only.
- D-files-20 (inferred) — this is what lets a logo appear on the public organization list and a profile picture appear beside a person's name to any viewer. It also means the image stays readable by anyone after the profile or organization it belonged to has changed picture, since nothing takes the marking back and nothing removes the file.
- D-files-21 (inferred) — the stored text never contains a web address, so the same text renders correctly wherever the service is running and whatever address it answers on. A marker that does not resolve to a known file identifier is left alone and treated as an ordinary address, so text written elsewhere still works. The content domain already expects image upload in the editor and defers what may be uploaded to here; this criterion is the other half of that.
- D-files-24 (inferred) — the ending is compared without regard to capitalisation. The file choosers for a profile picture and for a logo both offer only these three endings, but the check on the service side is what actually enforces it. Nothing looks at the content, which is what makes R-8.14 possible.