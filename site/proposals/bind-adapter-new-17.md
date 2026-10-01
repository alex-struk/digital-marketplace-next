| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-10-01T03:58:10.121Z |
| holder | agent:reviewer |
| worked by | claude claude-opus-5-5 (2.1.284 (Claude Code)) |

# Does this adapter bind every surface action and observation on new, and nothing else?

**Recommendation.** I rebound the `file-embedded-image` page in `tests/adapters/new/`.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I rebound the `file-embedded-image` page in `tests/adapters/new/`. All seven of its members are now bound, including `upload_body_image`, which R-7.26 and R-8.29 need. But pressing "Insert image" on the running build opens no file chooser, so those two criteria should now fail as real failures rather than come back unbound.

**What the old reason got wrong.** The previous reason said `/content/:slug/edit` answers "Page not found" to everyone. That is not true now, and the adapter's own header already said the administrator is served it. I signed in through the sandbox identity provider as the administrator (`test-admin`) and opened the seeded `about-us` page at `/content/about-us/edit`. After pressing "Edit page", the form shows a "Formatting for Body" toolbar with an "Insert image" button. The rule text beneath it reads "Insert image takes a JPEG or PNG image, up to 10 MB…". The page was there all along; it had just been left as a stub that reported everything unbound.

**What the page does.** I fed an image straight into the editor's hidden file input. I did this only while exploring; the adapter never does it.
- **A valid PNG:** it is stored at once and written into the body at the cursor as `![Describe this image](@file/<id>)`. The status line reads "pic.png was inserted at the cursor…".
- **After publishing:** the public page `/content/about-us` shows the image, loaded from `/api/files/<id>?type=blob`. Without `?type=blob`, that address returns the file's record as JSON, not the image.
- **A GIF, or a ".png" that is not really an image:** an alert says "<name> could not be inserted / It is not a JPEG or PNG image… Nothing was added to the body." The body is left unchanged.

**Why the action is bound rather than unbound.** Pressing "Insert image" opens no file chooser, whether by mouse or by Enter, on both the edit and create screens. I checked that the button never triggers its file input at all, while "Bold" in the same toolbar does change the body. I also tried dropping and pasting an image onto the Body box; neither inserts anything. The control is on the page in the state the contract describes, and it does not work. That is the application failing a person, so `uploadBodyImage` throws a plain failure ("'Insert image' … opened no file chooser") rather than `unbound:`. The test should decide that outcome, not the adapter.

**What I changed in `index.ts`:**
- **The shared image-insert helper** (which `content-create` and `content-edit` also use) now stops waiting as soon as a "could not be inserted" alert appears. It also records every wording the status line shows during an upload, which `uploading_indicator` reads.
- **The new `fileEmbeddedImage` binding** replaces the stub:
  - `image_address` turns the body's last `@file/<id>` into `/api/files/<id>?type=blob`.
  - `image_inserted_into_text` returns only the image lines in the body.
  - `only_jpeg_and_png_offered` returns the editor's stated rule.
  - `image_rendered_in_published_text` opens `/content/<slug>` and reads the addresses of the stored-file images there.
  - `upload_failure_leaves_text_unchanged` returns the body as it stands.
  
  Each of these returns empty when it reaches the page and finds nothing.

In `bindings.yaml`, all seven are marked `bound`, with a comment explaining the dead button. Nothing else in the surface changed.

**What I could not do:**
- I couldn't type-check or run the suite. No TypeScript or Playwright is installed in the workspace, and running Node needed approval this session doesn't have. I checked the new readers' locator logic by running the same queries live in the browser.
- I never saw an "uploading" wording, because a 1×1 image is stored too fast to show one. So `uploading_indicator` is bound but unconfirmed.
- While exploring I published one image into the live `about-us` page. The seed restores it before each test, but the running target holds that change until then.

Every route in `surface.yaml` that I opened this run resolved.

## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

Question: does the bind-adapter-new-17 adapter bind every surface action and observation on the new target's file-embedded-image page, and nothing else? Ruling: approve. The old unbound reason (/content/:slug/edit answers 'Page not found') is replaced by observed evidence: signed in as the administrator, /content/about-us/edit shows the 'Formatting for Body' toolbar with 'Insert image' and its stated JPEG/PNG rule. All seven members are bound to navigation and readers only. The readers return the body's image references, the stated rule, the status wordings, the image addresses on the published page and the current body, each empty when nothing is found, and none decides a pass. imageAddress maps the body's own @file/<id> reference to its served form without guaranteeing R-8.29's 'not the address' assertion: a body holding a real address would come back unchanged and fail it. uploadBodyImage arms the filechooser wait before pressing the control (index.ts:1091), so 'opened no file chooser' is the application failing a person, and reporting it as a plain failure rather than unbound correctly leaves R-7.26 and R-8.29 to fail on their own tests. Nothing under tests/acceptance changed, no protected path is touched, the runner's typecheck of adapters/new passed with no diagnostics, and the failing egress check names only files outside this diff. Residual: uploading_indicator is bound but unobserved, because a small image is stored too fast to show an uploading wording. Tier is STANDARD and no residual risk is marked unaccepted, so there is no escalation. What would change the ruling: verify evidence that the control does open a chooser the helper failed to catch, which would make this an adapter fault and a return to bind-adapter.

**Conditions:**
none

### Runner-owned typecheck evidence

Proposal revision: `042b95e2e248a0a8d8ce4125daf6b06be6f3f767`
Typecheck: **passed**; exit code: 0.
Command (in `tests`): `node node_modules/typescript/bin/tsc --noEmit --incremental false --pretty false`
Diagnostics below are those under `adapters/new/`, which this proposal answers for.

    No diagnostics.
