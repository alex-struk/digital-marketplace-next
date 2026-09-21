---
stage: "bind-adapter"
title: "bind adapter"
at: "2026-09-21T03:27:51.163Z"
cost: 22.669581499999996
turns: 138
session: "370fb015-27e7-4a25-a7bf-7e3c796cf634"
---

Both files are written and verified against the contract. Here is my journal.

---

**What I was asked to do, and what I found**

I wrote the adapter binding the abstract `Surface` to the target called "new", running at the address the pipeline gave me, and the `bindings.yaml` beside it. I opened the target in a browser and bound against what is on the screen; there is no source in this workspace and I used none.

The target is a single-page client with its own router in front of a service. Four addresses render a page of their own: the home page at `/`, a published page at `/content/:slug`, the three program explainers at `/learn-more/:program`, and `/status`, which answers `OK` as plain text from the service rather than the client. Every other address the surface names — the dashboard, all the opportunity, proposal, organization, user and evaluation screens, the content management screens, the notice and sign-in screens — is answered by the client's own "Page not found" screen. I checked each of them by opening it, including the parameterised ones opened with the seeded identifiers from `tests/seed/manifest.yaml`, so that "the route needs a value" was never the reason anything was reported missing.

There is no sign-in of any kind. `/sign-in` and `/auth/sign-in` both end on "Page not found", and the home page's own "Sign in" link leads to the first of them. No identity provider form is reachable from the target, so no session can be established and no screen that would need one can be reached from any state. `signIn` still makes the attempt at run time — the sign-in screen, then the home page's offer, then a username-and-password form wherever it lands — and reports `unbound: signIn.<persona id> — …` with what it actually found, naming the addresses it tried. The username comes from the persona table and the password only from the environment variable; neither the adapter nor the bindings file contains a password. Signing in as the anonymous visitor is the one case that works, because being signed out is the whole of that state.

The file addresses under `/api` are not usable either. A validation layer shaped like the contract sits in front of them — a GET on the collection is refused as a wrong method, a JSON body as a wrong media type, a malformed read-access part as a bad request — but nothing is registered behind it: a well-formed upload answers 404 `Cannot POST /api/files`, and a well-formed identifier answers 404 `Cannot GET /api/files/<id>`. So nothing can be stored and nothing read back, and the whole files domain is unbound, as are the attachment, image-picker and embedded-image controls, whose host forms are not pages here either.

**What is bound**

Twenty-eight members across five pages: the home page's three links and its readable content; `/status` as both the request that runs pending transitions and the reading that the service is up; the footer's five links, as controls and as the addresses they lead to, and the footer itself; the service level agreement link on the Code With Us explainer, its address and what the service answers at it; and the published-page screen — its title, body, address, published and updated dates, its readability signed out, and the not-found answer at an address with no page behind it. The content seed is present and correct on this target: the one administrator-made page carries its seeded identifier, title, dates and third-version body, with the markdown rendered.

**What is not, on pages that do exist**

Two things, and they are the only cases where a page renders but the contract's member is not on it. The home page carries no total of awarded opportunities and no total of their value — no such figure and no label naming one anywhere on it; the adapter looks for them and reports unbound with what the page does read. And following a link in a page's body is unbound because no seeded page has a link in its body and this target has no create or edit screen on which to write one; the adapter will follow one if a page ever carries it.

**Two decisions worth stating**

For a page that is not on this target, `open()` throws the same `unbound:` shape its members do, rather than quietly succeeding. A test that opens such a page and reads nothing else must not be told it worked, and a plain failure there would be read as the rebuild misbehaving rather than as the page being absent. Second, I kept the difference between empty and unbound strict: the published-page readers return an empty string where the address genuinely holds no page, and only throw where the place itself could not be reached.

**What I could not do**

I could not run anything. The workspace has no installed dependencies, so neither the suite nor `tsc --noEmit` could be run, and script execution was not available to me. The adapter is therefore verified by driving the browser by hand — every bound control was located by role and accessible name in the live page and the readings checked against what the page shows — and by mechanical comparison of the member lists against `spec/contract/surface.yaml`: the page order, the actions and observations of every page, and their names are identical to the contract in both files, and the adapter's surface properties match the generated type exactly. It has not been executed by Playwright.

One incidental finding for whoever rules on this: the home page offers "Browse opportunities", "Sign in" and "Sign up", and all three lead to addresses the client answers with "Page not found".