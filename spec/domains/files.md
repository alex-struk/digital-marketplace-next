# files

Everything a person attaches, uploads or embeds anywhere in the service — an attachment on an
opportunity or a proposal, a profile picture, an organization's logo, an image dropped into a
piece of formatted text — is the same kind of thing: a stored file with a name, an uploader, a
date and a list of who may read it. The service keeps the bytes itself rather than pointing at
storage somewhere else, and it keeps them once per distinct piece of content, so two people
uploading the same document twice produce two named records over one stored copy. A file is
written once and never changed or removed; who may read it is decided at the moment it is
uploaded and never revisited.

Three sources describe this domain outside the code. The service's published interface
description covers both requests this domain answers — uploading a file and retrieving either its
record or its bytes — and is the only outside source that says anything about behaviour. The
schema description records the five record shapes behind a file: the bytes, the named record, and
one table for each of the three ways read access can be granted. The setup guide records the two
image size limits and the directory uploads pass through. Nothing outside the code describes the
size limit on an upload, who may upload, or what happens to a file once the thing it was attached
to is deleted.

Where a criterion concerns what may be attached to an opportunity or a proposal, only the file
half is recorded here; which opportunity accepts attachments and when belongs with those domains.
Four mismatches are recorded as criteria rather than hidden: the interface description and the
code disagree about what a request for a missing file is answered with; two of the three
opportunity programs mark their attachments readable by everyone at the moment of upload while
the third does not; one program has no association-based read path at all; and refusals that are
really the requester's fault are reported as faults of the service.

### D-files-1 · v1 · inferred · recovered
Any person who is signed in may upload a file, and a visitor who is not signed in cannot.
- cites: src/back-end/lib/permissions.ts:326
- cites: src/back-end/lib/resources/file.ts:131
- reconciliation: implemented-only
- given: a visitor who is not signed in
- when: they submit a file for upload
- then: the upload is refused as not permitted and no file is stored
- note: no account type, role or membership is checked beyond being signed in, so a vendor, public sector staff and an administrator all have exactly the same ability to upload. The interface description documents the upload request but says nothing about who may make it, so this rests on the code alone.

### D-files-2 · v1 · confirmed · recovered
An upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission.
- cites: src/back-end/docs/file.yaml:2
- cites: src/back-end/docs/file.yaml:13
- cites: src/back-end/lib/server/adapters.ts:168
- cites: src/back-end/lib/resources/file.ts:136
- reconciliation: implemented-only
- given: a signed-in person with a document to upload
- when: they submit the document together with a name and a read-access statement
- then: the file is stored and its record — its identifier, its name and the date it was stored — is returned
- note: only the first file in a submission is taken; any further files and any fields other than the name and the read-access statement are discarded silently rather than refused.

### D-files-3 · v1 · inferred · recovered
An upload whose name is empty or longer than 255 characters is refused, and the person is told the name must be between 1 and 255 characters long.
- cites: src/shared/lib/validation/file.ts:25
- cites: src/shared/lib/validation/file.ts:30
- cites: src/back-end/lib/resources/file.ts:137
- reconciliation: implemented-only
- given: a signed-in person uploading a file
- when: they give it a name of 256 characters
- then: the upload is refused and the message names the permitted length
- note: the limit is the length an ordinary file system will accept, not a rule of this service. Nothing else about the name is checked — no character restriction, no extension requirement, and no check that the name matches the content — except on the profile picture and logo route.

### D-files-4 · v1 · inferred · recovered
An upload with no read-access statement, or with one that cannot be understood, is refused.
- cites: src/back-end/lib/resources/file.ts:138
- cites: src/shared/lib/validation/file.ts:64
- cites: src/back-end/index.ts:301
- reconciliation: implemented-only
- given: a signed-in person uploading a file
- when: they omit the read-access statement, or give one naming a kind of access the service does not recognise
- then: the upload is refused as having invalid read-access information and no file is stored
- note: the three kinds recognised are "anyone", "this one named person" and "anyone of this account type"; a statement naming a person must carry a well-formed identifier and one naming an account type must name a type the service knows. Repeated entries are reduced to one before they are recorded.

### D-files-5 · v1 · inferred · recovered
An upload larger than 10 megabytes is refused, and so is one that does not declare its size in advance.
- cites: src/shared/lib/resources/file.ts:7
- cites: src/back-end/index.ts:300
- cites: src/back-end/lib/server/adapters.ts:154
- reconciliation: defect
- given: a signed-in person uploading a file
- when: the submission declares a size above 10 megabytes, or declares no size at all
- then: the upload does not succeed and the service reports a fault of its own rather than telling the person the file is too large
- note: classed as a defect for the way the refusal is reported, not for the limit. The limit is applied to the declared size of the whole submission before any of it is read, so a submission that understates its size is not stopped by this check and nothing downstream applies a second one; a submission that declares no size at all is treated as too large. The 10 megabyte figure appears nowhere outside the code — not in the setup guide, not in the interface description, and nowhere in the interface a person sees before they choose a file.

### D-files-6 · v1 · inferred · recovered
An upload that is malformed — no file part, or read-access information that is not well-formed data — fails as a fault of the service rather than as a rejected request.
- cites: src/back-end/lib/server/adapters.ts:212
- cites: src/back-end/lib/server/adapters.ts:240
- cites: src/back-end/lib/server/adapters.ts:336
- reconciliation: defect
- given: a signed-in person or another system submitting an upload
- when: the submission carries no file part, or read-access information that is not well-formed
- then: the request fails as an unexpected fault of the service and is recorded in the service's error log as one
- note: no corrected criterion has been written because the two cases want different answers — a submission with no file is a bad request, whereas read-access information that is not well-formed is already reported properly when it is well-formed but wrong (see D-files-4). Both are indistinguishable to the caller from the service being broken, and both fill the error log with entries caused by callers rather than by the service. A file already written to temporary storage when one of these fails is not cleaned up, because the clean-up step is only reached on the success path.

### D-files-7 · v1 · inferred · recovered
Two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access.
- cites: src/back-end/lib/db/file.ts:60
- cites: src/back-end/lib/db/file.ts:66
- cites: src/back-end/lib/db/file.ts:77
- reconciliation: implemented-only
- given: a file already stored by one person
- when: a second person uploads a file with byte-for-byte identical content under a different name
- then: a second, separate record is created that shares the stored content, and the second person's read access does not extend to the first record
- note: the content is matched by a fingerprint of the bytes alone; the name is deliberately not part of it. Because read access hangs off the record and never off the shared content, sharing storage does not leak anything. It does mean the stored content outlives every record that refers to it, since nothing ever removes it.

### D-files-8 · v1 · confirmed · recovered
Every stored file records who uploaded it and when, and neither can be changed afterwards.
- cites: src/migrations/tasks/20191123120154_files.ts:17
- cites: docs/database-schema.md:261
- cites: src/back-end/lib/db/file.ts:77
- reconciliation: implemented-only
- given: a signed-in person
- when: they upload a file
- then: the file is permanently marked as theirs and stamped with the moment it was stored
- note: there is no operation anywhere in the service that changes a stored file's name, content, uploader or date. A file is written once and read thereafter.

### D-files-9 · v1 · confirmed · recovered
A file is readable by anyone if it was marked readable by anyone, by a person it names, by anyone holding an account type it names, by whoever uploaded it, and by any administrator.
- cites: src/back-end/lib/db/file.ts:124
- cites: src/back-end/lib/db/file.ts:131
- cites: src/back-end/lib/db/file.ts:140
- cites: src/back-end/lib/db/file.ts:148
- cites: src/back-end/lib/db/file.ts:156
- cites: src/back-end/lib/permissions.ts:336
- cites: src/migrations/tasks/20191217200136_file_permissions.ts:14
- cites: docs/database-schema.md:241
- reconciliation: implemented-only
- given: a file uploaded by one vendor and marked readable by no one else
- when: a second vendor asks for it, and then an administrator asks for it
- then: the second vendor is refused and the administrator receives it
- note: a file marked readable by anyone is readable by a visitor who is not signed in. These five ways of being allowed are checked in turn and any one is enough.

### D-files-10 · v1 · inferred · recovered
A file is also readable through what it is attached to: an attachment on a Code With Us or Sprint With Us opportunity is readable by anyone once that opportunity is publicly visible and by the opportunity's creator before then, and an attachment on a proposal is readable by whoever may read that proposal.
- cites: src/back-end/lib/permissions.ts:338
- cites: src/back-end/lib/permissions.ts:339
- cites: src/back-end/lib/db/proposal/code-with-us.ts:282
- cites: src/back-end/lib/db/proposal/code-with-us.ts:314
- cites: src/back-end/lib/db/proposal/sprint-with-us.ts:2020
- reconciliation: implemented-only
- given: an attachment on a Code With Us opportunity that has not yet been published
- when: a vendor asks for it, and then the opportunity is published and the same vendor asks again
- then: the vendor is refused the first time and receives the file the second time
- note: this is what makes a Code With Us attachment behave correctly without any read access recorded against the file itself — the attachment is checked against the state of the thing it hangs on, every time it is asked for, so the file becomes readable exactly when its opportunity does.

### D-files-11 · v1 · inferred · recovered
An attachment added to a Sprint With Us or Team With Us opportunity is marked readable by anyone at the moment it is uploaded, so it can be read by a visitor who is not signed in while the opportunity is still a draft.
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/lib/components/form.tsx:510
- cites: src/front-end/typescript/lib/pages/opportunity/team-with-us/lib/components/form.tsx:422
- cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:61
- cites: src/back-end/lib/db/file.ts:94
- reconciliation: defect
- given: a Sprint With Us opportunity saved as a draft with a document attached
- when: a visitor who is not signed in asks for that document by its identifier
- then: the document is returned, even though the opportunity it belongs to is not visible to them
- note: no corrected criterion has been written because the correct behaviour is already described by D-files-10 — the association check would grant exactly the right access on its own, and the marking is what defeats it. The three programs disagree with each other: Code With Us attachments and Code With Us proposal attachments are uploaded with no read access recorded, and rely on the association check; Sprint With Us and Team With Us attachments are marked readable by anyone. The identifier of a draft opportunity's attachment is not published anywhere, so this is a matter of guessing or retaining an identifier rather than of browsing.

### D-files-12 · v1 · inferred · recovered
Nothing makes a Team With Us attachment readable by virtue of what it is attached to, so a Team With Us proposal attachment is readable only by the person who uploaded it and by an administrator.
- cites: src/back-end/lib/permissions.ts:330
- cites: src/back-end/lib/db/proposal/team-with-us.ts:63
- cites: src/migrations/tasks/20230321113754_add-twu-proposals.ts:67
- reconciliation: defect
- given: a Team With Us proposal carrying an attachment, and the public sector staff member who owns the opportunity
- when: that staff member asks for the attachment
- then: they are refused, although they may read the proposal it belongs to
- note: no corrected criterion has been written because the missing behaviour is D-files-10 extended to the third program, and whether the new system should carry three separate association rules or one is a design decision rather than a finding. Nothing in the interface offers a way to attach a file to a Team With Us proposal, so this is reachable only by a caller working against the service directly; the service accepts such attachments and stores them. The Team With Us opportunity case is masked rather than fixed by D-files-11, which marks those attachments readable by anyone.

### D-files-13 · v1 · confirmed · recovered
Asking for a file with its content requested returns the bytes, described by a content type worked out from the file's name and offered to the browser as something to save rather than to display.
- cites: src/back-end/docs/file.yaml:50
- cites: src/back-end/docs/file.yaml:53
- cites: src/back-end/lib/resources/file.ts:59
- cites: src/back-end/lib/resources/file.ts:92
- cites: src/back-end/lib/resources/file.ts:93
- cites: src/front-end/typescript/lib/index.tsx:179
- reconciliation: implemented-only
- given: a stored file named "terms.pdf" that the requester may read
- when: they ask for it with its content requested
- then: the bytes are returned, described as a PDF, and named "terms.pdf" for saving
- note: the content type is guessed from the name alone; the actual content is never inspected, on upload or on retrieval. A file whose name carries no recognised ending, or an ending that does not match its content, is described as unspecified binary data. Every download link in the interface is this same request.

### D-files-14 · v1 · confirmed · recovered
Asking for a file without requesting its content returns a description of it — its identifier, its name and the date it was stored — under the same permission rules as the content itself.
- cites: src/back-end/docs/file.yaml:37
- cites: src/back-end/docs/file.yaml:43
- cites: src/back-end/lib/resources/file.ts:77
- cites: src/back-end/lib/db/file.ts:21
- reconciliation: implemented-only
- given: a stored file the requester may read
- when: they ask for it without requesting its content
- then: its identifier, name and stored date are returned, and its content is not
- note: the description also carries the fingerprint of the stored content, which is how identical uploads are recognised; a person who may read two files can therefore tell whether they hold the same content without downloading either.

### D-files-15 · v1 · open · recovered
A request for a file the requester may not read is answered as not authorized, and so is a request for a file that does not exist — unless the requester is an administrator, who is told it was not found.
- cites: src/back-end/lib/resources/file.ts:62
- cites: src/back-end/lib/resources/file.ts:75
- cites: src/back-end/lib/resources/file.ts:97
- cites: src/back-end/lib/permissions.ts:336
- cites: src/back-end/docs/file.yaml:58
- cites: src/back-end/docs/file.yaml:60
- reconciliation: conflicting
- given: an identifier that no stored file carries
- when: a vendor asks for it, and then an administrator asks for it
- then: the vendor is told they are not authorized and the administrator is told it was not found
- note: the two sources disagree. The interface description documents "not found" as the answer for a file that does not exist, without qualification; the code reaches that answer only for an administrator, because for everyone else the permission check runs first and cannot find any grounds to allow a file that is not there. The same is true of a malformed identifier. Which of the two is intended could not be settled: refusing to distinguish "you may not" from "there is nothing here" is a recognised way of not leaking which identifiers exist, and could be deliberate, but nothing in the code or the documentation says so, and the administrator exception means the distinction is leaked to exactly the people who least need it hidden. Left open for a ruling on which answer the new system should give.

### D-files-16 · v1 · inferred · recovered
A file is never removed, and deleting the opportunity or proposal it was attached to removes only the attachment, leaving the file and its content stored and still readable by whoever could read them.
- cites: src/back-end/lib/resources/file.ts:201
- cites: src/migrations/tasks/20230116114550_twu_opportunities.ts:102
- cites: src/migrations/tasks/20200201235459_cwu_cascades.ts:35
- reconciliation: defect
- given: a draft opportunity with a document attached, marked readable by anyone
- when: the opportunity is deleted
- then: the attachment link is removed with it, and the document remains stored and remains readable by anyone who has its identifier
- note: no corrected criterion has been written because there is no removal operation to correct — the service offers no way to delete a file at all, so what a rebuild should do about withdrawn attachments, about a person removing an attachment while editing, and about the storage that accumulates is an unanswered question rather than a broken rule. Removing an attachment in the interface only stops the record referring to it; the file itself is untouched. This bites hardest with D-files-11, where the file was marked readable by anyone and there is no longer an opportunity whose state could take that back.

### D-files-17 · v1 · inferred · recovered
An attachment can be given a different display name before it is uploaded, and the ending of the original file is put back on if the person leaves it off.
- cites: src/front-end/typescript/lib/components/attachments.tsx:91
- cites: src/shared/lib/resources/file.ts:67
- cites: src/shared/lib/resources/file.ts:72
- cites: src/front-end/typescript/lib/components/attachments.tsx:35
- reconciliation: implemented-only
- given: a person attaching a file called "scan0001.pdf" to an opportunity
- when: they type "Statement of work" as its name and save
- then: the attachment is stored as "Statement of work.pdf"
- note: leaving the name box empty keeps the original name unchanged. The typed name is held to the same length rule as any other file name, and the error is shown against the attachment rather than against the form as a whole. Only attachments not yet uploaded can be renamed; an attachment already stored is shown read-only.

### D-files-18 · v1 · confirmed · recovered
A profile picture or an organization logo wider than 500 pixels is narrowed to 500 pixels before it is stored, and one taller than 500 pixels is shortened to 500 pixels, in both cases keeping its proportions.
- cites: src/back-end/lib/resources/avatar.ts:23
- cites: src/back-end/lib/resources/avatar.ts:80
- cites: src/back-end/config.ts:219
- cites: src/back-end/config.ts:224
- cites: README.md:276
- cites: README.md:277
- reconciliation: implemented-only
- given: a signed-in person choosing a new profile picture
- when: they upload an image 2000 pixels wide and 300 pixels tall
- then: it is stored 500 pixels wide, still in its original proportions
- note: the two limits are settings rather than fixed rules and both default to 500 pixels, which the setup guide records. An organization's logo is uploaded through this same route and is held to the same rule. What happens when an image exceeds both limits at once could not be settled from the source: the two reductions are applied one after the other to the same working image, and whether the second replaces the first or adds to it depends on the behaviour of the image library rather than on anything this service states. An image that exceeds only one limit — the common case, and the one written above — is unambiguous.

### D-files-19 · v1 · inferred · recovered
A profile picture or logo that cannot be read as an image is stored as it was uploaded rather than refused.
- cites: src/back-end/lib/resources/avatar.ts:42
- cites: src/back-end/lib/resources/avatar.ts:80
- reconciliation: defect
- given: a signed-in person with a file that is not an image but is named "portrait.png"
- when: they upload it as their profile picture
- then: the resizing step fails quietly, the file is stored unchanged, and it is set as their profile picture
- note: no corrected criterion has been written because tolerating a resize failure and rejecting a non-image are two different decisions and only the first is what the code intends — the failure is caught and logged as a warning so that an image the resizer merely cannot handle is still accepted. The side effect is that the ending in the name is the only thing standing between an arbitrary file and the profile picture slot. What is served back is described by that same name, so it is offered to browsers as a PNG whatever it holds.

### D-files-20 · v1 · inferred · recovered
Profile pictures and organization logos are marked readable by anyone.
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:369
- cites: src/front-end/typescript/lib/pages/organization/lib/components/form.tsx:719
- reconciliation: implemented-only
- given: an organization with a logo
- when: a visitor who is not signed in opens the organization list
- then: the logo is shown to them
- note: this is what lets a logo appear on the public organization list and a profile picture appear beside a person's name to any viewer. It also means the image stays readable by anyone after the profile or organization it belonged to has changed picture, since nothing takes the marking back and nothing removes the file.

### D-files-21 · v1 · inferred · recovered
An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.
- cites: src/front-end/typescript/lib/http/api/file/markdown-image.ts:7
- cites: src/front-end/typescript/lib/http/api/file/markdown-image.ts:21
- cites: src/shared/lib/resources/file.ts:85
- cites: src/shared/lib/resources/file.ts:89
- cites: src/front-end/typescript/lib/views/markdown.tsx:45
- reconciliation: aligned
- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- note: the stored text never contains a web address, so the same text renders correctly wherever the service is running and whatever address it answers on. A marker that does not resolve to a known file identifier is left alone and treated as an ordinary address, so text written elsewhere still works. The content domain already expects image upload in the editor and defers what may be uploaded to here; this criterion is the other half of that.

### D-files-22 · v1 · inferred · recovered
Attaching a file to an opportunity or a proposal checks only that the file exists, not that the person attaching it uploaded it or may read it.
- cites: src/back-end/lib/validation.ts:589
- cites: src/back-end/lib/validation.ts:614
- reconciliation: defect
- given: a file uploaded by one person and readable only by them
- when: a second person saves a proposal naming that file's identifier as an attachment
- then: the attachment is accepted, and the file becomes readable to everyone who may read that proposal
- note: no corrected criterion has been written because the right rule is not obvious — requiring that the attacher be the uploader would be the narrow fix, but a file legitimately shared between two members of an organization would fail it. Reaching this needs the identifier of somebody else's file, which the service hands out only to people already allowed to read it, so the practical effect is that read access can be widened by someone who has it rather than gained by someone who has not.

### D-files-23 · v1 · inferred · recovered
An uploaded file is written to a working directory on the service's own machine before it is stored, and is removed from there once the upload has been answered.
- cites: src/back-end/lib/server/adapters.ts:173
- cites: src/back-end/lib/server/adapters.ts:428
- cites: src/back-end/config.ts:230
- cites: src/back-end/config.ts:233
- cites: README.md:278
- reconciliation: implemented-only
- given: a signed-in person uploading a file
- when: the upload succeeds, and separately when it is refused for a bad name or bad read-access information
- then: in both cases the working copy is removed once the answer has been sent
- note: the working directory is a setting the setup guide records, and the service creates it at start-up and refuses to start if it cannot. The removal step is only reached when the request is answered normally, so the cases in D-files-6 — where the upload fails as a fault of the service — leave their working copy behind.

### D-files-24 · v1 · inferred · recovered
A profile picture or an organization logo whose name does not end in .jpg, .jpeg or .png is refused.
- cites: src/back-end/lib/resources/avatar.ts:72
- cites: src/shared/lib/validation/file.ts:21
- cites: src/shared/lib/validation/file.ts:31
- cites: src/shared/lib/resources/file.ts:9
- cites: src/front-end/typescript/lib/pages/user/lib/components/profile-form.tsx:242
- cites: src/front-end/typescript/lib/pages/organization/lib/components/form.tsx:502
- reconciliation: implemented-only
- given: a signed-in person choosing a new profile picture
- when: they upload a file named "portrait.gif"
- then: the upload is refused for having an ending that is not allowed, and no file is stored
- note: the ending is compared without regard to capitalisation. The file choosers for a profile picture and for a logo both offer only these three endings, but the check on the service side is what actually enforces it. Nothing looks at the content, which is what makes D-files-19 possible.
