---
stage: "build"
title: "build slice 1"
at: "2026-09-25T02:11:34.377Z"
cost: 0.42967340000000004
turns: 27
session: "d087b9af-c840-4c17-94ba-14e973c43c27"
---

I've moved the application's address from port 3000 to http://localhost:4300, as the ruling asked, and made no other changes. `npm --prefix app run check` now passes: all three packages typecheck and the unit tests pass (15 + 47 + 33). I have not brought the sandbox up with Docker, so none of this has been checked against a running application.

**What changed.** The frontend service in `app/compose/compose.yaml` is now published as `4300:3000`. Only the host port was fixed by the ruling, so the frontend still listens on 3000 inside its container, and its Caddyfile and Dockerfile are unchanged. A comment in the compose file now says which port is which. No other service in that file publishes 4300, and the identity provider stays at 8080. The client in `app/compose/idp/realm-template.json` now allows only `http://localhost:4300` for its sign-in redirects, its web origin and its sign-out redirects. The addresses in `app/README.md` and `app/compose/idp/README.md` now say 4300. The test in `app/backend/tests/sandbox-composition.test.ts` now asserts that the frontend is the only service on host port 4300.

**One change the ruling did not name.** The local dev server in `app/frontend/vite.config.ts` also defaults to 4300 now. The identity provider only accepts redirects back to 4300, so a dev server left on 3000 could not sign anyone in, and the README's dev instructions say 4300 too.

**A file I could not change.** `spec/contract/openapi.yaml` still gives `http://localhost:3000` as its default server address. That file belongs to the contract stage, so I left it. The application doesn't read it: the frontend client sends requests to whatever address the page itself was loaded from (`app/frontend/src/api/client.ts`), so it works on 4300. Changing that default would be for the contract stage to decide.

**Condition build-slice-1-4#1.** An earlier revision reported R-7.12 and R-7.17 as exercised on the strength of one session driving the application by hand. That session was run without Docker or a browser, against a stand-in database that dropped its connection and returned a 500 partway through, and nobody can repeat it. It showed:
- the seeded page served at its own address with its expected wording and both of its dates;
- markup inside a page's body shown as plain text and never run.

That is all it showed. **Neither R-7.12 nor R-7.17 is asserted.** A criterion is asserted only by the acceptance suite, and no verify run has touched either one. R-7.12 belongs to slice 5 in the plan, with the list of pages and the count it is checked against; this slice only creates the sixteen pages so the links required by R-7.18 have somewhere to go. What that session left in the tree is still here and unchanged:
- `app/frontend/tests/content-view.test.tsx` pins the seeded page's wording and both its dates;
- `app/frontend/tests/formatted-text.test.tsx` holds the rule that markup is never executed.

**Slice 1's criteria.** R-7.1, R-7.2, R-7.3, R-7.4, R-7.18 and R-7.19 are built exactly as the previous revision built them. The only thing this revision changes for them is the port they are served on.

**What is still open.** There is still no passing verify for this tree. The next verify run, pointed at 4300, is the first thing that can assert these criteria.