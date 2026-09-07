# content

The service's own prose — its terms and conditions, its privacy, accessibility, copyright and
disclaimer notices, the scope and evaluation notes shown inside an opportunity, the instructions an
evaluation panel reads — is not written into the service. Each piece is a page with a title, a body
of formatted text and a short address, held by the service and edited through it by an
administrator, so the words a visitor reads can change without the service changing. Some of those
pages are ordinary, created and removed at will; others are marked as needed by the service itself,
because a part of the service links to them or embeds their text, and those may be re-worded but
neither renamed nor removed.

Three sources describe this domain outside the code and all three agree with it as far as they go.
The release notes record that the service's static pages moved into the service's own keeping, that
an administrator manages them from a content area reached from the navigation menu, and — the part
that matters most for a rebuild — that the pages the service needs are created by migration with
placeholder text only, so a fresh installation carries a full set of pages that all say the same
stub sentence until somebody writes them. The schema description records the two record shapes
behind a page: one for the page itself and one for each successive version of its title and body.
A manual test script records creating, reading, editing and deleting a page, checking that each
needed page can be opened, and announcing changed terms from the terms page.

The service's published interface description covers a dozen other parts of the service and says
nothing at all about pages, so every criterion below that concerns a request rather than a screen
rests on the code alone. Two mismatches inside the code are recorded as criteria rather than
hidden: seven pages the service creates for itself are linked from nowhere in it, and one page it
links to from five places is never created. Where a criterion touches the announcement of changed
terms, it records only what the page offers; who is notified and what they are told already sits
with the notifications domain.

### D-content-1 · v1 · inferred · recovered
Anyone, including a visitor who has not signed in, can read a page by its address and sees its
title, its body as formatted text, and the dates it was first published and last updated.
- cites: src/back-end/lib/resources/content.ts:66
- cites: src/front-end/typescript/lib/pages/content/view.tsx:94
- cites: src/front-end/typescript/lib/app/router.ts:650
- reconciliation: implemented-only
- given: a page that exists at the address "privacy"
- when: a visitor who is not signed in opens that address
- then: the page's title, its body as formatted text, and its published and updated dates are shown
- note: reading is the only thing this domain lets anybody but an administrator do; no permission is checked on the way in, so a page is public from the moment it is created and there is no way to hold one back as a draft or restrict it to signed-in people.

### D-content-2 · v1 · inferred · recovered
The service links its own footer to five of its pages, so every screen offers the about, disclaimer, privacy, accessibility and copyright pages to any visitor.
- cites: src/front-end/typescript/lib/app/view/footer.tsx:22
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:8
- reconciliation: implemented-only
- given: any screen of the service, seen by a visitor who is not signed in
- when: the visitor reaches the bottom of it
- then: links labelled About, Disclaimer, Privacy, Accessibility and Copyright each open the corresponding page
- note: these five are the service's whole standing offer of its own legal and informational prose; nothing outside the code describes them, and each is a page an administrator can re-word at any time.

### D-content-3 · v1 · inferred · recovered
A request for a page at an address that no page holds is answered as not found.
- cites: src/back-end/lib/resources/content.ts:102
- cites: src/front-end/typescript/lib/pages/content/view.tsx:77
- reconciliation: implemented-only
- given: no page at the address "nothing-here"
- when: a visitor opens that address
- then: they are shown the service's not-found page and no page content

### D-content-4 · v1 · inferred · recovered
A request for a page at an address that is not a well-formed one is refused as an invalid request rather than reported as not found, though a visitor using the service sees the not-found screen either way.
- cites: src/back-end/lib/resources/content.ts:87
- cites: src/shared/lib/validation/content.ts:16
- cites: src/front-end/typescript/lib/pages/content/view.tsx:77
- reconciliation: implemented-only
- given: no page at the address "Not_A_Slug"
- when: that address is requested
- then: the request is refused for being malformed rather than answered as not found, and a visitor browsing the service is shown the not-found screen in both cases
- note: the difference is only visible to something reading the service's answers directly; the browsing experience is identical, so this matters for anything built against the service rather than for a person.

### D-content-5 · v1 · inferred · recovered
A page can also be read by its identifier, and the service falls back to treating the same value as an address when no page carries that identifier.
- cites: src/back-end/lib/resources/content.ts:76
- cites: src/back-end/lib/db/content.ts:110
- cites: src/back-end/lib/db/content.ts:119
- reconciliation: implemented-only
- given: a page whose identifier is known
- when: that identifier is used in place of the page's address
- then: the same page is returned
- note: the two lookups are tried in order, identifier first and address second, so a page whose address happens to be shaped like an identifier is still reachable by that address.

### D-content-6 · v1 · confirmed · recovered
Only an administrator can see the list of pages, and it names every page with its title, its public address, whether the service needs it, and when it was created and last updated, ordered by title.
- cites: src/back-end/lib/permissions.ts:1628
- cites: src/front-end/typescript/lib/pages/content/list.tsx:56
- cites: src/front-end/typescript/lib/pages/content/list.tsx:105
- cites: src/front-end/typescript/lib/pages/content/list.tsx:125
- cites: CHANGELOG.md:131
- reconciliation: implemented-only
- given: an administrator signed in, and pages existing in the service
- when: they open the content area from the navigation menu
- then: every page is listed once, in order of title, showing its title, its public address, whether it is one the service needs, and its created and updated dates
- note: the release notes record the same area and the same route into it from the navigation menu. A defect in the created and updated dates shown here was corrected in an earlier release, so the dates on this list are the page's own creation date and the date of its most recent change.

### D-content-7 · v1 · confirmed · recovered
The route into the content area is offered only to an administrator, and anybody else who reaches any of the managing screens directly is shown the not-found screen.
- cites: src/front-end/typescript/lib/app/view/index.tsx:800
- cites: src/front-end/typescript/lib/pages/content/list.tsx:56
- cites: src/front-end/typescript/lib/pages/content/create.tsx:66
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:101
- cites: CHANGELOG.md:131
- reconciliation: implemented-only
- given: a signed-in vendor or public sector employee
- when: they look at the navigation menu, and then open the address of the content area directly
- then: no route into the content area is offered to them, and opening it directly shows the not-found screen

### D-content-8 · v1 · confirmed · recovered
An administrator can create a page by giving it a title, an address and a body, and once published it is readable by anyone at that address.
- cites: src/front-end/typescript/lib/pages/content/create.tsx:118
- cites: src/back-end/lib/resources/content.ts:111
- cites: src/back-end/lib/db/content.ts:128
- cites: docs/smoke-testing/2022-12-02.md:48
- reconciliation: implemented-only
- given: an administrator in the content area
- when: they create a page, fill in its title, address and body, and confirm publishing it
- then: the page exists, they are taken to its managing screen, and any visitor opening its address sees it

### D-content-9 · v1 · inferred · recovered
A page must have a title of between one and a hundred characters and a body of between one and fifty thousand characters, and a submission failing either is refused with the failing field named.
- cites: src/shared/lib/validation/content.ts:8
- cites: src/shared/lib/validation/content.ts:12
- cites: src/back-end/lib/resources/content.ts:141
- reconciliation: implemented-only
- given: an administrator creating or changing a page
- when: they submit it with an empty title, or with a body longer than fifty thousand characters
- then: nothing is saved and the failing field is marked with the reason

### D-content-10 · v1 · inferred · recovered
A page's address must be lowercase letters and digits in hyphen-separated groups, and any other address is refused.
- cites: src/shared/lib/validation/content.ts:16
- cites: src/front-end/typescript/lib/pages/content/lib/components/form.tsx:174
- reconciliation: implemented-only
- given: an administrator creating a page
- when: they give it an address containing a capital letter, a space, an underscore, or a leading or trailing hyphen
- then: the page is not created and the address is marked as invalid
- note: the rule is stated to the administrator on the form as well as enforced on submission, and the form shows the full public address the page will have.

### D-content-11 · v1 · inferred · recovered
No two pages may share an address, whether the clash arises on creating a page or on renaming one.
- cites: src/back-end/lib/resources/content.ts:146
- cites: src/back-end/lib/resources/content.ts:267
- reconciliation: implemented-only
- given: a page already published at the address "about"
- when: an administrator creates another page at that address, or renames a different page to it
- then: neither is accepted, the existing page is untouched, and the address is reported as already in use

### D-content-12 · v1 · confirmed · recovered
Publishing a change to a page keeps the text it replaces as an earlier version of that page and shows the new text to every reader from that moment.
- cites: src/back-end/lib/db/content.ts:181
- cites: src/back-end/lib/db/content.ts:67
- cites: src/back-end/lib/resources/content.ts:293
- cites: docs/database-schema.md:93
- cites: docs/smoke-testing/2022-12-02.md:50
- reconciliation: implemented-only
- given: a published page an administrator has changed the body of
- when: they confirm publishing the change
- then: readers of the page's address see the new body, the page's updated date becomes the moment of the change, and the replaced title and body are kept as an earlier version
- note: each version carries its own title and body, so the whole wording of a page at any past moment is retained, not only the changed part.

### D-content-13 · v1 · inferred · recovered
Nothing in the service shows, compares or restores an earlier version of a page.
- cites: src/back-end/lib/db/content.ts:67
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:410
- reconciliation: implemented-only
- given: a page changed several times, so several earlier versions of it are kept
- when: an administrator opens its managing screen
- then: only the current title and body are shown, with no history, no earlier version and no way back to one
- note: the versions accumulate with no route to them and no limit on their number. Recovering superseded wording is possible only from outside the service, which makes the retention useful for audit but not for undoing a mistaken edit.

### D-content-14 · v1 · inferred · recovered
Renaming a page moves it to its new address at once and leaves nothing at the old one.
- cites: src/back-end/lib/db/content.ts:189
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:287
- reconciliation: implemented-only
- given: a page published at the address "about-us" and links to it from elsewhere
- when: an administrator changes its address to "about"
- then: the page answers at "about", the old address is answered as not found, and no redirection is offered
- note: nothing warns the administrator that a rename breaks existing links, and nothing in the service records the address a page used to have.

### D-content-15 · v1 · inferred · recovered
A page the service itself depends on may have its title and body changed but may not be renamed or removed, and its managing screen says so.
- cites: src/back-end/lib/resources/content.ts:258
- cites: src/back-end/lib/resources/content.ts:360
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:507
- cites: src/front-end/typescript/lib/pages/content/lib/components/form.tsx:183
- reconciliation: implemented-only
- given: an administrator on the managing screen of a page the service needs
- when: they look for the ways to change it
- then: a warning explains that the service needs this page at this address, the address cannot be typed over, no removal is offered, and a request to rename or remove it made another way is refused
- note: whether a page is one the service needs is fixed when the page is created by migration and cannot be set or cleared through the service, so an administrator can neither promote an ordinary page to a needed one nor demote a needed one.

### D-content-16 · v1 · confirmed · recovered
Removing an ordinary page removes it and every version of it permanently, and its address stops answering.
- cites: src/back-end/lib/resources/content.ts:335
- cites: src/back-end/lib/db/content.ts:233
- cites: src/migrations/tasks/20201028131858_admin-content-mgmt.ts:29
- cites: docs/smoke-testing/2022-12-02.md:51
- reconciliation: implemented-only
- given: an ordinary page with several versions behind it
- when: an administrator confirms removing it
- then: they are returned to the list of pages, told it was removed, its address is answered as not found, and no version of its text survives anywhere in the service
- note: removal is immediate and unrecoverable; there is no archive, no restore and no confirmation beyond the one dialogue.

### D-content-17 · v1 · confirmed · recovered
Only an administrator may create, change or remove a page; the same request from anybody else, signed in or not, changes nothing.
- cites: src/back-end/lib/permissions.ts:1632
- cites: src/back-end/lib/permissions.ts:1636
- cites: src/back-end/lib/permissions.ts:1640
- cites: src/back-end/lib/resources/content.ts:130
- cites: CHANGELOG.md:131
- reconciliation: implemented-only
- given: a signed-in vendor, a signed-in public sector employee, and a visitor who is not signed in
- when: each of them asks the service to create, change or remove a page
- then: each request is refused and no page is created, changed or removed

### D-content-18 · v1 · inferred · recovered
A request to create, change or remove a page that is refused for lack of permission is reported in the same shape as one refused for a malformed submission.
- cites: src/back-end/lib/resources/content.ts:204
- cites: src/back-end/lib/resources/content.ts:324
- cites: src/back-end/lib/resources/content.ts:385
- cites: src/back-end/lib/resources/content.ts:55
- reconciliation: defect
- given: a vendor who is not permitted to change pages
- when: they ask the service to change one
- then: the refusal comes back as though the submission were faulty rather than as a refusal of permission
- note: the same resource answers a refused request for the list of pages as a permission refusal, so the two halves of this domain disagree with each other and with the rest of the service, where creating or changing something one may not touch is answered as a permission refusal. Nothing is wrongly permitted — the refusal is correct, only mislabelled — so there is no corrected criterion to replace this one with; a human should rule on whether the rebuild reports it as a permission refusal.

### D-content-19 · v1 · confirmed · recovered
A fresh installation carries a full set of the pages the service needs, each holding placeholder text and titled by its own address until somebody writes it.
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:8
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:26
- cites: src/migrations/tasks/20221130162144_twu-admin-content-stub.ts:8
- cites: src/migrations/tasks/20230213120034_twu-opportunity-scope.ts:8
- cites: src/migrations/tasks/20230321113754_add-twu-proposals.ts:8
- cites: src/migrations/tasks/20240607173220_admin-evaluation-content-stubs.ts:8
- cites: CHANGELOG.md:132
- reconciliation: implemented-only
- given: a newly prepared installation of the service that nobody has edited
- when: a visitor opens any of the pages the service needs, such as its terms and conditions
- then: the page exists and answers, its title is its own address, and its body reads "Initial version"
- given: an administrator looking at the list of pages on that installation
- when: they read it
- then: twenty-two pages are listed, all marked as needed by the service
- note: the twenty-two are seven service-wide pages — about, accessibility, copyright, disclaimer, privacy, the markdown guidance page and the service's own terms and conditions — an opportunity guide, a proposal guide and a terms and conditions page for each of the three programs, an opportunity scope and a proposal evaluation page for Sprint With Us and for Team With Us but for neither of Code With Us, and an evaluation instructions page for Sprint With Us and Team With Us. The set grew program by program as each was added, which is why it is uneven. The release notes warn explicitly that these arrive as stubs and must be written before use, so a rebuild that seeds them the same way inherits an installation whose legal pages are placeholders.

### D-content-20 · v1 · confirmed · recovered
The service's own terms and conditions page carries, for an administrator, the action that announces changed terms to vendors, and no other page carries it.
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:114
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:540
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:619
- cites: docs/smoke-testing/2022-12-02.md:94
- cites: CHANGELOG.md:134
- reconciliation: aligned
- given: an administrator on the managing screen of the service's terms and conditions page
- when: they look at what they can do with it
- then: alongside editing they are offered an action announcing the change to vendors, warned first that vendors will have to accept the new terms before submitting again
- given: an administrator on the managing screen of any other page
- when: they look at what they can do with it
- then: no such action is offered
- note: what the announcement does to vendors' acceptances and who receives a message is recorded with the notifications domain. Recorded here only is that the terms page is the one place the action is offered, and that the page and the action are matched by the page's address, so renaming that page — which the service forbids — would take the action away with it. Announcing and editing are independent: an administrator may announce without having changed a word, and may change the terms without announcing.

### D-content-21 · v1 · inferred · recovered
A page's body is written as marked-up text with an editor offering formatting shortcuts, a link to the guidance page, and image upload that places the uploaded image into the body.
- cites: src/front-end/typescript/lib/pages/content/lib/components/form.tsx:88
- cites: src/front-end/typescript/lib/components/form-field/rich-markdown-editor.tsx:287
- cites: src/front-end/typescript/lib/components/form-field/rich-markdown-editor.tsx:471
- reconciliation: implemented-only
- given: an administrator editing a page's body
- when: they use the image control to choose an image file
- then: the image is stored by the service and a reference to it is inserted into the body at the cursor, and the published page shows the image
- note: the editor's guidance link points at the page held at the address "markdown-guide", so the help an author is offered is itself an editable page and reads "Initial version" until somebody writes it. What may be uploaded and who may then read it belongs to the files domain.

### D-content-22 · v1 · inferred · recovered
Raw markup embedded in a page's body is rendered as markup on the page itself, and is not rendered where the same body is embedded in another screen.
- cites: src/front-end/typescript/lib/pages/content/view.tsx:115
- cites: src/front-end/typescript/lib/views/markdown.tsx:144
- cites: src/front-end/typescript/lib/views/markdown.tsx:64
- reconciliation: defect
- given: a page whose body contains raw markup rather than formatting marks
- when: a visitor opens the page's own address, and then opens a screen that embeds the same body
- then: the markup takes effect on the page's own address, and is shown as literal text where it is embedded
- note: the body is rendered on the page's own address without any filtering of what the markup may contain, which makes page authorship an unusually powerful permission — everything a page can do to a reader's browser is available to whoever may edit one. Only an administrator can author a page, so this is not reachable by an untrusted person today, but it should not be carried into the rebuild unchanged; there is no corrected criterion yet because whether the rebuild keeps raw markup at all is a decision for a human. The inconsistency between the two renderings is itself worth ruling on, since an author previewing their page cannot tell which one another screen will use.

### D-content-23 · v1 · inferred · recovered
The managing screen of a page names who first published it and who last changed it, and names the service itself where no person is recorded.
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:408
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:426
- cites: src/back-end/lib/db/content.ts:93
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:30
- cites: docs/database-schema.md:83
- reconciliation: implemented-only
- given: a page the service created for itself and has never been edited, and a page an administrator created and another administrator later changed
- when: an administrator opens each page's managing screen
- then: the first names "System" as both publisher and last editor, and the second names the two people, each linked to their profile
- note: these names are disclosed only to an administrator; the same page read by anybody else carries no authorship at all. Authorship is recorded per version, so the last editor is the author of the current wording rather than of the page.

### D-content-24 · v1 · inferred · recovered
Two administrators editing the same page at once do not see each other's work, and the later of them to publish silently replaces the earlier's wording.
- cites: src/back-end/lib/resources/content.ts:241
- cites: src/back-end/lib/resources/content.ts:293
- cites: src/front-end/typescript/lib/pages/content/edit.tsx:254
- reconciliation: implemented-only
- given: two administrators who both opened the same page for editing before either saved
- when: the first publishes their change and then the second publishes theirs
- then: both are told their changes were published, the page shows only the second administrator's wording, and the first's survives only as an earlier version nothing in the service can show
- note: the submission carries no record of which version it was based on, so the service cannot tell an overwrite from an ordinary change and no warning is possible. The consequence is not lost data — every version is kept — but silently reverted wording, and D-content-13 means the person whose text was replaced has no way to see that it happened.

### D-content-25 · v1 · inferred · recovered
Where a screen embeds the body of a page beside its own material, a page that is missing or unreadable leaves that part of the screen empty and the screen otherwise works.
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/view.tsx:144
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/view.tsx:202
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/edit/tab/instructions.tsx:58
- reconciliation: implemented-only
- given: an opportunity whose screen embeds the scope page's body, and that page having been removed
- when: a vendor opens the opportunity
- then: the opportunity is shown in full and the scope section is empty, with nothing said about why
- note: the same silent-empty handling covers the evaluation instructions an evaluation panel reads, so a panel can be shown a blank instruction screen and told nothing.

### D-content-26 · v1 · inferred · recovered
Where a screen exists in order to show the body of a page, a page that is missing or unreadable turns the whole screen into the not-found screen and the action it carried cannot be taken.
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:89
- cites: src/front-end/typescript/lib/pages/organization/sprint-with-us-terms.tsx:136
- cites: src/front-end/typescript/lib/pages/organization/team-with-us-terms.tsx:90
- reconciliation: implemented-only
- given: an organisation owner about to accept a program's qualification terms, and that program's terms page missing
- when: they open the screen where the terms are accepted
- then: they are shown the not-found screen, are told nothing about why, and cannot accept the terms
- note: this and D-content-25 are the two opposite handlings of the same failure, chosen screen by screen. Here the consequence reaches beyond wording: a missing or mis-addressed page blocks a business action, and the person blocked is given no reason and no route to one.

### D-content-27 · v1 · inferred · recovered
Seven of the pages the service creates for itself are linked from nowhere within it and can be reached only by knowing their address.
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:11
- cites: src/migrations/tasks/20221130162144_twu-admin-content-stub.ts:8
- cites: src/migrations/tasks/20230213120034_twu-opportunity-scope.ts:8
- cites: src/front-end/typescript/lib/pages/learn-more/index.tsx:18
- reconciliation: implemented-only
- given: an installation carrying the full set of pages the service needs
- when: a visitor uses the service without typing addresses by hand
- then: the opportunity guide and proposal guide pages of all three programs, and the Team With Us opportunity scope page, are never offered to them
- note: the seven are code-with-us-opportunity-guide, code-with-us-proposal-guide, sprint-with-us-opportunity-guide, sprint-with-us-proposal-guide, team-with-us-opportunity-guide, team-with-us-proposal-guide and team-with-us-opportunity-scope. They are still marked as needed by the service, so an administrator cannot remove them and the list of pages gives no hint that they are unused; the equivalent explanatory material is now built into the service's own learn-more screens instead. A human should rule on whether the rebuild seeds them at all.

### D-content-28 · v1 · open · recovered
The service links from five places to a service level agreement page that it never creates for itself.
- cites: src/front-end/typescript/lib/pages/learn-more/index.tsx:25
- cites: src/front-end/typescript/lib/views/program-card.tsx:63
- cites: src/front-end/typescript/lib/pages/opportunity/code-with-us/lib/components/form.tsx:1055
- cites: src/front-end/typescript/lib/pages/opportunity/sprint-with-us/lib/components/form.tsx:1500
- cites: src/migrations/tasks/20201202094826_admin-content-stubs.ts:8
- reconciliation: defect
- given: an installation carrying only the pages the service creates for itself
- when: a public sector employee follows the service level agreement link offered beside the cost of a program
- then: they are shown the not-found screen
- note: no migration creates a page at "service-level-agreement", and it is named in none of the addresses the service holds as its own, so on the evidence in the source the link is broken. It cannot be settled from the source alone, because an administrator can create an ordinary page at that address by hand and a running installation may well have one — which is why this is recorded as unresolved rather than as a plain break. Either way the page would be an ordinary one: removable, renameable, and absent from a fresh installation, unlike every other page the service links to from its own screens. A human should rule on whether the rebuild adds it to the pages the service creates for itself.
