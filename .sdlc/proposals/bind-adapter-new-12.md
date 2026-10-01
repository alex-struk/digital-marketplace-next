---
gate: G3
question: "Does this adapter bind every surface action and observation on new, and nothing else?"
recommendation: "I removed both workarounds the ruling named."
opened: 2026-10-01T00:55:15.211Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I removed both workarounds the ruling named.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I removed both workarounds the ruling named. The profile-picture picker is now reported unbound everywhere it appears, and its readings only read the page. I could not run the typecheck: running `tsc` here needed an approval this session doesn't have. I read the edited code by hand instead, but whether it compiles is unconfirmed.

**What I checked first.** I signed in through the identity provider as the first vendor, opened the profile and pressed "Edit profile". Then I pressed "Choose a profile picture" by click, by Enter and by Space, each time waiting for a file chooser. None opened. The only thing labelled "profile picture" is the "Profile picture (optional)" group around the button; there is no file field a person can see. So the condition's unbound case applies.

**File chooser (`offerFile` in `index.ts`).**
- The fallback that put the file straight into the hidden file field in the button's group is gone.
- If pressing the button opens no chooser, the method now throws `unbound:`, saying the button opens no file chooser and nothing a person can see takes a file.
- The chooser path and the plain labelled file field path are unchanged. A future build whose button does open a chooser would bind without further edits.
- I also removed the matching comment at sign-up's `changeAvatar`.

**Picker readings (`index.ts`).**
- `savePicture` and `picturePending` are removed, along with the comment saying the contract gives the picker no save step.
- `imageAddress`, `currentImage`, `rejectedImageError`, `imageReadableWhenSignedOut`, `storedImageWidth` and `storedImageHeight` now read what the page shows and never press "Save changes".
- With no stored picture, or no refusal shown, each of them returns empty.
- Saving belongs to `userProfileSelf.saveChanges`, which the tests call themselves.

**`bindings.yaml`.** These members are now unbound, each with a reason saying how I reached the button:
- `user-profile.change_avatar`
- `user-sign-up-complete.change_avatar`
- `file-image-picker.choose_image`
- `user-profile-self.change_avatar` — not named in the conditions, but it uses the same button and the same code. Leaving it bound would have contradicted what the adapter now does.

I rewrote the comment above `file-image-picker` to match. The readings stay bound.

**`/sign-up/complete`.** I did not walk it again this run. Its reason rests on the earlier walk, which found the same button opening no chooser there, plus this run's result on the profile.

**Side effects to know about.**
- Any action that brings in a picture through its input now stops with that same unbound reason. That covers `saveChanges` and `completeProfile` given a picture, and the logo on the unserved organization screens.
- As a result, R-8.21, R-8.28 and R-8.30 will report unbound wherever they need a picture chosen. That is the outcome the ruling asked for.

**Left alone.**
- The other unbound criteria (R-8.13, R-8.17, R-6.6, R-6.16, R-4.33) and the accepted R-4.8 and R-4.25 bindings, as instructed. No page route resolved differently from before.
- The 1×1 PNG left as the seeded administrator's profile picture is still there. The interface offers no way to remove it, and nothing outside `tests/adapters/new/` was mine to change.
- The egress-check failure is in files this stage does not own.
