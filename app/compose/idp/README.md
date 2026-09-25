# The sandbox identity provider's realm

`realm-template.json` is the realm the sandbox identity provider imports on start-up. It is
for a builder's machine only; no address in it belongs to any environment but this one.

Keycloak deserializes this file straight onto its own realm representation and **rejects any
key it does not know**, so the file cannot carry explanatory keys of its own — a `_comment`
member stops the import, and with the import the whole server. Everything a reader needs to
know about the realm is therefore written down here instead.
`app/backend/tests/sandbox-composition.test.ts` holds the file to that rule so the mistake
cannot be made again without the `check` script saying so.

## The accounts

Every account in the realm is one `tests/seed/manifest.yaml` names, and signs in with its
`idp_id` as username. Every person is invented and every address is on `example.test`.

The password is in no file in this repository. `__SANDBOX_PASSWORD__` is a placeholder that
the `idp-realm` service replaces at start-up with whatever `SDLC_SANDBOX_PASSWORD` holds,
writing the result into a volume rather than back into the repository (constitution P3). If
that variable is unset, `idp-realm` fails and the identity provider — which waits on it —
never starts, rather than coming up with accounts nobody can use.

The `identity_provider` attribute records which way in an account came through, which is what
fixes the kind of account on a first sign-in (R-4.1). The slice that builds sign-in decides
what it reads; it is recorded here so the accounts are not ambiguous. `account_type` is
recorded beside it for the same reason.

## The client

One client, `digital-marketplace-app`: the single-page app, a public client under PKCE, so no
secret is held in a browser (decision record 0004). Its redirect and post-logout URIs are the
one origin the application answers on, `http://localhost:4300`.
