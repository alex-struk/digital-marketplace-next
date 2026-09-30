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
// Signing in now works as far as the sandbox identity provider's own form ("Sign in as a
// vendor" / "Sign in as a public sector employee" on /sign-in), and signIn() fills it. The
// screens behind a session were never walked signed in, because the binding session could
// not use the sandbox password; signed out they answer with the client's "Page not found"
// screen or a redirect to /sign-in. Those screens'
// members report "unbound: <page>.<member> — <reason>", and so does their open(), so that a
// test which only opens such a page is not told it succeeded; a member that is about the
// refusal itself (refused_for_non_administrator, sign_in_required, ...) reads that refusal.
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

  // Sign-in now reaches a real form, but the session that bound this adapter had no sandbox
  // password it was permitted to use, so no screen behind a session has been walked yet.
  const NOBODY_SIGNS_IN =
    'this screen has not been walked signed in: "Sign in as a vendor" and "Sign in as a public sector employee" on /sign-in now hand off to the sandbox identity provider\'s username and password form, but the session that bound this adapter could not use the sandbox password, so none of the controls signed-in people are shown here have been seen';

  // What each such address answered a signed-out visitor when it was opened.
  function signedOutAnswer(route: string): string {
    if (/^\/(dashboard|users|organizations\/|sign-up\/complete)|\/complete$/.test(route)) {
      return "redirects to /sign-in";
    }
    return 'shows the "Page not found" screen';
  }

  const behindSession = (route: string): string =>
    `${route} is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}; opened signed out (with the seeded record's identifier where it takes one) it ${signedOutAnswer(route)}`;

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
  async function signIn(who: Persona): Promise<void> {
    const table = who.signIn as unknown as null | Record<string, SignInEntry>;
    if (!table) {
      // The anonymous visitor has no account; being signed out is the whole state.
      await signOut();
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

    // Start from nobody signed in, then take the way in the sign-in screen offers this kind
    // of account: "Sign in as a vendor" for a vendor, "Sign in as a public sector employee"
    // for public sector staff and administrators. Every vendor's sandbox username says so.
    await signOut();
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

  // There is no session to end on this target and no "/sign-out" screen to end it on, so
  // being signed out is a matter of the browser carrying nothing: the cookies go, and the
  // browser is left on the one page that is always readable.
  async function signOut(): Promise<void> {
    await page.context().clearCookies().catch(() => undefined);
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await settle();
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
      // The body is the block after the title and its dated line; the banner's and the
      // footer's links, which share the same landmark, are not the page's own.
      const body = seen(page.getByRole("heading", { level: 1 })).first().locator("xpath=following-sibling::*[2]");
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
        `unbound: content-view.follow_body_link — the body of the page at ${page.url()} carries no link; a page with one could only be written on /content/create or /content/:slug/edit, which are offered only to a signed-in administrator, and ${NOBODY_SIGNS_IN}`,
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
    // Under the title: "Published Jan 5, 2026 9:00 AM | Updated Jan 7, 2026 9:00 AM".
    publishedDate: async () => ((await notFoundShown()) ? "" : datedLine("Published")),
    updatedDate: async () => ((await notFoundShown()) ? "" : datedLine("Updated")),
    readableWhenSignedOut: () => mainText(),
    notFoundForUnknownAddress: async () => ((await notFoundShown()) ? mainText() : ""),
  };

  // ================================================================ the rest of the surface

  function unbound(where: string, why: string): never {
    throw new Error(`unbound: ${where} — ${why}`);
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
    if (!(await seen(page.getByRole("heading", { name: /^\s*not found\s*$/i })).count())) return "";
    const lines = await textLines();
    const from = Math.max(0, lines.findIndex((line) => /^not found$/i.test(line)));
    const to = lines.findIndex((line, i) => i > from && /^go home$/i.test(line));
    return lines.slice(from, to > from ? to : from + 2).join("\n");
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
  // catcher under /hold. Read on this machine's catcher: GET .../toxics answers [] while
  // replies pass at full speed. A delay of three seconds on every reply is added as the
  // toxic "hold" and removed by name; adding one already there, or removing one already
  // gone, leaves the proxy as asked, so those answers count as done too.
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
  // read for every address below; what it answers somebody signed in was not, since the
  // session that bound this adapter could not sign in, so those request bodies follow
  // spec/contract/openapi.yaml and the forms the contract describes.

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

  // The file the test names, made by the harness under that name with whatever content or
  // size the test gave; the stored name is the one given for it, or the file's own.
  function uploadGiven(where: string, input: unknown, metadata: string | undefined, withFile = true): Upload {
    const fileName = field(input, "file", "fileName", "file_name", "name") || (typeof input === "string" ? input : "");
    if (!fileName) unbound(where, `the input names no file to upload (${JSON.stringify(input)})`);
    const name = field(input, "name", "storedName") || fileName;
    if (!withFile) return { name, metadata };
    const content = given(input, ["content", "contents", "body", "text"]);
    const bytes = Number.parseInt(field(input, "bytes", "size", "sizeBytes", "size_bytes"), 10);
    const path = uploadFile({
      name: fileName,
      ...(Number.isFinite(bytes) ? { bytes } : {}),
      ...(typeof content === "string" ? { content } : {}),
    });
    const mimeType = field(input, "mimeType", "contentType", "content_type") || MIME[extname(fileName).toLowerCase()] || "application/octet-stream";
    return { name, metadata, file: { fileName, mimeType, buffer: readFileSync(path) } };
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

  // /sign-out: "You have successfully signed out. Thank you for using the Digital Marketplace."
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

  const surface: S.Surface = {
    signIn,
    signOut,

    home,

    opportunityDashboard: absent<S.OpportunityDashboardPage>(
      "opportunity-dashboard",
      "/dashboard",
      behindSession("/dashboard"),
      [
        "create_opportunity",
        "open_opportunity",
        "my_opportunities_table",
        "opportunity_status",
        "own_opportunities_only",
        "all_opportunities_for_administrator",
        "empty_my_opportunities_message",
      ],
    ),

    opportunityList,

    opportunityProgramSelect: absent<S.OpportunityProgramSelectPage>(
      "opportunity-program-select",
      "/opportunities/create",
      behindSession("/opportunities/create"),
      ["choose_code_with_us", "choose_sprint_with_us", "choose_team_with_us", "program_card", "max_budget"],
    ),

    opportunityCwuCreate: absent<S.OpportunityCwuCreatePage>(
      "opportunity-cwu-create",
      "/opportunities/code-with-us/create",
      behindSession("/opportunities/code-with-us/create"),
      ["save_draft", "submit_for_review", "publish", "add_attachment", "field_error"],
    ),

    opportunityCwuView: opportunityView<S.OpportunityCwuViewPage>(
      CWU_VIEW,
      "/opportunities/code-with-us/:opportunityId",
      "code-with-us",
      {
        // "$5,000" over "Value".
        reward: () => figureAbove(`${CWU_VIEW}.reward`, /^value$/i),
        assignmentDate: () => figureAbove(`${CWU_VIEW}.assignment_date`, /^assignment date$/i),
        startDate: () => figureAbove(`${CWU_VIEW}.start_date`, /^(work )?start date$/i),
        successfulProponentContactDetails: () =>
          awardDetail(`${CWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${CWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunityCwuEdit: {
      ...unboundMembers(
        "opportunity-cwu-edit",
        behindSignIn(
          "the Code With Us management screen (and its ?tab=opportunity form, where the dates are read)",
          'shows the "Not Found" screen (tried with the seeded awarded opportunity)',
        ),
        ["proposal_deadline", "assignment_date", "start_date", "completion_date"],
      ),
      ...absent<S.OpportunityCwuEditPage>(
      "opportunity-cwu-edit",
      "/opportunities/code-with-us/:opportunityId/edit",
      behindSession("/opportunities/code-with-us/:opportunityId/edit"),
      [
        "edit_details",
        "submit_for_review",
        "publish",
        "cancel_opportunity",
        "delete_opportunity",
        "add_addendum",
        "add_note",
        "opportunity_identifier",
        "created_by_name",
        "last_changed_by_name",
        "summary_tab",
        "opportunity_tab",
        "addenda_tab",
        "history_tab",
        "proposals_tab",
        "reporting_views",
        "reporting_watchers",
        "reporting_proposals",
      ],
    ),
    } as S.OpportunityCwuEditPage,

    opportunityCwuComplete: absent<S.OpportunityCwuCompletePage>(
      "opportunity-cwu-complete",
      "/opportunities/code-with-us/:opportunityId/complete",
      behindSession("/opportunities/code-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    opportunitySwuCreate: absent<S.OpportunitySwuCreatePage>(
      "opportunity-swu-create",
      "/opportunities/sprint-with-us/create",
      behindSession("/opportunities/sprint-with-us/create"),
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
      behindSession("/opportunities/team-with-us/create"),
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
      behindSession("/opportunities/code-with-us/:opportunityId/proposals/create"),
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

    proposalVendorDashboard: absent<S.ProposalVendorDashboardPage>(
      "proposal-vendor-dashboard",
      "/dashboard",
      behindSession("/dashboard"),
      [
        "show_my_proposals",
        "show_org_proposals",
        "my_proposals_table",
        "org_proposals_table",
        "proposal_status",
        "empty_my_proposals_message",
        "empty_org_proposals_message",
      ],
    ),

    proposalListStub,

    organizationList,

    organizationCreate: absent<S.OrganizationCreatePage>(
      "organization-create",
      "/organizations/create",
      behindSession("/organizations/create"),
      ["create_organization", "cancel", "change_logo", "field_error", "submit_disabled_until_valid"],
    ),

    organizationEdit: {
      ...unboundMembers(
        "organization-edit",
        behindSignIn(
          "an organization's edit screen, where its logo is changed",
          "redirects to /sign-in?redirectOnSuccess=… (tried with a seeded organization's identifier)",
        ),
        ["change_logo", "current_logo", "logo_refused_error"],
      ),
      ...absent<S.OrganizationEditPage>(
      "organization-edit",
      "/organizations/:orgId/edit",
      behindSession("/organizations/:orgId/edit"),
      [
        "edit_organization",
        "save_changes",
        "cancel_editing",
        "archive_organization",
        "add_team_members",
        "approve_pending_member",
        "remove_team_member",
        "toggle_member_admin_status",
        "accept_org_admin_terms",
        "change_owner",
        "edit_service_areas",
        "save_service_areas",
        "view_swu_terms",
        "view_twu_terms",
        "organization_identifier",
        "organization_tab",
        "team_tab",
        "swu_qualification_tab",
        "twu_qualification_tab",
        "changelog_tab",
        "swu_qualified_badge",
        "twu_qualified_badge",
        "owner_badge",
        "pending_badge",
        "team_member_row",
        "team_capabilities",
        "swu_requirement_two_members",
        "swu_requirement_all_capabilities",
        "swu_requirement_terms_accepted",
        "twu_requirement_service_area",
        "twu_requirement_terms_accepted",
        "service_area_checkbox",
        "not_qualified_notice",
        "changelog_entry",
        "field_error",
        "invalid_membership_type_error",
      ],
    ),
    } as S.OrganizationEditPage,

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
      behindSession("/users/:userId?tab=organizations"),
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

    userSignUpComplete: absent<S.UserSignUpCompletePage>(
      "user-sign-up-complete",
      "/sign-up/complete",
      behindSession("/sign-up/complete"),
      [
        "change_avatar",
        "accept_app_terms",
        "toggle_new_opportunity_notifications",
        "complete_profile",
        "idp_username_readonly",
        "name_field",
        "email_field",
        "job_title_field",
        "terms_checkbox",
        "complete_disabled_until_terms_accepted",
        "field_error",
      ],
    ),

    userSignOut,

    userNotice,

    userList: absent<S.UserListPage>(
      "user-list",
      "/users",
      behindSession("/users"),
      [
        "search_by_name",
        "open_export_contact_list",
        "toggle_export_user_type",
        "toggle_export_field",
        "export_contact_list",
        "cancel_export",
        "open_user_profile",
        "user_row",
        "status_badge",
        "account_type",
        "admin_check",
        "export_modal",
        "export_disabled_until_selection",
      ],
    ),

    userProfile: absent<S.UserProfilePage>(
      "user-profile",
      "/users/:userId",
      behindSession("/users/:userId"),
      [
        "edit_profile",
        "save_changes",
        "cancel_editing",
        "change_avatar",
        "toggle_admin_permission",
        "deactivate_account",
        "reactivate_account",
        "confirm_activation_change",
        "cancel_activation_change",
        "user_identifier",
        "profile_tab",
        "capabilities_tab",
        "notifications_tab",
        "legal_tab",
        "organizations_tab",
        "status_badge",
        "account_type",
        "permissions_label",
        "admin_checkbox",
        "idp_username_readonly",
        "name_field",
        "email_field",
        "job_title_field",
        "field_error",
        "activation_modal",
        "not_found_page",
      ],
    ),

    userProfileCapabilities: absent<S.UserProfileCapabilitiesPage>(
      "user-profile-capabilities",
      "/users/:userId?tab=capabilities",
      behindSession("/users/:userId?tab=capabilities"),
      [
        "toggle_capability",
        "expand_capability_description",
        "capability_row",
        "capability_checked",
        "capability_description",
      ],
    ),

    userProfileNotifications: absent<S.UserProfileNotificationsPage>(
      "user-profile-notifications",
      "/users/:userId?tab=notifications",
      behindSession("/users/:userId?tab=notifications"),
      [
        "toggle_new_opportunity_notifications",
        "confirm_unsubscribe",
        "cancel_unsubscribe",
        "new_opportunities_checkbox",
        "notification_email_address",
        "unsubscribe_modal",
      ],
    ),

    userProfileLegal: absent<S.UserProfileLegalPage>(
      "user-profile-legal",
      "/users/:userId?tab=legal",
      behindSession("/users/:userId?tab=legal"),
      [
        "open_app_terms",
        "accept_updated_terms",
        "confirm_accept_updated_terms",
        "privacy_policy",
        "app_terms_link",
        "accepted_on_notice",
        "terms_updated_warning",
        "program_terms_links",
        "accept_updated_terms_modal",
      ],
    ),

    userProfileSelf: absent<S.UserProfileSelfPage>(
      "user-profile-self",
      "/users/me",
      behindSession("/users/me"),
      [
        "edit_profile",
        "save_changes",
        "cancel_editing",
        "change_avatar",
        "deactivate_account",
        "confirm_activation_change",
        "cancel_activation_change",
        "user_identifier",
        "profile_tab",
        "capabilities_tab",
        "notifications_tab",
        "legal_tab",
        "organizations_tab",
        "status_badge",
        "account_type",
        "idp_username_readonly",
        "name_field",
        "email_field",
        "job_title_field",
        "field_error",
        "activation_modal",
      ],
      // Signed out, /users/me redirects to /sign-in?redirectOnSuccess=%2Fusers%2Fme.
      ["sign_in_required"],
    ),

    userProfileSelfCapabilities: absent<S.UserProfileSelfCapabilitiesPage>(
      "user-profile-self-capabilities",
      "/users/me?tab=capabilities",
      behindSession("/users/me?tab=capabilities"),
      [
        "toggle_capability",
        "expand_capability_description",
        "capability_row",
        "capability_checked",
        "capability_description",
      ],
    ),

    userProfileSelfNotifications: absent<S.UserProfileSelfNotificationsPage>(
      "user-profile-self-notifications",
      "/users/me?tab=notifications",
      behindSession("/users/me?tab=notifications"),
      [
        "toggle_new_opportunity_notifications",
        "confirm_unsubscribe",
        "cancel_unsubscribe",
        "new_opportunities_checkbox",
        "notification_email_address",
        "unsubscribe_modal",
      ],
    ),

    userProfileSelfLegal: absent<S.UserProfileSelfLegalPage>(
      "user-profile-self-legal",
      "/users/me?tab=legal",
      behindSession("/users/me?tab=legal"),
      [
        "open_app_terms",
        "accept_updated_terms",
        "confirm_accept_updated_terms",
        "privacy_policy",
        "app_terms_link",
        "accepted_on_notice",
        "terms_updated_warning",
        "program_terms_links",
        "accept_updated_terms_modal",
      ],
    ),

    organizationUserMembershipsSelf: absent<S.OrganizationUserMembershipsSelfPage>(
      "organization-user-memberships-self",
      "/users/me?tab=organizations",
      behindSession("/users/me?tab=organizations"),
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
      behindSession("/dashboard"),
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

    notificationUnsubscribeLanding: absent<S.NotificationUnsubscribeLandingPage>(
      "notification-unsubscribe-landing",
      "/users/me?tab=notifications&unsubscribe",
      behindSession("/users/me?tab=notifications&unsubscribe"),
      [
        "confirm_unsubscribe",
        "cancel_unsubscribe",
        "unsubscribe_confirmation",
        "confirmation_names_signed_in_address",
        "resolves_to_signed_in_person",
      ],
      // Signed out, the address redirects to /sign-in, carrying itself as redirectOnSuccess.
      ["sign_in_required"],
    ),

    // The list itself opens for anybody; the notification control on it is a signed-in
    // person's own, and none is drawn for a signed-out visitor.
    notificationOptinOpportunityList: {
      open: () => go("/opportunities"),
      ...unboundMembers(
        "notification-optin-opportunity-list",
        `opened /opportunities signed out: it carries a program chooser, "Remote OK" and a search box and no control about new-opportunity notifications, which is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}`,
        [
          "toggle_new_opportunity_notifications",
          "notification_control",
          "notification_control_state",
          "notification_control_hidden_on_narrow_screen",
        ],
      ),
    } as S.NotificationOptinOpportunityListPage,

    notificationTermsBroadcast: absent<S.NotificationTermsBroadcastPage>(
      "notification-terms-broadcast",
      "/content/terms-and-conditions/edit",
      behindSession("/content/terms-and-conditions/edit"),
      [
        "notify_vendors_of_updated_terms",
        "confirm_notify_vendors",
        "cancel_notify_vendors",
        "notify_vendors_control",
        "notify_vendors_confirmation",
        "notify_vendors_success",
        "notify_vendors_failure",
      ],
    ),

    // The service answers this address itself: signed out, 401 with the plain text "You do
    // not have permission to perform this action.", which is what the refusal reads.
    notificationEmailReference: absent<S.NotificationEmailReferencePage>(
      "notification-email-reference",
      "/admin/email-notification-reference",
      `/admin/email-notification-reference is answered only to a signed-in administrator, and ${NOBODY_SIGNS_IN}; opened signed out the service answers it 401 "You do not have permission to perform this action."`,
      ["open_reference", "message_group_title", "message_subject", "message_summary", "message_body"],
      ["refused_for_non_administrator"],
    ),

    contentFooter,
    contentServiceLevelAgreementLink,

    contentList: {
      ...unboundMembers(
        "content-list",
        behindSignIn("the content management list (administrators only)", 'shows the "Not Found" screen'),
        ["page_count"],
      ),
      ...absent<S.ContentListPage>(
      "content-list",
      "/content",
      behindSession("/content"),
      [
        "open_page_for_editing",
        "open_public_page",
        "create_page",
        "page_title",
        "page_public_address",
        "page_is_fixed",
        "page_created_date",
        "page_updated_date",
        "ordered_by_title",
      ],
      ["refused_for_non_administrator"],
    ),
    } as S.ContentListPage,

    contentCreate: absent<S.ContentCreatePage>(
      "content-create",
      "/content/create",
      behindSession("/content/create"),
      [
        "enter_title",
        "enter_slug",
        "enter_body",
        "upload_body_image",
        "publish_page",
        "confirm_publish",
        "cancel",
        "field_error",
        "slug_rule_help",
        "resulting_public_address",
        "publish_disabled_until_valid",
        "publish_confirmation",
        "published_success",
        "duplicate_slug_error",
      ],
      ["refused_for_non_administrator"],
    ),

    contentEdit: {
      ...unboundMembers(
        "content-edit",
        behindSignIn(
          "a page's management screen (administrators only)",
          'shows the "Not Found" screen (tried with /content/about/edit)',
        ),
        ["published_by_link", "updated_by_link"],
      ),
      ...absent<S.ContentEditPage>(
      "content-edit",
      "/content/:slug/edit",
      behindSession("/content/:slug/edit"),
      [
        "start_editing",
        "edit_title",
        "edit_slug",
        "edit_body",
        "upload_body_image",
        "publish_changes",
        "confirm_publish_changes",
        "cancel_editing",
        "delete_page",
        "confirm_delete_page",
        "page_address",
        "published_date",
        "updated_date",
        "published_by",
        "updated_by",
        "fixed_page_warning",
        "slug_locked_for_fixed_page",
        "delete_withheld_for_fixed_page",
        "field_error",
        "duplicate_slug_error",
        "changes_published_success",
        "deleted_success",
        "body_being_edited",
        "version_history",
      ],
      ["refused_for_non_administrator"],
    ),
    } as S.ContentEditPage,

    contentView,

    fileUpload,
    fileDescription,
    fileDownload,

    // The control itself sits on the opportunity and proposal forms, all behind sign-in.
    // What an opportunity's public page lists is read there, on its "Attachments" tab:
    // "There are currently no attachments for this opportunity." when it has none.
    fileAttachmentControl: {
      ...absent<S.FileAttachmentControlPage>(
      "file-attachment-control",
      "/opportunities/:program/:opportunityId/edit?tab=opportunity",
      behindSession("/opportunities/:program/:opportunityId/edit?tab=opportunity"),
      [
        "add_attachment",
        "rename_new_attachment",
        "remove_new_attachment",
        "remove_existing_attachment",
        "download_attachment",
        "attachment_address",
        "size_limit_stated_before_choosing",
        "upload_refused_for_size",
        "new_attachment_row",
        "existing_attachment_row",
        "existing_attachment_name_read_only",
        "original_extension_restored",
        "file_name_error",
        "remove_control_hidden_when_not_removable",
      ],
    ),
      // Opening goes to the management screen's form, which refuses a signed-out visitor
      // (each control above says so when used); the opportunity it names is kept, so that
      // its public page can be read.
      open: async (params?: Record<string, string>) => {
        attachmentsOf = { program: String(params?.program ?? ""), opportunityId: String(params?.opportunityId ?? "") };
        await page
          .goto(leniently("/opportunities/:program/:opportunityId/edit?tab=opportunity", params), { waitUntil: "domcontentloaded" })
          .catch(() => undefined);
        await settle();
      },
      attachmentListOnPublicView: async () => {
        const where = "file-attachment-control.attachment_list_on_public_view";
        if (!PROGRAM_NAME[attachmentsOf.program] || !attachmentsOf.opportunityId) {
          unbound(where, `no opportunity was opened (program and opportunityId; given ${JSON.stringify(attachmentsOf)})`);
        }
        await go(`/opportunities/${attachmentsOf.program}/:opportunityId`, { opportunityId: attachmentsOf.opportunityId });
        const section = await sectionBehind(where, "Attachments");
        return /^there are currently no attachments/i.test(section) ? "" : section;
      },
    } as S.FileAttachmentControlPage,

    fileImagePicker: absent<S.FileImagePickerPage>(
      "file-image-picker",
      "/users/me",
      behindSession("/users/me"),
      [
        "choose_image",
        "image_address",
        "current_image",
        "chosen_image_preview",
        "only_jpeg_and_png_offered",
        "rejected_image_error",
        "image_readable_when_signed_out",
        "stored_image_width",
        "stored_image_height",
      ],
    ),

    fileEmbeddedImage: absent<S.FileEmbeddedImagePage>(
      "file-embedded-image",
      "/content/:slug/edit",
      behindSession("/content/:slug/edit"),
      [
        "upload_body_image",
        "image_address",
        "image_inserted_into_text",
        "only_jpeg_and_png_offered",
        "uploading_indicator",
        "image_rendered_in_published_text",
        "upload_failure_leaves_text_unchanged",
      ],
    ),

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
