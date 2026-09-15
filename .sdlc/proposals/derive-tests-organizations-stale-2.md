---
gate: G3
question: "Do these tests follow from the organizations criteria and from nothing else?"
recommendation: "I rewrote tests for five of the six organizations criteria and recorded one, R-3.15, as blocked."
opened: 2026-09-15T02:32:32.142Z
---

# Do these tests follow from the organizations criteria and from nothing else?

**Recommendation.** I rewrote tests for five of the six organizations criteria and recorded one, R-3.15, as blocked.

I rewrote tests for five of the six organizations criteria and recorded one, R-3.15, as blocked. Nothing has been run. The workspace has no `node_modules` and there is no target to run against, so the files haven't been typechecked or executed. I scanned them for selectors, locator or page calls, test ids and hardcoded addresses, and found none. The new `not-testable.yaml` entry looks right when read back, but I couldn't run a parser over it because that command needed approval.

Every criterion was already on the redo list with a reason, so each rewrite follows its redo note. Two patterns come from tests already in the suite. First, a test confirms each account it relies on is active before using it: an administrator compares the account's status badge with their own and reactivates it if they differ. Second, the team list is never assumed to show email addresses. The seed gives no one a name, so each person a test needs to find writes a name on their own profile and is looked for by that name.

**The five tests:**

- **R-3.3** has two tests. In the first, the ordinary member and the member of public sector staff are both refused. Before trying, the staff member reads their own permissions; if those name administrator rights, an administrator withdraws the rights and the test checks again. In the second, the owner, the organization's administrator and a service administrator each see the organization. Being refused is read as the organization's name not appearing, since the criterion's own note says the refused member sees a "not found" page.
- **R-3.7**: the owner of the seeded organization with no other members invites two named, active vendors. Both then appear on the team list, and a pending badge that was absent before now shows. The team size on the owner's own memberships page stays the same until one invitee accepts, and then it changes. That change shows the reading would have moved had an invitation counted. I wrote only the owner case the given/when/then describes. The claim that its administrators and a service administrator may also invite is not tested.
- **R-3.8** has two tests: inviting the already-invited person again, and inviting a member of public sector staff. Nothing on the organization's page reports that an invitation was refused, so the refusal is read as nothing being created. The already-invited person still appears exactly once, still pending. The staff member never appears, and a named person in the same list shows that the list does show names. The reason for each refusal ("already a member", "only vendors") can't be read.
- **R-3.27**: the owner first checks that no acceptance is shown, then reads the terms and accepts them. An acceptance notice containing a date then appears, and the qualification page's reading changes. The second test accepts the terms itself before trying again, as the redo note asked. If the accept control is no longer offered, that also counts as a refusal. What is asserted is that the notice still shows the first acceptance.
  - That comparison is weak when both attempts fall on the same day, because the date would match even if a second acceptance had been recorded.
  - There is no observation of the "already accepted" message.
- **R-3.32**: the invited person from the seed declines through their own memberships page, which needs no identifier. A message reaches the owner whose subject or preview contains "reject", and their name leaves the team list.

**R-3.15 (blocked).** I deleted its old test and added a `blocked:` entry to `not-testable.yaml`. The organizations a vendor may act for are offered only in the organization picker on the Sprint With Us and Team With Us proposal-create pages. The surface gives that picker an action to choose an organization, but no way to read which organizations it offers. The organization list's "my organizations" and the memberships tables include organizations where the vendor is only an ordinary member. They also can't tell an administered organization from a member one. The starting state, though, can be built through the surface.

**Surface additions that would close these gaps:**

- An observation of the organizations offered to act for, such as `proposal-swu-create.organization_choices` and a Team With Us equivalent (or an organization-list observation of just those). This unblocks R-3.15.
- `organization-edit.invitation_refused` with its reason, so R-3.8 can read the refusal and why.
- An observation on `organization-swu-terms` and `organization-twu-terms` of the refusal of a second acceptance, so R-3.27 no longer relies on a same-day date.
- A way to read an account's administrator rights that doesn't depend on the permissions label's wording. R-3.3 currently looks for the word "admin" in that label.
- A per-row pending state on `organization-edit.team_member_row`, so R-3.7 can show that each invitee, not just someone, is pending.
