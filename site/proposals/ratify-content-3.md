| Field | Value |
| --- | --- |
| gate | G1 |
| opened | 2026-09-07T08:27:06.779Z |
| holder | agent:product-owner |

# Which of the content criteria that are still inferred or open become the contract?

**Recommendation.** 12 criterion(s) in content are still short of the contract; rule on each with a ratification condition so the next ratify pass can mint them.

12 criterion(s) in the **content** domain are still `inferred` or `open`, so
`ratify` has not minted a permanent id for them and no later stage can build against them.
Rule on each one below. `contract` and `spike` record a decision without ever raising a
criterion's confidence, so neither one closes it out — a criterion left short of the contract
through two follow-ups this way is marked `obsolete` by `ratify` itself, noted
"unresolved after two rulings", rather than being asked about forever.

### D-content-2 · v1 · inferred · recovered

The service links its own footer to five of its pages, so every screen offers the about, disclaimer, privacy, accessibility and copyright pages to any visitor.

- reconciliation: implemented-only
- given: any screen of the service, seen by a visitor who is not signed in
- when: the visitor reaches the bottom of it
- then: links labelled About, Disclaimer, Privacy, Accessibility and Copyright each open the corresponding page
- cites: src/front-end/typescript/lib/app/view/footer.tsx:22
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:8
- note: these five are the service's whole standing offer of its own legal and informational prose; nothing outside the code describes them, and each is a page an administrator can re-word at any time.

### D-content-9 · v1 · inferred · recovered

A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named.

- reconciliation: implemented-only
- given: an administrator creating or changing a page
- when: they submit it with an empty title, or with a body longer than fifty thousand characters
- then: nothing is saved and the failing field is marked with the reason
- cites: src/shared/lib/validation/content.ts:8
- cites: src/shared/lib/validation/content.ts:12
- cites: src/back-end/lib/resources/content.ts:141

### D-content-10 · v1 · inferred · recovered

A page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused.

- reconciliation: implemented-only
- given: an administrator creating a page
- when: they give it an address containing a capital letter, a space, an underscore, or a leading or trailing hyphen
- then: the page is not created and the address is marked as invalid
- cites: src/shared/lib/validation/content.ts:16
- cites: src/front-end/typescript/lib/pages/content/lib/components/form.tsx:174
- note: the rule is stated to the administrator on the form as well as enforced on submission, and the form shows the full public address the page will have.

### D-content-11 · v1 · inferred · recovered

No two pages may share an address, whether the clash arises on creating a page or on renaming one.

- reconciliation: implemented-only
- given: a page already published at the address "about"
- when: an administrator creates another page at that address, or renames a different page to it
- then: neither is accepted, the existing page is untouched, and the address is reported as already in use
- cites: src/back-end/lib/resources/content.ts:146
- cites: src/back-end/lib/resources/content.ts:267

### D-content-13 · v1 · inferred · recovered

Nothing in the service shows, compares or restores an earlier version of a page.

- reconciliation: implemented-only
- given: a page changed several times, so several earlier versions of it are kept
- when: an administrator opens its managing screen
- then: only the current title and body are shown, with no history, no earlier version and no way back to one
- cites: src/back-end/lib/db/content.ts:67
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:410
- note: the versions accumulate with no route to them and no limit on their number. Recovering superseded wording is possible only from outside the service, which makes the retention useful for audit but not for undoing a mistaken edit.

### D-content-14 · v1 · inferred · recovered

Renaming a page moves it to its new address at once and leaves nothing at the old one.

- reconciliation: implemented-only
- given: a page published at the address "about-us" and links to it from elsewhere
- when: an administrator changes its address to "about"
- then: the page answers at "about", the old address is answered as not found, and no redirection is offered
- cites: src/back-end/lib/db/content.ts:189
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:287
- note: nothing warns the administrator that a rename breaks existing links, and nothing in the service records the address a page used to have.

### D-content-15 · v1 · inferred · recovered

A page the service itself depends on may have its title and body changed but may not be renamed or removed, and its managing screen says so.

- reconciliation: implemented-only
- given: an administrator on the managing screen of a page the service needs
- when: they look for the ways to change it
- then: a warning explains that the service needs this page at this address, the address cannot be typed over, no removal is offered, and a request to rename or remove it made another way is refused
- cites: src/back-end/lib/resources/content.ts:258
- cites: src/back-end/lib/resources/content.ts:360
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:507
- cites: src/front-end/typescript/lib/pages/content/lib/components/form.tsx:183
- note: whether a page is one the service needs is fixed when the page is created by migration and cannot be set or cleared through the service, so an administrator can neither promote an ordinary page to a needed one nor demote a needed one.

### D-content-21 · v1 · inferred · recovered

A page's body is written as marked-up text with an editor offering formatting shortcuts, a link to the guidance page, and image upload that places the uploaded image into the body.

- reconciliation: implemented-only
- given: an administrator editing a page's body
- when: they use the image control to choose an image file
- then: the image is stored by the service and a reference to it is inserted into the body at the cursor, and the published page shows the image
- cites: src/front-end/typescript/lib/pages/content/lib/components/form.tsx:88
- cites: src/front-end/typescript/lib/components/form-field/rich-markdown-editor.tsx:287
- cites: src/front-end/typescript/lib/components/form-field/rich-markdown-editor.tsx:471
- note: the editor's guidance link points at the page held at the address "markdown-guide", so the help an author is offered is itself an editable page and reads "Initial version" until somebody writes it. What may be uploaded and who may then read it belongs to the files domain.

### D-content-23 · v1 · inferred · recovered

The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded.

- reconciliation: implemented-only
- given: a page the service created for itself and has never been edited, and a page an administrator created and another administrator later changed
- when: an administrator opens each page's managing screen
- then: the first names "System" as both publisher and last editor, and the second names the two people, each linked to their profile
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:408
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:426
- cites: src/back-end/lib/db/content.ts:93
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:30
- cites: docs/database-schema.md:83
- note: these names are disclosed only to an administrator; the same page read by anybody else carries no authorship at all. Authorship is recorded per version, so the last editor is the author of the current wording rather than of the page.

### D-content-24 · v1 · open · recovered

Two administrators editing the same page at once do not see each other's work, and the later of them to publish silently replaces the earlier's wording.

- reconciliation: implemented-only
- given: two administrators who both opened the same page for editing before either saved
- when: the first publishes their change and then the second publishes theirs
- then: both are told their changes were published, the page shows only the second administrator's wording, and the first's survives only as an earlier version nothing in the service can show
- cites: src/back-end/lib/resources/content.ts:241
- cites: src/back-end/lib/resources/content.ts:293
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:254
- note: the submission carries no record of which version it was based on, so the service cannot tell an overwrite from an ordinary change and no warning is possible. The consequence is not lost data — every version is kept — but silently reverted wording, and D-content-13 means the person whose text was replaced has no way to see that it happened.
- note: Exercise two simultaneous edits of one page against the running old application: does the second publish succeed on stale state, is the first author's wording replaced with no warning to either administrator, and is the replaced version recoverable through anything the service offers?

**This criterion has already been answered once, with `contract` or `spike`.** Neither one
moves it toward the contract, so answering the same way again would leave it exactly where it
is: already answered once: confirm, edit, obsolete or defect it.

### D-content-25 · v1 · inferred · recovered

Where a screen embeds the body of a page beside its own material, a page that is missing or unreadable leaves that part of the screen empty and the screen otherwise works.

- reconciliation: implemented-only
- given: an opportunity whose screen embeds the scope page's body, and that page having been removed
- when: a vendor opens the opportunity
- then: the opportunity is shown in full and the scope section is empty, with nothing said about why
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/view.tsx:144
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/view.tsx:202
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/instructions.tsx:58
- note: the same silent-empty handling covers the evaluation instructions an evaluation panel reads, so a panel can be shown a blank instruction screen and told nothing.

### D-content-26 · v1 · inferred · recovered

Where a screen exists in order to show the body of a page, a page that is missing or unreadable turns the whole screen into the not-found screen and the action it carried cannot be taken.

- reconciliation: implemented-only
- given: an organisation owner about to accept a program's qualification terms, and that program's terms page missing
- when: they open the screen where the terms are accepted
- then: they are shown the not-found screen, are told nothing about why, and cannot accept the terms
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:89
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:136
- cites: src/front-end/typescript/lib/pages/organization/team-with-us-terms.tsx:90
- note: this and D-content-25 are the two opposite handlings of the same failure, chosen screen by screen. Here the consequence reaches beyond wording: a missing or mis-addressed page blocks a business action, and the person blocked is given no reason and no route to one.

## Ratification conditions

One condition per line, and exactly one of these forms:

- `contract <ID>` — leave as recovered. It does not promote the criterion — `confirm`, `edit` and
  `defect` all do — so this is a no-op on anything still `inferred` or `open`. No text after the ID.
- `confirm <ID>` — the evidence now supports raising its confidence to `confirmed`. No text after the ID.
- `edit <ID>: <new statement>` — the behaviour is right, the wording is not; confidence rises to
  `confirmed` too, since the deliberate rewording is itself a second witness.
- `defect <ID>: <replacement statement>` — the old system does this and the new one should not; the row
  is kept as the record, its confidence rises to `confirmed` (it is a confirmed record of current
  behaviour, marked defect), and the replacement is filed against it.
- `spike <ID>: <question>` — not yet decided; confidence drops to `open` and the question is recorded.
- `obsolete <ID>: <why>` or `drop <ID>: <why>` — not to be carried forward at all.

The ID is the criterion's own id exactly as the domain file spells it. `contract` and `confirm`
take no text; every other verb requires a colon and text on the same line. A condition may not
span more than one line.


## Ruling

**Verdict:** approve
**By:** agent:product-owner

The question is which of the twelve content criteria still short of the contract become it, and I am approving with a condition on every one, having re-checked each against the old source myself rather than carrying the last gate's reading forward. I am not returning a second time, and the reason is evidence rather than impatience: the return I wrote on this proposal never reached archaeology. The run record's 01:24:36 entry is ratify regenerating site/gates.md, site/index.md and site/proposals/ratify-content-1.md and nothing else, and ratify-content-3.md is byte-identical to ratify-content-1.md but for its opened timestamp, so another return buys a fourth identical proposal while eleven sound criteria stay out of the contract and D-content-24 ages toward the automatic obsolete that closes the loop with nobody having decided it. Nine I am confirming, each on a witness independent of the one the recovery leaned on. D-content-2 - footer.tsx:17-40 carries exactly five contentView destinations, about, disclaimer, privacy, accessibility and copyright, beside a Home route that is not a page at all, and the stub migration seeds those same five slugs. D-content-9 - validateTitle is 1 to 100 and validateBody 1 to 50000 at validation/content.ts:8-14, and the else branch at resources/content.ts:170-176 returns the failing field by name rather than a generic refusal. D-content-10 - the regex at validation/content.ts:17 rejects capitals, spaces, underscores and leading or trailing hyphens, and the same validator is the form field's own at form.tsx:81 with the rule spelled out in its help text, so the front end cannot drift from the back end. D-content-11 - the two application checks at resources/content.ts:146-162 and :267-287 sit on top of slug declared unique at migration 20201028131858_admin-content-mgmt.ts:12, a database witness that holds whatever the application forgets. D-content-13 - generateContentQuery joins on max(id) so only the latest version is ever selected, and a search of the whole of pages/content for version, history, revision or restore returns nothing, which settles it by exhaustion rather than by absence of a link. D-content-14 - updateContent writes the new slug onto the root row in place at db/content.ts:189-197 while the front end replaces the route with the new slug at edit.tsx:287-291, and no alias or redirect table exists anywhere. D-content-15 - four enforcement points agree, the slug refusal at resources/content.ts:259-266, the delete refusal at :365-367, the disabled slug field at form.tsx:183-184 and the warning text at edit.tsx:507-517, and fixed is parsed off the create body at :126 then dropped before the validated body at :164-169, so the note that it can be neither set nor cleared through the service is actively enforced rather than merely unexercised. D-content-21 - uploadImage is wired into the editor at form.tsx:88-94, the controlImage branch uploads and inserts at rich-markdown-editor.tsx:287-296, and the guidance link at :471 is itself the contentView route for markdown-guide. D-content-23 - DEFAULT_USER_NAME is System at edit.tsx:408, the authorship columns are selected only for an admin session at db/content.ts:93-95, and createdBy is written per version at :213, which is what makes the last editor the author of the current wording rather than of the page. D-content-24 I am ruling for real rather than spiking again, because the source settles what the spike wanted the running application for. parseRequestBody at resources/content.ts:223-229 reads only slug, title and body, so no submission carries a base version, and :293 derives the new version from state the server re-read itself, so an administrator publishing over a page changed since they opened it silently replaces the other wording and is told the change was published at edit.tsx:270-291. But the recovered wording misses a qualification I am editing in rather than confirming as it stands - contentVersions has the composite primary key of id and contentId at migration 20201028131858:30, so two publishes interleaving inside one read-then-write window collide on that key and the second is refused with a service error instead of silently winning. The silent overwrite is the sequential case, and a rebuild told only the general story would build the wrong guard. D-content-25 I confirm on two independent screens - sprint-with-us/view.tsx initialises scopeContent to the empty string at :125, sets it only on a valid response at :202, and renders it at :500, while instructions.tsx:57-67 substitutes the empty string the same way for the evaluation panel. Its second note, framing this and D-content-26 as opposite handlings chosen screen by screen, is void, and no condition verb can strike a note, so I record here that it describes a contrast that does not exist. D-content-26 I am obsoleting rather than confirming, editing or defecting, because all three of those assert the row is an accurate record of what the old system did and it is not. The guard at sprint-with-us-terms.tsx:136 cannot fire on a missing page - body is a ResponseValidation declared at :59 and cmd.ts:93-96 maps 400, 401 and 404 alike to invalid of response.data, an ADT that is always truthy - so a missing terms page falls to the else branch at :147-152, keeps the empty string set at :81, and the view at :210-248 renders the title, an empty Markdown block and a live Accept Terms and Conditions button. team-with-us-terms.tsx is the same code with the same dead clause. The consequence is inverted from what was recovered - the business action is not blocked, it completes against terms the vendor was never shown - and the one screen that genuinely becomes the not-found screen when its page cannot be read is pages/content/view.tsx:75-86, which carries no action to block. Obsoleting keeps the row visible with the correction attached where the next stage will read it, which is more than a third round trip through an unchanged proposal would produce, but it does not create the two criteria now owed - the content view screen's not-found handling, and the defect that a program's qualification terms can be accepted with nothing in place of them - and those need archaeology to run, which the pipeline has not done since the last ruling. Not escalating - the tier is STANDARD, the producing stage reported no confidence shortfall, and there is no second plausible reading of the intent, since the code settles every one of these. What would change this ruling is a demonstration that ResponseValidation can be falsy on a 404, or any guard on the terms screens that reaches notFound before the view renders, either of which would put D-content-26 back in play as a real behaviour; short of that, the row stays obsolete and what the terms screens actually do must be recovered fresh.

**Conditions:**
- confirm D-content-2
- confirm D-content-9
- confirm D-content-10
- confirm D-content-11
- confirm D-content-13
- confirm D-content-14
- confirm D-content-15
- confirm D-content-21
- confirm D-content-23
- edit D-content-24: A change carries no record of the version it was based on, so an administrator who publishes over a page another has changed since it was opened silently replaces that wording and is told the change was published; only two publishes interleaving inside a single read-then-write window collide on the version key, and there the second is refused with a service error rather than silently winning.
- confirm D-content-25
- obsolete D-content-26: The screens this was recovered from do not behave this way - the !body guard at sprint-with-us-terms.tsx:136 and team-with-us-terms.tsx:135 is dead code, because cmd.ts:93-96 maps a 404 to an always-truthy invalid value, so a missing terms page falls through to the else branch, keeps the empty body it was initialised with, and renders the title, an empty block and a live Accept Terms and Conditions button; the only screen that genuinely becomes the not-found screen when its page cannot be read is pages/content/view.tsx:75-86, which carries no action to block. Nothing of this row is carried forward, and two criteria are owed in its place - the content view screen's not-found handling, and the defect that a program's qualification terms can be accepted with nothing shown in place of them.
