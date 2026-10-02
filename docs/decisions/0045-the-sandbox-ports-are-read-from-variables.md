# 0045 · The sandbox's host ports are read from variables

## Context

The pipeline runs several copies of the local sandbox (`app/compose/compose.yaml`) side by side
so that the acceptance suite can be spread across them (pipeline decision 0090). Each copy is
its own compose project and must publish on host ports of its own. Until now the sandbox fixed
its three published ports — the application on 4300, the identity provider on 8080, the mail
catcher's front on 8025 — and named them in several addresses: the issuer the service checks
tokens against, the name the identity provider gives itself, the origin the service writes into
its mail, the identity provider's address the app is built with, and the client's redirect and
post-logout origins in the realm.

## Decision

Every published host port, and every address that names one, is read from a variable whose
default is the value it had:

| Variable         | Default | Read by                                                                              |
| ---------------- | ------- | ------------------------------------------------------------------------------------ |
| `SDLC_APP_PORT`  | 4300    | `frontend` port, `SERVICE_ORIGIN`, `idp-realm`'s `APP_ORIGIN`                        |
| `SDLC_IDP_PORT`  | 8080    | `idp` port, `KC_HOSTNAME`, `OIDC_ISSUER`, the frontend's `VITE_OIDC_URL` build argument |
| `SDLC_MAIL_PORT` | 8025    | `mail-front` port                                                                    |

Only the host side moves. Every port inside the compose network (`idp:8080`, `backend:3001`,
`mail:8025`, the frontend's 3000) stays as it was, so nothing that talks across the network
changes.

The realm template no longer carries the application's origin. `__APP_ORIGIN__` stands in for
it, and the `idp-realm` renderer fills it from `APP_ORIGIN` exactly as it fills the password,
escaped as a JSON string's contents. The frontend Dockerfile takes `VITE_OIDC_URL` as a build
argument, defaulting to `http://localhost:8080`, because Vite fixes it into the bundle at build
time.

## Consequences

With none of the variables set the sandbox is what it was: the same ports, the same addresses,
the same rendered realm. `app/backend/tests/sandbox-composition.test.ts` interpolates the
compose file both ways — defaults, and a second copy on 4301/8081/8026 — and runs the realm
renderer, so a fixed port or address reintroduced anywhere those tests reach fails `check`.

Each copy must also be given its own compose project name (`docker compose -p ...`) so its
containers and volumes are its own; the file keeps `name: digital-marketplace` as the default.

The defaults in code — the service's mail origin when `SERVICE_ORIGIN` is unset, the app's
identity provider address when `VITE_OIDC_URL` is unset, the Vite dev server's port — are left
as they were: the compose file now always sets the first two, and the third is a builder's dev
server that `PORT` already moves.
