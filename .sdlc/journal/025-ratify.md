---
stage: "ratify"
title: "ratify"
at: "2026-09-07T05:01:47.135Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify notifications: 19 accepted, 7 still open, 0 obsolete, 5 replacement(s) added.
Still open:
- D-notifications-11 (inferred) — the record holds the moment the request was made rather than a yes or no, so an account that has never asked and an account that has asked and then changed its mind are indistinguishable afterwards. Combined with the profile-completion page never being shown to a public sector employee, this means such a person is never offered the choice at the point where it is first offered and receives no new-opportunity notices unless they later find the setting themselves.
- D-notifications-12 (inferred) — the control is offered without a confirmation in either direction here, whereas the same choice made from the notification settings asks the person to confirm before turning notices off.
- D-notifications-13 (inferred) — the control is hidden below the medium breakpoint and shown above it. The choice itself remains reachable from the notification settings, so nothing is unreachable, but the shortcut is silently absent rather than moved. No corrected criterion is offered; whether the new service shows this control at every width is a design decision rather than a recovered rule.
- D-notifications-15 (inferred) — the announcement is offered only on the terms and conditions page and nowhere else, and only to an administrator; the same request made by anybody else, signed in or not, is refused. Acceptance is withdrawn for every vendor including deactivated ones, while only active vendors are told, so a vendor deactivated at the time of the change learns of it only on returning. This route appears in no published interface description.
- D-notifications-17 (inferred) — the withdrawal of acceptances is completed before the response, so the part of the action a vendor will notice on their next visit is reliable; only the messages are not. Delivery failures are invisible for the reason given in R-6.2, so a run that reaches nobody looks exactly like one that reaches everybody.
- D-notifications-20 (inferred) — this message uses a layout of its own rather than the layout every other message uses, leading with the opportunity's title and the winner's name. Where no successful proponent is recorded the name is replaced by a dash rather than the sentence being omitted, so a reader can be shown "awarded to —".
- D-notifications-21 (open) — accounts without an email address are allowed deliberately, and most messages guard against one only by substituting an empty list of recipients where the address would go — the message is still composed and still handed over to be sent. Whether that produces a rejected send, a silently discarded one, or an error that stops the rest of a broadcast is not decidable from the source, and because delivery failures are only logged, nothing inside the service would show which. The one place that does check is account creation, which skips the welcome message when there is no address. A human should rule on whether the new service must skip a recipient with no address everywhere, and on whether one such recipient may stop a broadcast to the rest.