# 0039 · A screen is drawn once it knows whom it is for

- Status: accepted for the build (slice 8, third revision after the ruling that returned it)
- Date: 2026-10-01
- Amends: 0038 (what an unanswered session check draws), 0017 (a refused token beside a standing
  cookie), 0034 (how the opportunity list is asked for)

## What was wrong

Three criteria kept failing the same way through three rulings: the staff member's and the
administrator's opportunity list read as empty (R-1.3, R-1.38), and so did the answer at the end of
the service level agreement link (R-7.18). Each time the text read was "", not wrong text: the part
of the screen that holds the answer was not there when it was read. The application could not be
run in this revision's workspace (containers were not available to it), so what follows is what
the code allowed to happen, not a reproduction.

Four things in it let a staff member's screen be read before it was theirs, or not at all:

1. A screen for staff alone, and the opportunity list, drew their heading over a spinner the
   moment they were opened. Whatever waits for a screen's heading before reading it found the
   heading of a screen whose content had not come: no Unpublished group, no program cards and so no
   service level agreement link to follow.
2. The list asked the service for opportunities only after the session question had been
   answered: two round trips in a row before anything of the list could be read.
3. A session question that went unanswered — the service faulting for a moment, or the request
   lost — drew the whole visit as a visitor's (0038), and nothing asked again. A staff member was
   then shown a visitor's list, which has no Unpublished group at all.
4. A token the service refused (401) made the browser a visitor's at once, though the service's
   own session cookie (0017) might still name the person: a token that could not be renewed, from
   an identity provider whose sessions had idled out, was enough. The sandbox's identity provider
   kept Keycloak's defaults: five-minute tokens and half an hour idle.

And one let a page that is there be shown as not found: any answer but 200 from
`/api/content/<address>`, a fault or no answer included, drew the not-found screen.

## Decision

- **A screen is drawn whole once it knows whom it is for and has what it shows.** The opportunity
  list, and every screen for staff alone (`StaffOnly`: the program choice and the three create
  forms), draw nothing for their first second (`LOADING_SHOWN_AFTER_MS`, `useLoadingShown` in
  `app/frontend/src/app/loading.tsx`). Usually what they show has arrived by then, and the first
  thing drawn is the screen itself. If it has not, the loading state the catalogue draws for it —
  heading and spinner — is shown from then on, as before. Moving to another screen inside the app
  still takes focus to its heading: the root layout looks for the heading until it is there, for
  as long as the screen would take to say it is loading.
- **The list is asked for beside the session.** It is asked for as the screen opens, with the
  same sign-in the session question carries, and that answer is kept for whoever the session turns
  out to name; it is asked for again only if who is asking changes after that. A program the
  service could not answer for is asked for again after 300 milliseconds and after a further
  second (`LIST_RETRY_DELAYS_MS`) rather than left out.
- **An unanswered session question is asked again** after a quarter of a second, three quarters
  and a second and a half (`UNANSWERED_RETRY_DELAYS_MS`), and the screens wait as they do for a
  first answer. Only when all go unanswered is the visit drawn as a visitor's; still nothing the
  browser holds is dropped (0038 stands for that).
- **A refused token is dropped and the question asked once more without it.** If the service's
  own session cookie names the person, the visit is theirs; otherwise it is a visitor's, as before.
- **A page's address is asked again after a fault or no answer** (after 300 milliseconds and a
  further second, `PAGE_RETRY_DELAYS_MS`); the service's own answers, 404 and 400 among them,
  stand as they come.
- **The sandbox's sign-ins last as long as the service's session.** The realm's access tokens
  last an hour and its sessions ten hours, idle or not (app/compose/idp/README.md).

## What this does not change

Every screen's layout, wording and test IDs, including each loading state's, are the catalogue's.
What is new is only when a loading state is first shown. The dashboard, the profile and the
administrator's screens still show their loading state at once; nothing failing turns on them.

## What would reverse it

- A ruling that a screen must show its loading state the moment it opens, however short the wait.
- A ruling that a refused token must end the visit whatever the service's own session says.
