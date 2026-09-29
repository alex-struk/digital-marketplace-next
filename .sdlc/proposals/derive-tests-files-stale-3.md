---
gate: G3
question: "Do these tests follow from the files criteria and from nothing else?"
recommendation: "I rewrote all five tests the ruling sent back (R-8.2, R-8.5, R-8.7, R-8.12, R-8.30), so every criterion in this batch now has a test."
opened: 2026-09-29T00:22:20.600Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Do these tests follow from the files criteria and from nothing else?

**Recommendation.** I rewrote all five tests the ruling sent back (R-8.2, R-8.5, R-8.7, R-8.12, R-8.30), so every criterion in this batch now has a test.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rewrote all five tests the ruling sent back (R-8.2, R-8.5, R-8.7, R-8.12, R-8.30), so every criterion in this batch now has a test. None was marked not testable as a whole. One part of R-8.30 is not tested and is recorded in `tests/acceptance/not-testable.yaml`. I could not run anything: type-checking the tests and parsing the YAML both needed approval that nobody here could give. None of this has been compiled or run against a target.

**Why the uploads were refused.** The contract doesn't show why the upload persona's uploads were refused in some runs and accepted in others. The seed marks every account these tests use as active, but the ruling on R-8.5 says the vendor account was inactive during the run. So no test now assumes an account is active. Each one:
- signs in as the administrator first;
- compares every account the test will upload or read as against the administrator's own status badge on `userProfile`, and reactivates any that doesn't match;
- after an upload, reads `fileUpload.storedFileIdentifier()`. If it is empty, the test stops with an error naming the refusal the service gave (signed out, read-access statement, name length, size, or a service fault), or saying that no refusal was reported. It never goes on to read an empty identifier.

I also replaced the old file names with plain ones (for example "terms-of-reference.pdf"), so a name can't be the cause of a refusal.

**What each test checks:**
- **R-8.2:** one submission with the file, a name and "readable by anyone" is stored. Its description returns the same identifier, the name, and a stored date.
- **R-8.5:** the upload persona and the vendor persona upload identical content under different names; the ruling's complaint was about this second uploader, who is now confirmed active first. The test checks that there are two records, that both share one stored-content identifier, and that each keeps its own name. It also checks that each uploader can reach their own record and is refused the other's. The file description never names the uploader (the observables file says so), so "its own uploader" is only shown through who can read each record. I did not record that as an untested clause.
- **R-8.7:** four tests, same structure as before:
  - uploader and administrator read the file, a second vendor is refused;
  - a file marked readable by anyone can be read while signed out;
  - a named person can read it and another vendor cannot;
  - a named account type can read it and a vendor cannot.
- **R-8.12:** three tests:
  - a file the vendor may not read is answered as not authorized;
  - a file that does not exist is answered as not authorized for a vendor;
  - a file that does not exist is answered as not found for an administrator.

  The identifier that matches no file is the seeded Code With Us opportunity's identifier.
- **R-8.30:** as the ruling asked, the test now saves the change instead of abandoning it. It chooses "portrait.gif" (real PNG bytes, so only the name is wrong) as the profile picture, then saves. If the screen won't let the save go through, that counts as the refusal rather than a failure of the test. It then polls for `fileImagePicker.rejectedImageError()` and reopens the profile to check the current picture is unchanged.

**Not testable: the organization-logo half of R-8.30.** I added a partial entry for it, marked `blocked:` and owned by `contract`:
- `organization-edit` has no action that chooses a logo and no observation of the logo an organization holds.
- `organization-create` has `change_logo` but nothing that reports a refused logo.
- `file-image-picker` is routed to `/users/me` only.

For the contract to reach it, it would need a `change_logo` action on `organization-edit`, plus observations of the organization's current logo and of a logo refused for its file ending. Those observations could be on `organization-edit` itself, or `file-image-picker` could be routed to `/organizations/:orgId/edit`.

Nothing in this batch asked me to change any path outside `tests/acceptance`, and I changed none.
