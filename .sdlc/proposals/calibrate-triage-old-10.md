---
gate: G3
question: "211 criterion(s) fail against old: which of them did this project's own adapter cause?"
recommendation: "Sort R-2.1, R-3.1, R-4.1, R-5.1, R-8.1, R-1.2, R-3.2, R-4.2, R-6.2, R-8.2, R-1.3, R-2.3, R-3.3, R-4.3, R-5.3, R-6.3, R-1.4, R-2.4, R-4.4, R-6.4, R-1.5, R-2.5, R-4.5, R-6.5, R-7.5, R-8.5, R-1.6, R-3.6, R-4.6, R-6.6, R-7.6, R-8.6, R-1.7, R-2.7, R-3.7, R-6.7, R-8.7, R-1.8, R-3.8, R-4.8 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner."
opened: 2026-09-25T17:33:41.284Z
---

# 211 criterion(s) fail against old: which of them did this project's own adapter cause?

**Recommendation.** Sort R-2.1, R-3.1, R-4.1, R-5.1, R-8.1, R-1.2, R-3.2, R-4.2, R-6.2, R-8.2, R-1.3, R-2.3, R-3.3, R-4.3, R-5.3, R-6.3, R-1.4, R-2.4, R-4.4, R-6.4, R-1.5, R-2.5, R-4.5, R-6.5, R-7.5, R-8.5, R-1.6, R-3.6, R-4.6, R-6.6, R-7.6, R-8.6, R-1.7, R-2.7, R-3.7, R-6.7, R-8.7, R-1.8, R-3.8, R-4.8 with a triage condition each, so the adapter's failures are fixed there and only product questions reach the product owner.

211 criterion(s) failed against the **old** target at http://localhost:4300, and nobody has sorted them yet.
Before any reaches the product owner, say which of them this project's own adapter caused. The adapter is
under `tests/adapters/old/`; read each failure against it and against the test.

The 40 below are the ones to sort now; the remaining 171 come back on the next run.

### R-2.1 · v1

Only a signed-in vendor who has accepted the service's terms at some point may start a proposal; a request from public sector staff, an administrator or an anonymous visitor is refused.

- given: a visitor who is not signed in, or is signed in as public sector staff or as an administrator
- when: they attempt to start a proposal against a published opportunity
- then: the request is refused and no proposal is created
- test: tests/acceptance/proposals/R-2.1.spec.ts

**a signed-in vendor who has accepted the service's terms may start a proposal** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a request to start a proposal from public sector staff, an administrator or an anonymous visitor is refused** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-3.1 · v1

Anyone, signed in or not, can browse the list of registered organizations, which shows only organizations that have not been archived, ordered by legal name and split into pages.

- given: three registered organizations, one of which has been archived
- when: a visitor who is not signed in opens the organization list
- then: the two organizations that are not archived are listed in alphabetical order by legal name, and the archived one is absent
- test: tests/acceptance/organizations/R-3.1.spec.ts

**a visitor who is not signed in sees the two organizations that are not archived listed in alphabetical order by legal name, and the archived one is absent** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-4.1 · v1

The first time a person signs in, the service creates an account for them and decides its kind from the identity they signed in with: a government identity makes a public sector employee, a code-hosting identity makes a vendor.

- given: a person with no account on the service
- when: they sign in for the first time with their government identity
- then: an active public sector employee account exists for them carrying the name and email address the identity provider supplied and their government username, and signing in the same way again reuses that account rather than making a second one
- test: tests/acceptance/users/R-4.1.spec.ts

**the first time a person signs in, the service creates an account for them and decides its kind from the identity they signed in with: a government identity makes a public sector employee** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**the first time a person signs in, the service creates an account for them and decides its kind from the identity they signed in with: a code-hosting identity makes a vendor** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-5.1 · v1

An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair.

- given: a public sector employee setting the evaluation panel of a Sprint With Us or Team With Us opportunity
- when: they save a panel of one person, or a panel naming the same person twice, or a panel naming two chairs, or a panel naming a vendor
- then: the panel is rejected with a message naming the rule that was broken, and the opportunity keeps the panel it had
- test: tests/acceptance/evaluation/R-5.1.spec.ts

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming the same person twice is rejected with the rule named, and the opportunity keeps the panel it had)** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:3102/users/00000000-0000-4000-8000-000000000101", waiting until "domcontentloaded"[22m

```

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming two chairs is rejected)** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**An opportunity that uses a panel must name at least two panel members, each a public sector employee, each named only once, and at most one of them marked as chair. (a panel naming a vendor is rejected with the rule named, and the opportunity keeps the panel it had)** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-8.1 · v1

Any person who is signed in may upload a file, and a visitor who is not signed in cannot.

- given: a visitor who is not signed in
- when: they submit a file for upload
- then: the upload is refused as not permitted and no file is stored
- test: tests/acceptance/files/R-8.1.spec.ts

**any person who is signed in may upload a file** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a visitor who is not signed in cannot upload a file, and no file is stored** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-1.2 · v1

An anonymous visitor or a vendor sees only opportunities that have been published; drafts and opportunities under review are not listed to them and cannot be opened by them.

- given: an opportunity in draft or under review
- when: an anonymous visitor or a vendor lists opportunities, or opens that opportunity's address directly
- then: the opportunity does not appear in the list, and opening it directly reports that it was not found
- test: tests/acceptance/opportunities/R-1.2.spec.ts

**an anonymous visitor or a vendor is not listed drafts and opportunities under review** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**an anonymous visitor or a vendor cannot open a draft or an opportunity under review** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-3.2 · v1

Only a signed-in vendor who has already accepted the service's terms and conditions may register a new organization; a request from anyone else is refused.

- given: a signed-in member of public sector staff and a signed-in vendor who has accepted the terms
- when: each tries to register an organization
- then: the vendor's organization is created and the public sector staff member's request is refused as not permitted
- test: tests/acceptance/organizations/R-3.2.spec.ts

**the vendor's organization is created** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**the public sector staff member's request to register an organization is refused as not permitted** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-4.2 · v1

A person whose account has just been created is sent a welcome message, unless no email address is known for them.

- given: a person signing in for the first time whose identity provider shared an email address
- when: their account is created
- then: they receive a message welcoming them to the service and offering a link back to sign in, and no message is attempted for a person whose account has no email address
- test: tests/acceptance/users/R-4.2.spec.ts

**a person whose account has just been created is sent a welcome message** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**a person whose account has just been created is not sent a welcome message when no email address is known for them** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-6.2 · v1

When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.

- given: a service whose mail server is unreachable
- when: a person publishes an opportunity that would notify everyone who asked for new-opportunity notices
- then: the opportunity is published and the person is told it succeeded, no notice reaches anybody, and nothing in the service records for that person that delivery failed
- test: tests/acceptance/notifications/R-6.2.spec.ts

**When a message cannot be composed or cannot be delivered, the action that triggered it still succeeds, nobody is told, and no further attempt is made.** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-8.2 · v1

An upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission.

- given: a signed-in person with a document to upload
- when: they submit the document together with a name and a read-access statement
- then: the file is stored and its record — its identifier, its name and the date it was stored — is returned
- test: tests/acceptance/files/R-8.2.spec.ts

**an upload carries the file itself, a name to store it under, and a statement of who may read it, all in one submission** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-1.3 · v1

A member of public sector staff sees every published opportunity plus their own drafts and opportunities under review, and an administrator sees every opportunity.

- given: two members of public sector staff, each with an unpublished opportunity of their own
- when: each lists opportunities
- then: each sees their own unpublished opportunity and not the other's, while an administrator listing opportunities sees both
- test: tests/acceptance/opportunities/R-1.3.spec.ts

**A member of public sector staff sees every published opportunity plus their own drafts and opportunities under review, and an administrator sees every opportunity. (a member of public sector staff sees every published opportunity plus their own drafts and opportunities under review)** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**A member of public sector staff sees every published opportunity plus their own drafts and opportunities under review, and an administrator sees every opportunity. (an administrator sees every opportunity)** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-2.3 · v1

Submitting a proposal requires the vendor to accept both the program's terms and the service's current terms, and the act of submitting records that acceptance.

- given: a vendor with a complete proposal whose acceptance of the current terms has been reset
- when: they submit the proposal without ticking both the program terms and the service terms
- then: the submit action is unavailable, and a submission that reaches the service anyway is refused
- test: tests/acceptance/proposals/R-2.3.spec.ts

**submitting a proposal requires the vendor to accept both the program's terms and the service's current terms** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**the act of submitting a proposal records the vendor's acceptance of the terms** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-3.3 · v1

An organization's full record can be opened only by an administrator or by a member who owns or administers that organization; anyone else is refused.

- given: an organization with an owner, one administrator and one ordinary member
- when: the ordinary member, and separately a member of public sector staff, opens that organization's management page
- then: both are refused, while the owner, the organization's administrator and a service administrator each see the organization
- test: tests/acceptance/organizations/R-3.3.spec.ts

**an organization's full record cannot be opened by an ordinary member of that organization** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**an organization's full record cannot be opened by a member of public sector staff** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**an organization's full record can be opened by the member who owns that organization** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**an organization's full record can be opened by a member who administers that organization** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**an organization's full record can be opened by an administrator** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-4.3 · v1

A vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy; a public sector employee is never asked to, and the moment of acceptance is recorded on the vendor's account.

- given: a vendor on the profile-completion page with the agreement box unticked
- when: they try to complete their profile
- then: the completion control is unavailable until they tick the box, and once they complete it their account records the date and time they agreed
- test: tests/acceptance/users/R-4.3.spec.ts

**a vendor cannot finish signing up until they confirm they have read and agree to the service's terms and conditions and its privacy policy** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**the moment of acceptance is recorded on the vendor's account** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**a public sector employee is never asked to agree to the terms** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-5.3 · v1

An evaluator holds at most one evaluation per proponent, and a second attempt is refused with a message saying they already have one.

- given: an evaluator who has already started an evaluation of one proponent
- when: they start a second evaluation of the same proponent
- then: the request is refused with "You already have a team question evaluation for this proposal." and no second evaluation is created
- test: tests/acceptance/evaluation/R-5.3.spec.ts

**an evaluator holds at most one evaluation per proponent, and a second attempt is refused** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-6.3 · v1

When an environment is marked as a test environment, every message it sends is marked as a test in its subject line and carries a test variant of the service's logo.

- given: a non-production environment marked as being for testing
- when: any message is sent from it
- then: its subject begins with a test marker and the logo at the top of the message is the test variant, so a reader can tell it apart from a message from the real service
- test: tests/acceptance/notifications/R-6.3.spec.ts

**When an environment is marked as a test environment, every message it sends is marked as a test in its subject line and carries a test variant of the service's logo.** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-1.4 · v1

Every change to an opportunity's content creates a new version of it and records an edit in its history; the opportunity always shows its most recent version.

- given: a published opportunity
- when: an administrator changes its description and saves
- then: the opportunity shows the new description, its history gains an entry recording that it was edited, by whom and when, and the previous content is retained
- test: tests/acceptance/opportunities/R-1.4.spec.ts

**every change to an opportunity's content creates a new version of it and the opportunity always shows its most recent version** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**every change to an opportunity's content records an edit in its history** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-2.4 · v1

Only a draft proposal can be deleted, and deleting it removes it permanently.

- given: a proposal that has been submitted
- when: its author asks for it to be deleted
- then: the request is refused, whereas deleting a draft succeeds and the proposal can no longer be opened
- test: tests/acceptance/proposals/R-2.4.spec.ts

**a proposal that has been submitted cannot be deleted** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**only a draft proposal can be deleted, and deleting it removes it permanently** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 2
docker compose -p sdlc-digital-marketplace-next-old-2 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-4.4 · v1

A person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in.

- given: an account an administrator has deactivated
- when: that person signs in through the identity provider
- then: no session is created and they are shown a page saying sign-in failed and inviting them to try again
- test: tests/acceptance/users/R-4.4.spec.ts

**a person whose account an administrator deactivated cannot sign in; they are shown a sign-in failure notice instead of being let in** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-6.4 · v2

Every message the service sends comes from a single configured sender — a display name followed by one do-not-reply address, the same for every kind of message — and carries no reply-to address distinct from that sender.

- given: a person who receives any message from the service
- when: they look at who it came from, or reply to it
- then: it comes from one address bearing the service's name, the same for every kind of message, and a reply to it reaches nobody
- test: tests/acceptance/notifications/R-6.4.spec.ts

**Every message the service sends comes from a single configured sender — a display name followed by one do-not-reply address, the same for every kind of message — and carries no reply-to address distinct from that sender.** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-1.5 · v1

Any signed-in person may watch an opportunity they did not create, may stop watching it, and cannot watch the same opportunity twice.

- given: a signed-in person viewing an opportunity created by somebody else and not yet watched by them
- when: they choose to watch it, and then choose to watch it again
- then: the first request records them as watching it and the second is refused as a duplicate
- test: tests/acceptance/opportunities/R-1.5.spec.ts

**any signed-in person may watch an opportunity they did not create** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**any signed-in person may stop watching an opportunity they did not create** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-2.5 · v1

When an opportunity closes, every proposal submitted against it moves to the first review stage of that program and is given an anonymous proponent name numbered from one.

- given: a Sprint With Us or Team With Us opportunity carrying three submitted proposals and one draft
- when: its proposal deadline passes and the opportunity closes
- then: the three submitted proposals move to review of the opportunity's questions and are named "Proponent 1", "Proponent 2" and "Proponent 3", and the draft is left alone
- test: tests/acceptance/proposals/R-2.5.spec.ts

**when an opportunity closes, every proposal submitted against it moves to the first review stage of that program** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**when an opportunity closes, every proposal submitted against it is given an anonymous proponent name numbered from one** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-4.5 · v1

A person who deactivated their own account is let back in the next time they sign in, their account becomes active again, and they are told by email that it has been reactivated.

- given: a person who deactivated their own account
- when: they sign in again
- then: they are signed in, their account is active once more, and they receive a message saying they have successfully reactivated it
- test: tests/acceptance/users/R-4.5.spec.ts

**a person who deactivated their own account is let back in the next time they sign in, their account becomes active again, and they are told by email that it has been reactivated** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-6.5 · v1

Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.

- given: a reader whose mail program shows plain text only
- when: they open any message from the service
- then: they see a readable plain-text rendering carrying the same words and links as the formatted version
- test: tests/acceptance/notifications/R-6.5.spec.ts

**Every message is sent in both a formatted and a plain-text form, the plain text being a rendering of the formatted version rather than separately written copy.** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-7.5 · v1

Only an administrator can see the list of pages, and it names every page with its title, its public address, whether the service needs it, and when it was created and last updated, ordered by title.

- given: an administrator signed in, and pages existing in the service
- when: they open the content area from the navigation menu
- then: every page is listed once, in order of title, showing its title, its public address, whether it is one the service needs, and its created and updated dates
- test: tests/acceptance/content/R-7.5.spec.ts

**only an administrator can see the list of pages** — failed

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
[2m  - navigating to "http://localhost:4300/content", waiting until "domcontentloaded"[22m

```

### R-8.5 · v1

Two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access.

- given: a file already stored by one person
- when: a second person uploads a file with byte-for-byte identical content under a different name
- then: a second, separate record is created that shares the stored content, and the second person's read access does not extend to the first record
- test: tests/acceptance/files/R-8.5.spec.ts

**two uploads of identical content are stored once, while each upload remains its own record with its own name, its own uploader and its own read access** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-1.6 · v1

Opening an opportunity's public page counts as a view of that opportunity.

- given: an opportunity that has been viewed a known number of times
- when: anyone, signed in or not, opens its public page
- then: the recorded view count for that opportunity increases by one
- test: tests/acceptance/opportunities/R-1.6.spec.ts

**opening an opportunity's public screen counts as a view of that opportunity** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-3.6 · v1

An administrator or an organization's owner may archive the organization, after which it no longer appears in the organization list, cannot be used on proposals, and disappears from its members' lists of organizations; the archiving is recorded with the date and the person who did it.

- given: an active organization with an owner and one other active member
- when: the owner archives it
- then: it is gone from the public organization list, gone from the other member's affiliated organizations, and its record carries the date it was archived and the identity of the person who archived it
- test: tests/acceptance/organizations/R-3.6.spec.ts

**when the owner archives an active organization it is gone from the public organization list** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**when the owner archives an active organization it is gone from the other member's affiliated organizations** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-4.6 · v1

A person may hold only one account for a given identity and kind, and two accounts of the same kind may not share an email address.

- given: an existing vendor account using a given email address
- when: a second vendor signs in for the first time carrying the same email address, or an existing vendor edits their profile to that address
- then: neither the new account nor the change is saved
- test: tests/acceptance/users/R-4.6.spec.ts

**two accounts of the same kind may not share an email address, so a vendor's change to an address another vendor holds is not saved** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 2
docker compose -p sdlc-digital-marketplace-next-old-2 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-6.6 · v2

Every message the service sends ends with an offer labelled Unsubscribe, which opens the reader's own notification settings with the unsubscribe confirmation already asked.

- given: a person who receives any message from the service
- when: they read to the end of it
- then: they are offered an unsubscribe choice that opens their own notification settings with the question already asked
- test: tests/acceptance/notifications/R-6.6.spec.ts

**every message the service sends ends with an offer labelled Unsubscribe, which opens the reader's own notification settings with the unsubscribe confirmation already asked** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-7.6 · v1

The route into the content area is offered only to an administrator, and anybody else who reaches any of the managing screens directly is shown the not-found screen.

- given: a signed-in vendor or public sector employee
- when: they look at the navigation menu, and then open the address of the content area directly
- then: no route into the content area is offered to them, and opening it directly shows the not-found screen
- test: tests/acceptance/content/R-7.6.spec.ts

**a signed-in vendor who reaches any of the managing screens directly is shown the not-found screen** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a signed-in public sector employee who reaches any of the managing screens directly is shown the not-found screen** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-8.6 · v1

Every stored file records who uploaded it and when, and neither can be changed afterwards.

- given: a signed-in person
- when: they upload a file
- then: the file is permanently marked as theirs and stamped with the moment it was stored
- test: tests/acceptance/files/R-8.6.spec.ts

**every stored file records who uploaded it and when, and neither can be changed afterwards** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-1.7 · v1

Only signed-in public sector staff and administrators may create an opportunity; a request from a vendor or an anonymous visitor is refused.

- given: a visitor who is not signed in, or is signed in as a vendor
- when: they attempt to create an opportunity
- then: the request is refused and no opportunity is created
- test: tests/acceptance/opportunities/R-1.7.spec.ts

**an anonymous visitor's attempt to create an opportunity is refused and no opportunity is created** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a vendor's attempt to create an opportunity is refused and no opportunity is created** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-2.7 · v2

A proposal may be created only as a draft or as a submission, in all three programs; any other state is refused.

- given: the published description of the proposal interface
- when: it is compared with what the service accepts
- then: three disagreements appear, and in each the running service is the stricter of the two
- test: tests/acceptance/proposals/R-2.7.spec.ts

**a proposal may be created as a draft, in all three programs** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**a proposal may be created as a submission, in all three programs** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

### R-3.7 · v1

An organization's owner, its administrators and a service administrator may invite people to the team by email address, and each invitation is created as a pending membership.

- given: an organization with an owner and no other members
- when: the owner invites two email addresses at once from the team page
- then: both people appear on the team list marked as pending, and neither counts towards the organization's team size until they accept
- test: tests/acceptance/organizations/R-3.7.spec.ts

**an organization's owner may invite people to the team by email address, and each invitation is created as a pending membership that does not count towards the team until accepted** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-6.7 · v1

The unsubscribe offer in a message is not tied to the person it was addressed to: it acts on whoever is signed in when it is opened, and it cannot be used without signing in.

- given: a message sent to one person and forwarded to another
- when: the second person opens the unsubscribe offer while signed in to their own account
- then: they are shown their own notification settings, with the confirmation naming their own address, and confirming stops their own notifications rather than the original recipient's
- test: tests/acceptance/notifications/R-6.7.spec.ts

**the unsubscribe offer in a message is not tied to the person it was addressed to: it acts on whoever is signed in when it is opened** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**the unsubscribe offer cannot be used without signing in** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-8.7 · v1

A file is readable by anyone if it was marked readable by anyone, by a person it names, by anyone holding an account type it names, by whoever uploaded it, and by any administrator.

- given: a file uploaded by one vendor and marked readable by no one else
- when: a second vendor asks for it, and then an administrator asks for it
- then: the second vendor is refused and the administrator receives it
- test: tests/acceptance/files/R-8.7.spec.ts

**a file marked readable by no one else is readable by whoever uploaded it and by any administrator, and refused to another vendor** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a file is readable by anyone if it was marked readable by anyone** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a file is readable by a person it names** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a file is readable by anyone holding an account type it names** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-1.8 · v1

Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards.

- given: a member of public sector staff creating a new opportunity
- when: they choose a program and complete creation
- then: the opportunity is filed under that program and offers only that program's fields, stages and actions
- test: tests/acceptance/opportunities/R-1.8.spec.ts

**Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards. (Code With Us)** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards. (Sprint With Us)** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**Every opportunity belongs to exactly one of three procurement programs — Code With Us, Sprint With Us or Team With Us — chosen when it is created and never changed afterwards. (Team With Us)** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-3.8 · v1

A person may only be invited to an organization if they hold an active vendor account, and cannot be invited twice to the same organization.

- given: an organization with one pending invitation outstanding for a given person
- when: the owner invites that same person again, and separately invites a member of public sector staff
- then: the repeat invitation is refused as the person already being a member of the organization, and the invitation to public sector staff is refused because only vendors may be invited
- test: tests/acceptance/organizations/R-3.8.spec.ts

**a person cannot be invited twice to the same organization: the repeat invitation is refused as the person already being a member of the organization** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

**a person may only be invited to an organization if they hold an active vendor account: the invitation to public sector staff is refused because only vendors may be invited** — failed

```
Error: could not reset the target to its seed before this test: spawnSync /bin/sh ETIMEDOUT
```

### R-4.8 · v1

A vendor records which of the service's listed capabilities they hold by turning each on or off on their own profile, and only they may change them.

- given: a vendor with no capabilities recorded and an administrator viewing that vendor's profile
- when: the vendor turns two capabilities on and the administrator tries to turn a third on
- then: the vendor's two capabilities are saved and shown as held, and the administrator is offered no working control
- test: tests/acceptance/users/R-4.8.spec.ts

**a vendor records which of the service's listed capabilities they hold by turning each on or off on their own profile** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

**only the vendor may change their capabilities, so an administrator viewing that vendor's profile is offered no working control** — failed

```
Error: could not reset the target to its seed before this test: Command failed: node "~/GitHub/agentic-sdlc/bin/sdlc.mjs" oracle reseed --target old --instance 1
docker compose -p sdlc-digital-marketplace-next-old-1 -f sources/old/docker-compose.yml -f .sdlc/oracle/compose.yml exec -T db psql -v ON_ERROR_STOP=1 -U digmkt -d digmkt -c DO $$
DECLARE stmt text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ')
    INTO stmt
    FROM pg_tables
   WHERE schemaname = 'public' AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock', 'schema_migrations', 'migrations');
  IF stmt IS NOT NULL THEN
    EXECUTE 'TRUNCATE TABLE ' || stmt || ' RESTART IDENTITY CASCADE';
  END IF;
END $$; failed:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  sorry, too many clients already

```

## Triage conditions

One condition per line, one for every failing criterion the page lists, in exactly one of these forms:

- `adapter-wrong <ID>: <why>` — the criterion and the test are both fine, and this target's adapter
  is what failed: it read the wrong thing off the page, reported a control missing that the page
  does render, or answered empty where it never reached the page. `<why>` names what the adapter
  did wrong, specifically enough for the next binding run to fix it. The criterion is not touched.
- `product-question <ID>` — nothing in the evidence points at the adapter. The failure goes to the
  product owner, who decides whether the application, the criterion or the test is wrong. No text
  after the ID.

The ID is the criterion's own id exactly as `spec/criteria-index.json` spells it. A condition may
not span more than one line. When the evidence is genuinely unclear, it is a `product-question`:
a failure wrongly sent to the product owner is answered there, while one wrongly blamed on the
adapter comes back from the next binding run unchanged and costs a run to find out.

