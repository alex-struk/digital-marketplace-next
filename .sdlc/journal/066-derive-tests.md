---
stage: "derive-tests"
title: "derive-tests: post-checks failed"
at: "2026-09-14T01:58:01.829Z"
cost: 5.4775290000000005
turns: 82
session: "309d21b3-2915-4212-aa50-b94b6fec9588"
---

Of the 24 files criteria, 22 now have a test file and 2 have an entry in `tests/acceptance/not-testable.yaml`. No criterion has both. I could not run the suite or its typecheck, because every shell command needed approval that never came. Each file does start with the two required header lines, and a search found nothing the separation check refuses: no selectors, routes, `page` object or imports from outside `fixtures` and `generated`.

**What changed since the last derivation.** The earlier files tests were written against an older contract. That contract returned no file identifiers and had no upload or description page, so a file could only be reached through a download link on a screen the reader could already open. The current contract adds:
- an upload page;
- a file description page;
- identifiers for attachments and images;
- the width and height an image was stored at.

Most earlier refusals and entries were really that one missing piece, so I rewrote the whole domain against the new contract. R-8.5, 8.6, 8.7, 8.11, 8.13, 8.17, 8.18, 8.19, 8.24 and 8.31 moved from `not-testable.yaml` to test files. The older tests also opened pages with parameter names the contract no longer uses, so they were rewritten too.

**Also removed.** R-8.14's test was left over from the previous run. It asserted the behaviour R-8.21 replaces, and a superseded criterion should have no test, so I deleted it. The six entries for superseded criteria in `not-testable.yaml` (R-8.3, 8.4, 8.8, 8.9, 8.15, 8.26) contradict nothing, so I left them.

**Not testable:**
- **R-8.16, unobservable.** The claim is about a working directory on the service's own machine, and no response ever shows its contents. No contract addition could reach it.
- **R-8.22, blocked.** A test can now get the identifier of someone else's file, but no action attaches a file that is already stored. Every attachment action uploads a new file, which the uploader can always read. It needs an action that saves an opportunity or proposal naming a stored file, plus an observation that the attachment was refused.

**Choices the next stage should check:**
- **Read-access statements.** They follow the upload schema in the interface description: "any", a named user, or an account type. An empty list means nobody else may read the file. The named user and account type come from the seed.
- **"Address" observations.** I treated `attachmentAddress()` and `imageAddress()` as returning a file identifier, as the surface's own header describes them. If they return a full address, most tests break at the same point.
- **Upload with no statement.** For R-8.24 I took plain `uploadFile()` to be the upload that carries no read-access statement. It is the only one of the six upload actions that neither states access nor names a broken form of it. Every upload meant to succeed uses the variant that states access explicitly, so nothing else depends on that reading.
- **Oversized upload.** R-8.17 names no figure, so the test describes the file as `exceedsSizeLimit: true` rather than assuming 10 megabytes.
- **Proposal read paths.** For R-8.20, R-8.25 and R-8.31, each test publishes its own Code With Us opportunity. The organization owner submits a proposal for the qualified organization. That organization's administrator reads the attachment and a competing vendor is refused it.

**A conflict in the spec.** R-8.23 v2 and R-8.24 v2 each end with a clause saying a malformed upload "fails as the service fault described by R-8.4". R-8.4 is superseded by R-8.18, which says the same upload is refused as a bad request and is not a service fault. I tested R-8.18 as written and left those two clauses out, with a comment in each file, because a test for them could only contradict R-8.18. The contract stage should correct the wording.

**Parts left unasserted inside tests, and what would reach them:**
- **R-8.18:** no observation says what was wrong with an upload that has no file part; `upload_refused_for_missing_file` on `file-upload` would cover it. The error log and working copy can't be seen at all.
- **R-8.31:** no observation says whether a stored file is still attached to anything; `detached` on `file-description` would cover it. The opportunity half also can't be separated from the uploader's own access, because only the creator attaches files to a draft.
- **R-8.20:** Sprint With Us and Team With Us proposals are not covered. Neither program's proposal pages have an attachment action, and the attachment control is not listed on those forms.
- **R-8.21:** nothing produces an image that reads correctly but can't be resized.
- **R-8.25:** the creator's access before publication can't be told apart from their access as uploader.
- **R-8.6:** who uploaded a file is only visible through the uploader's own access, since the description never names the uploader.
- **R-8.11:** nothing can show the description leaving out the file's content.

## Fix turn

I checked the one compile error the check reported, and I didn't need to change any file.

The error points at `acceptance/files/R-8.14.spec.ts` line 18, which passes `{ user: … }` to a page whose `open()` only accepts `{ userId: string }`. That file isn't in the workspace. I searched all of `tests/acceptance/files/` and ran a glob over the whole workspace and found no `R-8.14` file. None of the files in this domain pass `user:` to an `open()` call: they use `fileId`, `orgId`, `opportunityId` and `proposalId`, or take no argument. That's correct for this criterion, because R-8.14 was replaced by R-8.21, so it was never on this run's list and should have no test. There's also no `not-testable.yaml` entry for it. The only files-domain entries there are R-8.16 and R-8.22, which matches the other 22 criteria each having a test file. The error came from a file that no longer exists, and the files domain has nothing left to fix. I left everything else alone as instructed.

One thing for whoever rules on this or maintains the contract: the same mistake appears outside this domain. Several tests in `users/` pass `{ user: seed.users.<handle>.id }` to `surface.userProfile.open()`, `userProfileLegal.open()` and `userProfileCapabilities.open()`: R-4.3, R-4.5, R-4.8, R-4.9, R-4.12, R-4.18, R-4.19, R-4.25, R-4.30, R-4.31 and R-4.34. `notifications/R-6.17` does the same. All of these should be `{ userId: … }`. `notifications/R-6.10` also passes `{ user: … }` to `organizationEdit.addTeamMembers()`, which I didn't check against the contract. Those files belong to other stages, so I didn't touch them. They'll probably fail the compile check once their own domains are run.

**Journal addition:** The compile check blamed `acceptance/files/R-8.14.spec.ts` for passing `user` where `open()` expects `userId`, but no such file exists in the workspace, so there was nothing to fix. R-8.14 was replaced by R-8.21 and correctly has no test and no `not-testable.yaml` entry. No file in the files domain uses the wrong key, so I changed nothing. The same `user`/`userId` mistake is still in a dozen tests under `users/` and `notifications/`, which this stage doesn't own. Whichever stage writes those domains needs to fix them.

the acceptance suite does not compile; every diagnostic below is in acceptance/files/, which this run wrote:
acceptance/files/R-8.14.spec.ts(18,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.
the acceptance suite does not compile; every diagnostic below is in acceptance/files/, which this run wrote:
acceptance/files/R-8.14.spec.ts(18,36): error TS2353: Object literal may only specify known properties, and 'user' does not exist in type '{ userId: string; }'.