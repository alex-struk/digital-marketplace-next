---
gate: G3
question: "1 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-8.31 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-30T00:42:10.456Z
---

# 1 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-8.31 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

1 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each one against it and against the test.

### R-8.31 · v1

Removing an attachment from an opportunity or a proposal, or deleting the opportunity or proposal it hangs on, withdraws every read path the file held through that association, and a file that no record refers to any longer is identifiable as detached so that stored content can be disposed of under the records-retention rule for procurement attachments, which is set outside this domain.

- test: tests/acceptance/files/R-8.31.spec.ts

**removing an attachment from an opportunity withdraws the read path the file held through that opportunity** — failed

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

Which failing criteria did this project's adapter cause? R-8.31's first scenario fails at its first check: attachmentAddress() gave back an empty string on a published Code With Us opportunity, before the test reached the removal it is about. That points at the adapter. addAttachment only saves the form on Team With Us opportunities, so on a Code With Us opportunity the added file stays an unsaved blob: preview. attachmentAddress() then tries 'Save Changes' before 'Publish Changes' (saveAttachmentForm uses the opposite order), and it returns an empty string silently when no save is found or no /api/files/ link appears. The draft-opportunity and proposal scenarios get past the same step, the old application is the reference and keeps attachments on published opportunities, and four earlier triage rounds traced this criterion's failures to the adapter. Approved with one triage condition. This would become a product question if a trace showed the published opportunity saved and the old application still offered no /api/files/ link.

**Conditions:**
- adapter-wrong R-8.31: on a published Code With Us opportunity fileAttachmentControl.attachmentAddress() returns '' because the added file is never stored: addAttachment saves the form only on Team With Us opportunities, and attachmentAddress tries 'Save Changes' before 'Publish Changes' and returns empty rather than failing when no save is found or no /api/files/ link appears; save a published opportunity through 'Publish Changes' and confirm 'Publish Changes to Code With Us Opportunity?' (as saveAttachmentForm does), wait for the /api/files/ link, and throw naming the missing control instead of returning ''
