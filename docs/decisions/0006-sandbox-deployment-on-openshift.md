# 0006 · The service deploys to OpenShift sandbox namespaces only

- Status: proposed (G2)
- Date: 2026-09-19

## Decision

The application ships one container image and the workload manifests for it: a Deployment
(non-root, all capabilities dropped, no privilege escalation, read-only root filesystem, resource
requests and limits, liveness and readiness probes on `/status`), a Service and a Route. It targets
the BC Gov Private Cloud PaaS OpenShift sandbox namespaces — the `-dev` and `-test` namespaces of
the project's licence plate — and nothing else (P4). No workflow, configuration or manifest names a
`-prod` namespace (J3).

The upload working directory (R-8.16) is an `emptyDir` volume mounted at a fixed path, because the
root filesystem is read-only; it is sized to hold a handful of 10 MB uploads and is emptied after
every upload whatever its outcome (R-8.18).

What the application depends on in each sandbox — PostgreSQL, the Keycloak realm (0004), and an
SMTP endpoint (a mail catcher in sandboxes) — is provided to it by configuration and secrets, not
built by this project: environment operations and infrastructure are out of scope (J2).
Notification sending is switched by configuration (R-6.1), and every sandbox is marked as a test
environment, which marks every message's subject and logo as a test (R-6.3).

## Why

- P4 names OpenShift on the Private Cloud PaaS; J2 limits the project to sandbox environments.
- A read-only root filesystem is the platform's restricted-v2 expectation; R-8.16 still requires a
  place on the service's own machine to write uploads, so the volume is named rather than
  discovered.

## What would reverse it

- A recorded exception under J6 permitting another deploy target.
- J2 widening to production operation, which would add a production overlay and its own review.
