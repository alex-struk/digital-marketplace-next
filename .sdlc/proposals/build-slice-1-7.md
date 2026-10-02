---
gate: G3
question: "Does slice 1 (A visitor can read the service's own pages) do what its criteria say?"
recommendation: "`npm --prefix app run check` passes: all three test suites green, 766 tests in all."
opened: 2026-10-02T21:25:01.624Z
backend: claude
model: "claude-opus-5-5"
cli: "2.1.284 (Claude Code)"
isolation: "none"
---

# Does slice 1 (A visitor can read the service's own pages) do what its criteria say?

**Recommendation.** `npm --prefix app run check` passes: all three test suites green, 766 tests in all.

**Worked by:** claude claude-opus-5-5 (2.1.284 (Claude Code))

I've made the sandbox's three published host ports configurable, so several copies of the application can run side by side. `npm --prefix app run check` passes: all three test suites green, 766 tests in all. With no variables set, the compose file resolves to exactly today's ports and addresses. I couldn't confirm that with Docker itself, because `docker compose config` wasn't allowed in this session.

This was the operator's infrastructure request, not slice 1's criteria. R-7.1 to R-7.4, R-7.18 and R-7.19 were already in `app/` and I left them alone. Every screen, rule and behaviour is unchanged.

**What reads from variables now, in `app/compose/compose.yaml`:**
- **Application:** published on `${SDLC_APP_PORT:-4300}`; `SERVICE_ORIGIN` follows it.
- **Identity provider:** published on `${SDLC_IDP_PORT:-8080}`; `KC_HOSTNAME` and `OIDC_ISSUER` follow it.
- **Mail front:** published on `${SDLC_MAIL_PORT:-8025}`.
- **Frontend build:** gets `VITE_OIDC_URL` as a build argument from `http://localhost:${SDLC_IDP_PORT:-8080}`. `app/frontend/Dockerfile` takes it with a default of `http://localhost:8080`. It comes after the dependency install, so the install stays cached.
- **Realm:** `app/compose/idp/realm-template.json` now has a placeholder, `__APP_ORIGIN__`, in place of the three fixed redirect, web-origin and post-logout addresses. `render-realm.mjs` fills it from `APP_ORIGIN` the same way it fills the password, and the compose file sets that to `http://localhost:${SDLC_APP_PORT:-4300}`.
- **Unchanged:** ports inside the compose network (`idp:8080`, `backend:3001`, `mail:8025`, the frontend's 3000) don't move.

**Other fixed addresses in `app/`, left as they were:**
- The backend's fallback mail origin and the frontend's fallback identity-provider address only apply when their variable is unset, and compose now always sets both.
- The Vite dev server's port 4300 is already moved by `PORT`, and nothing in compose uses that server.
- The test files have their own fixed addresses, and they don't depend on the sandbox.

**Tests:** I extended `app/backend/tests/sandbox-composition.test.ts`. It now applies compose's `${NAME:-default}` substitution both with no variables and with a second copy on 4301/8081/8026, and runs the real realm renderer into a temporary directory. It checks that:
- by default the ports are 4300, 8080 and 8025, the mail front sits alone on 8025, and the rendered realm allows only `http://localhost:4300`;
- a copy on 4301 allows only its own address;
- the issuer, the identity provider's own name and the frontend's build argument always agree;
- every published host port moves with its variable while the container-side ports stay put.

To make the renderer testable outside its container, it now takes two optional overrides, `REALM_TEMPLATE` and `REALM_OUTPUT`. The compose file sets neither.

**Docs:** I updated the comments in compose, `app/compose/idp/README.md` and `app/README.md`, and added decision record `docs/decisions/0045-the-sandbox-ports-are-read-from-variables.md`. It says each copy also needs its own project name (`docker compose -p …`) so its containers and volumes are separate. The file still defaults to `digital-marketplace`.

**Not done:**
- The realm placeholder and `VITE_OIDC_URL` are only checked by tests that read the files; I didn't build or start any container.
- Whoever runs the side-by-side copies has to pass a different port set and project name to each one.

Nothing outside `app/` and `docs/decisions/` was touched.
