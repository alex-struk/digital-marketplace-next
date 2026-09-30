| Field | Value |
| --- | --- |
| gate | G3 |
| opened | 2026-09-30T02:07:50.086Z |
| holder | agent:reviewer |

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

Question: did this project's adapter cause R-8.31's failure against old? Ruling: approve, triaging R-8.31 as adapter-wrong. The test failed on its setup check expect(fileId).toBeTruthy() (spec line 69) with "": file-attachment-control.attachment_address returned an empty string right after add_attachment on a freshly published Code With Us opportunity. So the run never reached the vendor read or the removal the criterion is about, which means it failed on the way to the place the test asks about. The bind-adapter run in journal 279 saw the old target store exactly this addition: after "Publish Changes" and its "Publish Changes to Code With Us Opportunity?" confirmation, the Attachments step links the file at /api/files/<id>. That run also recorded that it neither compiled the adapter nor re-ran the criterion. In the adapter, add_attachment returns silently when it sees no "Publish Changes" in the top bar or no blob: preview (index.ts 8702-8708), so an upload that never took goes unreported, and attachment_address then returns an empty string instead of raising. The evidence points at the binding, not the product. This ruling would change if a re-bound adapter demonstrably reaches the Attachments step of the saved opportunity, finds neither a preview nor a stored link, and says so, which would make this a product-question.

**Conditions:**
- adapter-wrong R-8.31: on a Code With Us opportunity just published by opportunity-cwu-create.publish and opened by file-attachment-control.open, add_attachment followed by attachment_address returned an empty string, although the target stores the file and links it at /api/files/<id> once "Publish Changes" and its confirmation are accepted; add_attachment must raise when the upload leaves neither a blob: preview nor a stored /api/files/ link, or when no save control is offered, instead of returning silently, and attachment_address must confirm it is on the Attachments step of that same opportunity, in whatever read-only or edit state the publish left it, and raise rather than return empty when it finds no link there
