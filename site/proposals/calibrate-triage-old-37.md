| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T06:52:21.236Z |
| holder | agent:reviewer |

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-8.29 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-8.29 · v1

An image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed.

- given: an administrator editing a page's body with the image control
- when: they choose an image and it is accepted
- then: the image is inserted into the text as a reference the service resolves for itself, and a reader of the finished page sees the image
- test: tests/acceptance/files/R-8.29.spec.ts

**an image placed into a piece of formatted text is stored as an ordinary file marked readable by anyone, and the text refers to it by an internal marker that is turned into a download address only when the text is displayed** — failed

```
Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31m""[39m
```

## Triage conditions

One condition per line, one for every criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
  On an unbound row it sends the binding back to `bind-adapter` however often it has been sent.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID. On an unbound row, use it when the criterion itself looks suspect.
- `oracle-cannot <ID>: <why>` — only for a row listed as unbound, on the oracle's target: the
  oracle genuinely cannot be driven into, or observed in, the state the test needs without
  changing its code — the state sits behind an external identity provider, is reachable only
  through a link the application emails, or is enforced only by a browser-native dialog.
  `<why>` names that state and why the oracle cannot reach it. It closes the row, changes no
  criterion, and stands until the criterion's version changes. It is never a way to skip binding
  work: where the application offers the control under another label, behind a step or as
  another persona, the answer is `adapter-wrong`.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.


## Ruling

**Verdict:** approve
**By:** agent:reviewer
**Ruled on:** claude claude-opus-5-5 (2.1.284 (Claude Code))

The question is whether this project's adapter caused R-8.29 to fail against old, where a truthiness check received an empty string. Approved, with R-8.29 sorted as a product question. The earlier suspect was fileEmbeddedImage.imageRenderedInPublishedText, and bind-adapter-old-51 has fixed it: it now waits with ready() and polls for about 5 seconds for an image at /api/files/<id>. It also reads only the h1's following siblings, which is the right place. The old app draws <h1>, then DateMetadata, then <Markdown source={content.body}> as siblings inside one Col (sources/old/src/front-end/typescript/lib/pages/content/view.tsx:111-121). So the adapter reaches the drawn page and reads the body region. The empty answer is explained by the old app itself. The editor stores the image in the body as ![name](FILE_ID:<uuid>). The old Markdown view (lib/views/markdown.tsx) hands that to react-markdown ^10.1.0 with no urlTransform set. That library's default URL filter blanks any URL whose scheme is not http, https, mailto, irc, ircs or xmpp, and 'FILE_ID:' parses as such a scheme. So the custom img renderer receives an empty src, decodeImgSrc('') returns '', and the page draws <img src="">. The adapter correctly drops that and reports no image. The reader of the finished page does not see the image, which is exactly what the criterion's 'then' clause asks for, so whether that is an old-app defect is the product owner's call. What would change this ruling: a rerun that pins the empty value to a line other than imageRenderedInPublishedText, such as inserted, fileId, readableWhenSignedOutIfPublic or fileContents, and shows the adapter reading the wrong field or answer there.

**Conditions:**
- product-question R-8.29
