# 0006 · The service deploys to OpenShift sandbox namespaces only, through the quickstart's pinned workflows

- Status: proposed (G2), revised after the first G2 return to follow the stack profile's deploy rules
- Date: 2026-09-19

## Decision

The application ships two container images, as `bcgov/quickstart-openshift` scaffolds them:

- the **frontend** image, whose web server serves the built single-page app and forwards `/api/*`,
  `/status` and `/admin/*` to the backend Service;
- the **backend** image, which runs NestJS.

Each has a Deployment and a Service, and one Route fronts the frontend. The schema migrations
(Knex, 0001 and 0002) run as an init container on the backend Deployment, so the backend never
starts against an unmigrated database. Every Deployment runs non-root, drops all capabilities,
allows no privilege escalation, uses a read-only root filesystem and sets resource requests and
limits. The backend's liveness and readiness probes use `/status`.

The upload working directory (R-8.16) is an `emptyDir` volume mounted at a fixed path on the backend,
because the root filesystem is read-only. It is sized to hold a handful of 10 MB uploads and is
emptied after every upload, whatever the outcome (R-8.18).

Build and deploy go through the `bcgov/quickstart-openshift-helpers` reusable workflows. They are
referenced by a pinned, versioned commit, as the stack profile requires, and hardened as the
`github-actions` skill describes: deny-all permissions by default, with each job granted only what
it needs. The targets are the BC Gov Private Cloud PaaS OpenShift sandbox namespaces — the `-dev`
and `-test` namespaces of the project's licence plate — and nothing else (P4). No workflow,
configuration, chart value or manifest names a `-prod` namespace, and no workflow defines a route
to one (J3 and the profile).

This project does not build what the application depends on in each sandbox — PostgreSQL, the
Keycloak realm (0004) and an SMTP endpoint (a mail catcher in sandboxes). They reach it through
configuration and secrets, because environment operations and infrastructure are out of scope
(J2). The local equivalents in `app/compose/` are never referenced by a deploy workflow.
Configuration switches notification sending on or off (R-6.1). Every sandbox is marked as a test
environment, which marks every message's subject and logo as a test (R-6.3).

## Why

- P4 names OpenShift on the Private Cloud PaaS, and J2 limits the project to sandbox environments.
- The profile requires the quickstart helpers at a pinned commit. Pinning means a change upstream
  cannot change what this project deploys without a reviewed change here.
- A read-only root filesystem is the platform's restricted-v2 expectation. R-8.16 still requires a
  place on the service's own machine to write uploads, so the volume is named rather than
  discovered.
- Running migrations in an init container keeps the upgrade-in-place property of 0002 without a
  separate Job for each deploy.

## What would reverse it

- A recorded exception under J6 permitting another deploy target.
- J2 widening to production operation, which would add a production overlay and its own review.
- The quickstart helpers moving migrations to a separate Job. The init container would then move
  there, and nothing else would change.
