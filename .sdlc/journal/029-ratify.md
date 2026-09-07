---
stage: "ratify"
title: "ratify content"
at: "2026-09-07T08:31:47.863Z"
cost: 0
turns: 0
session: "deterministic"
---

ratify content: 29 accepted, 0 still open, 2 obsolete, 0 replacement(s) added.
Obsolete:
- D-content-26 — The screens this was recovered from do not behave this way - the !body guard at sprint-with-us-terms.tsx:136 and team-with-us-terms.tsx:135 is dead code, because cmd.ts:93-96 maps a 404 to an always-truthy invalid value, so a missing terms page falls through to the else branch, keeps the empty body it was initialised with, and renders the title, an empty block and a live Accept Terms and Conditions button; the only screen that genuinely becomes the not-found screen when its page cannot be read is pages/content/view.tsx:75-86, which carries no action to block. Nothing of this row is carried forward, and two criteria are owed in its place - the content view screen's not-found handling, and the defect that a program's qualification terms can be accepted with nothing shown in place of them.
- D-content-27 — The rebuild does not create pages for itself that nothing in it links to. The seven concerned — the opportunity and proposal guides of all three programs and the Team With Us opportunity scope page — were superseded by the built-in learn-more screens and survive only as unremovable rows an administrator cannot clean up. Rows already present in an existing installation are untouched, since the schema is kept.
Unknown conditions (reported, not applied):
- confirm D-content-1
- confirm D-content-3
- confirm D-content-4
- confirm D-content-5
- defect D-content-18: A request refused for lack of permission is reported as a permission refusal, in the same shape for every page request, whether it reads the list, reads one page, or creates, changes or removes one.
- defect D-content-22: A page's body is rendered as formatted text only; markup embedded in it is never executed, and the same body renders identically on the page's own address and wherever another screen embeds it.
- defect D-content-28: The service level agreement page is one the service creates for itself, so every screen that links to it — the learn-more index, the program cards, and the Code With Us, Sprint With Us and Team With Us opportunity forms — resolves on a fresh installation.