// Adapter binding the abstract Surface to the running "new" target.
//
// Everything here was found by opening the application in a browser and looking at it.
// Controls are located by their role, their accessible name, their visible text, or the
// address they lead to — never by a class, an id or a test attribute, because there is no
// source in this workspace and a test must not depend on one.
//
// What this target is, as it stands
// ---------------------------------
// The whole marketplace is served at this address. A signed-out visitor is shown the home
// page, the opportunity list and each opportunity's public page, the organization list,
// the sign-in, sign-up and signed-out screens, the two notices, the published pages under
// /content/:slug, the program explainers under /learn-more and the service's own /status;
// the service answers its interface under /api (files included) for whoever the browser's
// session carries.
//
// Signing in goes through the sandbox identity provider's own form ("Sign in as a vendor" /
// "Sign in as a public sector employee" on /sign-in), and signIn() fills it. The screens
// behind a session were walked signed in (as the vendors, the public sector employee, the
// administrator, the vendor still to complete a profile and the first-time accounts). The
// running build serves a signed-in person /dashboard (to the administrator and public sector
// staff, "Create an opportunity" over a table of opportunities, each linked), their
// own profile at /users/me or /users/<their own id> (editable, with its picture picker) with
// its Capabilities, Organizations, Notifications and Legal sections, another account's
// /users/:userId and the list of accounts at /users to the administrator, the content
// management screens (/content, /content/create, /content/:slug/edit) to the administrator,
// and /sign-up/complete to a vendor still to complete a profile. To the administrator and
// public sector staff it also serves the program chooser (/opportunities/create), the Code
// With Us form (/opportunities/code-with-us/create) and a Code With Us opportunity's
// management screen (/opportunities/code-with-us/:opportunityId/edit, its ?tab= sections and
// form, attachments included); a Code With Us opportunity's public page opens for anybody.
// Every other screen that needs a session — Sprint With Us and Team With Us, proposals,
// organizations, evaluation, a Code With Us report —
// answers "Page not found" (so does /users, to anyone but the administrator), and
// /admin/email-notification-reference is not a screen at all (the service answers it 404
// "Cannot GET", to the administrator too). Those screens' open() reports "unbound:
// <page>.open — <reason>" only when the address really answers with that refusal, and
// their members report "unbound: <page>.<member> — <reason>". A member that is about the
// refusal itself (refused_for_non_administrator, sign_in_required, not_found_page, ...)
// reads that refusal.
//
// Every page is laid out inside one "main" landmark that also holds the site's banner and
// its footer, so a page's own words are read with the banner's and the footer's taken off.

import type { Dialog, Locator, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import type { IncomingMessage, RequestOptions } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname } from "node:path";
import type { Persona, persona as PersonaTable } from "../../generated/personas";
import { seed } from "../../generated/seed";
import type * as S from "../../generated/surface";
import { uploadFile } from "../../fixtures/upload";

type Scope = Page | Locator;

export default function create(
  page: Page,
  ctx: { baseURL: string; persona: typeof PersonaTable },
): S.Surface {
  void ctx.persona;
  const baseURL = String(ctx.baseURL ?? "").replace(/\/+$/, "");

  // ---------------------------------------------------------------- navigation

  function address(route: string, params?: Record<string, string>): string {
    const supplied: Record<string, string | undefined> = params ?? {};
    const filled = route.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
      const value =
        supplied[name] ??
        supplied[name.replace(/Id$/, "")] ??
        supplied.id ??
        supplied.slug;
      if (value === undefined || value === "") {
        // Not unbound: the address exists, the caller did not say which record to open.
        throw new Error(
          `open() of ${route} was called without a value for ":${name}" (given: ${JSON.stringify(params ?? {})})`,
        );
      }
      return String(value);
    });
    return baseURL + filled;
  }

  // The same, for an address that is not a page on this target: what a test did or did not
  // pass for a parameter cannot matter there, and complaining about it would hide the
  // reason the page could not be reached.
  function leniently(route: string, params?: Record<string, string>): string {
    const supplied: Record<string, string | undefined> = params ?? {};
    return (
      baseURL +
      route.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) =>
        String(supplied[name] ?? supplied[name.replace(/Id$/, "")] ?? supplied.id ?? supplied.slug ?? "unknown"),
      )
    );
  }

  const seen = (locator: Locator): Locator => locator.filter({ visible: true });

  async function settle(): Promise<void> {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
  }

  // A screen has rendered once its heading is up: the client draws the page after it has
  // fetched whatever the page is about.
  async function ready(): Promise<void> {
    await settle();
    await seen(page.getByRole("heading"))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
  }

  async function go(route: string, params?: Record<string, string>): Promise<void> {
    await page.goto(address(route, params), { waitUntil: "domcontentloaded" });
    await settle();
  }

  async function visit(href: string): Promise<void> {
    const target = /^https?:\/\//.exec(href) !== null ? href : baseURL + href;
    await page.goto(target, { waitUntil: "domcontentloaded" });
    await settle();
  }

  // ---------------------------------------------------------------- reading the screen

  async function bodyText(): Promise<string> {
    return (await page.evaluate(() => document.body.innerText)).trim();
  }

  const lined = (words: string): string[] =>
    words
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  // The page's own content, with the banner and the standing footer left off. Both sit
  // inside the same "main" landmark as the page itself, the banner first and the footer
  // last, so their lines are taken off the front and the back of what main says.
  async function mainText(): Promise<string> {
    await ready();
    const main = page.getByRole("main");
    if (!(await main.count())) return bodyText();
    let lines = lined(await main.first().innerText());
    const banner = seen(page.getByRole("navigation"));
    if (await banner.count()) {
      const top = lined(await banner.first().innerText());
      if (top.length && top.every((line, i) => lines[i] === line)) lines = lines.slice(top.length);
    }
    if (await siteFooter().count()) {
      const bottom = lined(await siteFooter().innerText());
      const from = lines.length - bottom.length;
      if (bottom.length && from >= 0 && bottom.every((line, i) => lines[from + i] === line)) lines = lines.slice(0, from);
    }
    return lines.join("\n");
  }

  // The site's footer: its links over "Owned and operated by the B.C. Government.", with no
  // landmark role of its own. A footer drawn as a contentinfo landmark is taken first.
  function siteFooter(): Locator {
    return page
      .getByRole("contentinfo")
      .or(page.getByText("Owned and operated by the B.C. Government.", { exact: true }).locator("xpath=.."))
      .last();
  }

  async function textLines(): Promise<string[]> {
    return (await mainText())
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  // A value shown under its own label, the way this target draws a page's dates.
  async function valueAfter(labels: string[]): Promise<string> {
    const lines = await textLines();
    for (let i = 0; i < lines.length - 1; i++) if (labels.includes(lines[i])) return lines[i + 1];
    return "";
  }

  // A value drawn beside its label on one line, the way the signed-in profile draws its
  // account facts ("Account type: Vendor", "Status: Active"), or under a label on a line of
  // its own; labels are matched without regard to case.
  async function labelledValue(labels: string[]): Promise<string> {
    const wanted = labels.map((label) => label.toLowerCase());
    const lines = await textLines();
    for (let i = 0; i < lines.length; i++) {
      const beside = /^([^:]+):\s*(.+)$/.exec(lines[i]);
      if (beside && wanted.includes(beside[1].trim().toLowerCase())) return beside[2].trim();
      const alone = lines[i].replace(/:\s*$/, "").trim().toLowerCase();
      if (wanted.includes(alone) && i + 1 < lines.length) return lines[i + 1];
    }
    return "";
  }

  async function firstHeading(): Promise<string> {
    const heading = seen(page.getByRole("heading"));
    return (await heading.count()) ? (await heading.first().innerText()).trim() : "";
  }

  // What the client shows in place of a page it has no record or route for: its "Not
  // Found" screen now, "Page not found" when this adapter was first written.
  async function notFoundShown(): Promise<boolean> {
    await ready();
    return (
      (await seen(page.getByRole("heading", { name: /^\s*(page )?not found\s*$/i })).count()) > 0
    );
  }

  // The lines of the page's content that match, one per line.
  async function linesMatching(pattern: RegExp): Promise<string> {
    return (await textLines()).filter((line) => pattern.test(line)).join("\n");
  }

  // A value drawn over its label ("95" over "Total Opportunities Awarded").
  async function valueAbove(label: RegExp): Promise<string> {
    const lines = await textLines();
    for (let i = 1; i < lines.length; i++) if (label.test(lines[i])) return lines[i - 1];
    return "";
  }

  // "Published <date> | Updated <date>": one line on a wide screen, and read as up to three
  // lines of text ("Published …", "|", "Updated …"); both are read the same way.
  async function datedLine(which: "Published" | "Updated"): Promise<string> {
    const words = (await textLines()).join("\n");
    const found = new RegExp(`(?:^|\\n|\\|\\s*)${which}\\s+([^\\n|]+)`).exec(words);
    return found ? found[1].trim() : "";
  }

  async function paragraphs(scope: Scope): Promise<string[]> {
    const found = seen(scope.getByRole("paragraph"));
    const count = await found.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const words = (await found.nth(i).innerText()).trim();
      if (words) out.push(words);
    }
    return out;
  }

  // ---------------------------------------------------------------- driving controls

  async function findControl(scope: Scope, name: RegExp): Promise<Locator | null> {
    for (const role of ["link", "button"] as const) {
      const found = seen(scope.getByRole(role, { name }));
      if (await found.count()) return found.first();
    }
    const words = seen(scope.getByText(name));
    const count = await words.count();
    // Ancestors carrying the same words come first in document order, so the last match is
    // the control itself rather than the box around it.
    return count ? words.nth(count - 1) : null;
  }

  async function isDisabled(control: Locator): Promise<boolean> {
    if (await control.isDisabled().catch(() => false)) return true;
    return (await control.getAttribute("aria-disabled").catch(() => null)) === "true";
  }

  // A disabled control is the page saying it is not ready, and is reported at once rather
  // than pressed until the test runs out of time.
  async function press(where: string, name: RegExp, scope: Scope = page): Promise<void> {
    await ready();
    const control = await findControl(scope, name);
    if (!control) {
      throw new Error(`unbound: ${where} — no control named ${name} on ${page.url()}`);
    }
    if (await isDisabled(control)) {
      throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}`);
    }
    await control.click();
    await settle();
  }

  async function hrefOf(scope: Scope, name: RegExp): Promise<string> {
    const links = seen(scope.getByRole("link", { name }));
    if (!(await links.count())) return "";
    return (await links.first().getAttribute("href")) ?? "";
  }

  // ---------------------------------------------------------------- screens behind sign-in
  //
  // Every screen the contract names that needs a session. Each was opened signed out, with
  // the seeded record's identifier wherever its address takes one, and what it answered is
  // named in the reason. open() throws for the same reason its members do, so that a test
  // which opens one of these and reads nothing else is not told it worked — except on a
  // screen with a member about the refusal itself, where reaching the refusal is the point
  // and open() only goes there.

  const camel = (name: string): string => name.replace(/_([a-z0-9])/g, (_match, c: string) => c.toUpperCase());

  // What walking the target signed in found: the dashboard, one's own account screens, and
  // to public sector staff and the administrator the program chooser, the Code With Us form
  // and a Code With Us opportunity's management screen; everything else answers "Page not
  // found".
  const NOBODY_SIGNS_IN =
    'walked signed in (as the administrator, as a public sector employee, and as a vendor for a vendor\'s screens — the seeded organization owner for the organization screens — with the seeded records\' identifiers), the running build serves a signed-in person /dashboard (to the administrator "Create an opportunity" over "All opportunities", each Code With Us opportunity linked to its management screen; to public sector staff the same over "My opportunities"), the account screens under /users, to the administrator the content-management screens under /content, and to the administrator and public sector staff only /opportunities/create, /opportunities/code-with-us/create and /opportunities/code-with-us/:opportunityId/edit; every other opportunity, proposal, organization and evaluation screen — every Sprint With Us and Team With Us screen (tried with the seeded closed, awarded and at-consensus opportunities of both), the Code With Us proposal screens (tried as a vendor with the seeded published Code With Us opportunity, whose page offers no way to start one), /opportunities/code-with-us/:opportunityId/complete, /opportunities and /organizations included — answers "Page not found"';

  // What each such address answered a signed-out visitor when it was last opened: /dashboard
  // and /sign-up/complete send them to /sign-in?redirectOnSuccess=…, and everything else
  // (/users/me, /users/:userId, /organizations/:orgId/edit, the create screens) shows the
  // client's "Page not found" screen.
  function signedOutAnswer(route: string): string {
    if (/^\/(dashboard|sign-up\/complete)(\?|$)/.test(route)) {
      return "redirects to /sign-in";
    }
    return 'shows the "Page not found" screen';
  }

  const behindSession = (route: string): string =>
    `${route} is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}; opened signed out (with the seeded record's identifier where it takes one) it ${signedOutAnswer(route)}`;

  // A profile section the running build links to but does not fill.
  const sectionRedrawn = (route: string, label: string): string =>
    `walked signed in as a vendor (the seeded organization owner among them), the "${label}" link under "Profile sections" on the profile goes to ${route}, which draws "My Organizations" and only the line "The organizations you own or belong to will be listed here once organizations can be registered on the Digital Marketplace." — no table, badge, invitation or control, though the seed gives that vendor organizations; a public sector account's profile offers no "${label}" link at all, the administrator is shown another account's profile without that section, and /organizations answers "Page not found"`;

  function absent<T>(
    pageId: string,
    route: string,
    answers: string,
    members: readonly string[],
    refusals: readonly string[] = [],
  ): T {
    const built: Record<string, unknown> = {
      open: async (params?: Record<string, string>): Promise<void> => {
        // Under /api there is nothing for a browser to show, so nothing is opened.
        if (route.startsWith("/api/")) {
          throw new Error(`unbound: ${pageId}.open — ${answers}`);
        }
        await page
          .goto(leniently(route, params), { waitUntil: "domcontentloaded" })
          .catch(() => undefined);
        await settle();
        if (refusals.length) return;
        // A build that serves the screen to whoever signed in has opened it, and only the
        // members nothing on it does report unbound.
        if (!(await whyNotHere().catch(() => ""))) return;
        // What the address actually answered this time, rather than what it answered when
        // this adapter was written.
        const shown = await firstHeading().catch(() => "");
        throw new Error(
          `unbound: ${pageId}.open — ${answers}${shown ? ` (it shows "${shown}" at ${page.url()})` : ""}`,
        );
      },
    };
    for (const member of members) {
      built[camel(member)] = async (): Promise<never> => {
        throw new Error(`unbound: ${pageId}.${member} — ${answers}`);
      };
    }
    for (const member of refusals) built[camel(member)] = () => refusalShown();
    return built as unknown as T;
  }

  // ---------------------------------------------------------------- sign in and out

  type SignInEntry = { route?: string; username?: string; unavailable?: string };

  // This target signs in through the sandbox identity provider, so a persona's username is
  // read from persona.signIn["sandbox-idp"] and the password from the environment — never
  // from anything written down in the suite.
  //
  // /sign-in offers "Sign in as a vendor" and "Sign in as a public sector employee" (buttons),
  // and each hands off to the sandbox identity provider's "Sign in to your account" form,
  // which returns through /auth/callback to the marketplace once it accepts the account.
  // Who the browser was last signed in as (the anonymous visitor when signed out), so a
  // screen or control that is missing can be told apart as a refusal of that person.
  let actingAs: Persona | null = null;
  const actingMay = (capability: RegExp): boolean =>
    !!actingAs && ((actingAs as unknown as { can?: string[] }).can ?? []).some((one) => capability.test(one));
  const actingId = (): string => (actingAs as unknown as { id?: string } | null)?.id ?? "nobody signed in";

  async function signIn(who: Persona): Promise<void> {
    const table = who.signIn as unknown as null | Record<string, SignInEntry>;
    actingAs = null;
    if (!table) {
      // The anonymous visitor has no account; being signed out is the whole state.
      await forgetEveryone();
      actingAs = who;
      return;
    }
    const where = `signIn.${who.id}`;
    const entry = table["sandbox-idp"];
    if (!entry || entry.unavailable !== undefined || !entry.username) {
      throw new Error(
        `unbound: ${where} — ${entry?.unavailable ?? "this persona has no sandbox identity provider account"}`,
      );
    }
    const password = process.env.SDLC_SANDBOX_PASSWORD;
    if (!password) {
      throw new Error(
        `unbound: ${where} — SDLC_SANDBOX_PASSWORD is not set, so there is no password to sign in with`,
      );
    }

    // Start from a browser holding nothing for the target (a person still signed in is
    // sent from /sign-in on to /dashboard), then take the way in the sign-in screen offers
    // this kind of account: "Sign in as a vendor" for a vendor, "Sign in as a public sector
    // employee" for public sector staff and administrators. Every vendor's sandbox username
    // says so.
    await forgetEveryone();
    await page.goto(baseURL + "/sign-in", { waitUntil: "domcontentloaded" });
    await ready();
    const way = /vendor/i.test(entry.username) ? "Sign in as a vendor" : "Sign in as a public sector employee";
    const offer = await findControl(page, new RegExp(`^\\s*${way}\\s*$`, "i"));
    if (!offer) {
      throw new Error(`unbound: ${where} — the sign-in screen at ${page.url()} offers no "${way}" control`);
    }
    await offer.click();

    // The provider's own form: "Sign in to your account", with "Username", "Password" and
    // "Sign In". The password box sits beside a "Show password" button, so both are found
    // as text boxes by name rather than by any label mentioning a password.
    const form = await identityProviderForm();
    if (!form) {
      // Only the provider's origin is named: its address carries the request's parameters.
      const said = (await bodyText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
      throw new Error(
        `unbound: ${where} — "${way}" on /sign-in hands off to ${originOf(page.url())}, which shows no username and password form; it says: ${said}`,
      );
    }
    await form.username.fill(entry.username);
    await form.password.fill(password);
    const submit = seen(page.getByRole("button", { name: /^\s*(sign in|log in)\s*$/i })).first();
    if (!(await submit.count())) {
      throw new Error(
        `unbound: ${where} — the identity provider form at ${originOf(page.url())} offers nothing to submit it with`,
      );
    }
    await submit.click();
    const home = originOf(baseURL);
    const back = await page
      .waitForURL((url) => url.origin === home && !/^\/auth\/callback/.test(url.pathname), { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
    if (!back) {
      // Still on the provider: it refused the account, and says why. That is a real failure
      // of signing in, not a missing binding.
      const said = (await bodyText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
      throw new Error(
        `${where} — the identity provider at ${originOf(page.url())} did not hand back to ${home} after "Sign In" as ${entry.username}; it says: ${said}`,
      );
    }
    await settle();
    // The client sends the person on after it has loaded their account (a vendor still to
    // complete a profile to /sign-up/complete, everyone else to /dashboard), so wait until
    // the address has stopped moving before handing the browser back.
    let last = page.url();
    for (let steady = 0, i = 0; steady < 3 && i < 40; i++) {
      await page.waitForTimeout(250);
      const now = page.url();
      steady = now === last ? steady + 1 : 0;
      last = now;
    }
    await ready();
    actingAs = who;
  }

  function originOf(href: string): string {
    return /^[a-z]+:\/\/[^/?#]+/i.exec(href)?.[0] ?? href;
  }

  async function identityProviderForm(): Promise<{ username: Locator; password: Locator } | null> {
    const username = seen(page.getByRole("textbox", { name: /^\s*(user\s*name|username or email|email)\s*$/i })).first();
    const password = seen(page.getByRole("textbox", { name: /^\s*password\s*$/i })).first();
    await username.waitFor({ state: "visible", timeout: 20000 }).catch(() => undefined);
    if ((await username.count()) && (await password.count())) return { username, password };
    // A password input has no textbox role in every browser; fall back to its label alone.
    const byLabel = seen(page.getByLabel(/^\s*password\s*$/i, { exact: false })).first();
    if ((await username.count()) && (await byLabel.count())) return { username, password: byLabel };
    return null;
  }

  // Nobody signed in: the browser carries no cookies (the marketplace's nor the identity
  // provider's) and none of the target's local or session storage, where the client keeps
  // "digital-marketplace.tokens" and "digital-marketplace.account". Storage can only be
  // emptied from the target's own origin, so the browser is left on "/" and reloaded there.
  async function forgetEveryone(): Promise<void> {
    await page.context().clearCookies().catch(() => undefined);
    if (originOf(page.url()) !== originOf(baseURL)) {
      await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    }
    await clearStorage();
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await settle();
  }

  async function clearStorage(): Promise<void> {
    await page
      .evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      })
      .catch(() => undefined);
  }

  // Signing out the way a person does: the "Sign out" link in the header's "Account"
  // navigation (it goes to /sign-out), or /sign-out itself when the browser is not on a
  // marketplace screen carrying that link. The service ends the session there and draws
  // "Signed Out" / "You have successfully signed out" / "Sign in again", and the browser is
  // left on that screen for user-sign-out to read. Nothing is cleared here: whether the
  // session actually ended is the service's to decide and the test's to check. The full
  // reset lives in forgetEveryone(), at the start of signIn() and for the anonymous persona.
  async function signOut(): Promise<void> {
    actingAs = null;
    const onTarget = originOf(page.url()) === originOf(baseURL);
    const link = onTarget
      ? seen(page.getByRole("navigation").getByRole("link", { name: /^\s*sign out\s*$/i })).first()
      : null;
    if (link && (await link.count())) {
      await link.click();
      await page.waitForURL((url) => url.pathname === "/sign-out", { timeout: 15000 }).catch(() => undefined);
    }
    if (new URL(page.url()).pathname !== "/sign-out") {
      await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" });
    }
    await ready();
  }

  // ================================================================ the pages that are here

  // ---------------------------------------------------------------- home

  const home: S.HomePage = {
    open: () => go("/"),
    browseOpportunities: () => press("home.browse_opportunities", /^browse opportunities$/i),
    signIn: () => press("home.sign_in", /^sign in$/i),
    signUp: () => press("home.sign_up", /^sign up$/i),
    // Each figure is drawn over its label ("95" over "TOTAL OPPORTUNITIES AWARDED", the
    // label shown in capitals).
    totalAwardedOpportunityCount: async () => {
      const found = await valueAbove(/^total opportunities awarded$/i);
      if (found) return found;
      throw new Error(
        `unbound: home.total_awarded_opportunity_count — the home page carries no "Total Opportunities Awarded" figure; it reads: ${(await mainText()).replace(/\n+/g, " | ")}`,
      );
    },
    totalAwardedOpportunityValue: async () => {
      const found = await valueAbove(/^total value of all opportunities$/i);
      if (found) return found;
      throw new Error(
        `unbound: home.total_awarded_opportunity_value — the home page carries no "Total Value of All Opportunities" figure; it reads: ${(await mainText()).replace(/\n+/g, " | ")}`,
      );
    },
    readableWhenSignedOut: () => mainText(),
  };

  // ---------------------------------------------------------------- the service's own status

  // Not a screen. The address answers "OK" as plain text, and requesting it is the act the
  // contract names — the one a test performs instead of waiting for a clock.
  const scheduledTransitionTrigger: S.ScheduledTransitionTriggerPage = {
    open: () => go("/status"),
    runPendingTransitions: async () => {
      await visit("/status");
      const answered = await bodyText();
      if (!answered) {
        throw new Error(
          `unbound: scheduled-transition-trigger.run_pending_transitions — ${baseURL}/status answered nothing`,
        );
      }
    },
    serviceIsUp: async () => {
      if (new URL(page.url()).pathname !== "/status") await visit("/status");
      return bodyText();
    },
  };

  // ---------------------------------------------------------------- the footer

  const footer = siteFooter;

  async function footerLink(name: RegExp): Promise<string> {
    await ready();
    if (!(await footer().count())) return "";
    return hrefOf(footer(), name);
  }

  async function openFromFooter(where: string, name: RegExp): Promise<void> {
    await ready();
    if (!(await footer().count())) {
      throw new Error(`unbound: ${where} — this page carries no footer (${page.url()})`);
    }
    await press(where, name, footer());
  }

  const contentFooter: S.ContentFooterPage = {
    open: () => go("/"),
    openAbout: () => openFromFooter("content-footer.open_about", /^about$/i),
    openDisclaimer: () => openFromFooter("content-footer.open_disclaimer", /^disclaimer$/i),
    openPrivacy: () => openFromFooter("content-footer.open_privacy", /^privacy$/i),
    openAccessibility: () => openFromFooter("content-footer.open_accessibility", /^accessibility$/i),
    openCopyright: () => openFromFooter("content-footer.open_copyright", /^copyright$/i),
    aboutLink: () => footerLink(/^about$/i),
    disclaimerLink: () => footerLink(/^disclaimer$/i),
    privacyLink: () => footerLink(/^privacy$/i),
    accessibilityLink: () => footerLink(/^accessibility$/i),
    copyrightLink: () => footerLink(/^copyright$/i),
    presentWhenSignedOut: async () => {
      await ready();
      return (await footer().count()) ? (await footer().innerText()).trim() : "";
    },
  };

  // ---------------------------------------------------------------- the service level agreement link

  const slaLink = (): Locator =>
    seen(page.getByRole("link", { name: /service level agreement/i }));

  const contentServiceLevelAgreementLink: S.ContentServiceLevelAgreementLinkPage = {
    open: () => go("/learn-more/code-with-us"),
    followServiceLevelAgreementLink: async () => {
      await ready();
      const href = (await slaLink().count()) ? await slaLink().first().getAttribute("href") : null;
      if (!href) {
        throw new Error(
          `unbound: content-service-level-agreement-link.follow_service_level_agreement_link — no service level agreement link on ${page.url()}`,
        );
      }
      await visit(href);
    },
    serviceLevelAgreementLink: async () => {
      await ready();
      return (await slaLink().count()) ? (await slaLink().first().innerText()).trim() : "";
    },
    linkTargetAddress: async () => {
      await ready();
      return ((await slaLink().count()) ? await slaLink().first().getAttribute("href") : null) ?? "";
    },
    // Nothing is followed, and so nothing is answered, where the page offers no such link
    // (the program explainers carry none on this target).
    answerAtLinkTarget: async () => {
      await ready();
      if (!(await slaLink().count())) return "";
      const href = await slaLink().first().getAttribute("href");
      if (!href) return "";
      await visit(href);
      return mainText();
    },
  };

  // ---------------------------------------------------------------- a published page

  const ADDRESS_LINE = /^Address of this page:\s*(\S+)/;

  async function statedAddress(): Promise<string> {
    for (const line of await textLines()) {
      const found = ADDRESS_LINE.exec(line);
      if (found) return found[1];
    }
    return "";
  }

  // The body the page is showing, without the line stating the page's own address.
  async function pageBodyText(): Promise<string> {
    const main = page.getByRole("main");
    if (!(await main.count())) return "";
    return (await paragraphs(main.first()))
      .filter((words) => ADDRESS_LINE.exec(words) === null)
      .join("\n");
  }

  const contentView: S.ContentViewPage = {
    // An address with no page behind it is something a criterion is about, so this never
    // refuses to open one: what the service answered is read back by the observations.
    // Dialogs are listened for from before the address is asked for, so that markup in the
    // body which runs as the page renders is caught (body_script_ran).
    open: async (params) => {
      listenForDialogs();
      await go("/content/:slug", params as unknown as Record<string, string>);
    },
    bodyElementNames: () => bodyElementNames("content-view.body_element_names"),
    bodyScriptRan: () => bodyScriptRan("content-view.body_script_ran"),
    followBodyLink: async () => {
      if (await notFoundShown()) {
        throw new Error(
          `unbound: content-view.follow_body_link — no page is published at ${page.url()}, so there is no body to follow a link in`,
        );
      }
      // The page is drawn as an article in main: its title, its dates as terms, its body and
      // a line stating its own address, which carries no link. So every link in the article
      // is in the body (seen with a page written to link to /content/about).
      const main = page.getByRole("main");
      const article = seen(main.getByRole("article"));
      const body = (await article.count()) ? article.first() : main.first();
      const links = seen(body.getByRole("link"));
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const href = (await links.nth(i).getAttribute("href")) ?? "";
        if (!href || href.startsWith("#")) continue;
        await links.nth(i).click();
        await settle();
        return;
      }
      throw new Error(
        `unbound: content-view.follow_body_link — the body of the page at ${page.url()} carries no link to follow`,
      );
    },
    pageAddress: async () => {
      if (await notFoundShown()) return "";
      const stated = await statedAddress();
      return stated || new URL(page.url()).pathname;
    },
    pageTitle: async () => {
      if (await notFoundShown()) return "";
      const heading = seen(page.getByRole("heading", { level: 1 }));
      return (await heading.count()) ? (await heading.first().innerText()).trim() : "";
    },
    pageBody: async () => ((await notFoundShown()) ? "" : pageBodyText()),
    // Under the title, a list of terms: "Published" over "January 5, 2026", "Last updated"
    // over "January 7, 2026".
    publishedDate: async () => ((await notFoundShown()) ? "" : publicDate("published_date", "Published")),
    updatedDate: async () => ((await notFoundShown()) ? "" : publicDate("updated_date", "Last updated")),
    readableWhenSignedOut: () => mainText(),
    notFoundForUnknownAddress: async () => ((await notFoundShown()) ? mainText() : ""),
  };

  // ---------------------------------------------------------------- managing pages
  //
  // Served to the administrator (the header's "Content" link): /content lists every page in
  // a table captioned "Every page, in order of title" (Title, Public address, Needed by the
  // service, Created, Last updated) under a "Create page" link; /content/create is a form
  // (Title, Address, a formatted Body with an "Insert image" button) with "Cancel" and
  // "Publish page" in a "Page actions" group, "Publish page" confirmed in a "Publish this
  // page?" dialog, after which the browser lands on the new page's /content/<slug>/edit with
  // a "Page published" status. That screen shows the page's facts as a list of terms
  // (Public address, Published, Published by, Last updated, Last updated by), "Edit page" and
  // "Delete page" in "Page actions", and the current wording read-only; "Edit page" opens
  // the form with "Cancel" and "Publish changes" ("Publish your changes?" to confirm, then a
  // "Changes published" status). "Delete page" asks "Delete “<title>”?" and lands on
  // /content with a "Page removed" status. A page the service needs carries a note "The
  // service needs this page", no "Delete page", and an Address field it will not let be
  // changed. A refused address is announced as an alert ("This address is already in use")
  // and under the field; a field the form will not accept is marked invalid, with its reason
  // beside it and in a "Fix N field(s) to publish the page" note. Anybody else, signed out
  // included, is shown "Page not found" at all three addresses.

  // The refusal a person who may not manage pages is shown, or "" when the screen is up.
  async function managementRefused(): Promise<string> {
    await ready();
    return refusalShown();
  }

  // Controls pressed on the form or the screen itself, never their namesakes in a dialog.
  function screenControl(name: RegExp): Locator {
    return seen(page.getByRole("main").getByRole("button", { name }));
  }

  function openDialog(): Locator {
    return seen(page.getByRole("dialog")).filter({ hasText: /\S/ });
  }

  async function pressOnScreen(where: string, name: RegExp): Promise<void> {
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(where, `the management screen did not open at ${page.url()}: ${refused}`);
    const control = screenControl(name).first();
    if (!(await control.count())) unbound(where, `no control named ${name} on ${page.url()}`);
    if (await isDisabled(control)) {
      const said = await linesMatching(/^(fill in|fix \d+ field)/i);
      throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}${said ? `; the page says: ${said}` : ""}`);
    }
    await control.click();
    await settle();
  }

  async function dialogShown(timeout = 5000): Promise<boolean> {
    await openDialog().first().waitFor({ state: "visible", timeout }).catch(() => undefined);
    if (!(await openDialog().count())) return false;
    await page.waitForTimeout(300);
    return true;
  }

  async function pressInDialog(where: string, name: RegExp): Promise<void> {
    if (!(await dialogShown())) unbound(where, `no confirmation is open on ${page.url()}`);
    const control = seen(openDialog().first().getByRole("button", { name })).first();
    if (!(await control.count())) unbound(where, `the confirmation on ${page.url()} offers no control named ${name}`);
    await control.click();
    await openDialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  async function closeDialog(): Promise<void> {
    for (let attempt = 0; attempt < 3 && (await openDialog().count()); attempt++) {
      const cancel = seen(openDialog().first().getByRole("button", { name: /^\s*(cancel|close)\s*$/i })).first();
      if (await cancel.count()) await cancel.click().catch(() => undefined);
      else await page.keyboard.press("Escape").catch(() => undefined);
      await openDialog().first().waitFor({ state: "hidden", timeout: 2000 }).catch(() => undefined);
    }
  }

  // The form's three fields, by the start of their labels ("Title(required)", "Address",
  // "Body (required)"); on a page's screen the read-only "Current wording" boxes carry the
  // same names, so the editable one is taken when there is one.
  const CONTENT_FIELDS: Record<string, { label: RegExp; keys: string[] }> = {
    title: { label: /^\s*title/i, keys: ["title", "pageTitle", "name"] },
    slug: { label: /^\s*address/i, keys: ["slug", "address", "path", "url"] },
    body: { label: /^\s*body/i, keys: ["body", "content", "text", "markdown"] },
  };

  function contentBox(which: string): Locator {
    return seen(page.getByRole("main").getByRole("textbox", { name: CONTENT_FIELDS[which].label }));
  }

  async function editableBox(which: string): Promise<Locator | null> {
    const boxes = contentBox(which);
    const count = await boxes.count();
    for (let i = 0; i < count; i++) if (await boxes.nth(i).isEditable().catch(() => false)) return boxes.nth(i);
    return null;
  }

  // The values an input hands over, by field: a bare value is the field the action names,
  // and a record fills every field it carries. A key matching no field is reported, never
  // dropped.
  function contentValues(where: string, input: unknown, which?: string): Record<string, string> {
    if (input === undefined || input === null) return which ? { [which]: "" } : {};
    if (typeof input !== "object" || Array.isArray(input)) {
      if (!which) unbound(where, `the input ${JSON.stringify(input)} names no field of the form`);
      return { [which]: textOf(input) };
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(record(input))) {
      const slot = Object.keys(CONTENT_FIELDS).find((name) => CONTENT_FIELDS[name].keys.map(squash).includes(squash(key)));
      if (!slot) unbound(where, `the input carries "${key}", and the form has no field for it (only Title, Address and Body)`);
      out[slot] = textOf(value);
    }
    if (which && !(which in out)) {
      const values = Object.values(record(input)).filter((value) => typeof value === "string");
      if (values.length === 1 && !Object.keys(out).length) out[which] = String(values[0]);
    }
    return out;
  }

  async function fillContent(where: string, values: Record<string, string>, startIfNeeded: boolean): Promise<void> {
    if (!Object.keys(values).length) return;
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(where, `the management screen did not open at ${page.url()}: ${refused}`);
    // A page's screen shows its wording read-only until "Edit page" is pressed.
    if (startIfNeeded && !(await editableBox(Object.keys(values)[0])) && (await screenControl(/^\s*edit page\s*$/i).count())) {
      await pressOnScreen(where, /^\s*edit page\s*$/i);
    }
    for (const [which, value] of Object.entries(values)) {
      let box = await editableBox(which);
      if (!box) {
        await contentBox(which).first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
        box = await editableBox(which);
      }
      if (!box) {
        if (await contentBox(which).count()) {
          const said = await linesMatching(/cannot be changed|cannot change/i);
          throw new Error(`${where} — the ${which === "slug" ? "Address" : which} field is read-only on ${page.url()}${said ? `: ${said}` : ""}`);
        }
        unbound(where, `no ${which === "slug" ? "Address" : which} field on ${page.url()}`);
      }
      await box.fill(value);
    }
    await page.keyboard.press("Tab").catch(() => undefined);
    await settle();
  }

  // Every reason the form gives for not taking what was entered: the alert it raises, each
  // invalid field's own message, and the list of fields still to fix.
  async function contentErrors(pattern?: RegExp): Promise<string> {
    await ready();
    const said: string[] = [];
    const alerts = seen(page.getByRole("main").getByRole("alert"));
    for (let i = 0; i < (await alerts.count()); i++) said.push((await alerts.nth(i).innerText()).trim());
    const HELP = /^(between 1 and|use lowercase letters and numbers, in groups|public address:|formatted text,|changing the address moves|the service needs this page at)/i;
    const boxes = seen(page.getByRole("main").getByRole("textbox"));
    for (let i = 0; i < (await boxes.count()); i++) {
      const box = boxes.nth(i);
      if ((await box.getAttribute("aria-invalid")) !== "true") continue;
      const described = await box.evaluate((element) =>
        (element.getAttribute("aria-describedby") ?? "")
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => (document.getElementById(id) as HTMLElement | null)?.innerText?.trim() ?? ""),
      );
      for (const words of described) if (words && !HELP.test(words)) said.push(words);
    }
    const notes = seen(page.getByRole("main").getByRole("note", { name: /^\s*fix \d+ field/i }));
    for (let i = 0; i < (await notes.count()); i++) said.push(...lined(await notes.nth(i).innerText()));
    return [...new Set(said.filter(Boolean))].filter((words) => !pattern || pattern.test(words)).join("\n");
  }

  // A status the screen announces ("Page published", "Changes published", "Page removed").
  async function contentStatus(pattern: RegExp): Promise<string> {
    await ready();
    const statuses = seen(page.getByRole("main").getByRole("status")).filter({ hasText: pattern });
    await statuses.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    return (await statuses.allInnerTexts()).map((words) => words.trim()).join("\n");
  }

  async function screenControlState(name: RegExp): Promise<string> {
    await ready();
    const control = screenControl(name).first();
    if (!(await control.count())) return "absent";
    return (await isDisabled(control)) ? "disabled" : "enabled";
  }

  // The page list's body rows, once drawn; none when the list is refused.
  async function contentRows(): Promise<Locator[]> {
    await ready();
    if (await refusalShown()) return [];
    const table = seen(page.getByRole("main").getByRole("table")).first();
    await seen(table.getByRole("cell")).first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    const rows = table.getByRole("row").filter({ has: page.getByRole("cell") });
    const out: Locator[] = [];
    for (let i = 0; i < (await rows.count()); i++) out.push(rows.nth(i));
    return out;
  }

  async function contentColumn(index: number): Promise<string> {
    const lines: string[] = [];
    for (const row of await contentRows()) {
      const cell = row.getByRole("cell").nth(index);
      lines.push((await cell.innerText()).trim());
    }
    return lines.join("\n");
  }

  // The row a test names by title, address or slug; the first row when it names none.
  async function contentRow(where: string, input: unknown): Promise<Locator> {
    const named = typeof input === "object" && input !== null
      ? field(input, "slug", "address", "title", "name", "page")
      : textOf(input);
    const rows = await contentRows();
    if (!rows.length) {
      const refused = await refusalShown();
      unbound(where, refused ? `the page list did not open at ${page.url()}: ${refused}` : `the page list at ${page.url()} has no rows`);
    }
    if (!named) return rows[0];
    const wanted = named.replace(/^\/?content\//, "").replace(/^\//, "");
    for (const row of rows) {
      const cells = (await row.getByRole("cell").allInnerTexts()).map((words) => words.trim());
      if (cells[0] === named || cells[1] === `/content/${wanted}` || cells[1] === named) return row;
    }
    unbound(where, `no page titled or addressed "${named}" in the list at ${page.url()}`);
  }

  // The value the page's screen gives under one of its terms ("Published", "Published by").
  async function contentFact(term: string): Promise<{ words: string; href: string }> {
    await ready();
    const terms = seen(page.getByRole("main").getByRole("term")).filter({ hasText: new RegExp(`^\\s*${term}\\s*$`, "i") });
    if (!(await terms.count())) return { words: "", href: "" };
    const value = terms.first().locator("xpath=following-sibling::*[1]");
    const words = (await value.innerText().catch(() => "")).trim();
    const link = seen(value.getByRole("link")).first();
    const href = (await link.count()) ? ((await link.getAttribute("href")) ?? "") : "";
    return { words, href };
  }

  // A date on the public page, read from under its term; a page without the term is unbound.
  async function publicDate(member: string, term: string): Promise<string> {
    await ready();
    const terms = seen(page.getByRole("main").getByRole("term")).filter({ hasText: new RegExp(`^\\s*${term}\\s*$`, "i") });
    if (!(await terms.count())) {
      unbound(`content-view.${member}`, `the page at ${page.url()} shows no "${term}" term under its title`);
    }
    return (await contentFact(term)).words;
  }

  // A reader on a page's screen: unbound when the screen was refused, its value otherwise.
  async function onPageScreen<T>(where: string, read: () => Promise<T>): Promise<T> {
    const refused = await managementRefused();
    if (refused) unbound(where, `the page's management screen did not open at ${page.url()}: ${refused}`);
    return read();
  }

  // A reader on the list or the create form: what the screen shows, nothing when it is the
  // refusal (a person who may not manage pages is shown none of it).
  async function onScreen(read: () => Promise<string>): Promise<string> {
    if (await managementRefused()) return "";
    return read();
  }

  // The terms page's management screen, signed in as the administrator, carries a region
  // headed "Notify vendors of updated terms" below the current wording: a button of that
  // name opens an unnamed dialog ("Notify vendors that the terms have changed?") with
  // "Cancel" and "Notify vendors". Once confirmed the region announces a status "Vendors
  // have been notified …", or an alert "Vendors have not been notified …" when the service
  // refuses. Anyone else is shown "Page not found" there, with no such control.
  const TERMS_ROUTE = "/content/terms-and-conditions/edit";
  const announcement = (): Locator =>
    seen(page.getByRole("main").getByRole("region", { name: /^\s*notify vendors of updated terms\s*$/i }));
  const NOTIFY_CONTROL = /^\s*notify vendors of updated terms\s*$/i;

  async function announcementSays(role: "status" | "alert", pattern: RegExp): Promise<string> {
    await ready();
    const said = seen(announcement().getByRole(role)).filter({ hasText: pattern });
    await said.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    return (await said.allInnerTexts()).map((words) => words.trim()).join("\n");
  }

  const termsBroadcast: S.NotificationTermsBroadcastPage = {
    open: () => go(TERMS_ROUTE),
    notifyVendorsOfUpdatedTerms: async () => {
      const where = "notification-terms-broadcast.notify_vendors_of_updated_terms";
      await ready();
      const refused = await refusalShown();
      if (refused) unbound(where, `the terms page's management screen did not open at ${page.url()}: ${refused}`);
      const control = seen(announcement().getByRole("button", { name: NOTIFY_CONTROL })).first();
      if (!(await control.count())) unbound(where, `no control named ${NOTIFY_CONTROL} on ${page.url()}`);
      if (await isDisabled(control)) {
        throw new Error(`${where} — the control named ${NOTIFY_CONTROL} is disabled on ${page.url()}`);
      }
      await control.click();
      await dialogShown();
    },
    confirmNotifyVendors: () =>
      pressInDialog("notification-terms-broadcast.confirm_notify_vendors", /^\s*notify vendors\s*$/i),
    cancelNotifyVendors: () =>
      pressInDialog("notification-terms-broadcast.cancel_notify_vendors", /^\s*cancel\s*$/i),
    // The control's own words where it is offered; nothing where it is not, the refusal a
    // non-administrator is shown included.
    notifyVendorsControl: async () => {
      await ready();
      const control = seen(page.getByRole("main").getByRole("button", { name: NOTIFY_CONTROL })).first();
      return (await control.count()) ? (await control.innerText()).trim() : "";
    },
    notifyVendorsConfirmation: async () => {
      if (!(await dialogShown())) return "";
      return (await openDialog().first().innerText()).trim();
    },
    notifyVendorsSuccess: () => announcementSays("status", /have been notified/i),
    notifyVendorsFailure: () => announcementSays("alert", /\S/),
  };

  const contentList: S.ContentListPage = {
    open: () => go("/content"),
    openPageForEditing: async (input) => {
      const where = "content-list.open_page_for_editing";
      const row = await contentRow(where, input);
      await row.getByRole("cell").nth(0).getByRole("link").first().click();
      await page.waitForURL((url) => /\/content\/[^/]+\/edit$/.test(url.pathname), { timeout: 15000 }).catch(() => undefined);
      await ready();
    },
    openPublicPage: async (input) => {
      const where = "content-list.open_public_page";
      const row = await contentRow(where, input);
      const href = await row.getByRole("cell").nth(1).getByRole("link").first().getAttribute("href");
      if (!href) unbound(where, `the row on ${page.url()} carries no public address link`);
      await visit(href);
    },
    createPage: async () => {
      const where = "content-list.create_page";
      await ready();
      const refused = await refusalShown();
      if (refused) unbound(where, `the page list did not open at ${page.url()}: ${refused}`);
      const link = seen(page.getByRole("main").getByRole("link", { name: /^\s*create page\s*$/i })).first();
      if (!(await link.count())) unbound(where, `no "Create page" link on ${page.url()}`);
      await link.click();
      await page.waitForURL((url) => url.pathname === "/content/create", { timeout: 15000 }).catch(() => undefined);
      await ready();
    },
    pageTitle: () => contentColumn(0),
    pagePublicAddress: () => contentColumn(1),
    // "<public address>: Yes" for a page the service needs, ": No" for an ordinary one.
    pageIsFixed: async () => {
      const lines: string[] = [];
      for (const row of await contentRows()) {
        const cells = (await row.getByRole("cell").allInnerTexts()).map((words) => words.trim());
        lines.push(`${cells[1]}: ${cells[2]}`);
      }
      return lines.join("\n");
    },
    pageCreatedDate: () => contentColumn(3),
    pageUpdatedDate: () => contentColumn(4),
    orderedByTitle: () => contentColumn(0),
    refusedForNonAdministrator: () => refusalShown(),
    pageCount: async () => {
      if (await managementRefused()) return "";
      return String((await contentRows()).length);
    },
  };

  // A person who may not manage pages is shown "Page not found" at /content/create, with no
  // form to type into; that refusal is what the test reads next, so the form's actions do
  // nothing there rather than report the form missing.
  const contentCreate: S.ContentCreatePage = {
    open: () => go("/content/create"),
    enterTitle: async (input) => {
      if (await managementRefused()) return;
      await fillContent("content-create.enter_title", contentValues("content-create.enter_title", input, "title"), false);
    },
    enterSlug: async (input) => {
      if (await managementRefused()) return;
      await fillContent("content-create.enter_slug", contentValues("content-create.enter_slug", input, "slug"), false);
    },
    enterBody: async (input) => {
      if (await managementRefused()) return;
      await fillContent("content-create.enter_body", contentValues("content-create.enter_body", input, "body"), false);
    },
    uploadBodyImage: (input) => insertBodyImage("content-create.upload_body_image", input),
    publishPage: async (input) => {
      const where = "content-create.publish_page";
      if (await managementRefused()) return;
      await fillContent(where, contentValues(where, input), false);
      await pressOnScreen(where, /^\s*publish page\s*$/i);
      if (!(await dialogShown())) {
        throw new Error(`${where} — pressing "Publish page" raised no "Publish this page?" confirmation on ${page.url()}`);
      }
    },
    // Accepted, the browser lands on the new page's screen; refused, the form stays with an
    // alert. Whichever comes first ends the wait.
    confirmPublish: async () => {
      if (await managementRefused()) return;
      await pressInDialog("content-create.confirm_publish", /^\s*publish page\s*$/i);
      await Promise.race([
        page.waitForURL((url) => url.pathname !== "/content/create", { timeout: 15000 }),
        seen(page.getByRole("main").getByRole("alert")).first().waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => undefined);
      await ready();
    },
    cancel: async () => {
      if (await managementRefused()) return;
      await closeDialog();
      await pressOnScreen("content-create.cancel", /^\s*cancel\s*$/i);
    },
    fieldError: () => onScreen(() => contentErrors()),
    // "Use lowercase letters and numbers, in groups joined by single hyphens, like about-us.
    // No capital letters, spaces or underscores, and no hyphen at the start or end."
    slugRuleHelp: () => onScreen(() => linesMatching(/^use lowercase letters and numbers, in groups/i)),
    // "Public address: http://…/content/<slug>", or "shown once the address is valid."
    resultingPublicAddress: () =>
      onScreen(async () => (await linesMatching(/^public address:/i)).replace(/^public address:\s*/i, "")),
    publishDisabledUntilValid: () => onScreen(() => screenControlState(/^\s*publish page\s*$/i)),
    publishConfirmation: async () => ((await dialogShown(2000)) ? (await openDialog().first().innerText()).trim() : ""),
    publishedSuccess: () => onScreen(() => contentStatus(/page published/i)),
    duplicateSlugError: () => onScreen(() => contentErrors(/already (in use|uses)/i)),
    refusedForNonAdministrator: () => refusalShown(),
  };

  // What the editor's status line said while the last image was being put in, every wording
  // in order; read by file-embedded-image.uploading_indicator.
  let bodyImageNotices: string[] = [];

  // "Insert image" over the body opens the browser's file chooser (JPEG or PNG, up to 10 MB);
  // the image is stored at once and written into the body at the cursor as
  // "![Describe this image](@file/<id>)", announced in the status beside it ("<name> was
  // inserted at the cursor. …"), or refused in an alert ("<name> could not be inserted / It
  // is not a JPEG or PNG image. … Nothing was added to the body.") with the body untouched.
  //
  // Walked as the administrator on /content/about-us/edit after "Edit page" (and on
  // /content/create): pressing "Insert image" — by mouse or by Enter — opened no chooser on
  // the running build, while "Bold" beside it did work on the body. That is the control
  // failing a person, so it fails the action plainly rather than reporting it unbound.
  async function insertBodyImage(where: string, input: unknown): Promise<void> {
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(where, `the management screen did not open at ${page.url()}: ${refused}`);
    if (!(await editableBox("body")) && (await screenControl(/^\s*edit page\s*$/i).count())) {
      await pressOnScreen(where, /^\s*edit page\s*$/i);
    }
    const body = await editableBox("body");
    if (!body) unbound(where, `no editable Body on ${page.url()}`);
    const name = field(input, "file", "fileName", "file_name", "name", "image") || (typeof input === "string" ? input : "") || "body-image.png";
    const content = given(input, ["content", "contents"]);
    const bytes = Number(field(input, "bytes", "size", "sizeBytes"));
    const path = uploadFile({
      name,
      ...(typeof content === "string" || content instanceof Uint8Array ? { content } : {}),
      ...(Number.isFinite(bytes) && bytes > 0 ? { bytes } : {}),
    });
    const before = await body.inputValue();
    await body.click();
    const chooser = page.waitForEvent("filechooser", { timeout: 10000 }).catch(() => null);
    await pressOnScreen(where, /^\s*insert image\s*$/i);
    const offered = await chooser;
    if (!offered) throw new Error(`${where} — "Insert image" on ${page.url()} opened no file chooser`);
    // Every wording the status line takes from here on, however briefly it is shown.
    bodyImageNotices = [];
    await page
      .getByRole("main")
      .getByRole("status")
      .evaluateAll((lines) => {
        const heard: string[] = [];
        (window as unknown as { __bodyImageNotices: string[] }).__bodyImageNotices = heard;
        for (const line of lines) {
          new MutationObserver(() => {
            const words = (line as HTMLElement).innerText.trim();
            if (words && heard[heard.length - 1] !== words) heard.push(words);
          }).observe(line, { subtree: true, childList: true, characterData: true });
        }
      })
      .catch(() => undefined);
    await offered.setFiles(path);
    for (let waited = 0; waited < 15000; waited += 250) {
      if ((await body.inputValue().catch(() => before)) !== before) break;
      if (await seen(page.getByRole("main").getByRole("alert")).filter({ hasText: /could not be inserted/i }).count()) break;
      const said = (await seen(page.getByRole("main").getByRole("status")).allInnerTexts()).join("").trim();
      if (said && !/uploading|storing/i.test(said)) break;
      await page.waitForTimeout(250);
    }
    await settle();
    bodyImageNotices = await page
      .evaluate(() => (window as unknown as { __bodyImageNotices?: string[] }).__bodyImageNotices ?? [])
      .catch(() => []);
  }

  const contentEdit: S.ContentEditPage = {
    open: (params) => go("/content/:slug/edit", params as unknown as Record<string, string>),
    startEditing: () => pressOnScreen("content-edit.start_editing", /^\s*edit page\s*$/i),
    editTitle: (input) => fillContent("content-edit.edit_title", contentValues("content-edit.edit_title", input, "title"), true),
    editSlug: (input) => fillContent("content-edit.edit_slug", contentValues("content-edit.edit_slug", input, "slug"), true),
    editBody: (input) => fillContent("content-edit.edit_body", contentValues("content-edit.edit_body", input, "body"), true),
    uploadBodyImage: (input) => insertBodyImage("content-edit.upload_body_image", input),
    publishChanges: async (input) => {
      const where = "content-edit.publish_changes";
      await fillContent(where, contentValues(where, input), true);
      await pressOnScreen(where, /^\s*publish changes\s*$/i);
      if (!(await dialogShown())) {
        throw new Error(`${where} — pressing "Publish changes" raised no "Publish your changes?" confirmation on ${page.url()}`);
      }
    },
    confirmPublishChanges: async () => {
      await pressInDialog("content-edit.confirm_publish_changes", /^\s*publish changes\s*$/i);
      await Promise.race([
        seen(page.getByRole("main").getByRole("status")).filter({ hasText: /\S/ }).first().waitFor({ state: "visible", timeout: 15000 }),
        seen(page.getByRole("main").getByRole("alert")).first().waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => undefined);
      await ready();
    },
    cancelEditing: async () => {
      await closeDialog();
      await pressOnScreen("content-edit.cancel_editing", /^\s*cancel\s*$/i);
    },
    // Withheld from a page the service needs; that is read by delete_withheld_for_fixed_page.
    deletePage: async () => {
      const where = "content-edit.delete_page";
      await ready();
      if (!(await refusalShown()) && !(await screenControl(/^\s*delete page\s*$/i).count())) {
        const note = await linesMatching(/cannot change its address or delete it/i);
        throw new Error(`${where} — no "Delete page" on ${page.url()}${note ? `: ${note}` : ""}`);
      }
      await pressOnScreen(where, /^\s*delete page\s*$/i);
      if (!(await dialogShown())) throw new Error(`${where} — pressing "Delete page" raised no confirmation on ${page.url()}`);
    },
    confirmDeletePage: async () => {
      await pressInDialog("content-edit.confirm_delete_page", /^\s*delete page\s*$/i);
      await Promise.race([
        page.waitForURL((url) => url.pathname === "/content", { timeout: 15000 }),
        seen(page.getByRole("main").getByRole("alert")).first().waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => undefined);
      await ready();
    },
    // Under "Public address" on the screen, or "Public address: http://…/content/<slug>"
    // while the form is open.
    pageAddress: () =>
      onPageScreen("content-edit.page_address", async () => {
        const fact = (await contentFact("Public address")).words;
        if (fact) return fact;
        const stated = /(\/content\/[^\s/]+)\s*$/.exec(await linesMatching(/^public address:/i));
        return stated ? stated[1] : (/^(\/content\/[^/]+)\/edit$/.exec(new URL(page.url()).pathname)?.[1] ?? "");
      }),
    publishedDate: () => onPageScreen("content-edit.published_date", async () => (await contentFact("Published")).words),
    updatedDate: () => onPageScreen("content-edit.updated_date", async () => (await contentFact("Last updated")).words),
    // A page no person wrote names "System", with no link.
    publishedBy: () => onPageScreen("content-edit.published_by", async () => (await contentFact("Published by")).words),
    updatedBy: () => onPageScreen("content-edit.updated_by", async () => (await contentFact("Last updated by")).words),
    publishedByLink: () =>
      onPageScreen("content-edit.published_by_link", async () => {
        const href = (await contentFact("Published by")).href;
        return href ? new URL(href, baseURL).pathname : "";
      }),
    updatedByLink: () =>
      onPageScreen("content-edit.updated_by_link", async () => {
        const href = (await contentFact("Last updated by")).href;
        return href ? new URL(href, baseURL).pathname : "";
      }),
    fixedPageWarning: () =>
      onPageScreen("content-edit.fixed_page_warning", async () => {
        const note = seen(page.getByRole("main").getByRole("note", { name: /service needs this page/i }));
        return (await note.count()) ? (await note.first().innerText()).trim() : "";
      }),
    // "The service needs this page at this address, so the address cannot be changed." on
    // the form, "… you cannot change its address or delete it." on the screen.
    slugLockedForFixedPage: () =>
      onPageScreen("content-edit.slug_locked_for_fixed_page", () =>
        linesMatching(/address cannot be changed|cannot change its address/i),
      ),
    deleteWithheldForFixedPage: () =>
      onPageScreen("content-edit.delete_withheld_for_fixed_page", () => screenControlState(/^\s*delete page\s*$/i)),
    fieldError: () => onPageScreen("content-edit.field_error", () => contentErrors()),
    duplicateSlugError: () => onPageScreen("content-edit.duplicate_slug_error", () => contentErrors(/already (in use|uses)/i)),
    changesPublishedSuccess: () =>
      onPageScreen("content-edit.changes_published_success", () => contentStatus(/changes published/i)),
    // Announced on the page list, where the browser lands once the page is gone.
    deletedSuccess: () => onPageScreen("content-edit.deleted_success", () => contentStatus(/page removed|deleted/i)),
    refusedForNonAdministrator: () => refusalShown(),
    bodyBeingEdited: () =>
      onPageScreen("content-edit.body_being_edited", async () => {
        const box = (await editableBox("body")) ?? contentBox("body").first();
        return (await box.count()) ? (await box.inputValue()).trim() : "";
      }),
    // The screen offers no earlier versions ("The wording it replaces is kept on record, but
    // it cannot be viewed or restored from the service."), so this reads empty.
    versionHistory: () =>
      onPageScreen("content-edit.version_history", async () => {
        const region = seen(page.getByRole("main").getByRole("region", { name: /history|versions/i }));
        return (await region.count()) ? (await region.first().innerText()).trim() : "";
      }),
  };

  // ---------------------------------------------------------------- an image in the body

  // The image control of the formatted-text editor, bound where the contract places it: the
  // administrator's /content/<slug>/edit, after "Edit page" (walked on the seeded about-us
  // page). The toolbar "Formatting for Body" carries "Insert image", described by "Insert
  // image takes a JPEG or PNG image, up to 10 MB. An inserted image is stored as soon as you
  // choose it and anyone can see it." An inserted image goes into the body as
  // "![Describe this image](@file/<id>)", and the published /content/<slug> draws it as an
  // image whose address is /api/files/<id>?type=blob (the image itself; /api/files/<id>
  // alone answers the file's record, not the image).

  let embeddedSlug = "";

  function slugInView(): string {
    const path = new URL(page.url()).pathname;
    const found = /^\/content\/([^/]+)(?:\/edit)?\/?$/.exec(path);
    return found && found[1] !== "create" ? decodeURIComponent(found[1]) : embeddedSlug;
  }

  // The body as the screen holds it: the form's box while editing, the "Current wording"
  // box otherwise.
  async function bodyNow(): Promise<string> {
    const box = (await editableBox("body")) ?? contentBox("body").first();
    return (await box.count()) ? box.inputValue() : "";
  }

  // The images written into a body, one per line, as the body carries them.
  const imagesInBody = (body: string): string[] =>
    [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((found) => found[0]);

  const servedAt = (reference: string): string => {
    const id = /^@file\/([^)\s]+)$/.exec(reference)?.[1];
    return id ? `/api/files/${id}?type=blob` : reference;
  };

  const fileEmbeddedImage: S.FileEmbeddedImagePage = {
    open: async (params) => {
      if (params?.slug) embeddedSlug = params.slug;
      await go("/content/:slug/edit", params as unknown as Record<string, string>);
    },
    uploadBodyImage: (input) => insertBodyImage("file-embedded-image.upload_body_image", input),
    // The address the last image in the body is kept at; nothing when the body has none. The
    // body's reference is read again for a few seconds, since it is written once the image is
    // stored.
    imageAddress: () =>
      onPageScreen("file-embedded-image.image_address", async () => {
        for (let waited = 0; ; waited += 250) {
          const last = imagesInBody(await bodyNow()).pop();
          if (last) return servedAt(/\(([^)\s]+)\)$/.exec(last)?.[1] ?? "");
          if (waited >= 5000) return "";
          await page.waitForTimeout(250);
        }
      }),
    // Only the image references in the body ("![Describe this image](@file/<id>)"), never the
    // rest of the wording: empty when no image was put in.
    imageInsertedIntoText: () =>
      onPageScreen("file-embedded-image.image_inserted_into_text", async () => {
        for (let waited = 0; ; waited += 250) {
          const found = imagesInBody(await bodyNow());
          if (found.length || waited >= 5000) return found.join("\n");
          await page.waitForTimeout(250);
        }
      }),
    // The rule the editor states under its toolbar, which "Insert image" is described by.
    onlyJpegAndPngOffered: () =>
      onPageScreen("file-embedded-image.only_jpeg_and_png_offered", async () => {
        if (!(await editableBox("body")) && (await screenControl(/^\s*edit page\s*$/i).count())) {
          await pressOnScreen("file-embedded-image.only_jpeg_and_png_offered", /^\s*edit page\s*$/i);
        }
        if (!(await screenControl(/^\s*insert image\s*$/i).count())) {
          unbound(
            "file-embedded-image.only_jpeg_and_png_offered",
            `no "Insert image" control over the body on ${page.url()}, after "Edit page" where offered`,
          );
        }
        return linesMatching(/^insert image takes /i);
      }),
    // Every wording the status line took while the last image was being stored that speaks
    // of it being under way; the status as it stands when no image was put in here.
    uploadingIndicator: () =>
      onPageScreen("file-embedded-image.uploading_indicator", async () => {
        const heard = bodyImageNotices.length
          ? bodyImageNotices
          : await seen(page.getByRole("main").getByRole("status")).allInnerTexts();
        return heard
          .map((words) => words.trim())
          .filter((words) => /uploading|storing|inserting|in progress/i.test(words))
          .join("\n");
      }),
    // Read on the published /content/<slug>: the addresses of the images its text draws from
    // the service's stored files, one per line; empty when it draws none.
    imageRenderedInPublishedText: async () => {
      const where = "file-embedded-image.image_rendered_in_published_text";
      const slug = slugInView();
      if (!slug) unbound(where, `no page address is known on ${page.url()}, and the page was never opened with one`);
      const published = address("/content/:slug", { slug });
      if (new URL(page.url()).pathname !== new URL(published).pathname) {
        await page.goto(published, { waitUntil: "domcontentloaded" });
      }
      await ready();
      const refused = await refusalShown();
      if (refused) unbound(where, `the published page did not open at ${page.url()}: ${refused}`);
      let sources: string[] = [];
      for (let waited = 0; waited <= 5000; waited += 250) {
        sources = (
          await seen(page.getByRole("main").getByRole("img")).evaluateAll((images) =>
            images.map((image) => image.getAttribute("src") ?? ""),
          )
        ).filter((source) => source.includes("/api/files/"));
        if (sources.length) break;
        await page.waitForTimeout(250);
      }
      return sources.join("\n");
    },
    // The body as it stands after a refused image, for the test to compare with what it was.
    uploadFailureLeavesTextUnchanged: () =>
      onPageScreen("file-embedded-image.upload_failure_leaves_text_unchanged", async () => (await bodyNow()).trim()),
  };

  // ================================================================ the rest of the surface

  function unbound(where: string, why: string): never {
    throw new Error(`unbound: ${where} — ${why}`);
  }

  // An action the page refused this person: recorded here and on the run's output, not
  // thrown, so the test's own follow-up reading of the outcome decides.
  const refusalLog: string[] = [];
  function noteRefusal(what: string): void {
    refusalLog.push(what);
    console.info(`refused: ${what}`);
  }

  // Members of a page that remains unreachable, each refusing with the same reason.
  function unboundMembers(pageId: string, why: string, names: readonly string[]): Record<string, unknown> {
    const built: Record<string, unknown> = {};
    for (const name of names) {
      built[camel(name)] = async (): Promise<never> => unbound(`${pageId}.${name}`, why);
    }
    return built;
  }

  const behindSignIn = (screen: string, signedOut: string): string =>
    `${screen} is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}; opened signed out with the seeded record's identifier it ${signedOut}`;

  // What this target shows somebody who may not have the screen they asked for: its "Not
  // Found" screen, the sign-in screen it redirects to, or (for an address the service
  // answers itself) its plain "You do not have permission" answer. Empty when the screen
  // is shown.
  async function refusalShown(): Promise<string> {
    await ready();
    const at = new URL(page.url());
    if (at.pathname === "/sign-in") return `sent to the sign-in screen (${at.pathname}${at.search})`;
    if (!(await page.getByRole("main").count())) {
      const said = await bodyText().catch(() => "");
      return /do not have permission|not authori[sz]ed/i.test(said) ? said : "";
    }
    // "Page not found" over "Back to home" now; "Not Found" over "Go Home" once.
    if (!(await seen(page.getByRole("heading", { name: /^\s*(page )?not found\s*$/i })).count())) return "";
    const lines = await textLines();
    const from = Math.max(0, lines.findIndex((line) => /^(page )?not found$/i.test(line)));
    const to = lines.findIndex((line, i) => i > from && /^(go home|back to home)$/i.test(line));
    return lines.slice(from, to > from ? to : from + 2).join("\n");
  }

  // Why the browser is not on the screen it was sent to: a refusal (above), or a hand-off to
  // another origin (the identity provider). Empty when it is on a screen of this target.
  async function whyNotHere(): Promise<string> {
    const refused = await refusalShown();
    if (refused) return refused;
    if (originOf(page.url()) !== originOf(baseURL)) return `handed off to ${originOf(page.url())}`;
    return "";
  }

  // ---------------------------------------------------------------- the opportunity pages

  // The three public opportunity pages draw their key figures as a value over its label
  // ("Sep 9, 2026" over "Assignment Date"), the award as an alert above the title, and
  // their longer sections behind a row of tabs (Details, Scope & Contract / Competition
  // Rules, Attachments, Addenda).
  async function opportunityLines(where: string): Promise<string[]> {
    const refused = await refusalShown();
    if (refused) unbound(where, `the opportunity did not open at ${page.url()}: ${refused}`);
    return textLines();
  }

  async function figureAbove(where: string, label: RegExp): Promise<string> {
    const lines = await opportunityLines(where);
    for (let i = 1; i < lines.length; i++) if (label.test(lines[i])) return lines[i - 1];
    return "";
  }

  // The Team With Us page's "Key Dates" section: "<label> (Anticipated) <date>".
  async function keyDate(where: string, label: RegExp): Promise<string> {
    for (const line of await opportunityLines(where)) {
      const found = label.exec(line);
      if (found) return line.slice(found.index + found[0].length).trim();
    }
    return "";
  }

  // What the award notice says beyond the winner's name. A signed-out visitor is shown only
  // "This opportunity was awarded to <name>."; whatever else a reader permitted to see
  // scores is shown there is picked out by what it looks like.
  async function awardDetail(where: string, kind: RegExp): Promise<string> {
    await opportunityLines(where);
    const alerts = seen(page.getByRole("alert"));
    const lines: string[] = [];
    for (let i = 0; i < (await alerts.count()); i++) {
      lines.push(...(await alerts.nth(i).innerText()).split("\n").map((line) => line.trim()).filter(Boolean));
    }
    if (!lines.some((line) => /awarded to/i.test(line))) return "";
    return lines.filter((line) => !/awarded to/i.test(line) && kind.test(line)).join("\n");
  }

  const CONTACT_DETAIL = /@|\+?\d[\d\s().-]{8,}\d|\b(contact|e-?mail|phone)\b/i;
  const SCORE_DETAIL = /\bscore\b|\d+(\.\d+)?\s*%|\bpoints?\b/i;

  // A section behind one of the page's tabs, read from its heading to the "Got Questions?"
  // box that closes every section.
  async function sectionBehind(where: string, tab: string): Promise<string> {
    await opportunityLines(where);
    const control = seen(page.getByText(tab, { exact: true })).first();
    if (!(await control.count())) unbound(where, `the opportunity page at ${page.url()} offers no "${tab}" tab`);
    await control.click();
    await seen(page.getByText(tab, { exact: true }))
      .nth(1)
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
    await settle();
    const lines = await textLines();
    const from = lines.lastIndexOf(tab);
    if (from < 0) unbound(where, `choosing "${tab}" on ${page.url()} showed no section of that name`);
    const to = lines.findIndex((line, i) => i > from && /^got questions\?$/i.test(line));
    return lines.slice(from + 1, to > from ? to : undefined).join("\n");
  }

  // A section of the Details tab below its "Got Questions?" box ("Phases of Work", "Service
  // Areas"), from its heading to the one after it. The Details tab is chosen first if an
  // earlier reader left another tab open.
  async function detailsSection(where: string, start: RegExp, end: RegExp): Promise<string> {
    let lines = await opportunityLines(where);
    if (!lines.some((line) => start.test(line))) {
      const details = seen(page.getByText("Details", { exact: true })).first();
      if (await details.count()) {
        await details.click();
        await settle();
        lines = await opportunityLines(where);
      }
    }
    const from = lines.findIndex((line) => start.test(line));
    if (from < 0) return "";
    const to = lines.findIndex((line, i) => i > from && end.test(line));
    return lines.slice(from + 1, to > from ? to : undefined).join("\n");
  }

  const PROGRAM_NAME: Record<string, string> = {
    "code-with-us": "Code With Us",
    "sprint-with-us": "Sprint With Us",
    "team-with-us": "Team With Us",
  };

  const signedInOnly = (what: string): string =>
    `${what} is offered on an opportunity's page only to a signed-in person — signed out, the seeded published Code With Us opportunity says "If you already have a vendor account, please sign in." where it would be — and ${NOBODY_SIGNS_IN}`;

  // Read on the seeded published, awarded and closed opportunities of each program. The
  // header reads "Published <date> | Updated <date>" over the title, the program's name
  // over its status badge, and "Closes <date> at <time>" (or "Closed …"); an award is an
  // alert above it all, "This opportunity was awarded to <name>.". The public page names
  // nobody who made or changed the opportunity, for anybody who can open it, so those read
  // as nothing on a page that did open.
  function opportunityView<T>(
    pageId: string,
    route: string,
    program: string,
    added: Record<string, () => Promise<string>>,
  ): T {
    const where = (member: string): string => `${pageId}.${member}`;
    const pressOffered = async (member: string, name: RegExp, what: string): Promise<void> => {
      await opportunityLines(where(member));
      const control = await findControl(page, name);
      if (!control) unbound(where(member), `no control named ${name} on ${page.url()}: ${signedInOnly(what)}`);
      if (await isDisabled(control)) unbound(where(member), `the control named ${name} is disabled on ${page.url()}`);
      await control.click();
      await settle();
    };
    const built: Record<string, unknown> = {
      open: (params?: Record<string, string>) => go(route, params),
      toggleWatch: () => pressOffered("toggle_watch", /^(watch|watching|unwatch)$/i, "watching an opportunity"),
      startProposal: () => pressOffered("start_proposal", /^start proposal$/i, "starting a proposal"),
      opportunityIdentifier: async () => {
        await opportunityLines(where("opportunity_identifier"));
        return new RegExp(`^/opportunities/${program}/([^/?#]+)`).exec(new URL(page.url()).pathname)?.[1] ?? "";
      },
      status: async () => {
        const lines = await opportunityLines(where("status"));
        const at = lines.indexOf(PROGRAM_NAME[program]);
        return at >= 0 && at + 1 < lines.length ? lines[at + 1] : "";
      },
      publishedDate: async () => {
        await opportunityLines(where("published_date"));
        return datedLine("Published");
      },
      createdByName: async () => {
        await opportunityLines(where("created_by_name"));
        return valueAfter(["Created By"]);
      },
      lastChangedByName: async () => {
        await opportunityLines(where("last_changed_by_name"));
        return valueAfter(["Updated By", "Last Changed By"]);
      },
      proposalDeadline: async () =>
        (await opportunityLines(where("proposal_deadline"))).filter((line) => /^Close[sd]\b/.test(line)).join("\n"),
      // "There are currently no addenda for this opportunity." is an empty list.
      addenda: async () => {
        const section = await sectionBehind(where("addenda"), "Addenda");
        return /^there are currently no addenda/i.test(section) ? "" : section;
      },
      successfulProponent: async () => {
        const banner = (await opportunityLines(where("successful_proponent"))).find((line) => /awarded to\s+\S/i.test(line));
        return banner ? (/awarded to\s+(.+)$/i.exec(banner)?.[1] ?? "").replace(/\.$/, "").trim() : "";
      },
      ...added,
    };
    return built as unknown as T;
  }

  const CWU_VIEW = "opportunity-cwu-view";
  const SWU_VIEW = "opportunity-swu-view";
  const TWU_VIEW = "opportunity-twu-view";

  // ---------------------------------------------------------------- a published page's body

  let dialogsSeen: string[] = [];
  let dialogListener: ((dialog: Dialog) => void) | null = null;

  function listenForDialogs(): void {
    if (dialogListener) page.off("dialog", dialogListener);
    dialogsSeen = [];
    dialogListener = (dialog: Dialog) => {
      dialogsSeen.push(dialog.message());
      dialog.dismiss().catch(() => undefined);
    };
    page.on("dialog", dialogListener);
  }

  // The body is what follows the page's title and its dated line: heading, dates, body.
  async function bodyElementNames(where: string): Promise<string> {
    const refused = await refusalShown();
    if (refused) unbound(where, `no page is published at ${page.url()}: ${refused}`);
    const title = seen(page.getByRole("heading", { level: 1 })).first();
    if (!(await title.count())) unbound(where, `the page at ${page.url()} carries no title to find its body by`);
    return title.evaluate((heading) => {
      const dated = heading.nextElementSibling;
      const body = dated ? dated.nextElementSibling : null;
      const names: string[] = [];
      const walk = (element: Element): void => {
        for (const child of Array.from(element.children)) {
          names.push(child.tagName.toLowerCase());
          walk(child);
        }
      };
      if (body) walk(body);
      return names.join("\n");
    });
  }

  async function bodyScriptRan(where: string): Promise<string> {
    if (!dialogListener) unbound(where, "the page was not opened through content-view.open, so nothing was listening");
    const refused = await refusalShown();
    if (refused) unbound(where, `no page is published at ${page.url()}: ${refused}`);
    // "On opening or within a few seconds after".
    await page.waitForTimeout(3000);
    return dialogsSeen.length ? "yes" : "";
  }

  // ---------------------------------------------------------------- the evaluation screens

  // Opened for real, so that what a person who may not have it is shown can be read: this
  // target answers every one of them, signed out, with its "Not Found" screen.
  function evaluationScreen<T>(pageId: string, route: string, earlier: readonly string[]): T {
    return {
      ...absent<Record<string, unknown>>(pageId, route, behindSession(route), earlier),
      open: (params?: Record<string, string>) => go(route, params),
      refusedWhenNotPermitted: () => refusalShown(),
    } as unknown as T;
  }

  // ---------------------------------------------------------------- the mail catcher

  // Mailpit, at the address the harness names; each Playwright worker has its own, named
  // SDLC_MAIL_API_<worker>, with the unnumbered name as the fallback, exactly as the
  // harness's own mail fixture resolves it. Every message this target sends comes from
  // "Digital Marketplace <donotreply@example.test>" with the service's logo linked home at
  // the top of the formatted body.
  function mailApi(where: string): string {
    const copy = process.env.TEST_PARALLEL_INDEX ?? "0";
    const api = (process.env[`SDLC_MAIL_API_${copy}`] ?? process.env.SDLC_MAIL_API ?? "").replace(/\/+$/, "");
    return api || unbound(where, "SDLC_MAIL_API is not set, so there is no mail catcher to read");
  }

  type MailAddress = { Name?: string; Address?: string };
  type CaughtMessage = {
    ID: string;
    From?: MailAddress | null;
    To?: MailAddress[] | null;
    Cc?: MailAddress[] | null;
    Bcc?: MailAddress[] | null;
    ReplyTo?: MailAddress[] | null;
    Subject?: string;
    HTML?: string;
    Text?: string;
  };

  const mailbox = (one: MailAddress | null | undefined): string =>
    !one?.Address ? "" : one.Name ? `${one.Name} <${one.Address}>` : one.Address;
  const mailboxes = (list: MailAddress[] | null | undefined): string =>
    (list ?? []).map(mailbox).filter(Boolean).join("\n");

  async function mailRequest(where: string, method: string, path: string, data?: unknown): Promise<{ status: number; json: unknown }> {
    const target = mailApi(where) + path;
    const response = await page.request
      .fetch(target, { method, ...(data === undefined ? {} : { data }) })
      .catch((error: unknown) => unbound(where, `the mail catcher at ${target} could not be reached (${String(error)})`));
    const text = await response.text().catch(() => "");
    return { status: response.status(), json: parse(text) };
  }

  const entity = (words: string): string =>
    words
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

  // Every link of the formatted body as its label and where it leads; a link drawn as a
  // picture is labelled by the picture's own words.
  function linksOf(html: string): { label: string; href: string }[] {
    const found: { label: string; href: string }[] = [];
    const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    for (let match = anchor.exec(html); match !== null; match = anchor.exec(html)) {
      const href = /\bhref\s*=\s*"([^"]*)"/i.exec(match[1])?.[1] ?? /\bhref\s*=\s*'([^']*)'/i.exec(match[1])?.[1];
      if (!href) continue;
      let label = entity(match[2].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
      if (!label) label = entity(/\balt\s*=\s*"([^"]*)"/i.exec(match[2])?.[1] ?? "").trim();
      found.push({ label, href: entity(href) });
    }
    return found;
  }

  let openedMessage: CaughtMessage | null = null;
  const message = (where: string): CaughtMessage =>
    openedMessage ?? unbound(where, "no message has been opened (caught-message.open)");

  const caughtMessage: S.CaughtMessagePage = {
    async open(params) {
      const where = "caught-message.open";
      const id = params?.messageId;
      if (!id) unbound(where, "no message identifier was given");
      const got = await mailRequest(where, "GET", `/api/v1/message/${encodeURIComponent(id)}`);
      if (got.status !== 200) unbound(where, `the mail catcher answered ${got.status} for message ${id}`);
      openedMessage = got.json as CaughtMessage;
    },
    // The link carrying the label given — its exact words first, then any link containing
    // them. An invitation's message labels its answers "Approve" and "Reject", which are
    // what a criterion's "accept" and "decline" mean.
    async followLinkInBody(input) {
      const where = "caught-message.follow_link_in_body";
      const wanted = (field(input, "label", "link", "name", "text") || textOf(input)).trim().toLowerCase();
      if (!wanted) unbound(where, "no link label was given");
      const links = linksOf(message(where).HTML ?? "");
      const find = (words: string) =>
        links.find((each) => each.label.toLowerCase() === words) ??
        links.find((each) => each.label.toLowerCase().includes(words));
      const SAME: Record<string, string> = { accept: "approve", approve: "accept", decline: "reject", reject: "decline" };
      const other = Object.entries(SAME).find(([word]) => new RegExp(`\\b${word}`).test(wanted))?.[1];
      const link = find(wanted) ?? (other ? find(other) : undefined);
      if (!link) {
        unbound(
          where,
          `the message's formatted body has no link labelled "${wanted}" (its links: ${
            links.map((each) => `"${each.label}"`).join(", ") || "none"
          })`,
        );
      }
      await page.goto(link.href, { waitUntil: "domcontentloaded" });
      await settle();
    },
    visibleRecipients: async () => mailboxes(message("caught-message.visible_recipients").To),
    copiedRecipients: async () => {
      const opened = message("caught-message.copied_recipients");
      return [mailboxes(opened.Cc), mailboxes(opened.Bcc)].filter(Boolean).join("\n");
    },
    sender: async () => mailbox(message("caught-message.sender").From),
    replyTo: async () => mailboxes(message("caught-message.reply_to").ReplyTo),
    subject: async () => message("caught-message.subject").Subject ?? "",
    htmlBody: async () => message("caught-message.html_body").HTML ?? "",
    plainTextBody: async () => message("caught-message.plain_text_body").Text ?? "",
    logoAddress: async () =>
      entity(/<img\b[^>]*\bsrc\s*=\s*"([^"]*)"/i.exec(message("caught-message.logo_address").HTML ?? "")?.[1] ?? ""),
    linksInBody: async () =>
      linksOf(message("caught-message.links_in_body").HTML ?? "")
        .map((each) => `${each.label} -> ${each.href}`)
        .join("\n"),
  };

  let caughtList: CaughtMessage[] | null = null;
  let caughtTotal = 0;
  const caught = (where: string): CaughtMessage[] =>
    caughtList ?? unbound(where, "the list of caught messages has not been opened (caught-message-list.open)");

  const caughtMessageList: S.CaughtMessageListPage = {
    // Newest first, a page at a time until the catcher's own total is reached.
    async open() {
      const where = "caught-message-list.open";
      const all: CaughtMessage[] = [];
      let total = 0;
      for (let start = 0; start < 100000; ) {
        const got = await mailRequest(where, "GET", `/api/v1/messages?start=${start}&limit=500`);
        if (got.status !== 200) unbound(where, `the mail catcher answered ${got.status} for its message list`);
        const listed = (got.json ?? {}) as { messages?: CaughtMessage[]; messages_count?: number; total?: number };
        const batch = listed.messages ?? [];
        total = listed.messages_count ?? listed.total ?? all.length + batch.length;
        all.push(...batch);
        start += batch.length;
        if (!batch.length || all.length >= total) break;
      }
      caughtList = all;
      caughtTotal = Math.max(total, all.length);
    },
    messageIdentifiers: async () => caught("caught-message-list.message_identifiers").map((each) => each.ID).join("\n"),
    messageSubjects: async () =>
      caught("caught-message-list.message_subjects").map((each) => each.Subject ?? "").join("\n"),
    // One line per message, its visible recipients separated by commas.
    messageVisibleRecipients: async () =>
      caught("caught-message-list.message_visible_recipients")
        .map((each) => (each.To ?? []).map(mailbox).filter(Boolean).join(", "))
        .join("\n"),
    messageCount: async () => {
      caught("caught-message-list.message_count");
      return String(caughtTotal);
    },
  };

  // The catcher's own fault injection: while the sender fault is certain its SMTP server
  // refuses every message at the first command. Read on this machine's catcher, GET
  // /api/v1/chaos answers {"Sender":{"ErrorCode":451,"Probability":0}, ...}.
  async function chaos(where: string, probability?: number): Promise<Record<string, unknown>> {
    const got =
      probability === undefined
        ? await mailRequest(where, "GET", "/api/v1/chaos")
        : await mailRequest(where, "PUT", "/api/v1/chaos", { Sender: { ErrorCode: 451, Probability: probability } });
    if (got.status !== 200) {
      unbound(where, `the mail catcher answered ${got.status} for /api/v1/chaos; its fault injection is not switched on`);
    }
    return (got.json ?? {}) as Record<string, unknown>;
  }

  const mailDeliveryFault: S.MailDeliveryFaultPage = {
    open: async () => {
      await chaos("mail-delivery-fault.open");
    },
    refuseDelivery: async () => {
      await chaos("mail-delivery-fault.refuse_delivery", 100);
    },
    restoreDelivery: async () => {
      await chaos("mail-delivery-fault.restore_delivery", 0);
    },
    // "refused <code>" while the fault is in force; nothing while delivery is accepted.
    deliveryRefused: async () => {
      const sender = ((await chaos("mail-delivery-fault.delivery_refused")).Sender ?? {}) as Record<string, unknown>;
      return Number(sender.Probability ?? 0) >= 100 ? `refused ${String(sender.ErrorCode ?? "")}`.trim() : "";
    },
  };

  // The pass-through proxy in front of the catcher's SMTP port, controlled beside the
  // catcher under /hold (observables.yaml delivery_delay), and nowhere else: the contract
  // gives no other address for it. On the sandbox this target was walked against there is
  // no such proxy: every /hold address on the catcher answers its plain "404 page not
  // found", and nothing answers on the proxy's usual control port (8474) or the ports
  // around the catcher, so these members report unbound there until the sandbox serves it.
  // Where it is served, GET .../toxics answers [] while replies pass at full speed; a delay
  // of three seconds on every reply is added as the toxic "hold" and removed by name;
  // adding one already there, or removing one already gone, leaves the proxy as asked, so
  // those answers count as done too.
  const TOXICS = "/hold/proxies/smtp/toxics";

  async function hold(where: string, method: "GET" | "POST" | "DELETE"): Promise<unknown> {
    const got =
      method === "GET"
        ? await mailRequest(where, "GET", TOXICS)
        : method === "DELETE"
          ? await mailRequest(where, "DELETE", `${TOXICS}/hold`)
          : await mailRequest(where, "POST", TOXICS, {
              name: "hold",
              type: "latency",
              stream: "downstream",
              toxicity: 1,
              attributes: { latency: 3000, jitter: 0 },
            });
    const settled = method === "GET" ? [200] : method === "POST" ? [200, 201, 409] : [200, 204, 404];
    // On a catcher started without the proxy beside it, every /hold address gets the same
    // plain "404 page not found" as any address the catcher does not serve.
    if (got.status === 404 && method !== "DELETE") {
      unbound(
        where,
        `the mail catcher answered 404 for ${method} ${TOXICS}, the same not-found it gives any address it does not ` +
          `serve: the delay proxy's control API (observables.yaml delivery_delay) is not mounted beside this catcher, ` +
          `and no such proxy was found anywhere else on the sandbox (a sandbox gap, not the target's)`,
      );
    }
    if (!settled.includes(got.status)) unbound(where, `the mail delay proxy answered ${got.status} for ${method} ${TOXICS}`);
    return got.json;
  }

  const mailDeliveryDelay: S.MailDeliveryDelayPage = {
    open: async () => {
      await hold("mail-delivery-delay.open", "GET");
    },
    slowDelivery: async () => {
      await hold("mail-delivery-delay.slow_delivery", "POST");
    },
    restoreDeliverySpeed: async () => {
      await hold("mail-delivery-delay.restore_delivery_speed", "DELETE");
    },
    // "slowed <latency>ms" while the delay is in force; nothing while replies pass at speed.
    deliverySlowed: async () => {
      const listed = await hold("mail-delivery-delay.delivery_slowed", "GET");
      const toxic = (Array.isArray(listed) ? (listed as Record<string, unknown>[]) : []).find((each) => each.name === "hold");
      if (!toxic) return "";
      return `slowed ${String(((toxic.attributes ?? {}) as Record<string, unknown>).latency ?? "")}ms`;
    },
  };

  // ---------------------------------------------------------------- requests no screen makes

  // Each is a request to the service's own interface from the browser's session, so it
  // carries whoever is signed in. What the service answered a signed-out request with was
  // read for every address below; what it answers somebody signed in has not been read (the
  // revision that walked the screens signed in did not re-send these requests), so those
  // request bodies follow spec/contract/openapi.yaml and the forms the contract describes.

  type Answer = { status: number; body: string };

  function parse(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  const squash = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

  function record(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  // A value an input carries under any of several spellings ("proposalText",
  // "proposal_text"), at its top level or inside a group it names.
  function given(input: unknown, names: string[], within: string[] = []): unknown {
    const wanted = names.map(squash);
    for (const [key, value] of Object.entries(record(input))) {
      if (wanted.includes(squash(key)) && value !== undefined) return value;
    }
    for (const group of within) {
      for (const [key, value] of Object.entries(record(input))) {
        if (squash(key) !== squash(group)) continue;
        const inner = given(value, names);
        if (inner !== undefined) return inner;
      }
    }
    return undefined;
  }

  function textOf(value: unknown): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(textOf).join(", ");
    return "";
  }

  function field(input: unknown, ...names: string[]): string {
    return textOf(given(input, names));
  }

  // Text exactly as given; a value left out is sent blank, never made up.
  function givenText(input: unknown, names: string[], within: string[] = []): string {
    const value = given(input, names, within);
    if (value && typeof value === "object" && !Array.isArray(value)) return givenText(value, names);
    return textOf(value);
  }

  type SeedRecord = { id?: unknown; email?: unknown; persona?: unknown };
  const seedGroups = seed as unknown as Record<string, Record<string, SeedRecord> | undefined>;

  // A seeded record named by its handle ("qualified" or "organizations.qualified"), by its
  // identifier, or handed over whole, as its identifier; anything else is sent as given.
  function seededId(value: unknown, ...groups: string[]): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "object") {
      const id = record(value).id;
      return typeof id === "string" ? id : "";
    }
    const named = String(value).trim();
    for (const group of groups) {
      const handle = named.startsWith(`${group}.`) ? named.slice(group.length + 1) : named;
      const found = seedGroups[group]?.[handle];
      if (found && found.id !== undefined) return String(found.id);
    }
    return named;
  }

  // A person named by seed handle, persona, identifier or address, or handed over whole.
  function personOf(value: unknown): { id: string; email: string } | null {
    const users = seedGroups.users ?? {};
    const keys: string[] = [];
    if (typeof value === "string" || typeof value === "number") keys.push(String(value).replace(/^users\./, ""));
    else {
      const handed = record(value);
      for (const key of ["id", "email", "handle", "user", "member", "userId"]) {
        if (typeof handed[key] === "string") keys.push(String(handed[key]).replace(/^users\./, ""));
        else if (handed[key] && typeof handed[key] === "object") {
          const inner = personOf(handed[key]);
          if (inner) return inner;
        }
      }
    }
    for (const key of keys) {
      const found =
        users[key] ??
        Object.values(users).find((each) => each.id === key || each.email === key || each.persona === key);
      if (found) return { id: String(found.id ?? ""), email: String(found.email ?? "") };
    }
    for (const key of keys) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return { id: key, email: "" };
      if (key.includes("@")) return { id: "", email: key };
    }
    return null;
  }

  // One page's requests and the latest answer the service gave to them.
  function requests(pageId: string) {
    let last: Answer | null = null;
    return {
      async send(member: string, method: string, target: string, data?: unknown): Promise<Answer> {
        const where = `${pageId}.${member}`;
        const response = await page.request
          .fetch(target, { method, ...(data === undefined ? {} : { data }) })
          .catch((error: unknown) => unbound(where, `${method} ${target} could not be made (${String(error)})`));
        last = { status: response.status(), body: await response.text().catch(() => "") };
        return last;
      },
      last(member: string): Answer {
        return last ?? unbound(`${pageId}.${member}`, "no request has been made on this page yet");
      },
    };
  }

  // A side read, to learn what a request must carry or what is stored, without taking the
  // place of the answer the observations read.
  async function peek(target: string): Promise<{ status: number; json: unknown }> {
    const response = await page.request.get(target).catch(() => null);
    if (!response) return { status: 0, json: null };
    return { status: response.status(), json: parse(await response.text().catch(() => "")) };
  }

  const acceptedText = (got: Answer): string => (got.status < 300 ? `${got.status} ${got.body}` : "");
  const refusalStatusOf = (got: Answer): string => (got.status >= 400 ? String(got.status) : "");
  const refusedText = (got: Answer, statuses: (status: number) => boolean, about?: RegExp): string =>
    got.status >= 400 && statuses(got.status) && (!about || about.test(got.body)) ? `${got.status} ${got.body}` : "";
  const answeredField = (got: Answer, key: string): string => {
    if (got.status >= 300) return "";
    const value = record(parse(got.body))[key];
    return value === undefined || value === null ? "" : String(value);
  };

  // The form a refusal takes: its body with every piece of prose replaced by its kind.
  function shapeOf(value: unknown): unknown {
    if (Array.isArray(value)) return value.length ? [shapeOf(value[0])] : [];
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, inner]) => [key, shapeOf(inner)]));
    }
    return value === null ? null : typeof value;
  }

  // Every message of a refusal, with where the service reports it. A refusal is a list of
  // messages, or a record of fields each holding messages or further fields; a proponent
  // comes back as { tag, value }, an organization's messages being the organization's.
  const FIELD_NAMES: Record<string, string> = {
    legalname: "legal name",
    email: "email address",
    phone: "phone",
    street1: "street address",
    street2: "second address line",
    city: "city",
    region: "province",
    mailcode: "postal code",
    country: "country",
    proposaltext: "proposal text",
    additionalcomment: "additional comments",
    inceptionphase: "inception phase",
    prototypephase: "prototype phase",
    implementationphase: "implementation phase",
    teamquestionresponses: "team question responses",
    resourcequestionresponses: "resource question responses",
    hourlyrate: "hourly rate",
    scrummaster: "scrum master",
    proposedcost: "proposed cost",
    totalproposedcost: "total proposed cost",
  };
  const fieldName = (key: string): string =>
    FIELD_NAMES[squash(key)] ?? key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();

  type Refused = { where: string; message: string };

  function refusalEntries(body: unknown, path: string[] = [], out: Refused[] = []): Refused[] {
    if (typeof body === "string") {
      out.push({ where: path.join(" "), message: body });
    } else if (Array.isArray(body)) {
      const prose = body.every((each) => typeof each === "string");
      body.forEach((each, i) => refusalEntries(each, prose ? path : [...path, `#${i + 1}`], out));
    } else if (body && typeof body === "object") {
      const fields = body as Record<string, unknown>;
      if (typeof fields.tag === "string" && "value" in fields) {
        refusalEntries(fields.value, fields.tag === "organization" ? [...path, "organization"] : path, out);
      } else {
        for (const [key, value] of Object.entries(fields)) {
          if (!value || typeof value !== "object") {
            if (typeof value === "string") out.push({ where: [...path, fieldName(key)].join(" "), message: value });
            continue;
          }
          refusalEntries(value, key === "errors" || key === "proponent" ? path : [...path, fieldName(key)], out);
        }
      }
    }
    return out;
  }

  function refusalOf(got: Answer): { where: string; message: string }[] {
    if (got.status < 400) return [];
    const body = parse(got.body);
    if (body === null) return got.body.trim() ? [{ where: "", message: got.body.trim() }] : [];
    return refusalEntries(body);
  }

  const messagesOf = (got: Answer): string => refusalOf(got).map((each) => each.message).join("\n");
  const byFieldOf = (got: Answer): string =>
    refusalOf(got)
      .map((each) => (each.where ? `${each.where}: ${each.message}` : each.message))
      .join("\n");

  // ------------------------------------------------ organizations one may act for

  // Signed out, this target answers GET /api/ownedOrganizations with an empty list (200).
  const actingFor = requests("organization-acting-for-list");
  const organizationActingForList: S.OrganizationActingForListPage = {
    open: async () => {
      await actingFor.send("open", "GET", `${baseURL}/api/ownedOrganizations`);
    },
    organizationsOffered: async () => {
      const got = actingFor.last("organizations_offered");
      const listed = got.status === 200 ? parse(got.body) : null;
      return Array.isArray(listed) ? listed.map((each) => textOf(record(each).legalName)).join("\n") : "";
    },
    refusedWhenNotPermitted: async () =>
      refusedText(actingFor.last("refused_when_not_permitted"), (status) => status === 401 || status === 403),
  };

  // ------------------------------------------------ memberships

  // POST /api/affiliations { userEmail, organization, membershipType }; signed out this
  // target answers 401 {"permissions":["You do not have permission to perform this action."]}.
  const invitation = requests("affiliation-invitation-request");
  const affiliationInvitationRequest: S.AffiliationInvitationRequestPage = {
    open: async () => undefined,
    async inviteWithMembershipType(input) {
      const member = "invite_with_membership_type";
      const where = `affiliation-invitation-request.${member}`;
      const organization = seededId(given(input, ["organization", "organizationId", "org", "orgId"]), "organizations");
      const who = given(input, ["email", "userEmail", "invitee", "address", "user", "member", "person"]);
      const email = personOf(who)?.email || textOf(who);
      const membershipType = field(input, "membershipType", "membership_type", "type", "role");
      if (!organization) unbound(where, "the input names no organization to invite to");
      if (!email) unbound(where, "the input names no person to invite");
      if (!membershipType) unbound(where, "the input names no membership type");
      await invitation.send(member, "POST", `${baseURL}/api/affiliations`, {
        userEmail: email,
        organization,
        membershipType,
      });
    },
    invitationCreated: async () => acceptedText(invitation.last("invitation_created")),
    invalidMembershipTypeError: async () =>
      refusedText(invitation.last("invalid_membership_type_error"), () => true, /membershipType|membership type/i),
    membershipIdentifier: async () => answeredField(invitation.last("membership_identifier"), "id"),
  };

  // PUT /api/affiliations/:id { tag: "approve" }; signed out this target answers 401
  // {"permissions":["You do not have permission to perform this action."]}.
  const approval = requests("affiliation-approval-request");
  let approvalOpened = "";
  const affiliationApprovalRequest: S.AffiliationApprovalRequestPage = {
    open: async (params) => {
      approvalOpened = seededId(params?.affiliationId, "affiliations");
    },
    async acceptMembershipByRequest(input) {
      const member = "accept_membership_by_request";
      const named = seededId(
        given(input, ["affiliation", "affiliationId", "membership", "membershipId", "membershipIdentifier", "id"]),
        "affiliations",
      );
      const affiliation = named || approvalOpened;
      if (!affiliation) unbound(`affiliation-approval-request.${member}`, "no membership was opened or named to accept");
      await approval.send(member, "PUT", `${baseURL}/api/affiliations/${encodeURIComponent(affiliation)}`, {
        tag: "approve",
        value: null,
      });
    },
    requestAccepted: async () => acceptedText(approval.last("request_accepted")),
    membershipStatus: async () => answeredField(approval.last("membership_status"), "membershipStatus"),
    refusalMessages: async () => messagesOf(approval.last("refusal_messages")),
    refusalStatus: async () => refusalStatusOf(approval.last("refusal_status")),
  };

  // ------------------------------------------------ accounts

  // Signed out, GET /api/users answers 401 ["You do not have permission to perform this action."].
  const userList = requests("user-list-request");
  const userListRequest: S.UserListRequestPage = {
    open: async () => {
      await userList.send("open", "GET", `${baseURL}/api/users`);
    },
    // One account per line: name, address, kind and standing.
    accountsAnswered: async () => {
      const got = userList.last("accounts_answered");
      const listed = got.status === 200 ? parse(got.body) : null;
      if (!Array.isArray(listed)) return "";
      return listed
        .map((each) => {
          const account = record(each);
          return `${textOf(account.name)} <${textOf(account.email)}> ${textOf(account.type)} ${textOf(account.status)}`.trim();
        })
        .join("\n");
    },
    refusedWhenNotPermitted: async () =>
      refusedText(userList.last("refused_when_not_permitted"), (status) => status === 401 || status === 403),
    refusalStatus: async () => refusalStatusOf(userList.last("refusal_status")),
  };

  // GET /api/sessions/current answers "null" signed out; signed in it carries the account as
  // "user", whose "notificationsOn" holds when new-opportunity notices were turned on.
  async function ownAccount(): Promise<Record<string, unknown>> {
    const got = await peek(`${baseURL}/api/sessions/current`);
    return got.status === 200 ? record(record(got.json).user) : {};
  }

  const userAccountSelfRequest: S.UserAccountSelfRequestPage = {
    open: async () => {
      await ownAccount();
    },
    userIdentifier: async () => textOf((await ownAccount()).id),
    newOpportunityNoticesSince: async () => textOf((await ownAccount()).notificationsOn),
  };

  // GET /api/users/:id; signed out this target answers 401 ["You do not have permission to
  // perform this action."]. Asked afresh at every read, so it shows what is held now.
  const account = requests("user-account-request");
  let accountOpened = "";
  async function askAccount(member: string): Promise<Answer> {
    if (!accountOpened) unbound(`user-account-request.${member}`, "no account was opened");
    return account.send(member, "GET", `${baseURL}/api/users/${encodeURIComponent(accountOpened)}`);
  }
  const userAccountRequest: S.UserAccountRequestPage = {
    open: async (params) => {
      const named = params?.userId ?? "";
      accountOpened = personOf(named)?.id || named;
      if (!accountOpened) unbound("user-account-request.open", "no account was named");
      await askAccount("open");
    },
    newOpportunityNoticesSince: async () => answeredField(await askAccount("new_opportunity_notices_since"), "notificationsOn"),
    refusedWhenNotPermitted: async () =>
      refusedText(await askAccount("refused_when_not_permitted"), (status) => status === 401 || status === 403),
    refusalStatus: async () => refusalStatusOf(await askAccount("refusal_status")),
  };

  // ------------------------------------------------ pages, by request

  // A page is read by its address or its identifier (GET /api/content/about answers the
  // page with "id", "slug", "title", "body"; an unknown address answers 404 ["Content not
  // found"], a malformed one 400 ["Please enter a valid slug."]). A change or removal is sent
  // against the identifier the address finds. Signed out, listing, creating, changing and
  // removing all answer 401 {"permissions":["You do not have permission to perform this action."]}.
  const contentRequests = requests("content-request");
  let contentOpened = "";

  const slugFrom = (input: unknown): string =>
    field(input, "slug", "address", "page") || (typeof input === "string" ? input : "") || contentOpened;

  async function pageRecord(slug: string): Promise<Record<string, unknown> | null> {
    const found = await peek(`${baseURL}/api/content/${encodeURIComponent(slug)}`);
    return found.status === 200 ? record(found.json) : null;
  }

  function pageFields(input: unknown): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of ["title", "slug", "body", "fixed"]) {
      const value = given(input, [key]);
      if (value !== undefined) out[key] = value;
    }
    return out;
  }

  async function changePage(member: string, slug: string, changes: Record<string, unknown>): Promise<void> {
    if (!slug) unbound(`content-request.${member}`, "no page was opened or named");
    const current = await pageRecord(slug);
    await contentRequests.send(
      member,
      "PUT",
      `${baseURL}/api/content/${encodeURIComponent(String(current?.id ?? slug))}`,
      { title: current?.title, slug: current?.slug ?? slug, body: current?.body, ...changes },
    );
  }

  const contentRequest: S.ContentRequestPage = {
    open: async (params) => {
      contentOpened = params?.slug ?? "";
    },
    readPageListByRequest: async () => {
      await contentRequests.send("read_page_list_by_request", "GET", `${baseURL}/api/content`);
    },
    readPageByRequest: async (input) => {
      const slug = slugFrom(input);
      if (!slug) unbound("content-request.read_page_by_request", "no page was opened or named");
      await contentRequests.send("read_page_by_request", "GET", `${baseURL}/api/content/${encodeURIComponent(slug)}`);
    },
    createPageByRequest: async (input) => {
      const fields = pageFields(input);
      if (!Object.keys(fields).length) {
        unbound("content-request.create_page_by_request", "the input names no title, address or body to send");
      }
      await contentRequests.send("create_page_by_request", "POST", `${baseURL}/api/content`, fields);
    },
    changePageByRequest: (input) => {
      const { slug: _address, ...changes } = pageFields(input);
      return changePage("change_page_by_request", slugFrom(input), changes);
    },
    // The new address comes as "to" (or a like name), or as a "slug" other than the page
    // opened; the page renamed is the one opened, or the one named as "from".
    renamePageByRequest: async (input) => {
      const member = "rename_page_by_request";
      const named = field(input, "slug", "address");
      const to =
        field(input, "to", "newSlug", "renameTo", "newAddress") ||
        (named && named !== contentOpened ? named : "") ||
        (typeof input === "string" ? input : "");
      if (!to) unbound(`content-request.${member}`, `the input names no new address for "${contentOpened}"`);
      const from = field(input, "from", "oldSlug") || contentOpened;
      const { slug: _address, ...changes } = pageFields(input);
      await changePage(member, from, { ...changes, slug: to });
    },
    removePageByRequest: async (input) => {
      const slug = slugFrom(input);
      if (!slug) unbound("content-request.remove_page_by_request", "no page was opened or named");
      const current = await pageRecord(slug);
      await contentRequests.send(
        "remove_page_by_request",
        "DELETE",
        `${baseURL}/api/content/${encodeURIComponent(String(current?.id ?? slug))}`,
      );
    },
    requestAccepted: async () => acceptedText(contentRequests.last("request_accepted")),
    refusalStatus: async () => refusalStatusOf(contentRequests.last("refusal_status")),
    refusalShape: async () => {
      const got = contentRequests.last("refusal_shape");
      if (got.status < 400) return "";
      const body = parse(got.body);
      return body === null ? typeof got.body : JSON.stringify(shapeOf(body));
    },
  };

  // ------------------------------------------------ evaluations, by request

  // The scores a test hands over: a list of them, a list under "scores" (or a like name), a
  // map from question to score, one question's { score, notes }, or scores and notes as two
  // lists side by side; each as { order, score, notes }, order counting from 0.
  function scoresFrom(input: unknown): { order: number; score: unknown; notes: unknown }[] {
    const held = record(input);
    const keys = ["scores", "questions", "answers", "evaluations", "entries"];
    let listed: unknown[] | null = Array.isArray(input) ? input : null;
    for (const key of keys) if (!listed && Array.isArray(held[key])) listed = held[key] as unknown[];
    for (const key of keys) {
      if (listed || !held[key] || typeof held[key] !== "object") continue;
      listed = Object.entries(held[key] as Record<string, unknown>)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, value]) => value);
    }
    const notes = Array.isArray(held.notes) ? (held.notes as unknown[]) : null;
    if (!listed && (held.score !== undefined || held.notes !== undefined || held.note !== undefined)) listed = [held];
    if (!listed && notes) listed = notes.map(() => "");
    return (listed ?? []).map((each, i) => {
      if (each && typeof each === "object") {
        const one = each as Record<string, unknown>;
        const order = Number(one.order ?? (one.question !== undefined ? Number(one.question) - 1 : i));
        return { order, score: one.score ?? one.value, notes: one.notes ?? one.note ?? notes?.[i] ?? "" };
      }
      return { order: i, score: each, notes: notes?.[i] ?? "" };
    });
  }

  function throughAll(body: unknown): string[] {
    if (typeof body === "string") return [body];
    if (Array.isArray(body)) return body.flatMap(throughAll);
    if (body && typeof body === "object") return Object.values(body as Record<string, unknown>).flatMap(throughAll);
    return [];
  }

  // One panel member's sheet: the first save creates it (POST to the proponent's collection
  // with { proposal, status: "DRAFT", scores }), a later one changes it (PUT { tag: "edit",
  // value: { scores } }). Signed out, this target answers the read 401 ["You do not have
  // permission to perform this action."] and the create 401 {"permissions":[...]}.
  function evaluationRequest<T>(pageId: string, route: string): T {
    const asked = requests(pageId);
    let opened = "";
    let lastWasSubmission = false;
    const openedOr = (member: string): string => opened || unbound(`${pageId}.${member}`, "no evaluation has been opened");
    const stored = async (member: string): Promise<Record<string, unknown>> => {
      const found = await peek(openedOr(member));
      return found.status === 200 ? record(found.json) : {};
    };
    const storedScores = async (member: string): Promise<Record<string, unknown>[]> => {
      const scores = (await stored(member)).scores;
      return Array.isArray(scores) ? (scores as Record<string, unknown>[]) : [];
    };
    const collection = (): string => opened.replace(/\/[^/]+$/, "");
    const proposal = (): string => /\/proposal\/[^/]+\/([^/]+)\//.exec(opened)?.[1] ?? "";
    const built: Record<string, unknown> = {
      open: async (params?: Record<string, string>) => {
        opened = address(route, params);
        lastWasSubmission = false;
        await asked.send("open", "GET", opened);
      },
      saveDraftAsEntered: async (input?: unknown) => {
        const member = "save_draft_as_entered";
        const target = openedOr(member);
        const scores = scoresFrom(input);
        if (!scores.length) unbound(`${pageId}.${member}`, "the input carries no scores to send");
        lastWasSubmission = false;
        if ((await peek(target)).status === 200) await asked.send(member, "PUT", target, { tag: "edit", value: { scores } });
        else await asked.send(member, "POST", collection(), { proposal: proposal(), status: "DRAFT", scores });
      },
      submitThisEvaluationAlone: async () => {
        const member = "submit_this_evaluation_alone";
        lastWasSubmission = true;
        await asked.send(member, "PUT", openedOr(member), { tag: "submit", value: "" });
      },
      createEvaluationByRequest: async (input?: unknown) => {
        const member = "create_evaluation_by_request";
        openedOr(member);
        const scores = scoresFrom(input);
        if (!scores.length) unbound(`${pageId}.${member}`, "the input carries no scores to send");
        lastWasSubmission = false;
        await asked.send(member, "POST", collection(), { proposal: proposal(), status: "DRAFT", scores });
      },
      storedScores: async () =>
        (await storedScores("stored_scores")).map((each) => `${textOf(each.order)}: ${textOf(each.score)}`).join("\n"),
      storedNotes: async () =>
        (await storedScores("stored_notes")).map((each) => `${textOf(each.order)}: ${textOf(each.notes)}`).join("\n"),
      evaluationStatus: async () => textOf((await stored("evaluation_status")).status),
      refusedAsUnrecognised: async () =>
        refusedText(asked.last("refused_as_unrecognised"), () => true, /parseFailure|unrecogni[sz]ed|not a valid|unknown/i),
      refusedAtSubmission: async () =>
        lastWasSubmission ? refusedText(asked.last("refused_at_submission"), () => true) : "",
      evaluationCreated: async () => {
        const got = asked.last("evaluation_created");
        return got.status < 300 ? got.body : "";
      },
      creationRefusalMessage: async () => {
        const got = asked.last("creation_refusal_message");
        if (got.status < 400) return "";
        const texts = throughAll(parse(got.body));
        return texts.length ? texts.join("\n") : got.body;
      },
    };
    return built as unknown as T;
  }

  // The chair's consensus: changed with PUT { tag: "edit", value: { scores } }. Signed out,
  // this target answers the read 401 ["You do not have permission to perform this action."].
  function consensusRequest<T>(pageId: string, route: string): T {
    const asked = requests(pageId);
    let opened = "";
    const openedOr = (member: string): string => opened || unbound(`${pageId}.${member}`, "no consensus has been opened");
    const stored = async (member: string): Promise<Record<string, unknown>> => {
      const found = await peek(openedOr(member));
      return found.status === 200 ? record(found.json) : {};
    };
    const storedScores = async (member: string): Promise<Record<string, unknown>[]> => {
      const scores = (await stored(member)).scores;
      return Array.isArray(scores) ? (scores as Record<string, unknown>[]) : [];
    };
    const built: Record<string, unknown> = {
      open: async (params?: Record<string, string>) => {
        opened = address(route, params);
        await asked.send("open", "GET", opened);
      },
      changeConsensusByRequest: async (input?: unknown) => {
        const member = "change_consensus_by_request";
        const target = openedOr(member);
        const scores = scoresFrom(input);
        if (!scores.length) unbound(`${pageId}.${member}`, "the input carries no scores to send");
        await asked.send(member, "PUT", target, { tag: "edit", value: { scores } });
      },
      storedScores: async () =>
        (await storedScores("stored_scores")).map((each) => `${textOf(each.order)}: ${textOf(each.score)}`).join("\n"),
      storedNotes: async () =>
        (await storedScores("stored_notes")).map((each) => `${textOf(each.order)}: ${textOf(each.notes)}`).join("\n"),
      consensusStatus: async () => textOf((await stored("consensus_status")).status),
      requestAccepted: async () => acceptedText(asked.last("request_accepted")),
      refusedWhenNotPermitted: async () =>
        refusedText(asked.last("refused_when_not_permitted"), (status) => status === 401 || status === 403 || status === 404),
    };
    return built as unknown as T;
  }

  // ------------------------------------------------ an evaluation panel, by request

  // Sent as the opportunity's "editEvaluationPanel" change, every member as { user, chair,
  // evaluator, order }. Signed out, this target answers 401 {"permissions":[...]}.
  const panel = requests("evaluation-panel-request");
  let panelOpened = "";
  let panelSent = "";

  function namesIn(input: unknown): unknown[] {
    if (input === undefined || input === null) return [];
    if (typeof input === "string") return input.split(/\s*,\s*/).filter(Boolean);
    if (Array.isArray(input)) return input;
    const held = record(input);
    for (const key of ["members", "users", "evaluators", "panel"]) if (held[key] !== undefined) return namesIn(held[key]);
    return [input];
  }

  function panelNow(json: unknown): { user: string; chair: boolean; evaluator: boolean; order: number }[] {
    const members = record(json).evaluationPanel;
    return (Array.isArray(members) ? members : []).map((each, i) => {
      const member = record(each);
      const user = member.user;
      return {
        user: typeof user === "string" ? user : textOf(record(user).id),
        chair: member.chair === true,
        evaluator: member.evaluator === true,
        order: Number(member.order ?? i),
      };
    });
  }

  const evaluationPanelRequest: S.EvaluationPanelRequestPage = {
    open: async (params) => {
      panelOpened = address("/api/opportunities/:program/:opportunityId", params as unknown as Record<string, string>);
      panelSent = "";
      await panel.send("open", "GET", panelOpened);
    },
    async submitPanelWithMemberHoldingNoRole(input) {
      const member = "submit_panel_with_member_holding_no_role";
      const where = `evaluation-panel-request.${member}`;
      if (!panelOpened) unbound(where, "no opportunity has been opened");
      const who = given(input, ["member", "user", "userId", "person", "email"]) ?? input;
      const user = personOf(who)?.id;
      if (!user) unbound(where, `${JSON.stringify(who)} is not an account the seed knows`);
      const members = panelNow((await peek(panelOpened)).json).filter((each) => each.user !== user);
      members.push({ user, chair: false, evaluator: false, order: members.length });
      panelSent = "member-without-role";
      await panel.send(member, "PUT", panelOpened, { tag: "editEvaluationPanel", value: members });
    },
    async submitPanelWithNoChair(input) {
      const member = "submit_panel_with_no_chair";
      const where = `evaluation-panel-request.${member}`;
      if (!panelOpened) unbound(where, "no opportunity has been opened");
      const named = namesIn(input);
      if (!named.length) unbound(where, "the input names no members");
      const members = named.map((each, order) => {
        const user = personOf(each)?.id;
        if (!user) unbound(where, `${JSON.stringify(each)} is not an account the seed knows`);
        return { user, chair: false, evaluator: true, order };
      });
      panelSent = "no-chair";
      await panel.send(member, "PUT", panelOpened, { tag: "editEvaluationPanel", value: members });
    },
    memberWithoutRoleError: async () =>
      panelSent === "member-without-role" ? refusedText(panel.last("member_without_role_error"), () => true) : "",
    missingChairError: async () =>
      panelSent === "no-chair" ? refusedText(panel.last("missing_chair_error"), () => true) : "",
    // One member per line as the service now holds the panel.
    panelAsStored: async () => {
      if (!panelOpened) unbound("evaluation-panel-request.panel_as_stored", "no opportunity has been opened");
      const members = record((await peek(panelOpened)).json).evaluationPanel;
      return (Array.isArray(members) ? members : [])
        .map((each) => {
          const member = record(each);
          const user = record(member.user);
          return `${textOf(user.name) || textOf(user.id)} <${textOf(user.email)}> chair: ${member.chair === true} evaluator: ${member.evaluator === true}`;
        })
        .join("\n");
    },
  };

  // ------------------------------------------------ a stored file attached by identifier

  // The record as the service answers it, each nested record it names given as that
  // record's identifier, sent back as its "edit" change with one more attachment. Signed
  // out, this target answers the update 401 {"permissions":[...]}.
  const attach = requests("file-attach-by-identifier");
  let recordOpened = "";

  function fileIdFor(value: string): string {
    const byHandle = seededId(value, "stored_files");
    const inAddress = /\/api\/files\/([0-9a-f-]{36})/i.exec(byHandle);
    return inAddress ? inAddress[1] : byHandle;
  }

  const fileAttachByIdentifier: S.FileAttachByIdentifierPage = {
    open: async (params) => {
      recordOpened = address("/api/:recordKind/:program/:recordId", params as unknown as Record<string, string>);
      await attach.send("open", "GET", recordOpened);
    },
    async attachStoredFile(input) {
      const member = "attach_stored_file";
      const where = `file-attach-by-identifier.${member}`;
      if (!recordOpened) unbound(where, "no opportunity or proposal has been opened");
      const named = field(input, "fileId", "file", "id", "identifier", "address") || textOf(input);
      if (!named) unbound(where, "the input names no stored file");
      const current = await peek(recordOpened);
      const held = current.status === 200 ? record(current.json) : null;
      let value: Record<string, unknown> = { attachments: [fileIdFor(named)] };
      if (held) {
        value = { ...held };
        for (const [key, inner] of Object.entries(value)) {
          if (inner && typeof inner === "object" && !Array.isArray(inner) && "id" in inner) value[key] = record(inner).id;
        }
        const attached = Array.isArray(held.attachments) ? held.attachments : [];
        value.attachments = [...attached.map((each) => (each && typeof each === "object" ? record(each).id : each)), fileIdFor(named)];
      }
      await attach.send(member, "PUT", recordOpened, { tag: "edit", value });
    },
    attachmentAccepted: async () => acceptedText(attach.last("attachment_accepted")),
    attachmentRefused: async () => refusedText(attach.last("attachment_refused"), () => true),
    attachedFileIdentifiers: async () => {
      if (!recordOpened) unbound("file-attach-by-identifier.attached_file_identifiers", "no record has been opened");
      const held = record((await peek(recordOpened)).json).attachments;
      return (Array.isArray(held) ? held : [])
        .map((each) => (each && typeof each === "object" ? textOf(record(each).id) : textOf(each)))
        .join("\n");
    },
  };

  // ------------------------------------------------ proposals, by request

  function opportunityGiven(where: string, input: unknown): string {
    const id = seededId(given(input, ["opportunity", "opportunityId", "opportunityIdentifier"]), "opportunities");
    return id || unbound(where, `the input names no opportunity (${JSON.stringify(input)})`);
  }

  function organizationGiven(input: unknown): string {
    const names = ["organization", "organizationId", "organizationIdentifier", "org"];
    return seededId(given(input, names, ["proponent"]) ?? given(input, ["proponent"]), "organizations", "unassigned_identifiers");
  }

  function proposalReaders(requested: ReturnType<typeof requests>) {
    return {
      requestAccepted: async () => acceptedText(requested.last("request_accepted")),
      proposalIdentifier: async () => answeredField(requested.last("proposal_identifier"), "id"),
      proposalStatus: async () => answeredField(requested.last("proposal_status"), "status"),
      refusalByField: async () => byFieldOf(requested.last("refusal_by_field")),
      refusalMessages: async () => messagesOf(requested.last("refusal_messages")),
      refusalStatus: async () => refusalStatusOf(requested.last("refusal_status")),
    };
  }

  // POST /api/proposals/code-with-us { opportunity, proposalText, additionalComment,
  // proponent: { tag, value }, attachments, status: "SUBMITTED" }. Signed out, this target
  // answers 401 {"permissions":["You do not have permission to perform this action."]}.
  const cwuProposal = requests("proposal-cwu-request");

  async function sendCwuProposal(member: string, input: unknown, proponent: unknown): Promise<void> {
    await cwuProposal.send(member, "POST", `${baseURL}/api/proposals/code-with-us`, {
      opportunity: opportunityGiven(`proposal-cwu-request.${member}`, input),
      proposalText: givenText(input, ["proposalText", "proposal", "text"]),
      additionalComment: givenText(input, ["additionalComments", "additionalComment", "comments", "comment"]),
      proponent,
      attachments: [],
      status: "SUBMITTED",
    });
  }

  const proposalCwuRequest: S.ProposalCwuRequestPage = {
    open: async () => undefined,
    async submitWithOrganizationProponent(input) {
      const member = "submit_with_organization_proponent";
      const organization = organizationGiven(input);
      if (!organization) unbound(`proposal-cwu-request.${member}`, `the input names no organization (${JSON.stringify(input)})`);
      await sendCwuProposal(member, input, { tag: "organization", value: organization });
    },
    async submitWithIndividualProponent(input) {
      const within = ["individual", "proponent", "details", "contact", "address"];
      const text = (...names: string[]): string => givenText(input, names, within);
      await sendCwuProposal("submit_with_individual_proponent", input, {
        tag: "individual",
        value: {
          legalName: text("legalName", "name"),
          email: text("email", "emailAddress"),
          phone: text("phone", "phoneNumber"),
          street1: text("streetAddress", "street1", "street", "address", "addressLine1", "streetAddress1"),
          street2: text("secondAddressLine", "street2", "addressLine2", "streetAddress2"),
          city: text("city"),
          region: text("province", "region", "state"),
          mailCode: text("postalCode", "mailCode", "zip", "postal"),
          country: text("country"),
        },
      });
    },
    ...proposalReaders(cwuProposal),
  };

  // POST /api/proposals/:program, a submission as its form sends one. Team With Us:
  // { opportunity, organization, team: [{ member, resource, hourlyRate }],
  // resourceQuestionResponses: [{ order, response }], attachments, status }. Sprint With Us:
  // { opportunity, organization, inceptionPhase?, prototypePhase?, implementationPhase?:
  // { members: [{ member, scrumMaster }], proposedCost }, teamQuestionResponses, references,
  // attachments, status }. Signed out, this target answers 401 {"permissions":[...]}.
  const teamProposal = requests("proposal-team-request");
  let teamProgram = "";

  const listGiven = (input: unknown, names: string[]): unknown[] => {
    const value = given(input, names);
    return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
  };

  // Answers by order, exactly those the input gives. A question it leaves unanswered is
  // left unanswered, so the service accepts or refuses the proposal for what the test gave.
  function answersFor(input: unknown): { order: number; response: string }[] {
    const answers = listGiven(input, [
      "answers",
      "responses",
      "resourceQuestionResponses",
      "teamQuestionResponses",
      "resourceQuestions",
      "teamQuestions",
    ]).map((each, i) =>
      each && typeof each === "object"
        ? { order: Number(record(each).order ?? i), response: givenText(each, ["response", "answer", "text"]) }
        : { order: i, response: textOf(each) },
    );
    return answers.sort((a, b) => a.order - b.order);
  }

  const memberIdOf = (value: unknown): string => personOf(value)?.id || textOf(value);
  const saysYes = (value: unknown): boolean => value === true || /^(yes|y|true|1)$/i.test(textOf(value).trim());

  // Only what the input carries is sent: a rate, a cost, a scrum master, a reference or an
  // answer it leaves out is left out of the request too, so that the service accepts or
  // refuses the proposal for what the test gave and for nothing this adapter supplied.
  async function teamProposalBody(where: string, program: string, input: unknown): Promise<Record<string, unknown>> {
    const opportunity = opportunityGiven(where, input);
    const organization = organizationGiven(input);
    const body: Record<string, unknown> = { opportunity, attachments: [], status: "SUBMITTED" };
    if (organization) body.organization = organization;
    if (program === "team-with-us") {
      // A resource the input names by its service area ("Full Stack Developer") is sent as
      // that resource's identifier, read from the opportunity; any other value as given.
      const read = await peek(`${baseURL}/api/opportunities/${program}/${opportunity}`);
      const resources = (Array.isArray(record(read.json).resources) ? (record(read.json).resources as unknown[]) : []).map(record);
      const resourceFor = (value: unknown): string => {
        const wanted = squash(textOf(value));
        const found =
          resources.find((each) => squash(textOf(each.serviceArea)) === wanted) ??
          resources.find((each) => textOf(each.id) === textOf(value));
        return found ? textOf(found.id) : textOf(value);
      };
      body.team = listGiven(input, ["team", "members", "teamMembers"]).map((each) => {
        const one = each && typeof each === "object" && !Array.isArray(each) ? each : { member: each };
        const member: Record<string, unknown> = { member: memberIdOf(given(one, ["member", "user", "person"]) ?? one) };
        const resource = given(one, ["resource", "serviceArea", "area"]);
        if (resource !== undefined && resource !== null && resource !== "") member.resource = resourceFor(resource);
        const rate = given(one, ["hourlyRate", "rate"]);
        if (rate !== undefined && rate !== null && rate !== "") member.hourlyRate = Number(rate);
        return member;
      });
      body.resourceQuestionResponses = answersFor(input);
      return body;
    }
    // Sprint With Us: exactly the phases the input names.
    const PHASES: [string, RegExp][] = [
      ["inceptionPhase", /inception/i],
      ["prototypePhase", /prototype|proof/i],
      ["implementationPhase", /implementation/i],
    ];
    const grouped = given(input, ["phases", "team"]);
    const source: [string, unknown][] = Array.isArray(grouped)
      ? grouped.map((each, i): [string, unknown] => [givenText(each, ["phase", "name"]) || String(i), each])
      : Object.entries(grouped && typeof grouped === "object" ? (grouped as Record<string, unknown>) : record(input));
    for (const [key, value] of source) {
      const phase = PHASES.find(([, pattern]) => pattern.test(key));
      if (!phase) continue;
      const details = Array.isArray(value) ? { members: value } : record(value);
      // A member is scrum master only where the input says so.
      const members = listGiven(details, ["members", "team", "teamMembers"]).map((each) => {
        const one = each && typeof each === "object" && !Array.isArray(each) ? each : { member: each };
        const member: Record<string, unknown> = { member: memberIdOf(given(one, ["member", "user", "person"]) ?? one) };
        const scrum = given(one, ["scrumMaster", "isScrumMaster"]);
        if (scrum !== undefined && scrum !== null && scrum !== "") member.scrumMaster = saysYes(scrum);
        return member;
      });
      const phaseBody: Record<string, unknown> = { members };
      const cost = given(details, ["proposedCost", "cost", "price"]);
      if (cost !== undefined && cost !== null && cost !== "") phaseBody.proposedCost = Number(cost);
      body[phase[0]] = phaseBody;
    }
    body.teamQuestionResponses = answersFor(input);
    body.references = listGiven(input, ["references"]).map((each, order) => ({
      name: givenText(each, ["name"]),
      company: givenText(each, ["company", "organization"]),
      phone: givenText(each, ["phone", "phoneNumber"]),
      email: givenText(each, ["email", "emailAddress"]),
      order,
    }));
    return body;
  }

  const proposalTeamRequest: S.ProposalTeamRequestPage = {
    open: async (params) => {
      teamProgram = String(params?.program ?? "");
    },
    async submitTeamProposal(input) {
      const member = "submit_team_proposal";
      const where = `proposal-team-request.${member}`;
      const program = givenText(input, ["program"]) || teamProgram;
      if (program !== "sprint-with-us" && program !== "team-with-us") {
        unbound(where, `no program was opened or given ("sprint-with-us" or "team-with-us"; given: "${program}")`);
      }
      await teamProposal.send(member, "POST", `${baseURL}/api/proposals/${program}`, await teamProposalBody(where, program, input));
    },
    ...proposalReaders(teamProposal),
  };

  // PUT /api/proposals/:program/:id with the stage's own tag and the score as its value.
  // Signed out, this target answers 401 {"permissions":[...]}.
  const stageScore = requests("proposal-evaluation-request");
  let scoreOpened = { program: "", proposal: "" };

  async function sendStageScore(member: string, program: string, tag: string, input: unknown): Promise<void> {
    const where = `proposal-evaluation-request.${member}`;
    const opened = givenText(input, ["program"]) || scoreOpened.program || program;
    if (opened !== program) unbound(where, `this score belongs to ${program}, but the request was opened for "${opened}"`);
    const proposal = seededId(given(input, ["proposal", "proposalId"]), "proposals") || scoreOpened.proposal;
    if (!proposal) unbound(where, "no proposal was opened or named to score");
    const value = typeof input === "number" || typeof input === "string" ? input : given(input, ["score", "value", "points"]);
    const score = Number(value);
    if (value === undefined || value === null || value === "" || !Number.isFinite(score)) {
      unbound(where, `the input names no score to send (${JSON.stringify(input)})`);
    }
    await stageScore.send(member, "PUT", `${baseURL}/api/proposals/${program}/${encodeURIComponent(proposal)}`, {
      tag,
      value: score,
    });
  }

  const proposalEvaluationRequest: S.ProposalEvaluationRequestPage = {
    open: async (params) => {
      scoreOpened = { program: String(params?.program ?? ""), proposal: seededId(params?.proposalId, "proposals") };
    },
    scoreTeamScenarioByRequest: (input) =>
      sendStageScore("score_team_scenario_by_request", "sprint-with-us", "scoreTeamScenario", input),
    scoreCodeChallengeByRequest: (input) =>
      sendStageScore("score_code_challenge_by_request", "sprint-with-us", "scoreCodeChallenge", input),
    scoreChallengeByRequest: (input) => sendStageScore("score_challenge_by_request", "team-with-us", "scoreChallenge", input),
    requestAccepted: async () => acceptedText(stageScore.last("request_accepted")),
    proposalStatus: async () => answeredField(stageScore.last("proposal_status"), "status"),
    refusalMessages: async () => messagesOf(stageScore.last("refusal_messages")),
    refusalStatus: async () => refusalStatusOf(stageScore.last("refusal_status")),
  };

  // ------------------------------------------------ stored files, by request

  // POST /api/files takes a multipart form { name, metadata?, file }, metadata being who
  // may read the file as a list of { tag, value } (tag any, user or userType). GET
  // /api/files/:id answers the file's description, and with ?type=blob its bytes. Read on
  // this target signed out: the description and the bytes of the seeded private file, and
  // of an identifier nothing is stored under, all answer 401 ["You do not have permission
  // to perform this action."]; a form with no file part answers 500 {"message":"No file
  // uploaded"}. Each request carries the browser's session, so whoever is signed in.
  type FileAnswer = { status: number; headers: Record<string, string>; body: string };
  let fileAnswer: FileAnswer | null = null;
  const lastFile = (where: string): FileAnswer =>
    fileAnswer ?? unbound(where, "no request has been sent to the file address yet");

  const MIME: Record<string, string> = {
    ".txt": "text/plain",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".csv": "text/csv",
    ".json": "application/json",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".zip": "application/zip",
  };

  // The file a test names, as bytes in memory under that name. The harness makes the bytes
  // (so every adapter offers the same content for the same name and type), but it makes
  // them under a short stand-in name with the same ending: the name itself is what some
  // criteria turn on, and a name longer than the file system allows (256 characters, say)
  // has to reach the service as it is rather than fail on this machine's disk first.
  function fileGiven(name: string, content?: string | Uint8Array, bytes?: number): { name: string; mimeType: string; buffer: Buffer } {
    const ending = extname(name).toLowerCase();
    const standIn = /^\.[a-z0-9]{1,10}$/.test(ending) ? `offered${ending}` : "offered";
    const path = uploadFile({
      name: standIn,
      ...(typeof bytes === "number" && Number.isFinite(bytes) ? { bytes } : {}),
      ...(content !== undefined ? { content } : {}),
    });
    return { name, mimeType: MIME[ending] || "application/octet-stream", buffer: readFileSync(path) };
  }

  // How big the test asked the file to be, in bytes, however it said so: a number of bytes
  // under any of the usual names, a size written with its unit ("11 MB", "10.5MB", "512 KB"),
  // or a number under a name that carries the unit (sizeMB, megabytes, sizeKB). A size the
  // test gave and this cannot read is left out rather than guessed, and the content (or the
  // harness's default) decides the file. Units are binary: the service's 10 MB is 10 × 1024².
  //
  // Walked as the administrator: POST /api/files stores a file of 10,485,760 bytes (201) and
  // refuses one of 10,485,761 with 413 "The file is larger than 10 MB. Upload a file of 10 MB
  // or smaller."; a size this did not read left the harness's few-byte default to be sent, which
  // was stored, and refused_for_size then read '' (R-8.17). So a size is also read from any key
  // that names one (fileSize, sizeInMegabytes, length), with its unit spelled out ("11
  // megabytes") or relative to the limit ("over 10 MB", "10 MB + 1 byte"), and an input that
  // only says the file is over the limit (oversized, tooLarge, exceedsLimit) is 11 MB.
  function bytesGiven(input: unknown): number | undefined {
    const UNIT: Record<string, number> = {
      b: 1, byte: 1, bytes: 1,
      k: 1024, kb: 1024, kib: 1024, kilobyte: 1024, kilobytes: 1024,
      m: 1024 ** 2, mb: 1024 ** 2, mib: 1024 ** 2, megabyte: 1024 ** 2, megabytes: 1024 ** 2,
      g: 1024 ** 3, gb: 1024 ** 3, gib: 1024 ** 3, gigabyte: 1024 ** 3, gigabytes: 1024 ** 3,
    };
    const amount = (said: string, scale: number): number | undefined => {
      const one = /^\s*(\d+(?:\.\d+)?)\s*([a-z]*)\s*$/i.exec(said);
      if (!one) return undefined;
      const unit = one[2].toLowerCase();
      const factor = unit ? UNIT[unit] : scale;
      return factor === undefined ? undefined : Math.round(Number(one[1]) * factor);
    };
    const read = (value: unknown, scale: number): number | undefined => {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.round(value * scale);
      if (typeof value !== "string") return undefined;
      const text = value.replace(/[,_]/g, "").trim();
      const whole = amount(text, scale);
      if (whole !== undefined) return whole;
      // "10 MB + 1 byte", "10MB+1"
      const sum = /^(.+?)\s*\+\s*(.+)$/.exec(text);
      if (sum) {
        const [a, b] = [amount(sum[1], scale), amount(sum[2], 1)];
        if (a !== undefined && b !== undefined) return a + b;
      }
      // "over 10 MB", "more than 10 MB", "> 10 MB", "larger than 10 MB"
      const over = /^(?:over|more than|larger than|bigger than|greater than|above|exceeding|>)\s*(.+)$/i.exec(text);
      if (over) {
        const limit = amount(over[1], scale);
        if (limit !== undefined) return limit + 1;
      }
      return undefined;
    };
    const scaled: [string[], number][] = [
      [["bytes", "size", "sizeBytes", "size_bytes", "sizeInBytes", "byteLength", "fileSize", "fileSizeBytes", "length", "byteSize"], 1],
      [["kilobytes", "sizeKB", "size_kb", "kb", "sizeKiB", "sizeInKB", "sizeInKilobytes", "fileSizeKB"], 1024],
      [["megabytes", "sizeMB", "size_mb", "mb", "sizeMiB", "sizeInMB", "sizeInMegabytes", "fileSizeMB"], 1024 ** 2],
    ];
    for (const [names, scale] of scaled) {
      const value = given(input, names);
      if (value === undefined || value === null) continue;
      const bytes = read(value, scale);
      if (bytes !== undefined) return bytes;
    }
    // Any other key that names a size, read with the unit its name or its value carries.
    for (const [key, value] of Object.entries(record(input))) {
      const name = squash(key);
      if (!/size|bytes|megabyte|kilobyte/.test(name)) continue;
      const scale = /mb|mib|megabyte/.test(name) ? 1024 ** 2 : /kb|kib|kilobyte/.test(name) ? 1024 : 1;
      const bytes = read(value, scale);
      if (bytes !== undefined) return bytes;
    }
    const over = given(input, ["oversized", "tooLarge", "tooBig", "overLimit", "overSizeLimit", "exceedsLimit", "exceedsSizeLimit", "largerThanLimit"]);
    if (over === true) return 11 * 1024 ** 2;
    return undefined;
  }

  type Upload = { name: string; metadata?: string; file?: { fileName: string; mimeType: string; buffer: Buffer } };

  // Who may read a stored file, exactly as the input states it: a bare word is a tag, a
  // string otherwise is sent as it is written (well-formed or not), and a record or list is
  // sent as a list. Nothing stated is nothing sent.
  function readAccessGiven(input: unknown): string | undefined {
    const stated = given(input, ["readAccess", "read_access", "metadata", "access", "permissions"]);
    if (stated === undefined || stated === null) return undefined;
    if (typeof stated === "string") return /^[A-Za-z]+$/.test(stated) ? JSON.stringify([{ tag: stated }]) : stated;
    return JSON.stringify(Array.isArray(stated) ? stated : [stated]);
  }

  // The file the test names, made by the harness and sent under that name with whatever content or
  // size the test gave; the stored name is the one given for it, or the file's own.
  function uploadGiven(where: string, input: unknown, metadata: string | undefined, withFile = true): Upload {
    const fileName = field(input, "file", "fileName", "file_name", "name") || (typeof input === "string" ? input : "");
    if (!fileName) unbound(where, `the input names no file to upload (${JSON.stringify(input)})`);
    const name = field(input, "name", "storedName") || fileName;
    if (!withFile) return { name, metadata };
    const content = given(input, ["content", "contents", "body", "text"]);
    const made = fileGiven(
      fileName,
      typeof content === "string" || content instanceof Uint8Array ? content : undefined,
      bytesGiven(input),
    );
    const mimeType = field(input, "mimeType", "contentType", "content_type") || made.mimeType;
    return { name, metadata, file: { fileName, mimeType, buffer: made.buffer } };
  }

  async function sendUpload(where: string, form: Upload): Promise<void> {
    const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = { name: form.name };
    if (form.metadata !== undefined) multipart.metadata = form.metadata;
    if (form.file) multipart.file = { name: form.file.fileName, mimeType: form.file.mimeType, buffer: form.file.buffer };
    const response = await page.request
      .post(`${baseURL}/api/files`, { multipart })
      .catch((error: unknown) => unbound(where, `the upload could not be sent (${String(error)})`));
    fileAnswer = { status: response.status(), headers: response.headers(), body: await response.text().catch(() => "") };
  }

  // Neither the browser nor Playwright's request client sends a body without stating its
  // length, so this one upload leaves from the test process itself: the same form, with
  // the browser's cookies, written in chunks with no Content-Length at all.
  async function sendUploadWithoutLength(where: string, form: Upload): Promise<void> {
    const target = new URL(`${baseURL}/api/files`);
    const cookie = (await page.context().cookies(target.origin)).map((c) => `${c.name}=${c.value}`).join("; ");
    const boundary = `----withoutLength${Date.now().toString(16)}`;
    const part = (disposition: string, type?: string): string =>
      `--${boundary}\r\nContent-Disposition: form-data; ${disposition}\r\n${type ? `Content-Type: ${type}\r\n` : ""}\r\n`;
    const pieces: (string | Buffer)[] = [part(`name="name"`), form.name, "\r\n"];
    if (form.metadata !== undefined) pieces.push(part(`name="metadata"`), form.metadata, "\r\n");
    if (form.file) {
      pieces.push(
        part(`name="file"; filename="${form.file.fileName.replace(/"/g, "%22")}"`, form.file.mimeType),
        form.file.buffer,
        "\r\n",
      );
    }
    pieces.push(`--${boundary}--\r\n`);
    const options: RequestOptions = {
      method: "POST",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "transfer-encoding": "chunked",
        ...(cookie ? { cookie } : {}),
      },
    };
    fileAnswer = await new Promise<FileAnswer>((resolve, reject) => {
      const onResponse = (response: IncomingMessage): void => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("error", reject);
        response.on("end", () => {
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.headers)) {
            if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(", ") : value;
          }
          resolve({ status: response.statusCode ?? 0, headers, body: Buffer.concat(chunks).toString("utf8") });
        });
      };
      const sent = target.protocol === "https:" ? httpsRequest(target, options, onResponse) : httpRequest(target, options, onResponse);
      sent.on("error", reject);
      for (const piece of pieces) sent.write(piece);
      sent.end();
    }).catch((error: unknown) => unbound(where, `the upload could not be sent (${String(error)})`));
  }

  async function askFile(where: string, target: string): Promise<void> {
    const response = await page.request
      .get(target)
      .catch((error: unknown) => unbound(where, `GET ${target} could not be made (${String(error)})`));
    fileAnswer = { status: response.status(), headers: response.headers(), body: await response.text().catch(() => "") };
  }

  // A refusal handed over whole, its status and its body; nothing when the answer was not one.
  const fileRefusal = (where: string, statuses: (status: number) => boolean): string => {
    const got = lastFile(where);
    return got.status >= 400 && statuses(got.status) ? `${got.status} ${got.body}` : "";
  };
  const fileField = (where: string, key: string): string => {
    const got = lastFile(where);
    if (got.status >= 300) return "";
    const value = record(parse(got.body))[key];
    return value === undefined || value === null ? "" : String(value);
  };

  const fileUpload: S.FileUploadPage = {
    open: async () => {
      fileAnswer = null;
    },
    uploadFile: (input) => {
      const where = "file-upload.upload_file";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input)));
    },
    uploadFileStatingItsReadAccess: (input) => {
      const where = "file-upload.upload_file_stating_its_read_access";
      const stated = readAccessGiven(input);
      if (stated === undefined) unbound(where, `the input states no read access (${JSON.stringify(input)})`);
      return sendUpload(where, uploadGiven(where, input, stated));
    },
    uploadFileWithoutDeclaringItsSize: (input) => {
      const where = "file-upload.upload_file_without_declaring_its_size";
      return sendUploadWithoutLength(where, uploadGiven(where, input, readAccessGiven(input)));
    },
    uploadFileWithNoFilePart: (input) => {
      const where = "file-upload.upload_file_with_no_file_part";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input), false));
    },
    // What makes these two what they are named for is the read access itself: the one the
    // input states is sent, and where it states none, a tag the service does not define, or
    // a statement that is not a list at all.
    uploadFileWithUnrecognisedReadAccess: (input) => {
      const where = "file-upload.upload_file_with_unrecognised_read_access";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input) ?? JSON.stringify([{ tag: "nobodyInParticular" }])));
    },
    uploadFileWithMalformedReadAccess: (input) => {
      const where = "file-upload.upload_file_with_malformed_read_access";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input) ?? "{not a read access"));
    },
    // A refused upload stored nothing and has no identifier: that reads as nothing.
    storedFileIdentifier: async () => fileField("file-upload.stored_file_identifier", "id"),
    refusedForSize: async () => fileRefusal("file-upload.refused_for_size", (status) => status < 500),
    sizeLimitNamedInRefusal: async () => fileRefusal("file-upload.size_limit_named_in_refusal", () => true),
    refusedForFileNameLength: async () => fileRefusal("file-upload.refused_for_file_name_length", (status) => status < 500),
    refusedForReadAccess: async () => fileRefusal("file-upload.refused_for_read_access", (status) => status < 500),
    refusedWhenSignedOut: async () => fileRefusal("file-upload.refused_when_signed_out", (status) => status === 401),
    serviceFault: async () => {
      const got = lastFile("file-upload.service_fault");
      if (got.status < 500) return "";
      const message = record(parse(got.body)).message;
      return `${got.status} ${typeof message === "string" ? message : got.body}`;
    },
  };

  const fileDescription: S.FileDescriptionPage = {
    open: async (params) => {
      const where = "file-description.open";
      const id = fileIdFor(String(params?.fileId ?? ""));
      if (!id) unbound(where, "no file was named");
      await askFile(where, `${baseURL}/api/files/${encodeURIComponent(id)}`);
    },
    fileIdentifier: async () => fileField("file-description.file_identifier", "id"),
    fileName: async () => fileField("file-description.file_name", "name"),
    storedDate: async () => fileField("file-description.stored_date", "createdAt"),
    storedContentIdentifier: async () => fileField("file-description.stored_content_identifier", "fileBlob"),
    refusedWhenNotPermitted: async () =>
      fileRefusal("file-description.refused_when_not_permitted", (status) => status === 401 || status === 403),
    // Short of an administrator, an unknown file is refused as not permitted (401), exactly
    // as a known one would be; only an administrator is told it is not there.
    refusedForUnknownFile: async () =>
      fileRefusal("file-description.refused_for_unknown_file", (status) => status === 401 || status === 403 || status === 404),
    notFoundForAdministrator: async () => fileRefusal("file-description.not_found_for_administrator", (status) => status === 404),
  };

  let downloadOpened = "";
  const header = (where: string, name: string): string => lastFile(where).headers[name] ?? "";

  const fileDownload: S.FileDownloadPage = {
    open: async (params) => {
      const where = "file-download.open";
      downloadOpened = fileIdFor(String(params?.fileId ?? ""));
      if (!downloadOpened) unbound(where, "no file was named");
      await askFile(where, `${baseURL}/api/files/${encodeURIComponent(downloadOpened)}?type=blob`);
    },
    downloadFile: async (input) => {
      const where = "file-download.download_file";
      const id = fileIdFor(field(input, "fileId", "id", "file") || (typeof input === "string" ? input : "")) || downloadOpened;
      if (!id) unbound(where, "no file was opened or named to download");
      await askFile(where, `${baseURL}/api/files/${encodeURIComponent(id)}?type=blob`);
    },
    fileContents: async () => {
      const got = lastFile("file-download.file_contents");
      return got.status < 300 ? got.body : "";
    },
    fileNameOnSave: async () => {
      const where = "file-download.file_name_on_save";
      if (lastFile(where).status >= 300) return "";
      const found = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header(where, "content-disposition"));
      return found ? decodeURIComponent(found[1]) : "";
    },
    offeredAsDownloadNotDisplayed: async () => {
      const where = "file-download.offered_as_download_not_displayed";
      if (lastFile(where).status >= 300) return "";
      return /^\s*(attachment|inline)/i.exec(header(where, "content-disposition"))?.[1].toLowerCase() ?? "";
    },
    contentTypeFromName: async () => {
      const where = "file-download.content_type_from_name";
      return lastFile(where).status < 300 ? header(where, "content-type") : "";
    },
    readableWhenSignedOutIfPublic: async () => {
      const got = lastFile("file-download.readable_when_signed_out_if_public");
      return got.status === 200 ? got.body : "";
    },
    refusedWhenNotPermitted: async () =>
      fileRefusal("file-download.refused_when_not_permitted", (status) => status === 401 || status === 403),
    refusedForUnknownFile: async () =>
      fileRefusal("file-download.refused_for_unknown_file", (status) => status === 401 || status === 403 || status === 404),
    notFoundForAdministrator: async () => fileRefusal("file-download.not_found_for_administrator", (status) => status === 404),
  };

  let attachmentsOf = { program: "", opportunityId: "" };

  // ------------------------------------------------ the public pages that were not here before

  // The opportunity list, read signed out: a "Filter Opportunities" chooser of program
  // (Code With Us, Sprint With Us, Team With Us), a "Remote OK" box, a "Search by Title or
  // Location" box, and the opportunities as cards under "Open Opportunities <count>" and a
  // folded "Closed Opportunities". Each card is a link: title, program, status badge,
  // "Closes <date> at <time>" (or "Closed …"), summary, value, location.
  const OPPORTUNITY_GROUPS = [/^unpublished opportunities\b/i, /^open opportunities\b/i, /^closed opportunities\b/i];

  async function opportunityGroup(header: RegExp): Promise<string> {
    const rows = async (): Promise<string[] | null> => {
      const lines = await textLines();
      const start = lines.findIndex((line) => header.test(line));
      if (start < 0) return null;
      const body: string[] = [];
      for (let i = start + 1; i < lines.length; i++) {
        if (OPPORTUNITY_GROUPS.some((group) => group.test(lines[i]))) break;
        body.push(lines[i]);
      }
      if (body.length && /^\d+$/.test(body[0])) body.shift();
      return body;
    };
    await ready();
    let body = await rows();
    // This reader is shown no such group at all: nothing is in it for them.
    if (body === null) return "";
    if (!body.length) {
      // A folded group shows only its header, and opens when that is chosen.
      const shown = seen(page.getByText(header));
      const count = await shown.count();
      if (count) {
        await shown.nth(count - 1).click();
        await settle();
        body = (await rows()) ?? [];
      }
    }
    return body.join("\n");
  }

  const PROGRAM_WORDS: [RegExp, string][] = [
    [/code.?with.?us|^cwu$/i, "Code With Us"],
    [/sprint.?with.?us|^swu$/i, "Sprint With Us"],
    [/team.?with.?us|^twu$/i, "Team With Us"],
  ];

  async function pickFrom(where: string, box: Locator, value: string): Promise<void> {
    await box.click();
    const option = seen(page.getByRole("option", { name: value, exact: true })).first();
    await option.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await option.count())) {
      const offered = await seen(page.getByRole("option")).allInnerTexts().catch(() => []);
      await page.keyboard.press("Escape").catch(() => undefined);
      unbound(where, `the chooser on ${page.url()} offers no "${value}" (it offers: ${offered.join(", ") || "nothing"})`);
    }
    await option.click();
    await settle();
  }

  const opportunityList: S.OpportunityListPage = {
    open: () => go("/opportunities"),
    filterByProgram: async (input) => {
      const where = "opportunity-list.filter_by_program";
      const named = field(input, "program", "value", "name") || textOf(input);
      if (!named) unbound(where, `the input names no program (${JSON.stringify(input)})`);
      const value = PROGRAM_WORDS.find(([pattern]) => pattern.test(named))?.[1] ?? named;
      await ready();
      const box = seen(page.getByRole("combobox", { name: /filter opportunities/i })).first();
      if (!(await box.count())) unbound(where, `no "Filter Opportunities" chooser on ${page.url()}`);
      await pickFrom(where, box, value);
    },
    // Signed out, the only chooser is the program one; a status chooser beside it is used
    // where one is offered.
    filterByStatus: async (input) => {
      const where = "opportunity-list.filter_by_status";
      const named = field(input, "status", "value") || textOf(input);
      if (!named) unbound(where, `the input names no status (${JSON.stringify(input)})`);
      await ready();
      const boxes = seen(page.getByRole("combobox"));
      for (let i = 0; i < (await boxes.count()); i++) {
        // The program chooser is known by its accessible name, however it is given.
        const described = await boxes.nth(i).ariaSnapshot().catch(() => "");
        if (/filter opportunities/i.test(described)) continue;
        await pickFrom(where, boxes.nth(i), named);
        return;
      }
      unbound(
        where,
        `opened ${page.url()} signed out: it offers the "Filter Opportunities" program chooser, "Remote OK" and "Search by Title or Location", and no status chooser; ${NOBODY_SIGNS_IN}, so no other reader's list could be looked at`,
      );
    },
    filterRemoteOnly: async (input) => {
      const where = "opportunity-list.filter_remote_only";
      await ready();
      const box = seen(page.getByRole("checkbox", { name: /^remote ok$/i })).first();
      if (!(await box.count())) unbound(where, `no "Remote OK" box on ${page.url()}`);
      const stated = given(input, ["remote", "remoteOk", "remoteOnly", "checked", "on"]);
      await box.setChecked(stated === undefined || stated === null ? true : saysYes(stated));
      await settle();
    },
    search: async (input) => {
      const where = "opportunity-list.search";
      const words = field(input, "query", "search", "term", "text", "title", "location") || textOf(input);
      if (!words) unbound(where, `the input names nothing to search for (${JSON.stringify(input)})`);
      await ready();
      const box = seen(page.getByRole("textbox", { name: /search by title or location/i })).first();
      if (!(await box.count())) unbound(where, `no "Search by Title or Location" box on ${page.url()}`);
      await box.fill(words);
      await settle();
    },
    toggleWatch: async () => {
      const where = "opportunity-list.toggle_watch";
      await ready();
      const control = await findControl(page, /^(watch|watching|unwatch)$/i);
      if (!control) {
        unbound(where, `opened ${page.url()} signed out; no card carries a watch control — watching is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}`);
      }
      await control.click();
      await settle();
    },
    unpublishedGroup: () => opportunityGroup(OPPORTUNITY_GROUPS[0]),
    openGroup: () => opportunityGroup(OPPORTUNITY_GROUPS[1]),
    closedGroup: () => opportunityGroup(OPPORTUNITY_GROUPS[2]),
    // Every card from the first group down, as the list shows it.
    opportunityStatus: async () => {
      const lines = await textLines();
      const start = lines.findIndex((line) => OPPORTUNITY_GROUPS.some((group) => group.test(line)));
      return start < 0 ? "" : lines.slice(start).join("\n");
    },
    proposalDeadline: () => linesMatching(/^Close[sd]\b/),
  };

  // The organization list, read signed out: one column, "Organization Name", the names not
  // links, and no pager, no "Create Organization" and no "My Organizations".
  async function columnValues(header: RegExp): Promise<string> {
    await ready();
    const headers = seen(page.getByRole("columnheader"));
    let at = -1;
    for (let i = 0; i < (await headers.count()); i++) if (header.test((await headers.nth(i).innerText()).trim())) at = i;
    if (at < 0) return "";
    const rows = seen(page.getByRole("row"));
    const out: string[] = [];
    for (let i = 0; i < (await rows.count()); i++) {
      const cells = rows.nth(i).getByRole("cell");
      if ((await cells.count()) > at) out.push((await cells.nth(at).innerText()).trim());
    }
    return out.join("\n");
  }

  const ORGANIZATIONS_SIGNED_IN = `is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}`;

  const organizationList: S.OrganizationListPage = {
    open: () => go("/organizations"),
    changePage: async (input) => {
      const where = "organization-list.change_page";
      await ready();
      const wanted = field(input, "page", "to") || textOf(input);
      const name = wanted ? new RegExp(`^${wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") : /^(next|›|»)$/i;
      const control = seen(page.getByRole("button", { name }).or(page.getByRole("link", { name }))).first();
      if (!(await control.count())) {
        unbound(where, `opened ${page.url()} signed out; the whole list is on one page and no pager control appears on it`);
      }
      await control.click();
      await settle();
    },
    openOrganization: async (input) => {
      const where = "organization-list.open_organization";
      const named = field(input, "legalName", "name", "organization") || textOf(input);
      await ready();
      const link = seen(page.getByRole("link", { name: named ? new RegExp(named.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : /./ })).first();
      if (!named || !(await link.count()) || !(await link.getAttribute("href"))?.startsWith("/organizations/")) {
        unbound(where, `opened ${page.url()} signed out; the names are listed as plain text, not links — an organization's screen ${ORGANIZATIONS_SIGNED_IN}`);
      }
      await link.click();
      await settle();
    },
    createOrganization: async () => {
      await ready();
      if (!(await findControl(page, /^create organization$/i))) {
        unbound("organization-list.create_organization", `opened ${page.url()} signed out; no "Create Organization" — creating one ${ORGANIZATIONS_SIGNED_IN}`);
      }
      await press("organization-list.create_organization", /^create organization$/i);
    },
    myOrganizations: async () => {
      await ready();
      if (!(await findControl(page, /^my organizations$/i))) {
        unbound("organization-list.my_organizations", `opened ${page.url()} signed out; no "My Organizations" — a person's own organizations are ${ORGANIZATIONS_SIGNED_IN.replace(/^is/, "are")}`);
      }
      await press("organization-list.my_organizations", /^my organizations$/i);
    },
    organizationName: () => columnValues(/^(organization name|legal name)$/i),
    // A withheld owner is shown as a dash, which is no name.
    ownerName: async () => {
      const shown = await columnValues(/^owner$/i);
      return shown
        .split("\n")
        .map((line) => (/^[—–-]$/.test(line) ? "" : line))
        .join("\n")
        .trim();
    },
    swuQualifiedMark: () => columnValues(/^swu qualified\??$/i),
    twuQualifiedMark: () => columnValues(/^twu qualified\??$/i),
    // The list shown fits one page and carries no pager: nothing to read.
    pagination: async () => {
      await ready();
      const pager = seen(page.getByRole("navigation", { name: /pagination|pager/i }));
      return (await pager.count()) ? (await pager.first().innerText()).trim() : "";
    },
    refusedWhenNotPermitted: () => refusalShown(),
  };

  // /sign-in: "Sign In", "Choose the kind of account you sign in with.", then a "Vendor"
  // region ("Sign in as a vendor") and a "Public sector employee" region ("Sign in as a
  // public sector employee"), then "Don't have an account? Sign up". /sign-up ("Choose
  // Account Type") is the same with "Sign up as …" and closes on "Already have an account?
  // Sign in". Each way in leads to the sandbox identity provider's form.
  async function cardFrom(start: RegExp, end?: RegExp): Promise<string> {
    const lines = await textLines();
    const from = lines.findIndex((line) => start.test(line));
    if (from < 0) return "";
    let to = end ? lines.findIndex((line, i) => i > from && end.test(line)) : -1;
    if (to < 0) to = lines.findIndex((line, i) => i > from && /^(don.t|already) have an account/i.test(line));
    return lines.slice(from, to > from ? to : undefined).join("\n");
  }

  const VENDOR_CARD = /^vendor$/i;
  const PUBLIC_SECTOR_CARD = /^public sector employee$/i;

  const userSignIn: S.UserSignInPage = {
    open: () => go("/sign-in"),
    signInAsVendor: () => press("user-sign-in.sign_in_as_vendor", /^sign in (as a vendor|using github)$/i),
    signInAsPublicSectorEmployee: () =>
      press("user-sign-in.sign_in_as_public_sector_employee", /^sign in (as a public sector employee|using idir)$/i),
    goToSignUp: () => press("user-sign-in.go_to_sign_up", /^sign up$/i),
    vendorCard: () => cardFrom(VENDOR_CARD, PUBLIC_SECTOR_CARD),
    publicSectorCard: () => cardFrom(PUBLIC_SECTOR_CARD),
  };

  const userSignUpChooseAccount: S.UserSignUpChooseAccountPage = {
    open: () => go("/sign-up"),
    signUpAsVendor: () => press("user-sign-up-choose-account.sign_up_as_vendor", /^sign up (as a vendor|using github)$/i),
    signUpAsPublicSectorEmployee: () =>
      press(
        "user-sign-up-choose-account.sign_up_as_public_sector_employee",
        /^sign up (as a public sector employee|using idir)$/i,
      ),
    vendorCard: () => cardFrom(VENDOR_CARD, PUBLIC_SECTOR_CARD),
    publicSectorCard: () => cardFrom(PUBLIC_SECTOR_CARD),
  };

  // /sign-out: "Signed Out" / "You have successfully signed out" / "Sign in again", whether
  // reached through the header's "Sign out" link (surface.signOut) or opened directly.
  const userSignOut: S.UserSignOutPage = {
    open: () => go("/sign-out"),
    signedOutMessage: () => linesMatching(/signed out/i),
    signOutFailedMessage: () => linesMatching(/(sign.?out|signing out).*(fail|could not|unable)|(fail|could not|unable).*sign.?out/i),
  };

  // /notice/deactivatedOwnAccount: "Account Deactivation Successful", "You have successfully
  // deactivated your account.", "Back to Home". /notice/authFailure: "Sign-In Failed",
  // 'Please try again using the "Sign-In" button.'. Any other notice is "Not Found".
  async function noticeSaying(heading: RegExp): Promise<string> {
    const lines = await textLines();
    const from = lines.findIndex((line) => heading.test(line));
    if (from < 0) return "";
    return lines.slice(from).filter((line) => !/^back to home$/i.test(line)).join("\n");
  }

  const userNotice: S.UserNoticePage = {
    open: (params) => go("/notice/:noticeId", params as unknown as Record<string, string>),
    backToHome: () => press("user-notice.back_to_home", /^(back to home|go home)$/i),
    deactivatedOwnAccountNotice: () => noticeSaying(/deactivat/i),
    signInFailedNotice: () => noticeSaying(/^sign.?in failed/i),
  };

  // /proposals: the words "Proposal List" and nothing else.
  const proposalListStub: S.ProposalListStubPage = {
    open: () => go("/proposals"),
    placeholderText: () => mainText(),
  };

  // ================================================================ signed-in screens, found at run time
  //
  // The screens below are shown only to a signed-in person. Walked signed in, the running
  // build draws /dashboard, /sign-up/complete and one's own profile, and
  // answers the Code With Us form and an organization's screen with "Page not found". Each
  // member looks for what the contract names by role and accessible name — the way a person
  // reads the screen — and throws "unbound: …" naming what it looked for, and what the
  // screen offers instead, when it is not there. Nothing here returns a reading from a screen
  // it did not reach: a refusal, a hand-off to the identity provider, or a missing tab is
  // unbound, and only a screen that opened and shows nothing reads as empty.

  // The accessible names of what a screen offers, for a reason to name when a control is
  // not among them.
  async function offered(): Promise<string> {
    const names: string[] = [];
    for (const role of ["tab", "button", "link", "textbox", "checkbox", "combobox"] as const) {
      const found = seen(page.getByRole(role));
      const count = Math.min(await found.count().catch(() => 0), 40);
      for (let i = 0; i < count; i++) {
        const one = found.nth(i);
        const name = await one
          .evaluate((element) => {
            const input = element as HTMLInputElement;
            const label = input.labels && input.labels.length ? input.labels[0].innerText : "";
            return (element.getAttribute("aria-label") || label || (element as HTMLElement).innerText || "").trim();
          })
          .catch(() => "");
        if (name) names.push(`${role} "${name.replace(/\s+/g, " ").slice(0, 60)}"`);
      }
    }
    return names.length ? names.join(", ") : "nothing that can be pressed or filled";
  }

  // "proposalDeadline", "proposal_deadline" -> /proposal\s*deadline/i, the label a field of
  // that name carries.
  const labelFor = (key: string): RegExp =>
    new RegExp(
      key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[\\s-]*"),
      "i",
    );

  // A form field by its label, on the view as it stands or behind one of its tabs.
  async function fieldLabelled(label: RegExp, walkTabs = true): Promise<Locator | null> {
    const look = async (): Promise<Locator | null> => {
      for (const role of ["textbox", "combobox", "spinbutton", "checkbox", "radio"] as const) {
        const found = seen(page.getByRole(role, { name: label }));
        if (await found.count()) return found.first();
      }
      const byLabel = seen(page.getByLabel(label));
      return (await byLabel.count()) ? byLabel.first() : null;
    };
    const here = await look();
    if (here || !walkTabs) return here;
    const tabs = seen(page.getByRole("tab"));
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click().catch(() => undefined);
      await settle();
      const found = await look();
      if (found) return found;
    }
    return null;
  }

  async function valueOf(box: Locator): Promise<string> {
    const role = await box.getAttribute("type").catch(() => null);
    if (role === "checkbox" || role === "radio") return (await box.isChecked()) ? "checked" : "unchecked";
    const value = await box.inputValue().catch(() => null);
    if (value !== null) return value.trim();
    return (await box.innerText().catch(() => "")).trim();
  }

  async function enter(where: string, key: string, box: Locator, value: unknown): Promise<void> {
    if (await isDisabled(box)) unbound(where, `the field for "${key}" is disabled on ${page.url()}`);
    const kind = await box.getAttribute("type").catch(() => null);
    const role = await box.getAttribute("role").catch(() => null);
    const tag = await box.evaluate((element) => element.tagName.toLowerCase()).catch(() => "");
    if (kind === "checkbox" || kind === "radio") {
      await box.setChecked(saysYes(value));
    } else if (tag === "select") {
      await box.selectOption({ label: textOf(value) });
    } else if (role === "combobox" && tag !== "input") {
      await pickFrom(where, box, textOf(value));
    } else {
      await box.fill(textOf(value));
    }
  }

  // Every value the test gave, entered in the field its key names, before anything is
  // pressed. A key no field on the screen takes is reported rather than dropped.
  async function fillFrom(
    where: string,
    input: unknown,
    labels: Record<string, RegExp> = {},
    skip: string[] = [],
  ): Promise<void> {
    const named = Object.fromEntries(Object.entries(labels).map(([key, label]) => [squash(key), label]));
    const skipped = skip.map(squash);
    for (const [key, value] of Object.entries(record(input))) {
      if (value === undefined || skipped.includes(squash(key))) continue;
      const label = named[squash(key)] ?? labelFor(key);
      const box = await fieldLabelled(label);
      if (!box) unbound(where, `no field on ${page.url()} takes "${key}" (looked for one labelled ${label}); it offers ${await offered()}`);
      await enter(where, key, box, value);
    }
  }

  // The messages a form draws: its alerts, and the description of every field marked
  // invalid. None drawn reads as nothing.
  async function formMessages(): Promise<string> {
    const lines: string[] = [];
    const alerts = seen(page.getByRole("alert"));
    for (let i = 0; i < (await alerts.count()); i++) lines.push(...lined(await alerts.nth(i).innerText().catch(() => "")));
    for (const role of ["textbox", "combobox", "spinbutton", "checkbox"] as const) {
      const boxes = seen(page.getByRole(role));
      for (let i = 0; i < (await boxes.count()); i++) {
        const said = await boxes
          .nth(i)
          .evaluate((element) => {
            if (element.getAttribute("aria-invalid") !== "true") return "";
            const ids = (element.getAttribute("aria-describedby") ?? element.getAttribute("aria-errormessage") ?? "")
              .split(/\s+/)
              .filter(Boolean);
            return ids.map((id) => document.getElementById(id)?.innerText ?? "").join("\n");
          })
          .catch(() => "");
        lines.push(...lined(said));
      }
    }
    return [...new Set(lines)].join("\n");
  }

  // A file offered through the chooser a control opens.
  // Returns the name the file was offered under.
  async function offerFile(where: string, control: RegExp, input: unknown): Promise<string> {
    const named = given(input, ["file", "name", "fileName", "image", "logo", "avatar", "picture"]);
    const request = typeof input === "string" ? { name: input } : named && typeof named === "object" ? record(named) : { ...record(input), name: textOf(named) };
    const name = textOf(record(request).name);
    if (!name) unbound(where, "the input names no file to offer");
    // Offered as a payload, not a path: Playwright hands the browser these bytes under this
    // name, so a name no file on disk could carry still reaches the page as it was given.
    const payload = fileGiven(
      name,
      record(request).content as string | Uint8Array | undefined,
      bytesGiven(request) ?? bytesGiven(input),
    );
    const button = await findControl(page, control);
    if (!button) {
      // A plain file input, found by its label.
      const box = seen(page.getByLabel(control));
      if (await box.count()) {
        await box.first().setInputFiles(payload);
        await settle();
        return name;
      }
      unbound(where, `no control named ${control} on ${page.url()} opens a file chooser; it offers ${await offered()}`);
    }
    const chooser = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
    await button.click();
    const opened = await chooser;
    if (opened) {
      await opened.setFiles(payload);
      await settle();
      return name;
    }
    // Walked signed in as the administrator and as a vendor: "Edit profile" draws the
    // "Profile picture (optional)" group with its rule and a "Choose a profile picture"
    // button, and pressing that button (click, Enter or Space) opens no file chooser — the
    // file field beside it, hidden from view, is never even clicked. The control the
    // contract names is on the page and does nothing, so this is the page failing to take a
    // file, reported as it is and not as an unbound member.
    const label = ((await button.innerText().catch(() => "")) || String(control)).trim();
    throw new Error(
      `${where} — pressed "${label}" on ${page.url()} and no file chooser opened, so "${name}" could not be offered; the page offers no other way a person can give it a file`,
    );
  }

  // The dialog on screen, or nothing when none is open.
  function dialog(): Locator {
    return seen(page.getByRole("dialog").or(page.getByRole("alertdialog"))).last();
  }

  async function inDialog(where: string, name: RegExp): Promise<void> {
    await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) unbound(where, `no dialog is open on ${page.url()} to press ${name} in`);
    await press(where, name, dialog());
  }

  async function confirmIfAsked(where: string, name: RegExp): Promise<void> {
    await dialog().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    if (await dialog().count()) await press(where, name, dialog());
  }

  // One line per table row, its cells joined with " | ".
  async function tableRows(scope: Scope = page): Promise<string[]> {
    const rows = seen(scope.getByRole("row"));
    const out: string[] = [];
    for (let i = 0; i < (await rows.count()); i++) {
      const cells = seen(rows.nth(i).getByRole("cell"));
      const count = await cells.count();
      if (!count) continue; // the header row
      const words: string[] = [];
      for (let c = 0; c < count; c++) words.push((await cells.nth(c).innerText()).replace(/\s+/g, " ").trim());
      out.push(words.join(" | "));
    }
    return out;
  }

  // The values of one column, found by its header.
  async function columnOf(header: RegExp): Promise<string[]> {
    const headers = seen(page.getByRole("columnheader"));
    let at = -1;
    for (let i = 0; i < (await headers.count()); i++) {
      if (header.test((await headers.nth(i).innerText()).trim())) {
        at = i;
        break;
      }
    }
    if (at < 0) return [];
    return (await tableRows()).map((row) => row.split(" | ")[at] ?? "").filter(Boolean);
  }

  // A row of the screen's tables that names the person or thing the test gave.
  async function rowNaming(where: string, input: unknown, groups: string[]): Promise<Locator> {
    const person = personOf(given(input, ["member", "user", "email", "person"]) ?? input);
    const words = [
      person?.email,
      givenText(input, ["email", "name", "title"]),
      typeof input === "string" ? input : "",
      seededId(given(input, ["id"]) ?? "", ...groups),
    ].filter((word): word is string => !!word);
    const rows = seen(page.getByRole("row"));
    for (const word of words) {
      const found = rows.filter({ hasText: word });
      if (await found.count()) return found.first();
    }
    return unbound(where, `no row on ${page.url()} names ${JSON.stringify(input)}; the rows read: ${(await tableRows()).join(" / ") || "none"}`);
  }

  // The screen a signed-in page is reached at, and the checks every member makes before it
  // reads or presses anything.
  function signedInScreen(pageId: string, route: string) {
    const where = (member: string): string => `${pageId}.${member}`;
    const on = async (member: string): Promise<void> => {
      await ready();
      const why = await whyNotHere();
      if (why) {
        unbound(
          where(member),
          `${route} did not open as a screen at ${page.url()}: ${why.replace(/\n+/g, " ")}; the screen is offered only to a signed-in person who may have it; ${NOBODY_SIGNS_IN}, and /users/:userId opens for the signed-in person's own identifier and, to the administrator, for another account's`,
        );
      }
    };
    return {
      where,
      on,
      open: (params?: Record<string, string>) => go(route, params),
      press: async (member: string, name: RegExp): Promise<void> => {
        await on(member);
        await press(where(member), name);
      },
      // A field's value, as a box or as the text shown under its label; a screen that opened
      // and carries no such field reads as nothing.
      field: async (member: string, label: RegExp, shownAs: string[] = []): Promise<string> => {
        await on(member);
        const box = await fieldLabelled(label, false);
        if (box) return valueOf(box);
        return shownAs.length ? valueAfter(shownAs) : "";
      },
      // A tab's panel; a screen that opened without that tab reads as nothing.
      tab: async (member: string, name: RegExp): Promise<string> => {
        await on(member);
        const tab = seen(page.getByRole("tab", { name }));
        if (!(await tab.count())) return "";
        await tab.first().click();
        await settle();
        const panel = seen(page.getByRole("tabpanel"));
        return (await panel.count()) ? (await panel.first().innerText()).trim() : mainText();
      },
      messages: async (member: string, about?: RegExp): Promise<string> => {
        await on(member);
        const said = await formMessages();
        return about ? lined(said).filter((line) => about.test(line)).join("\n") : said;
      },
      lines: async (member: string, pattern: RegExp): Promise<string> => {
        await on(member);
        return linesMatching(pattern);
      },
    };
  }

  // ---------------------------------------------------------------- the dashboard
  //
  // Signed in as the administrator: "Dashboard", a "Create an opportunity" link to
  // /opportunities/create, and "All opportunities" — a table (Title, Program, Status, Last
  // updated, Created by) of every opportunity, each title a link to its management screen.
  // A public sector employee sees the same over "My opportunities", or, with none, "You have
  // not created any opportunities yet." and no table.

  const dash = signedInScreen("opportunity-dashboard", "/dashboard");
  async function dashboardRows(member: string): Promise<string> {
    await dash.on(member);
    const tab = seen(page.getByRole("tab", { name: /opportunities/i }));
    if (await tab.count()) {
      await tab.first().click();
      await settle();
    }
    return (await tableRows()).join("\n");
  }
  const opportunityDashboard: S.OpportunityDashboardPage = {
    open: () => dash.open(),
    createOpportunity: () => dash.press("create_opportunity", /^\s*(\+\s*)?create( an?)?( new)? opportunity\s*$/i),
    openOpportunity: async (input) => {
      const where = dash.where("open_opportunity");
      await dash.on("open_opportunity");
      const id = seededId(given(input, ["opportunity", "opportunityId", "id"]) ?? "", "opportunities");
      const title = typeof input === "string" ? input : givenText(input, ["title", "name"]);
      const links = seen(page.getByRole("link"));
      for (let i = 0; i < (await links.count()); i++) {
        const link = links.nth(i);
        const href = (await link.getAttribute("href")) ?? "";
        const words = (await link.innerText()).trim();
        if ((id && href.includes(id)) || (title && words === title)) {
          await link.click();
          await settle();
          return;
        }
      }
      unbound(where, `no opportunity link on ${page.url()} for ${JSON.stringify(input)}; the rows read: ${(await tableRows()).join(" / ") || "none"}`);
    },
    myOpportunitiesTable: () => dashboardRows("my_opportunities_table"),
    opportunityStatus: async () => {
      await dashboardRows("opportunity_status");
      return (await columnOf(/^status$/i)).join("\n");
    },
    ownOpportunitiesOnly: () => dashboardRows("own_opportunities_only"),
    allOpportunitiesForAdministrator: () => dashboardRows("all_opportunities_for_administrator"),
    emptyMyOpportunitiesMessage: () =>
      dash.lines("empty_my_opportunities_message", /\bno\b.*opportunit|haven.t|have not|nothing to show|get started/i),
  };

  // ---------------------------------------------------------------- the Code With Us form

  const cwuNew = signedInScreen("opportunity-cwu-create", "/opportunities/code-with-us/create");
  const CWU_FIELDS: Record<string, RegExp> = {
    title: /^\s*title\b/i,
    teaser: /^\s*teaser\b/i,
    summary: /^\s*teaser\b/i,
    location: /^\s*location\b/i,
    remoteDesc: /remote work description/i,
    remoteDescription: /remote work description/i,
    reward: /^\s*reward\b/i,
    description: /^\s*description\b/i,
    proposalDeadline: /proposal\s*deadline/i,
    assignmentDate: /assignment\s*date/i,
    startDate: /^\s*(proposed\s*|work\s*)?start\s*date/i,
    completionDate: /completion\s*date/i,
  };
  const CWU_REMOTE = ["remoteOk", "remote", "remoteAllowed", "remoteWork", "remoteAcceptable"];
  const CWU_SKILLS = ["skills", "mandatorySkills", "requiredSkills", "skill"];
  const CWU_FILES = ["attachment", "attachments", "file", "files"];

  // Whether remote work is acceptable is the Overview's "Remote OK: remote work is
  // acceptable" box, under Location and above "Remote work description". A form that asks it
  // instead as "Is remote work acceptable?" with "Yes" and "No" radios is answered there.
  async function chooseRemote(where: string, value: unknown): Promise<void> {
    const box = seen(page.getByRole("checkbox", { name: /remote (ok|work)/i })).first();
    if (await box.count()) {
      const want = saysYes(value);
      if ((await box.isChecked().catch(() => !want)) === want) return;
      await box.setChecked(want).catch(() => undefined);
      if ((await box.isChecked().catch(() => !want)) !== want) await box.setChecked(want, { force: true });
      return;
    }
    const group = seen(page.getByRole("radiogroup", { name: /remote work/i })).first();
    if (!(await group.count())) unbound(where, `no "Remote OK" box and no "Is remote work acceptable?" choice on ${page.url()}; it offers ${await offered()}`);
    const answer = saysYes(value) ? "Yes" : "No";
    const radio = group.getByRole("radio", { name: answer, exact: true });
    if (await radio.isChecked().catch(() => false)) return;
    await group.getByText(answer, { exact: true }).first().click();
    if (!(await radio.isChecked().catch(() => false))) await radio.check({ force: true }).catch(() => undefined);
  }

  // "Skills (required)" opens a list of skills to pick from, and keeps it open while more are
  // picked; each pick is drawn beside the button as a row of "Skills selections" with its
  // own "Remove <skill>" button. The list given is the list kept: others are removed.
  async function chooseSkills(where: string, value: unknown): Promise<void> {
    const wanted = [value].flat().map(textOf).map((one) => one.trim()).filter(Boolean);
    const picked = seen(page.getByRole("grid", { name: /skills selections/i }).getByRole("row"));
    const already: string[] = [];
    for (let i = 0; i < (await picked.count()); i++) already.push((await picked.nth(i).innerText()).trim().split("\n")[0]);
    for (const old of already) {
      if (wanted.some((one) => one.toLowerCase() === old.toLowerCase())) continue;
      const remove = seen(page.getByRole("button", { name: new RegExp(`^remove ${escapeRx(old)}\\b`, "i") })).first();
      if (await remove.count()) await remove.click();
    }
    const missing = wanted.filter((one) => !already.some((old) => old.toLowerCase() === one.toLowerCase()));
    if (!missing.length) return;
    const opener = seen(page.getByRole("button", { name: /skills/i })).first();
    if (!(await opener.count())) unbound(where, `no "Skills" chooser on ${page.url()}; it offers ${await offered()}`);
    await opener.click();
    const list = seen(page.getByRole("listbox", { name: /skills/i })).last();
    await list.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    for (const skill of missing) {
      if (!(await list.isVisible().catch(() => false))) await opener.click();
      const option = list.getByRole("option", { name: new RegExp(`^\\s*${escapeRx(skill)}\\s*$`, "i") });
      if (!(await option.count())) {
        const names = (await list.getByRole("option").allInnerTexts().catch(() => [] as string[])).map((one) => one.trim()).filter(Boolean);
        await page.keyboard.press("Escape").catch(() => undefined);
        unbound(where, `the "Skills" chooser on ${page.url()} offers no skill "${skill}"; it offers ${names.join(", ")}`);
      }
      await option.first().click();
    }
    if (await list.isVisible().catch(() => false)) await page.keyboard.press("Escape").catch(() => undefined);
  }

  const escapeRx = (words: string): string => words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Every value the test gave, entered in the Code With Us form before anything is pressed.
  async function fillCwuForm(where: string, input: unknown): Promise<void> {
    const remote = given(input, CWU_REMOTE);
    if (remote !== undefined && remote !== null) await chooseRemote(where, remote);
    const skills = given(input, CWU_SKILLS);
    if (skills !== undefined && skills !== null) await chooseSkills(where, skills);
    await fillFrom(where, input, CWU_FIELDS, [...CWU_REMOTE, ...CWU_SKILLS, ...CWU_FILES]);
    const files = given(input, CWU_FILES);
    for (const file of [files ?? []].flat()) await addAttachmentFile(where, file);
  }

  // The form's own action, and the confirmation it asks for ("Publish this opportunity?"
  // with "Publish opportunity"). An action the form accepts lands on the new opportunity's
  // management screen; one it refuses stays on the form with its messages.
  async function cwuSubmit(member: string, input: unknown, name: RegExp): Promise<void> {
    const where = cwuNew.where(member);
    // The form is offered to the administrator and public sector staff; anybody else (a
    // vendor, a visitor) is answered "Page not found", which is the refusal itself. It is
    // logged, not thrown: the test's own follow-up reading decides what the refusal means.
    await ready();
    const why = await whyNotHere();
    if (why && !actingMay(/^create opportunity$/i)) {
      noteRefusal(
        `${where} — /opportunities/code-with-us/create answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}; only a person who may create an opportunity is offered the form`,
      );
      return;
    }
    if (why) {
      unbound(where, `/opportunities/code-with-us/create did not open at ${page.url()} for ${actingId()}, who may create an opportunity: ${why.replace(/\n+/g, " ")}`);
    }
    await cwuNew.on(member);
    await fillCwuForm(where, input);
    await press(where, name);
    await confirmIfAsked(where, /^\s*(publish|submit|save)( opportunity| for review| draft)?\s*$/i);
    // Accepted, it lands on the new opportunity's management screen; refused, it stays on
    // the form with an alert ("This opportunity has N problems").
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (/\/edit$/.test(new URL(page.url()).pathname)) break;
      if (await seen(page.getByRole("alert")).count()) break;
      await page.waitForTimeout(250);
    }
    await ready();
  }

  // "Add attachment" opens the file chooser; the file is listed as "New: <name>, <size>.",
  // with a "Name for <name> (optional)" box, until the form is saved. The row reads
  // "Uploading…" first; the action returns only once the upload has ended, either with the
  // row's "Download <name>" link to /api/files/<id> or with its alert ("<name> is too large
  // to attach", "<name> could not be attached").
  async function addAttachmentFile(where: string, input: unknown): Promise<void> {
    const control = /^\s*add attachment\s*$/i;
    if (!(await findControl(page, control))) {
      unbound(where, `no "Add attachment" control on ${page.url()}; it offers ${await offered()}`);
    }
    const name = await offerFile(where, control, input);
    const region = attachmentRegion();
    const row = seen(region.getByRole("listitem")).filter({ hasText: name }).last();
    const ended = new RegExp(`${escapeRx(name)}.*(too large to attach|could not be attached)`, "i");
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (await row.count()) {
        const stored = await row
          .getByRole("link", { name: new RegExp(`^\\s*download\\b`, "i") })
          .evaluateAll((links) => links.some((link) => (link.getAttribute("href") ?? "").includes("/api/files/")))
          .catch(() => false);
        if (stored) return;
        const alerts = await seen(row.getByRole("alert")).allInnerTexts().catch(() => [] as string[]);
        if (alerts.some((said) => ended.test(said.replace(/\s+/g, " ")))) return;
      }
      const regionAlerts = await seen(region.getByRole("alert")).allInnerTexts().catch(() => [] as string[]);
      if (regionAlerts.some((said) => ended.test(said.replace(/\s+/g, " ")))) return;
      await page.waitForTimeout(100);
    }
    const shown = (await row.count()) ? lined(await row.innerText().catch(() => "")).join(" / ") : "no row naming it";
    throw new Error(`${where} — "${name}" was offered on ${page.url()} and after 30 s its row carries neither a "Download ${name}" link nor an alert that it could not be attached (${shown})`);
  }

  const opportunityCwuCreate: S.OpportunityCwuCreatePage = {
    open: () => cwuNew.open(),
    saveDraft: (input) => cwuSubmit("save_draft", input, /^\s*save draft\s*$/i),
    submitForReview: (input) => cwuSubmit("submit_for_review", input, /^\s*submit for review\s*$/i),
    publish: (input) => cwuSubmit("publish", input, /^\s*publish\s*$/i),
    addAttachment: async (input) => {
      await cwuNew.on("add_attachment");
      await addAttachmentFile(cwuNew.where("add_attachment"), input);
    },
    fieldError: () => cwuNew.messages("field_error"),
  };

  // ---------------------------------------------------------------- an organization's own screen

  const orgEdit = signedInScreen("organization-edit", "/organizations/:orgId/edit");
  const ORG_TAB = {
    organization: /^\s*organization\s*$/i,
    team: /^\s*team\s*$/i,
    swu: /sprint with us/i,
    twu: /team with us/i,
    changelog: /history|change\s*log/i,
  };
  async function orgTabOpen(member: string, name: RegExp): Promise<void> {
    await orgEdit.on(member);
    const tab = seen(page.getByRole("tab", { name }));
    if (!(await tab.count())) unbound(orgEdit.where(member), `no tab named ${name} on ${page.url()}; it offers ${await offered()}`);
    await tab.first().click();
    await settle();
  }
  async function orgTabLines(member: string, name: RegExp, pattern: RegExp): Promise<string> {
    await orgTabOpen(member, name);
    return linesMatching(pattern);
  }
  async function orgEditing(member: string): Promise<void> {
    await orgTabOpen(member, ORG_TAB.organization);
    const edit = await findControl(page, /^\s*edit( organization)?\s*$/i);
    if (edit && !(await isDisabled(edit))) {
      await edit.click();
      await settle();
    }
  }
  async function orgInRow(member: string, input: unknown, control: RegExp, confirm: RegExp): Promise<void> {
    await orgTabOpen(member, ORG_TAB.team);
    const row = await rowNaming(orgEdit.where(member), input, ["users"]);
    await press(orgEdit.where(member), control, row);
    await confirmIfAsked(orgEdit.where(member), confirm);
  }
  const organizationEdit: S.OrganizationEditPage = {
    open: (params) => orgEdit.open(params as unknown as Record<string, string>),
    editOrganization: async () => {
      await orgTabOpen("edit_organization", ORG_TAB.organization);
      await press(orgEdit.where("edit_organization"), /^\s*edit( organization)?\s*$/i);
    },
    saveChanges: async (input) => {
      const where = orgEdit.where("save_changes");
      await orgEditing("save_changes");
      const logo = given(input, ["logo", "image", "file"]);
      await fillFrom(where, input, {}, ["logo", "image", "file"]);
      if (logo !== undefined) await offerFile(where, /logo|choose image|upload image/i, logo);
      await press(where, /^\s*save( changes)?\s*$/i);
      await confirmIfAsked(where, /^\s*save( changes)?\s*$/i);
    },
    cancelEditing: () => orgEdit.press("cancel_editing", /^\s*cancel\s*$/i),
    archiveOrganization: async () => {
      await orgEdit.press("archive_organization", /^\s*archive( organization)?\s*$/i);
      await confirmIfAsked(orgEdit.where("archive_organization"), /^\s*archive( organization)?\s*$/i);
    },
    addTeamMembers: async (input) => {
      const where = orgEdit.where("add_team_members");
      await orgTabOpen("add_team_members", ORG_TAB.team);
      await press(where, /add team members?/i);
      const emails = [given(input, ["emails", "email", "members", "member", "users"]) ?? input]
        .flat()
        .map((one) => personOf(one)?.email || textOf(one))
        .filter(Boolean);
      if (!emails.length) unbound(where, "the input names nobody to invite");
      const scope = (await dialog().count()) ? dialog() : page;
      const boxes = seen(scope.getByRole("textbox"));
      for (let i = 0; i < emails.length; i++) {
        if ((await boxes.count()) <= i) {
          const more = await findControl(scope, /add (another|more)|^\s*\+\s*$/i);
          if (!more) unbound(where, `the invitation form on ${page.url()} has room for ${await boxes.count()} address(es) and offers no way to add another`);
          await more.click();
        }
        await boxes.nth(i).fill(emails[i]);
      }
      const kind = givenText(input, ["membershipType", "type", "role"]);
      if (kind) {
        const chooser = await fieldLabelled(/membership|type|role/i, false);
        if (!chooser) unbound(where, `the invitation form on ${page.url()} offers no membership type to choose "${kind}" from`);
        await enter(where, "membershipType", chooser, kind);
      }
      await press(where, /^\s*(add|invite|send)( team members?| invitations?)?\s*$/i, scope);
    },
    approvePendingMember: (input) => orgInRow("approve_pending_member", input, /^\s*approve\s*$/i, /^\s*approve\s*$/i),
    removeTeamMember: (input) => orgInRow("remove_team_member", input, /^\s*remove\s*$/i, /^\s*remove( team member)?\s*$/i),
    toggleMemberAdminStatus: async (input) => {
      const where = orgEdit.where("toggle_member_admin_status");
      await orgTabOpen("toggle_member_admin_status", ORG_TAB.team);
      const row = await rowNaming(where, input, ["users"]);
      const box = seen(row.getByRole("checkbox").or(row.getByRole("switch")));
      if (!(await box.count())) unbound(where, `the member's row on ${page.url()} carries no administrator box`);
      if (await isDisabled(box.first())) throw new Error(`${where} — the member's administrator box is disabled on ${page.url()}`);
      await box.first().click();
      await confirmIfAsked(where, /^\s*(yes|confirm|save|ok|update)\b/i);
      await settle();
    },
    acceptOrgAdminTerms: async (input) => {
      const where = orgEdit.where("accept_org_admin_terms");
      await orgEdit.on("accept_org_admin_terms");
      const box = seen(page.getByRole("checkbox", { name: /terms|agree/i }));
      if (!(await box.count())) unbound(where, `no terms box on ${page.url()}; it offers ${await offered()}`);
      const wanted = input === undefined ? true : saysYes(given(input, ["checked", "accept", "value"]) ?? input);
      await box.first().setChecked(wanted);
      await settle();
    },
    changeOwner: async (input) => {
      const where = orgEdit.where("change_owner");
      await orgTabOpen("change_owner", ORG_TAB.team);
      await press(where, /change owner/i);
      const person = personOf(given(input, ["newOwner", "owner", "user", "member"]) ?? input);
      const scope = (await dialog().count()) ? dialog() : page;
      const chooser = seen(scope.getByRole("combobox")).first();
      if (!(await chooser.count())) unbound(where, `choosing "Change Owner" on ${page.url()} offers no chooser of people`);
      const wanted = person?.email || givenText(input, ["name", "email"]);
      if (!wanted) unbound(where, "the input names no new owner");
      await pickFrom(where, chooser, wanted);
      await press(where, /change owner|confirm|save/i, scope);
      await confirmIfAsked(where, /change owner|confirm|yes/i);
    },
    editServiceAreas: async () => {
      await orgTabOpen("edit_service_areas", ORG_TAB.twu);
      await press(orgEdit.where("edit_service_areas"), /edit( service areas)?/i);
    },
    saveServiceAreas: async (input) => {
      const where = orgEdit.where("save_service_areas");
      await orgEdit.on("save_service_areas");
      const areas = [given(input, ["serviceAreas", "areas", "serviceArea"]) ?? []].flat().map(textOf).filter(Boolean);
      for (const area of areas) {
        const box = seen(page.getByRole("checkbox", { name: labelFor(area) }));
        if (!(await box.count())) unbound(where, `no service area box named "${area}" on ${page.url()}; it offers ${await offered()}`);
        await box.first().setChecked(true);
      }
      await press(where, /^\s*save( changes| service areas)?\s*$/i);
      await confirmIfAsked(where, /^\s*save/i);
    },
    viewSwuTerms: async () => {
      await orgTabOpen("view_swu_terms", ORG_TAB.swu);
      await press(orgEdit.where("view_swu_terms"), /terms/i);
    },
    viewTwuTerms: async () => {
      await orgTabOpen("view_twu_terms", ORG_TAB.twu);
      await press(orgEdit.where("view_twu_terms"), /terms/i);
    },
    changeLogo: async (input) => {
      await orgEditing("change_logo");
      await offerFile(orgEdit.where("change_logo"), /logo|choose image|upload image/i, input);
    },
    currentLogo: async () => {
      await orgTabOpen("current_logo", ORG_TAB.organization);
      const image = seen(page.getByRole("img", { name: /logo/i }));
      return (await image.count()) ? ((await image.first().getAttribute("src")) ?? "") : "";
    },
    logoRefusedError: () => orgEdit.messages("logo_refused_error", /logo|image/i),
    organizationIdentifier: async () => {
      await orgEdit.on("organization_identifier");
      return /^\/organizations\/([^/?#]+)/.exec(new URL(page.url()).pathname)?.[1] ?? "";
    },
    organizationTab: () => orgEdit.tab("organization_tab", ORG_TAB.organization),
    teamTab: () => orgEdit.tab("team_tab", ORG_TAB.team),
    swuQualificationTab: () => orgEdit.tab("swu_qualification_tab", ORG_TAB.swu),
    twuQualificationTab: () => orgEdit.tab("twu_qualification_tab", ORG_TAB.twu),
    changelogTab: () => orgEdit.tab("changelog_tab", ORG_TAB.changelog),
    swuQualifiedBadge: () => orgTabLines("swu_qualified_badge", ORG_TAB.swu, /^(sprint with us )?qualified$|is qualified/i),
    twuQualifiedBadge: () => orgTabLines("twu_qualified_badge", ORG_TAB.twu, /^(team with us )?qualified$|is qualified/i),
    ownerBadge: () => orgTabLines("owner_badge", ORG_TAB.team, /^owner$/i),
    pendingBadge: () => orgTabLines("pending_badge", ORG_TAB.team, /^pending$/i),
    teamMemberRow: async () => {
      await orgTabOpen("team_member_row", ORG_TAB.team);
      return (await tableRows()).join("\n");
    },
    teamCapabilities: () => orgTabLines("team_capabilities", ORG_TAB.team, /capabilit/i),
    swuRequirementTwoMembers: () => orgTabLines("swu_requirement_two_members", ORG_TAB.swu, /\b(two|2)\b.*member/i),
    swuRequirementAllCapabilities: () => orgTabLines("swu_requirement_all_capabilities", ORG_TAB.swu, /capabilit/i),
    swuRequirementTermsAccepted: () => orgTabLines("swu_requirement_terms_accepted", ORG_TAB.swu, /terms/i),
    twuRequirementServiceArea: () => orgTabLines("twu_requirement_service_area", ORG_TAB.twu, /service area/i),
    twuRequirementTermsAccepted: () => orgTabLines("twu_requirement_terms_accepted", ORG_TAB.twu, /terms/i),
    serviceAreaCheckbox: async () => {
      await orgTabOpen("service_area_checkbox", ORG_TAB.twu);
      const boxes = seen(page.getByRole("checkbox"));
      const out: string[] = [];
      for (let i = 0; i < (await boxes.count()); i++) {
        const name = await boxes.nth(i).evaluate((element) => {
          const input = element as HTMLInputElement;
          return (element.getAttribute("aria-label") || (input.labels?.[0]?.innerText ?? "")).trim();
        });
        out.push(`${name}: ${(await boxes.nth(i).isChecked()) ? "checked" : "unchecked"}`);
      }
      return out.join("\n");
    },
    notQualifiedNotice: () => orgEdit.lines("not_qualified_notice", /not (yet )?qualified/i),
    changelogEntry: async () => {
      await orgTabOpen("changelog_entry", ORG_TAB.changelog);
      return (await tableRows()).join("\n");
    },
    fieldError: () => orgEdit.messages("field_error"),
    invalidMembershipTypeError: async () => {
      await orgEdit.on("invalid_membership_type_error");
      return unbound(
        orgEdit.where("invalid_membership_type_error"),
        "the team screen offers one kind of membership, so a refusal of another kind can only be sent by request, not read off this screen",
      );
    },
  };

  // ---------------------------------------------------------------- completing a profile

  // "Complete Your Profile" is shown only to a vendor still to agree: "Sign-in username"
  // (read-only), "Name", "Email address", "Email me when new opportunities are posted", the
  // terms box, and "Complete profile", disabled until the terms box is ticked. Anyone else is
  // sent on: an account with nothing to complete to /dashboard, a signed-out visitor to
  // /sign-in?redirectOnSuccess=%2Fsign-up%2Fcomplete.
  const signUp = signedInScreen("user-sign-up-complete", "/sign-up/complete");
  const TERMS_BOX = /terms|agree/i;
  const NOTICES_BOX = /new opportunit/i;
  const SENT_ON = ["/dashboard", "/sign-in"];
  // Whether the profile form is on screen. False when /sign-up/complete sent the browser on
  // to /dashboard or /sign-in, which is the page answering that this person has no profile to
  // complete; anywhere else the page was never reached, which is unbound.
  async function signUpFormShown(member: string): Promise<boolean> {
    await settle();
    // The page sends people on after it loads, so wait for the form or for the move away.
    await Promise.race([
      seen(page.getByRole("heading", { name: /complete your profile/i })).first().waitFor({ state: "visible", timeout: 10000 }),
      page.waitForURL((url) => url.pathname !== "/sign-up/complete", { timeout: 10000 }),
    ]).catch(() => undefined);
    await settle();
    const at = new URL(page.url());
    if (originOf(page.url()) === originOf(baseURL) && SENT_ON.includes(at.pathname)) return false;
    if (at.pathname !== "/sign-up/complete") {
      unbound(signUp.where(member), `the browser is at ${page.url()}, not on /sign-up/complete nor where that page sends people (/dashboard, /sign-in); open() was not the last place it went`);
    }
    await signUp.on(member);
    return true;
  }
  async function onSignUpForm(member: string): Promise<void> {
    if (!(await signUpFormShown(member))) {
      unbound(signUp.where(member), `/sign-up/complete sent the browser on to ${page.url()} instead of showing the profile form; it is shown only to a vendor who has still to agree to the terms`);
    }
  }
  async function setBox(where: string, name: RegExp, wanted: boolean | undefined): Promise<void> {
    const box = seen(page.getByRole("checkbox", { name }));
    if (!(await box.count())) unbound(where, `no box named ${name} on ${page.url()}; it offers ${await offered()}`);
    await box.first().setChecked(wanted ?? !(await box.first().isChecked()));
    await settle();
  }
  const boxWanted = (input: unknown, keys: string[]): boolean | undefined => {
    if (typeof input === "boolean") return input;
    const value = given(input, [...keys, "checked", "value", "on", "enabled"]);
    return value === undefined ? undefined : saysYes(value);
  };
  const TERMS_KEYS = ["acceptTerms", "acceptAppTerms", "terms", "acceptedTerms", "agree"];
  const NOTICE_KEYS = ["notifications", "notificationsOn", "newOpportunities", "notifyNewOpportunities", "toggleNewOpportunityNotifications"];
  const PROFILE_FIELDS: Record<string, RegExp> = {
    name: /^\s*(full\s*)?name\b/i,
    email: /e-?mail/i,
    jobTitle: /job\s*title/i,
  };
  const userSignUpComplete: S.UserSignUpCompletePage = {
    open: () => signUp.open(),
    changeAvatar: async (input) => {
      await onSignUpForm("change_avatar");
      await offerFile(signUp.where("change_avatar"), /avatar|choose image|upload image|picture|photo/i, input);
    },
    acceptAppTerms: async (input) => {
      await onSignUpForm("accept_app_terms");
      await setBox(signUp.where("accept_app_terms"), TERMS_BOX, boxWanted(input, TERMS_KEYS) ?? true);
    },
    toggleNewOpportunityNotifications: async (input) => {
      await onSignUpForm("toggle_new_opportunity_notifications");
      await setBox(signUp.where("toggle_new_opportunity_notifications"), NOTICES_BOX, boxWanted(input, NOTICE_KEYS));
    },
    completeProfile: async (input) => {
      const where = signUp.where("complete_profile");
      await onSignUpForm("complete_profile");
      if (given(input, TERMS_KEYS) !== undefined) await setBox(where, TERMS_BOX, boxWanted(input, TERMS_KEYS) ?? true);
      if (given(input, NOTICE_KEYS) !== undefined) await setBox(where, NOTICES_BOX, boxWanted(input, NOTICE_KEYS) ?? true);
      const picture = given(input, ["avatar", "image", "picture"]);
      await fillFrom(where, input, PROFILE_FIELDS, [...TERMS_KEYS, ...NOTICE_KEYS, "avatar", "image", "picture"]);
      if (picture !== undefined) await offerFile(where, /avatar|choose image|upload image|picture|photo/i, picture);
      await press(where, /^\s*complete( profile)?\s*$/i);
      const left = await page
        .waitForURL((url) => url.pathname !== "/sign-up/complete", { timeout: 20000 })
        .then(() => true)
        .catch(() => false);
      if (!left) {
        const shown = await formMessages();
        throw new Error(`${where} — "Complete Profile" was pressed but the page stayed on ${page.url()}; ${shown ? `it shows: ${shown.replace(/\n/g, " ")}` : "it shows no message"}`);
      }
      await ready();
    },
    // Each reading answers empty when the page sent the browser on instead of showing the
    // form: no form is what an account with nothing to complete, or a signed-out visitor, sees.
    idpUsernameReadonly: async () => {
      if (!(await signUpFormShown("idp_username_readonly"))) return "";
      const box = await fieldLabelled(/github|idir|user\s*name/i, false);
      return box ? valueOf(box) : "";
    },
    nameField: async () => {
      if (!(await signUpFormShown("name_field"))) return "";
      const box = await fieldLabelled(PROFILE_FIELDS.name, false);
      return box ? valueOf(box) : "";
    },
    emailField: async () => {
      if (!(await signUpFormShown("email_field"))) return "";
      const box = await fieldLabelled(PROFILE_FIELDS.email, false);
      return box ? valueOf(box) : "";
    },
    jobTitleField: async () => {
      if (!(await signUpFormShown("job_title_field"))) return "";
      const box = await fieldLabelled(PROFILE_FIELDS.jobTitle, false);
      return box ? valueOf(box) : "";
    },
    termsCheckbox: async () => {
      if (!(await signUpFormShown("terms_checkbox"))) return "";
      const box = seen(page.getByRole("checkbox", { name: TERMS_BOX }));
      return (await box.count()) ? ((await box.first().isChecked()) ? "checked" : "unchecked") : "";
    },
    completeDisabledUntilTermsAccepted: async () => {
      if (!(await signUpFormShown("complete_disabled_until_terms_accepted"))) return "";
      const box = seen(page.getByRole("checkbox", { name: TERMS_BOX }));
      if (!(await box.count()) || (await box.first().isChecked())) return "";
      const control = await findControl(page, /^\s*complete( profile)?\s*$/i);
      return control && (await isDisabled(control)) ? "disabled" : "";
    },
    fieldError: async () => {
      if (!(await signUpFormShown("field_error"))) return "";
      return formMessages();
    },
  };

  // ---------------------------------------------------------------- a profile

  // Walked signed in: the profile is "User Profile" over a "Profile sections" navigation of
  // links (Profile, and for a vendor Capabilities and Organizations, then Notifications and
  // Legal), the account facts "Account type: …", "Status: …" and "Account ID: …" each on a
  // line, "Details" with read-only "Sign-in username", "Name", "Email address" (and "Job
  // title" for public sector staff) boxes, and for public sector staff a "Permissions"
  // section. One's own profile offers "Edit profile", which opens "Edit your details" with a
  // "Profile picture (optional)" group ("Choose a profile picture"), "Name(required)", "Email
  // address(required)", "Job title (optional)", "Save changes" and "Cancel"; a vendor's also
  // offers "Deactivate account". ?tab=capabilities draws "Capabilities" (see below), and
  // ?tab=organizations "My Organizations" with a line saying organizations cannot yet be
  // registered. A vendor still to complete a profile is sent from the profile to
  // /sign-up/complete. Another account's /users/:userId opens for the administrator (the
  // account facts and "Details", nothing to edit) and answers "Page not found" to anyone else.
  const SECTION_HEADINGS: Record<string, RegExp> = {
    capabilities: /capabilit/i,
    organizations: /organi[sz]ations/i,
    notifications: /^\s*notifications\s*$/i,
    legal: /policies|terms|legal|agreements/i,
  };
  async function profileSection(where: string, name: RegExp, key: string): Promise<string> {
    const tab = seen(page.getByRole("tab", { name }));
    if (await tab.count()) {
      await tab.first().click();
      await settle();
      const panel = seen(page.getByRole("tabpanel"));
      return (await panel.count()) ? (await panel.first().innerText()).trim() : mainText();
    }
    const sections = page.getByRole("navigation", { name: /profile sections/i });
    const link = seen(sections.getByRole("link", { name }));
    // A screen that opened without that section reads as nothing.
    if (!(await link.count())) return "";
    await link.first().click();
    await settle();
    await ready();
    const heading = await firstHeading();
    const wanted = SECTION_HEADINGS[key];
    if (wanted && !wanted.test(heading)) {
      unbound(where, `the "${key}" link under "Profile sections" goes to ${page.url()}, which draws "${heading}" (the Profile section again) and no ${key} section`);
    }
    const names = lined(await sections.innerText().catch(() => ""));
    return (await textLines()).filter((line) => !names.includes(line)).join("\n");
  }

  function profileScreen(pageId: string, route: string) {
    const signedIn = signedInScreen(pageId, route);
    // The client sends a vendor still to complete a profile from the profile on to
    // /sign-up/complete: the profile is not what that person is shown, and saying so is
    // the answer, not a reading of the form it was sent to.
    const on = async (member: string): Promise<void> => {
      await signedIn.on(member);
      await Promise.race([
        seen(page.getByText(/^\s*status:/i)).first().waitFor({ state: "visible", timeout: 10000 }),
        page.waitForURL((url) => url.pathname === "/sign-up/complete", { timeout: 10000 }),
      ]).catch(() => undefined);
      if (new URL(page.url()).pathname === "/sign-up/complete") {
        throw new Error(
          `${pageId}.${member} — ${route} sent this person on to ${page.url()} ("Complete Your Profile"): the account has still to complete its profile, and the profile is not shown to it until then`,
        );
      }
    };
    const screen = {
      ...signedIn,
      on,
      press: async (member: string, name: RegExp): Promise<void> => {
        await on(member);
        await press(signedIn.where(member), name);
      },
      tab: async (member: string, name: RegExp, key = ""): Promise<string> => {
        await on(member);
        return profileSection(signedIn.where(member), name, key);
      },
      messages: async (member: string): Promise<string> => {
        await on(member);
        return formMessages();
      },
    };
    const w = screen.where;
    const profileField = async (member: string, label: RegExp, shownAs: string[]): Promise<string> => {
      await screen.on(member);
      const box = await fieldLabelled(label, false);
      return box ? valueOf(box) : labelledValue(shownAs);
    };
    return {
      open: (params?: Record<string, string>) => screen.open(params),
      editProfile: () => screen.press("edit_profile", /^\s*edit( profile)?\s*$/i),
      // What the test gave is entered first, opening the form for editing when it is not
      // already; a disabled save is the form refusing, and is reported at once.
      saveChanges: async (input?: unknown) => {
        await screen.on("save_changes");
        const picture = given(input, ["avatar", "image", "picture"]);
        const values = Object.keys(record(input)).length > 0;
        if (values || picture !== undefined) {
          // The profile draws its boxes read-only until "Edit profile" is pressed.
          const name = await fieldLabelled(PROFILE_FIELDS.name, false);
          if (!name || (await isDisabled(name)) || !(await name.isEditable().catch(() => false))) {
            const edit = await findControl(page, /^\s*edit( profile)?\s*$/i);
            if (edit) {
              await edit.click();
              await settle();
            }
          }
          await fillFrom(w("save_changes"), input, PROFILE_FIELDS, ["avatar", "image", "picture"]);
          if (picture !== undefined) await offerFile(w("save_changes"), /avatar|choose image|upload image|picture|photo/i, picture);
        }
        await press(w("save_changes"), /^\s*save( changes)?\s*$/i);
        await confirmIfAsked(w("save_changes"), /^\s*save( changes)?\s*$/i);
      },
      cancelEditing: () => screen.press("cancel_editing", /^\s*cancel\s*$/i),
      changeAvatar: async (input?: unknown) => {
        await screen.on("change_avatar");
        // The picture is chosen on the form "Edit profile" opens.
        if (!(await findControl(page, /^\s*choose (a |a different )?profile picture\s*$/i))) {
          const edit = await findControl(page, /^\s*edit( profile)?\s*$/i);
          if (edit && !(await isDisabled(edit))) {
            await edit.click();
            await settle();
          }
        }
        await offerFile(w("change_avatar"), /avatar|choose image|upload image|picture|photo/i, input);
      },
      deactivateAccount: () => screen.press("deactivate_account", /deactivate( account)?/i),
      reactivateAccount: () => screen.press("reactivate_account", /reactivate( account)?/i),
      confirmActivationChange: async () => {
        await screen.on("confirm_activation_change");
        await inDialog(w("confirm_activation_change"), /deactivate|reactivate|confirm|^\s*yes\s*$/i);
      },
      cancelActivationChange: async () => {
        await screen.on("cancel_activation_change");
        await inDialog(w("cancel_activation_change"), /^\s*(cancel|no)\s*$/i);
      },
      toggleAdminPermission: async () => {
        await screen.on("toggle_admin_permission");
        const box = seen(page.getByRole("checkbox", { name: /admin/i }).or(page.getByRole("switch", { name: /admin/i })));
        if (!(await box.count())) unbound(w("toggle_admin_permission"), `no administrator box on ${page.url()}; it offers ${await offered()}`);
        if (await isDisabled(box.first())) throw new Error(`${w("toggle_admin_permission")} — the administrator box is disabled on ${page.url()}`);
        await box.first().click();
        await confirmIfAsked(w("toggle_admin_permission"), /^\s*(yes|confirm|save|ok|update)\b/i);
        await settle();
      },
      userIdentifier: async () => {
        await screen.on("user_identifier");
        const named = /^\/users\/([^/?#]+)/.exec(new URL(page.url()).pathname)?.[1] ?? "";
        return named && named !== "me" ? named : textOf((await ownAccount()).id);
      },
      profileTab: async () => {
        await screen.on("profile_tab");
        const tab = seen(page.getByRole("tab", { name: /^\s*profile\s*$/i }));
        if (await tab.count()) return screen.tab("profile_tab", /^\s*profile\s*$/i);
        return mainText();
      },
      capabilitiesTab: () => screen.tab("capabilities_tab", /capabilities/i, "capabilities"),
      notificationsTab: () => screen.tab("notifications_tab", /notifications/i, "notifications"),
      legalTab: () => screen.tab("legal_tab", /policies|terms|legal|agreements/i, "legal"),
      organizationsTab: () => screen.tab("organizations_tab", /organizations/i, "organizations"),
      // Signed in, the profile draws "Account type: Vendor", "Status: Active" and "Account ID: …"
      // each on a line of its own, the value beside its label ("Status:" and its value in one
      // paragraph); on() waits for that line, which is drawn after the heading.
      statusBadge: async () => {
        await screen.on("status_badge");
        return labelledValue(["Status", "Account Status"]);
      },
      accountType: async () => {
        await screen.on("account_type");
        return labelledValue(["Account Type"]);
      },
      permissionsLabel: async () => {
        await screen.on("permissions_label");
        return labelledValue(["Permissions", "Permission", "Permission(s)"]);
      },
      adminCheckbox: async () => {
        await screen.on("admin_checkbox");
        const box = seen(page.getByRole("checkbox", { name: /admin/i }).or(page.getByRole("switch", { name: /admin/i })));
        return (await box.count()) ? ((await box.first().isChecked()) ? "checked" : "unchecked") : "";
      },
      // Signed in, "Details" carries "Sign-in username", "Name" and "Email address" as
      // labelled text boxes; a label drawn with its value as text is read beside or under it.
      idpUsernameReadonly: () => profileField("idp_username_readonly", /github|idir|user\s*name/i, ["Sign-in username", "GitHub", "IDIR", "Username"]),
      nameField: () => profileField("name_field", PROFILE_FIELDS.name, ["Name"]),
      emailField: () => profileField("email_field", PROFILE_FIELDS.email, ["Email", "Email Address"]),
      jobTitleField: () => profileField("job_title_field", PROFILE_FIELDS.jobTitle, ["Job Title"]),
      fieldError: () => screen.messages("field_error"),
      activationModal: async () => {
        await screen.on("activation_modal");
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
    };
  }

  // /users/:userId is a screen this build serves: walked signed in, it opens for the signed-in
  // person's own identifier and, to the administrator, for another account's (the seeded
  // organization owner's profile shows "Email address", "Name", "Sign-in username" and its
  // status to test-admin). Walked as a vendor, another account's identifier answers "Page not
  // found": that is the service refusing this person the account, so a reading of the
  // profile reports what they are shown — nothing — and not_found_page reads the refusal.
  // Actions on a refused profile still report the refusal, since there is nothing to press.
  const profileOfUserId = profileScreen("user-profile", "/users/:userId");
  const PROFILE_READINGS = [
    "userIdentifier", "profileTab", "capabilitiesTab", "notificationsTab", "legalTab", "organizationsTab",
    "statusBadge", "accountType", "permissionsLabel", "adminCheckbox", "idpUsernameReadonly", "nameField",
    "emailField", "jobTitleField", "fieldError", "activationModal",
  ] as const;
  const readingsOfRefusedProfile: Partial<Record<(typeof PROFILE_READINGS)[number], () => Promise<string>>> = {};
  for (const name of PROFILE_READINGS) {
    const read = profileOfUserId[name] as () => Promise<string>;
    readingsOfRefusedProfile[name] = async () => {
      const at = new URL(page.url());
      if (originOf(page.url()) === originOf(baseURL) && /^\/users\/[^/]+$/.test(at.pathname) && (await notFoundShown())) return "";
      return read();
    };
  }

  // ---------------------------------------------------------------- the list of accounts
  //
  // /users is the administrator's "Digital Marketplace Users" screen (the header's "Users"
  // link): a "Search by name" box, an "Export contact list" button, and one table of every
  // account — "Status | Account type | Name | Administrator", the name a link to
  // /users/<id>, the last cell "Yes" or "No" — all of them at once, with no pager, and
  // "<n> of <m> people shown" under it. Searching narrows the rows in place. Anyone else
  // signed in is shown "Page not found" there, and a signed-out visitor is sent to
  // /sign-in?redirectOnSuccess=/users.
  //
  // "Export contact list" opens a dialog: "Account types (required)" with "Public sector
  // employees" and "Vendors", "Fields (required)" with "First name", "Last name", "Email
  // address" and "Organization name", every box unticked to start with, and "Cancel" and
  // "Export", the latter disabled until one type and one field are ticked. Export downloads
  // dm-contacts-<date>.csv (from /api/contact-list) and closes the dialog.
  const USER_LIST = "/users";

  // On the list, or why not: the refusal this visitor was shown instead. Straight after
  // signing in the client may still be loading the account when /users is asked for, so a
  // "Page not found" is looked at once more before it is believed.
  async function onUserList(): Promise<string> {
    await ready();
    const table = seen(page.getByRole("table")).first();
    const loaded = async (): Promise<boolean> => {
      await table.waitFor({ state: "visible", timeout: 8000 }).catch(() => undefined);
      return (await table.count()) > 0;
    };
    if (await loaded()) return "";
    if (new URL(page.url()).pathname === USER_LIST && (await notFoundShown())) {
      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: "domcontentloaded" });
      await ready();
      if (await loaded()) return "";
    }
    return (await whyNotHere()) || `${page.url()} shows no table of accounts`;
  }

  async function userListOrUnbound(member: string): Promise<void> {
    const why = await onUserList();
    if (why) {
      unbound(
        `user-list.${member}`,
        `${USER_LIST} did not show the list of accounts at ${page.url()}: ${why.replace(/\n+/g, " ")}; the list is the administrator's (signed in as the administrator it opens from the header's "Users" link; signed in as a public sector employee it answers "Page not found")`,
      );
    }
  }

  // Every row of the table as its cells' text, read in one pass. The table draws its rows
  // after the accounts arrive; a search that leaves rows out says "<n> of <m> people shown"
  // under it, which is the only sign a search that leaves none has finished.
  async function userListRows(): Promise<string[][]> {
    if (await onUserList()) return [];
    await seen(page.getByRole("table").first().getByRole("cell").or(page.getByText(/\bof \d+ (people|person) shown\b/i)))
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => undefined);
    return seen(page.getByRole("table"))
      .first()
      .evaluate((table) =>
        Array.from((table as HTMLTableElement).tBodies)
          .flatMap((body) => Array.from(body.rows))
          .map((row) => Array.from(row.cells).map((cell) => (cell.innerText ?? "").replace(/\s+/g, " ").trim()))
          .filter((cells) => cells.length > 0),
      )
      .catch(() => [] as string[][]);
  }

  // Where each column sits, by its header, so the readers do not depend on the order.
  async function userListColumns(): Promise<Record<"status" | "type" | "name" | "admin", number>> {
    const headers = (await seen(page.getByRole("columnheader")).allInnerTexts()).map((each) => each.trim());
    const at = (pattern: RegExp, fallback: number): number => {
      const found = headers.findIndex((each) => pattern.test(each));
      return found < 0 ? fallback : found;
    };
    return {
      status: at(/^status$/i, 0),
      type: at(/account\s*type/i, 1),
      name: at(/^name$/i, 2),
      admin: at(/admin/i, 3),
    };
  }

  async function userListColumn(which: "status" | "type" | "name" | "admin"): Promise<string> {
    const rows = await userListRows();
    if (!rows.length) return "";
    const at = (await userListColumns())[which];
    return rows.map((cells) => cells[at] ?? "").join("\n");
  }

  // The export dialog, opened when it is not already.
  async function exportDialog(member: string): Promise<Locator> {
    await userListOrUnbound(member);
    if (!(await dialog().count())) await press(`user-list.${member}`, /^\s*export contact list\s*$/i);
    await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) {
      unbound(`user-list.${member}`, `"Export contact list" on ${page.url()} was pressed and no dialog opened`);
    }
    return dialog();
  }

  // What a test calls an account type or a field, as the dialog labels it.
  function exportTypeLabel(said: string): RegExp {
    const words = squash(said);
    if (/vendor/.test(words)) return /^\s*vendors?\s*$/i;
    if (!words || /gov|publicsector|staff|employee|admin|idir/.test(words)) return /^\s*public sector employees?\s*$/i;
    return new RegExp(`^\\s*${said.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  }

  function exportFieldLabel(said: string): RegExp {
    const words = squash(said);
    if (!words || /email/.test(words)) return /^\s*email address\s*$/i;
    if (/first|given/.test(words)) return /^\s*first name\s*$/i;
    if (/last|surname|family/.test(words)) return /^\s*last name\s*$/i;
    if (/org|company/.test(words)) return /^\s*organization name\s*$/i;
    return new RegExp(`^\\s*${said.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  }

  // The state a test asked a box to be left in, or undefined to turn it over.
  function exportBoxWanted(input: unknown): boolean | undefined {
    if (typeof input === "boolean") return input;
    const said = given(input, ["checked", "selected", "on", "include", "included", "enabled"]);
    return said === undefined ? undefined : saysYes(said);
  }

  async function setExportBox(member: string, scope: Locator, label: RegExp, said: string, wanted: boolean | undefined): Promise<void> {
    const box = seen(scope.getByRole("checkbox", { name: label }));
    if (!(await box.count())) {
      const offered = (await seen(scope.getByRole("checkbox")).evaluateAll((boxes) =>
        boxes.map((each) => ((each as HTMLInputElement).labels?.[0]?.innerText ?? each.getAttribute("aria-label") ?? "").trim()),
      )).join(", ");
      unbound(`user-list.${member}`, `the export dialog has no box labelled ${label} (asked for "${said}"); it offers ${offered || "no boxes"}`);
    }
    const now = await box.first().isChecked();
    if (now !== (wanted ?? !now)) await box.first().click();
  }

  // The list of names a test gave for a group of boxes ("userTypes": ["VENDOR"]), as text.
  function namesGiven(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.map(textOf).filter(Boolean);
    if (typeof value === "object") {
      return Object.entries(record(value))
        .filter(([, on]) => saysYes(on))
        .map(([key]) => key);
    }
    return textOf(value).split(/\s*,\s*/).filter(Boolean);
  }

  const EXPORT_TYPE_KEYS = ["userTypes", "userType", "types", "type", "accountTypes", "accountType"];
  const EXPORT_FIELD_KEYS = ["fields", "field", "columns", "column"];

  const userListScreen: S.UserListPage = {
    open: async () => {
      await go(USER_LIST);
      await onUserList();
    },
    searchByName: async (input) => {
      const where = "user-list.search_by_name";
      await userListOrUnbound("search_by_name");
      const box = seen(page.getByRole("searchbox", { name: /search by name/i }).or(page.getByRole("textbox", { name: /search by name/i }))).first();
      if (!(await box.count())) unbound(where, `no "Search by name" box on ${page.url()}`);
      const words = typeof input === "string" ? input : givenText(input, ["name", "query", "search", "term", "text", "value"]);
      await box.fill(words);
      await page.waitForTimeout(300);
      await settle();
    },
    openExportContactList: async () => {
      await exportDialog("open_export_contact_list");
    },
    // A type named the way the criteria name accounts ("public sector employee", "GOV",
    // "vendor") is the box it stands for; a state given ({ checked }) is set, otherwise the
    // box is turned over.
    toggleExportUserType: async (input) => {
      const scope = await exportDialog("toggle_export_user_type");
      const said = (typeof input === "string" ? input : givenText(input, [...EXPORT_TYPE_KEYS, "name", "label"])).trim();
      await setExportBox("toggle_export_user_type", scope, exportTypeLabel(said), said, exportBoxWanted(input));
    },
    toggleExportField: async (input) => {
      const scope = await exportDialog("toggle_export_field");
      const said = (typeof input === "string" ? input : givenText(input, [...EXPORT_FIELD_KEYS, "fieldName", "name", "label"])).trim();
      await setExportBox("toggle_export_field", scope, exportFieldLabel(said), said, exportBoxWanted(input));
    },
    // The types and fields the test gave are ticked (and the rest of each group unticked)
    // before "Export" is pressed; a disabled "Export" is reported at once with what the
    // dialog says. Pressed, it downloads the list and closes the dialog.
    exportContactList: async (input) => {
      const where = "user-list.export_contact_list";
      const scope = await exportDialog("export_contact_list");
      for (const key of Object.keys(record(input))) {
        if (![...EXPORT_TYPE_KEYS, ...EXPORT_FIELD_KEYS].some((each) => squash(each) === squash(key))) {
          unbound(where, `the export dialog has nothing for "${key}": it offers only account types and fields`);
        }
      }
      const groups: [string[], (said: string) => RegExp, RegExp[]][] = [
        [EXPORT_TYPE_KEYS, exportTypeLabel, [/^\s*public sector employees?\s*$/i, /^\s*vendors?\s*$/i]],
        [EXPORT_FIELD_KEYS, exportFieldLabel, [/^\s*first name\s*$/i, /^\s*last name\s*$/i, /^\s*email address\s*$/i, /^\s*organization name\s*$/i]],
      ];
      for (const [keys, labelOf, every] of groups) {
        const value = given(input, keys);
        if (value === undefined) continue;
        const wanted = namesGiven(value).map((said) => ({ said, label: labelOf(said) }));
        for (const each of wanted) await setExportBox("export_contact_list", scope, each.label, each.said, true);
        for (const label of every) {
          if (wanted.some((each) => String(each.label) === String(label))) continue;
          const box = seen(scope.getByRole("checkbox", { name: label }));
          if ((await box.count()) && (await box.first().isChecked())) await box.first().click();
        }
      }
      const control = await findControl(scope, /^\s*export\s*$/i);
      if (!control) unbound(where, `the export dialog on ${page.url()} has no "Export" button`);
      if (await isDisabled(control)) {
        const said = lined(await scope.innerText().catch(() => "")).filter((line) => /choose|required|at least/i.test(line));
        throw new Error(`${where} — "Export" is disabled in the export dialog on ${page.url()}; it says: ${said.join(" | ") || "nothing"}`);
      }
      const downloaded = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
      await control.click();
      await downloaded;
      await settle();
    },
    cancelExport: async () => {
      await userListOrUnbound("cancel_export");
      await inDialog("user-list.cancel_export", /^\s*cancel\s*$/i);
    },
    // The account the test named — by seed handle, persona, identifier, address or name —
    // opened from its name in the list.
    openUserProfile: async (input) => {
      const where = "user-list.open_user_profile";
      await userListOrUnbound("open_user_profile");
      const person = personOf(input);
      const links = seen(page.getByRole("table").first().getByRole("link"));
      const hrefs = await links.evaluateAll((each) => each.map((link) => link.getAttribute("href") ?? ""));
      let at = person?.id ? hrefs.findIndex((href) => href.replace(/[?#].*$/, "").endsWith(`/users/${person.id}`)) : -1;
      if (at < 0) {
        const name = typeof input === "string" ? input : givenText(input, ["name", "userName", "displayName"]);
        if (name) {
          const texts = (await links.allInnerTexts()).map((each) => each.trim().toLowerCase());
          at = texts.findIndex((each) => each === name.trim().toLowerCase());
        }
      }
      if (at < 0) {
        unbound(where, `no name in the list on ${page.url()} links to the account ${JSON.stringify(input)} (${hrefs.length} accounts listed)`);
      }
      await links.nth(at).click();
      await page.waitForURL((url) => /^\/users\/[^/]+$/.test(url.pathname), { timeout: 10000 }).catch(() => undefined);
      await ready();
    },
    // Each row as "Status | Account type | Name", one per line.
    userRow: async () => {
      const rows = await userListRows();
      if (!rows.length) return "";
      const at = await userListColumns();
      return rows.map((cells) => [cells[at.status], cells[at.type], cells[at.name]].filter(Boolean).join(" | ")).join("\n");
    },
    statusBadge: () => userListColumn("status"),
    accountType: () => userListColumn("type"),
    // The Administrator column beside the name it belongs to: "Robin Placeholder: Yes".
    adminCheck: async () => {
      const rows = await userListRows();
      if (!rows.length) return "";
      const at = await userListColumns();
      return rows.map((cells) => `${cells[at.name] ?? ""}: ${cells[at.admin] ?? ""}`).join("\n");
    },
    // The dialog's words while it is open; closed (cancelled, exported, never opened), nothing.
    exportModal: async () => {
      if (await onUserList()) return "";
      return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
    },
    // "disabled" while Export cannot be pressed, nothing once it can. The dialog is opened
    // to look, as a person would.
    exportDisabledUntilSelection: async () => {
      const scope = await exportDialog("export_disabled_until_selection");
      const control = await findControl(scope, /^\s*export\s*$/i);
      if (!control) unbound("user-list.export_disabled_until_selection", `the export dialog on ${page.url()} has no "Export" button`);
      return (await isDisabled(control)) ? "disabled" : "";
    },
  };

  const userProfile: S.UserProfilePage = {
    ...profileOfUserId,
    ...(readingsOfRefusedProfile as Pick<S.UserProfilePage, (typeof PROFILE_READINGS)[number]>),
    open: (params) => go("/users/:userId", params as unknown as Record<string, string>),
    // An account the reader may not see, or none by that identifier: the "Page not found"
    // screen, read whole; a profile that opened reads as nothing.
    notFoundPage: async () => ((await notFoundShown()) ? mainText() : ""),
  };

  const { reactivateAccount: _selfHasNoReactivate, toggleAdminPermission: _selfHasNoAdmin, permissionsLabel: _selfHasNoPermissions, adminCheckbox: _selfHasNoAdminBox, ...selfProfile } =
    profileScreen("user-profile-self", "/users/me");
  void _selfHasNoReactivate;
  void _selfHasNoAdmin;
  void _selfHasNoPermissions;
  void _selfHasNoAdminBox;
  const userProfileSelf: S.UserProfileSelfPage = {
    ...selfProfile,
    open: () => go("/users/me"),
    // Signed out, /users/me answers with the "Page not found" screen (or, once, a redirect
    // to /sign-in): that refusal is read back; the profile itself reads as nothing.
    signInRequired: () => refusalShown(),
  };

  // ---------------------------------------------------------------- the profile picture

  // Walked signed in (as the administrator and as a vendor): the profile says "No profile
  // picture has been added." or shows an image "Your current profile picture" (its address
  // /api/files/<id>?type=blob). "Edit profile" opens "Edit your details", whose first group,
  // "Profile picture (optional)", carries the rule "A JPEG or PNG image, up to 10 MB. A
  // picture wider or taller than 500 pixels is made smaller to fit, keeping its proportions.
  // Anyone can see your profile picture, including people who are not signed in." and a
  // "Choose a profile picture" button, which opens no file chooser (click, Enter or Space),
  // so choosing a picture fails, naming that button (see offerFile). A stored picture is shown as "Your current profile
  // picture"; refusals are alerts in the group. Readings read what the page shows and never
  // press "Save changes": saving is userProfileSelf.saveChanges, which a test calls itself.
  const PICKER_GROUP = /^\s*(profile picture|logo)\b/i;
  const PICKER_BUTTON = /^\s*choose (a |a different )?(profile picture|logo)\s*$/i;
  const CURRENT_PICTURE = /^\s*your current profile picture\s*$|current logo/i;
  const pickerGroup = (): Locator => seen(page.getByRole("group", { name: PICKER_GROUP })).first();

  async function onPicker(member: string): Promise<void> {
    const where = `file-image-picker.${member}`;
    const at = new URL(page.url());
    // On an organization's screens the picker is the logo's, and those screens are not
    // served; reading the profile's picture instead would answer a different question.
    if (originOf(page.url()) === originOf(baseURL) && /^\/organizations(\/|$)/.test(at.pathname)) {
      unbound(where, `the browser is on ${at.pathname}, an organization screen, where the picker would be the logo's; ${NOBODY_SIGNS_IN}`);
    }
    const onProfile = originOf(page.url()) === originOf(baseURL) && /^\/(users\/[^/]+|sign-up\/complete)$/.test(at.pathname);
    if (!onProfile) await go("/users/me");
    await ready();
    const why = await whyNotHere();
    if (why) unbound(where, `/users/me did not open as a screen at ${page.url()}: ${why.replace(/\n+/g, " ")}; the picture picker is offered on one's own profile once signed in`);
    await seen(page.getByText(/^\s*status:/i).or(page.getByRole("group", { name: PICKER_GROUP })))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
  }

  // The picker as drawn on the edit form, opened with "Edit profile" when it is not up.
  async function pickerShown(member: string): Promise<Locator> {
    const where = `file-image-picker.${member}`;
    await onPicker(member);
    if (!(await pickerGroup().count())) {
      const edit = await findControl(page, /^\s*edit profile\s*$/i);
      if (edit && !(await isDisabled(edit))) {
        await edit.click();
        await settle();
        await pickerGroup().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      }
    }
    if (!(await pickerGroup().count())) {
      unbound(where, `signed in, opened ${page.url()} and pressed "Edit profile" where offered; no "Profile picture" group is drawn; it offers ${await offered()}`);
    }
    return pickerGroup();
  }

  // The address of the stored picture as the page draws it, or nothing when it holds none.
  async function storedPictureAddress(member: string): Promise<string> {
    await onPicker(member);
    const image = seen(page.getByRole("img", { name: CURRENT_PICTURE }));
    if (!(await image.count())) return "";
    return (await image.first().getAttribute("src")) ?? "";
  }

  async function storedPictureSize(member: string, side: "width" | "height"): Promise<string> {
    const src = await storedPictureAddress(member);
    if (!src) return "";
    const size = await page.evaluate(async (href) => {
      const image = new Image();
      image.src = new URL(href, window.location.href).href;
      await image.decode().catch(() => undefined);
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, src);
    return size[side] ? String(size[side]) : "";
  }

  const fileImagePicker: S.FileImagePickerPage = {
    open: () => go("/users/me"),
    chooseImage: async (input) => {
      await pickerShown("choose_image");
      await offerFile("file-image-picker.choose_image", PICKER_BUTTON, input);
    },
    imageAddress: () => storedPictureAddress("image_address"),
    currentImage: () => storedPictureAddress("current_image"),
    // The preview of a picture chosen and not yet saved, by what it says it shows.
    chosenImagePreview: async () => {
      await onPicker("chosen_image_preview");
      const preview = seen(page.getByRole("img", { name: /^\s*preview of\b/i }));
      if (!(await preview.count())) return "";
      return (await preview.first().getAttribute("alt"))?.trim() ?? "";
    },
    // The rule the picker states against its button, on the edit form.
    onlyJpegAndPngOffered: async () => {
      const group = await pickerShown("only_jpeg_and_png_offered");
      const button = seen(group.getByRole("button", { name: PICKER_BUTTON })).first();
      if (await button.count()) {
        const described = await button.evaluate((element) =>
          (element.getAttribute("aria-describedby") ?? "")
            .split(/\s+/)
            .filter(Boolean)
            .map((id) => document.getElementById(id)?.innerText ?? "")
            .join("\n"),
        );
        if (described.trim()) return described.trim();
      }
      return (await paragraphs(group)).filter((words) => /jpe?g|png/i.test(words)).join("\n");
    },
    // The refusal the picker draws in its group, as it stands; none reads as nothing.
    rejectedImageError: async () => {
      await onPicker("rejected_image_error");
      if (!(await pickerGroup().count())) return "";
      const alerts = seen(pickerGroup().getByRole("alert"));
      return (await alerts.allInnerTexts()).map((words) => words.trim()).filter(Boolean).join("\n");
    },
    // The stored picture asked for with no session (no cookie, no credentials): its type when
    // it is answered, nothing when it is refused or there is no picture.
    imageReadableWhenSignedOut: async () => {
      const src = await storedPictureAddress("image_readable_when_signed_out");
      if (!src) return "";
      const answer = await page.evaluate(async (href) => {
        const response = await fetch(new URL(href, window.location.href).href, { credentials: "omit" });
        return { ok: response.ok, type: response.headers.get("content-type") ?? "" };
      }, src);
      return answer.ok ? answer.type || "answered" : "";
    },
    storedImageWidth: () => storedPictureSize("stored_image_width", "width"),
    storedImageHeight: () => storedPictureSize("stored_image_height", "height"),
  };

  // ---------------------------------------------------------------- the signed-in person's notices

  // A section of one's own account: /users/me?tab=… or /users/<own id>?tab=…. The client sends
  // a vendor still to complete a profile on to /sign-up/complete from here too.
  function accountSection(pageId: string, route: string) {
    const screen = signedInScreen(pageId, route);
    const on = async (member: string): Promise<void> => {
      await screen.on(member);
      if (new URL(page.url()).pathname === "/sign-up/complete") {
        throw new Error(
          `${pageId}.${member} — ${route} sent this person on to ${page.url()} ("Complete Your Profile"): the account has still to complete its profile, and its account screens are not shown to it until then`,
        );
      }
    };
    return { ...screen, on };
  }

  // Walked signed in: "Notifications" over "Notifications are sent to <address>. If this is
  // wrong, correct it on your profile." and one box, "Email me when new opportunities are
  // posted". Pressing the box changes nothing — it stays as it was, no dialog opens and
  // nothing is sent to the service — so no unsubscribe dialog is ever shown.
  function noticesScreen(pageId: string, route: string) {
    const notices = accountSection(pageId, route);
    async function noticesTab(member: string): Promise<void> {
      await notices.on(member);
      const tab = seen(page.getByRole("tab", { name: /notifications/i }));
      if (await tab.count()) {
        await tab.first().click();
        await settle();
      }
    }
    async function noticesBox(member: string): Promise<Locator> {
      await noticesTab(member);
      const box = seen(page.getByRole("checkbox", { name: NOTICES_BOX }).or(page.getByRole("switch", { name: NOTICES_BOX })));
      if (!(await box.count())) unbound(notices.where(member), `no new-opportunities box on ${page.url()}; it offers ${await offered()}`);
      return box.first();
    }
    return {
      open: (params?: Record<string, string>) => notices.open(params),
      toggleNewOpportunityNotifications: async (input?: unknown) => {
        const where = notices.where("toggle_new_opportunity_notifications");
        const box = await noticesBox("toggle_new_opportunity_notifications");
        const wanted = boxWanted(input, NOTICE_KEYS);
        if (await isDisabled(box)) throw new Error(`${where} — the new-opportunities box is disabled on ${page.url()}`);
        const was = await box.isChecked();
        if (wanted !== undefined && was === wanted) return;
        await box.click();
        await settle();
        // A box that did not move and asked nothing has not done what was pressed.
        if ((await box.isChecked()) === was && !(await dialog().count())) {
          throw new Error(`${where} — pressing "Email me when new opportunities are posted" on ${page.url()} left it ${was ? "ticked" : "unticked"}, and no dialog opened`);
        }
      },
      confirmUnsubscribe: async () => {
        await noticesTab("confirm_unsubscribe");
        await inDialog(notices.where("confirm_unsubscribe"), /unsubscribe|confirm|^\s*yes\s*$/i);
      },
      cancelUnsubscribe: async () => {
        await noticesTab("cancel_unsubscribe");
        await inDialog(notices.where("cancel_unsubscribe"), /^\s*(cancel|no)\s*$/i);
      },
      newOpportunitiesCheckbox: async () => ((await (await noticesBox("new_opportunities_checkbox")).isChecked()) ? "checked" : "unchecked"),
      notificationEmailAddress: async () => {
        await noticesTab("notification_email_address");
        const found = /[^\s@]+@[^\s@]+\.[^\s@]+/.exec(await mainText());
        return found ? found[0].replace(/[.,;]+$/, "") : "";
      },
      unsubscribeModal: async () => {
        await noticesTab("unsubscribe_modal");
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
    };
  }
  const userProfileSelfNotifications: S.UserProfileSelfNotificationsPage = noticesScreen("user-profile-self-notifications", "/users/me?tab=notifications");

  // Walked signed in: /users/me?tab=notifications&unsubscribe opens on the Notifications
  // section ("Notifications are sent to <address>. If this address is wrong, correct it on
  // your profile." and the "Email me when new opportunities are posted" box). To an account
  // that receives those emails (test-vendor-1, box ticked) it also opens a dialog, "Stop
  // emails about new opportunities?", saying "You are signed in as <name>. <address> will no
  // longer be emailed when new opportunities are posted." with "Keep receiving them" and
  // "Unsubscribe"; "Keep receiving them" closes it and leaves the box ticked. To an account
  // that does not receive them (the administrator, box unticked) no dialog opens, and the
  // readings report that empty. Signed out the address redirects to /sign-in, which
  // sign_in_required reads, and the readings read that refusal as nothing shown.
  function unsubscribeLanding(): S.NotificationUnsubscribeLandingPage {
    const pageId = "notification-unsubscribe-landing";
    const route = "/users/me?tab=notifications&unsubscribe";
    const notices = noticesScreen(pageId, route);
    // True once the section is drawn, after giving the dialog its moment to open over it.
    const reached = async (): Promise<boolean> => {
      await ready();
      if (await whyNotHere()) return false;
      await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      return true;
    };
    const inConfirmation = async (member: string, name: RegExp, what: string): Promise<void> => {
      const where = `${pageId}.${member}`;
      if (!(await reached())) unbound(where, `${route} did not open (${await whyNotHere()})`);
      if (!(await dialog().count())) {
        throw new Error(
          `${where} — signed in and opened ${page.url()}: no "Stop emails about new opportunities?" dialog opened, so there is no "${what}" to press (the dialog is shown only to an account whose "Email me when new opportunities are posted" box is ticked)`,
        );
      }
      await press(where, name, dialog());
      await settle();
    };
    return {
      open: () => go(route),
      confirmUnsubscribe: () => inConfirmation("confirm_unsubscribe", /^\s*unsubscribe\s*$/i, "Unsubscribe"),
      cancelUnsubscribe: () => inConfirmation("cancel_unsubscribe", /^\s*(keep receiving( them)?|cancel)\s*$/i, "Keep receiving them"),
      unsubscribeConfirmation: async () => {
        if (!(await reached())) return "";
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
      confirmationNamesSignedInAddress: async () => {
        if (!(await reached())) return "";
        if (!(await dialog().count())) return "";
        const found = /[^\s@]+@[^\s@]+\.[^\s@]+/.exec(await dialog().innerText());
        return found ? found[0].replace(/[.,;]+$/, "") : "";
      },
      resolvesToSignedInPerson: async () => {
        if (!(await reached())) return "";
        return notices.notificationEmailAddress();
      },
      signInRequired: () => refusalShown(),
    } as S.NotificationUnsubscribeLandingPage;
  }

  // ---------------------------------------------------------------- the signed-in person's capabilities

  // Walked signed in as a vendor: "Capabilities" over "Tick each capability you have. Your
  // choices are saved as you make them, and you may leave them all unticked." and a list
  // named "Capabilities", one item per capability: a box named for it ("Agile Coaching")
  // and a "Show description of Agile Coaching" button, which turns into "Hide description of
  // …" and draws the description as a paragraph under it. Ticking or unticking a box saves
  // it at once and says so in a status line ("Saved. DevOps Engineering is recorded as a
  // capability you hold." / "… is no longer recorded."). The same section is drawn at
  // /users/<own id>?tab=capabilities. A public sector account's profile has no such section,
  // and the administrator is shown another account's profile without it.
  const CAPABILITY_KEYS = ["capability", "name", "title", "label", "capabilityName"];
  const escapeText = (words: string): string => words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function capabilitiesScreen(pageId: string, route: string) {
    const screen = accountSection(pageId, route);
    const list = (): Locator => seen(page.getByRole("list", { name: /^\s*capabilities\s*$/i })).first();
    // True when the list is drawn. An action needs it and reports unbound without it; a
    // reading of a section that opened without it is the empty answer.
    async function onList(member: string, needed: boolean): Promise<boolean> {
      await screen.on(member);
      await list().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      if (await list().count()) return true;
      if (needed) {
        unbound(
          screen.where(member),
          `signed in, opened ${page.url()}: it draws "${await firstHeading()}" and no list of capabilities to tick (walked as a vendor the list is there; a public sector account's profile has no Capabilities section, and another account's profile is drawn to the administrator without one)`,
        );
      }
      return false;
    }
    const capabilityOf = (input: unknown): string => (typeof input === "string" ? input : givenText(input, CAPABILITY_KEYS)).trim();
    async function boxFor(member: string, input: unknown): Promise<Locator> {
      const name = capabilityOf(input);
      if (!name) unbound(screen.where(member), `the input names no capability (looked for ${CAPABILITY_KEYS.join(", ")}; given ${JSON.stringify(input)})`);
      const box = seen(list().getByRole("checkbox", { name: new RegExp(`^\\s*${escapeText(name)}\\s*$`, "i") }));
      if (!(await box.count())) {
        const names = await seen(list().getByRole("checkbox")).evaluateAll((boxes) =>
          boxes.map((element) => element.getAttribute("aria-label") ?? (element as HTMLInputElement).labels?.[0]?.innerText ?? ""),
        );
        unbound(screen.where(member), `no capability named "${name}" on ${page.url()}; it lists ${names.filter(Boolean).join(", ") || "none"}`);
      }
      return box.first();
    }
    async function boxNames(onlyTicked: boolean): Promise<string[]> {
      const boxes = seen(list().getByRole("checkbox"));
      const out: string[] = [];
      for (let i = 0; i < (await boxes.count()); i++) {
        const box = boxes.nth(i);
        if (onlyTicked && !(await box.isChecked())) continue;
        const item = box.locator("xpath=ancestor::li[1]");
        const first = lined(await item.innerText().catch(() => ""))[0] ?? "";
        out.push(first);
      }
      return out.filter(Boolean);
    }
    return {
      open: (params?: Record<string, string>) => screen.open(params),
      toggleCapability: async (input?: unknown) => {
        const where = screen.where("toggle_capability");
        await onList("toggle_capability", true);
        const box = await boxFor("toggle_capability", input);
        if (await isDisabled(box)) throw new Error(`${where} — the box for "${capabilityOf(input)}" is disabled on ${page.url()}`);
        const was = await box.isChecked();
        const wanted = boxWanted(input, ["held", "selected", "ticked", "has"]);
        if (wanted !== undefined && wanted === was) return;
        await box.click();
        // The choice is saved as it is made, and the status line says so.
        await seen(page.getByRole("status").filter({ hasText: /saved|could not|failed|error/i }))
          .first()
          .waitFor({ state: "visible", timeout: 10000 })
          .catch(() => undefined);
        await settle();
        if ((await box.isChecked()) === was) {
          const said = (await page.getByRole("status").allInnerTexts().catch(() => [])).join(" ").trim();
          throw new Error(`${where} — pressing "${capabilityOf(input)}" on ${page.url()} left it ${was ? "ticked" : "unticked"}${said ? `; it says: ${said}` : ""}`);
        }
      },
      expandCapabilityDescription: async (input?: unknown) => {
        const where = screen.where("expand_capability_description");
        await onList("expand_capability_description", true);
        const name = capabilityOf(input);
        const of = name ? escapeText(name) : ".+";
        const shown = seen(list().getByRole("button", { name: new RegExp(`^\\s*hide description of ${of}\\s*$`, "i") }));
        if (name && (await shown.count())) return;
        const toggle = seen(list().getByRole("button", { name: new RegExp(`^\\s*show description of ${of}\\s*$`, "i") }));
        if (!(await toggle.count())) unbound(where, `no "Show description of ${name || "…"}" button on ${page.url()}`);
        await toggle.first().click();
        await settle();
      },
      // One line per capability the section lists, in its order.
      capabilityRow: async () => ((await onList("capability_row", false)) ? (await boxNames(false)).join("\n") : ""),
      // The capabilities whose boxes are ticked, one per line; none ticked reads as nothing.
      capabilityChecked: async () => ((await onList("capability_checked", false)) ? (await boxNames(true)).join("\n") : ""),
      // The descriptions drawn open, one per line; none open reads as nothing.
      capabilityDescription: async () => {
        if (!(await onList("capability_description", false))) return "";
        return (await paragraphs(list())).join("\n");
      },
    };
  }
  const userProfileSelfCapabilities: S.UserProfileSelfCapabilitiesPage = capabilitiesScreen("user-profile-self-capabilities", "/users/me?tab=capabilities");
  const userProfileCapabilities: S.UserProfileCapabilitiesPage = capabilitiesScreen("user-profile-capabilities", "/users/:userId?tab=capabilities");

  // ---------------------------------------------------------------- the signed-in person's policies and terms

  // Walked signed in: "Policies, Terms & Agreements" with "Privacy policy" ("Read the Digital
  // Marketplace privacy policy", "You agreed to this policy when your account was created."),
  // "Terms and conditions" ("Read the Digital Marketplace terms and conditions", "You agreed
  // to the terms and conditions on <date>", or "You last agreed …" for the vendor whose
  // agreement was reset) and "Program terms" (a link for each of Code With Us, Sprint With Us
  // and Team With Us). Nothing on it asks anyone to accept updated terms, the reset vendor
  // included: no warning, no button and no dialog.
  function legalScreen(pageId: string, route: string) {
    const legal = accountSection(pageId, route);
    const APP_TERMS = /^\s*read the .*terms and conditions\s*$/i;
    const PROGRAM_TERMS = /(code|sprint|team) with us terms/i;
    async function between(member: string, from: RegExp, to: RegExp): Promise<string> {
      await legal.on(member);
      const lines = await textLines();
      const start = lines.findIndex((line) => from.test(line));
      if (start < 0) return "";
      const end = lines.findIndex((line, i) => i > start && to.test(line));
      return lines.slice(start, end > start ? end : undefined).join("\n");
    }
    return {
      open: (params?: Record<string, string>) => legal.open(params),
      openAppTerms: async () => {
        await legal.on("open_app_terms");
        const link = seen(page.getByRole("link", { name: APP_TERMS }));
        if (!(await link.count())) unbound(legal.where("open_app_terms"), `no "Read the … terms and conditions" link on ${page.url()}; it offers ${await offered()}`);
        await link.first().click();
        await settle();
      },
      acceptUpdatedTerms: async () => {
        await legal.on("accept_updated_terms");
        const button = seen(page.getByRole("button", { name: /accept|agree/i }));
        if (!(await button.count())) {
          unbound(legal.where("accept_updated_terms"), `${page.url()} offers no control to accept updated terms (walked signed in as the vendor whose agreement was reset, it says "You last agreed to terms and conditions on …" and offers only links); it offers ${await offered()}`);
        }
        if (await isDisabled(button.first())) throw new Error(`${legal.where("accept_updated_terms")} — the accept control is disabled on ${page.url()}`);
        await button.first().click();
        await settle();
      },
      confirmAcceptUpdatedTerms: async () => {
        await legal.on("confirm_accept_updated_terms");
        await inDialog(legal.where("confirm_accept_updated_terms"), /accept|agree|confirm|^\s*yes\s*$/i);
      },
      privacyPolicy: () => between("privacy_policy", /^privacy policy$/i, /^terms and conditions$/i),
      appTermsLink: async () => {
        await legal.on("app_terms_link");
        return hrefOf(page, APP_TERMS);
      },
      // Only the affirmative "You agreed to the terms and conditions on <date>". Walked signed
      // in as the vendor who never agreed, the section says "You have not agreed to the terms
      // and conditions." and the vendor whose agreement was reset reads "You last agreed to
      // terms and conditions on …"; neither is a standing acceptance, so both read as nothing.
      acceptedOnNotice: async () => {
        await legal.on("accepted_on_notice");
        return linesMatching(/^\s*you agreed to (the )?terms/i);
      },
      termsUpdatedWarning: async () => {
        await legal.on("terms_updated_warning");
        return linesMatching(/(terms|conditions)[^.]*\b(updated|changed)\b|\b(updated|new) terms\b|must (accept|agree)/i);
      },
      programTermsLinks: async () => {
        await legal.on("program_terms_links");
        const links = seen(page.getByRole("link", { name: PROGRAM_TERMS }));
        const out: string[] = [];
        for (let i = 0; i < (await links.count()); i++) out.push((await links.nth(i).innerText()).trim());
        return out.join("\n");
      },
      acceptUpdatedTermsModal: async () => {
        await legal.on("accept_updated_terms_modal");
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
    };
  }

  // ---------------------------------------------------------------- the vendor's dashboard

  // Walked signed in as vendors with and without proposals (and as public sector staff and
  // the administrator), /dashboard is "Dashboard" over "You are signed in as <name>." and
  // nothing else: no proposals, no tables, no controls. A vendor still to complete a profile
  // is sent on to /sign-up/complete instead.
  const vendorDash = signedInScreen("proposal-vendor-dashboard", "/dashboard");
  async function vendorDashShown(member: string): Promise<boolean> {
    await vendorDash.on(member);
    return new URL(page.url()).pathname !== "/sign-up/complete";
  }
  async function vendorDashPress(member: string, name: RegExp): Promise<void> {
    const where = vendorDash.where(member);
    if (!(await vendorDashShown(member))) {
      unbound(where, `/dashboard sent this person on to ${page.url()} ("Complete Your Profile") instead of showing a dashboard`);
    }
    const control = seen(page.getByRole("tab", { name }).or(page.getByRole("button", { name })).or(page.getByRole("link", { name })));
    if (!(await control.count())) {
      unbound(where, `signed in, /dashboard at ${page.url()} reads only "${(await mainText()).replace(/\n+/g, " / ")}" and offers no control named ${name}`);
    }
    await control.first().click();
    await settle();
  }
  // Each reading answers empty when the dashboard shows no proposals (it draws none for
  // anybody) or when the page sent the person on to complete a profile.
  async function vendorDashRows(member: string): Promise<string> {
    if (!(await vendorDashShown(member))) return "";
    return (await tableRows()).join("\n");
  }
  const proposalVendorDashboard: S.ProposalVendorDashboardPage = {
    open: () => vendorDash.open(),
    showMyProposals: () => vendorDashPress("show_my_proposals", /my proposals/i),
    showOrgProposals: () => vendorDashPress("show_org_proposals", /organi[sz]ation.*proposals|team proposals/i),
    myProposalsTable: () => vendorDashRows("my_proposals_table"),
    orgProposalsTable: () => vendorDashRows("org_proposals_table"),
    proposalStatus: async () => {
      if (!(await vendorDashShown("proposal_status"))) return "";
      return (await columnOf(/^status$/i)).join("\n");
    },
    emptyMyProposalsMessage: async () => {
      if (!(await vendorDashShown("empty_my_proposals_message"))) return "";
      return linesMatching(/\bno\b.*proposals|haven.t .*proposal|have not .*proposal/i);
    },
    emptyOrgProposalsMessage: async () => {
      if (!(await vendorDashShown("empty_org_proposals_message"))) return "";
      return linesMatching(/\bno\b.*(organi[sz]ation|team).*proposals|no proposals .*organi[sz]ation/i);
    },
  };

  // ---------------------------------------------------------------- choosing a program
  //
  // /opportunities/create, to the administrator and public sector staff: "Create an
  // opportunity" over one region per program, each its name, a sentence, "Maximum budget:
  // <amount>" and a "Create a <program> opportunity" link to that program's form. A vendor
  // is shown "Page not found" there.
  const programSelect = signedInScreen("opportunity-program-select", "/opportunities/create");
  async function programRegions(member: string): Promise<Locator> {
    await programSelect.on(member);
    return seen(page.getByRole("main").getByRole("region"));
  }
  async function chooseProgram(member: string, program: string): Promise<void> {
    await programSelect.on(member);
    await press(programSelect.where(member), new RegExp(`^\\s*create an? ${program} opportunity\\s*$`, "i"));
    await ready();
  }
  const opportunityProgramSelect: S.OpportunityProgramSelectPage = {
    open: () => programSelect.open(),
    chooseCodeWithUs: () => chooseProgram("choose_code_with_us", "Code With Us"),
    chooseSprintWithUs: () => chooseProgram("choose_sprint_with_us", "Sprint With Us"),
    chooseTeamWithUs: () => chooseProgram("choose_team_with_us", "Team With Us"),
    // One block per program, its lines joined; blocks separated by a blank line.
    programCard: async () => {
      const regions = await programRegions("program_card");
      const out: string[] = [];
      for (let i = 0; i < (await regions.count()); i++) out.push(lined(await regions.nth(i).innerText()).join("\n"));
      return out.join("\n\n");
    },
    // "Code With Us: Up to $70,000", one line per program.
    maxBudget: async () => {
      const regions = await programRegions("max_budget");
      const out: string[] = [];
      for (let i = 0; i < (await regions.count()); i++) {
        const lines = lined(await regions.nth(i).innerText());
        const budget = lines.find((line) => /^maximum budget\b/i.test(line));
        if (budget) out.push(`${lines[0]}: ${budget.replace(/^maximum budget:?\s*/i, "")}`);
      }
      return out.join("\n");
    },
  };

  // ---------------------------------------------------------------- reading term and definition

  // A value this target draws as a term over its definition ("Proposal deadline" /
  // "December 1, 2026 at 4:00 p.m. Pacific time"); a term the screen does not carry reads
  // as nothing.
  async function definitionOf(term: RegExp): Promise<string> {
    await ready();
    return page
      .getByRole("main")
      .evaluate(
        (main, [source, flags]) => {
          const wanted = new RegExp(source, flags);
          for (const dt of Array.from(main.querySelectorAll("dt"))) {
            if (!wanted.test((dt as HTMLElement).innerText.trim())) continue;
            let next = dt.nextElementSibling;
            while (next && next.tagName.toLowerCase() !== "dd") next = next.nextElementSibling;
            return next ? (next as HTMLElement).innerText.trim() : "";
          }
          return "";
        },
        [term.source, term.flags] as const,
      )
      .catch(() => "");
  }

  // "Opportunity ID: <id>", drawn on both the public page and the management screen.
  async function shownIdentifier(): Promise<string> {
    const line = (await textLines()).find((one) => /^opportunity id:/i.test(one));
    if (line) return line.replace(/^opportunity id:\s*/i, "").trim();
    return /^\/opportunities\/[^/]+\/([^/?#]+)/.exec(new URL(page.url()).pathname)?.[1] ?? "";
  }

  // ---------------------------------------------------------------- a Code With Us opportunity's page
  //
  // /opportunities/code-with-us/:opportunityId: "Code With Us opportunity" over the title,
  // then Status, Proposal deadline, Reward, Location, Remote work, Published, Created by and
  // Last changed by as terms and definitions (Created by and Last changed by only to staff),
  // "Opportunity ID: <id>", a "Watch this opportunity" checkbox under "Watching sends you an
  // email whenever this opportunity changes." (to anybody signed in; it says "You are no
  // longer watching this opportunity." and the like once pressed), to staff who may manage it
  // a "Manage this opportunity" link, and the Description (with its Attachments), Skills, Key
  // dates ("Assignment date: <date>", ...) and Addenda sections. Walked as the administrator,
  // a public sector employee and a vendor on the seeded published, draft and awarded
  // opportunities: it offers no way to start a proposal, and an awarded opportunity names no
  // successful proponent anywhere on it.
  //
  // A draft is shown only to whoever may see it: the seeded draft of another staff member
  // opens for the administrator (its Status "Draft") and answers a vendor and the other
  // public sector employee "Page not found". That answer, for an opportunity known to exist
  // (a seeded one, or one this run has already seen open), is the page withholding it from
  // this reader, so every reading of it is empty. For an identifier nobody has seen open it
  // cannot be told apart from a page that never existed, and is reported unbound.
  const cwuView = signedInScreen(CWU_VIEW, "/opportunities/code-with-us/:opportunityId");
  const knownOpportunities = new Set<string>(
    Object.values(seed.opportunities as unknown as Record<string, { id?: string }>)
      .map((one) => one.id ?? "")
      .filter(Boolean),
  );
  const cwuIdShown = (): string => /^\/opportunities\/code-with-us\/([^/?#]+)/.exec(new URL(page.url()).pathname)?.[1] ?? "";
  // True when the page is shown; false when it is withheld from this reader.
  async function onCwuView(member: string): Promise<boolean> {
    const refused = await refusalShown();
    const id = cwuIdShown();
    if (!refused) {
      if (id) knownOpportunities.add(id);
      return true;
    }
    if (id && knownOpportunities.has(id)) {
      noteRefusal(`${cwuView.where(member)} — the opportunity ${id}, which exists, answered ${actingId()} with ${refused.replace(/\n+/g, " ")}`);
      return false;
    }
    return unbound(cwuView.where(member), `the opportunity did not open at ${page.url()}: ${refused}`);
  }
  // The same, for an action: there is nothing to press on a page that was withheld.
  async function cwuViewShown(member: string): Promise<void> {
    if (!(await onCwuView(member))) {
      unbound(cwuView.where(member), `${page.url()} answered ${actingId()} "Page not found", so there is nothing on it to press`);
    }
  }
  async function cwuViewTerm(member: string, term: RegExp): Promise<string> {
    if (!(await onCwuView(member))) return "";
    return definitionOf(term);
  }
  async function cwuKeyDate(member: string, label: RegExp): Promise<string> {
    if (!(await onCwuView(member))) return "";
    const region = seen(page.getByRole("region", { name: /^key dates$/i }));
    if (!(await region.count())) return "";
    for (const line of lined(await region.first().innerText())) {
      const found = label.exec(line);
      if (found) return line.slice(found.index + found[0].length).replace(/^\s*:\s*/, "").trim();
    }
    return "";
  }
  const CWU_VIEW_WALKED =
    "walked as the administrator, a public sector employee and a vendor on the seeded published, draft and awarded Code With Us opportunities";
  const opportunityCwuView: S.OpportunityCwuViewPage = {
    open: (params) => go("/opportunities/code-with-us/:opportunityId", params as unknown as Record<string, string>),
    // "Watch this opportunity", a checkbox; pressing it saves at once. An input that says
    // which way it should end up is honoured, and a box already that way is left alone.
    toggleWatch: async (input) => {
      const where = cwuView.where("toggle_watch");
      await cwuViewShown("toggle_watch");
      const box = seen(page.getByRole("main").getByRole("checkbox", { name: /^\s*watch( this opportunity)?\s*$/i })).first();
      await box.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      if (!(await box.count())) {
        unbound(where, `${CWU_VIEW_WALKED}: the page offers a signed-in person a "Watch this opportunity" box, and on ${page.url()} as ${actingId()} there is none; it offers ${await offered()}`);
      }
      if (await isDisabled(box)) throw new Error(`${where} — the "Watch this opportunity" box is disabled on ${page.url()}`);
      const was = await box.isChecked();
      const wanted = boxWanted(input, ["watch", "watching", "watched", "subscribed"]);
      if (wanted !== undefined && wanted === was) return;
      await box.click();
      await settle();
      await page
        .waitForFunction(
          (before) => {
            const found = Array.from(document.querySelectorAll("main input[type=checkbox]")) as HTMLInputElement[];
            return found.some((one) => one.checked !== before);
          },
          was,
          { timeout: 5000 },
        )
        .catch(() => undefined);
    },
    startProposal: async () => {
      await cwuViewShown("start_proposal");
      const control = await findControl(page, /^\s*(start|create|submit|write)( a)? proposal\s*$/i);
      if (!control) unbound(cwuView.where("start_proposal"), `${CWU_VIEW_WALKED}: signed in as a vendor on the seeded published opportunity (proposal deadline in 2030), the page offers only "Watch this opportunity" and no way to start a proposal, and /opportunities/code-with-us/:opportunityId/proposals/create answers "Page not found" to the vendor; on ${page.url()} it offers ${await offered()}`);
      await control.click();
      await settle();
    },
    opportunityIdentifier: async () => {
      if (!(await onCwuView("opportunity_identifier"))) return "";
      return shownIdentifier();
    },
    status: () => cwuViewTerm("status", /^status$/i),
    publishedDate: async () => {
      const shown = await cwuViewTerm("published_date", /^published$/i);
      return /^not yet published$/i.test(shown) ? "" : shown;
    },
    createdByName: () => cwuViewTerm("created_by_name", /^created by$/i),
    lastChangedByName: () => cwuViewTerm("last_changed_by_name", /^last changed by$/i),
    proposalDeadline: () => cwuViewTerm("proposal_deadline", /^proposal deadline$/i),
    assignmentDate: () => cwuKeyDate("assignment_date", /^assignment date\b/i),
    startDate: () => cwuKeyDate("start_date", /^start date\b/i),
    reward: () => cwuViewTerm("reward", /^reward$/i),
    // The Addenda section's entries; "No addenda have been added." is none.
    addenda: async () => {
      if (!(await onCwuView("addenda"))) return "";
      const region = seen(page.getByRole("region", { name: /^addenda$/i }));
      if (!(await region.count())) return "";
      return lined(await region.first().innerText())
        .slice(1)
        .filter((line) => !/^no addenda have been added\.?$/i.test(line))
        .join("\n");
    },
    // An awarded opportunity's page names no winner (seen on the seeded awarded one), so
    // these read as nothing on a page that opened.
    successfulProponent: async () => {
      if (!(await onCwuView("successful_proponent"))) return "";
      const said = (await textLines()).find((line) => /awarded to\s+\S/i.test(line));
      return said ? (/awarded to\s+(.+)$/i.exec(said)?.[1] ?? "").replace(/\.$/, "").trim() : definitionOf(/^(successful proponent|awarded to)$/i);
    },
    successfulProponentContactDetails: async () => {
      if (!(await onCwuView("successful_proponent_contact_details"))) return "";
      return awardDetail(`${CWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL);
    },
    successfulProponentScore: async () => {
      if (!(await onCwuView("successful_proponent_score"))) return "";
      return awardDetail(`${CWU_VIEW}.successful_proponent_score`, SCORE_DETAIL);
    },
  };

  // ---------------------------------------------------------------- managing a Code With Us opportunity
  //
  // /opportunities/code-with-us/:opportunityId/edit, to the administrator and to public
  // sector staff for an opportunity they may manage (another staff member's draft answers
  // "Page not found"): "Manage a Code With Us opportunity" over the title, "Status: <state>"
  // and "Opportunity ID: <id>", an "Opportunity actions" group, and the sections as links
  // under "Opportunity sections" (?tab=summary, opportunity, addenda, history). The actions
  // offered follow the state: a draft offers "Publish" (the administrator) or "Submit for
  // review" (its own author on the staff), and "Delete", with no "Edit" because its
  // ?tab=opportunity form is already editable; another staff member's draft answers a
  // public sector employee "Page not found"; a
  // published opportunity only "Edit"; an awarded one nothing. "Edit" goes to
  // ?tab=opportunity, the form itself, with "Save changes" and "Cancel". Publishing and deleting ask first ("Publish opportunity",
  // "Delete opportunity").
  const CWU_EDIT = "opportunity-cwu-edit";
  const cwuManage = signedInScreen(CWU_EDIT, "/opportunities/code-with-us/:opportunityId/edit");
  const CWU_MANAGE_WALKED =
    "walked as the administrator and as a public sector employee on the seeded draft, published, awarded and with-three-proposals Code With Us opportunities and on ones just saved and published";
  function actionsGroup(): Locator {
    return seen(page.getByRole("group", { name: /^opportunity actions$/i })).first();
  }
  // The management screen's own address, without the section it is on.
  function manageAddress(): string {
    const found = /^(\/opportunities\/[^/]+\/[^/?#]+\/edit)/.exec(new URL(page.url()).pathname);
    return found ? baseURL + found[1] : "";
  }
  async function toSection(member: string, tab: string): Promise<boolean> {
    await cwuManage.on(member);
    const link = seen(page.getByRole("navigation", { name: /opportunity sections/i }).getByRole("link", { name: new RegExp(`^\\s*${tab}\\s*$`, "i") }));
    if (!(await link.count())) return false;
    const href = (await link.first().getAttribute("href")) ?? "";
    if (!new URL(page.url()).search.includes(`tab=${tab.toLowerCase()}`)) {
      if (href) await visit(href);
      else await link.first().click();
      await ready();
    }
    return true;
  }
  async function sectionText(member: string, tab: string): Promise<string> {
    if (!(await toSection(member, tab))) return "";
    const region = seen(page.getByRole("main").getByRole("region", { name: new RegExp(`^${tab}$`, "i") }));
    return (await region.count()) ? lined(await region.first().innerText()).join("\n") : "";
  }
  // The Opportunity section is the form itself, and a form's text never carries what is in
  // its boxes: "Title(required)", "Location(required)", "Description (required)" and the rest
  // are labels whose values live in the fields. So the section is read as its text followed
  // by one "<label>: <value>" line for each field in it — text boxes and areas, the chosen
  // answer of each radio group ("Is remote work acceptable? (required): Yes"), ticked boxes
  // and the chosen options of a list ("Skills (required): Backend Development, …").
  async function formSectionText(member: string, tab: string): Promise<string> {
    const text = await sectionText(member, tab);
    if (!text) return text;
    const region = seen(page.getByRole("main").getByRole("region", { name: new RegExp(`^${tab}$`, "i") })).first();
    const fields = await region.evaluate((root) => {
      const words = (node: Element | null | undefined) => ((node as HTMLElement | null)?.innerText ?? node?.textContent ?? "").replace(/\s+/g, " ").trim();
      const named = (element: Element): string => {
        const labelled = element.getAttribute("aria-labelledby");
        if (labelled) {
          const said = labelled.split(/\s+/).map((id) => words(document.getElementById(id))).filter(Boolean).join(" ");
          if (said) return said;
        }
        const labels = (element as HTMLInputElement).labels;
        if (labels && labels.length) {
          // A label that wraps its list would otherwise read out every option in it.
          const label = labels[0].cloneNode(true) as Element;
          for (const inner of Array.from(label.querySelectorAll("select, textarea, input"))) inner.remove();
          const said = (label.textContent ?? "").replace(/\s+/g, " ").trim();
          if (said) return said;
        }
        const own = (element.getAttribute("aria-label") ?? "").trim();
        if (own) return own;
        // The skills list is a hidden list of options behind a "Skills (required)" button that
        // opens it; its name is the label that button is named by, less the button's own text.
        for (let at = element.parentElement, up = 0; at && at !== root && up < 4; at = at.parentElement, up++) {
          const opener = Array.from(at.querySelectorAll("button")).find((one) => one.getAttribute("aria-haspopup") === "listbox" && one.hasAttribute("aria-labelledby"));
          if (!opener) continue;
          const said = (opener.getAttribute("aria-labelledby") ?? "")
            .split(/\s+/)
            .map((id) => document.getElementById(id))
            .filter((one) => one && !opener.contains(one))
            .map((one) => words(one))
            .filter(Boolean)
            .join(" ");
          if (said) return said;
        }
        return "";
      };
      const out: string[] = [];
      const groupsDone = new Set<Element>();
      for (const element of Array.from(root.querySelectorAll("input, textarea, select"))) {
        if (element instanceof HTMLSelectElement) {
          const chosen = Array.from(element.selectedOptions).map((option) => option.text.trim()).filter(Boolean);
          if (chosen.length) out.push(`${named(element)}: ${chosen.join(", ")}`);
          continue;
        }
        const box = element as HTMLInputElement | HTMLTextAreaElement;
        const type = (box.getAttribute("type") ?? "text").toLowerCase();
        if (type === "hidden" || type === "file" || type === "button" || type === "submit") continue;
        if (type === "radio" || type === "checkbox") {
          let group: Element | null = box.parentElement;
          while (group && group !== root && !/^(radiogroup|group)$/.test(group.getAttribute("role") ?? "") && group.tagName !== "FIELDSET") group = group.parentElement;
          if (group === root) group = null;
          const groupName = group
            ? named(group) || words(group.querySelector("legend"))
            : "";
          if (type === "radio" && group) {
            if (groupsDone.has(group)) continue;
            groupsDone.add(group);
            const picked = Array.from(group.querySelectorAll("input")).filter((one) => one.type === "radio" && one.checked);
            out.push(`${groupName}: ${picked.map((one) => named(one)).join(", ")}`);
          } else if ((box as HTMLInputElement).checked) {
            out.push(groupName ? `${groupName}: ${named(box)}` : `${named(box)}: checked`);
          }
          continue;
        }
        if (!box.value) continue;
        out.push(`${named(box)}: ${box.value}`);
      }
      return out;
    });
    return [text, ...fields].join("\n");
  }
  async function manageAction(member: string, name: RegExp, confirm: RegExp | null): Promise<void> {
    const where = cwuManage.where(member);
    await cwuManage.on(member);
    if (!(await actionsGroup().count())) await toSection(member, "Summary");
    const group = actionsGroup();
    const control = (await group.count()) ? seen(group.getByRole("button", { name })).first() : null;
    if (!control || !(await control.count())) {
      const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
      const there = (await group.count()) ? (await group.getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ") : "nothing";
      unbound(where, `no control named ${name} among the opportunity's actions on ${page.url()} (${status}; the actions offered are ${there}); ${CWU_MANAGE_WALKED}`);
    }
    if (await isDisabled(control)) throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}`);
    await control.click();
    await settle();
    if (confirm) await confirmIfAsked(where, confirm);
    await ready();
  }
  // The form on ?tab=opportunity, filled from the input and saved.
  async function saveCwuDetails(member: string, input: unknown): Promise<void> {
    const where = cwuManage.where(member);
    if (!Object.keys(record(input)).length) return;
    await toCwuForm(member);
    await fillCwuForm(where, input);
    await press(where, /^\s*save changes\s*$/i);
    await confirmIfAsked(where, /^\s*(save|publish)( changes)?\s*$/i);
    await ready();
  }
  async function toCwuForm(member: string): Promise<void> {
    if (!(await toSection(member, "Opportunity"))) {
      unbound(cwuManage.where(member), `the management screen at ${page.url()} offers no "Opportunity" section; it offers ${await offered()}`);
    }
  }
  async function cwuFormDate(member: string, label: RegExp): Promise<string> {
    await toCwuForm(member);
    const box = await fieldLabelled(label, false);
    return box ? valueOf(box) : "";
  }
  async function summaryTerm(member: string, term: RegExp): Promise<string> {
    await cwuManage.on(member);
    if (!(await definitionOf(term))) await toSection(member, "Summary");
    return definitionOf(term);
  }
  // Views, watchers and proposals: a draft's summary says "Views, watchers and proposals are
  // counted once the opportunity is published." and a published one shows no count at all.
  // Looked for again on the running build: the Summary section of a published, lapsed,
  // in-processing or awarded opportunity carries only Proposal deadline, Reward, Published,
  // Created by and Last changed by, to the administrator and to the owning public sector
  // employee alike, and still none after the administrator ticked "Watch this opportunity"
  // on its page and came back; the sections offered are Summary, Opportunity, Addenda and
  // History, none of them a report; and the opportunity the screen loads from
  // /api/opportunities/code-with-us/:id carries no view, watcher or proposal count to show.
  const REPORTING_LOOKED =
    "looked again as the administrator and as the owning public sector employee on the seeded published, lapsed-with-three-proposals, in-processing and awarded Code With Us opportunities (and on the published one after the administrator ticked \"Watch this opportunity\" on its page): the Summary carries only Proposal deadline, Reward, Published, Created by and Last changed by, the only sections are Summary, Opportunity, Addenda and History, and the opportunity the screen loads from /api/opportunities/code-with-us/:id carries no view, watcher or proposal count";
  async function reportingCount(member: string, term: RegExp): Promise<string> {
    const shown = await summaryTerm(member, term);
    if (shown) return shown;
    if ((await textLines()).some((line) => /counted once the opportunity is published/i.test(line))) return "";
    return unbound(
      cwuManage.where(member),
      `the summary on ${page.url()} shows no ${term} count (it shows ${(await textLines()).filter((line) => !/^(summary|opportunity|addenda|history)$/i.test(line)).slice(0, 14).join(" / ")}); ${REPORTING_LOOKED}`,
    );
  }
  const opportunityCwuEdit: S.OpportunityCwuEditPage = {
    open: (params) => cwuManage.open(params as unknown as Record<string, string>),
    // "Edit" opens the form; whatever the input carries is entered and saved there. A draft
    // offers no "Edit": its ?tab=opportunity shows the form already editable, with "Save
    // changes", so it is edited in place.
    editDetails: async (input) => {
      const where = cwuManage.where("edit_details");
      await cwuManage.on("edit_details");
      if (!(await actionsGroup().count())) await toSection("edit_details", "Summary");
      const edit = (await actionsGroup().count()) ? seen(actionsGroup().getByRole("button", { name: /^\s*edit\s*$/i })).first() : null;
      if (edit && (await edit.count())) {
        await manageAction("edit_details", /^\s*edit\s*$/i, null);
      } else {
        await toCwuForm("edit_details");
        if (!(await findControl(page.getByRole("main"), /^\s*save changes\s*$/i))) {
          const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
          const there = (await actionsGroup().count()) ? (await actionsGroup().getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ") : "nothing";
          unbound(where, `no "Edit" among the opportunity's actions on ${page.url()} (${status}; the actions offered are ${there}), and its Opportunity section offers no "Save changes" to edit the form in place; ${CWU_MANAGE_WALKED}`);
        }
      }
      if (Object.keys(record(input)).length) {
        await fillCwuForm(where, input);
        await press(where, /^\s*save changes\s*$/i);
        await confirmIfAsked(where, /^\s*(save|publish)( changes)?\s*$/i);
        await ready();
      }
    },
    // Pressed from the Opportunity section, the form being submitted. The answer to an
    // incomplete draft ("This opportunity is incomplete …") is drawn inside whichever section
    // is open and is held only in the page, so it is left as it is for the readers; pressed
    // from the Summary section (where open() and a fresh save land) the alert went with that
    // section and opportunity_tab, which has to switch sections, could never see it.
    submitForReview: async (input) => {
      await saveCwuDetails("submit_for_review", input);
      await toSection("submit_for_review", "Opportunity");
      await manageAction("submit_for_review", /^\s*submit for review\s*$/i, /^\s*submit( for review| opportunity)?\s*$/i);
    },
    // "Publish" is offered to the administrator, on a draft or one under review. Anybody else
    // is offered no "Publish" (a public sector employee's own draft offers "Submit for
    // review" and "Delete") or not the screen at all, and that absence is the refusal. It is
    // logged and the action returns, so the test's own follow-up reading decides.
    publish: async (input) => {
      if (!actingMay(/^publish opportunity$/i)) {
        const where = cwuManage.where("publish");
        await ready();
        const why = await whyNotHere();
        if (why) {
          noteRefusal(`${where} — the management screen answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}`);
          return;
        }
        if (!(await actionsGroup().count())) await toSection("publish", "Summary");
        const control = (await actionsGroup().count()) ? seen(actionsGroup().getByRole("button", { name: /^\s*publish\s*$/i })).first() : null;
        if (!control || !(await control.count())) {
          const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
          const there = (await actionsGroup().count()) ? (await actionsGroup().getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ") : "nothing";
          noteRefusal(`${where} — no "Publish" among the opportunity's actions for ${actingId()} on ${page.url()} (${status}; the actions offered are ${there})`);
          return;
        }
      }
      await saveCwuDetails("publish", input);
      await manageAction("publish", /^\s*publish\s*$/i, /^\s*publish( opportunity)?\s*$/i);
    },
    cancelOpportunity: () => manageAction("cancel_opportunity", /^\s*cancel( opportunity)?\s*$/i, /^\s*cancel opportunity\s*$/i),
    deleteOpportunity: () => manageAction("delete_opportunity", /^\s*delete( opportunity)?\s*$/i, /^\s*delete( opportunity)?\s*$/i),
    addAddendum: async (input) => {
      const where = cwuManage.where("add_addendum");
      if (!(await toSection("add_addendum", "Addenda"))) {
        unbound(where, `the management screen at ${page.url()} offers no "Addenda" section (a draft has none); ${CWU_MANAGE_WALKED}`);
      }
      const add = await findControl(page.getByRole("main"), /^\s*add( an)? addend(um|a)\s*$/i);
      if (!add) {
        unbound(where, `the Addenda section on ${page.url()} offers no control to add an addendum, only "${(await sectionText("add_addendum", "Addenda")).replace(/\n/g, " / ")}"; ${CWU_MANAGE_WALKED}`);
      }
      await add.click();
      await settle();
      const words = givenText(input, ["addendum", "text", "description", "body", "content"]) || textOf(input);
      const box = seen(page.getByRole("textbox")).last();
      if (words && (await box.count())) await box.fill(words);
      await press(where, /^\s*(add|publish|save|submit)( addendum)?\s*$/i);
      await confirmIfAsked(where, /^\s*(add|publish|save|submit)( addendum)?\s*$/i);
    },
    addNote: async (input) => {
      const where = cwuManage.where("add_note");
      if (!(await toSection("add_note", "History"))) unbound(where, `the management screen at ${page.url()} offers no "History" section`);
      const add = await findControl(page.getByRole("main"), /^\s*add( a)? note\s*$/i);
      if (!add) {
        unbound(where, `the History section on ${page.url()} is a table of entries ("Date", "Entry", "By", "Note") with no control to add a note; ${CWU_MANAGE_WALKED}`);
      }
      await add.click();
      await settle();
      const words = givenText(input, ["note", "text", "body", "content"]) || textOf(input);
      const box = seen(page.getByRole("textbox")).last();
      if (words && (await box.count())) await box.fill(words);
      await press(where, /^\s*(add|save|submit)( note)?\s*$/i);
    },
    opportunityIdentifier: async () => {
      await cwuManage.on("opportunity_identifier");
      return shownIdentifier();
    },
    createdByName: () => summaryTerm("created_by_name", /^created by$/i),
    lastChangedByName: () => summaryTerm("last_changed_by_name", /^last changed by$/i),
    summaryTab: () => sectionText("summary_tab", "Summary"),
    opportunityTab: () => formSectionText("opportunity_tab", "Opportunity"),
    addendaTab: () => sectionText("addenda_tab", "Addenda"),
    historyTab: () => sectionText("history_tab", "History"),
    proposalsTab: async () => {
      if (await toSection("proposals_tab", "Proposals")) return sectionText("proposals_tab", "Proposals");
      return unbound(
        cwuManage.where("proposals_tab"),
        `the management screen at ${page.url()} offers only the sections ${(await seen(page.getByRole("navigation", { name: /opportunity sections/i }).getByRole("link")).allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ")}, and ?tab=proposals shows the summary; ${CWU_MANAGE_WALKED}`,
      );
    },
    reportingViews: () => reportingCount("reporting_views", /^views$/i),
    reportingWatchers: () => reportingCount("reporting_watchers", /^watchers$/i),
    reportingProposals: () => reportingCount("reporting_proposals", /^proposals$/i),
    proposalDeadline: () => cwuFormDate("proposal_deadline", /proposal\s*deadline/i),
    assignmentDate: () => cwuFormDate("assignment_date", /assignment\s*date/i),
    startDate: () => cwuFormDate("start_date", /^\s*start\s*date/i),
    completionDate: () => cwuFormDate("completion_date", /completion\s*date/i),
  };

  // ---------------------------------------------------------------- new-opportunity emails on the list
  //
  // /opportunities, to anybody signed in (seen as a vendor, a public sector employee and the
  // administrator): under the filters and the "Showing N opportunities" line, a region headed
  // "New opportunity emails" with one sentence and one button. Subscribed: "You are emailed
  // at <address> when new opportunities are posted." and "Stop emailing me about new
  // opportunities"; not: "You are not emailed when new opportunities are posted." and "Email
  // me about new opportunities". Pressing it saves at once and its status says so ("Saved.
  // You will no longer be emailed when new opportunities are posted."). A signed-out visitor
  // is shown the list with no such region, and that absence is the answer, read as nothing.
  // It stays shown at a phone's width (375 pixels).
  const OPTIN = "notification-optin-opportunity-list";
  const OPTIN_ON = /^\s*stop emailing me about new opportunities\s*$/i;
  const OPTIN_OFF = /^\s*email me about new opportunities\s*$/i;
  async function onOptinList(member: string): Promise<Locator | null> {
    if (new URL(page.url()).pathname !== "/opportunities" || originOf(page.url()) !== originOf(baseURL)) {
      await go("/opportunities");
    }
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(`${OPTIN}.${member}`, `/opportunities did not open at ${page.url()}: ${refused}`);
    // The list has loaded once it says how many it shows; the region follows the session.
    await seen(page.getByRole("main").getByText(/^showing \d+ opportunit/i))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
    const heading = page.getByRole("main").getByRole("heading", { name: /^\s*new opportunity emails\s*$/i });
    // A signed-in person's region comes with their account; a visitor's never comes.
    const signedIn = !!(actingAs as unknown as { signIn?: unknown } | null)?.signIn;
    await heading.first().waitFor({ state: "attached", timeout: signedIn ? 5000 : 1500 }).catch(() => undefined);
    if (!(await heading.count())) return null;
    // The filter's inner locator is looked for inside each region, so it starts from the page.
    const region = page
      .getByRole("main")
      .getByRole("region")
      .filter({ has: page.getByRole("heading", { name: /^\s*new opportunity emails\s*$/i }) });
    return (await region.count()) ? region.first() : heading.first().locator("xpath=..");
  }
  function optinButton(region: Locator): Locator {
    return region.getByRole("button", { name: /email(ing)? me about new opportunities/i }).first();
  }
  async function optinState(region: Locator): Promise<"checked" | "unchecked" | ""> {
    const button = optinButton(region);
    if (!(await button.count())) return "";
    const name = (await button.innerText()).trim();
    if (OPTIN_ON.test(name)) return "checked";
    if (OPTIN_OFF.test(name)) return "unchecked";
    return "";
  }
  // The region's heading, its sentence and its button, without the passing "Saved." status.
  async function optinWords(region: Locator): Promise<string> {
    const status = region.getByRole("status");
    const said = (await status.count()) ? lined(await status.first().innerText()) : [];
    return lined(await region.innerText())
      .filter((line) => !said.includes(line))
      .join("\n");
  }
  const optinList: S.NotificationOptinOpportunityListPage = {
    open: () => go("/opportunities"),
    toggleNewOpportunityNotifications: async (input) => {
      const where = `${OPTIN}.toggle_new_opportunity_notifications`;
      const region = await onOptinList("toggle_new_opportunity_notifications");
      if (!region) {
        unbound(where, `/opportunities shows ${actingId()} no "New opportunity emails" control; it is offered to a signed-in person (seen as a vendor, a public sector employee and the administrator), and a signed-out visitor has none to press`);
      }
      const button = optinButton(region);
      if (!(await button.count())) unbound(where, `the "New opportunity emails" region on ${page.url()} offers no button; it reads ${(await optinWords(region)).replace(/\n/g, " / ")}`);
      if (await isDisabled(button)) throw new Error(`${where} — "${(await button.innerText()).trim()}" is disabled on ${page.url()}`);
      const was = await optinState(region);
      const wanted = boxWanted(input, NOTICE_KEYS);
      if (wanted !== undefined && (was === "checked") === wanted) return;
      await button.click();
      await settle();
      const flipped = await page
        .waitForFunction(
          (before) => {
            const buttons = Array.from(document.querySelectorAll("main button")) as HTMLElement[];
            const one = buttons.find((b) => /email(ing)? me about new opportunities/i.test(b.innerText));
            if (!one) return false;
            const on = /stop emailing/i.test(one.innerText);
            return on !== (before === "checked");
          },
          was,
          { timeout: 10000 },
        )
        .then(() => true)
        .catch(() => false);
      if (!flipped) {
        const status = region.getByRole("status");
        const said = (await status.count()) ? (await status.first().innerText()).trim() : "";
        throw new Error(`${where} — pressing the "New opportunity emails" button on ${page.url()} left it ${was}${said ? `; it says "${said}"` : ""}`);
      }
    },
    notificationControl: async () => {
      const region = await onOptinList("notification_control");
      return region ? optinWords(region) : "";
    },
    // "checked" when the person is emailed about new opportunities, "unchecked" when not, as
    // the profile's own box reads; nothing when no control is shown.
    notificationControlState: async () => {
      const region = await onOptinList("notification_control_state");
      return region ? optinState(region) : "";
    },
    // The control as it is shown at a phone's width (375 pixels): its words when it is on
    // screen there, nothing when it is hidden. The window is put back as it was.
    notificationControlHiddenOnNarrowScreen: async () => {
      const before = page.viewportSize();
      await page.setViewportSize({ width: 375, height: before?.height ?? 800 });
      try {
        const region = await onOptinList("notification_control_hidden_on_narrow_screen");
        if (!region || !(await region.isVisible())) return "";
        return optinWords(region);
      } finally {
        if (before) await page.setViewportSize(before);
      }
    },
  };

  // ---------------------------------------------------------------- the attachment control
  //
  // On a Code With Us opportunity's form (?tab=opportunity of its management screen, and the
  // create form): an "Attachments" region with "Any type of file, up to 10 MB each." and
  // "Add attachment", which opens the file chooser. A stored attachment is a list item with
  // its name in a read-only "Attachment name" box ("Already stored, so its name cannot be
  // changed."), a "Download <name>" link to /api/files/<id>?type=blob and "Remove <name>". A
  // file just added is stored at once and is "New: <name>, <size>. Uploaded and attached to
  // this opportunity. …" with its "Download <name>" link, a "Name for <name> (optional)" box,
  // "Will be saved as: <name>" and "Remove <name>"; one over the
  // limit is "New: <name>, <size>." with the alert "<name> is too large to attach". Changes
  // are kept by the form's "Save changes" (or by the create form's own action). The Sprint
  // With Us and Team With Us forms answer "Page not found".
  const ATTACH = "file-attachment-control";
  function attachmentRegion(): Locator {
    return seen(page.getByRole("region", { name: /^attachments$/i })).first();
  }
  async function onAttachments(member: string): Promise<Locator> {
    const where = `${ATTACH}.${member}`;
    await ready();
    const pathname = new URL(page.url()).pathname;
    const wanted = attachmentsOf.opportunityId;
    if (wanted && !pathname.includes(wanted) && !/\/create$/.test(pathname)) {
      await go("/opportunities/:program/:opportunityId/edit?tab=opportunity", attachmentsOf);
    }
    const why = await whyNotHere();
    if (why) {
      unbound(where, `the form at ${page.url()} did not open: ${why.replace(/\n+/g, " ")}; the attachment control sits on an opportunity's form, offered only to the administrator and public sector staff, and ${NOBODY_SIGNS_IN}`);
    }
    if (!(await attachmentRegion().count()) || !(await findControl(attachmentRegion(), /^\s*add attachment\s*$/i))) {
      const manage = manageAddress();
      if (manage) await visit(`${manage}?tab=opportunity`);
    }
    const region = attachmentRegion();
    if (!(await region.count())) unbound(where, `no "Attachments" part on the form at ${page.url()}; it offers ${await offered()}`);
    return region;
  }
  function attachmentItems(region: Locator): Locator {
    return seen(region.getByRole("listitem"));
  }
  // Each row is judged by its words and by whether it carries a link to the stored file.
  async function itemsMatching(region: Locator, matches: (words: string, stored: boolean) => boolean): Promise<Locator[]> {
    const items = attachmentItems(region);
    const out: Locator[] = [];
    for (let i = 0; i < (await items.count()); i++) {
      const words = await items.nth(i).innerText().catch(() => "");
      const stored = await items
        .nth(i)
        .getByRole("link")
        .evaluateAll((links) => links.some((link) => (link.getAttribute("href") ?? "").includes("/api/files/")))
        .catch(() => false);
      if (matches(words, stored)) out.push(items.nth(i));
    }
    return out;
  }
  // A file just chosen is stored at once and its row, still worded "New: <name>, <size>.
  // Uploaded and attached to this opportunity. …", carries its "Download <name>" link to
  // /api/files/<id>; so a row with that link is stored whatever it says, and "new" (the
  // "Name for <name>" box, "Will be saved as") is its wording alone.
  const isNew = (words: string): boolean => /^\s*new:/im.test(words);
  const isStored = (words: string, stored: boolean): boolean => stored || !isNew(words);
  async function rowLines(rows: Locator[]): Promise<string> {
    const out: string[] = [];
    for (const row of rows) {
      const words = lined(await row.innerText().catch(() => ""));
      const box = row.getByRole("textbox");
      const value = (await box.count()) ? (await box.first().inputValue().catch(() => "")).trim() : "";
      out.push([...words, ...(value ? [value] : [])].join(" | "));
    }
    return out.join("\n");
  }
  // The row a test names: by the file's name, or the first of its kind.
  async function rowNamed(region: Locator, input: unknown, test: (words: string, stored: boolean) => boolean): Promise<Locator | null> {
    const name = givenText(input, ["file", "fileName", "name", "attachment", "from"]) || (typeof input === "string" ? input : "");
    const rows = await itemsMatching(region, test);
    if (name) {
      for (const row of rows) if ((await row.innerText().catch(() => "")).includes(name)) return row;
      for (const row of rows) {
        const box = row.getByRole("textbox");
        if ((await box.count()) && (await box.first().inputValue().catch(() => "")) === name) return row;
      }
      return null;
    }
    return rows[0] ?? null;
  }
  // Keeps the form's changes: "Save changes" on a saved opportunity. The create form keeps
  // them with its own action, so nothing is pressed there.
  async function saveAttachments(where: string): Promise<void> {
    if (/\/create$/.test(new URL(page.url()).pathname)) return;
    await press(where, /^\s*save changes\s*$/i);
    await confirmIfAsked(where, /^\s*(save|publish)( changes)?\s*$/i);
    await seen(page.getByRole("status").filter({ hasText: /saved/i }))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
    await ready();
  }
  async function storedLinks(region: Locator): Promise<string[]> {
    return seen(region.getByRole("link", { name: /^download\b/i }))
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""))
      .then((hrefs) => hrefs.filter((href) => href.includes("/api/files/")))
      .catch(() => [] as string[]);
  }
  const fileAttachmentControl: S.FileAttachmentControlPage = {
    open: async (params) => {
      attachmentsOf = { program: String(params?.program ?? ""), opportunityId: String(params?.opportunityId ?? "") };
      await page
        .goto(leniently("/opportunities/:program/:opportunityId/edit?tab=opportunity", params), { waitUntil: "domcontentloaded" })
        .catch(() => undefined);
      await ready();
    },
    // The file is stored as soon as it is chosen and listed as new with its download link;
    // a name typed for it is given when the form is saved, which the readers that need the
    // final name (attachment_address, download_attachment, the public list) do.
    addAttachment: async (input) => {
      await onAttachments("add_attachment");
      await addAttachmentFile(`${ATTACH}.add_attachment`, input);
    },
    renameNewAttachment: async (input) => {
      const where = `${ATTACH}.rename_new_attachment`;
      const region = await onAttachments("rename_new_attachment");
      const row = await rowNamed(region, record(input).file ?? record(input).from ?? undefined, isNew);
      if (!row) unbound(where, `no newly added attachment on ${page.url()} to rename; the list reads: ${(await rowLines(await itemsMatching(region, () => true))) || "nothing"}`);
      const box = row.getByRole("textbox", { name: /^name for\b/i });
      if (!(await box.count())) unbound(where, `the new attachment on ${page.url()} carries no "Name for …" box`);
      const to = givenText(input, ["to", "newName", "name", "value"]) || (typeof input === "string" ? input : "");
      await box.first().fill(to);
      await box.first().blur().catch(() => undefined);
      await settle();
    },
    removeNewAttachment: async (input) => {
      const where = `${ATTACH}.remove_new_attachment`;
      const region = await onAttachments("remove_new_attachment");
      const row = await rowNamed(region, input, isNew);
      if (!row) unbound(where, `no newly added attachment on ${page.url()} matches ${JSON.stringify(input)}`);
      await press(where, /^\s*remove\b/i, row);
    },
    removeExistingAttachment: async (input) => {
      const where = `${ATTACH}.remove_existing_attachment`;
      const region = await onAttachments("remove_existing_attachment");
      const row = await rowNamed(region, input, isStored);
      if (!row) unbound(where, `no stored attachment on ${page.url()} matches ${JSON.stringify(input)}; the list reads: ${(await rowLines(await itemsMatching(region, () => true))) || "nothing"}`);
      await press(where, /^\s*remove\b/i, row);
      await saveAttachments(where);
    },
    downloadAttachment: async (input) => {
      const where = `${ATTACH}.download_attachment`;
      let region = await onAttachments("download_attachment");
      if ((await itemsMatching(region, isNew)).length) {
        await saveAttachments(where);
        region = await onAttachments("download_attachment");
      }
      const row = await rowNamed(region, input, isStored);
      const link = row ? seen(row.getByRole("link", { name: /^download\b/i })).first() : null;
      if (!link || !(await link.count())) unbound(where, `no stored attachment with a "Download" link on ${page.url()} matches ${JSON.stringify(input)}`);
      const download = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await link.click();
      await download;
      await settle();
    },
    // The stored address of every attachment, saving a file only just added first.
    attachmentAddress: async () => {
      const where = `${ATTACH}.attachment_address`;
      let region = await onAttachments("attachment_address");
      if ((await itemsMatching(region, (words) => isNew(words) && !/too large/i.test(words))).length) {
        await saveAttachments(where);
        region = await onAttachments("attachment_address");
      }
      return (await storedLinks(region)).join("\n");
    },
    sizeLimitStatedBeforeChoosing: async () => {
      const region = await onAttachments("size_limit_stated_before_choosing");
      return lined(await region.innerText()).filter((line) => /\b\d+\s?(MB|KB|GB)\b.*\b(each|smaller|limit|up to)\b|\bup to \d+\s?(MB|KB|GB)\b/i.test(line) && !/^new:/i.test(line)).join("\n");
    },
    uploadRefusedForSize: async () => {
      const region = await onAttachments("upload_refused_for_size");
      const alerts = seen(region.getByRole("alert"));
      const out: string[] = [];
      for (let i = 0; i < (await alerts.count()); i++) out.push(...lined(await alerts.nth(i).innerText()));
      return out.join("\n");
    },
    newAttachmentRow: async () => rowLines(await itemsMatching(await onAttachments("new_attachment_row"), isNew)),
    existingAttachmentRow: async () =>
      rowLines(await itemsMatching(await onAttachments("existing_attachment_row"), isStored)),
    // What a stored attachment's name box says about changing it, and whether it can be.
    existingAttachmentNameReadOnly: async () => {
      const rows = await itemsMatching(await onAttachments("existing_attachment_name_read_only"), isStored);
      const out: string[] = [];
      for (const row of rows) {
        const box = row.getByRole("textbox").first();
        const locked = (await box.count())
          ? (await box.evaluate((element) => (element as HTMLInputElement).readOnly || (element as HTMLInputElement).disabled).catch(() => false))
          : false;
        const note = lined(await row.innerText()).find((line) => /cannot be changed|read.?only/i.test(line));
        if (locked || note) out.push(note ?? "read-only");
      }
      return out.join("\n");
    },
    // "Will be saved as: <name>" under each new attachment.
    originalExtensionRestored: async () => {
      const rows = await itemsMatching(await onAttachments("original_extension_restored"), isNew);
      const out: string[] = [];
      for (const row of rows) {
        const line = lined(await row.innerText()).find((one) => /^will be saved as:/i.test(one));
        if (line) out.push(line.replace(/^will be saved as:\s*/i, ""));
      }
      return out.join("\n");
    },
    // The message a name box is marked with, and any alert about a name; none reads as nothing.
    fileNameError: async () => {
      const region = await onAttachments("file_name_error");
      const out: string[] = [];
      const boxes = seen(region.getByRole("textbox"));
      for (let i = 0; i < (await boxes.count()); i++) {
        const said = await boxes
          .nth(i)
          .evaluate((element) => {
            if (element.getAttribute("aria-invalid") !== "true") return "";
            const ids = (element.getAttribute("aria-describedby") ?? element.getAttribute("aria-errormessage") ?? "").split(/\s+/).filter(Boolean);
            return ids.map((id) => document.getElementById(id)?.innerText ?? "").join("\n");
          })
          .catch(() => "");
        out.push(...lined(said));
      }
      const alerts = seen(region.getByRole("alert"));
      for (let i = 0; i < (await alerts.count()); i++) {
        const words = await alerts.nth(i).innerText();
        if (/name/i.test(words) && !/too large/i.test(words)) out.push(...lined(words));
      }
      return [...new Set(out)].join("\n");
    },
    // The "Remove <name>" controls the attachments carry; none reads as nothing.
    removeControlHiddenWhenNotRemovable: async () => {
      const region = await onAttachments("remove_control_hidden_when_not_removable");
      return (await seen(region.getByRole("button", { name: /^remove\b/i })).allInnerTexts().catch(() => [] as string[]))
        .map((one) => one.trim())
        .join("\n");
    },
    // The Attachments list under the public page's Description, saving the form first when
    // it still holds a file only just added. "No attachments" reads as nothing.
    attachmentListOnPublicView: async () => {
      const where = `${ATTACH}.attachment_list_on_public_view`;
      if (!PROGRAM_NAME[attachmentsOf.program] || !attachmentsOf.opportunityId) {
        unbound(where, `no opportunity was opened (program and opportunityId; given ${JSON.stringify(attachmentsOf)})`);
      }
      const region = attachmentRegion();
      if ((await region.count()) && (await itemsMatching(region, (words) => isNew(words) && !/too large/i.test(words))).length) {
        await saveAttachments(where);
      }
      await go(`/opportunities/${attachmentsOf.program}/:opportunityId`, { opportunityId: attachmentsOf.opportunityId });
      const refused = await refusalShown();
      if (refused) unbound(where, `the opportunity's page did not open at ${page.url()}: ${refused}`);
      const list = seen(page.getByRole("list", { name: /^attachments$/i }));
      if (!(await list.count())) return "";
      return lined(await list.first().innerText()).join("\n");
    },
  };

  const surface: S.Surface = {
    signIn,
    signOut,

    home,

    opportunityDashboard,

    opportunityList,

    opportunityProgramSelect,

    opportunityCwuCreate,

    opportunityCwuView,

    opportunityCwuEdit,

    opportunityCwuComplete: absent<S.OpportunityCwuCompletePage>(
      "opportunity-cwu-complete",
      "/opportunities/code-with-us/:opportunityId/complete",
      behindSession("/opportunities/code-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    opportunitySwuCreate: absent<S.OpportunitySwuCreatePage>(
      "opportunity-swu-create",
      "/opportunities/sprint-with-us/create",
      `${behindSession("/opportunities/sprint-with-us/create")}; looked for again as the administrator and as a public sector employee: /opportunities/create offers "Create a Sprint With Us opportunity", and following that link lands on "Page not found" too; rechecked once more signed in as the administrator and as a public sector employee: following the link in the page still lands on "Page not found", as do /opportunities/sprint-with-us, the seeded at-consensus Sprint With Us opportunity's view and edit screens, and the guessed spellings /opportunities/swu/create and /sprint-with-us/create, and the Code With Us create form offers no program chooser that would reach a Sprint With Us form; walked again on this build signed in as the administrator: the dashboard's "Create an opportunity" leads to /opportunities/create, whose "Create a Sprint With Us opportunity" link lands on "Page not found" at /opportunities/sprint-with-us/create, as it does for a public sector employee, and the administrator's "All opportunities" table lists Code With Us opportunities only; looked for once more signed in as the administrator, both by following the chooser's link from the dashboard and by address: still "Page not found", as are /opportunities, /opportunities/sprint-with-us and /organizations, and the administrator's header offers only Dashboard, Users, Content, My profile and Sign out`,
      [
        "save_draft",
        "submit_for_review",
        "publish",
        "add_phase",
        "add_team_question",
        "set_evaluation_panel",
        "field_error",
        "score_weight_error",
        "evaluation_question_fields",
      ],
    ),

    opportunitySwuView: opportunityView<S.OpportunitySwuViewPage>(
      SWU_VIEW,
      "/opportunities/sprint-with-us/:opportunityId",
      "sprint-with-us",
      {
        // "$500,000" over "Value"; the phases under "Phases of Work" on the Details tab, down
        // to the note closing their required capabilities.
        totalMaxBudget: () => figureAbove(`${SWU_VIEW}.total_max_budget`, /^value$/i),
        phases: () => detailsSection(`${SWU_VIEW}.phases`, /^phases of work$/i, /^\* capabilities are claimed/i),
        assignmentDate: () => figureAbove(`${SWU_VIEW}.assignment_date`, /^assignment date$/i),
        scopeSection: () => sectionBehind(`${SWU_VIEW}.scope_section`, "Scope & Contract"),
        successfulProponentContactDetails: () =>
          awardDetail(`${SWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${SWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunitySwuEdit: {
      ...unboundMembers(
        "opportunity-swu-edit",
        behindSignIn(
          "the Sprint With Us management screen, with its evaluator-only tabs and its ?tab=opportunity form",
          'shows the "Not Found" screen (tried with the seeded closed Sprint With Us opportunity)',
        ),
        ["instructions_tab", "evaluation_tab", "proposal_deadline", "assignment_date"],
      ),
      ...absent<S.OpportunitySwuEditPage>(
      "opportunity-swu-edit",
      "/opportunities/sprint-with-us/:opportunityId/edit",
      behindSession("/opportunities/sprint-with-us/:opportunityId/edit"),
      [
        "edit_details",
        "submit_for_review",
        "publish",
        "cancel_opportunity",
        "delete_opportunity",
        "add_addendum",
        "add_note",
        "edit_evaluation_panel",
        "finalize_question_consensuses",
        "start_team_scenario",
        "opportunity_identifier",
        "created_by_name",
        "last_changed_by_name",
        "summary_tab",
        "opportunity_tab",
        "addenda_tab",
        "history_tab",
        "proposals_tab",
        "team_questions_tab",
        "code_challenge_tab",
        "team_scenario_tab",
        "evaluation_panel_tab",
        "consensus_tab",
        "evaluation_question_fields",
      ],
    ),
    } as S.OpportunitySwuEditPage,

    opportunitySwuComplete: absent<S.OpportunitySwuCompletePage>(
      "opportunity-swu-complete",
      "/opportunities/sprint-with-us/:opportunityId/complete",
      behindSession("/opportunities/sprint-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    opportunityTwuCreate: absent<S.OpportunityTwuCreatePage>(
      "opportunity-twu-create",
      "/opportunities/team-with-us/create",
      `${behindSession("/opportunities/team-with-us/create")}; looked for again as the administrator and as a public sector employee: /opportunities/create offers "Create a Team With Us opportunity", and following that link lands on "Page not found" too; rechecked once more signed in as the administrator and as a public sector employee: following the link in the page still lands on "Page not found", as do /opportunities/team-with-us and the guessed spellings /opportunities/twu/create and /team-with-us/create, and the Code With Us create form offers no program chooser that would reach a Team With Us form; walked again on this build signed in as the administrator: the dashboard's "Create an opportunity" leads to /opportunities/create, whose "Create a Team With Us opportunity" link lands on "Page not found" at /opportunities/team-with-us/create, as it does for a public sector employee, and the administrator's "All opportunities" table lists Code With Us opportunities only; looked for once more signed in as the administrator, both by following the chooser's link from the dashboard and by address: still "Page not found", as are /opportunities, /opportunities/team-with-us and /organizations, and the administrator's header offers only Dashboard, Users, Content, My profile and Sign out`,
      [
        "save_draft",
        "submit_for_review",
        "publish",
        "add_resource",
        "add_resource_question",
        "set_evaluation_panel",
        "field_error",
        "score_weight_error",
        "evaluation_question_fields",
      ],
    ),

    opportunityTwuView: opportunityView<S.OpportunityTwuViewPage>(
      TWU_VIEW,
      "/opportunities/team-with-us/:opportunityId",
      "team-with-us",
      {
        // "$300,000" over "Maximum Contract Value"; the resources sought under "Service Areas"
        // with their allocation, down to "Required Skills".
        maxBudget: () => figureAbove(`${TWU_VIEW}.max_budget`, /^maximum contract value$/i),
        resources: () => detailsSection(`${TWU_VIEW}.resources`, /^service areas$/i, /^required skills$/i),
        assignmentDate: () => figureAbove(`${TWU_VIEW}.assignment_date`, /^contract award date$/i),
        startDate: () => figureAbove(`${TWU_VIEW}.start_date`, /^contract start date$/i),
        // The header shows no completion date; the "Key Dates" section does.
        completionDate: () => keyDate(`${TWU_VIEW}.completion_date`, /^contract completion date( \(anticipated\))?/i),
        termsSection: () => sectionBehind(`${TWU_VIEW}.terms_section`, "Competition Rules"),
        successfulProponentContactDetails: () =>
          awardDetail(`${TWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${TWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunityTwuEdit: {
      ...unboundMembers(
        "opportunity-twu-edit",
        behindSignIn(
          "the Team With Us management screen, with its evaluator-only tabs, its offered changes of state and its ?tab=opportunity form",
          'shows the "Not Found" screen (tried with the seeded closed Team With Us opportunity)',
        ),
        [
          "instructions_tab",
          "evaluation_tab",
          "offered_state_changes",
          "proposal_deadline",
          "assignment_date",
          "start_date",
          "completion_date",
        ],
      ),
      ...absent<S.OpportunityTwuEditPage>(
      "opportunity-twu-edit",
      "/opportunities/team-with-us/:opportunityId/edit",
      behindSession("/opportunities/team-with-us/:opportunityId/edit"),
      [
        "edit_details",
        "submit_for_review",
        "publish",
        "cancel_opportunity",
        "delete_opportunity",
        "add_addendum",
        "edit_evaluation_panel",
        "finalize_question_consensuses",
        "opportunity_identifier",
        "created_by_name",
        "last_changed_by_name",
        "summary_tab",
        "opportunity_tab",
        "addenda_tab",
        "history_tab",
        "proposals_tab",
        "resource_questions_tab",
        "challenge_tab",
        "evaluation_panel_tab",
        "consensus_tab",
        "evaluation_question_fields",
      ],
    ),
    } as S.OpportunityTwuEditPage,

    opportunityTwuComplete: absent<S.OpportunityTwuCompletePage>(
      "opportunity-twu-complete",
      "/opportunities/team-with-us/:opportunityId/complete",
      behindSession("/opportunities/team-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    scheduledTransitionTrigger,

    proposalCwuCreate: {
      ...unboundMembers(
        "proposal-cwu-create",
        behindSignIn("the Code With Us proposal form", 'shows the "Not Found" screen (tried with the seeded published Code With Us opportunity)'),
        ["field_errors_by_field"],
      ),
      ...absent<S.ProposalCwuCreatePage>(
      "proposal-cwu-create",
      "/opportunities/code-with-us/:opportunityId/proposals/create",
      `${behindSession("/opportunities/code-with-us/:opportunityId/proposals/create")}; looked for once more signed in as a vendor: the seeded published Code With Us opportunity's public page (proposal deadline June 1, 2030) shows its details, key dates and addenda but no link or button at all, the vendor's header offers only Dashboard, My profile and Sign out, the dashboard shows only a greeting, and /opportunities/code-with-us/:opportunityId/proposals/create, /proposals/code-with-us/create?opportunityId=<id> and /opportunities/:opportunityId all answer "Page not found" for that opportunity`,
      [
        "choose_proponent_individual",
        "choose_proponent_organization",
        "add_attachment",
        "save_draft",
        "submit_proposal",
        "accept_program_terms",
        "accept_app_terms",
        "cancel",
        "field_error",
        "opportunity_summary",
        "terms_modal",
        "submit_disabled_until_terms_accepted",
      ],
    ),
    } as S.ProposalCwuCreatePage,

    proposalCwuEdit: absent<S.ProposalCwuEditPage>(
      "proposal-cwu-edit",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit",
      behindSession("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit"),
      [
        "start_editing",
        "save_changes",
        "save_changes_and_submit",
        "submit_proposal",
        "withdraw_proposal",
        "delete_proposal",
        "add_attachment",
        "remove_attachment",
        "proposal_identifier",
        "opportunity_identifier",
        "proposal_tab",
        "status",
        "submitted_at",
        "score",
        "rank",
        "available_actions",
      ],
    ),

    proposalCwuView: absent<S.ProposalCwuViewPage>(
      "proposal-cwu-view",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId",
      behindSession("/opportunities/code-with-us/:opportunityId/proposals/:proposalId"),
      [
        "enter_score",
        "award_proposal",
        "disqualify_proposal",
        "proposal_identifier",
        "proposal_tab",
        "history_tab",
        "proponent",
        "score",
        "rank",
        "export_link",
      ],
    ),

    proposalCwuExportOne: absent<S.ProposalCwuExportOnePage>(
      "proposal-cwu-export-one",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export",
      behindSession("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal"],
    ),

    proposalCwuExportAll: absent<S.ProposalCwuExportAllPage>(
      "proposal-cwu-export-all",
      "/opportunities/code-with-us/:opportunityId/proposals/export",
      behindSession("/opportunities/code-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalSwuCreate: {
      ...unboundMembers(
        "proposal-swu-create",
        behindSignIn("the Sprint With Us proposal form", 'shows the "Not Found" screen (tried with the seeded closed Sprint With Us opportunity)'),
        ["team_member_choices", "phase_team_sections", "phase_requirements", "cost_errors"],
      ),
      ...absent<S.ProposalSwuCreatePage>(
      "proposal-swu-create",
      "/opportunities/sprint-with-us/:opportunityId/proposals/create",
      behindSession("/opportunities/sprint-with-us/:opportunityId/proposals/create"),
      [
        "choose_organization",
        "add_phase_team_member",
        "set_scrum_master",
        "set_phase_proposed_cost",
        "answer_team_question",
        "add_reference",
        "add_attachment",
        "save_draft",
        "submit_proposal",
        "accept_program_terms",
        "accept_app_terms",
        "field_error",
        "capability_gap_error",
        "budget_exceeded_error",
        "unqualified_organization_notice",
        "pending_team_member",
      ],
    ),
    } as S.ProposalSwuCreatePage,

    proposalSwuEdit: {
      ...unboundMembers(
        "proposal-swu-edit",
        behindSignIn("a Sprint With Us proposal's edit screen", 'shows the "Not Found" screen (tried with the seeded Sprint With Us proposals)'),
        [
          "choose_organization",
          "add_phase_team_member",
          "set_scrum_master",
          "submission_refusal",
          "field_error",
          "organization",
        ],
      ),
      ...absent<S.ProposalSwuEditPage>(
      "proposal-swu-edit",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit",
      behindSession("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit"),
      [
        "start_editing",
        "save_changes",
        "save_changes_and_submit",
        "submit_proposal",
        "withdraw_proposal",
        "delete_proposal",
        "proposal_identifier",
        "opportunity_identifier",
        "proposal_tab",
        "scoresheet_tab",
        "status",
        "anonymous_proponent_name",
        "total_score",
        "rank",
      ],
    ),
    } as S.ProposalSwuEditPage,

    proposalSwuView: {
      ...unboundMembers(
        "proposal-swu-view",
        behindSignIn("a Sprint With Us proposal's evaluation screen", 'shows the "Not Found" screen (tried with the seeded Sprint With Us proposals)'),
        ["history_entries", "rank", "offered_score_actions"],
      ),
      ...absent<S.ProposalSwuViewPage>(
      "proposal-swu-view",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId",
      behindSession("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId"),
      [
        "score_code_challenge",
        "screen_in_to_team_scenario",
        "screen_out_from_team_scenario",
        "score_team_scenario",
        "award_proposal",
        "disqualify_proposal",
        "proposal_identifier",
        "proposal_tab",
        "team_questions_tab",
        "code_challenge_tab",
        "team_scenario_tab",
        "history_tab",
        "wrong_stage_error",
        "questions_score",
        "challenge_score",
        "scenario_score",
        "price_score",
        "total_score",
      ],
    ),
    } as S.ProposalSwuViewPage,

    proposalSwuExportOne: absent<S.ProposalSwuExportOnePage>(
      "proposal-swu-export-one",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export",
      behindSession("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal", "anonymous_proponent_name"],
    ),

    proposalSwuExportAll: absent<S.ProposalSwuExportAllPage>(
      "proposal-swu-export-all",
      "/opportunities/sprint-with-us/:opportunityId/proposals/export",
      behindSession("/opportunities/sprint-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalTwuCreate: {
      ...unboundMembers(
        "proposal-twu-create",
        behindSignIn("the Team With Us proposal form", 'shows the "Not Found" screen (tried with the seeded closed Team With Us opportunity)'),
        ["team_member_choices"],
      ),
      ...absent<S.ProposalTwuCreatePage>(
      "proposal-twu-create",
      "/opportunities/team-with-us/:opportunityId/proposals/create",
      behindSession("/opportunities/team-with-us/:opportunityId/proposals/create"),
      [
        "choose_organization",
        "add_team_member_for_resource",
        "set_hourly_rate",
        "answer_resource_question",
        "add_attachment",
        "save_draft",
        "submit_proposal",
        "accept_program_terms",
        "accept_app_terms",
        "field_error",
        "service_area_error",
        "unqualified_organization_notice",
      ],
    ),
    } as S.ProposalTwuCreatePage,

    proposalTwuEdit: {
      ...unboundMembers(
        "proposal-twu-edit",
        behindSignIn("a Team With Us proposal's edit screen", 'shows the "Not Found" screen (tried with the seeded Team With Us proposals)'),
        ["choose_organization", "add_team_member_for_resource", "submission_refusal", "field_error", "organization"],
      ),
      ...absent<S.ProposalTwuEditPage>(
      "proposal-twu-edit",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit",
      behindSession("/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit"),
      [
        "start_editing",
        "save_changes",
        "save_changes_and_submit",
        "submit_proposal",
        "withdraw_proposal",
        "delete_proposal",
        "proposal_identifier",
        "opportunity_identifier",
        "proposal_tab",
        "scoresheet_tab",
        "status",
        "anonymous_proponent_name",
        "total_score",
        "rank",
      ],
    ),
    } as S.ProposalTwuEditPage,

    proposalTwuView: {
      ...unboundMembers(
        "proposal-twu-view",
        behindSignIn("a Team With Us proposal's evaluation screen", 'shows the "Not Found" screen (tried with the seeded Team With Us proposals)'),
        ["history_entries", "rank", "offered_score_actions"],
      ),
      ...absent<S.ProposalTwuViewPage>(
      "proposal-twu-view",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId",
      behindSession("/opportunities/team-with-us/:opportunityId/proposals/:proposalId"),
      [
        "score_resource_questions",
        "screen_in_to_challenge",
        "screen_out_from_challenge",
        "score_challenge",
        "award_proposal",
        "disqualify_proposal",
        "proposal_identifier",
        "proposal_tab",
        "resource_questions_tab",
        "challenge_tab",
        "history_tab",
        "wrong_stage_error",
        "questions_score",
        "challenge_score",
        "price_score",
        "total_score",
      ],
    ),
    } as S.ProposalTwuViewPage,

    proposalTwuExportOne: absent<S.ProposalTwuExportOnePage>(
      "proposal-twu-export-one",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export",
      behindSession("/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal"],
    ),

    proposalTwuExportAll: absent<S.ProposalTwuExportAllPage>(
      "proposal-twu-export-all",
      "/opportunities/team-with-us/:opportunityId/proposals/export",
      behindSession("/opportunities/team-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalVendorDashboard,

    proposalListStub,

    organizationList,

    organizationCreate: absent<S.OrganizationCreatePage>(
      "organization-create",
      "/organizations/create",
      behindSession("/organizations/create"),
      ["create_organization", "cancel", "change_logo", "field_error", "submit_disabled_until_valid"],
    ),

    organizationEdit,

    organizationSwuTerms: absent<S.OrganizationSwuTermsPage>(
      "organization-swu-terms",
      "/organizations/:orgId/sprint-with-us-terms-and-conditions",
      behindSession("/organizations/:orgId/sprint-with-us-terms-and-conditions"),
      ["accept_terms", "cancel", "terms_body", "accepted_on_notice"],
    ),

    organizationTwuTerms: absent<S.OrganizationTwuTermsPage>(
      "organization-twu-terms",
      "/organizations/:orgId/team-with-us-terms-and-conditions",
      behindSession("/organizations/:orgId/team-with-us-terms-and-conditions"),
      ["accept_terms", "cancel", "terms_body", "accepted_on_notice"],
    ),

    organizationUserMemberships: absent<S.OrganizationUserMembershipsPage>(
      "organization-user-memberships",
      "/users/:userId?tab=organizations",
      sectionRedrawn("/users/:userId?tab=organizations", "Organizations"),
      [
        "approve_invitation",
        "reject_invitation",
        "leave_organization",
        "create_organization",
        "open_organization",
        "owned_organizations_table",
        "affiliated_organizations_table",
        "pending_badge",
        "team_member_count",
        "swu_qualified_mark",
        "empty_owned_message",
        "empty_affiliated_message",
        "accept_confirmation",
        "decline_confirmation",
      ],
    ),

    userSignIn,

    userSignUpChooseAccount,

    userSignUpComplete,

    userSignOut,

    userNotice,

    userList: userListScreen,

    userProfile,

    userProfileCapabilities,

    userProfileNotifications: noticesScreen("user-profile-notifications", "/users/:userId?tab=notifications") as S.UserProfileNotificationsPage,

    userProfileLegal: legalScreen("user-profile-legal", "/users/:userId?tab=legal") as S.UserProfileLegalPage,

    userProfileSelf,

    userProfileSelfCapabilities,

    userProfileSelfNotifications,

    userProfileSelfLegal: legalScreen("user-profile-self-legal", "/users/me?tab=legal") as S.UserProfileSelfLegalPage,

    organizationUserMembershipsSelf: absent<S.OrganizationUserMembershipsSelfPage>(
      "organization-user-memberships-self",
      "/users/me?tab=organizations",
      sectionRedrawn("/users/me?tab=organizations", "Organizations"),
      [
        "approve_invitation",
        "reject_invitation",
        "leave_organization",
        "create_organization",
        "open_organization",
        "owned_organizations_table",
        "affiliated_organizations_table",
        "pending_badge",
        "team_member_count",
        "swu_qualified_mark",
        "empty_owned_message",
        "empty_affiliated_message",
        "accept_confirmation",
        "decline_confirmation",
      ],
    ),

    evaluationPanelDashboard: absent<S.EvaluationPanelDashboardPage>(
      "evaluation-panel-dashboard",
      "/dashboard",
      'walked signed in as the public sector employee, a first-time public sector employee, the administrator and vendors, /dashboard reads only "Dashboard" over "You are signed in as <name>." — no tabs, tables, links or buttons, so no panel\'s opportunities are shown to anybody',
      [
        "show_my_opportunities",
        "show_panel_opportunities",
        "open_opportunity",
        "evaluations_tab",
        "panel_opportunities_table",
        "opportunity_status",
        "empty_panel_opportunities_message",
      ],
    ),

    evaluationPanelSwu: absent<S.EvaluationPanelSwuPage>(
      "evaluation-panel-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel",
      behindSession("/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel"),
      [
        "add_panel_member",
        "remove_panel_member",
        "choose_panel_chair",
        "mark_member_as_chair",
        "save_evaluation_panel",
        "panel_member_row",
        "chair_field",
        "minimum_members_error",
        "duplicate_member_error",
        "non_public_sector_member_error",
        "missing_chair_error",
        "panel_locked_after_consensus",
      ],
    ),

    evaluationPanelTwu: absent<S.EvaluationPanelTwuPage>(
      "evaluation-panel-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel",
      behindSession("/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel"),
      [
        "add_panel_member",
        "remove_panel_member",
        "choose_panel_chair",
        "mark_member_as_chair",
        "save_evaluation_panel",
        "panel_member_row",
        "chair_field",
        "minimum_members_error",
        "duplicate_member_error",
        "non_public_sector_member_error",
        "missing_chair_error",
        "panel_locked_after_consensus",
      ],
    ),

    evaluationInstructionsSwu: absent<S.EvaluationInstructionsSwuPage>(
      "evaluation-instructions-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions",
      behindSession("/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions"),
      ["instructions_body", "visible_to_evaluators_only"],
    ),

    evaluationInstructionsTwu: absent<S.EvaluationInstructionsTwuPage>(
      "evaluation-instructions-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=instructions",
      behindSession("/opportunities/team-with-us/:opportunityId/edit?tab=instructions"),
      ["instructions_body", "visible_to_evaluators_only"],
    ),

    evaluationIndividualListSwu: absent<S.EvaluationIndividualListSwuPage>(
      "evaluation-individual-list-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation",
      behindSession("/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation"),
      [
        "open_proponent_evaluation",
        "submit_scores_for_consensus",
        "proponent_row",
        "anonymous_proponent_name",
        "evaluation_status",
        "submit_disabled_until_complete",
        "incomplete_evaluation_error",
        "own_evaluations_only",
      ],
    ),

    evaluationIndividualListTwu: absent<S.EvaluationIndividualListTwuPage>(
      "evaluation-individual-list-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=evaluation",
      behindSession("/opportunities/team-with-us/:opportunityId/edit?tab=evaluation"),
      [
        "open_proponent_evaluation",
        "submit_scores_for_consensus",
        "proponent_row",
        "anonymous_proponent_name",
        "evaluation_status",
        "submit_disabled_until_complete",
        "incomplete_evaluation_error",
        "own_evaluations_only",
      ],
    ),

    evaluationConsensusListSwu: absent<S.EvaluationConsensusListSwuPage>(
      "evaluation-consensus-list-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=consensus",
      behindSession("/opportunities/sprint-with-us/:opportunityId/edit?tab=consensus"),
      [
        "open_proponent_consensus",
        "submit_final_consensus_scores",
        "confirm_submit_consensus",
        "finalize_consensus_scores",
        "confirm_finalize_consensus",
        "cancel_modal",
        "proponent_row",
        "consensus_status",
        "submit_confirmation_modal",
        "finalize_confirmation_modal",
        "not_all_consensuses_submitted_error",
        "no_screenable_proponent_error",
        "empty_for_owner_not_on_panel",
      ],
    ),

    evaluationConsensusListTwu: absent<S.EvaluationConsensusListTwuPage>(
      "evaluation-consensus-list-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=consensus",
      behindSession("/opportunities/team-with-us/:opportunityId/edit?tab=consensus"),
      [
        "open_proponent_consensus",
        "submit_final_consensus_scores",
        "confirm_submit_consensus",
        "finalize_consensus_scores",
        "confirm_finalize_consensus",
        "cancel_modal",
        "proponent_row",
        "consensus_status",
        "submit_confirmation_modal",
        "finalize_confirmation_modal",
        "not_all_consensuses_submitted_error",
        "no_screenable_proponent_error",
        "empty_for_owner_not_on_panel",
      ],
    ),

    // Opened for real so that what a person who may not evaluate is shown can be read.
    evaluationIndividualCreateSwu: evaluationScreen<S.EvaluationIndividualCreateSwuPage>(
      "evaluation-individual-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create",
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "save_and_go_to_previous_proponent",
        "anonymous_proponent_name",
        "question_response",
        "score_out_of_range_error",
        "empty_notes_error",
        "duplicate_evaluation_error",
      ],
    ),

    evaluationIndividualEditSwu: evaluationScreen<S.EvaluationIndividualEditSwuPage>(
      "evaluation-individual-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit",
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "evaluation_status",
        "read_only_after_submitted",
        "score_out_of_range_error",
        "empty_notes_error",
      ],
    ),

    evaluationConsensusCreateSwu: absent<S.EvaluationConsensusCreateSwuPage>(
      "evaluation-consensus-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create",
      behindSession(
        "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "anonymous_proponent_name",
        "panel_member_score",
        "panel_member_notes",
        "chair_only",
        "duplicate_consensus_error",
      ],
    ),

    evaluationConsensusEditSwu: absent<S.EvaluationConsensusEditSwuPage>(
      "evaluation-consensus-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/:userId/edit",
      behindSession(
        "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/:userId/edit",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "consensus_status",
        "editable_after_submitted",
        "panel_member_score",
        "panel_member_notes",
      ],
    ),

    evaluationIndividualCreateTwu: evaluationScreen<S.EvaluationIndividualCreateTwuPage>(
      "evaluation-individual-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create",
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "save_and_go_to_previous_proponent",
        "anonymous_proponent_name",
        "question_response",
        "score_out_of_range_error",
        "empty_notes_error",
        "duplicate_evaluation_error",
      ],
    ),

    evaluationIndividualEditTwu: evaluationScreen<S.EvaluationIndividualEditTwuPage>(
      "evaluation-individual-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit",
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "evaluation_status",
        "read_only_after_submitted",
        "score_out_of_range_error",
        "empty_notes_error",
      ],
    ),

    evaluationConsensusCreateTwu: absent<S.EvaluationConsensusCreateTwuPage>(
      "evaluation-consensus-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create",
      behindSession(
        "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "anonymous_proponent_name",
        "panel_member_score",
        "panel_member_notes",
        "chair_only",
        "duplicate_consensus_error",
      ],
    ),

    evaluationConsensusEditTwu: absent<S.EvaluationConsensusEditTwuPage>(
      "evaluation-consensus-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/:userId/edit",
      behindSession(
        "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/:userId/edit",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "consensus_status",
        "editable_after_submitted",
        "panel_member_score",
        "panel_member_notes",
      ],
    ),

    notificationUnsubscribeLanding: unsubscribeLanding(),

    notificationOptinOpportunityList: optinList,

    notificationTermsBroadcast: termsBroadcast,

    // The service answers this address itself, and is no screen: signed in as the
    // administrator it answers 404 {"errors":["Cannot GET /admin/email-notification-reference"]},
    // and /api/email-notification-reference and /api/admin/email-notification-reference are
    // 404 too. The refusal reader reads whatever refusal the address gives a non-administrator.
    notificationEmailReference: absent<S.NotificationEmailReferencePage>(
      "notification-email-reference",
      "/admin/email-notification-reference",
      `signed in as the administrator (test-admin) and opened /admin/email-notification-reference: the service answers it 404 {"errors":["Cannot GET /admin/email-notification-reference"]} rather than drawing a screen, the same addresses under /api answer 404 "not found", and no link on the administrator's dashboard or profile leads to an email reference; ${NOBODY_SIGNS_IN}`,
      ["open_reference", "message_group_title", "message_subject", "message_summary", "message_body"],
      ["refused_for_non_administrator"],
    ),

    contentFooter,
    contentServiceLevelAgreementLink,

    contentList,
    contentCreate,
    contentEdit,
    contentView,

    fileUpload,
    fileDescription,
    fileDownload,

    fileAttachmentControl,

    fileImagePicker,

    fileEmbeddedImage,

    caughtMessage,
    caughtMessageList,
    mailDeliveryFault,
    mailDeliveryDelay,
    organizationActingForList,
    affiliationInvitationRequest,
    affiliationApprovalRequest,
    userListRequest,
    contentRequest,
    evaluationIndividualRequestSwu: evaluationRequest<S.EvaluationIndividualRequestSwuPage>(
      "evaluation-individual-request-swu",
      "/api/proposal/sprint-with-us/:proposalId/team-questions/evaluations/:userId",
    ),
    evaluationIndividualRequestTwu: evaluationRequest<S.EvaluationIndividualRequestTwuPage>(
      "evaluation-individual-request-twu",
      "/api/proposal/team-with-us/:proposalId/resource-questions/evaluations/:userId",
    ),
    evaluationConsensusRequestSwu: consensusRequest<S.EvaluationConsensusRequestSwuPage>(
      "evaluation-consensus-request-swu",
      "/api/proposal/sprint-with-us/:proposalId/team-questions/consensus/:userId",
    ),
    evaluationConsensusRequestTwu: consensusRequest<S.EvaluationConsensusRequestTwuPage>(
      "evaluation-consensus-request-twu",
      "/api/proposal/team-with-us/:proposalId/resource-questions/consensus/:userId",
    ),
    evaluationPanelRequest,
    fileAttachByIdentifier,
    proposalCwuRequest,
    proposalTeamRequest,
    proposalEvaluationRequest,
    userAccountSelfRequest,
    userAccountRequest,
  };

  return surface;
}
