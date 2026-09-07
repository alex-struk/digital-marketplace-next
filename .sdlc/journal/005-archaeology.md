---
stage: "archaeology"
title: "archaeology: post-checks failed"
at: "2026-09-07T00:53:43.512Z"
cost: 0
turns: 0
session: ""
---

Work is complete. Here is the journal entry.

---

**Opportunities domain — archaeology run**

An opportunity is a procurement posting that a public sector employee writes, an administrator publishes, vendors respond to, and a panel or an administrator eventually awards or cancels. It exists in one of three programs — Code With Us, Sprint With Us, Team With Us — which share a common skeleton (draft → awaiting review → published → one or more evaluation states → processing → awarded, with cancellation available from publication onward) and differ in what they ask for: a single reward and criteria for the first, budgeted delivery phases and team questions for the second, named resources drawn from a fixed list of service areas and resource questions for the third. Around that spine sits everything that makes the posting usable: who can see it in which state, what makes it complete enough to publish, the addenda and private notes that accumulate on it, the watchers who get told when it changes, the view and proposal counts its author can see, and a nightly-in-effect sweep that closes it and moves its proposals into review the moment its deadline has passed.

I recovered 48 criteria into `spec/domains/opportunities.md`, all provisional `D-opportunities-<n>` identifiers, all `origin: recovered`, each with at least one citation into `sources/old`. I also filled `spec/contract/surface.yaml` with the thirteen pages the domain presents (list, program chooser, three create forms, three public views, three tabbed edit pages, and an administrator-only completed-opportunity report), and `spec/contract/personas.yaml` with the six roles the domain distinguishes — anonymous visitor, vendor, public sector employee, administrator, and the per-opportunity evaluation-panel evaluator and chair, which are granted on one opportunity rather than globally. `spec/spec.md`'s opportunities section now points at the domain file instead of claiming there are no criteria.

**Where the sources disagreed.** Four places, and they are not all the same kind of disagreement. The application's README and its database-schema document describe a two-program service; the code carries a full third program, Team With Us, with its own routes, tables, statuses and evaluation panel. Those documents are simply stale, and I treated the code as authoritative while recording the gap. The interface description for Code With Us is stale in two smaller ways: it lists only two creation states where the code has accepted three since a migration added the awaiting-review state, and it says deletion requires a draft where the code also permits an administrator to delete one that is awaiting review. Those three I graded as code-with-a-stale-document.

The two genuine unresolved conflicts are different. First, the rule that decides which state changes are permitted omits processing-to-awarded for Team With Us alone, while the award path writes the awarded state directly and bypasses that rule — so awarding works, but the service's own definition of a legal transition says it should not. Either the omission is an oversight or the award path is, and nothing in the sources settles it; that is `D-opportunities-23`, graded open. Second, the screens hide editing of a published opportunity from anyone but an administrator, while the server accepts such an edit from the opportunity's own author — so the observable behaviour depends on whether the request arrives through the service's own pages; that is `D-opportunities-32`, also open.

I recorded one behaviour as a defect rather than as intent. The permission check for creating a Code With Us opportunity ignores the requested starting state, so a public sector employee who is not an administrator can create one that is already published — it becomes publicly visible and its subscribers are notified, with no administrator ever having approved it. The other two programs explicitly bar that at creation, and the publish action itself is administrator-only in all three. I proposed no replacement, because whether to close the hole at creation or to widen who may publish is a product decision, not a recovery one.

**What I could not determine.** Three things. The measure of "complete enough to publish" differs between programs in a way I could describe but not explain: Code With Us re-validates the whole posting at publication, while Sprint With Us validates at submission for review and explicitly declines to repeat the check at publication, on the stated assumption that review already covered it — nothing says whether an administrator editing an opportunity between those two points is meant to be able to publish something incomplete. The Team With Us maximum budget has no upper bound while the other two programs are capped at seventy thousand and five million dollars; I could find no statement anywhere of whether that asymmetry is deliberate. And the closing sweep is not a scheduled job at all — it is a throttled step that runs before handling incoming requests, so an opportunity closes on the first request that happens to arrive after its deadline rather than at the deadline; whether "closes at the deadline" or "closes on next traffic" is the intended behaviour is not recorded, and on a quiet service the difference is observable.

One process note for whoever picks this up: `spec/README.md`, named in my instructions as the grammar this file is checked against, does not exist in the repository. I followed the criterion format stated in `spec/spec.md`'s header — identifier, version, confidence, statement, citations, reconciliation class — extended with the origin and given/when/then fields the task required. If a parser expects something stricter, the domain file may need reshaping rather than rewriting; the content is field-per-line and uniform, and a structural check confirms all 48 blocks carry origin, reconciliation, given, when, then and at least one citation.

spec/domains/opportunities.md:20: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:21: expected a heading (### ID · vN · confidence · origin), got: The system shall offer three opportunity programs — Code With Us, Sprint With Us and Team With Us — and every opportunity shall belong to exactly one of them.
spec/domains/opportunities.md:23: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:24: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:25: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:26: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:27: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: cites: README.md:5
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:13
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: given: a person browsing the service
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: when: they open the opportunity list
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: then: opportunities of all three programs are listed, each labelled with its program, and no opportunity belongs to more than one program
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: note: The application's own README describes only Code With Us and Sprint With Us, and the database-schema document lists no Team With Us tables at all, while the code carries a complete third program with its own routes, statuses, resources and evaluation panel. Both documents are stale rather than describing a different intent; the code is treated as authoritative here, and the disagreement is recorded rather than resolved.
spec/domains/opportunities.md:35: malformed heading: ### D-opportunities-2 (v1) [confidence: confirmed]
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public state.
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:9
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has never been published
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a signed-in vendor asks for the opportunity list, or for that opportunity directly
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity does not appear in the list, and a direct request for it is answered as not found
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-3 (v1) [confidence: confirmed]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every public opportunity plus the unpublished opportunities they themselves created, and shall show an administrator every opportunity.
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: given: two unpublished opportunities, one created by public sector employee A and one by public sector employee B
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: when: employee A asks for the opportunity list
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: then: A's own unpublished opportunity is listed and B's is not, while an administrator making the same request sees both
spec/domains/opportunities.md:60: malformed heading: ### D-opportunities-4 (v1) [confidence: inferred]
spec/domains/opportunities.md:61: expected a heading (### ID · vN · confidence · origin), got: The system shall treat an opportunity as public once it has been published and thereafter — through every evaluation state, processing, award and cancellation — and shall treat it as private only while it is a draft or awaiting review.
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:130
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:124
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has been published and later cancelled
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor asks for it
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: then: it is still returned, showing its cancelled state
spec/domains/opportunities.md:72: malformed heading: ### D-opportunities-5 (v1) [confidence: inferred]
spec/domains/opportunities.md:73: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only public sector employees and administrators to create an opportunity, and shall refuse creation to vendors and to anyone not signed in.
spec/domains/opportunities.md:75: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:76: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:37
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: given: a signed-in vendor
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: when: they attempt to create an opportunity of any program
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: then: the attempt is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:85: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got: The system shall accept an opportunity created as a draft, as submitted for review, or as published, and shall reject any other requested starting state.
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:89: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:90: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:39
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:62
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:180
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:197
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: when: they ask for it to start in an awarded or cancelled state
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: then: the request is rejected with a validation error naming the state
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: note: The Sprint With Us interface document lists the three accepted starting states; the Code With Us document lists only draft and published, omitting the awaiting-review state that the code has accepted since the migration that introduced it. The Code With Us document is stale.
spec/domains/opportunities.md:99: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: The system shall save a draft opportunity without checking that its content is complete, filling any missing or invalid dates with a default two weeks ahead.
spec/domains/opportunities.md:102: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:412
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:363
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee with an empty opportunity form
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: when: they save it as a draft
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: then: the draft is created and is retrievable, with dates defaulted rather than rejected
spec/domains/opportunities.md:111: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:112: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity that is not a draft when any required field is missing or out of range, reporting the errors field by field.
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:295
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:588
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:413
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity to be published
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got: when: they omit the description and the location
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is not created and the response names the description and the location as the fields at fault
spec/domains/opportunities.md:123: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:124: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Code With Us reward between one dollar and seventy thousand dollars inclusive, a Sprint With Us total maximum budget between one dollar and five million dollars inclusive, and a Team With Us maximum budget of at least one dollar with no upper bound.
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:28
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:30
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:176
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing a Code With Us opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: when: they set the reward to eighty thousand dollars
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the reward is named as the field at fault
spec/domains/opportunities.md:136: expected a heading (### ID · vN · confidence · origin), got: note: The absence of an upper bound on the Team With Us budget is asymmetric with the other two programs. Nothing in the sources says whether that is deliberate; it is recorded as it stands.
spec/domains/opportunities.md:138: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: The system shall require the scoring weights of a Sprint With Us or Team With Us opportunity to total one hundred percent.
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:616
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:437
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:146: expected a heading (### ID · vN · confidence · origin), got: when: the four scoring weights total ninety percent
spec/domains/opportunities.md:147: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that the scoring weights must total one hundred percent
spec/domains/opportunities.md:149: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then assignment date, then start date, then completion date — with the proposal deadline no earlier than the day the opportunity is saved, and shall record each date at four in the afternoon.
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:157: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity
spec/domains/opportunities.md:158: expected a heading (### ID · vN · confidence · origin), got: when: they set an assignment date earlier than the proposal deadline
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the assignment date is named as the field at fault
spec/domains/opportunities.md:161: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall measure its new proposal deadline against the old deadline rather than against today, unless the opportunity is still a draft.
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:453
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:551
spec/domains/opportunities.md:169: expected a heading (### ID · vN · confidence · origin), got: given: a closed opportunity whose proposal deadline was last month
spec/domains/opportunities.md:170: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits it and leaves the deadline unchanged
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: then: the edit is accepted rather than rejected for having a deadline in the past
spec/domains/opportunities.md:173: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us opportunity that has an inception phase to also have a prototype phase, and shall require every phase to carry at least one required capability, a budget no greater than the opportunity's total, and dates that follow the preceding phase.
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:629
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:117
spec/domains/opportunities.md:180: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:97
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:182: expected a heading (### ID · vN · confidence · origin), got: when: they define an inception phase but no prototype phase
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that a prototype phase must follow an inception phase
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Team With Us opportunity to name one or more resources, each drawn from a fixed set of service areas and each with a target allocation between one and one hundred percent of full time.
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:239
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Team With Us opportunity
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: when: they name a resource in a service area the service does not offer
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and that resource is named as the item at fault
spec/domains/opportunities.md:197: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:198: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity to carry up to one hundred scored questions, each with a word limit of at most three thousand words and, where a minimum score is set, a minimum below the question's available score.
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:16
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:344
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:362
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:82
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee writing a question worth five points
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: when: they set the question's minimum score to five
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the minimum score is named as the field at fault
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall require the evaluation panel of a Sprint With Us or Team With Us opportunity to hold at least two members, all of them public sector employees, with no member listed twice and no more than one chair.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:431
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:511
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:32
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:34
spec/domains/opportunities.md:220: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee assembling an evaluation panel
spec/domains/opportunities.md:221: expected a heading (### ID · vN · confidence · origin), got: when: they name two chairs, or name a vendor as a panel member
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message naming the panel as the item at fault
spec/domains/opportunities.md:224: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity of any program.
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:632
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1354
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:760
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity awaiting review, created by a public sector employee
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got: when: that employee asks to publish it
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and the opportunity stays unpublished
spec/domains/opportunities.md:237: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: The system shall allow a public sector employee to submit their own draft opportunity for review, and shall refuse the submission if the opportunity's title, teaser, remote-work answer, location or description is incomplete.
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:241: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:242: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:705
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1354
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity with no description
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: then: the submission is refused with a message that the opportunity is incomplete and must be completed before it can be published
spec/domains/opportunities.md:248: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse a request from a public sector employee to create a Sprint With Us or Team With Us opportunity that is already published.
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:252: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:253: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: when: they create a Sprint With Us opportunity asking for it to start published
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:259: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: A public sector employee who is not an administrator can create a Code With Us opportunity that is already published, so that it becomes publicly visible and its subscribers are notified without any administrator having approved it.
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got: reconciliation: defect
spec/domains/opportunities.md:264: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:265: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:187
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:394
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: when: they create a Code With Us opportunity asking for it to start published
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is created in a published state and the publication notice is sent
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: note: This contradicts D-opportunities-17 and the equivalent rule the other two programs enforce at D-opportunities-19: the permission check for creating a Code With Us opportunity ignores the requested starting state, so the administrator-only publication rule can be bypassed at creation time. No replacement criterion is proposed, because whether the fix is to bar the state at creation or to widen who may publish is a decision for the people who own the service.
spec/domains/opportunities.md:272: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Code With Us opportunity only along the sequence draft, awaiting review, published, evaluation, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:275: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:276: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20231102143211_cwu-opp-under-review.ts:27
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts:28
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: given: a published Code With Us opportunity
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to draft
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays published
spec/domains/opportunities.md:284: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Sprint With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, code challenge, team scenario, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:288: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:289: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge state
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to question consensus
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays in the code challenge state
spec/domains/opportunities.md:294: malformed heading: ### D-opportunities-23 (v1) [confidence: open]
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Team With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, challenge, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:299: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:300: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:501
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: given: a Team With Us opportunity in the processing state
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards a proposal on it
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: note: The rule that decides which changes of state are permitted omits processing-to-awarded for Team With Us, although it permits exactly that change for the other two programs and although the same file elsewhere treats an awarded Team With Us opportunity as a normal outcome. Awarding still works, because the award path writes the new state directly instead of consulting that rule. Two readings are open: either the omission is an oversight and the award transition is intended, or awarding a Team With Us opportunity is meant to be barred and the award path is the defect. Nothing in the sources decides which.
spec/domains/opportunities.md:307: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity's proposal deadline passes, the system shall close it without anyone acting — moving it into its programme's first evaluation state, moving every submitted proposal on it into review, and telling the opportunity's author that it is ready for evaluation.
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:311: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:312: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/hooks/code-with-us.ts:20
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one submitted proposal and a proposal deadline that has just passed
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: when: no one takes any action
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is in its first evaluation state with a history note that it has closed, the proposal is under review, and the author has been sent a ready-for-evaluation notice
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: note: The closing sweep runs as a throttled step before handling requests rather than as a scheduled job, so an opportunity closes on the first request that arrives after its deadline, not at the deadline itself. On a service with no traffic, closure is deferred indefinitely.
spec/domains/opportunities.md:321: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: When every proposal still in contention on an opportunity has been evaluated, the system shall move the opportunity into processing without anyone acting, recording that it did so.
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:326: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:327: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation with three proposals still in contention, two of them already evaluated
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: when: the third is evaluated
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity moves to processing and its history shows that it was moved automatically because all proposals had been evaluated
spec/domains/opportunities.md:332: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: When a proposal on an opportunity is awarded, the system shall mark the opportunity as awarded and shall show the successful proponent on it.
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1159
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:339: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:340: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in processing with several proposals
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards one of them
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded and names the successful proponent, while the other proposals become not awarded
spec/domains/opportunities.md:344: malformed heading: ### D-opportunities-27 (v1) [confidence: confirmed]
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and shall tell the opportunity's author, its subscribers and everyone who has a proposal on it that it has been cancelled.
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:823
spec/domains/opportunities.md:351: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:352: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:96
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: when: an administrator cancels it with a reason
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is cancelled, remains publicly visible as cancelled, and the author, the subscriber and the proposal's author each receive a cancellation notice
spec/domains/opportunities.md:357: malformed heading: ### D-opportunities-28 (v1) [confidence: confirmed]
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an administrator, or the opportunity's own author, to publish an addendum to any opportunity that is no longer a draft, and shall keep every addendum with the time it was added.
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:363: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:403
spec/domains/opportunities.md:364: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:835
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:98
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: when: its author adds an addendum
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: then: the addendum appears on the opportunity for everyone who can see the opportunity, carrying the date it was added
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: note: The interface the service presents offers the addendum action only once an opportunity is public, while the rule the server applies also allows an addendum while an opportunity is merely awaiting review. The server is the more permissive of the two.
spec/domains/opportunities.md:371: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: The system shall tell an opportunity's subscribers, and everyone who has a proposal on it, whenever it is edited or gains an addendum, except while it is a draft or after it has been cancelled.
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:375: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:376: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:908
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its description
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: then: the subscriber, the proposal's author and the opportunity's author each receive an update notice
spec/domains/opportunities.md:383: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall tell every administrator that it is waiting for them and shall confirm the submission to the person who submitted it.
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:388: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:389: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:933
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: then: each administrator receives a notice that an opportunity is awaiting review, and the author receives a confirmation
spec/domains/opportunities.md:394: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall tell every user who has asked for opportunity notifications, and shall confirm the publication to the opportunity's author.
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:957
spec/domains/opportunities.md:401: expected a heading (### ID · vN · confidence · origin), got: given: a user who has turned opportunity notifications on, and an opportunity awaiting review
spec/domains/opportunities.md:402: expected a heading (### ID · vN · confidence · origin), got: when: an administrator publishes it
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: then: that user receives a new-opportunity notice and the opportunity's author receives a publication confirmation
spec/domains/opportunities.md:405: malformed heading: ### D-opportunities-32 (v1) [confidence: open]
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited while it is a draft or awaiting review, and once it is published shall allow only an administrator to edit them.
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity created by a public sector employee who is not an administrator
spec/domains/opportunities.md:415: expected a heading (### ID · vN · confidence · origin), got: when: that employee submits an edit to its description
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: then: unresolved — the interface does not offer them the action, but the server accepts the edit
spec/domains/opportunities.md:417: expected a heading (### ID · vN · confidence · origin), got: note: The interface hides editing of a published opportunity from anyone but an administrator, while the server permits the opportunity's own author to edit it in the published state. Which of the two expresses the intended rule cannot be told from the sources; the observable behaviour therefore depends on whether the request comes through the service's own screens.
spec/domains/opportunities.md:419: malformed heading: ### D-opportunities-33 (v1) [confidence: inferred]
spec/domains/opportunities.md:420: expected a heading (### ID · vN · confidence · origin), got: The system shall keep every version of an opportunity, recording an edit as a new version alongside a dated entry in the opportunity's history rather than overwriting what was there.
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:304
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:156
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its title twice
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity shows the latest title, and its history shows two separate edit entries with the times they were made
spec/domains/opportunities.md:431: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's history, and its counts of views, watchers and submitted proposals, only to an administrator or to the opportunity's own author, and shall show the counts only once the opportunity is public.
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:477
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with views, watchers and proposals
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got: when: a vendor asks for it, and then its author asks for it
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got: then: the vendor receives no history and no counts, and the author receives both
spec/domains/opportunities.md:442: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:443: expected a heading (### ID · vN · confidence · origin), got: The system shall hide who created and who last changed an opportunity from anyone who is neither an administrator nor one of those two people.
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a vendor asks for it
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is returned without naming the person who created or last changed it
spec/domains/opportunities.md:452: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, attach a private note with files to an opportunity's history at any point in its life.
spec/domains/opportunities.md:455: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: when: an administrator adds a note with an attached file
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: then: the note and its attachment appear in the opportunity's history, visible only to those who may see the history
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: note: The note action is absent from the published interface description, which lists only editing, publishing, cancelling and adding an addendum. It is implemented and reachable.
spec/domains/opportunities.md:464: malformed heading: ### D-opportunities-37 (v1) [confidence: confirmed]
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an unpublished opportunity to be deleted and shall refuse to delete one that has ever been published.
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to delete it
spec/domains/opportunities.md:475: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity remains
spec/domains/opportunities.md:476: expected a heading (### ID · vN · confidence · origin), got: note: The interface document says deletion requires the opportunity to be a draft. The code is wider in two ways: an administrator may also delete an opportunity that is awaiting review, and for Team With Us the author as well as an administrator may delete in either of those states, whereas for the other two programs an author may delete only their own draft. Whether the Team With Us difference is intended is not stated anywhere.
spec/domains/opportunities.md:478: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity so as to receive its updates, and shall refuse to let someone watch an opportunity they created themselves.
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:53
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:367
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee viewing an opportunity they created
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: when: they ask to watch it
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that they cannot subscribe to their own opportunity
spec/domains/opportunities.md:490: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got: The system shall count each viewing of an opportunity's public page and report that count among the opportunity's figures.
spec/domains/opportunities.md:493: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with no views
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor opens its page twice
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: then: the view count the author sees increases by two
spec/domains/opportunities.md:501: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: The system shall accept proposals on an opportunity only while it is published and its proposal deadline is still in the future.
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:146
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:139
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity whose proposal deadline has passed
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got: when: a vendor opens it
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is shown as closed and no submission is offered
spec/domains/opportunities.md:513: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:514: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity list into unpublished, open and closed opportunities, ordering open ones by the soonest proposal deadline first and closed ones by the most recently closed first.
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:195
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: given: several published opportunities with different proposal deadlines
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: when: a visitor opens the opportunity list
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: then: the open opportunities appear together with the one closing soonest at the top
spec/domains/opportunities.md:524: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: The system shall let a person narrow the opportunity list by programme, by state, to remote-friendly opportunities only, and by words in the title.
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:530: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:531: expected a heading (### ID · vN · confidence · origin), got: given: a list holding opportunities of all three programmes
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: when: a visitor narrows it to Code With Us
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: then: only Code With Us opportunities remain listed
spec/domains/opportunities.md:535: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has no title as "Untitled" wherever it is listed.
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:141
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity whose title has never been filled in
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got: when: its author opens the opportunity list
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: then: it is listed as "Untitled"
spec/domains/opportunities.md:546: malformed heading: ### D-opportunities-44 (v1) [confidence: inferred]
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity that is described as remote-friendly to also carry a description of its remote arrangements.
spec/domains/opportunities.md:549: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity marked as remote-friendly
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: when: they leave the remote description empty
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the remote description is named as the field at fault
spec/domains/opportunities.md:556: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's evaluation panel to be changed only while the opportunity is a draft, awaiting review, published, or in individual question evaluation, and shall tell members added to or removed from a panel that it has changed.
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:561: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:631
spec/domains/opportunities.md:562: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:585
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2216
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity that has reached question consensus
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to change its evaluation panel
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the panel stays as it was
spec/domains/opportunities.md:568: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity out of question consensus unless every consensus has been submitted and at least one proponent has met the minimum score on every question that sets one.
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1481
spec/domains/opportunities.md:574: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in question consensus where no proponent meets the minimum score on one of the questions
spec/domains/opportunities.md:575: expected a heading (### ID · vN · confidence · origin), got: when: the panel chair asks to finalise the consensus
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that at least one proponent must be able to be screened into the code challenge
spec/domains/opportunities.md:578: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity into team scenario evaluation unless every proponent still in the code challenge has been scored or disqualified, and at least one has been screened in.
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1593
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge with one unscored proponent
spec/domains/opportunities.md:585: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to start the team scenario
spec/domains/opportunities.md:586: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that all proponents must be scored first
spec/domains/opportunities.md:588: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: The system shall offer an administrator a single continuous report of a completed opportunity, gathering its details, summary, addenda, history and proposals in one page.
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/app/router.ts:741
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/complete/index.tsx:184
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: given: an awarded opportunity
spec/domains/opportunities.md:596: expected a heading (### ID · vN · confidence · origin), got: when: an administrator opens its complete report, and then a public sector employee tries the same
spec/domains/opportunities.md:597: expected a heading (### ID · vN · confidence · origin), got: then: the administrator sees the whole report on one page and the other person is refused access
spec/domains/opportunities.md:20: malformed heading: ### D-opportunities-1 (v1) [confidence: inferred]
spec/domains/opportunities.md:21: expected a heading (### ID · vN · confidence · origin), got: The system shall offer three opportunity programs — Code With Us, Sprint With Us and Team With Us — and every opportunity shall belong to exactly one of them.
spec/domains/opportunities.md:23: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:24: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:25: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:14
spec/domains/opportunities.md:26: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:56
spec/domains/opportunities.md:27: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:19
spec/domains/opportunities.md:28: expected a heading (### ID · vN · confidence · origin), got: cites: README.md:5
spec/domains/opportunities.md:29: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:13
spec/domains/opportunities.md:30: expected a heading (### ID · vN · confidence · origin), got: given: a person browsing the service
spec/domains/opportunities.md:31: expected a heading (### ID · vN · confidence · origin), got: when: they open the opportunity list
spec/domains/opportunities.md:32: expected a heading (### ID · vN · confidence · origin), got: then: opportunities of all three programs are listed, each labelled with its program, and no opportunity belongs to more than one program
spec/domains/opportunities.md:33: expected a heading (### ID · vN · confidence · origin), got: note: The application's own README describes only Code With Us and Sprint With Us, and the database-schema document lists no Team With Us tables at all, while the code carries a complete third program with its own routes, statuses, resources and evaluation panel. Both documents are stale rather than describing a different intent; the code is treated as authoritative here, and the disagreement is recorded rather than resolved.
spec/domains/opportunities.md:35: malformed heading: ### D-opportunities-2 (v1) [confidence: confirmed]
spec/domains/opportunities.md:36: expected a heading (### ID · vN · confidence · origin), got: The system shall show anonymous visitors and vendors only opportunities in a public state.
spec/domains/opportunities.md:38: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:39: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:40: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:606
spec/domains/opportunities.md:41: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:387
spec/domains/opportunities.md:42: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:9
spec/domains/opportunities.md:43: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:9
spec/domains/opportunities.md:44: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has never been published
spec/domains/opportunities.md:45: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a signed-in vendor asks for the opportunity list, or for that opportunity directly
spec/domains/opportunities.md:46: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity does not appear in the list, and a direct request for it is answered as not found
spec/domains/opportunities.md:48: malformed heading: ### D-opportunities-3 (v1) [confidence: confirmed]
spec/domains/opportunities.md:49: expected a heading (### ID · vN · confidence · origin), got: The system shall show a public sector employee every public opportunity plus the unpublished opportunities they themselves created, and shall show an administrator every opportunity.
spec/domains/opportunities.md:51: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:52: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:53: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:393
spec/domains/opportunities.md:54: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:612
spec/domains/opportunities.md:55: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:49
spec/domains/opportunities.md:56: expected a heading (### ID · vN · confidence · origin), got: given: two unpublished opportunities, one created by public sector employee A and one by public sector employee B
spec/domains/opportunities.md:57: expected a heading (### ID · vN · confidence · origin), got: when: employee A asks for the opportunity list
spec/domains/opportunities.md:58: expected a heading (### ID · vN · confidence · origin), got: then: A's own unpublished opportunity is listed and B's is not, while an administrator making the same request sees both
spec/domains/opportunities.md:60: malformed heading: ### D-opportunities-4 (v1) [confidence: inferred]
spec/domains/opportunities.md:61: expected a heading (### ID · vN · confidence · origin), got: The system shall treat an opportunity as public once it has been published and thereafter — through every evaluation state, processing, award and cancellation — and shall treat it as private only while it is a draft or awaiting review.
spec/domains/opportunities.md:63: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:64: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:65: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:303
spec/domains/opportunities.md:66: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:130
spec/domains/opportunities.md:67: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:124
spec/domains/opportunities.md:68: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity that has been published and later cancelled
spec/domains/opportunities.md:69: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor asks for it
spec/domains/opportunities.md:70: expected a heading (### ID · vN · confidence · origin), got: then: it is still returned, showing its cancelled state
spec/domains/opportunities.md:72: malformed heading: ### D-opportunities-5 (v1) [confidence: inferred]
spec/domains/opportunities.md:73: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only public sector employees and administrators to create an opportunity, and shall refuse creation to vendors and to anyone not signed in.
spec/domains/opportunities.md:75: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:76: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:77: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:78: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:79: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:80: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/create.tsx:37
spec/domains/opportunities.md:81: expected a heading (### ID · vN · confidence · origin), got: given: a signed-in vendor
spec/domains/opportunities.md:82: expected a heading (### ID · vN · confidence · origin), got: when: they attempt to create an opportunity of any program
spec/domains/opportunities.md:83: expected a heading (### ID · vN · confidence · origin), got: then: the attempt is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:85: malformed heading: ### D-opportunities-6 (v1) [confidence: inferred]
spec/domains/opportunities.md:86: expected a heading (### ID · vN · confidence · origin), got: The system shall accept an opportunity created as a draft, as submitted for review, or as published, and shall reject any other requested starting state.
spec/domains/opportunities.md:88: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:89: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:90: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:39
spec/domains/opportunities.md:91: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:62
spec/domains/opportunities.md:92: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:180
spec/domains/opportunities.md:93: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/sprint-with-us.yaml:197
spec/domains/opportunities.md:94: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity
spec/domains/opportunities.md:95: expected a heading (### ID · vN · confidence · origin), got: when: they ask for it to start in an awarded or cancelled state
spec/domains/opportunities.md:96: expected a heading (### ID · vN · confidence · origin), got: then: the request is rejected with a validation error naming the state
spec/domains/opportunities.md:97: expected a heading (### ID · vN · confidence · origin), got: note: The Sprint With Us interface document lists the three accepted starting states; the Code With Us document lists only draft and published, omitting the awaiting-review state that the code has accepted since the migration that introduced it. The Code With Us document is stale.
spec/domains/opportunities.md:99: malformed heading: ### D-opportunities-7 (v1) [confidence: inferred]
spec/domains/opportunities.md:100: expected a heading (### ID · vN · confidence · origin), got: The system shall save a draft opportunity without checking that its content is complete, filling any missing or invalid dates with a default two weeks ahead.
spec/domains/opportunities.md:102: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:103: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:104: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:257
spec/domains/opportunities.md:105: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:412
spec/domains/opportunities.md:106: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:363
spec/domains/opportunities.md:107: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee with an empty opportunity form
spec/domains/opportunities.md:108: expected a heading (### ID · vN · confidence · origin), got: when: they save it as a draft
spec/domains/opportunities.md:109: expected a heading (### ID · vN · confidence · origin), got: then: the draft is created and is retrievable, with dates defaulted rather than rejected
spec/domains/opportunities.md:111: malformed heading: ### D-opportunities-8 (v1) [confidence: inferred]
spec/domains/opportunities.md:112: expected a heading (### ID · vN · confidence · origin), got: The system shall reject an opportunity that is not a draft when any required field is missing or out of range, reporting the errors field by field.
spec/domains/opportunities.md:114: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:115: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:116: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:295
spec/domains/opportunities.md:117: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:588
spec/domains/opportunities.md:118: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:413
spec/domains/opportunities.md:119: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating an opportunity to be published
spec/domains/opportunities.md:120: expected a heading (### ID · vN · confidence · origin), got: when: they omit the description and the location
spec/domains/opportunities.md:121: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is not created and the response names the description and the location as the fields at fault
spec/domains/opportunities.md:123: malformed heading: ### D-opportunities-9 (v1) [confidence: inferred]
spec/domains/opportunities.md:124: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Code With Us reward between one dollar and seventy thousand dollars inclusive, a Sprint With Us total maximum budget between one dollar and five million dollars inclusive, and a Team With Us maximum budget of at least one dollar with no upper bound.
spec/domains/opportunities.md:126: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:127: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:128: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:28
spec/domains/opportunities.md:129: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:30
spec/domains/opportunities.md:130: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:49
spec/domains/opportunities.md:131: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:436
spec/domains/opportunities.md:132: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:176
spec/domains/opportunities.md:133: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing a Code With Us opportunity
spec/domains/opportunities.md:134: expected a heading (### ID · vN · confidence · origin), got: when: they set the reward to eighty thousand dollars
spec/domains/opportunities.md:135: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the reward is named as the field at fault
spec/domains/opportunities.md:136: expected a heading (### ID · vN · confidence · origin), got: note: The absence of an upper bound on the Team With Us budget is asymmetric with the other two programs. Nothing in the sources says whether that is deliberate; it is recorded as it stands.
spec/domains/opportunities.md:138: malformed heading: ### D-opportunities-10 (v1) [confidence: inferred]
spec/domains/opportunities.md:139: expected a heading (### ID · vN · confidence · origin), got: The system shall require the scoring weights of a Sprint With Us or Team With Us opportunity to total one hundred percent.
spec/domains/opportunities.md:141: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:142: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:143: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:616
spec/domains/opportunities.md:144: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:437
spec/domains/opportunities.md:145: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:146: expected a heading (### ID · vN · confidence · origin), got: when: the four scoring weights total ninety percent
spec/domains/opportunities.md:147: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that the scoring weights must total one hundred percent
spec/domains/opportunities.md:149: malformed heading: ### D-opportunities-11 (v1) [confidence: inferred]
spec/domains/opportunities.md:150: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity's dates to run in order — proposal deadline, then assignment date, then start date, then completion date — with the proposal deadline no earlier than the day the opportunity is saved, and shall record each date at four in the afternoon.
spec/domains/opportunities.md:152: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:153: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:154: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:238
spec/domains/opportunities.md:155: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:29
spec/domains/opportunities.md:156: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:157: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity
spec/domains/opportunities.md:158: expected a heading (### ID · vN · confidence · origin), got: when: they set an assignment date earlier than the proposal deadline
spec/domains/opportunities.md:159: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the assignment date is named as the field at fault
spec/domains/opportunities.md:161: malformed heading: ### D-opportunities-12 (v1) [confidence: inferred]
spec/domains/opportunities.md:162: expected a heading (### ID · vN · confidence · origin), got: When an opportunity whose proposal deadline has already passed is edited, the system shall measure its new proposal deadline against the old deadline rather than against today, unless the opportunity is still a draft.
spec/domains/opportunities.md:164: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:165: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:166: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/code-with-us.ts:65
spec/domains/opportunities.md:167: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:453
spec/domains/opportunities.md:168: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:551
spec/domains/opportunities.md:169: expected a heading (### ID · vN · confidence · origin), got: given: a closed opportunity whose proposal deadline was last month
spec/domains/opportunities.md:170: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits it and leaves the deadline unchanged
spec/domains/opportunities.md:171: expected a heading (### ID · vN · confidence · origin), got: then: the edit is accepted rather than rejected for having a deadline in the past
spec/domains/opportunities.md:173: malformed heading: ### D-opportunities-13 (v1) [confidence: inferred]
spec/domains/opportunities.md:174: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Sprint With Us opportunity that has an inception phase to also have a prototype phase, and shall require every phase to carry at least one required capability, a budget no greater than the opportunity's total, and dates that follow the preceding phase.
spec/domains/opportunities.md:176: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:177: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:178: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:629
spec/domains/opportunities.md:179: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:117
spec/domains/opportunities.md:180: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:97
spec/domains/opportunities.md:181: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Sprint With Us opportunity to be published
spec/domains/opportunities.md:182: expected a heading (### ID · vN · confidence · origin), got: when: they define an inception phase but no prototype phase
spec/domains/opportunities.md:183: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message that a prototype phase must follow an inception phase
spec/domains/opportunities.md:185: malformed heading: ### D-opportunities-14 (v1) [confidence: inferred]
spec/domains/opportunities.md:186: expected a heading (### ID · vN · confidence · origin), got: The system shall require a Team With Us opportunity to name one or more resources, each drawn from a fixed set of service areas and each with a target allocation between one and one hundred percent of full time.
spec/domains/opportunities.md:188: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:189: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:190: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:38
spec/domains/opportunities.md:191: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:239
spec/domains/opportunities.md:192: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:213
spec/domains/opportunities.md:193: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee creating a Team With Us opportunity
spec/domains/opportunities.md:194: expected a heading (### ID · vN · confidence · origin), got: when: they name a resource in a service area the service does not offer
spec/domains/opportunities.md:195: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and that resource is named as the item at fault
spec/domains/opportunities.md:197: malformed heading: ### D-opportunities-15 (v1) [confidence: inferred]
spec/domains/opportunities.md:198: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity to carry up to one hundred scored questions, each with a word limit of at most three thousand words and, where a minimum score is set, a minimum below the question's available score.
spec/domains/opportunities.md:200: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:201: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:202: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:16
spec/domains/opportunities.md:203: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:344
spec/domains/opportunities.md:204: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/sprint-with-us.ts:362
spec/domains/opportunities.md:205: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/team-with-us.ts:82
spec/domains/opportunities.md:206: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee writing a question worth five points
spec/domains/opportunities.md:207: expected a heading (### ID · vN · confidence · origin), got: when: they set the question's minimum score to five
spec/domains/opportunities.md:208: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the minimum score is named as the field at fault
spec/domains/opportunities.md:210: malformed heading: ### D-opportunities-16 (v1) [confidence: inferred]
spec/domains/opportunities.md:211: expected a heading (### ID · vN · confidence · origin), got: The system shall require the evaluation panel of a Sprint With Us or Team With Us opportunity to hold at least two members, all of them public sector employees, with no member listed twice and no more than one chair.
spec/domains/opportunities.md:213: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:214: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:215: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:473
spec/domains/opportunities.md:216: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:431
spec/domains/opportunities.md:217: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/validation.ts:511
spec/domains/opportunities.md:218: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:32
spec/domains/opportunities.md:219: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/config.ts:34
spec/domains/opportunities.md:220: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee assembling an evaluation panel
spec/domains/opportunities.md:221: expected a heading (### ID · vN · confidence · origin), got: when: they name two chairs, or name a vendor as a panel member
spec/domains/opportunities.md:222: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected with a message naming the panel as the item at fault
spec/domains/opportunities.md:224: malformed heading: ### D-opportunities-17 (v1) [confidence: inferred]
spec/domains/opportunities.md:225: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to publish an opportunity of any program.
spec/domains/opportunities.md:227: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:228: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:229: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:390
spec/domains/opportunities.md:230: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:632
spec/domains/opportunities.md:231: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1354
spec/domains/opportunities.md:232: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:760
spec/domains/opportunities.md:233: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity awaiting review, created by a public sector employee
spec/domains/opportunities.md:234: expected a heading (### ID · vN · confidence · origin), got: when: that employee asks to publish it
spec/domains/opportunities.md:235: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and the opportunity stays unpublished
spec/domains/opportunities.md:237: malformed heading: ### D-opportunities-18 (v1) [confidence: inferred]
spec/domains/opportunities.md:238: expected a heading (### ID · vN · confidence · origin), got: The system shall allow a public sector employee to submit their own draft opportunity for review, and shall refuse the submission if the opportunity's title, teaser, remote-work answer, location or description is incomplete.
spec/domains/opportunities.md:240: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:241: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:242: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:705
spec/domains/opportunities.md:243: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1354
spec/domains/opportunities.md:244: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity with no description
spec/domains/opportunities.md:245: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:246: expected a heading (### ID · vN · confidence · origin), got: then: the submission is refused with a message that the opportunity is incomplete and must be completed before it can be published
spec/domains/opportunities.md:248: malformed heading: ### D-opportunities-19 (v1) [confidence: inferred]
spec/domains/opportunities.md:249: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse a request from a public sector employee to create a Sprint With Us or Team With Us opportunity that is already published.
spec/domains/opportunities.md:251: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:252: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:253: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:604
spec/domains/opportunities.md:254: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:1099
spec/domains/opportunities.md:255: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:256: expected a heading (### ID · vN · confidence · origin), got: when: they create a Sprint With Us opportunity asking for it to start published
spec/domains/opportunities.md:257: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a permission error and no opportunity is created
spec/domains/opportunities.md:259: malformed heading: ### D-opportunities-20 (v1) [confidence: inferred]
spec/domains/opportunities.md:260: expected a heading (### ID · vN · confidence · origin), got: A public sector employee who is not an administrator can create a Code With Us opportunity that is already published, so that it becomes publicly visible and its subscribers are notified without any administrator having approved it.
spec/domains/opportunities.md:262: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:263: expected a heading (### ID · vN · confidence · origin), got: reconciliation: defect
spec/domains/opportunities.md:264: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:345
spec/domains/opportunities.md:265: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:187
spec/domains/opportunities.md:266: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:394
spec/domains/opportunities.md:267: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee who is not an administrator
spec/domains/opportunities.md:268: expected a heading (### ID · vN · confidence · origin), got: when: they create a Code With Us opportunity asking for it to start published
spec/domains/opportunities.md:269: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is created in a published state and the publication notice is sent
spec/domains/opportunities.md:270: expected a heading (### ID · vN · confidence · origin), got: note: This contradicts D-opportunities-17 and the equivalent rule the other two programs enforce at D-opportunities-19: the permission check for creating a Code With Us opportunity ignores the requested starting state, so the administrator-only publication rule can be bypassed at creation time. No replacement criterion is proposed, because whether the fix is to bar the state at creation or to widen who may publish is a decision for the people who own the service.
spec/domains/opportunities.md:272: malformed heading: ### D-opportunities-21 (v1) [confidence: inferred]
spec/domains/opportunities.md:273: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Code With Us opportunity only along the sequence draft, awaiting review, published, evaluation, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:275: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:276: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:277: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:246
spec/domains/opportunities.md:278: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20231102143211_cwu-opp-under-review.ts:27
spec/domains/opportunities.md:279: expected a heading (### ID · vN · confidence · origin), got: cites: src/migrations/tasks/20240421120000_add_cwu_processing_status.ts:28
spec/domains/opportunities.md:280: expected a heading (### ID · vN · confidence · origin), got: given: a published Code With Us opportunity
spec/domains/opportunities.md:281: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to draft
spec/domains/opportunities.md:282: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays published
spec/domains/opportunities.md:284: malformed heading: ### D-opportunities-22 (v1) [confidence: inferred]
spec/domains/opportunities.md:285: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Sprint With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, code challenge, team scenario, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:287: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:288: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:289: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:487
spec/domains/opportunities.md:290: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge state
spec/domains/opportunities.md:291: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to return it to question consensus
spec/domains/opportunities.md:292: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity stays in the code challenge state
spec/domains/opportunities.md:294: malformed heading: ### D-opportunities-23 (v1) [confidence: open]
spec/domains/opportunities.md:295: expected a heading (### ID · vN · confidence · origin), got: The system shall move a Team With Us opportunity only along the sequence draft, awaiting review, published, individual question evaluation, question consensus, challenge, processing, awarded, shall allow cancellation from any state from published onwards, and shall refuse every other change of state.
spec/domains/opportunities.md:297: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:298: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:299: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:451
spec/domains/opportunities.md:300: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:301: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:501
spec/domains/opportunities.md:302: expected a heading (### ID · vN · confidence · origin), got: given: a Team With Us opportunity in the processing state
spec/domains/opportunities.md:303: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards a proposal on it
spec/domains/opportunities.md:304: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded
spec/domains/opportunities.md:305: expected a heading (### ID · vN · confidence · origin), got: note: The rule that decides which changes of state are permitted omits processing-to-awarded for Team With Us, although it permits exactly that change for the other two programs and although the same file elsewhere treats an awarded Team With Us opportunity as a normal outcome. Awarding still works, because the award path writes the new state directly instead of consulting that rule. Two readings are open: either the omission is an oversight and the award transition is intended, or awarding a Team With Us opportunity is meant to be barred and the award path is the defect. Nothing in the sources decides which.
spec/domains/opportunities.md:307: malformed heading: ### D-opportunities-24 (v1) [confidence: inferred]
spec/domains/opportunities.md:308: expected a heading (### ID · vN · confidence · origin), got: When a published opportunity's proposal deadline passes, the system shall close it without anyone acting — moving it into its programme's first evaluation state, moving every submitted proposal on it into review, and telling the opportunity's author that it is ready for evaluation.
spec/domains/opportunities.md:310: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:311: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:312: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:898
spec/domains/opportunities.md:313: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/sprint-with-us.ts:1442
spec/domains/opportunities.md:314: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/team-with-us.ts:1433
spec/domains/opportunities.md:315: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/hooks/code-with-us.ts:20
spec/domains/opportunities.md:316: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one submitted proposal and a proposal deadline that has just passed
spec/domains/opportunities.md:317: expected a heading (### ID · vN · confidence · origin), got: when: no one takes any action
spec/domains/opportunities.md:318: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is in its first evaluation state with a history note that it has closed, the proposal is under review, and the author has been sent a ready-for-evaluation notice
spec/domains/opportunities.md:319: expected a heading (### ID · vN · confidence · origin), got: note: The closing sweep runs as a throttled step before handling requests rather than as a scheduled job, so an opportunity closes on the first request that arrives after its deadline, not at the deadline itself. On a service with no traffic, closure is deferred indefinitely.
spec/domains/opportunities.md:321: malformed heading: ### D-opportunities-25 (v1) [confidence: inferred]
spec/domains/opportunities.md:322: expected a heading (### ID · vN · confidence · origin), got: When every proposal still in contention on an opportunity has been evaluated, the system shall move the opportunity into processing without anyone acting, recording that it did so.
spec/domains/opportunities.md:324: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:325: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:326: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1064
spec/domains/opportunities.md:327: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1789
spec/domains/opportunities.md:328: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation with three proposals still in contention, two of them already evaluated
spec/domains/opportunities.md:329: expected a heading (### ID · vN · confidence · origin), got: when: the third is evaluated
spec/domains/opportunities.md:330: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity moves to processing and its history shows that it was moved automatically because all proposals had been evaluated
spec/domains/opportunities.md:332: malformed heading: ### D-opportunities-26 (v1) [confidence: inferred]
spec/domains/opportunities.md:333: expected a heading (### ID · vN · confidence · origin), got: When a proposal on an opportunity is awarded, the system shall mark the opportunity as awarded and shall show the successful proponent on it.
spec/domains/opportunities.md:335: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:336: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:337: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/code-with-us.ts:1159
spec/domains/opportunities.md:338: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/proposal/team-with-us.ts:1459
spec/domains/opportunities.md:339: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:445
spec/domains/opportunities.md:340: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in processing with several proposals
spec/domains/opportunities.md:341: expected a heading (### ID · vN · confidence · origin), got: when: an administrator awards one of them
spec/domains/opportunities.md:342: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity becomes awarded and names the successful proponent, while the other proposals become not awarded
spec/domains/opportunities.md:344: malformed heading: ### D-opportunities-27 (v1) [confidence: confirmed]
spec/domains/opportunities.md:345: expected a heading (### ID · vN · confidence · origin), got: The system shall allow only an administrator to cancel an opportunity, and shall tell the opportunity's author, its subscribers and everyone who has a proposal on it that it has been cancelled.
spec/domains/opportunities.md:347: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:348: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:349: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:415
spec/domains/opportunities.md:350: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:823
spec/domains/opportunities.md:351: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:197
spec/domains/opportunities.md:352: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:96
spec/domains/opportunities.md:353: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:354: expected a heading (### ID · vN · confidence · origin), got: when: an administrator cancels it with a reason
spec/domains/opportunities.md:355: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is cancelled, remains publicly visible as cancelled, and the author, the subscriber and the proposal's author each receive a cancellation notice
spec/domains/opportunities.md:357: malformed heading: ### D-opportunities-28 (v1) [confidence: confirmed]
spec/domains/opportunities.md:358: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an administrator, or the opportunity's own author, to publish an addendum to any opportunity that is no longer a draft, and shall keep every addendum with the time it was added.
spec/domains/opportunities.md:360: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:361: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:362: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:846
spec/domains/opportunities.md:363: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:403
spec/domains/opportunities.md:364: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:835
spec/domains/opportunities.md:365: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:98
spec/domains/opportunities.md:366: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:367: expected a heading (### ID · vN · confidence · origin), got: when: its author adds an addendum
spec/domains/opportunities.md:368: expected a heading (### ID · vN · confidence · origin), got: then: the addendum appears on the opportunity for everyone who can see the opportunity, carrying the date it was added
spec/domains/opportunities.md:369: expected a heading (### ID · vN · confidence · origin), got: note: The interface the service presents offers the addendum action only once an opportunity is public, while the rule the server applies also allows an addendum while an opportunity is merely awaiting review. The server is the more permissive of the two.
spec/domains/opportunities.md:371: malformed heading: ### D-opportunities-29 (v1) [confidence: inferred]
spec/domains/opportunities.md:372: expected a heading (### ID · vN · confidence · origin), got: The system shall tell an opportunity's subscribers, and everyone who has a proposal on it, whenever it is edited or gains an addendum, except while it is a draft or after it has been cancelled.
spec/domains/opportunities.md:374: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:375: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:376: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:908
spec/domains/opportunities.md:377: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:919
spec/domains/opportunities.md:378: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:168
spec/domains/opportunities.md:379: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with one subscriber and one submitted proposal
spec/domains/opportunities.md:380: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its description
spec/domains/opportunities.md:381: expected a heading (### ID · vN · confidence · origin), got: then: the subscriber, the proposal's author and the opportunity's author each receive an update notice
spec/domains/opportunities.md:383: malformed heading: ### D-opportunities-30 (v1) [confidence: inferred]
spec/domains/opportunities.md:384: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is submitted for review, the system shall tell every administrator that it is waiting for them and shall confirm the submission to the person who submitted it.
spec/domains/opportunities.md:386: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:387: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:388: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:14
spec/domains/opportunities.md:389: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:933
spec/domains/opportunities.md:390: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity
spec/domains/opportunities.md:391: expected a heading (### ID · vN · confidence · origin), got: when: its author submits it for review
spec/domains/opportunities.md:392: expected a heading (### ID · vN · confidence · origin), got: then: each administrator receives a notice that an opportunity is awaiting review, and the author receives a confirmation
spec/domains/opportunities.md:394: malformed heading: ### D-opportunities-31 (v1) [confidence: inferred]
spec/domains/opportunities.md:395: expected a heading (### ID · vN · confidence · origin), got: When an opportunity is published, the system shall tell every user who has asked for opportunity notifications, and shall confirm the publication to the opportunity's author.
spec/domains/opportunities.md:397: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:398: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:399: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/mailer/notifications/opportunity/code-with-us.tsx:146
spec/domains/opportunities.md:400: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:957
spec/domains/opportunities.md:401: expected a heading (### ID · vN · confidence · origin), got: given: a user who has turned opportunity notifications on, and an opportunity awaiting review
spec/domains/opportunities.md:402: expected a heading (### ID · vN · confidence · origin), got: when: an administrator publishes it
spec/domains/opportunities.md:403: expected a heading (### ID · vN · confidence · origin), got: then: that user receives a new-opportunity notice and the opportunity's author receives a publication confirmation
spec/domains/opportunities.md:405: malformed heading: ### D-opportunities-32 (v1) [confidence: open]
spec/domains/opportunities.md:406: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's details to be edited while it is a draft or awaiting review, and once it is published shall allow only an administrator to edit them.
spec/domains/opportunities.md:408: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:409: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:410: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:288
spec/domains/opportunities.md:411: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:586
spec/domains/opportunities.md:412: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:517
spec/domains/opportunities.md:413: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:349
spec/domains/opportunities.md:414: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity created by a public sector employee who is not an administrator
spec/domains/opportunities.md:415: expected a heading (### ID · vN · confidence · origin), got: when: that employee submits an edit to its description
spec/domains/opportunities.md:416: expected a heading (### ID · vN · confidence · origin), got: then: unresolved — the interface does not offer them the action, but the server accepts the edit
spec/domains/opportunities.md:417: expected a heading (### ID · vN · confidence · origin), got: note: The interface hides editing of a published opportunity from anyone but an administrator, while the server permits the opportunity's own author to edit it in the published state. Which of the two expresses the intended rule cannot be told from the sources; the observable behaviour therefore depends on whether the request comes through the service's own screens.
spec/domains/opportunities.md:419: malformed heading: ### D-opportunities-33 (v1) [confidence: inferred]
spec/domains/opportunities.md:420: expected a heading (### ID · vN · confidence · origin), got: The system shall keep every version of an opportunity, recording an edit as a new version alongside a dated entry in the opportunity's history rather than overwriting what was there.
spec/domains/opportunities.md:422: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:423: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:424: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:747
spec/domains/opportunities.md:425: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:304
spec/domains/opportunities.md:426: expected a heading (### ID · vN · confidence · origin), got: cites: docs/database-schema.md:156
spec/domains/opportunities.md:427: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:428: expected a heading (### ID · vN · confidence · origin), got: when: an administrator edits its title twice
spec/domains/opportunities.md:429: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity shows the latest title, and its history shows two separate edit entries with the times they were made
spec/domains/opportunities.md:431: malformed heading: ### D-opportunities-34 (v1) [confidence: inferred]
spec/domains/opportunities.md:432: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity's history, and its counts of views, watchers and submitted proposals, only to an administrator or to the opportunity's own author, and shall show the counts only once the opportunity is public.
spec/domains/opportunities.md:434: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:435: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:436: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:477
spec/domains/opportunities.md:437: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:438: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with views, watchers and proposals
spec/domains/opportunities.md:439: expected a heading (### ID · vN · confidence · origin), got: when: a vendor asks for it, and then its author asks for it
spec/domains/opportunities.md:440: expected a heading (### ID · vN · confidence · origin), got: then: the vendor receives no history and no counts, and the author receives both
spec/domains/opportunities.md:442: malformed heading: ### D-opportunities-35 (v1) [confidence: inferred]
spec/domains/opportunities.md:443: expected a heading (### ID · vN · confidence · origin), got: The system shall hide who created and who last changed an opportunity from anyone who is neither an administrator nor one of those two people.
spec/domains/opportunities.md:445: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:446: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:447: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:243
spec/domains/opportunities.md:448: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:449: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor or a vendor asks for it
spec/domains/opportunities.md:450: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is returned without naming the person who created or last changed it
spec/domains/opportunities.md:452: malformed heading: ### D-opportunities-36 (v1) [confidence: inferred]
spec/domains/opportunities.md:453: expected a heading (### ID · vN · confidence · origin), got: The system shall let an administrator, or the opportunity's author, attach a private note with files to an opportunity's history at any point in its life.
spec/domains/opportunities.md:455: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:456: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:457: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/code-with-us.ts:873
spec/domains/opportunities.md:458: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:980
spec/domains/opportunities.md:459: expected a heading (### ID · vN · confidence · origin), got: given: an opportunity in evaluation
spec/domains/opportunities.md:460: expected a heading (### ID · vN · confidence · origin), got: when: an administrator adds a note with an attached file
spec/domains/opportunities.md:461: expected a heading (### ID · vN · confidence · origin), got: then: the note and its attachment appear in the opportunity's history, visible only to those who may see the history
spec/domains/opportunities.md:462: expected a heading (### ID · vN · confidence · origin), got: note: The note action is absent from the published interface description, which lists only editing, publishing, cancelling and adding an addendum. It is implemented and reachable.
spec/domains/opportunities.md:464: malformed heading: ### D-opportunities-37 (v1) [confidence: confirmed]
spec/domains/opportunities.md:465: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an unpublished opportunity to be deleted and shall refuse to delete one that has ever been published.
spec/domains/opportunities.md:467: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:468: expected a heading (### ID · vN · confidence · origin), got: reconciliation: conflicting
spec/domains/opportunities.md:469: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:367
spec/domains/opportunities.md:470: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/permissions.ts:636
spec/domains/opportunities.md:471: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/team-with-us/index.ts:1680
spec/domains/opportunities.md:472: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/docs/opportunities/code-with-us.yaml:118
spec/domains/opportunities.md:473: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity
spec/domains/opportunities.md:474: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to delete it
spec/domains/opportunities.md:475: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the opportunity remains
spec/domains/opportunities.md:476: expected a heading (### ID · vN · confidence · origin), got: note: The interface document says deletion requires the opportunity to be a draft. The code is wider in two ways: an administrator may also delete an opportunity that is awaiting review, and for Team With Us the author as well as an administrator may delete in either of those states, whereas for the other two programs an author may delete only their own draft. Whether the Team With Us difference is intended is not stated anywhere.
spec/domains/opportunities.md:478: malformed heading: ### D-opportunities-38 (v1) [confidence: inferred]
spec/domains/opportunities.md:479: expected a heading (### ID · vN · confidence · origin), got: The system shall let any signed-in user watch an opportunity so as to receive its updates, and shall refuse to let someone watch an opportunity they created themselves.
spec/domains/opportunities.md:481: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:482: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:483: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:53
spec/domains/opportunities.md:484: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/subscribers/code-with-us.ts:70
spec/domains/opportunities.md:485: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:367
spec/domains/opportunities.md:486: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee viewing an opportunity they created
spec/domains/opportunities.md:487: expected a heading (### ID · vN · confidence · origin), got: when: they ask to watch it
spec/domains/opportunities.md:488: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that they cannot subscribe to their own opportunity
spec/domains/opportunities.md:490: malformed heading: ### D-opportunities-39 (v1) [confidence: inferred]
spec/domains/opportunities.md:491: expected a heading (### ID · vN · confidence · origin), got: The system shall count each viewing of an opportunity's public page and report that count among the opportunity's figures.
spec/domains/opportunities.md:493: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:494: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:495: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/view.tsx:98
spec/domains/opportunities.md:496: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/db/opportunity/code-with-us.ts:515
spec/domains/opportunities.md:497: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity with no views
spec/domains/opportunities.md:498: expected a heading (### ID · vN · confidence · origin), got: when: an anonymous visitor opens its page twice
spec/domains/opportunities.md:499: expected a heading (### ID · vN · confidence · origin), got: then: the view count the author sees increases by two
spec/domains/opportunities.md:501: malformed heading: ### D-opportunities-40 (v1) [confidence: inferred]
spec/domains/opportunities.md:502: expected a heading (### ID · vN · confidence · origin), got: The system shall accept proposals on an opportunity only while it is published and its proposal deadline is still in the future.
spec/domains/opportunities.md:504: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:505: expected a heading (### ID · vN · confidence · origin), got: reconciliation: aligned
spec/domains/opportunities.md:506: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:316
spec/domains/opportunities.md:507: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:146
spec/domains/opportunities.md:508: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:139
spec/domains/opportunities.md:509: expected a heading (### ID · vN · confidence · origin), got: given: a published opportunity whose proposal deadline has passed
spec/domains/opportunities.md:510: expected a heading (### ID · vN · confidence · origin), got: when: a vendor opens it
spec/domains/opportunities.md:511: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is shown as closed and no submission is offered
spec/domains/opportunities.md:513: malformed heading: ### D-opportunities-41 (v1) [confidence: inferred]
spec/domains/opportunities.md:514: expected a heading (### ID · vN · confidence · origin), got: The system shall group the opportunity list into unpublished, open and closed opportunities, ordering open ones by the soonest proposal deadline first and closed ones by the most recently closed first.
spec/domains/opportunities.md:516: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:517: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:518: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:162
spec/domains/opportunities.md:519: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:195
spec/domains/opportunities.md:520: expected a heading (### ID · vN · confidence · origin), got: given: several published opportunities with different proposal deadlines
spec/domains/opportunities.md:521: expected a heading (### ID · vN · confidence · origin), got: when: a visitor opens the opportunity list
spec/domains/opportunities.md:522: expected a heading (### ID · vN · confidence · origin), got: then: the open opportunities appear together with the one closing soonest at the top
spec/domains/opportunities.md:524: malformed heading: ### D-opportunities-42 (v1) [confidence: inferred]
spec/domains/opportunities.md:525: expected a heading (### ID · vN · confidence · origin), got: The system shall let a person narrow the opportunity list by programme, by state, to remote-friendly opportunities only, and by words in the title.
spec/domains/opportunities.md:527: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:528: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:529: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:219
spec/domains/opportunities.md:530: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:314
spec/domains/opportunities.md:531: expected a heading (### ID · vN · confidence · origin), got: given: a list holding opportunities of all three programmes
spec/domains/opportunities.md:532: expected a heading (### ID · vN · confidence · origin), got: when: a visitor narrows it to Code With Us
spec/domains/opportunities.md:533: expected a heading (### ID · vN · confidence · origin), got: then: only Code With Us opportunities remain listed
spec/domains/opportunities.md:535: malformed heading: ### D-opportunities-43 (v1) [confidence: inferred]
spec/domains/opportunities.md:536: expected a heading (### ID · vN · confidence · origin), got: The system shall show an opportunity that has no title as "Untitled" wherever it is listed.
spec/domains/opportunities.md:538: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:539: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:540: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/code-with-us.ts:11
spec/domains/opportunities.md:541: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/list.tsx:141
spec/domains/opportunities.md:542: expected a heading (### ID · vN · confidence · origin), got: given: a draft opportunity whose title has never been filled in
spec/domains/opportunities.md:543: expected a heading (### ID · vN · confidence · origin), got: when: its author opens the opportunity list
spec/domains/opportunities.md:544: expected a heading (### ID · vN · confidence · origin), got: then: it is listed as "Untitled"
spec/domains/opportunities.md:546: malformed heading: ### D-opportunities-44 (v1) [confidence: inferred]
spec/domains/opportunities.md:547: expected a heading (### ID · vN · confidence · origin), got: The system shall require an opportunity that is described as remote-friendly to also carry a description of its remote arrangements.
spec/domains/opportunities.md:549: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:550: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:551: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/validation/opportunity/utility.ts:120
spec/domains/opportunities.md:552: expected a heading (### ID · vN · confidence · origin), got: given: a public sector employee publishing an opportunity marked as remote-friendly
spec/domains/opportunities.md:553: expected a heading (### ID · vN · confidence · origin), got: when: they leave the remote description empty
spec/domains/opportunities.md:554: expected a heading (### ID · vN · confidence · origin), got: then: the opportunity is rejected and the remote description is named as the field at fault
spec/domains/opportunities.md:556: malformed heading: ### D-opportunities-45 (v1) [confidence: inferred]
spec/domains/opportunities.md:557: expected a heading (### ID · vN · confidence · origin), got: The system shall allow an opportunity's evaluation panel to be changed only while the opportunity is a draft, awaiting review, published, or in individual question evaluation, and shall tell members added to or removed from a panel that it has changed.
spec/domains/opportunities.md:559: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:560: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:561: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/sprint-with-us.ts:631
spec/domains/opportunities.md:562: expected a heading (### ID · vN · confidence · origin), got: cites: src/shared/lib/resources/opportunity/team-with-us.ts:585
spec/domains/opportunities.md:563: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:2216
spec/domains/opportunities.md:564: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity that has reached question consensus
spec/domains/opportunities.md:565: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to change its evaluation panel
spec/domains/opportunities.md:566: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused and the panel stays as it was
spec/domains/opportunities.md:568: malformed heading: ### D-opportunities-46 (v1) [confidence: inferred]
spec/domains/opportunities.md:569: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity out of question consensus unless every consensus has been submitted and at least one proponent has met the minimum score on every question that sets one.
spec/domains/opportunities.md:571: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:572: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:573: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1481
spec/domains/opportunities.md:574: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in question consensus where no proponent meets the minimum score on one of the questions
spec/domains/opportunities.md:575: expected a heading (### ID · vN · confidence · origin), got: when: the panel chair asks to finalise the consensus
spec/domains/opportunities.md:576: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that at least one proponent must be able to be screened into the code challenge
spec/domains/opportunities.md:578: malformed heading: ### D-opportunities-47 (v1) [confidence: inferred]
spec/domains/opportunities.md:579: expected a heading (### ID · vN · confidence · origin), got: The system shall refuse to move a Sprint With Us opportunity into team scenario evaluation unless every proponent still in the code challenge has been scored or disqualified, and at least one has been screened in.
spec/domains/opportunities.md:581: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:582: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:583: expected a heading (### ID · vN · confidence · origin), got: cites: src/back-end/lib/resources/opportunity/sprint-with-us/index.ts:1593
spec/domains/opportunities.md:584: expected a heading (### ID · vN · confidence · origin), got: given: a Sprint With Us opportunity in the code challenge with one unscored proponent
spec/domains/opportunities.md:585: expected a heading (### ID · vN · confidence · origin), got: when: an administrator asks to start the team scenario
spec/domains/opportunities.md:586: expected a heading (### ID · vN · confidence · origin), got: then: the request is refused with a message that all proponents must be scored first
spec/domains/opportunities.md:588: malformed heading: ### D-opportunities-48 (v1) [confidence: inferred]
spec/domains/opportunities.md:589: expected a heading (### ID · vN · confidence · origin), got: The system shall offer an administrator a single continuous report of a completed opportunity, gathering its details, summary, addenda, history and proposals in one page.
spec/domains/opportunities.md:591: expected a heading (### ID · vN · confidence · origin), got: origin: recovered
spec/domains/opportunities.md:592: expected a heading (### ID · vN · confidence · origin), got: reconciliation: implemented-only
spec/domains/opportunities.md:593: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/app/router.ts:741
spec/domains/opportunities.md:594: expected a heading (### ID · vN · confidence · origin), got: cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/complete/index.tsx:184
spec/domains/opportunities.md:595: expected a heading (### ID · vN · confidence · origin), got: given: an awarded opportunity
spec/domains/opportunities.md:596: expected a heading (### ID · vN · confidence · origin), got: when: an administrator opens its complete report, and then a public sector employee tries the same
spec/domains/opportunities.md:597: expected a heading (### ID · vN · confidence · origin), got: then: the administrator sees the whole report on one page and the other person is refused access
spec/domains/opportunities.md has no criteria