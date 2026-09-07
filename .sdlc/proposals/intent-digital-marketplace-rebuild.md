---
gate: G0
question: "Is this the right problem and outcome?"
recommendation: "Two files touched, both inside my boundary: one new intent document and one row added to the constitution."
opened: 2026-09-07T00:15:57.203Z
---

# Is this the right problem and outcome?

**Recommendation.** Two files touched, both inside my boundary: one new intent document and one row added to the constitution.

Two files touched, both inside my boundary: one new intent document and one row added to the constitution.

---

I read `intent/brief.md` in full — it is six sentences of prose across three paragraphs — and then walked `intent/.template.md` section by section, asking of each what the brief actually says, and writing down only that.

**What I produced.** `intent/digital-marketplace-rebuild.md`, slugged from the brief's title "Digital Marketplace rebuild". Every section is filled; no section kept its template guidance text, because the brief gave something for each one, though in two places what it gave was thinner than the section wants.

**Where the brief was strong.** Affected users, systems and constraints came almost verbatim. The brief names the three roles (staff publishing opportunities, staff evaluating and awarding, vendors registering and submitting), the systems around the work, and six explicit constraints plus two more implied by the second paragraph — sandbox-only operation and behaviour preservation. I recorded the technologies the brief names (a kept database schema, Keycloak sign-in, a design system, the deploy target of the existing application) as constraints and as system identities, and kept them out of the problem and outcome sections, where they would have started doing architecture I have no business doing.

**Where I refused to fill a gap.** Two places, and they are the substance of this run.

The first is the problem statement. The brief explains the *purpose* of the rebuild — prove the pipeline can recover a specification and rebuild to it, and produce a code base that could later replace the old one — but it never says who is currently stuck or what the existing application costs anyone. I wrote the problem from the two facts the brief does supply (a bespoke front-end framework, and no specification held anywhere but the running system) and then said plainly in the document that the brief names no user or operator pain, with a matching open question. It would have been easy and wrong to write "the legacy stack is hard to maintain and slows delivery" — nobody said that.

The second is the outcome. "Measurable parity" is the brief's own phrase, and it is an aspiration wearing a metric's clothes: no measure, no threshold, no judge. Per the discipline I recorded it as the outcome as stated, said in the document that it is not yet checkable, and opened questions on the measure and on who judges. I did salvage two conditions that *are* checkable as written — that nothing ships to the live service, and that the artifact is a code base the product owners could later choose to adopt — so the section is not entirely un-testable while the parity question is outstanding.

**Open questions.** Fifteen, all phrased as questions back to the brief's author. Two are the brief's own, carried forward deliberately rather than resolved: which recovered behaviours are bugs rather than intent, and which program variants differ only by configuration. The brief explicitly expects the pipeline to surface those rather than answer them, so treating them as settled would have contradicted it. The remaining thirteen are gaps I found: how parity is measured and who rules on it; whether all three programs are in scope and in what order; whether "keeping its behaviour" covers the whole application; what the "modern, opinionated stack" is, since the brief names it only by adjective; who rules that a criterion requires a schema change; where sandbox data comes from given that fixtures may carry no personal data; which identity provider instance the sandboxes sign in against; where the sandboxes run; whether there is a date; whether the ban on consulting the old application's tests extends past specification-writing and to its source and docs; and what the product owners would need to see to adopt the result. The count is high relative to the brief's length, which is the honest signal here — a six-sentence brief cannot answer a template this size, and a document with fewer questions would have meant I invented answers.

**Constitution.** One term of art the brief defines that the J4 table did not carry: *Digital Marketplace* itself, which the brief's first sentence defines. I added the row using the brief's own words. Every other term the brief uses — opportunity, proposal, organisation, affiliation, evaluation stage, award, the three programs — already has a row. I considered adding *parity*, and did not: the brief uses the word but never defines it, so any row would have been my definition rather than the author's. It is an open question instead.

**What I could not do.** Nobody is available to answer the fifteen questions, so none of them are closed; the intent goes forward with its outcome not yet measurable, and a later stage or the brief's author will have to settle at least the parity measure before anything downstream can claim success against it. I did not look outside the brief — no reading of the existing application, no inference from similar procurement systems — so if the brief is itself wrong or incomplete about the service, that error is faithfully reproduced in the intent and the open questions are the only place it will surface.
