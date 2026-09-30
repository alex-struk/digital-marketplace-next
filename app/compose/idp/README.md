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
fixes the kind of account on a first sign-in (R-4.1): `idir` makes a public sector employee and
`bceid` (or `github`) a vendor. The client puts it into every access token as the
`identity_provider` claim, which is what the service reads (decision record 0011).
`account_type` is recorded beside it so the accounts are not ambiguous to a reader; nothing
reads it.

Three accounts exist here and nowhere in the seed — `first-time-gov`, `first-time-vendor` and
`first-time-vendor-no-email` — because the criteria about a first sign-in need a person the
service has no account for yet (spec/contract/personas.yaml).

## The user profile

Keycloak 26's own user profile requires an email address of every user, and would stop an
account without one (`test-vendor-7`, `first-time-vendor-no-email`) at an "update your account"
page instead of signing it in. The realm therefore carries its own profile (the
`org.keycloak.userprofile.UserProfileProvider` component) in which the address is optional and
attributes the profile does not declare, such as `identity_provider`, are kept.

## The client

One client, `digital-marketplace-app`: the single-page app, a public client under PKCE, so no
secret is held in a browser (decision record 0004). Its redirect and post-logout URIs are the
one origin the application answers on, `http://localhost:4300`. Two mappers put the
`identity_provider` claim and the client itself (as audience) into its access tokens.
