| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-07T08:44:53.069Z |
| holder | agent:product-owner |

# Which of the files criteria that are still inferred or open become the contract?

**Recommendation.** 8 criterion(s) in files are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

8 criterion(s) in the **files** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-files-3 · v1 · inferred · recovered

An upload whose name is empty or longer than 255 characters is refused, and the person is told the name must be between 1 and 255 characters long.

- reconciliation: implemented-only
- given: a signed-in person uploading a file
- when: they give it a name of 256 characters
- then: the upload is refused and the message names the permitted length
- cites: src/shared/lib/validation/file.ts:25
- cites: src/shared/lib/validation/file.ts:30
- cites: src/back-end/lib/resources/file.ts:137
- note: the limit is the length an ordinary file system will accept, not a rule of this service. Nothing else about the name is checked — no character restriction, no extension requirement, and no check that the name matches the content — except on the profile picture and logo route.

### D-files-4 · v1 · inferred · recovered

An upload with no read-access statement, or with one that cannot be understood, is refused.

- reconciliation: implemented-only
- given: a signed-in person uploading a file
- when: they omit the read-access statement, or give one naming a kind of access the service does not recognise
- then: the upload is refused as having invalid read-access information and no file is stored
- cites: src/back-end/lib/resources/file.ts:138
- cites: src/shared/lib/validation/file.ts:64
- cites: src/back-end/index.ts:301
- note: the three kinds recognised are "anyone", "this one named person" and "anyone of this account type"; a statement naming a person must carry a well-formed identifier and one naming an account type must name a type the service knows. Repeated entries are reduced to one before they are recorded.

### D-files-10 · v1 · inferred · recovered

A file is also readable through what it is attached to: an attachment on a Code With Us or Sprint With Us opportunity is readable by anyone once that opportunity is publicly visible and by the opportunity's creator before then, and an attachment on a proposal is readable by whoever may read that proposal.

- reconciliation: implemented-only
- given: an attachment on a Code With Us opportunity that has not yet been published
- when: a vendor asks for it, and then the opportunity is published and the same vendor asks again
- then: the vendor is refused the first time and receives the file the second time
- cites: src/back-end/lib/permissions.ts:338
- cites: src/back-end/lib/permissions.ts:339
- cites: src/back-end/lib/db/proposal/code-with-us.ts:282
- cites: src/back-end/lib/db/proposal/code-with-us.ts:314
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:2020
- note: this is what makes a Code With Us attachment behave correctly without any read access recorded against the file itself — the attachment is checked against the state of the thing it hangs on, every time it is asked for, so the file becomes readable exactly when its opportunity does.

### D-files-16 · v1 · open · recovered

A file is never removed, and deleting the opportunity or proposal it was attached to removes only the attachment, leaving the file and its content stored and still readable by whoever could read them.

- reconciliation: defect
- given: a draft opportunity with a document attached, marked readable by anyone
- when: the opportunity is deleted
- then: the attachment link is removed with it, and the document remains stored and remains readable by anyone who has its identifier
- cites: src/back-end/lib/resources/file.ts:201
- cites: src/migrations/tasks/20230116114550_twu_opportunities.ts:102
- cites: src/migrations/tasks/20200201235459_cwu_cascades.ts:35
- note: no corrected criterion has been written because there is no removal operation to correct — the service offers no way to delete a file at all, so what a rebuild should do about withdrawn attachments, about a person removing an attachment while editing, and about the storage that accumulates is an unanswered question rather than a broken rule. Removing an attachment in the interface only stops the record referring to it; the file itself is untouched. This bites hardest with R-8.8, where the file was marked readable by anyone and there is no longer an opportunity whose state could take that back.
- note: When an attachment is removed from an opportunity or a proposal, or the opportunity or proposal it hangs on is deleted, is the file itself removed, and what removes stored content once no record refers to it? Answering this needs the records-retention rule that applies to procurement attachments, which is stated in neither the code nor the documentation.

**This criterion has already been answered once, with `contract` or `spike`.** Neither one
moves it toward the contract, so answering the same way again would leave it exactly where it
is: already answered once: confirm, edit, obsolete or defect it.

### D-files-17 · v1 · inferred · recovered

An attachment can be given a different display name before it is uploaded, and the ending of the original file is put back on if the person leaves it off.

- reconciliation: implemented-only
- given: a person attaching a file called "scan0001.pdf" to an opportunity
- when: they type "Statement of work" as its name and save
- then: the attachment is stored as "Statement of work.pdf"
- cites: src/front-end/typescript/lib/components/attachments.tsx:91
- cites: src/shared/lib/resources/file.ts:67
- cites: src/shared/lib/resources/file.ts:72
- cites: src/front-end/typescript/lib/components/attachments.tsx:35
- note: leaving the name box empty keeps the original name unchanged. The typed name is held to the same length rule as any other file name, and the error is shown against the attachment rather than against the form as a whole. Only attachments not yet uploaded can be renamed; an attachment already stored is shown read-only.

### D-files-20 · v1 · inferred · recovered

Profile pictures and organization logos are marked readable by anyone.

- reconciliation: implemented-only
- given: an organization with a logo
- when: a visitor who is not signed in opens the organization list
- then: the logo is shown to them
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:369
- cites: src/front-end/typescript/lib/pages/organization/lib/components/form.tsx:719
- note: this is what lets a logo appear on the public organization list and a profile picture appear beside a person's name to any viewer. It also means the image stays readable by anyone after the profile or organization it belonged to has changed picture, since nothing takes the marking back and nothing removes the file.

### D-files-21 · v1 · inferred · recovered

An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.

- reconciliation: aligned
- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- cites: src/front-end/typescript/lib/http/api/file/markdown-image.ts:7
- cites: src/front-end/typescript/lib/http/api/file/markdown-image.ts:21
- cites: src/shared/lib/resources/file.ts:85
- cites: src/shared/lib/resources/file.ts:89
- cites: src/front-end/typescript/lib/views/markdown.tsx:45
- note: the stored text never contains a web address, so the same text renders correctly wherever the service is running and whatever address it answers on. A marker that does not resolve to a known file identifier is left alone and treated as an ordinary address, so text written elsewhere still works. The content domain already expects image upload in the editor and defers what may be uploaded to here; this criterion is the other half of that.

### D-files-24 · v1 · inferred · recovered

A profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused.

- reconciliation: implemented-only
- given: a signed-in person choosing a new profile picture
- when: they upload a file named "portrait.gif"
- then: the upload is refused for having an ending that is not allowed, and no file is stored
- cites: src/back-end/lib/resources/avatar.ts:72
- cites: src/shared/lib/validation/file.ts:21
- cites: src/shared/lib/validation/file.ts:31
- cites: src/shared/lib/resources/file.ts:9
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:242
- cites: src/front-end/typescript/lib/pages/organization/lib/components/form.tsx:502
- note: the ending is compared without regard to capitalisation. The file choosers for a profile picture and for a logo both offer only these three endings, but the check on the service side is what actually enforces it. Nothing looks at the content, which is what makes R-8.14 possible.

## Ratification conditions

One condition per line, and exactly one of these forms:

- `contract <ID>` — leave as recovered. It does not promote the criterion — `confirm`, `edit` and
  `defect` all do — so this is a no-op on anything still `inferred` or `open`. No text after the ID.
- `confirm <ID>` — the evidence now supports raising its confidence to `confirmed`. No text after the ID.
- `edit <ID>: <new statement>` — the behaviour is right, the wording is not; confidence rises to
  `confirmed` too, since the deliberate rewording is itself a second witness.
- `defect <ID>: <replacement statement>` — the old system does this and the new one should not; the row
  is kept as the record, its confidence rises to `confirmed` (it is a confirmed record of current
  behaviour, marked defect), and the replacement is filed against it.
- `spike <ID>: <question>` — not yet decided; confidence drops to `open` and the question is recorded.
- `obsolete <ID>: <why>` or `drop <ID>: <why>` — not to be carried forward at all.

The ID is the criterion's own id exactly as the domain file spells it. `contract` and `confirm`
take no text; every other verb requires a colon and text on the same line. A condition may not
span more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is which of the eight files criteria still short of the contract should become it. Five are confirmed because a second witness independent of the first now pins each one down: D-files-10 is implemented twice over in parallel (hasCWUAttachmentPermission and hasSWUAttachmentPermission), both gating on publicOpportunityStatuses with a creator exception for private ones and deferring proposal attachments to the proposal's own read check; D-files-17 is settled by getNewAttachments applying enforceExtension against the original file's extension while the component's Msg union offers no rename path for an already-stored attachment; D-files-20 and D-files-21 are settled by call sites that pass metadata [adt("any")] as a literal — both avatar routes, and all seven makeUploadImage callers taking the default — so nothing in the codebase records any other read access for these images; D-files-24 is settled by validateAvatarFilename enforcing SUPPORTED_IMAGE_EXTENSIONS server-side with the two file choosers offering the same three endings client-side, and by the extension comparison being case-folded on both sides. Two are edited rather than confirmed because the behaviour recovered is right but the wording covers ground the code does not reach: D-files-3 pairs an empty name with an over-long one, yet an upload carrying no usable name never reaches validateFileName at all yet — multipart parsing leaves fileName empty and rejects with "No file uploaded", which is R-8.4's service-fault path, not a 400 naming the length — so only the 255-character half produces the message quoted; and D-files-4 says a read-access statement that "cannot be understood" is refused, which straddles the 400/500 boundary R-8.4's note already draws, since well-formed data naming an unrecognised access kind is a 400 while data that is not well-formed rejects during parsing as a service fault. D-files-16 has been answered once already with a verb that cannot move it, and it is defected rather than spiked again: what was open was never what the old system does — there is no delete route or delete operation for files anywhere, and the attachment migrations cascade the link row while leaving the files reference uncascaded — but what the rebuild should do instead, and that is a ruling to make here rather than a question to re-ask. The replacement states the half that is decidable from the code, that removing an attachment or deleting what it hangs on must withdraw the read paths held through that association and must leave detached content identifiable; it deliberately does not invent a retention period, because that rule is set outside this domain. What would change this ruling: for the two edits, evidence that an empty name or malformed read-access data does reach the 400 path — a route or middleware that normalises the multipart body before the adapter sees it would do it; for D-files-16, a records-retention rule for procurement attachments that contradicts the replacement's disposal premise.

**Conditions:**
- edit D-files-3: An upload whose name is longer than 255 characters is refused as a bad request, and the person is told the file name must be between 1 and 255 characters long; an upload carrying no usable name at all never reaches this check and instead fails as the service fault described by R-8.4.
- edit D-files-4: An upload that carries no read-access statement, or one that is well-formed data but names a kind of access the service does not recognise, is refused as a bad request reporting that the information provided was invalid, and no file is stored; read-access information that is not well-formed data at all fails instead as the service fault described by R-8.4.
- confirm D-files-10
- defect D-files-16: Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.
- confirm D-files-17
- confirm D-files-20
- confirm D-files-21
- confirm D-files-24
