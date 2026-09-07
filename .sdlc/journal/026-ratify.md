---
stage: "ratify"
title: "ratify"
at: "2026-09-07T05:06:31.342Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify notifications: 28 accepted, 0 still open, 0 obsolete, 2 replacement(s) added.
Unknown conditions (reported, not applied):
- confirm D-notifications-2
- confirm D-notifications-5
- confirm D-notifications-7
- edit D-notifications-4: Every message the service sends comes from a single configured sender — a display name followed by one do-not-reply address, the same for every kind of message — and carries no reply-to address distinct from that sender.
- edit D-notifications-6: Every message the service sends ends with an offer labelled Unsubscribe, which opens the reader's own notification settings with the unsubscribe confirmation already asked.
- defect D-notifications-9: A notice sent to more than one person must hide every recipient from the others, carrying the batch as blind copies with the service's own address as the visible recipient, and this applies to the notices sent to an evaluation panel and to an opportunity's owner exactly as it does to every other multi-recipient notice.
- defect D-notifications-10: A message that the notification preference does not govern must not offer to unsubscribe; it links to the reader's notification settings without implying that any choice there will stop messages of that kind.
- defect D-notifications-14: A deactivated account receives no notification of any kind, including notices about opportunities it was watching, while the watch itself is retained so that reactivating the account restores it.
- defect D-notifications-16: The message announcing changed terms names every program whose proposals require a current acceptance — Code With Us, Sprint With Us and Team With Us — or names none of them rather than a subset.
- defect D-notifications-19: The administrator's notification reference page shows every message the service can send, so that no message exists which cannot be previewed there before the event that sends it.