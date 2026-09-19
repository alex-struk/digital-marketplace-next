---
gate: G-DESIGN
question: "Do these screens serve the content criteria, and are they built out of the design system?"
recommendation: "I designed all six content-domain surfaces."
opened: 2026-09-19T07:35:46.753Z
---

# Do these screens serve the content criteria, and are they built out of the design system?

**Recommendation.** I designed all six content-domain surfaces.

I designed all six content-domain surfaces. There are 27 stories under `design/catalogue/`, entries appended to `design/screens.yaml`, a "Domain: content" section appended to `design/DESIGN.md`, and every `test_id` on the six pages filled in `spec/contract/surface.yaml`. I had no shell to compile or scan the catalogue, so the scan's result in `design/report.json` is the evidence for it. The earlier report there showed every existing story compiling and passing.

**Screens and states**
- **content-footer** — one state, `default`. The footer is the same whether or not the visitor is signed in, so it needs no second state.
- **content-service-level-agreement-link** — one state, `default`. It shows the link beside the program's cost on the Code With Us learn-more screen, pointing at `/content/service-level-agreement`. What the link leads to is the public page's `default` state.
- **content-list** — `default`, `deleted`, `loading`, `not-found`. `deleted` exists because R-7.9 sends the administrator back to the list after removing a page and tells them it was removed. There is no empty state: the pages the service needs can never be removed, so the list can never be empty.
- **content-create** — `default`, `invalid`, `ready`, `publish-confirm`, `duplicate-slug`, `not-found`. `ready` is separate because Publish is unavailable until the form is valid. `duplicate-slug` is separate because only the service can know an address is already taken, so that refusal comes after the person confirms.
- **content-edit** — `default`, `fixed`, `created`, `editing`, `editing-fixed`, `invalid`, `duplicate-slug`, `publish-confirm`, `changes-published`, `delete-confirm`, `loading`, `not-found`.
  - The fixed variants are genuinely different screens: a page the service needs shows a warning, no Delete, and a read-only address (R-7.25). The `fixed` story also shows "System" as publisher and last editor, and the "Initial version" stub body (R-7.12, R-7.27).
  - `created` exists because R-7.7 sends a new page's creator to its managing screen.
- **content-view** — `default`, `loading`, `not-found`. An unknown address and a malformed one look the same to a person (R-7.2, R-7.3), so they share one state.

**Components**
- The design-system components I relied on most are `TextField`, `TextArea`, `Button` and `ButtonGroup`, `InlineAlert`, `Modal` with `AlertDialog`, `Link`, `Heading` and `Text`.
- `Footer` and `FooterLinks` are new to the catalogue. I checked their props against the type declarations of the installed 0.8.1 package, which I found in a local copy of the project.
- `DESIGN.md` lists two new components of this project's own, not the design system's:
  - **A body editor.** The design system has no rich-text or markdown editor. This one is put together from existing parts: a `Toolbar` from `react-aria-components` holding design-system `Button`s, the design system's `TextArea`, and a `FileTrigger` limited to JPEG and PNG.
  - **A formatted-text renderer.** It never executes raw markup, and it is the only renderer allowed anywhere, including where other screens embed a body (R-7.17).
- I also reused the earlier domains' own components: the key facts list, the data table and the status badge.
- The title and body have no length limit on input. R-7.20 requires an overlong body to be marked with its reason, and a length limit would silently cut it instead.
- I used only tokens the earlier domains already use, and wrote out no colour or size value.

**Test IDs**
- Every action and observation on the six pages is filled. The same element keeps the same ID across create and edit, and I reused `field-error` and `not-found-page` from the users domain.
- Some bindings are not obvious from their names:
  - `published_success` (listed under create) and `deleted_success` (listed under edit) point to alerts on the screens the person lands on: `content-edit.created` and `content-list.deleted`.
  - `answer_at_link_target` is the public page's article wrapper, `content-page`.
  - `link_target_address` is the service level agreement link itself; the target is its `href`.
- `version_history` is bound to `content-version-history`, which **no story renders, on purpose**. R-7.23 says nothing in the service shows an earlier version, so a test can only check that it is absent.
- I asked the files domain to bind `file-embedded-image.upload_body_image` to `content-body-image-button`, since it is the same control. I asked the opportunities domain to use `service-level-agreement-link` on the program cards and forms. Its earlier gap 22 left that address to this domain.

**Gaps**

All 14 are recorded in `DESIGN.md`. None was filled by inventing behaviour.
- **Page count.** R-7.12 says a fresh installation has twenty-two pages. The ruling that drops the seven unlinked pages, plus R-7.18's added service level agreement page, make it sixteen.
- **Outcomes on the wrong page.** The surface lists two success messages under pages other than the ones the person lands on.
- **Invalid submission against an unavailable button.** R-7.20 describes submitting an invalid form, but the surface says Publish is unavailable until the form is valid.
- **Public page address.** No criterion says the public page shows its own address. I added a small line so `page_address` has something to bind to.
- **Learn-more screen.** No page in the surface designs it, and no criterion says what the service level agreement page says. On a fresh installation it reads "Initial version".
- **Rename warning.** The address field's description says renaming breaks links. R-7.24 says the old service gave no warning, so this needs a ruling.
- **Two administrators editing one page.** The screen cannot warn of an overwrite (R-7.28), and the rarer refused case has no wording.
- **Unworded failures.** No criterion says what an administrator sees when publishing, deleting or loading fails for other reasons.
- **Editor detail.** Which formatting shortcuts, which markup dialect, whether there is a preview, and how images get alternative text are all unstated.
- **Dates and footer.** No date format or time zone is given. Whether the footer keeps the design system's default gov.bc.ca contact block is not stated.
- **Placeholder wording.** Every message and every page body in the stories is the design's own wording or a marked placeholder.
