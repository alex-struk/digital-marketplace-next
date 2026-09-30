// Adapter binding the abstract Surface to the running "new" target.
//
// Everything here was found by opening the target in a browser, signed out and signed in
// through the sandbox identity provider as a vendor, public sector staff, the
// administrator, an organization owner, the vendors with notices off and with terms reset,
// the vendor part-way through completing a profile, the deactivated vendor and the three
// first-time identities. Controls are located by role, accessible name, visible text or the
// address they lead to, never by a class, an id or a test attribute.
//
// What this target is, as it stands
// ---------------------------------
// It is a partial build. Its screens are the home page, /sign-in, /sign-up, /sign-up/complete,
// /sign-out, /notice/deactivatedOwnAccount and /notice/authFailure, the published pages
// under /content/:slug, the program explainers under /learn-more/:program, the dashboard
// (a greeting and nothing else), and one's own profile at /users/me and /users/<own id> with
// its Profile, Notifications and Legal tabs (the Capabilities and Organizations links show
// the profile's details again). /status answers "OK" as plain text. Every other screen the
// contract names — opportunities, proposals, organizations, the user list, another person's
// profile, the content manager, the evaluation screens — answers with the client's "Page not
// found" screen, whoever is signed in; /admin/email-notification-reference is answered by
// the service itself with 404 {"errors":["Cannot GET …"]}.
//
// Of the service's interface only three requests have handlers: GET /api/sessions/current,
// GET /api/content/:slug and PUT /api/users/:id. Everything else under /api answers
// 404 "Cannot <METHOD> …" (after the request validator, where one runs).
//
// A signed-in session is carried by a "dm-session" cookie and by tokens the client keeps in
// its own storage ("digital-marketplace.tokens"), so signing out means /sign-out, then
// clearing both, then clearing the identity provider's cookies so that it asks again.

import { request as playwrightRequest } from "@playwright/test";
import type { Dialog, Locator, Page } from "@playwright/test";
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

  function unbound(where: string, why: string): never {
    throw new Error(`unbound: ${where} — ${why}`);
  }

  const snake = (name: string): string => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  const squash = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

  // ---------------------------------------------------------------- values a test hands over

  function record(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  function given(input: unknown, names: string[]): unknown {
    const wanted = names.map(squash);
    for (const [key, value] of Object.entries(record(input))) {
      if (wanted.includes(squash(key)) && value !== undefined) return value;
    }
    return undefined;
  }

  function textOf(value: unknown): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(textOf).join(", ");
    return "";
  }

  const saysYes = (value: unknown): boolean =>
    typeof value === "boolean" ? value : /^(true|yes|on|checked|1|y)$/i.test(textOf(value).trim());

  type SeedRecord = { id?: unknown; slug?: unknown };
  const seedGroups = seed as unknown as Record<string, Record<string, SeedRecord> | undefined>;

  // A seeded record named by its handle ("vendorOne" or "users.vendorOne") or by its
  // identifier; anything else is used as given.
  function seededId(value: unknown, ...groups: string[]): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return textOf(record(value).id);
    const named = String(value).trim();
    for (const group of groups) {
      const handle = named.startsWith(`${group}.`) ? named.slice(group.length + 1) : named;
      const found = seedGroups[group]?.[handle];
      if (found && found.id !== undefined) return String(found.id);
    }
    return named;
  }

  // ---------------------------------------------------------------- navigation

  function address(route: string, params?: Record<string, string>, groups: Record<string, string[]> = {}): string {
    const supplied: Record<string, unknown> = params ?? {};
    return (
      baseURL +
      route.replace(/:([A-Za-z0-9_]+)/g, (_m, name: string) => {
        const value = supplied[name] ?? supplied[name.replace(/Id$/, "")] ?? supplied.id;
        const filled = seededId(value, ...(groups[name] ?? []));
        if (!filled) {
          // Not unbound: the address exists, the caller did not say which record to open.
          throw new Error(`open() of ${route} was called without a value for ":${name}" (given: ${JSON.stringify(params ?? {})})`);
        }
        return encodeURIComponent(filled);
      })
    );
  }

  const seen = (locator: Locator): Locator => locator.filter({ visible: true });

  async function settle(): Promise<void> {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
  }

  // The client draws a screen once it has asked the service what it needs; its heading is
  // the sign that it has.
  async function ready(): Promise<void> {
    await settle();
    await seen(page.getByRole("heading")).first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
  }

  async function go(route: string, params?: Record<string, string>, groups?: Record<string, string[]>): Promise<void> {
    await page.goto(address(route, params, groups), { waitUntil: "domcontentloaded" });
    await ready();
  }

  async function visit(href: string): Promise<void> {
    await page.goto(/^https?:\/\//.test(href) ? href : baseURL + href, { waitUntil: "domcontentloaded" });
    await ready();
  }

  const originOf = (href: string): string => /^[a-z]+:\/\/[^/?#]+/i.exec(href)?.[0] ?? href;

  // ---------------------------------------------------------------- reading the screen

  const lined = (words: string): string[] =>
    words
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  async function bodyText(): Promise<string> {
    return (await page.evaluate(() => document.body.innerText).catch(() => "")).trim();
  }

  // The screen's own words: the "main" landmark, which holds neither the banner nor the
  // footer on this target.
  async function mainText(): Promise<string> {
    await ready();
    const main = seen(page.getByRole("main"));
    if (!(await main.count())) return bodyText();
    return lined(await main.first().innerText()).join("\n");
  }

  async function linesMatching(pattern: RegExp): Promise<string> {
    return lined(await mainText())
      .filter((line) => pattern.test(line))
      .join("\n");
  }

  // "Account type: Vendor" and the like, drawn as one paragraph.
  async function labelled(label: string): Promise<string> {
    const pattern = new RegExp(`^${label}:\\s*(.+)$`, "i");
    for (const line of lined(await mainText())) {
      const found = pattern.exec(line);
      if (found) return found[1].trim();
    }
    return "";
  }

  async function firstHeading(): Promise<string> {
    const heading = seen(page.getByRole("heading"));
    return (await heading.count()) ? (await heading.first().innerText()).trim() : "";
  }

  // What this target shows somebody who may not have the screen they asked for, or who
  // asked for one it does not have: the sign-in screen it redirects to (with its "Sign in to
  // see …" status), its "Page not found" screen, or, for an address the service answers
  // itself, the service's own words. Empty when a screen of this target is shown.
  async function refusalShown(): Promise<string> {
    await ready();
    const at = new URL(page.url());
    if (originOf(page.url()) !== originOf(baseURL)) return "";
    if (at.pathname === "/sign-in" && at.searchParams.has("redirectOnSuccess")) {
      const status = seen(page.getByRole("status"));
      const said = (await status.count()) ? lined(await status.first().innerText()).join("\n") : "";
      return said || `sent to the sign-in screen (${at.pathname}${at.search})`;
    }
    if (!(await seen(page.getByRole("main")).count())) return bodyText();
    if (!(await seen(page.getByRole("heading", { name: /^\s*page not found\s*$/i })).count())) return "";
    return lined(await mainText())
      .filter((line) => !/^back to home$/i.test(line))
      .join("\n");
  }

  async function whyNotHere(): Promise<string> {
    const refused = await refusalShown();
    if (refused) return `it shows ${JSON.stringify(refused.replace(/\n+/g, " "))} at ${page.url()}`;
    if (originOf(page.url()) !== originOf(baseURL)) return `the browser is at ${originOf(page.url())}, not on the target`;
    return "";
  }

  // The accessible names of what a screen offers, for a reason to name when a control is
  // not among them.
  async function offered(scope: Scope = page): Promise<string> {
    const names: string[] = [];
    const within = scope === page ? seen(page.getByRole("main")).first() : (scope as Locator);
    for (const role of ["button", "link", "textbox", "checkbox", "tab"] as const) {
      const found = seen(within.getByRole(role));
      const count = Math.min(await found.count().catch(() => 0), 30);
      for (let i = 0; i < count; i++) {
        const name = (await found.nth(i).getAttribute("aria-label").catch(() => null)) ??
          (await found.nth(i).innerText().catch(() => ""));
        const label = name.replace(/\s+/g, " ").trim().slice(0, 60);
        names.push(label ? `${role} "${label}"` : role);
      }
    }
    return names.length ? names.join(", ") : "nothing that can be pressed or filled";
  }

  // ---------------------------------------------------------------- driving controls

  async function findControl(scope: Scope, name: RegExp): Promise<Locator | null> {
    for (const role of ["button", "link"] as const) {
      const found = seen(scope.getByRole(role, { name }));
      if (await found.count()) return found.first();
    }
    return null;
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
    if (!control) unbound(where, `no control named ${name} on ${page.url()}; it offers ${await offered()}`);
    if (await isDisabled(control)) {
      const hint = lined(await formMessages()).join(" ");
      throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}${hint ? `; the form says: ${hint}` : ""}`);
    }
    await control.click();
    await settle();
  }

  // The messages a form draws: its alerts, and the description of every field marked
  // invalid. None drawn reads as nothing.
  async function formMessages(): Promise<string> {
    const out: string[] = [];
    const alerts = seen(page.getByRole("alert"));
    for (let i = 0; i < (await alerts.count()); i++) out.push(...lined(await alerts.nth(i).innerText().catch(() => "")));
    const boxes = seen(page.getByRole("textbox"));
    for (let i = 0; i < (await boxes.count()); i++) {
      const said = await boxes
        .nth(i)
        .evaluate((element) => {
          if (element.getAttribute("aria-invalid") !== "true") return "";
          const ids = (element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
          return ids.map((id) => document.getElementById(id)?.innerText ?? "").join("\n");
        })
        .catch(() => "");
      out.push(...lined(said));
    }
    return [...new Set(out)].join("\n");
  }

  function dialog(): Locator {
    return seen(page.getByRole("dialog").or(page.getByRole("alertdialog"))).last();
  }

  async function dialogText(): Promise<string> {
    await dialog().waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
    return (await dialog().count()) ? lined(await dialog().innerText()).join("\n") : "";
  }

  async function inDialog(where: string, name: RegExp, reached: string): Promise<void> {
    await dialog().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    if (!(await dialog().count())) unbound(where, `${reached}; no dialog is open on ${page.url()} to press ${name} in`);
    await press(where, name, dialog());
  }

  async function valueOf(box: Locator): Promise<string> {
    return (await box.inputValue().catch(() => "")).trim();
  }

  async function boxState(box: Locator): Promise<string> {
    return (await box.isChecked()) ? "checked" : "unchecked";
  }

  const isReadOnly = async (box: Locator): Promise<boolean> =>
    (await box.getAttribute("aria-readonly").catch(() => null)) === "true" ||
    (await box.getAttribute("readonly").catch(() => null)) !== null;

  // A file offered through the chooser a control opens; the harness makes the file.
  async function offerFile(where: string, control: RegExp, input: unknown): Promise<void> {
    const named = given(input, ["file", "name", "fileName", "image", "avatar", "picture"]);
    const request = typeof input === "string" ? { name: input } : named && typeof named === "object" ? record(named) : { ...record(input), name: textOf(named) };
    const name = textOf(record(request).name);
    if (!name) unbound(where, "the input names no file to offer");
    const button = await findControl(page, control);
    if (!button) unbound(where, `no control named ${control} on ${page.url()}; it offers ${await offered()}`);
    if (await isDisabled(button)) throw new Error(`${where} — the control named ${control} is disabled on ${page.url()}`);
    const chooser = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
    await button.click();
    const opened = await chooser;
    if (!opened) unbound(where, `pressing ${control} on ${page.url()} opens no file chooser`);
    await opened.setFiles(
      uploadFile({
        name,
        content: record(request).content as string | Uint8Array | undefined,
        bytes: record(request).bytes as number | undefined,
      }),
    );
    await settle();
  }

  // ---------------------------------------------------------------- sign in and out

  type SignInEntry = { route?: string; username?: string; unavailable?: string };

  // /sign-in offers "Sign in as a vendor" and "Sign in as a public sector employee"; each
  // hands off to the sandbox identity provider's "Sign in to your account" form (Username,
  // Password, "Sign In"), which returns through /auth/callback to the dashboard — or, for an
  // account that has not completed its profile, to /sign-up/complete, and for one the
  // service refuses (a deactivated account), to /notice/authFailure.
  async function signIn(who: Persona): Promise<void> {
    const table = who.signIn as unknown as null | Record<string, SignInEntry>;
    if (!table) {
      await signOut();
      return;
    }
    const where = `signIn.${who.id}`;
    const entry = table["sandbox-idp"];
    if (!entry || entry.unavailable !== undefined || !entry.username) {
      unbound(where, entry?.unavailable ?? "this persona has no sandbox identity provider account");
    }
    const password = process.env.SDLC_SANDBOX_PASSWORD;
    if (!password) unbound(where, "SDLC_SANDBOX_PASSWORD is not set, so there is no password to sign in with");

    await signOut();
    await page.goto(baseURL + "/sign-in", { waitUntil: "domcontentloaded" });
    await ready();
    // Every vendor identity's username says so; public sector staff and administrators
    // sign in the other way.
    const way = /vendor/i.test(entry.username) ? /^\s*sign in as a vendor\s*$/i : /^\s*sign in as a public sector employee\s*$/i;
    const offer = await findControl(page, way);
    if (!offer) unbound(where, `the sign-in screen at ${page.url()} offers no control named ${way}; it offers ${await offered()}`);
    await offer.click();

    const username = seen(page.getByRole("textbox", { name: /^\s*username( or email)?\s*$/i })).first();
    const secret = seen(page.getByRole("textbox", { name: /^\s*password\s*$/i })).first();
    await username.waitFor({ state: "visible", timeout: 20000 }).catch(() => undefined);
    if (!(await username.count()) || !(await secret.count())) {
      const said = (await bodyText()).replace(/\s+/g, " ").slice(0, 300);
      unbound(where, `pressing ${way} hands off to ${originOf(page.url())}, which shows no username and password form; it says: ${said}`);
    }
    await username.fill(entry.username);
    await secret.fill(password);
    await seen(page.getByRole("button", { name: /^\s*sign in\s*$/i })).first().click();
    const home = originOf(baseURL);
    const back = await page
      .waitForURL((url) => url.origin === home && !url.pathname.startsWith("/auth/"), { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
    if (!back) {
      // Still at the provider: it refused the account, and says why.
      const said = (await bodyText()).replace(/\s+/g, " ").slice(0, 300);
      throw new Error(`${where} — the identity provider at ${originOf(page.url())} did not hand back to ${home} after "Sign In" as ${entry.username}; it says: ${said}`);
    }
    await ready();
  }

  async function signOut(): Promise<void> {
    await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" }).catch(() => undefined);
    await settle();
    await page
      .evaluate(() => {
        try {
          window.localStorage.clear();
          window.sessionStorage.clear();
        } catch {
          // Nothing kept.
        }
      })
      .catch(() => undefined);
    await page.context().clearCookies().catch(() => undefined);
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await ready();
  }

  // ================================================================ screens that are here

  // ---------------------------------------------------------------- home

  const home: S.HomePage = {
    open: () => go("/"),
    browseOpportunities: () => press("home.browse_opportunities", /^\s*browse opportunities\s*$/i),
    signIn: () => press("home.sign_in", /^\s*sign in\s*$/i, seen(page.getByRole("main")).first()),
    signUp: () => press("home.sign_up", /^\s*sign up\s*$/i, seen(page.getByRole("main")).first()),
    // The home page draws no awarded figures on this target: read as nothing.
    totalAwardedOpportunityCount: async () => (await valueAbove(/total opportunities awarded/i)),
    totalAwardedOpportunityValue: async () => (await valueAbove(/total value of all opportunities/i)),
    readableWhenSignedOut: () => mainText(),
  };

  async function valueAbove(label: RegExp): Promise<string> {
    const lines = lined(await mainText());
    for (let i = 1; i < lines.length; i++) if (label.test(lines[i])) return lines[i - 1];
    return "";
  }

  // ---------------------------------------------------------------- /status

  // Not a screen: the address answers "OK" as plain text. Requesting it is the act the
  // contract names.
  const scheduledTransitionTrigger: S.ScheduledTransitionTriggerPage = {
    open: async () => {
      await page.goto(baseURL + "/status", { waitUntil: "domcontentloaded" });
    },
    runPendingTransitions: async () => {
      const response = await page.goto(baseURL + "/status", { waitUntil: "domcontentloaded" });
      if (!response || response.status() >= 400) {
        unbound("scheduled-transition-trigger.run_pending_transitions", `${baseURL}/status answered ${response?.status() ?? "nothing"}`);
      }
    },
    serviceIsUp: async () => {
      if (new URL(page.url()).pathname !== "/status") await page.goto(baseURL + "/status", { waitUntil: "domcontentloaded" });
      return bodyText();
    },
  };

  // ---------------------------------------------------------------- the footer

  // The "contentinfo" landmark, with About, Disclaimer, Privacy, Accessibility and Copyright
  // under "About this service".
  const footer = (): Locator => seen(page.getByRole("contentinfo")).first();

  async function footerLink(name: RegExp): Promise<string> {
    await ready();
    if (!(await footer().count())) return "";
    const link = seen(footer().getByRole("link", { name }));
    return (await link.count()) ? ((await link.first().getAttribute("href")) ?? "") : "";
  }

  async function openFromFooter(where: string, name: RegExp): Promise<void> {
    await ready();
    if (!(await footer().count())) unbound(where, `the screen at ${page.url()} carries no footer`);
    await press(where, name, footer());
    await ready();
  }

  const contentFooter: S.ContentFooterPage = {
    open: () => go("/"),
    openAbout: () => openFromFooter("content-footer.open_about", /^\s*about\s*$/i),
    openDisclaimer: () => openFromFooter("content-footer.open_disclaimer", /^\s*disclaimer\s*$/i),
    openPrivacy: () => openFromFooter("content-footer.open_privacy", /^\s*privacy\s*$/i),
    openAccessibility: () => openFromFooter("content-footer.open_accessibility", /^\s*accessibility\s*$/i),
    openCopyright: () => openFromFooter("content-footer.open_copyright", /^\s*copyright\s*$/i),
    aboutLink: () => footerLink(/^\s*about\s*$/i),
    disclaimerLink: () => footerLink(/^\s*disclaimer\s*$/i),
    privacyLink: () => footerLink(/^\s*privacy\s*$/i),
    accessibilityLink: () => footerLink(/^\s*accessibility\s*$/i),
    copyrightLink: () => footerLink(/^\s*copyright\s*$/i),
    presentWhenSignedOut: async () => {
      await ready();
      return (await footer().count()) ? lined(await footer().innerText()).join("\n") : "";
    },
  };

  // ---------------------------------------------------------------- the service level agreement link

  // "service level agreement", under "What it costs" on each program explainer, leading to
  // /content/service-level-agreement.
  const slaLink = (): Locator => seen(page.getByRole("main").getByRole("link", { name: /service level agreement/i }));

  async function slaHref(): Promise<string> {
    await ready();
    return (await slaLink().count()) ? ((await slaLink().first().getAttribute("href")) ?? "") : "";
  }

  const contentServiceLevelAgreementLink: S.ContentServiceLevelAgreementLinkPage = {
    open: () => go("/learn-more/code-with-us"),
    followServiceLevelAgreementLink: async () => {
      const href = await slaHref();
      if (!href) unbound("content-service-level-agreement-link.follow_service_level_agreement_link", `no service level agreement link on ${page.url()}`);
      await slaLink().first().click();
      await ready();
    },
    serviceLevelAgreementLink: async () => {
      await ready();
      return (await slaLink().count()) ? (await slaLink().first().innerText()).trim() : "";
    },
    linkTargetAddress: () => slaHref(),
    answerAtLinkTarget: async () => {
      const href = await slaHref();
      if (!href) return "";
      await visit(href);
      return mainText();
    },
  };

  // ---------------------------------------------------------------- a published page

  // An "article" named by the page's title: a heading, a list of "Published" and "Last
  // updated" dates, the body, and "Address of this page: /content/<slug>".
  let dialogsSeen: string[] = [];
  let dialogListener: ((dialog: Dialog) => void) | null = null;

  function listenForDialogs(): void {
    if (dialogListener) page.off("dialog", dialogListener);
    dialogsSeen = [];
    dialogListener = (raised: Dialog) => {
      dialogsSeen.push(raised.message());
      raised.dismiss().catch(() => undefined);
    };
    page.on("dialog", dialogListener);
  }

  const article = (): Locator => seen(page.getByRole("main").getByRole("article")).first();

  async function onPublishedPage(where: string): Promise<Locator> {
    await ready();
    const why = await whyNotHere();
    if (why || !(await article().count())) {
      unbound(where, `no published page is shown: ${why || `${page.url()} carries no page`}`);
    }
    return article();
  }

  // The body is the block that follows the one holding the title and its dates.
  async function bodyBlock(where: string): Promise<Locator> {
    const shown = await onPublishedPage(where);
    return shown.getByRole("heading", { level: 1 }).locator("xpath=ancestor::*[parent::article][1]/following-sibling::*[1]");
  }

  async function publishedPageShown(): Promise<boolean> {
    await ready();
    return !(await whyNotHere()) && (await article().count()) > 0;
  }

  async function datedAs(term: RegExp): Promise<string> {
    if (!(await publishedPageShown())) return "";
    const terms = seen(article().getByRole("term"));
    const definitions = seen(article().getByRole("definition"));
    for (let i = 0; i < (await terms.count()); i++) {
      if (term.test((await terms.nth(i).innerText()).trim())) return (await definitions.nth(i).innerText()).trim();
    }
    return "";
  }

  const contentView: S.ContentViewPage = {
    // An address with no page behind it is something a criterion is about, so this never
    // refuses to open one. Dialogs are listened for from before the address is asked for,
    // so markup that runs as the page renders is caught.
    open: async (params) => {
      listenForDialogs();
      await go("/content/:slug", params as unknown as Record<string, string>, { slug: [] });
    },
    followBodyLink: async () => {
      const where = "content-view.follow_body_link";
      const body = await bodyBlock(where);
      const links = seen(body.getByRole("link"));
      if (!(await links.count())) unbound(where, `the body of the page at ${page.url()} carries no link`);
      await links.first().click();
      await ready();
    },
    pageAddress: async () => {
      if (!(await publishedPageShown())) return "";
      const found = /Address of this page:\s*(\S+)/.exec(await article().innerText());
      return found ? found[1] : "";
    },
    pageTitle: async () => {
      if (!(await publishedPageShown())) return "";
      return (await article().getByRole("heading", { level: 1 }).first().innerText()).trim();
    },
    pageBody: async () => {
      if (!(await publishedPageShown())) return "";
      return lined(await (await bodyBlock("content-view.page_body")).innerText()).join("\n");
    },
    bodyElementNames: async () => {
      const body = await bodyBlock("content-view.body_element_names");
      return body.evaluate((element) => {
        const names: string[] = [];
        const walk = (parent: Element): void => {
          for (const child of Array.from(parent.children)) {
            names.push(child.tagName.toLowerCase());
            walk(child);
          }
        };
        walk(element);
        return names.join("\n");
      });
    },
    bodyScriptRan: async () => {
      const where = "content-view.body_script_ran";
      if (!dialogListener) unbound(where, "the page was not opened through content-view.open, so nothing was listening");
      await onPublishedPage(where);
      await page.waitForTimeout(3000);
      return dialogsSeen.length ? "yes" : "";
    },
    publishedDate: () => datedAs(/^published$/i),
    updatedDate: () => datedAs(/^(last )?updated$/i),
    readableWhenSignedOut: async () => ((await publishedPageShown()) ? lined(await article().innerText()).join("\n") : ""),
    notFoundForUnknownAddress: async () => ((await publishedPageShown()) ? "" : refusalShown()),
  };

  // ---------------------------------------------------------------- sign in, sign up, sign out, notices

  async function card(name: string): Promise<string> {
    await ready();
    const region = seen(page.getByRole("main").getByRole("region", { name, exact: true }));
    return (await region.count()) ? lined(await region.first().innerText()).join("\n") : "";
  }

  const userSignIn: S.UserSignInPage = {
    open: () => go("/sign-in"),
    signInAsVendor: () => press("user-sign-in.sign_in_as_vendor", /^\s*sign in as a vendor\s*$/i),
    signInAsPublicSectorEmployee: () =>
      press("user-sign-in.sign_in_as_public_sector_employee", /^\s*sign in as a public sector employee\s*$/i),
    goToSignUp: () => press("user-sign-in.go_to_sign_up", /^\s*sign up\s*$/i, seen(page.getByRole("main")).first()),
    vendorCard: () => card("Vendor"),
    publicSectorCard: () => card("Public sector employee"),
  };

  const userSignUpChooseAccount: S.UserSignUpChooseAccountPage = {
    open: () => go("/sign-up"),
    signUpAsVendor: () => press("user-sign-up-choose-account.sign_up_as_vendor", /^\s*sign up as a vendor\s*$/i),
    signUpAsPublicSectorEmployee: () =>
      press("user-sign-up-choose-account.sign_up_as_public_sector_employee", /^\s*sign up as a public sector employee\s*$/i),
    vendorCard: () => card("Vendor"),
    publicSectorCard: () => card("Public sector employee"),
  };

  // /sign-out: "Signed Out", with the status "You have successfully signed out" and "Sign
  // in again". Opening it signs the browser out.
  const userSignOut: S.UserSignOutPage = {
    open: () => go("/sign-out"),
    signedOutMessage: async () => {
      await ready();
      const status = seen(page.getByRole("main").getByRole("status"));
      const said = (await status.count()) ? lined(await status.first().innerText()).join("\n") : "";
      return /signed out/i.test(said) ? said : linesMatching(/successfully signed out/i);
    },
    signOutFailedMessage: () => linesMatching(/(sign.?out|signing out).*(fail|could not|unable)|(fail|could not|unable).*sign.?out/i),
  };

  // /notice/deactivatedOwnAccount: "Your account has been deactivated", two paragraphs,
  // "Back to home". /notice/authFailure: "Sign in failed", "We could not sign you in.
  // Please try again.", "Try signing in again", "Back to home". Any other notice is "Page
  // not found".
  async function noticeSaying(heading: RegExp): Promise<string> {
    await ready();
    if (!(await seen(page.getByRole("main").getByRole("heading", { level: 1, name: heading })).count())) return "";
    return lined(await mainText())
      .filter((line) => !/^(back to home|try signing in again)$/i.test(line))
      .join("\n");
  }

  const userNotice: S.UserNoticePage = {
    open: (params) => go("/notice/:noticeId", params as unknown as Record<string, string>),
    backToHome: () => press("user-notice.back_to_home", /^\s*back to home\s*$/i),
    deactivatedOwnAccountNotice: () => noticeSaying(/deactivated/i),
    signInFailedNotice: () => noticeSaying(/^\s*sign.?in failed\s*$/i),
  };

  // ---------------------------------------------------------------- screens behind a session

  // The checks every member of a signed-in screen makes before it reads or presses
  // anything: a refusal, a redirect to the sign-in screen or a hand-off is not the screen.
  function signedIn(pageId: string, route: string) {
    const where = (member: string): string => `${pageId}.${member}`;
    return {
      where,
      on: async (member: string): Promise<void> => {
        await ready();
        const why = await whyNotHere();
        if (why) unbound(where(member), `${route} did not open as the screen: ${why}`);
      },
    };
  }

  // A control the contract names that this build does not draw. Looked for at run time by
  // its accessible name, pressed if it is there, and reported with what the screen offers
  // instead when it is not.
  async function pressOffered(where: string, name: RegExp, reached: string, scope: Scope = page): Promise<void> {
    await ready();
    const control = await findControl(scope, name);
    if (!control) unbound(where, `${reached}; there is no control named ${name}: it offers ${await offered()}`);
    await press(where, name, scope);
  }

  // ---------------------------------------------------------------- the dashboard

  // Whoever signs in, /dashboard shows "Dashboard" and "You are signed in as <name>." and
  // nothing else: no table, no tab, no message, no control. A reading of any of those is
  // empty; an action on one reports what the screen offers.
  function dashboard(pageId: string) {
    const screen = signedIn(pageId, "/dashboard");
    const reached = `signed in and opened /dashboard, which shows only "Dashboard" and "You are signed in as …"`;
    const act = (member: string, name: RegExp) => async (): Promise<void> => {
      await screen.on(member);
      await pressOffered(screen.where(member), name, reached);
    };
    const rows = (member: string) => async (): Promise<string> => {
      await screen.on(member);
      const found = seen(page.getByRole("main").getByRole("row"));
      const out: string[] = [];
      for (let i = 0; i < (await found.count()); i++) out.push(lined(await found.nth(i).innerText()).join(" | "));
      return out.join("\n");
    };
    const lines = (member: string, pattern: RegExp) => async (): Promise<string> => {
      await screen.on(member);
      return linesMatching(pattern);
    };
    return { screen, act, rows, lines, open: () => go("/dashboard") };
  }

  const opsDash = dashboard("opportunity-dashboard");
  const opportunityDashboard: S.OpportunityDashboardPage = {
    open: opsDash.open,
    createOpportunity: opsDash.act("create_opportunity", /create( an?)?( new)? opportunity/i),
    openOpportunity: async (input) => {
      const member = "open_opportunity";
      await opsDash.screen.on(member);
      const id = seededId(given(input, ["opportunity", "opportunityId", "id"]) ?? (typeof input === "string" ? input : ""), "opportunities");
      const links = seen(page.getByRole("main").getByRole("link"));
      for (let i = 0; i < (await links.count()); i++) {
        if (id && ((await links.nth(i).getAttribute("href")) ?? "").includes(id)) {
          await links.nth(i).click();
          await ready();
          return;
        }
      }
      unbound(opsDash.screen.where(member), `signed in and opened /dashboard: no link to ${JSON.stringify(input)}; it offers ${await offered()}`);
    },
    myOpportunitiesTable: opsDash.rows("my_opportunities_table"),
    opportunityStatus: opsDash.rows("opportunity_status"),
    ownOpportunitiesOnly: opsDash.rows("own_opportunities_only"),
    allOpportunitiesForAdministrator: opsDash.rows("all_opportunities_for_administrator"),
    emptyMyOpportunitiesMessage: opsDash.lines("empty_my_opportunities_message", /\bno\b.*opportunit|haven.t|nothing to show/i),
  };

  const vendorDash = dashboard("proposal-vendor-dashboard");
  const proposalVendorDashboard: S.ProposalVendorDashboardPage = {
    open: vendorDash.open,
    showMyProposals: vendorDash.act("show_my_proposals", /my proposals/i),
    showOrgProposals: vendorDash.act("show_org_proposals", /organization.?s? proposals/i),
    myProposalsTable: vendorDash.rows("my_proposals_table"),
    orgProposalsTable: vendorDash.rows("org_proposals_table"),
    proposalStatus: vendorDash.rows("proposal_status"),
    emptyMyProposalsMessage: vendorDash.lines("empty_my_proposals_message", /\bno\b.*proposal|haven.t/i),
    emptyOrgProposalsMessage: vendorDash.lines("empty_org_proposals_message", /\bno\b.*organization.*proposal/i),
  };

  const panelDash = dashboard("evaluation-panel-dashboard");
  const evaluationPanelDashboard: S.EvaluationPanelDashboardPage = {
    open: panelDash.open,
    showMyOpportunities: panelDash.act("show_my_opportunities", /my opportunities/i),
    showPanelOpportunities: panelDash.act("show_panel_opportunities", /evaluations|panel/i),
    openOpportunity: panelDash.act("open_opportunity", /opportunit/i),
    evaluationsTab: async () => {
      await panelDash.screen.on("evaluations_tab");
      const tab = seen(page.getByRole("main").getByRole("tab", { name: /evaluations/i }).or(page.getByRole("main").getByRole("link", { name: /evaluations/i })));
      return (await tab.count()) ? (await tab.first().innerText()).trim() : "";
    },
    panelOpportunitiesTable: panelDash.rows("panel_opportunities_table"),
    opportunityStatus: panelDash.rows("opportunity_status"),
    emptyPanelOpportunitiesMessage: panelDash.lines("empty_panel_opportunities_message", /\bno\b.*(evaluat|panel|opportunit)/i),
  };

  // ---------------------------------------------------------------- completing a profile

  // Shown to a vendor account that has not completed its profile (a first sign-in, or
  // seed.users' vendor part-way through): "Complete Your Profile", "Choose a profile
  // picture", a read-only "Sign-in username", "Name (required)", "Email address (required)",
  // "Email me when new opportunities are posted", "I have read and agree to the terms and
  // conditions and the privacy policy (required)" and "Complete profile", disabled until
  // that box is ticked. A refused form draws an alert "Your profile has N problems" listing
  // each field's message, and each field's own message under it. Any other account is sent
  // on to /dashboard (a first-time public sector employee included: their account is made
  // complete).
  const signUp = signedIn("user-sign-up-complete", "/sign-up/complete");
  const TERMS_BOX = /i have read and agree/i;
  const NOTICES_BOX = /new opportunities/i;
  const PROFILE_FIELDS: Record<string, RegExp> = {
    name: /^\s*name\b/i,
    email: /^\s*email address\b/i,
    jobtitle: /^\s*job title\b/i,
  };
  const IDP_FIELD = /^\s*sign-in username\b/i;
  const TERMS_KEYS = ["acceptTerms", "acceptAppTerms", "terms", "acceptedTerms", "agree", "termsAccepted"];
  const NOTICE_KEYS = ["notifications", "notificationsOn", "newOpportunities", "notifyNewOpportunities", "newOpportunityNotifications", "toggleNewOpportunityNotifications"];
  const PICTURE_KEYS = ["avatar", "image", "picture", "profilePicture"];

  async function onSignUpForm(member: string): Promise<void> {
    await signUp.on(member);
    if (new URL(page.url()).pathname !== "/sign-up/complete") {
      unbound(signUp.where(member), `/sign-up/complete sent this account on to ${page.url()} instead of showing the profile form; it is shown only to a vendor account that has not completed its profile`);
    }
  }

  function textbox(label: RegExp): Locator {
    return seen(page.getByRole("main").getByRole("textbox", { name: label })).first();
  }

  async function fieldValue(label: RegExp): Promise<string> {
    const box = textbox(label);
    return (await box.count()) ? valueOf(box) : "";
  }

  async function setBox(where: string, name: RegExp, wanted: boolean | undefined): Promise<void> {
    const box = seen(page.getByRole("main").getByRole("checkbox", { name })).first();
    if (!(await box.count())) unbound(where, `no box named ${name} on ${page.url()}; it offers ${await offered()}`);
    if (await isReadOnly(box)) unbound(where, `the box named ${name} on ${page.url()} is drawn read-only, so it cannot be changed here`);
    const target = wanted ?? !(await box.isChecked());
    if ((await box.isChecked()) !== target) await box.setChecked(target);
    await settle();
  }

  const boxWanted = (input: unknown, keys: string[]): boolean | undefined => {
    if (typeof input === "boolean" || typeof input === "string") return saysYes(input);
    const value = given(input, [...keys, "checked", "value", "on", "enabled"]);
    return value === undefined ? undefined : saysYes(value);
  };

  // Every value the test gave, entered in the field its key names, before anything is
  // pressed. A key no field on the screen takes is reported rather than dropped.
  async function fillFields(where: string, input: unknown, skip: string[]): Promise<void> {
    const skipped = skip.map(squash);
    for (const [key, value] of Object.entries(record(input))) {
      if (value === undefined || skipped.includes(squash(key))) continue;
      const label = PROFILE_FIELDS[squash(key)];
      const box = label ? textbox(label) : null;
      if (!box || !(await box.count())) unbound(where, `no field on ${page.url()} takes "${key}"; it offers ${await offered()}`);
      if (await isReadOnly(box)) unbound(where, `the field for "${key}" on ${page.url()} is read-only`);
      await box.fill(textOf(value));
    }
  }

  const userSignUpComplete: S.UserSignUpCompletePage = {
    open: () => go("/sign-up/complete"),
    // "Choose a profile picture" opens no file chooser on this build (pressed by mouse and
    // by keyboard, nothing reaches the picture input beside it).
    changeAvatar: async (input) => {
      await onSignUpForm("change_avatar");
      await offerFile(signUp.where("change_avatar"), /choose a profile picture/i, input);
    },
    acceptAppTerms: async (input) => {
      await onSignUpForm("accept_app_terms");
      await setBox(signUp.where("accept_app_terms"), TERMS_BOX, input === undefined ? true : boxWanted(input, TERMS_KEYS) ?? true);
    },
    toggleNewOpportunityNotifications: async (input) => {
      await onSignUpForm("toggle_new_opportunity_notifications");
      await setBox(signUp.where("toggle_new_opportunity_notifications"), NOTICES_BOX, input === undefined ? undefined : boxWanted(input, NOTICE_KEYS));
    },
    completeProfile: async (input) => {
      const where = signUp.where("complete_profile");
      await onSignUpForm("complete_profile");
      await fillFields(where, input, [...TERMS_KEYS, ...NOTICE_KEYS, ...PICTURE_KEYS]);
      if (given(input, NOTICE_KEYS) !== undefined) await setBox(where, NOTICES_BOX, boxWanted(given(input, NOTICE_KEYS), []));
      if (given(input, TERMS_KEYS) !== undefined) await setBox(where, TERMS_BOX, boxWanted(given(input, TERMS_KEYS), []));
      const picture = given(input, PICTURE_KEYS);
      if (picture !== undefined) await offerFile(where, /choose a profile picture/i, picture);
      await press(where, /^\s*complete profile\s*$/i);
      // Accepted, the browser goes on to /dashboard; refused, the form stays and says why,
      // which field_error reads.
      await page.waitForURL((url) => url.pathname !== "/sign-up/complete", { timeout: 10000 }).catch(() => undefined);
      await ready();
    },
    idpUsernameReadonly: async () => {
      await onSignUpForm("idp_username_readonly");
      return fieldValue(IDP_FIELD);
    },
    nameField: async () => {
      await onSignUpForm("name_field");
      return fieldValue(PROFILE_FIELDS.name);
    },
    emailField: async () => {
      await onSignUpForm("email_field");
      return fieldValue(PROFILE_FIELDS.email);
    },
    // A vendor's form carries no job title: read as nothing.
    jobTitleField: async () => {
      await onSignUpForm("job_title_field");
      return fieldValue(PROFILE_FIELDS.jobtitle);
    },
    termsCheckbox: async () => {
      await onSignUpForm("terms_checkbox");
      const box = seen(page.getByRole("main").getByRole("checkbox", { name: TERMS_BOX })).first();
      return (await box.count()) ? boxState(box) : "";
    },
    // "disabled" while the terms box is unticked and "Complete profile" cannot be pressed;
    // nothing otherwise.
    completeDisabledUntilTermsAccepted: async () => {
      await onSignUpForm("complete_disabled_until_terms_accepted");
      const box = seen(page.getByRole("main").getByRole("checkbox", { name: TERMS_BOX })).first();
      if (!(await box.count()) || (await box.isChecked())) return "";
      const control = await findControl(page, /^\s*complete profile\s*$/i);
      return control && (await isDisabled(control)) ? "disabled" : "";
    },
    fieldError: async () => {
      await onSignUpForm("field_error");
      return formMessages();
    },
  };

  // ---------------------------------------------------------------- a profile

  // /users/me and /users/<own id>: "User Profile", a "Profile sections" navigation (Profile,
  // Capabilities, Organizations, Notifications, Legal for a vendor; Profile and
  // Notifications for public sector staff), "Account type: …", "Status: …", "Account ID:
  // …", a "Details" region with "No profile picture has been added." and read-only boxes
  // "Sign-in username", "Name", "Email address" (and "Job title" for public sector staff),
  // and for public sector staff a "Permissions" region ("You have / do not have
  // administrator permissions."). Nothing on it can be edited, deactivated or changed: those
  // actions look for their control and report what the screen offers. Another person's
  // /users/<id> is "Page not found", the administrator included.
  function profileScreen(pageId: string, route: string) {
    const screen = signedIn(pageId, route);
    const w = screen.where;
    const reached = (member: string) => `signed in and opened ${page.url()}, the profile (${member})`;
    const act = (member: string, name: RegExp) => async (): Promise<void> => {
      await screen.on(member);
      await pressOffered(w(member), name, `${reached(member)}, which shows its details read-only`);
    };
    const field = (member: string, label: RegExp) => async (): Promise<string> => {
      await screen.on(member);
      return fieldValue(label);
    };
    // A tab is offered when the profile's sections name it; its label is read, or nothing
    // when the section is not offered to this account.
    const tab = (member: string, name: RegExp) => async (): Promise<string> => {
      await screen.on(member);
      const sections = seen(page.getByRole("navigation", { name: /profile sections/i }));
      if (!(await sections.count())) return "";
      const link = seen(sections.first().getByRole("link", { name }));
      return (await link.count()) ? (await link.first().innerText()).trim() : "";
    };
    return {
      editProfile: act("edit_profile", /^\s*edit( profile)?\s*$/i),
      saveChanges: async (input?: unknown) => {
        await screen.on("save_changes");
        const control = await findControl(page, /^\s*save( changes)?\s*$/i);
        if (!control) unbound(w("save_changes"), `${reached("save_changes")}, which shows its details read-only; there is no control named "Save": it offers ${await offered()}`);
        await fillFields(w("save_changes"), input, PICTURE_KEYS);
        await press(w("save_changes"), /^\s*save( changes)?\s*$/i);
      },
      cancelEditing: act("cancel_editing", /^\s*cancel\s*$/i),
      changeAvatar: async (input?: unknown) => {
        await screen.on("change_avatar");
        await offerFile(w("change_avatar"), /profile picture|avatar|choose image/i, input);
      },
      toggleAdminPermission: act("toggle_admin_permission", /administrator|admin/i),
      deactivateAccount: act("deactivate_account", /deactivate/i),
      reactivateAccount: act("reactivate_account", /reactivate/i),
      confirmActivationChange: async () => {
        await screen.on("confirm_activation_change");
        await inDialog(w("confirm_activation_change"), /deactivate|reactivate|confirm|^\s*yes\s*$/i, reached("confirm_activation_change"));
      },
      cancelActivationChange: async () => {
        await screen.on("cancel_activation_change");
        await inDialog(w("cancel_activation_change"), /^\s*(cancel|no)\s*$/i, reached("cancel_activation_change"));
      },
      userIdentifier: async () => {
        await screen.on("user_identifier");
        return labelled("Account ID");
      },
      profileTab: tab("profile_tab", /^\s*profile\s*$/i),
      capabilitiesTab: tab("capabilities_tab", /^\s*capabilities\s*$/i),
      notificationsTab: tab("notifications_tab", /^\s*notifications\s*$/i),
      legalTab: tab("legal_tab", /^\s*legal\s*$/i),
      organizationsTab: tab("organizations_tab", /^\s*organizations\s*$/i),
      statusBadge: async () => {
        await screen.on("status_badge");
        return labelled("Status");
      },
      accountType: async () => {
        await screen.on("account_type");
        return labelled("Account type");
      },
      permissionsLabel: async () => {
        await screen.on("permissions_label");
        const region = seen(page.getByRole("main").getByRole("region", { name: /permissions/i }));
        if (!(await region.count())) return "";
        return lined(await region.first().innerText())
          .filter((line) => !/^permissions$/i.test(line))
          .join("\n");
      },
      adminCheckbox: async () => {
        await screen.on("admin_checkbox");
        const box = seen(page.getByRole("main").getByRole("checkbox", { name: /admin/i }));
        return (await box.count()) ? boxState(box.first()) : "";
      },
      idpUsernameReadonly: field("idp_username_readonly", IDP_FIELD),
      nameField: field("name_field", PROFILE_FIELDS.name),
      emailField: field("email_field", PROFILE_FIELDS.email),
      jobTitleField: field("job_title_field", PROFILE_FIELDS.jobtitle),
      fieldError: async () => {
        await screen.on("field_error");
        return formMessages();
      },
      activationModal: async () => {
        await screen.on("activation_modal");
        return dialogText();
      },
    };
  }

  const userGroups = { userId: ["users"] };

  const {
    reactivateAccount: _selfHasNoReactivate,
    toggleAdminPermission: _selfHasNoAdmin,
    permissionsLabel: _selfHasNoPermissions,
    adminCheckbox: _selfHasNoAdminBox,
    ...selfProfile
  } = profileScreen("user-profile-self", "/users/me");
  void _selfHasNoReactivate;
  void _selfHasNoAdmin;
  void _selfHasNoPermissions;
  void _selfHasNoAdminBox;

  const userProfileSelf: S.UserProfileSelfPage = {
    ...selfProfile,
    open: () => go("/users/me"),
    // Signed out, /users/me redirects to /sign-in with the status "Sign in to see your
    // profile …", which is read back; the profile itself reads as nothing.
    signInRequired: async () => {
      await ready();
      return new URL(page.url()).pathname === "/sign-in" ? refusalShown() : "";
    },
  };

  const userProfile: S.UserProfilePage = {
    ...profileScreen("user-profile", "/users/:userId"),
    open: (params) => go("/users/:userId", params as unknown as Record<string, string>, userGroups),
    // An account the reader may not see, or none by that identifier: the "Page not found"
    // screen, read whole; a profile that opened reads as nothing.
    notFoundPage: async () => {
      await ready();
      return (await seen(page.getByRole("heading", { name: /^\s*page not found\s*$/i })).count()) ? refusalShown() : "";
    },
  };

  // ---------------------------------------------------------------- notices of new opportunities

  // "Notifications": "Notifications are sent to <address>. If this is wrong, correct it on
  // your profile." and the box "Email me when new opportunities are posted", drawn
  // read-only (it shows the setting and cannot change it). No unsubscribe confirmation is
  // drawn, on arrival with &unsubscribe or otherwise.
  function noticesScreen(pageId: string, route: string) {
    const screen = signedIn(pageId, route);
    const w = screen.where;
    const box = (): Locator => seen(page.getByRole("main").getByRole("checkbox", { name: NOTICES_BOX })).first();
    const reached = () => `signed in and opened ${page.url()}, the notifications tab`;
    return {
      toggleNewOpportunityNotifications: async (input?: unknown) => {
        await screen.on("toggle_new_opportunity_notifications");
        await setBox(w("toggle_new_opportunity_notifications"), NOTICES_BOX, input === undefined ? undefined : boxWanted(input, NOTICE_KEYS));
      },
      confirmUnsubscribe: async () => {
        await screen.on("confirm_unsubscribe");
        await inDialog(w("confirm_unsubscribe"), /unsubscribe|confirm|^\s*yes\s*$/i, reached());
      },
      cancelUnsubscribe: async () => {
        await screen.on("cancel_unsubscribe");
        await inDialog(w("cancel_unsubscribe"), /^\s*(cancel|no)\s*$/i, reached());
      },
      newOpportunitiesCheckbox: async () => {
        await screen.on("new_opportunities_checkbox");
        return (await box().count()) ? boxState(box()) : "";
      },
      notificationEmailAddress: async () => {
        await screen.on("notification_email_address");
        const found = /notifications are sent to\s+([^\s@]+@[^\s@]+?)\.?(?:\s|$)/i.exec(await mainText());
        return found ? found[1] : "";
      },
      unsubscribeModal: async () => {
        await screen.on("unsubscribe_modal");
        return dialogText();
      },
    };
  }

  const userProfileSelfNotifications: S.UserProfileSelfNotificationsPage = {
    ...noticesScreen("user-profile-self-notifications", "/users/me?tab=notifications"),
    open: () => go("/users/me?tab=notifications"),
  };

  const userProfileNotifications: S.UserProfileNotificationsPage = {
    ...noticesScreen("user-profile-notifications", "/users/:userId?tab=notifications"),
    open: (params) => go("/users/:userId?tab=notifications", params as unknown as Record<string, string>, userGroups),
  };

  const landing = noticesScreen("notification-unsubscribe-landing", "/users/me?tab=notifications&unsubscribe");
  const notificationUnsubscribeLanding: S.NotificationUnsubscribeLandingPage = {
    open: () => go("/users/me?tab=notifications&unsubscribe"),
    confirmUnsubscribe: landing.confirmUnsubscribe,
    cancelUnsubscribe: landing.cancelUnsubscribe,
    unsubscribeConfirmation: landing.unsubscribeModal,
    confirmationNamesSignedInAddress: async () => {
      const said = await landing.unsubscribeModal();
      return /[^\s@]+@[^\s@]+\.[^\s@.]+/.exec(said)?.[0] ?? "";
    },
    resolvesToSignedInPerson: landing.notificationEmailAddress,
    signInRequired: async () => {
      await ready();
      return new URL(page.url()).pathname === "/sign-in" ? refusalShown() : "";
    },
  };

  // ---------------------------------------------------------------- policies, terms and agreements

  // "Policies, Terms & Agreements": a "Privacy policy" region (a link to /content/privacy and
  // "You agreed to this policy when your account was created."), a "Terms and conditions"
  // region (a link to /content/terms-and-conditions and "You agreed to the terms and
  // conditions on <date>" — "You last agreed …" for the vendor whose agreement was reset),
  // and a "Program terms" region with the three programs' terms. No warning and no control to
  // agree again is drawn, for that vendor or anyone.
  function legalScreen(pageId: string, route: string) {
    const screen = signedIn(pageId, route);
    const w = screen.where;
    const region = (name: RegExp): Locator => seen(page.getByRole("main").getByRole("region", { name })).first();
    const regionLines = async (name: RegExp): Promise<string[]> => ((await region(name).count()) ? lined(await region(name).innerText()) : []);
    const termsLink = (): Locator => seen(region(/^terms and conditions$/i).getByRole("link"));
    const reached = () => `signed in and opened ${page.url()}, the Legal tab`;
    return {
      openAppTerms: async () => {
        await screen.on("open_app_terms");
        if (!(await termsLink().count())) unbound(w("open_app_terms"), `${reached()}; no link in its "Terms and conditions" section`);
        await termsLink().first().click();
        await ready();
      },
      acceptUpdatedTerms: async () => {
        await screen.on("accept_updated_terms");
        await pressOffered(w("accept_updated_terms"), /accept|agree/i, reached());
      },
      confirmAcceptUpdatedTerms: async () => {
        await screen.on("confirm_accept_updated_terms");
        await inDialog(w("confirm_accept_updated_terms"), /accept|agree|confirm/i, reached());
      },
      privacyPolicy: async () => {
        await screen.on("privacy_policy");
        return (await regionLines(/^privacy policy$/i)).filter((line) => !/^privacy policy$/i.test(line)).join("\n");
      },
      appTermsLink: async () => {
        await screen.on("app_terms_link");
        return (await termsLink().count()) ? ((await termsLink().first().getAttribute("href")) ?? "") : "";
      },
      acceptedOnNotice: async () => {
        await screen.on("accepted_on_notice");
        return (await regionLines(/^terms and conditions$/i)).filter((line) => /agreed/i.test(line)).join("\n");
      },
      termsUpdatedWarning: async () => {
        await screen.on("terms_updated_warning");
        return linesMatching(/(terms|conditions).*(updated|changed)|(updated|changed|new).*(terms|conditions)/i);
      },
      programTermsLinks: async () => {
        await screen.on("program_terms_links");
        const links = seen(region(/^program terms$/i).getByRole("link"));
        const out: string[] = [];
        for (let i = 0; i < (await links.count()); i++) {
          out.push(`${(await links.nth(i).innerText()).trim()} -> ${(await links.nth(i).getAttribute("href")) ?? ""}`);
        }
        return out.join("\n");
      },
      acceptUpdatedTermsModal: async () => {
        await screen.on("accept_updated_terms_modal");
        return dialogText();
      },
    };
  }

  const userProfileSelfLegal: S.UserProfileSelfLegalPage = {
    ...legalScreen("user-profile-self-legal", "/users/me?tab=legal"),
    open: () => go("/users/me?tab=legal"),
  };

  const userProfileLegal: S.UserProfileLegalPage = {
    ...legalScreen("user-profile-legal", "/users/:userId?tab=legal"),
    open: (params) => go("/users/:userId?tab=legal", params as unknown as Record<string, string>, userGroups),
  };

  // ---------------------------------------------------------------- tabs that show the profile again

  // The profile's "Capabilities" and "Organizations" links lead here, and the screen shows
  // the profile's own details ("User Profile", "Account type", "Details") again: no
  // capability, no organization, no membership, no invitation is drawn. open() goes there;
  // every member names what it found.
  function profileAgain<T>(pageId: string, route: string, groups?: Record<string, string[]>): T {
    const why = `signed in as a vendor (and as the organization owner) and opened ${route}: the screen shows the profile's own details ("User Profile", "Account type", "Status", "Account ID", "Details") and nothing of this tab — no rows, boxes, tables or controls`;
    return stub<T>(pageId, why, async (params) => {
      await go(route, params, groups);
    });
  }

  // ---------------------------------------------------------------- the image picker on one's own profile

  // /users/me shows "No profile picture has been added." and no control to choose one.
  const picker = signedIn("file-image-picker", "/users/me");
  const profilePicture = (): Locator => seen(page.getByRole("main").getByRole("region", { name: /details/i }).getByRole("img"));
  async function pictureOrUnbound(member: string): Promise<Locator> {
    await picker.on(member);
    if (!(await profilePicture().count())) {
      unbound(picker.where(member), `signed in and opened ${page.url()}: it says "No profile picture has been added." and offers no control to add one, so there is no stored picture to read`);
    }
    return profilePicture().first();
  }
  const fileImagePicker: S.FileImagePickerPage = {
    open: () => go("/users/me"),
    chooseImage: async (input) => {
      await picker.on("choose_image");
      await offerFile(picker.where("choose_image"), /profile picture|avatar|choose image|change picture/i, input);
    },
    imageAddress: async () => {
      await picker.on("image_address");
      return (await profilePicture().count()) ? ((await profilePicture().first().getAttribute("src")) ?? "") : "";
    },
    currentImage: async () => {
      await picker.on("current_image");
      return (await profilePicture().count()) ? ((await profilePicture().first().getAttribute("src")) ?? "") : "";
    },
    chosenImagePreview: async () => {
      await picker.on("chosen_image_preview");
      return (await profilePicture().count()) ? ((await profilePicture().first().getAttribute("src")) ?? "") : "";
    },
    onlyJpegAndPngOffered: async () => {
      await picker.on("only_jpeg_and_png_offered");
      return linesMatching(/\b(jpe?g|png)\b/i);
    },
    rejectedImageError: async () => {
      await picker.on("rejected_image_error");
      return lined(await formMessages())
        .filter((line) => /image|picture|file/i.test(line))
        .join("\n");
    },
    imageReadableWhenSignedOut: async () => {
      const src = (await (await pictureOrUnbound("image_readable_when_signed_out")).getAttribute("src")) ?? "";
      // A request context of its own carries no session.
      const nobody = await playwrightRequest.newContext();
      try {
        const answer = await nobody.get(new URL(src, baseURL).href).catch(() => null);
        return answer && answer.status() < 300 ? `${answer.status()} ${answer.headers()["content-type"] ?? ""}`.trim() : "";
      } finally {
        await nobody.dispose();
      }
    },
    storedImageWidth: async () =>
      String(await (await pictureOrUnbound("stored_image_width")).evaluate((image) => (image as HTMLImageElement).naturalWidth)),
    storedImageHeight: async () =>
      String(await (await pictureOrUnbound("stored_image_height")).evaluate((image) => (image as HTMLImageElement).naturalHeight)),
  };

  // ================================================================ requests no screen makes

  type Answer = { status: number; body: string };

  function parse(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function shapeOf(value: unknown): unknown {
    if (Array.isArray(value)) return value.length ? [shapeOf(value[0])] : [];
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, inner]) => [key, shapeOf(inner)]));
    }
    return value === null ? null : typeof value;
  }

  // ---------------------------------------------------------------- one's own account record

  // GET /api/sessions/current answers { id, user } — { id: null, user: null } when nobody
  // is signed in — and the user carries "notificationsOn", the moment notices were turned on
  // or null.
  let session: Record<string, unknown> | null = null;
  async function readSession(): Promise<Record<string, unknown>> {
    const answer = await page.request.get(`${baseURL}/api/sessions/current`).catch(() => null);
    if (!answer || answer.status() >= 400) {
      unbound("user-account-self-request.open", `GET /api/sessions/current answered ${answer?.status() ?? "nothing"}`);
    }
    session = record(parse(await answer.text()));
    return session;
  }
  const sessionUser = async (): Promise<Record<string, unknown>> => record((session ?? (await readSession())).user);

  const userAccountSelfRequest: S.UserAccountSelfRequestPage = {
    open: async () => {
      await readSession();
    },
    userIdentifier: async () => textOf((await sessionUser()).id),
    newOpportunityNoticesSince: async () => textOf((await sessionUser()).notificationsOn),
  };

  // ---------------------------------------------------------------- a page, by request

  // GET /api/content/:slug answers the page ({ id, slug, title, body, fixed, … }) or 404
  // {"errors":["No page is held at that address."]}. Listing, creating, changing, renaming
  // and removing a page have no handler: GET and POST /api/content and PUT and DELETE
  // /api/content/<id> answer 404 "Cannot <METHOD> …".
  let contentSlug = "";
  let contentAnswer: Answer | null = null;
  const contentLast = (member: string): Answer =>
    contentAnswer ?? unbound(`content-request.${member}`, "no request has been made on this page yet");
  const noContentHandler = (member: string, what: string) => async (): Promise<void> =>
    unbound(`content-request.${member}`, `${what} answers 404 "Cannot …" on this target: the service has no handler for it (probed signed in as a vendor)`);

  const contentRequest: S.ContentRequestPage = {
    open: async (params?: unknown) => {
      contentSlug = seededId(record(params).slug ?? record(params).id ?? "", "content");
      const known = seedGroups.content?.[contentSlug];
      if (known?.slug) contentSlug = String(known.slug);
    },
    readPageListByRequest: noContentHandler("read_page_list_by_request", "GET /api/content"),
    readPageByRequest: async (input?: unknown) => {
      const slug = textOf(given(input, ["slug", "page", "address"]) ?? (typeof input === "string" ? input : "")) || contentSlug;
      if (!slug) unbound("content-request.read_page_by_request", "no page address was given, to open() or to the action");
      const answer = await page.request.get(`${baseURL}/api/content/${encodeURIComponent(slug.replace(/^\/?content\//, ""))}`);
      contentAnswer = { status: answer.status(), body: await answer.text() };
    },
    createPageByRequest: noContentHandler("create_page_by_request", "POST /api/content"),
    changePageByRequest: noContentHandler("change_page_by_request", "PUT /api/content/<id>"),
    renamePageByRequest: noContentHandler("rename_page_by_request", "PUT /api/content/<id>"),
    removePageByRequest: noContentHandler("remove_page_by_request", "DELETE /api/content/<id>"),
    requestAccepted: async () => {
      const got = contentLast("request_accepted");
      return got.status < 300 ? `${got.status} ${got.body}` : "";
    },
    refusalStatus: async () => {
      const got = contentLast("refusal_status");
      return got.status >= 400 ? String(got.status) : "";
    },
    refusalShape: async () => {
      const got = contentLast("refusal_shape");
      return got.status >= 400 ? JSON.stringify(shapeOf(parse(got.body))) : "";
    },
  } as unknown as S.ContentRequestPage;

  // ---------------------------------------------------------------- the mail catcher

  // Mailpit, at the address the harness names; each Playwright worker has its own, named
  // SDLC_MAIL_API_<worker>, with the unnumbered name as the fallback.
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
  const mailboxes = (list: MailAddress[] | null | undefined): string => (list ?? []).map(mailbox).filter(Boolean).join("\n");

  async function mailRequest(where: string, method: string, path: string, data?: unknown): Promise<{ status: number; json: unknown }> {
    const target = mailApi(where) + path;
    const response = await page.request
      .fetch(target, { method, ...(data === undefined ? {} : { data }) })
      .catch((error: unknown) => unbound(where, `the mail catcher at ${target} could not be reached (${String(error)})`));
    return { status: response.status(), json: parse(await response.text().catch(() => "")) };
  }

  const entity = (words: string): string =>
    words
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

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
  const message = (where: string): CaughtMessage => openedMessage ?? unbound(where, "no message has been opened (caught-message.open)");

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
    // them; "accept"/"decline" also match "approve"/"reject".
    async followLinkInBody(input) {
      const where = "caught-message.follow_link_in_body";
      const wanted = (textOf(given(input, ["label", "link", "name", "text"])) || textOf(input)).trim().toLowerCase();
      if (!wanted) unbound(where, "no link label was given");
      const links = linksOf(message(where).HTML ?? "");
      const find = (words: string) =>
        links.find((each) => each.label.toLowerCase() === words) ?? links.find((each) => each.label.toLowerCase().includes(words));
      const SAME: Record<string, string> = { accept: "approve", approve: "accept", decline: "reject", reject: "decline" };
      const other = Object.entries(SAME).find(([word]) => new RegExp(`\\b${word}`).test(wanted))?.[1];
      const link = find(wanted) ?? (other ? find(other) : undefined);
      if (!link) {
        unbound(where, `the message's formatted body has no link labelled "${wanted}" (its links: ${links.map((each) => `"${each.label}"`).join(", ") || "none"})`);
      }
      await page.goto(link.href, { waitUntil: "domcontentloaded" });
      await ready();
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
    logoAddress: async () => entity(/<img\b[^>]*\bsrc\s*=\s*"([^"]*)"/i.exec(message("caught-message.logo_address").HTML ?? "")?.[1] ?? ""),
    linksInBody: async () =>
      linksOf(message("caught-message.links_in_body").HTML ?? "")
        .map((each) => `${each.label} -> ${each.href}`)
        .join("\n"),
  };

  let caughtList: CaughtMessage[] | null = null;
  let caughtTotal = 0;
  const caught = (where: string): CaughtMessage[] => caughtList ?? unbound(where, "the list of caught messages has not been opened (caught-message-list.open)");

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
    messageSubjects: async () => caught("caught-message-list.message_subjects").map((each) => each.Subject ?? "").join("\n"),
    messageVisibleRecipients: async () =>
      caught("caught-message-list.message_visible_recipients")
        .map((each) => (each.To ?? []).map(mailbox).filter(Boolean).join(", "))
        .join("\n"),
    messageCount: async () => {
      caught("caught-message-list.message_count");
      return String(caughtTotal);
    },
  };

  // The catcher's own fault injection: GET /api/v1/chaos answers {"Sender":{"ErrorCode":451,
  // "Probability":0}, …}; while the sender fault is certain its SMTP server refuses every
  // message at the first command.
  async function chaos(where: string, probability?: number): Promise<Record<string, unknown>> {
    const got =
      probability === undefined
        ? await mailRequest(where, "GET", "/api/v1/chaos")
        : await mailRequest(where, "PUT", "/api/v1/chaos", { Sender: { ErrorCode: 451, Probability: probability } });
    if (got.status !== 200) unbound(where, `the mail catcher answered ${got.status} for /api/v1/chaos; its fault injection is not switched on`);
    return record(got.json);
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
    deliveryRefused: async () => {
      const sender = record((await chaos("mail-delivery-fault.delivery_refused")).Sender);
      return Number(sender.Probability ?? 0) >= 100 ? `refused ${textOf(sender.ErrorCode)}`.trim() : "";
    },
  };

  // The pass-through proxy in front of the catcher's SMTP port, controlled beside the
  // catcher under /hold. On the catcher this adapter was bound against, /hold answers 404
  // "404 page not found" (no proxy is running there), so each member reports that.
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
    if (!settled.includes(got.status) || (method === "DELETE" && got.status === 404 && got.json === null)) {
      unbound(where, `the mail delay proxy answered ${got.status} for ${method} ${mailApi(where)}${TOXICS}; no delay proxy is running beside the catcher`);
    }
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
    deliverySlowed: async () => {
      const listed = await hold("mail-delivery-delay.delivery_slowed", "GET");
      const toxic = (Array.isArray(listed) ? (listed as Record<string, unknown>[]) : []).find((each) => each.name === "hold");
      return toxic ? `slowed ${textOf(record(toxic.attributes).latency)}ms` : "";
    },
  };

  // ================================================================ what this target does not have

  // A page none of whose members can be bound. Every member (looked up by name, so none is
  // missed) throws "unbound: <page>.<member> — <why>"; open() does what it is given.
  function stub<T>(pageId: string, why: string, open: (params?: Record<string, string>) => Promise<void>): T {
    return new Proxy({} as Record<string | symbol, unknown>, {
      get(_target, key) {
        if (key === "open") return open;
        if (typeof key !== "string" || key === "then" || key === "toJSON" || !/^[a-z][A-Za-z0-9]*$/.test(key)) return undefined;
        return async (): Promise<never> => unbound(`${pageId}.${snake(key)}`, why);
      },
    }) as unknown as T;
  }

  const WALKED = "opened signed out and signed in as a vendor, public sector staff and the administrator (as the organization owner too, for the organization screens), with the seeded records' identifiers wherever the address takes one";

  // A screen this build does not have: its address answers with the "Page not found"
  // screen whoever asks. open() goes there, and reports what it found — unless the screen is
  // shown after all, when only its members stay unbound.
  function notHere<T>(pageId: string, route: string, params: Record<string, string[]> = {}): T {
    const why = `${route} is not a screen of this target: ${WALKED}, it answers with the "Page not found" screen every time`;
    return stub<T>(pageId, why, async (openParams?: Record<string, string>) => {
      const supplied: Record<string, string> = openParams ?? {};
      const target =
        baseURL +
        route.replace(/:([A-Za-z0-9_]+)/g, (_m, name: string) =>
          encodeURIComponent(seededId(supplied[name] ?? supplied[name.replace(/Id$/, "")] ?? supplied.id ?? name, ...(params[name] ?? [])) || name),
        );
      await page.goto(target, { waitUntil: "domcontentloaded" }).catch(() => undefined);
      await ready();
      const shown = await whyNotHere();
      if (shown) unbound(`${pageId}.open`, `${why}; ${shown}`);
    });
  }

  // An address of the service's own interface with no handler behind it.
  function noHandler<T>(pageId: string, request: string): T {
    const why = `${request} answers 404 "Cannot …" on this target (probed signed out and signed in as a vendor): the service has no handler for it`;
    return stub<T>(pageId, why, async () => unbound(`${pageId}.open`, why));
  }

  const OPP = { opportunityId: ["opportunities"] };
  const PROP = { opportunityId: ["opportunities"], proposalId: ["proposals"] };
  const EVAL = { opportunityId: ["opportunities"], proposalId: ["proposals"], userId: ["users"] };
  const ORG = { orgId: ["organizations"] };

  const surface: S.Surface = {
    signIn,
    signOut,

    home,
    opportunityDashboard,
    opportunityList: notHere("opportunity-list", "/opportunities"),
    opportunityProgramSelect: notHere("opportunity-program-select", "/opportunities/create"),
    opportunityCwuCreate: notHere("opportunity-cwu-create", "/opportunities/code-with-us/create"),
    opportunityCwuView: notHere("opportunity-cwu-view", "/opportunities/code-with-us/:opportunityId", OPP),
    opportunityCwuEdit: notHere("opportunity-cwu-edit", "/opportunities/code-with-us/:opportunityId/edit", OPP),
    opportunityCwuComplete: notHere("opportunity-cwu-complete", "/opportunities/code-with-us/:opportunityId/complete", OPP),
    opportunitySwuCreate: notHere("opportunity-swu-create", "/opportunities/sprint-with-us/create"),
    opportunitySwuView: notHere("opportunity-swu-view", "/opportunities/sprint-with-us/:opportunityId", OPP),
    opportunitySwuEdit: notHere("opportunity-swu-edit", "/opportunities/sprint-with-us/:opportunityId/edit", OPP),
    opportunitySwuComplete: notHere("opportunity-swu-complete", "/opportunities/sprint-with-us/:opportunityId/complete", OPP),
    opportunityTwuCreate: notHere("opportunity-twu-create", "/opportunities/team-with-us/create"),
    opportunityTwuView: notHere("opportunity-twu-view", "/opportunities/team-with-us/:opportunityId", OPP),
    opportunityTwuEdit: notHere("opportunity-twu-edit", "/opportunities/team-with-us/:opportunityId/edit", OPP),
    opportunityTwuComplete: notHere("opportunity-twu-complete", "/opportunities/team-with-us/:opportunityId/complete", OPP),
    scheduledTransitionTrigger,

    proposalCwuCreate: notHere("proposal-cwu-create", "/opportunities/code-with-us/:opportunityId/proposals/create", OPP),
    proposalCwuEdit: notHere("proposal-cwu-edit", "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit", PROP),
    proposalCwuView: notHere("proposal-cwu-view", "/opportunities/code-with-us/:opportunityId/proposals/:proposalId", PROP),
    proposalCwuExportOne: notHere("proposal-cwu-export-one", "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export", PROP),
    proposalCwuExportAll: notHere("proposal-cwu-export-all", "/opportunities/code-with-us/:opportunityId/proposals/export", OPP),
    proposalSwuCreate: notHere("proposal-swu-create", "/opportunities/sprint-with-us/:opportunityId/proposals/create", OPP),
    proposalSwuEdit: notHere("proposal-swu-edit", "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit", PROP),
    proposalSwuView: notHere("proposal-swu-view", "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId", PROP),
    proposalSwuExportOne: notHere("proposal-swu-export-one", "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export", PROP),
    proposalSwuExportAll: notHere("proposal-swu-export-all", "/opportunities/sprint-with-us/:opportunityId/proposals/export", OPP),
    proposalTwuCreate: notHere("proposal-twu-create", "/opportunities/team-with-us/:opportunityId/proposals/create", OPP),
    proposalTwuEdit: notHere("proposal-twu-edit", "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit", PROP),
    proposalTwuView: notHere("proposal-twu-view", "/opportunities/team-with-us/:opportunityId/proposals/:proposalId", PROP),
    proposalTwuExportOne: notHere("proposal-twu-export-one", "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export", PROP),
    proposalTwuExportAll: notHere("proposal-twu-export-all", "/opportunities/team-with-us/:opportunityId/proposals/export", OPP),
    proposalVendorDashboard,
    proposalListStub: notHere("proposal-list-stub", "/proposals"),

    organizationList: notHere("organization-list", "/organizations"),
    organizationCreate: notHere("organization-create", "/organizations/create"),
    organizationEdit: notHere("organization-edit", "/organizations/:orgId/edit", ORG),
    organizationSwuTerms: notHere("organization-swu-terms", "/organizations/:orgId/sprint-with-us-terms-and-conditions", ORG),
    organizationTwuTerms: notHere("organization-twu-terms", "/organizations/:orgId/team-with-us-terms-and-conditions", ORG),
    organizationUserMemberships: profileAgain("organization-user-memberships", "/users/:userId?tab=organizations", userGroups),

    userSignIn,
    userSignUpChooseAccount,
    userSignUpComplete,
    userSignOut,
    userNotice,
    userList: notHere("user-list", "/users"),
    userProfile,
    userProfileCapabilities: profileAgain("user-profile-capabilities", "/users/:userId?tab=capabilities", userGroups),
    userProfileNotifications,
    userProfileLegal,
    userProfileSelf,
    userProfileSelfCapabilities: profileAgain("user-profile-self-capabilities", "/users/me?tab=capabilities"),
    userProfileSelfNotifications,
    userProfileSelfLegal,
    organizationUserMembershipsSelf: profileAgain("organization-user-memberships-self", "/users/me?tab=organizations"),

    evaluationPanelDashboard,
    evaluationPanelSwu: notHere("evaluation-panel-swu", "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel", OPP),
    evaluationPanelTwu: notHere("evaluation-panel-twu", "/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel", OPP),
    evaluationInstructionsSwu: notHere("evaluation-instructions-swu", "/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions", OPP),
    evaluationInstructionsTwu: notHere("evaluation-instructions-twu", "/opportunities/team-with-us/:opportunityId/edit?tab=instructions", OPP),
    evaluationIndividualListSwu: notHere("evaluation-individual-list-swu", "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation", OPP),
    evaluationIndividualListTwu: notHere("evaluation-individual-list-twu", "/opportunities/team-with-us/:opportunityId/edit?tab=evaluation", OPP),
    evaluationConsensusListSwu: notHere("evaluation-consensus-list-swu", "/opportunities/sprint-with-us/:opportunityId/edit?tab=consensus", OPP),
    evaluationConsensusListTwu: notHere("evaluation-consensus-list-twu", "/opportunities/team-with-us/:opportunityId/edit?tab=consensus", OPP),
    evaluationIndividualCreateSwu: notHere("evaluation-individual-create-swu", "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create", PROP),
    evaluationIndividualEditSwu: notHere("evaluation-individual-edit-swu", "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit", EVAL),
    evaluationConsensusCreateSwu: notHere("evaluation-consensus-create-swu", "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create", PROP),
    evaluationConsensusEditSwu: notHere("evaluation-consensus-edit-swu", "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/:userId/edit", EVAL),
    evaluationIndividualCreateTwu: notHere("evaluation-individual-create-twu", "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create", PROP),
    evaluationIndividualEditTwu: notHere("evaluation-individual-edit-twu", "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit", EVAL),
    evaluationConsensusCreateTwu: notHere("evaluation-consensus-create-twu", "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create", PROP),
    evaluationConsensusEditTwu: notHere("evaluation-consensus-edit-twu", "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/:userId/edit", EVAL),

    notificationUnsubscribeLanding,
    notificationOptinOpportunityList: notHere("notification-optin-opportunity-list", "/opportunities"),
    notificationTermsBroadcast: notHere("notification-terms-broadcast", "/content/terms-and-conditions/edit"),
    notificationEmailReference: stub<S.NotificationEmailReferencePage>(
      "notification-email-reference",
      `/admin/email-notification-reference is not a screen of this target: ${WALKED}, the service itself answers 404 {"errors":["Cannot GET /admin/email-notification-reference"]} every time, the administrator included, so a refusal cannot be told apart from the page not existing`,
      async () => {
        await page.goto(baseURL + "/admin/email-notification-reference", { waitUntil: "domcontentloaded" }).catch(() => undefined);
      },
    ),

    contentFooter,
    contentServiceLevelAgreementLink,
    contentList: notHere("content-list", "/content"),
    contentCreate: notHere("content-create", "/content/create"),
    contentEdit: notHere("content-edit", "/content/:slug/edit", { slug: [] }),
    contentView,

    fileUpload: noHandler("file-upload", "POST /api/files (multipart, with a file part)"),
    fileDescription: noHandler("file-description", "GET /api/files/:fileId"),
    fileDownload: noHandler("file-download", "GET /api/files/:fileId?type=blob"),
    fileAttachmentControl: notHere("file-attachment-control", "/opportunities/:program/:opportunityId/edit?tab=opportunity", OPP),
    fileImagePicker,
    fileEmbeddedImage: notHere("file-embedded-image", "/content/:slug/edit", { slug: [] }),

    caughtMessage,
    caughtMessageList,
    mailDeliveryFault,
    mailDeliveryDelay,

    organizationActingForList: noHandler("organization-acting-for-list", "GET /api/ownedOrganizations"),
    affiliationInvitationRequest: noHandler("affiliation-invitation-request", "POST /api/affiliations"),
    affiliationApprovalRequest: noHandler("affiliation-approval-request", "PUT /api/affiliations/:affiliationId (with a valid { tag: \"approve\" } body)"),
    userListRequest: noHandler("user-list-request", "GET /api/users"),
    contentRequest,
    evaluationIndividualRequestSwu: noHandler("evaluation-individual-request-swu", "GET, PUT and POST under /api/proposal/sprint-with-us/:proposalId/team-questions/evaluations"),
    evaluationIndividualRequestTwu: noHandler("evaluation-individual-request-twu", "GET, PUT and POST under /api/proposal/team-with-us/:proposalId/resource-questions/evaluations"),
    evaluationConsensusRequestSwu: noHandler("evaluation-consensus-request-swu", "GET and PUT /api/proposal/sprint-with-us/:proposalId/team-questions/consensus/:userId"),
    evaluationConsensusRequestTwu: noHandler("evaluation-consensus-request-twu", "GET and PUT /api/proposal/team-with-us/:proposalId/resource-questions/consensus/:userId"),
    evaluationPanelRequest: noHandler("evaluation-panel-request", "GET and PUT /api/opportunities/:program/:opportunityId (with a valid { tag: \"edit\" } body)"),
    fileAttachByIdentifier: noHandler("file-attach-by-identifier", "PUT /api/:recordKind/:program/:recordId (with a valid tagged body)"),
    proposalCwuRequest: noHandler("proposal-cwu-request", "POST /api/proposals/code-with-us"),
    proposalTeamRequest: noHandler("proposal-team-request", "POST /api/proposals/sprint-with-us and /api/proposals/team-with-us"),
    proposalEvaluationRequest: noHandler("proposal-evaluation-request", "PUT /api/proposals/:program/:proposalId (with a valid score tag)"),
    userAccountSelfRequest,
    userAccountRequest: noHandler("user-account-request", "GET /api/users/:userId"),
  };

  return surface;
}
