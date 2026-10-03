---
gate: G3
question: "Does this adapter bind every surface action and observation on old, and nothing else?"
recommendation: "I added the organization-request page to the \"old\" adapter."
opened: 2026-10-03T15:01:35.473Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does this adapter bind every surface action and observation on old, and nothing else?

**Recommendation.** I added the organization-request page to the "old" adapter.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I added the organization-request page to the "old" adapter. All 10 new members are bound and listed in `tests/adapters/old/bindings.yaml`. I could not compile them: running the TypeScript compiler (and my shell probing script) needed approval this session doesn't have, so the new code has not been type-checked or run against the target. I checked the types by reading the code instead. I left the earlier bindings alone.

**What I bound.** The contract describes this page as requests sent straight to the service at `/api/organizations/:orgId`, not a screen. So I bound it the same way as the adapter's other request pages: requests are sent from the browser's own signed-in session, and the observations read the latest answer. Before writing anything I signed in as a vendor, as the administrator, and as the organization's administrator persona, and sent each request to see how the target answers:

- **`register_by_request`** sends the registration with `POST /api/organizations`. A vendor gets 201 with the new organization. The administrator gets 401 "permissions". A blank or invalid registration gets 400 with a list of messages under each field name (`contactEmail`, `websiteUrl`, and so on).
  - Each input key is matched to a profile field under several spellings ("postal code" for the mail code, "province" for the region, and so on).
  - Fields the input leaves out are not sent, so the service answers for them.
  - An input key that matches no profile field throws `unbound:` naming that key, rather than being dropped.
- **`change_profile_by_request`** sends `PUT /api/organizations/:id` with the profile change. The owner and the administrator get 200; anyone else gets 401 "permissions", including the organization's own administrator. Before sending, it reads the current profile where the signed-in person is allowed to, and adds the change on top of it. That way a change to only the legal name is not refused because of the fields it left alone. A field error comes back nested one level down in the answer, and `refusal_reason` looks inside it to report the field name.
- **`archive_by_request`** sends `DELETE /api/organizations/:id`: 200 when it works, 401 "permissions" for someone not allowed, and 404 "notFound" for an organization that does not exist (I checked this as the administrator).
- **The observations:**
  - `request_accepted` returns the status and body when the request went through, and empty when it was refused.
  - `refusal_status` returns the status code of a refusal.
  - `refusal_reason` returns the names the refusal is filed under.
  - `refusal_messages` returns the messages in the order the service gives them.
  - `organization_identifier` returns the `id` from a 201 answer, and empty otherwise.
  - `stored_active` and `stored_legal_name` read the organization again, as the signed-in person. They use the opened organization, or the one just registered if none was opened. If neither exists, they throw `unbound:`. I confirmed the organization's administrator can read the seeded qualified organization and sees it unchanged after a refused change.

**One judgement call a reviewer should check.** On this target an archived organization answers 404 "Organization not found." to every reader, the administrator included. So when the stored-active read gets 404, I return `false` and the stored legal name returns empty. When the person is not allowed to read the organization at all, both return empty instead of throwing. The catch: a 404 cannot tell "archived" apart from "never existed", so for an organization that never existed, `stored_active` also returns `false`.

**Side effects of probing.** I registered one test organization and archived it. I also renamed the seeded unqualified organization and then put its profile back by hand. The harness re-seeds before every test, so neither should carry over.

Every route this page needs worked on the target; none failed to resolve. I changed nothing outside `tests/adapters/old/`.

## Fix turn

I fixed the compile error: `tests/adapters/old/index.ts` defined `organizationNamed` twice in the same scope. I couldn't rerun the compiler afterwards, because the sandbox would not let me run `tsc` without approval. The fix is checked by search only.

**Journal addition:** The compiler reported "Duplicate function implementation" at lines 4437 and 10512 of `tests/adapters/old/index.ts`. Both were functions named `organizationNamed`. The one at 4437 was already there and returns an organization's legal name for the pages bound earlier. The one at 10512 came in with this run's organization-request binding and returns an organization's identifier, falling back to the organization opened on that page. I renamed the second one to `requestOrganizationId` at `index.ts:10512`. I also updated its only two callers, in `change_profile_by_request` (line 10554) and `archive_by_request` (line 10574). The original function, its callers, and everything else in the adapter and in `bindings.yaml` are unchanged, and the new name appears nowhere else in the file. After the edit, a search finds one definition under each name and every call goes to the function it was meant for.
