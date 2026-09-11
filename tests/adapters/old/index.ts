// Adapter binding the abstract Surface to the running "old" target.
//
// Everything here was found by opening the application in a browser and looking at it.
// Controls are located by their role, their accessible name, their visible text, or the
// address they lead to — never by a class, an id or a test attribute, because there is
// no source in this workspace and a test must not depend on one.
//
// Three habits of the running application shape most of what follows:
//
//   * Its "buttons" are mostly anchors with no href, so they carry no button or link
//     role. They are found by their exact visible text, and a disabled one is
//     recognised by having been taken out of the tab order (tabindex="-1").
//   * The top navigation is rendered twice, once for wide screens and once for narrow,
//     so every lookup is filtered to what is actually visible.
//   * Validation messages sit outside any paragraph, while help and note text sits
//     inside one. Error observations read the visible lines that look like messages and
//     are not part of the page's prose.
//
// An action or observation the running pages do not offer throws
// "unbound: <page>.<member> — <reason>" instead of pretending to work.

import type { Locator, Page } from "@playwright/test";
import type { Persona, persona as PersonaTable } from "../../generated/personas";
import type * as S from "../../generated/surface";

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
        throw new Error(
          `unbound: open — the route ${route} needs a value for ":${name}" and none was supplied`,
        );
      }
      return String(value);
    });
    return baseURL + filled;
  }

  async function settle(): Promise<void> {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
  }

  async function go(route: string, params?: Record<string, string>): Promise<void> {
    await page.goto(address(route, params), { waitUntil: "domcontentloaded" });
    await settle();
  }

  function at(route: string): { open(params?: Record<string, string>): Promise<void> } {
    return { open: (params) => go(route, params) };
  }

  // ---------------------------------------------------------------- reading text

  const seen = (locator: Locator): Locator => locator.filter({ visible: true });

  function navBar(): Locator {
    return page.getByRole("navigation").first();
  }

  async function wholeText(): Promise<string> {
    const main = page.getByRole("main");
    if (await main.count()) return (await main.first().innerText()).trim();
    return (await page.evaluate(() => document.body.innerText)).trim();
  }

  // The page's own content: the whole screen with the repeated top navigation and the
  // standing footer taken off, so an observation reads what this page is about.
  async function contentText(): Promise<string> {
    let text = await wholeText();
    const nav = page.getByRole("navigation");
    if (await nav.count()) {
      const navText = (await nav.first().innerText()).trim();
      if (navText && text.startsWith(navText)) text = text.slice(navText.length).trim();
    }
    const footer = text.lastIndexOf("\nHome|");
    if (footer > 0) text = text.slice(0, footer).trim();
    return text;
  }

  async function textLines(): Promise<string[]> {
    return (await contentText())
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  const LOOKS_LIKE_A_VALUE = /^(—|-|\$?\d[\d,.]*%?)$/;

  // A figure shown above its label, the way the reporting and summary panels read.
  async function statFor(labels: string[]): Promise<string> {
    const lines = await textLines();
    for (let i = 1; i < lines.length; i++) {
      if (labels.includes(lines[i]) && LOOKS_LIKE_A_VALUE.test(lines[i - 1])) return lines[i - 1];
    }
    return valueBefore(labels);
  }

  async function valueBefore(labels: string[]): Promise<string> {
    const lines = await textLines();
    for (let i = 1; i < lines.length; i++) if (labels.includes(lines[i])) return lines[i - 1];
    return "";
  }

  // A value shown under its label, the way the definition panels read.
  async function valueAfter(labels: string[]): Promise<string> {
    const lines = await textLines();
    for (let i = 0; i < lines.length - 1; i++) if (labels.includes(lines[i])) return lines[i + 1];
    return "";
  }

  async function sectionFrom(labels: string[], until: string[] = []): Promise<string> {
    const lines = await textLines();
    let start = -1;
    for (let i = 0; i < lines.length; i++) {
      if (labels.includes(lines[i])) {
        start = i + 1;
        break;
      }
    }
    if (start < 0) return "";
    const gathered: string[] = [];
    for (let i = start; i < lines.length; i++) {
      if (until.includes(lines[i])) break;
      gathered.push(lines[i]);
    }
    return gathered.join("\n");
  }

  async function linesMatching(pattern: RegExp): Promise<string> {
    return (await textLines()).filter((line) => pattern.test(line)).join("\n");
  }

  // Everything above the numbered step list: the header a form carries about the thing
  // it belongs to.
  async function headerText(): Promise<string> {
    const lines = await textLines();
    const step = lines.findIndex((line) => /^\d+\.\s/.test(line));
    return (step > 0 ? lines.slice(0, step) : lines).join("\n");
  }

  const MESSAGE =
    /(^please\b)|\b(is required|are required|must\s|should\s|cannot\s|can't\s|invalid|not\sa\svalid|already\s(exists|in\suse|taken)|too\s(long|short|large|small|many|few)|no\slonger|unable\sto|failed|exceeds?|do\snot\shave\spermission|permission\sto\sperform)\b/i;

  async function proseLines(): Promise<Set<string>> {
    const prose = new Set<string>();
    for (const block of await page.getByRole("paragraph").allInnerTexts()) {
      for (const line of block.split("\n")) prose.add(line.trim());
    }
    for (const block of await page.getByRole("listitem").allInnerTexts()) prose.add(block.trim());
    return prose;
  }

  // The messages the page is showing back at the reader, with its standing prose left
  // out. Narrow it further with a pattern when the contract names a particular one.
  async function messages(pattern?: RegExp): Promise<string> {
    const prose = await proseLines();
    const found = (await textLines()).filter((line) => !prose.has(line) && MESSAGE.test(line));
    const picked = pattern ? found.filter((line) => pattern.test(line)) : found;
    return picked.join("\n");
  }

  async function tableText(): Promise<string> {
    const tables = seen(page.getByRole("table"));
    const count = await tables.count();
    const parts: string[] = [];
    for (let i = 0; i < count; i++) parts.push((await tables.nth(i).innerText()).trim());
    return parts.filter(Boolean).join("\n");
  }

  // A cell picked out by the column its header names and the row its subject names.
  async function cellUnder(rowName: string, header: string): Promise<Locator | null> {
    const tables = page.getByRole("table");
    const tableCount = await tables.count();
    for (let t = 0; t < tableCount; t++) {
      const table = tables.nth(t);
      const titles = (await table.getByRole("columnheader").allInnerTexts()).map((title) =>
        title.trim().toLowerCase(),
      );
      const column = titles.indexOf(header.trim().toLowerCase());
      if (column < 0) continue;
      const rows = rowName
        ? seen(table.getByRole("row").filter({ hasText: rowName }))
        : seen(table.getByRole("row"));
      const rowCount = await rows.count();
      if (!rowCount) continue;
      const row = rowName ? rows.first() : rows.nth(Math.min(1, rowCount - 1));
      const cells = row.getByRole("cell");
      if (column < (await cells.count())) return cells.nth(column);
    }
    return null;
  }

  // Several columns say yes with an unlabelled tick. Report the mark's presence, or the
  // cell's own words when it has any.
  async function markUnder(rowName: string, header: string): Promise<string> {
    const cell = await cellUnder(rowName, header);
    if (!cell) return "";
    const words = (await cell.innerText()).trim();
    if (words) return words;
    return (await cell.getByRole("img").count()) ? "yes" : "";
  }

  // ---------------------------------------------------------------- driving controls

  async function findControl(scope: Scope, name: string): Promise<Locator | null> {
    const button = seen(scope.getByRole("button", { name, exact: true }));
    if (await button.count()) return button.first();
    const link = seen(scope.getByRole("link", { name, exact: true }));
    if (await link.count()) return link.first();
    const words = seen(scope.getByText(name, { exact: true }));
    const count = await words.count();
    // Ancestors carrying the same text come first in document order, so the last match
    // is the control itself rather than the box around it.
    if (count > 0) return words.nth(count - 1);
    return null;
  }

  async function press(where: string, names: string[], scope: Scope = page): Promise<void> {
    for (const name of names) {
      const control = await findControl(scope, name);
      if (control) {
        await control.click();
        await settle();
        return;
      }
    }
    throw new Error(
      `unbound: ${where} — no control labelled ${quoted(names)} on ${page.url()}`,
    );
  }

  function quoted(names: string[]): string {
    return names.map((name) => `"${name}"`).join(" or ");
  }

  async function controlState(names: string[], scope: Scope = page): Promise<string> {
    for (const name of names) {
      const button = seen(scope.getByRole("button", { name, exact: true }));
      if (await button.count()) return (await button.first().isEnabled()) ? "enabled" : "disabled";
      const link = seen(scope.getByRole("link", { name, exact: true }));
      if (await link.count()) return "enabled";
      const words = seen(scope.getByText(name, { exact: true }));
      const count = await words.count();
      if (count > 0) {
        const control = words.nth(count - 1);
        const ariaDisabled = await control.getAttribute("aria-disabled");
        const tabIndex = await control.getAttribute("tabindex");
        return ariaDisabled === "true" || tabIndex === "-1" ? "disabled" : "enabled";
      }
    }
    return "absent";
  }

  function dialog(): Locator {
    return seen(page.getByRole("dialog"));
  }

  async function dialogText(): Promise<string> {
    return (await dialog().count()) ? (await dialog().first().innerText()).trim() : "";
  }

  async function inDialog(where: string, names: string[]): Promise<void> {
    if (!(await dialog().count())) {
      throw new Error(`unbound: ${where} — no dialog is open on ${page.url()}`);
    }
    await press(where, names, dialog().first());
  }

  // Many actions raise a confirmation first; step through it when one appears.
  async function confirmIfAsked(where: string, names: string[]): Promise<void> {
    if (await dialog().count()) await press(where, names, dialog().first());
  }

  async function openActionsMenu(where: string): Promise<Locator> {
    const alreadyOpen = seen(navBar().getByRole("menu"));
    if (await alreadyOpen.count()) return alreadyOpen.first();
    const toggle = await findControl(navBar(), "Actions");
    if (!toggle) {
      throw new Error(`unbound: ${where} — no "Actions" menu on ${page.url()}`);
    }
    await toggle.click();
    const menu = seen(navBar().getByRole("menu"));
    if (!(await menu.count())) {
      throw new Error(`unbound: ${where} — the "Actions" menu did not open on ${page.url()}`);
    }
    return menu.first();
  }

  async function fromActions(where: string, names: string[]): Promise<void> {
    const menu = await openActionsMenu(where);
    await press(where, names, menu);
  }

  async function actionsMenuText(): Promise<string> {
    const menu = seen(navBar().getByRole("menu"));
    if (await menu.count()) return (await menu.first().innerText()).trim();
    const toggle = await findControl(navBar(), "Actions");
    if (!toggle) return "";
    await toggle.click();
    const opened = seen(navBar().getByRole("menu"));
    return (await opened.count()) ? (await opened.first().innerText()).trim() : "";
  }

  async function openTab(where: string, labels: string[]): Promise<void> {
    for (const label of labels) {
      const control = await findControl(page, label);
      if (control) {
        await control.click();
        await settle();
        return;
      }
    }
    throw new Error(`unbound: ${where} — no tab labelled ${quoted(labels)} on ${page.url()}`);
  }

  // A tab's content, or nothing at all when this reader is not offered the tab — which
  // is how a test sees a tab being withheld.
  async function tabContent(labels: string[]): Promise<string> {
    for (const label of labels) {
      const control = await findControl(page, label);
      if (control) {
        await control.click();
        await settle();
        return contentText();
      }
    }
    return "";
  }

  // The long forms are wizards that show one numbered step at a time.
  async function advanceTo(where: string, marker: string, limit = 12): Promise<void> {
    for (let step = 0; step <= limit; step++) {
      if (await seen(page.getByText(marker, { exact: false })).count()) return;
      const next = await findControl(page, "Next");
      if (!next) break;
      await next.click();
      await settle();
    }
    throw new Error(
      `unbound: ${where} — could not reach a step showing "${marker}" on ${page.url()}`,
    );
  }

  async function fill(where: string, labels: string[], value: string): Promise<void> {
    for (const label of labels) {
      for (const role of ["textbox", "spinbutton"] as const) {
        const box = seen(page.getByRole(role, { name: label, exact: false }));
        if (await box.count()) {
          await box.first().fill(value);
          await box.first().blur().catch(() => undefined);
          await settle();
          return;
        }
      }
    }
    throw new Error(`unbound: ${where} — no field labelled ${quoted(labels)} on ${page.url()}`);
  }

  async function tick(where: string, labels: string[], scope: Scope = page): Promise<void> {
    for (const label of labels) {
      for (const role of ["checkbox", "radio"] as const) {
        const box = seen(scope.getByRole(role, { name: label, exact: false }));
        if (await box.count()) {
          await box.first().click();
          await settle();
          return;
        }
      }
    }
    throw new Error(`unbound: ${where} — no box labelled ${quoted(labels)} on ${page.url()}`);
  }

  async function tickState(labels: string[], scope: Scope = page): Promise<string> {
    for (const label of labels) {
      const box = seen(scope.getByRole("checkbox", { name: label, exact: false }));
      if (await box.count()) return (await box.first().isChecked()) ? "checked" : "unchecked";
    }
    return "";
  }

  // The choosers are search-and-pick lists: open the control, then take an option.
  async function choose(where: string, labels: string[], value: string): Promise<void> {
    let control: Locator | null = null;
    for (const label of labels) {
      const named = seen(page.getByRole("combobox", { name: label, exact: false }));
      if (await named.count()) {
        control = named.first();
        break;
      }
      const shown = seen(page.getByText(label, { exact: true }));
      const count = await shown.count();
      if (count > 0) {
        control = shown.nth(count - 1);
        break;
      }
    }
    if (!control) {
      throw new Error(`unbound: ${where} — no chooser labelled ${quoted(labels)} on ${page.url()}`);
    }
    await control.click();
    const options = value
      ? seen(page.getByRole("option", { name: value, exact: false }))
      : seen(page.getByRole("option"));
    if (!(await options.count())) {
      await page.keyboard.press("Escape").catch(() => undefined);
      throw new Error(
        `unbound: ${where} — the chooser offers no option${value ? ` matching "${value}"` : ""} on ${page.url()}`,
      );
    }
    await options.first().click();
    await settle();
  }

  async function openNamed(where: string, input: unknown): Promise<void> {
    const name = asText(input);
    if (name) {
      const link = seen(page.getByRole("link", { name, exact: false }));
      if (await link.count()) {
        await link.first().click();
        await settle();
        return;
      }
      throw new Error(`unbound: ${where} — nothing named "${name}" to open on ${page.url()}`);
    }
    const tables = seen(page.getByRole("table"));
    if (await tables.count()) {
      const link = seen(tables.first().getByRole("link"));
      if (await link.count()) {
        await link.first().click();
        await settle();
        return;
      }
    }
    const anyLink = seen(page.getByRole("link"));
    if (await anyLink.count()) {
      await anyLink.first().click();
      await settle();
      return;
    }
    throw new Error(`unbound: ${where} — nothing to open on ${page.url()}`);
  }

  // Some controls are told apart only by where they lead.
  async function followTo(where: string, name: string, route: string): Promise<void> {
    const links = seen(page.getByRole("link", { name, exact: true }));
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href.endsWith(route)) {
        await links.nth(i).click();
        await settle();
        return;
      }
    }
    throw new Error(
      `unbound: ${where} — no "${name}" control leading to ${route} on ${page.url()}`,
    );
  }

  // ---------------------------------------------------------------- reading input

  function asText(input: unknown): string {
    if (input === undefined || input === null) return "";
    if (typeof input === "string") return input;
    if (typeof input === "number" || typeof input === "boolean") return String(input);
    if (Array.isArray(input)) return input.map(asText).filter(Boolean).join(", ");
    const record = input as Record<string, unknown>;
    for (const key of ["value", "name", "text", "title", "label", "answer", "score", "id"]) {
      const found = record[key];
      if (typeof found === "string" || typeof found === "number") return String(found);
    }
    return "";
  }

  function asList(input: unknown): string[] {
    if (Array.isArray(input)) return input.map(asText).filter(Boolean);
    const single = asText(input);
    return single ? [single] : [];
  }

  function field(input: unknown, ...keys: string[]): string {
    if (input && typeof input === "object" && !Array.isArray(input)) {
      const record = input as Record<string, unknown>;
      for (const key of keys) {
        const found = record[key];
        if (typeof found === "string" || typeof found === "number") return String(found);
        if (Array.isArray(found)) return found.map(asText).filter(Boolean).join(", ");
      }
    }
    return "";
  }

  function filePaths(input: unknown): string[] {
    const named = field(input, "path", "file", "files", "attachment");
    if (named) return named.split(", ").filter(Boolean);
    return asList(input);
  }

  function indexOf(input: unknown): number {
    const raw = field(input, "index", "position", "row");
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // ---------------------------------------------------------------- attachments

  async function addAttachment(where: string, input: unknown): Promise<void> {
    const files = filePaths(input);
    if (!files.length) {
      throw new Error(`unbound: ${where} — no file was named to attach`);
    }
    await advanceTo(where, "Add Attachment");
    const control = await findControl(page, "Add Attachment");
    if (!control) {
      throw new Error(`unbound: ${where} — no "Add Attachment" control on ${page.url()}`);
    }
    const chooser = page.waitForEvent("filechooser");
    await control.click();
    await (await chooser).setFiles(files);
    await settle();
  }

  function attachmentNameBoxes(): Locator {
    return seen(page.getByRole("textbox"));
  }

  async function renameAttachment(where: string, input: unknown): Promise<void> {
    await advanceTo(where, "Add Attachment");
    const boxes = attachmentNameBoxes();
    const count = await boxes.count();
    if (!count) {
      throw new Error(`unbound: ${where} — no attachment name to change on ${page.url()}`);
    }
    const name = field(input, "to", "name", "value") || asText(input);
    if (!name) {
      throw new Error(`unbound: ${where} — no new name was supplied`);
    }
    const which = Math.min(indexOf(input), count - 1);
    await boxes.nth(which).fill(name);
    await boxes.nth(which).blur().catch(() => undefined);
    await settle();
  }

  // The control offered right beside an attachment's name takes it off the list.
  async function removeAttachment(where: string, input: unknown): Promise<void> {
    await advanceTo(where, "Add Attachment");
    const boxes = attachmentNameBoxes();
    const count = await boxes.count();
    if (count) {
      const which = Math.min(indexOf(input), count - 1);
      const beside = boxes.nth(which).locator("xpath=following-sibling::*[1]");
      if (await beside.count()) {
        await beside.first().click();
        await settle();
        return;
      }
    }
    await press(where, ["Remove", "Remove Attachment"]);
  }

  // ---------------------------------------------------------------- sign in and out

  type SessionRoute = { route?: string; unavailable?: string };

  async function signIn(who: Persona): Promise<void> {
    const table = who.signIn as unknown as null | Record<string, SessionRoute>;
    if (!table) {
      // The anonymous visitor has no account; being signed out is the whole state.
      await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" });
      await settle();
      return;
    }
    const entry = table["session-route"];
    if (!entry || entry.unavailable !== undefined || !entry.route) {
      throw new Error(
        `unbound: signIn.${who.id} — ${entry?.unavailable ?? "this target has no session route for this persona"}`,
      );
    }
    await page.goto(baseURL + entry.route, { waitUntil: "domcontentloaded" });
    await settle();
  }

  async function signOut(): Promise<void> {
    await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" });
    await settle();
  }

  // ================================================================ opportunities

  const home: S.HomePage = {
    ...at("/"),
    browseOpportunities: () => press("home.browse_opportunities", ["Browse Opportunities"]),
    signIn: () => press("home.sign_in", ["Sign In"]),
    signUp: () => press("home.sign_up", ["Sign Up"]),
    totalAwardedOpportunityCount: () => statFor(["Total Opportunities Awarded"]),
    totalAwardedOpportunityValue: () => statFor(["Total Value of All Opportunities"]),
    readableWhenSignedOut: () => contentText(),
  };

  const opportunityDashboard: S.OpportunityDashboardPage = {
    ...at("/dashboard"),
    createOpportunity: () =>
      press("opportunity-dashboard.create_opportunity", ["Create Opportunity"], navBar()),
    openOpportunity: (input) => openNamed("opportunity-dashboard.open_opportunity", input),
    async myOpportunitiesTable() {
      return tabContent(["My Opportunities"]);
    },
    async opportunityStatus() {
      await openTab("opportunity-dashboard.opportunity_status", ["My Opportunities"]);
      return tableText();
    },
    async ownOpportunitiesOnly() {
      return tabContent(["My Opportunities"]);
    },
    async allOpportunitiesForAdministrator() {
      return tabContent(["My Opportunities"]);
    },
    async emptyMyOpportunitiesMessage() {
      const body = await tabContent(["My Opportunities"]);
      return (await tableText()) ? "" : body;
    },
  };

  const opportunityList: S.OpportunityListPage = {
    ...at("/opportunities"),
    filterByProgram: (input) =>
      choose(
        "opportunity-list.filter_by_program",
        ["Filter Opportunities", "All Opportunity Types"],
        asText(input),
      ),
    filterByStatus: (input) =>
      choose("opportunity-list.filter_by_status", ["All Opportunity Statuses"], asText(input)),
    filterRemoteOnly: () => tick("opportunity-list.filter_remote_only", ["Remote OK"]),
    search: (input) =>
      fill("opportunity-list.search", ["Search by Title or Location"], asText(input)),
    toggleWatch: () =>
      press("opportunity-list.toggle_watch", ["Watch", "Watching", "Unwatch"]),
    unpublishedGroup: () =>
      sectionFrom(["Unpublished Opportunities"], ["Open Opportunities", "Closed Opportunities"]),
    openGroup: () => sectionFrom(["Open Opportunities"], ["Closed Opportunities"]),
    closedGroup: () => sectionFrom(["Closed Opportunities"]),
    async opportunityStatus() {
      const lines = await textLines();
      const start = lines.findIndex((line) => /Opportunities$/.test(line));
      return start < 0 ? "" : lines.slice(start).join("\n");
    },
    proposalDeadline: () => linesMatching(/^Close[sd]\b/),
  };

  const opportunityProgramSelect: S.OpportunityProgramSelectPage = {
    ...at("/opportunities/create"),
    chooseCodeWithUs: () =>
      followTo(
        "opportunity-program-select.choose_code_with_us",
        "Get Started",
        "/opportunities/code-with-us/create",
      ),
    chooseSprintWithUs: () =>
      followTo(
        "opportunity-program-select.choose_sprint_with_us",
        "Get Started",
        "/opportunities/sprint-with-us/create",
      ),
    chooseTeamWithUs: () =>
      followTo(
        "opportunity-program-select.choose_team_with_us",
        "Get Started",
        "/opportunities/team-with-us/create",
      ),
    programCard: () => contentText(),
    maxBudget: () => linesMatching(/up to \$/),
  };

  // The three creation forms share a shape: a wizard, with the saving controls in the
  // top navigation.
  function opportunityCreate(where: string, route: string) {
    return {
      ...at(route),
      saveDraft: () => press(`${where}.save_draft`, ["Save Draft"], navBar()),
      submitForReview: async () => {
        await press(`${where}.submit_for_review`, ["Submit for Review"], navBar());
        await confirmIfAsked(`${where}.submit_for_review`, [
          "Submit for Review",
          "Submit Opportunity",
        ]);
      },
      publish: async () => {
        await press(`${where}.publish`, ["Publish"], navBar());
        await confirmIfAsked(`${where}.publish`, ["Publish Opportunity", "Publish"]);
      },
      fieldError: () => messages(),
    };
  }

  const opportunityCwuCreate: S.OpportunityCwuCreatePage = {
    ...opportunityCreate("opportunity-cwu-create", "/opportunities/code-with-us/create"),
    addAttachment: (input) => addAttachment("opportunity-cwu-create.add_attachment", input),
  };

  const opportunitySwuCreate: S.OpportunitySwuCreatePage = {
    ...opportunityCreate("opportunity-swu-create", "/opportunities/sprint-with-us/create"),
    addPhase: async (input) => {
      await advanceTo("opportunity-swu-create.add_phase", "Which phase do you want to start with?");
      await choose(
        "opportunity-swu-create.add_phase",
        ["Which phase do you want to start with?", "Select Phase"],
        asText(input),
      );
    },
    addTeamQuestion: async () => {
      await advanceTo("opportunity-swu-create.add_team_question", "Add Question");
      await press("opportunity-swu-create.add_team_question", ["Add Question"]);
    },
    setEvaluationPanel: (input) =>
      setEvaluationPanel("opportunity-swu-create.set_evaluation_panel", input),
    scoreWeightError: () => messages(/100%|weight/i),
  };

  const opportunityTwuCreate: S.OpportunityTwuCreatePage = {
    ...opportunityCreate("opportunity-twu-create", "/opportunities/team-with-us/create"),
    addResource: async () => {
      await advanceTo("opportunity-twu-create.add_resource", "Add a Resource");
      await press("opportunity-twu-create.add_resource", ["Add a Resource"]);
    },
    addResourceQuestion: async () => {
      await advanceTo("opportunity-twu-create.add_resource_question", "Add Question");
      await press("opportunity-twu-create.add_resource_question", ["Add Question"]);
    },
    setEvaluationPanel: (input) =>
      setEvaluationPanel("opportunity-twu-create.set_evaluation_panel", input),
    scoreWeightError: () => messages(/100%|weight/i),
  };

  // The panel is a list of evaluator slots plus a chair. More slots are added one at a
  // time, and each slot picks a public sector person by name.
  async function setEvaluationPanel(where: string, input: unknown): Promise<void> {
    const members = asList(field(input, "members", "evaluators") || input);
    const chair = field(input, "chair");
    await advanceTo(where, "Panel Member");
    for (let i = 0; i < members.length; i++) {
      const slots = seen(page.getByRole("combobox", { name: "Panel Member", exact: false }));
      while ((await slots.count()) <= i) {
        const more = await findControl(page, "Add an evaluator");
        if (!more) break;
        await more.click();
        await settle();
      }
      const available = await slots.count();
      if (i >= available) {
        throw new Error(`unbound: ${where} — the panel offers no slot ${i + 1} on ${page.url()}`);
      }
      await slots.nth(i).click();
      const option = seen(page.getByRole("option", { name: members[i], exact: false }));
      if (!(await option.count())) {
        await page.keyboard.press("Escape").catch(() => undefined);
        throw new Error(`unbound: ${where} — no panel member matching "${members[i]}"`);
      }
      await option.first().click();
      await settle();
    }
    if (chair) await choose(where, ["Chair"], chair);
  }

  // The three public opportunity pages share their shape; only the money and the middle
  // of the page differ by programme.
  function opportunityView(where: string, route: string, programme: string) {
    return {
      ...at(route),
      toggleWatch: () => press(`${where}.toggle_watch`, ["Watch", "Watching", "Unwatch"]),
      startProposal: () => press(`${where}.start_proposal`, ["Start Proposal"], navBar()),
      // The badge sits directly under the programme's name in the page header.
      status: () => valueAfter([programme]),
      proposalDeadline: () => valueBefore(["Proposal Deadline", "Proposals Deadline"]),
      addenda: () => tabContent(["Addenda"]),
      successfulProponent: async () => {
        const named = await valueAfter(["Successful Proponent", "Awarded To"]);
        return named || linesMatching(/successful proponent/i);
      },
    };
  }

  const opportunityCwuView: S.OpportunityCwuViewPage = {
    ...opportunityView(
      "opportunity-cwu-view",
      "/opportunities/code-with-us/:opportunityId",
      "Code With Us",
    ),
    reward: () => valueBefore(["Value", "Fixed-Price Award", "Reward"]),
  };

  const opportunitySwuView: S.OpportunitySwuViewPage = {
    ...opportunityView(
      "opportunity-swu-view",
      "/opportunities/sprint-with-us/:opportunityId",
      "Sprint With Us",
    ),
    totalMaxBudget: () => valueBefore(["Total Maximum Budget", "Maximum Budget", "Value"]),
    phases: () => sectionFrom(["Phases", "Phase Information"], ["Addenda", "Attachments"]),
  };

  const opportunityTwuView: S.OpportunityTwuViewPage = {
    ...opportunityView(
      "opportunity-twu-view",
      "/opportunities/team-with-us/:opportunityId",
      "Team With Us",
    ),
    maxBudget: () => valueBefore(["Maximum Budget", "Value"]),
    resources: () => sectionFrom(["Resources", "Resource Details"], ["Addenda", "Attachments"]),
  };

  // The management pages share a sidebar of tabs and an Actions menu.
  function opportunityEdit(where: string, route: string) {
    return {
      ...at(route),
      editDetails: () => fromActions(`${where}.edit_details`, ["Edit"]),
      submitForReview: async () => {
        await fromActions(`${where}.submit_for_review`, ["Submit for Review"]);
        await confirmIfAsked(`${where}.submit_for_review`, [
          "Submit for Review",
          "Submit Opportunity",
        ]);
      },
      publish: async () => {
        await fromActions(`${where}.publish`, ["Publish"]);
        await confirmIfAsked(`${where}.publish`, ["Publish Opportunity", "Publish"]);
      },
      cancelOpportunity: async () => {
        await fromActions(`${where}.cancel_opportunity`, ["Cancel"]);
        await confirmIfAsked(`${where}.cancel_opportunity`, ["Cancel Opportunity"]);
      },
      deleteOpportunity: async () => {
        await fromActions(`${where}.delete_opportunity`, ["Delete"]);
        await confirmIfAsked(`${where}.delete_opportunity`, ["Delete Opportunity"]);
      },
      addAddendum: async (input?: unknown) => {
        await openTab(`${where}.add_addendum`, ["Addenda"]);
        await press(`${where}.add_addendum`, ["Add Addendum"], navBar());
        const words = asText(input);
        if (words) {
          await fill(`${where}.add_addendum`, ["Addendum", "Description"], words);
          await press(`${where}.add_addendum`, ["Publish Addendum", "Publish", "Save"], navBar());
        }
      },
      summaryTab: () => tabContent(["Summary"]),
      opportunityTab: () => tabContent(["Opportunity"]),
      addendaTab: () => tabContent(["Addenda"]),
      historyTab: () => tabContent(["History"]),
      proposalsTab: () => tabContent(["Proposals"]),
    };
  }

  const noteIsNotOffered = (where: string) => async (): Promise<void> => {
    throw new Error(
      `unbound: ${where}.add_note — the History tab lists entries but offers no control for adding a note`,
    );
  };

  const opportunityCwuEdit: S.OpportunityCwuEditPage = {
    ...opportunityEdit("opportunity-cwu-edit", "/opportunities/code-with-us/:opportunityId/edit"),
    addNote: noteIsNotOffered("opportunity-cwu-edit"),
    async reportingViews() {
      await openTab("opportunity-cwu-edit.reporting_views", ["Opportunity"]);
      return statFor(["Total Views", "Views"]);
    },
    async reportingWatchers() {
      await openTab("opportunity-cwu-edit.reporting_watchers", ["Opportunity"]);
      return statFor(["Watching", "Watchers"]);
    },
    async reportingProposals() {
      await openTab("opportunity-cwu-edit.reporting_proposals", ["Opportunity"]);
      return statFor(["Proposals"]);
    },
  };

  const opportunitySwuEdit: S.OpportunitySwuEditPage = {
    ...opportunityEdit("opportunity-swu-edit", "/opportunities/sprint-with-us/:opportunityId/edit"),
    addNote: noteIsNotOffered("opportunity-swu-edit"),
    editEvaluationPanel: async () => {
      await openTab("opportunity-swu-edit.edit_evaluation_panel", ["Evaluation Panel"]);
      await press("opportunity-swu-edit.edit_evaluation_panel", ["Edit"], navBar());
    },
    finalizeQuestionConsensuses: async () => {
      await openTab("opportunity-swu-edit.finalize_question_consensuses", ["Consensus"]);
      await press("opportunity-swu-edit.finalize_question_consensuses", [
        "Finalize Consensus Scores",
        "Finalize Scores",
        "Finalize",
      ]);
      await confirmIfAsked("opportunity-swu-edit.finalize_question_consensuses", [
        "Finalize Consensus Scores",
        "Finalize",
        "Submit",
      ]);
    },
    startTeamScenario: async () => {
      await openTab("opportunity-swu-edit.start_team_scenario", ["Team Scenario"]);
      await press("opportunity-swu-edit.start_team_scenario", [
        "Begin Team Scenario",
        "Start Team Scenario",
        "Begin Evaluation",
      ]);
      await confirmIfAsked("opportunity-swu-edit.start_team_scenario", [
        "Begin Team Scenario",
        "Begin Evaluation",
        "Continue",
      ]);
    },
    teamQuestionsTab: () => tabContent(["Team Questions"]),
    codeChallengeTab: () => tabContent(["Code Challenge"]),
    teamScenarioTab: () => tabContent(["Team Scenario"]),
    evaluationPanelTab: () => tabContent(["Evaluation Panel"]),
    consensusTab: () => tabContent(["Consensus"]),
  };

  const opportunityTwuEdit: S.OpportunityTwuEditPage = {
    ...opportunityEdit("opportunity-twu-edit", "/opportunities/team-with-us/:opportunityId/edit"),
    editEvaluationPanel: async () => {
      await openTab("opportunity-twu-edit.edit_evaluation_panel", ["Evaluation Panel"]);
      await press("opportunity-twu-edit.edit_evaluation_panel", ["Edit"], navBar());
    },
    finalizeQuestionConsensuses: async () => {
      await openTab("opportunity-twu-edit.finalize_question_consensuses", ["Consensus"]);
      await press("opportunity-twu-edit.finalize_question_consensuses", [
        "Finalize Consensus Scores",
        "Finalize Scores",
        "Finalize",
      ]);
      await confirmIfAsked("opportunity-twu-edit.finalize_question_consensuses", [
        "Finalize Consensus Scores",
        "Finalize",
        "Submit",
      ]);
    },
    resourceQuestionsTab: () => tabContent(["Resource Questions"]),
    challengeTab: () => tabContent(["Challenge", "Interview/Challenge", "Code Challenge"]),
    evaluationPanelTab: () => tabContent(["Evaluation Panel"]),
    consensusTab: () => tabContent(["Consensus"]),
  };

  const opportunityCwuComplete: S.OpportunityCwuCompletePage = {
    ...at("/opportunities/code-with-us/:opportunityId/complete"),
    fullReport: () => contentText(),
  };
  const opportunitySwuComplete: S.OpportunitySwuCompletePage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/complete"),
    fullReport: () => contentText(),
  };
  const opportunityTwuComplete: S.OpportunityTwuCompletePage = {
    ...at("/opportunities/team-with-us/:opportunityId/complete"),
    fullReport: () => contentText(),
  };

  // ================================================================ proposals

  // Submitting raises a terms dialog that must be agreed to before it will go through.
  async function openTermsDialog(where: string): Promise<void> {
    if (await dialog().count()) return;
    await press(where, ["Submit", "Submit Proposal"], navBar());
    if (!(await dialog().count())) {
      throw new Error(`unbound: ${where} — submitting raised no terms dialog on ${page.url()}`);
    }
  }

  function proposalCreate(where: string, route: string, programme: string) {
    return {
      ...at(route),
      addAttachment: (input: unknown) => addAttachment(`${where}.add_attachment`, input),
      saveDraft: () => press(`${where}.save_draft`, ["Save Draft"], navBar()),
      submitProposal: async () => {
        await openTermsDialog(`${where}.submit_proposal`);
        await inDialog(`${where}.submit_proposal`, ["Submit Proposal", "Submit"]);
      },
      acceptProgramTerms: async () => {
        await openTermsDialog(`${where}.accept_program_terms`);
        await tick(
          `${where}.accept_program_terms`,
          [`agree to the ${programme} Terms & Conditions`],
          dialog().first(),
        );
      },
      acceptAppTerms: async () => {
        await openTermsDialog(`${where}.accept_app_terms`);
        await tick(
          `${where}.accept_app_terms`,
          ["Digital Marketplace Terms & Conditions for E-Bidding"],
          dialog().first(),
        );
      },
      fieldError: () => messages(),
    };
  }

  const proposalCwuCreate: S.ProposalCwuCreatePage = {
    ...proposalCreate(
      "proposal-cwu-create",
      "/opportunities/code-with-us/:opportunityId/proposals/create",
      "Code With Us",
    ),
    chooseProponentIndividual: () =>
      tick("proposal-cwu-create.choose_proponent_individual", ["Individual"]),
    chooseProponentOrganization: () =>
      tick("proposal-cwu-create.choose_proponent_organization", ["Organization"]),
    cancel: () => press("proposal-cwu-create.cancel", ["Cancel"], navBar()),
    opportunitySummary: () => headerText(),
    async termsModal() {
      await openTermsDialog("proposal-cwu-create.terms_modal");
      return dialogText();
    },
    async submitDisabledUntilTermsAccepted() {
      await openTermsDialog("proposal-cwu-create.submit_disabled_until_terms_accepted");
      return controlState(["Submit Proposal"], dialog().first());
    },
  };

  const proposalSwuCreate: S.ProposalSwuCreatePage = {
    ...proposalCreate(
      "proposal-swu-create",
      "/opportunities/sprint-with-us/:opportunityId/proposals/create",
      "Sprint With Us",
    ),
    chooseOrganization: (input) =>
      choose("proposal-swu-create.choose_organization", ["Organization"], asText(input)),
    addPhaseTeamMember: async (input) => {
      await advanceTo("proposal-swu-create.add_phase_team_member", "Team Member");
      await press("proposal-swu-create.add_phase_team_member", [
        "Add Team Member(s)",
        "Add Team Member",
      ]);
      const name = asText(input);
      if (name) {
        await tick("proposal-swu-create.add_phase_team_member", [name], dialog().first());
        await inDialog("proposal-swu-create.add_phase_team_member", [
          "Add Team Member(s)",
          "Add",
        ]);
      }
    },
    setScrumMaster: (input) =>
      tick("proposal-swu-create.set_scrum_master", [
        asText(input) ? `Scrum Master ${asText(input)}` : "Scrum Master",
        "Scrum Master",
      ]),
    setPhaseProposedCost: (input) =>
      fill(
        "proposal-swu-create.set_phase_proposed_cost",
        ["Proposed Cost", "Cost"],
        asText(input),
      ),
    answerTeamQuestion: async (input) => {
      await advanceTo("proposal-swu-create.answer_team_question", "Team Questions");
      await fill(
        "proposal-swu-create.answer_team_question",
        ["Response", "Answer", "Question"],
        asText(input),
      );
    },
    addReference: (input) =>
      fill("proposal-swu-create.add_reference", ["Company Name", "Reference"], asText(input)),
    capabilityGapError: () => messages(/capabilit/i),
    budgetExceededError: () => messages(/budget|exceed/i),
    unqualifiedOrganizationNotice: () => linesMatching(/qualif/i),
    pendingTeamMember: () => linesMatching(/pending/i),
  };

  const proposalTwuCreate: S.ProposalTwuCreatePage = {
    ...proposalCreate(
      "proposal-twu-create",
      "/opportunities/team-with-us/:opportunityId/proposals/create",
      "Team With Us",
    ),
    chooseOrganization: (input) =>
      choose("proposal-twu-create.choose_organization", ["Organization"], asText(input)),
    addTeamMemberForResource: async (input) => {
      await advanceTo("proposal-twu-create.add_team_member_for_resource", "Team Member");
      await choose(
        "proposal-twu-create.add_team_member_for_resource",
        ["Team Member", "Member"],
        asText(input),
      );
    },
    setHourlyRate: (input) =>
      fill("proposal-twu-create.set_hourly_rate", ["Hourly Rate", "Rate"], asText(input)),
    answerResourceQuestion: async (input) => {
      await advanceTo("proposal-twu-create.answer_resource_question", "Resource Questions");
      await fill(
        "proposal-twu-create.answer_resource_question",
        ["Response", "Answer", "Question"],
        asText(input),
      );
    },
    serviceAreaError: () => messages(/service area/i),
    unqualifiedOrganizationNotice: () => linesMatching(/qualif/i),
  };

  // A proposal's own management page: a tab, a header of standing facts, and an Actions
  // menu whose contents change with the proposal's state.
  function proposalEdit(where: string, route: string) {
    return {
      ...at(route),
      startEditing: () => fromActions(`${where}.start_editing`, ["Edit"]),
      saveChanges: () => press(`${where}.save_changes`, ["Save Changes"], navBar()),
      saveChangesAndSubmit: async () => {
        await press(`${where}.save_changes_and_submit`, ["Submit Proposal"], navBar());
        await confirmIfAsked(`${where}.save_changes_and_submit`, ["Submit Proposal", "Submit"]);
      },
      submitProposal: async () => {
        await fromActions(`${where}.submit_proposal`, ["Submit", "Submit Proposal"]);
        await confirmIfAsked(`${where}.submit_proposal`, ["Submit Proposal", "Submit"]);
      },
      withdrawProposal: async () => {
        await fromActions(`${where}.withdraw_proposal`, ["Withdraw"]);
        await confirmIfAsked(`${where}.withdraw_proposal`, ["Withdraw Proposal", "Withdraw"]);
      },
      deleteProposal: async () => {
        await fromActions(`${where}.delete_proposal`, ["Delete"]);
        await confirmIfAsked(`${where}.delete_proposal`, ["Delete Proposal", "Delete"]);
      },
      proposalTab: () => tabContent(["Proposal"]),
      status: () => valueAfter(["Proposal Status", "Status"]),
    };
  }

  const proposalCwuEdit: S.ProposalCwuEditPage = {
    ...proposalEdit(
      "proposal-cwu-edit",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit",
    ),
    addAttachment: (input) => addAttachment("proposal-cwu-edit.add_attachment", input),
    removeAttachment: (input) => removeAttachment("proposal-cwu-edit.remove_attachment", input),
    submittedAt: async () => {
      const shown = await valueAfter(["Submitted On", "Submitted At", "Submitted"]);
      return shown || linesMatching(/submitted/i);
    },
    score: () => valueAfter(["Score", "Total Score"]),
    rank: () => valueAfter(["Rank"]),
    availableActions: () => actionsMenuText(),
  };

  const proposalSwuEdit: S.ProposalSwuEditPage = {
    ...proposalEdit(
      "proposal-swu-edit",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit",
    ),
    scoresheetTab: () => tabContent(["Scoresheet", "Scoring"]),
    anonymousProponentName: () => anonymousProponent(),
    totalScore: () => valueAfter(["Total Score", "Score"]),
    rank: () => valueAfter(["Rank"]),
  };

  const proposalTwuEdit: S.ProposalTwuEditPage = {
    ...proposalEdit(
      "proposal-twu-edit",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit",
    ),
    scoresheetTab: () => tabContent(["Scoresheet", "Scoring"]),
    anonymousProponentName: () => anonymousProponent(),
    totalScore: () => valueAfter(["Total Score", "Score"]),
    rank: () => valueAfter(["Rank"]),
  };

  // Where a proponent is shown without its organization it is given a plain numbered
  // name instead.
  async function anonymousProponent(): Promise<string> {
    const numbered = await linesMatching(/^Proponent\s+\d+$/);
    return numbered || valueAfter(["Proponent"]);
  }

  const proposalCwuView: S.ProposalCwuViewPage = {
    ...at("/opportunities/code-with-us/:opportunityId/proposals/:proposalId"),
    enterScore: (input) =>
      fill("proposal-cwu-view.enter_score", ["Score"], asText(input)),
    awardProposal: async () => {
      await press("proposal-cwu-view.award_proposal", ["Award", "Award Proposal"]);
      await confirmIfAsked("proposal-cwu-view.award_proposal", ["Award Proposal", "Award"]);
    },
    disqualifyProposal: async () => {
      await press("proposal-cwu-view.disqualify_proposal", ["Disqualify", "Disqualify Proposal"]);
      await confirmIfAsked("proposal-cwu-view.disqualify_proposal", [
        "Disqualify Proposal",
        "Disqualify",
      ]);
    },
    proposalTab: () => tabContent(["Proposal"]),
    historyTab: () => tabContent(["History"]),
    proponent: () => valueAfter(["Proponent"]),
    score: () => valueAfter(["Score", "Total Score"]),
    rank: () => valueAfter(["Rank"]),
    exportLink: async () => controlState(["Export Proposal", "Export"]),
  };

  const proposalSwuView: S.ProposalSwuViewPage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId"),
    scoreCodeChallenge: async (input) => {
      await openTab("proposal-swu-view.score_code_challenge", ["Code Challenge"]);
      await fill("proposal-swu-view.score_code_challenge", ["Score"], asText(input));
      await press("proposal-swu-view.score_code_challenge", ["Save Score", "Save"], navBar());
    },
    screenInToTeamScenario: async () => {
      await press("proposal-swu-view.screen_in_to_team_scenario", [
        "Screen In",
        "Screen In to Team Scenario",
      ]);
      await confirmIfAsked("proposal-swu-view.screen_in_to_team_scenario", ["Screen In"]);
    },
    screenOutFromTeamScenario: async () => {
      await press("proposal-swu-view.screen_out_from_team_scenario", [
        "Screen Out",
        "Screen Out from Team Scenario",
      ]);
      await confirmIfAsked("proposal-swu-view.screen_out_from_team_scenario", ["Screen Out"]);
    },
    scoreTeamScenario: async (input) => {
      await openTab("proposal-swu-view.score_team_scenario", ["Team Scenario"]);
      await fill("proposal-swu-view.score_team_scenario", ["Score"], asText(input));
      await press("proposal-swu-view.score_team_scenario", ["Save Score", "Save"], navBar());
    },
    awardProposal: async () => {
      await press("proposal-swu-view.award_proposal", ["Award", "Award Proposal"]);
      await confirmIfAsked("proposal-swu-view.award_proposal", ["Award Proposal", "Award"]);
    },
    disqualifyProposal: async () => {
      await press("proposal-swu-view.disqualify_proposal", ["Disqualify", "Disqualify Proposal"]);
      await confirmIfAsked("proposal-swu-view.disqualify_proposal", [
        "Disqualify Proposal",
        "Disqualify",
      ]);
    },
    proposalTab: () => tabContent(["Proposal"]),
    teamQuestionsTab: () => tabContent(["Team Questions"]),
    codeChallengeTab: () => tabContent(["Code Challenge"]),
    teamScenarioTab: () => tabContent(["Team Scenario"]),
    historyTab: () => tabContent(["History"]),
    wrongStageError: () => messages(/stage|not yet|cannot/i),
    questionsScore: () => statFor(["Team Questions", "Questions Score"]),
    challengeScore: () => statFor(["Code Challenge", "Challenge Score"]),
    scenarioScore: () => statFor(["Team Scenario", "Scenario Score"]),
    priceScore: () => statFor(["Price", "Price Score"]),
    totalScore: () => statFor(["Total Score"]),
  };

  const proposalTwuView: S.ProposalTwuViewPage = {
    ...at("/opportunities/team-with-us/:opportunityId/proposals/:proposalId"),
    scoreResourceQuestions: async (input) => {
      await openTab("proposal-twu-view.score_resource_questions", ["Resource Questions"]);
      await fill("proposal-twu-view.score_resource_questions", ["Score"], asText(input));
      await press("proposal-twu-view.score_resource_questions", ["Save Score", "Save"], navBar());
    },
    screenInToChallenge: async () => {
      await press("proposal-twu-view.screen_in_to_challenge", [
        "Screen In",
        "Screen In to Challenge",
      ]);
      await confirmIfAsked("proposal-twu-view.screen_in_to_challenge", ["Screen In"]);
    },
    screenOutFromChallenge: async () => {
      await press("proposal-twu-view.screen_out_from_challenge", [
        "Screen Out",
        "Screen Out from Challenge",
      ]);
      await confirmIfAsked("proposal-twu-view.screen_out_from_challenge", ["Screen Out"]);
    },
    scoreChallenge: async (input) => {
      await openTab("proposal-twu-view.score_challenge", [
        "Challenge",
        "Interview/Challenge",
      ]);
      await fill("proposal-twu-view.score_challenge", ["Score"], asText(input));
      await press("proposal-twu-view.score_challenge", ["Save Score", "Save"], navBar());
    },
    awardProposal: async () => {
      await press("proposal-twu-view.award_proposal", ["Award", "Award Proposal"]);
      await confirmIfAsked("proposal-twu-view.award_proposal", ["Award Proposal", "Award"]);
    },
    disqualifyProposal: async () => {
      await press("proposal-twu-view.disqualify_proposal", ["Disqualify", "Disqualify Proposal"]);
      await confirmIfAsked("proposal-twu-view.disqualify_proposal", [
        "Disqualify Proposal",
        "Disqualify",
      ]);
    },
    proposalTab: () => tabContent(["Proposal"]),
    resourceQuestionsTab: () => tabContent(["Resource Questions"]),
    challengeTab: () => tabContent(["Challenge", "Interview/Challenge"]),
    historyTab: () => tabContent(["History"]),
    wrongStageError: () => messages(/stage|not yet|cannot/i),
    questionsScore: () => statFor(["Resource Questions", "Questions Score"]),
    challengeScore: () => statFor(["Interview/Challenge", "Challenge", "Challenge Score"]),
    priceScore: () => statFor(["Price", "Price Score"]),
    totalScore: () => statFor(["Total Score"]),
  };

  const proposalCwuExportOne: S.ProposalCwuExportOnePage = {
    ...at("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export"),
    exportedProposal: () => contentText(),
  };
  const proposalCwuExportAll: S.ProposalCwuExportAllPage = {
    ...at("/opportunities/code-with-us/:opportunityId/proposals/export"),
    exportedProposal: () => contentText(),
  };
  const proposalSwuExportOne: S.ProposalSwuExportOnePage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export"),
    exportedProposal: () => contentText(),
    anonymousProponentName: () => anonymousProponent(),
  };
  const proposalSwuExportAll: S.ProposalSwuExportAllPage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/proposals/export"),
    exportedProposal: () => contentText(),
  };
  const proposalTwuExportOne: S.ProposalTwuExportOnePage = {
    ...at("/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export"),
    exportedProposal: () => contentText(),
  };
  const proposalTwuExportAll: S.ProposalTwuExportAllPage = {
    ...at("/opportunities/team-with-us/:opportunityId/proposals/export"),
    exportedProposal: () => contentText(),
  };

  const proposalVendorDashboard: S.ProposalVendorDashboardPage = {
    ...at("/dashboard"),
    showMyProposals: () =>
      openTab("proposal-vendor-dashboard.show_my_proposals", ["My Proposals"]),
    showOrgProposals: () =>
      openTab("proposal-vendor-dashboard.show_org_proposals", ["Org Proposals"]),
    myProposalsTable: () => tabContent(["My Proposals"]),
    orgProposalsTable: () => tabContent(["Org Proposals"]),
    async proposalStatus() {
      await openTab("proposal-vendor-dashboard.proposal_status", ["My Proposals"]);
      return tableText();
    },
    async emptyMyProposalsMessage() {
      const body = await tabContent(["My Proposals"]);
      return (await tableText()) ? "" : body;
    },
    async emptyOrgProposalsMessage() {
      const body = await tabContent(["Org Proposals"]);
      return (await tableText()) ? "" : body;
    },
  };

  const proposalListStub: S.ProposalListStubPage = {
    ...at("/proposals"),
    placeholderText: () => contentText(),
  };

  // ================================================================ organizations

  const organizationList: S.OrganizationListPage = {
    ...at("/organizations"),
    changePage: async () => {
      throw new Error(
        "unbound: organization-list.change_page — the organizations list renders no pager: the whole list is on one page and no page control appears anywhere on it",
      );
    },
    openOrganization: (input) => openNamed("organization-list.open_organization", input),
    createOrganization: () =>
      press("organization-list.create_organization", ["Create Organization"], navBar()),
    myOrganizations: () =>
      press("organization-list.my_organizations", ["My Organizations"], navBar()),
    organizationName: async () => {
      const cell = await cellUnder("", "Organization Name");
      return cell ? (await cell.innerText()).trim() : "";
    },
    ownerName: async () => {
      const cell = await cellUnder("", "Owner");
      return cell ? (await cell.innerText()).trim() : "";
    },
    swuQualifiedMark: () => markUnder("", "SWU Qualified?"),
    twuQualifiedMark: () => markUnder("", "TWU Qualified?"),
    pagination: async () => {
      throw new Error(
        "unbound: organization-list.pagination — the organizations list renders no pager to read",
      );
    },
  };

  const organizationCreate: S.OrganizationCreatePage = {
    ...at("/organizations/create"),
    createOrganization: () =>
      press("organization-create.create_organization", ["Create Organization"], navBar()),
    cancel: () => press("organization-create.cancel", ["Cancel"], navBar()),
    changeLogo: (input) => chooseImage("organization-create.change_logo", input),
    fieldError: () => messages(),
    submitDisabledUntilValid: () => controlState(["Create Organization"], navBar()),
  };

  async function chooseImage(where: string, input: unknown): Promise<void> {
    const files = filePaths(input);
    if (!files.length) throw new Error(`unbound: ${where} — no image file was named`);
    const control = await findControl(page, "Choose Image");
    if (!control) {
      throw new Error(`unbound: ${where} — no "Choose Image" control on ${page.url()}`);
    }
    const chooser = page.waitForEvent("filechooser");
    await control.click();
    await (await chooser).setFiles(files);
    await settle();
  }

  const organizationEdit: S.OrganizationEditPage = {
    ...at("/organizations/:orgId/edit"),
    editOrganization: async () => {
      await openTab("organization-edit.edit_organization", ["Organization"]);
      await press("organization-edit.edit_organization", ["Edit Organization"], navBar());
    },
    saveChanges: () => press("organization-edit.save_changes", ["Save Changes"], navBar()),
    cancelEditing: () => press("organization-edit.cancel_editing", ["Cancel"], navBar()),
    archiveOrganization: async () => {
      await press("organization-edit.archive_organization", ["Archive Organization"]);
      await confirmIfAsked("organization-edit.archive_organization", [
        "Archive Organization",
        "Archive",
      ]);
    },
    addTeamMembers: async (input) => {
      await openTab("organization-edit.add_team_members", ["Team"]);
      await press("organization-edit.add_team_members", ["Add Team Member(s)"], navBar());
      const addresses = asList(field(input, "emails", "email") || input);
      if (addresses.length) {
        await fill("organization-edit.add_team_members", ["Email Addresses"], addresses.join(","));
        await inDialog("organization-edit.add_team_members", ["Add Team Member(s)", "Add"]);
      }
    },
    approvePendingMember: async (input) => {
      await openTab("organization-edit.approve_pending_member", ["Team"]);
      const name = asText(input);
      const scope = name
        ? seen(page.getByRole("row").filter({ hasText: name })).first()
        : page;
      await press("organization-edit.approve_pending_member", ["Approve"], scope);
      await confirmIfAsked("organization-edit.approve_pending_member", ["Approve"]);
    },
    removeTeamMember: async (input) => {
      await openTab("organization-edit.remove_team_member", ["Team"]);
      const name = asText(input);
      const scope = name
        ? seen(page.getByRole("row").filter({ hasText: name })).first()
        : page;
      await press("organization-edit.remove_team_member", ["Remove"], scope);
      await confirmIfAsked("organization-edit.remove_team_member", ["Remove", "Remove Member"]);
    },
    toggleMemberAdminStatus: async (input) => {
      await openTab("organization-edit.toggle_member_admin_status", ["Team"]);
      const name = asText(input);
      const cell = name ? await cellUnder(name, "Admin") : null;
      if (cell) {
        const box = seen(cell.getByRole("checkbox"));
        if (await box.count()) {
          await box.first().click();
          await settle();
          return;
        }
      }
      const boxes = seen(page.getByRole("checkbox"));
      const count = await boxes.count();
      if (!count) {
        throw new Error(
          `unbound: organization-edit.toggle_member_admin_status — no admin box on ${page.url()}`,
        );
      }
      await boxes.nth(Math.min(indexOf(input), count - 1)).click();
      await settle();
    },
    acceptOrgAdminTerms: async () => {
      const box = seen(dialog().getByRole("checkbox"));
      if (await box.count()) await box.first().click();
      await inDialog("organization-edit.accept_org_admin_terms", [
        "Share Admin Access",
        "Confirm",
      ]);
    },
    changeOwner: async (input) => {
      await openTab("organization-edit.change_owner", ["Team"]);
      await press("organization-edit.change_owner", ["Change Owner"], navBar());
      const name = asText(input);
      if (name) {
        await choose("organization-edit.change_owner", ["Owner", "New Owner"], name);
        await inDialog("organization-edit.change_owner", ["Change Owner", "Save"]);
      }
    },
    editServiceAreas: async () => {
      await openTab("organization-edit.edit_service_areas", ["TWU Qualification"]);
      await press("organization-edit.edit_service_areas", ["Edit"], navBar());
    },
    saveServiceAreas: () =>
      press("organization-edit.save_service_areas", ["Save Changes"], navBar()),
    viewSwuTerms: async () => {
      await openTab("organization-edit.view_swu_terms", ["SWU Qualification"]);
      await press("organization-edit.view_swu_terms", ["View Terms & Conditions"]);
    },
    viewTwuTerms: async () => {
      await openTab("organization-edit.view_twu_terms", ["TWU Qualification"]);
      await press("organization-edit.view_twu_terms", ["View Terms & Conditions"]);
    },
    organizationTab: () => tabContent(["Organization"]),
    teamTab: () => tabContent(["Team"]),
    swuQualificationTab: () => tabContent(["SWU Qualification"]),
    twuQualificationTab: () => tabContent(["TWU Qualification"]),
    changelogTab: () => tabContent(["Changelog"]),
    swuQualifiedBadge: () => linesMatching(/^Sprint With Us Qualified$/),
    twuQualifiedBadge: () => linesMatching(/^Team With Us Qualified$/),
    async ownerBadge() {
      await openTab("organization-edit.owner_badge", ["Team"]);
      return linesMatching(/\bOwner\b/);
    },
    async pendingBadge() {
      await openTab("organization-edit.pending_badge", ["Team"]);
      return linesMatching(/\bPending\b/);
    },
    async teamMemberRow() {
      await openTab("organization-edit.team_member_row", ["Team"]);
      return tableText();
    },
    async teamCapabilities() {
      await openTab("organization-edit.team_capabilities", ["Team"]);
      return sectionFrom(["Team Capabilities"]);
    },
    async swuRequirementTwoMembers() {
      await openTab("organization-edit.swu_requirement_two_members", ["SWU Qualification"]);
      return linesMatching(/two team members/i);
    },
    async swuRequirementAllCapabilities() {
      await openTab("organization-edit.swu_requirement_all_capabilities", ["SWU Qualification"]);
      return linesMatching(/all capabilities/i);
    },
    async swuRequirementTermsAccepted() {
      await openTab("organization-edit.swu_requirement_terms_accepted", ["SWU Qualification"]);
      return linesMatching(/agreed to the sprint with us|agreed to sprint with us/i);
    },
    async twuRequirementServiceArea() {
      await openTab("organization-edit.twu_requirement_service_area", ["TWU Qualification"]);
      return linesMatching(/service area/i);
    },
    async twuRequirementTermsAccepted() {
      await openTab("organization-edit.twu_requirement_terms_accepted", ["TWU Qualification"]);
      return linesMatching(/agreed to the team with us|agreed to team with us/i);
    },
    async serviceAreaCheckbox() {
      await openTab("organization-edit.service_area_checkbox", ["TWU Qualification"]);
      return sectionFrom(["Service Areas"], ["Terms & Conditions"]);
    },
    notQualifiedNotice: () => linesMatching(/not qualified/i),
    async changelogEntry() {
      await openTab("organization-edit.changelog_entry", ["Changelog"]);
      return tableText();
    },
    fieldError: () => messages(),
  };

  function organizationTerms(where: string, route: string) {
    return {
      ...at(route),
      acceptTerms: async () => {
        await press(`${where}.accept_terms`, ["Accept Terms & Conditions", "Accept"]);
        await confirmIfAsked(`${where}.accept_terms`, ["Accept Terms & Conditions", "Accept"]);
      },
      cancel: () => press(`${where}.cancel`, ["Cancel"]),
      termsBody: () => contentText(),
      acceptedOnNotice: () => linesMatching(/agreed to the/i),
    };
  }

  const organizationSwuTerms: S.OrganizationSwuTermsPage = organizationTerms(
    "organization-swu-terms",
    "/organizations/:orgId/sprint-with-us-terms-and-conditions",
  );
  const organizationTwuTerms: S.OrganizationTwuTermsPage = organizationTerms(
    "organization-twu-terms",
    "/organizations/:orgId/team-with-us-terms-and-conditions",
  );

  const organizationUserMemberships: S.OrganizationUserMembershipsPage = {
    ...at("/users/:userId?tab=organizations"),
    approveInvitation: async (input) => {
      const name = asText(input);
      const scope = name
        ? seen(page.getByRole("row").filter({ hasText: name })).first()
        : page;
      await press("organization-user-memberships.approve_invitation", ["Approve"], scope);
      await confirmIfAsked("organization-user-memberships.approve_invitation", ["Approve"]);
    },
    rejectInvitation: async (input) => {
      const name = asText(input);
      const scope = name
        ? seen(page.getByRole("row").filter({ hasText: name })).first()
        : page;
      await press("organization-user-memberships.reject_invitation", ["Reject"], scope);
      await confirmIfAsked("organization-user-memberships.reject_invitation", ["Reject"]);
    },
    leaveOrganization: async (input) => {
      const name = asText(input);
      const scope = name
        ? seen(page.getByRole("row").filter({ hasText: name })).first()
        : page;
      await press("organization-user-memberships.leave_organization", ["Leave"], scope);
      await confirmIfAsked("organization-user-memberships.leave_organization", [
        "Leave Organization",
        "Leave",
      ]);
    },
    createOrganization: () =>
      press("organization-user-memberships.create_organization", ["Create Organization"], navBar()),
    openOrganization: (input) =>
      openNamed("organization-user-memberships.open_organization", input),
    ownedOrganizationsTable: () =>
      sectionFrom(["Owned Organizations"], ["Affiliated Organizations"]),
    affiliatedOrganizationsTable: () => sectionFrom(["Affiliated Organizations"]),
    pendingBadge: () => linesMatching(/\bPending\b/),
    teamMemberCount: async () => {
      const cell = await cellUnder("", "Team Members");
      return cell ? (await cell.innerText()).trim() : "";
    },
    swuQualifiedMark: () => markUnder("", "SWU Qualified?"),
    async emptyOwnedMessage() {
      const owned = await sectionFrom(["Owned Organizations"], ["Affiliated Organizations"]);
      return /^you do not own/i.test(owned) ? owned : "";
    },
    async emptyAffiliatedMessage() {
      const affiliated = await sectionFrom(["Affiliated Organizations"]);
      return /^you are not affiliated/i.test(affiliated) ? affiliated : "";
    },
  };

  // ================================================================ users

  const userSignIn: S.UserSignInPage = {
    ...at("/sign-in"),
    signInAsVendor: () => press("user-sign-in.sign_in_as_vendor", ["Sign In Using GitHub"]),
    signInAsPublicSectorEmployee: () =>
      press("user-sign-in.sign_in_as_public_sector_employee", ["Sign In Using IDIR"]),
    goToSignUp: () => press("user-sign-in.go_to_sign_up", ["Sign up", "Sign Up"]),
    vendorCard: () => sectionFrom(["Vendor"], ["Public Sector Employee"]),
    publicSectorCard: () => sectionFrom(["Public Sector Employee"]),
  };

  const userSignUpChooseAccount: S.UserSignUpChooseAccountPage = {
    ...at("/sign-up"),
    signUpAsVendor: () =>
      press("user-sign-up-choose-account.sign_up_as_vendor", ["Sign Up Using GitHub"]),
    signUpAsPublicSectorEmployee: () =>
      press("user-sign-up-choose-account.sign_up_as_public_sector_employee", [
        "Sign Up Using IDIR",
      ]),
    vendorCard: () => sectionFrom(["Vendor"], ["Public Sector Employee"]),
    publicSectorCard: () => sectionFrom(["Public Sector Employee"]),
  };

  // Every account this target's sign-in routes can mint already has a completed
  // profile, so /sign-up/complete never renders its form: it sends a signed-in visitor
  // to the dashboard and a signed-out one to the sign-in page.
  const signUpCompleteUnreachable = (member: string) => async (): Promise<never> => {
    throw new Error(
      `unbound: user-sign-up-complete.${member} — /sign-up/complete never shows the profile form on this target; it redirects to /dashboard when signed in and to /sign-in when signed out, and no sign-in route mints an account with an unfinished profile`,
    );
  };

  const userSignUpComplete: S.UserSignUpCompletePage = {
    ...at("/sign-up/complete"),
    changeAvatar: signUpCompleteUnreachable("change_avatar"),
    acceptAppTerms: signUpCompleteUnreachable("accept_app_terms"),
    toggleNewOpportunityNotifications: signUpCompleteUnreachable(
      "toggle_new_opportunity_notifications",
    ),
    completeProfile: signUpCompleteUnreachable("complete_profile"),
    idpUsernameReadonly: signUpCompleteUnreachable("idp_username_readonly"),
    nameField: signUpCompleteUnreachable("name_field"),
    emailField: signUpCompleteUnreachable("email_field"),
    jobTitleField: signUpCompleteUnreachable("job_title_field"),
    termsCheckbox: signUpCompleteUnreachable("terms_checkbox"),
    completeDisabledUntilTermsAccepted: signUpCompleteUnreachable(
      "complete_disabled_until_terms_accepted",
    ),
    fieldError: signUpCompleteUnreachable("field_error"),
  };

  const userSignOut: S.UserSignOutPage = {
    ...at("/sign-out"),
    signedOutMessage: () => linesMatching(/signed out/i),
    signOutFailedMessage: () => messages(/sign.?out/i),
  };

  const userNotice: S.UserNoticePage = {
    ...at("/notice/:noticeId"),
    backToHome: () => press("user-notice.back_to_home", ["Back to Home", "Go Home"]),
    deactivatedOwnAccountNotice: () => linesMatching(/deactivat/i),
    signInFailedNotice: () => linesMatching(/sign.?in failed|try again/i),
  };

  const userList: S.UserListPage = {
    ...at("/users"),
    searchByName: (input) => fill("user-list.search_by_name", ["Search by name"], asText(input)),
    openExportContactList: () =>
      press("user-list.open_export_contact_list", ["Export Contact List"]),
    toggleExportUserType: (input) =>
      tick(
        "user-list.toggle_export_user_type",
        [asText(input) || "Government Users"],
        dialog().first(),
      ),
    toggleExportField: (input) =>
      tick("user-list.toggle_export_field", [asText(input) || "Email"], dialog().first()),
    exportContactList: () => inDialog("user-list.export_contact_list", ["Export"]),
    cancelExport: () => inDialog("user-list.cancel_export", ["Cancel"]),
    openUserProfile: (input) => openNamed("user-list.open_user_profile", input),
    userRow: () => tableText(),
    statusBadge: () => linesMatching(/^(Active|Inactive)$/),
    accountType: () => linesMatching(/^(Vendor|Public Sector Employee|Admin)$/),
    adminCheck: async () => {
      throw new Error(
        "unbound: user-list.admin_check — the Admin? column shows an unlabelled tick with no accessible name or text, and the list's rows are drawn as one flattened block, so there is nothing on the page to read the mark from",
      );
    },
    exportModal: () => dialogText(),
    exportDisabledUntilSelection: () => controlState(["Export"], dialog().first()),
  };

  const userProfile: S.UserProfilePage = {
    ...at("/users/:userId"),
    editProfile: () => press("user-profile.edit_profile", ["Edit Profile"], navBar()),
    saveChanges: () => press("user-profile.save_changes", ["Save Changes"], navBar()),
    cancelEditing: () => press("user-profile.cancel_editing", ["Cancel"], navBar()),
    changeAvatar: (input) => chooseImage("user-profile.change_avatar", input),
    toggleAdminPermission: () => tick("user-profile.toggle_admin_permission", ["Admin"]),
    deactivateAccount: () =>
      press("user-profile.deactivate_account", ["Deactivate Account"]),
    reactivateAccount: () =>
      press("user-profile.reactivate_account", ["Reactivate Account"]),
    confirmActivationChange: () =>
      inDialog("user-profile.confirm_activation_change", [
        "Deactivate Account",
        "Reactivate Account",
      ]),
    cancelActivationChange: () => inDialog("user-profile.cancel_activation_change", ["Cancel"]),
    profileTab: () => tabContent(["Profile"]),
    capabilitiesTab: () => tabContent(["Capabilities"]),
    notificationsTab: () => tabContent(["Notifications"]),
    legalTab: () => tabContent(["Policies, Terms & Agreements"]),
    organizationsTab: () => tabContent(["Organizations"]),
    statusBadge: () => valueAfter(["Status"]),
    accountType: () => valueAfter(["Account Type"]),
    permissionsLabel: () => valueAfter(["Permission(s)", "Permissions"]),
    adminCheckbox: () => tickState(["Admin"]),
    idpUsernameReadonly: () => fieldValue(["IDIR", "GitHub"]),
    nameField: () => fieldValue(["Name"]),
    emailField: () => fieldValue(["Email Address"]),
    jobTitleField: () => fieldValue(["Job Title"]),
    fieldError: () => messages(),
    activationModal: () => dialogText(),
    notFoundPage: () => contentText(),
  };

  async function fieldValue(labels: string[]): Promise<string> {
    for (const label of labels) {
      const box = seen(page.getByRole("textbox", { name: label, exact: false }));
      if (await box.count()) return (await box.first().inputValue()).trim();
    }
    return valueAfter(labels);
  }

  const userProfileCapabilities: S.UserProfileCapabilitiesPage = {
    ...at("/users/:userId?tab=capabilities"),
    toggleCapability: (input) =>
      press("user-profile-capabilities.toggle_capability", [asText(input)]),
    expandCapabilityDescription: async (input) => {
      const name = asText(input);
      if (!name) {
        throw new Error(
          "unbound: user-profile-capabilities.expand_capability_description — no capability was named",
        );
      }
      const row = seen(page.getByText(name, { exact: true })).first();
      if (!(await row.count())) {
        throw new Error(
          `unbound: user-profile-capabilities.expand_capability_description — no capability named "${name}" on ${page.url()}`,
        );
      }
      const marks = row.getByRole("img");
      const count = await marks.count();
      if (!count) {
        throw new Error(
          `unbound: user-profile-capabilities.expand_capability_description — "${name}" offers no control to open its description`,
        );
      }
      await marks.nth(count - 1).click();
      await settle();
    },
    capabilityRow: () => sectionFrom(["Capabilities"]),
    capabilityChecked: async () => {
      throw new Error(
        "unbound: user-profile-capabilities.capability_checked — whether a capability is held is shown only by the colour and shape of an unlabelled icon; the row carries no text, no checkbox and no state in the accessibility tree",
      );
    },
    async capabilityDescription() {
      return sectionFrom(["Capabilities"]);
    },
  };

  const userProfileNotifications: S.UserProfileNotificationsPage = {
    ...at("/users/:userId?tab=notifications"),
    toggleNewOpportunityNotifications: () =>
      tick("user-profile-notifications.toggle_new_opportunity_notifications", [
        "New opportunities",
      ]),
    confirmUnsubscribe: async () => {
      throw new Error(
        "unbound: user-profile-notifications.confirm_unsubscribe — turning the notice off on this tab takes effect at once and raises no confirmation; the confirmation belongs to the unsubscribe landing page",
      );
    },
    cancelUnsubscribe: async () => {
      throw new Error(
        "unbound: user-profile-notifications.cancel_unsubscribe — this tab raises no unsubscribe confirmation to cancel",
      );
    },
    newOpportunitiesCheckbox: () => tickState(["New opportunities"]),
    notificationEmailAddress: () => linesMatching(/@/),
    unsubscribeModal: async () => {
      throw new Error(
        "unbound: user-profile-notifications.unsubscribe_modal — no confirmation appears on this tab",
      );
    },
  };

  const userProfileLegal: S.UserProfileLegalPage = {
    ...at("/users/:userId?tab=legal"),
    openAppTerms: () =>
      press("user-profile-legal.open_app_terms", [
        "Digital Marketplace Terms & Conditions for E-Bidding",
      ]),
    acceptUpdatedTerms: () =>
      press("user-profile-legal.accept_updated_terms", ["agree to the updated terms"]),
    confirmAcceptUpdatedTerms: async () => {
      const box = seen(dialog().getByRole("checkbox"));
      if (await box.count()) await box.first().click();
      await inDialog("user-profile-legal.confirm_accept_updated_terms", [
        "Agree & Continue",
        "Agree",
      ]);
    },
    privacyPolicy: () => sectionFrom(["Privacy Policy"], ["Terms & Conditions"]),
    appTermsLink: () =>
      linesMatching(/^Digital Marketplace Terms & Conditions for E-Bidding$/),
    acceptedOnNotice: () => linesMatching(/you agreed to/i),
    termsUpdatedWarning: () => linesMatching(/have been updated/i),
    programTermsLinks: () => linesMatching(/(Code|Sprint|Team) With Us Terms & Conditions/),
    acceptUpdatedTermsModal: () => dialogText(),
  };

  // ================================================================ evaluation

  const evaluationPanelDashboard: S.EvaluationPanelDashboardPage = {
    ...at("/dashboard"),
    showMyOpportunities: () =>
      openTab("evaluation-panel-dashboard.show_my_opportunities", ["My Opportunities"]),
    showPanelOpportunities: () =>
      openTab("evaluation-panel-dashboard.show_panel_opportunities", ["Evaluations"]),
    openOpportunity: (input) => openNamed("evaluation-panel-dashboard.open_opportunity", input),
    evaluationsTab: () => tabContent(["Evaluations"]),
    panelOpportunitiesTable: () => tabContent(["Evaluations"]),
    async opportunityStatus() {
      await openTab("evaluation-panel-dashboard.opportunity_status", ["Evaluations"]);
      return tableText();
    },
    async emptyPanelOpportunitiesMessage() {
      const body = await tabContent(["Evaluations"]);
      return (await tableText()) ? "" : body;
    },
  };

  function evaluationPanel(where: string, route: string) {
    return {
      ...at(route),
      addPanelMember: (input: unknown) => setEvaluationPanel(`${where}.add_panel_member`, input),
      removePanelMember: () =>
        press(`${where}.remove_panel_member`, ["Remove this evaluator", "Remove"]),
      choosePanelChair: (input: unknown) =>
        choose(`${where}.choose_panel_chair`, ["Chair"], asText(input)),
      markMemberAsChair: () => tick(`${where}.mark_member_as_chair`, ["Panel Chair"]),
      saveEvaluationPanel: () =>
        press(`${where}.save_evaluation_panel`, ["Save Changes", "Save"], navBar()),
      panelMemberRow: () => sectionFrom(["Evaluation Panel"], ["Panel Chair"]),
      chairField: () => valueAfter(["Chair", "Chair*"]),
      minimumMembersError: () => messages(/two|minimum|at least/i),
      duplicateMemberError: () => messages(/duplicate|already/i),
      nonPublicSectorMemberError: () => messages(/public sector|identifier/i),
      missingChairError: () => messages(/chair/i),
      panelLockedAfterConsensus: () => messages(/consensus|locked|cannot/i),
    };
  }

  const evaluationPanelSwu: S.EvaluationPanelSwuPage = evaluationPanel(
    "evaluation-panel-swu",
    "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel",
  );
  const evaluationPanelTwu: S.EvaluationPanelTwuPage = evaluationPanel(
    "evaluation-panel-twu",
    "/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel",
  );

  function evaluationInstructions(route: string) {
    return {
      ...at(route),
      instructionsBody: () => contentText(),
      visibleToEvaluatorsOnly: () => contentText(),
    };
  }

  const evaluationInstructionsSwu: S.EvaluationInstructionsSwuPage = evaluationInstructions(
    "/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions",
  );
  const evaluationInstructionsTwu: S.EvaluationInstructionsTwuPage = evaluationInstructions(
    "/opportunities/team-with-us/:opportunityId/edit?tab=instructions",
  );

  function evaluationIndividualList(where: string, route: string) {
    return {
      ...at(route),
      openProponentEvaluation: (input: unknown) =>
        openNamed(`${where}.open_proponent_evaluation`, input),
      submitScoresForConsensus: async () => {
        await press(`${where}.submit_scores_for_consensus`, [
          "Submit for Consensus",
          "Submit Scores",
          "Submit",
        ]);
        await confirmIfAsked(`${where}.submit_scores_for_consensus`, [
          "Submit for Consensus",
          "Submit",
        ]);
      },
      proponentRow: () => tableText(),
      anonymousProponentName: () => anonymousProponent(),
      evaluationStatus: () => tableText(),
      submitDisabledUntilComplete: () =>
        controlState(["Submit for Consensus", "Submit Scores", "Submit"]),
      incompleteEvaluationError: () => messages(/complete|incomplete/i),
      ownEvaluationsOnly: () => tableText(),
    };
  }

  const evaluationIndividualListSwu: S.EvaluationIndividualListSwuPage =
    evaluationIndividualList(
      "evaluation-individual-list-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation",
    );
  const evaluationIndividualListTwu: S.EvaluationIndividualListTwuPage =
    evaluationIndividualList(
      "evaluation-individual-list-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=evaluation",
    );

  function evaluationConsensusList(where: string, route: string) {
    return {
      ...at(route),
      openProponentConsensus: (input: unknown) =>
        openNamed(`${where}.open_proponent_consensus`, input),
      submitFinalConsensusScores: () =>
        press(`${where}.submit_final_consensus_scores`, [
          "Submit Consensus Scores",
          "Submit Scores",
          "Submit",
        ]),
      confirmSubmitConsensus: () =>
        inDialog(`${where}.confirm_submit_consensus`, [
          "Submit Consensus Scores",
          "Submit",
        ]),
      finalizeConsensusScores: () =>
        press(`${where}.finalize_consensus_scores`, [
          "Finalize Consensus Scores",
          "Finalize Scores",
          "Finalize",
        ]),
      confirmFinalizeConsensus: () =>
        inDialog(`${where}.confirm_finalize_consensus`, [
          "Finalize Consensus Scores",
          "Finalize",
        ]),
      cancelModal: () => inDialog(`${where}.cancel_modal`, ["Cancel"]),
      proponentRow: () => tableText(),
      consensusStatus: () => tableText(),
      submitConfirmationModal: () => dialogText(),
      finalizeConfirmationModal: () => dialogText(),
      notAllConsensusesSubmittedError: () => messages(/consensus|all/i),
      noScreenableProponentError: () => messages(/screen|proponent/i),
      emptyForOwnerNotOnPanel: () => contentText(),
    };
  }

  const evaluationConsensusListSwu: S.EvaluationConsensusListSwuPage = evaluationConsensusList(
    "evaluation-consensus-list-swu",
    "/opportunities/sprint-with-us/:opportunityId/edit?tab=consensus",
  );
  const evaluationConsensusListTwu: S.EvaluationConsensusListTwuPage = evaluationConsensusList(
    "evaluation-consensus-list-twu",
    "/opportunities/team-with-us/:opportunityId/edit?tab=consensus",
  );

  function scoreSheet(where: string, route: string) {
    return {
      ...at(route),
      enterQuestionScore: (input: unknown) =>
        fill(`${where}.enter_question_score`, ["Score"], asText(input)),
      enterQuestionNotes: (input: unknown) =>
        fill(`${where}.enter_question_notes`, ["Notes", "Comments"], asText(input)),
      saveAndGoToNextProponent: () =>
        press(`${where}.save_and_go_to_next_proponent`, [
          "Save & Go to Next Proponent",
          "Save and Go to Next Proponent",
          "Next Proponent",
        ]),
      scoreOutOfRangeError: () => messages(/score|range|between/i),
      emptyNotesError: () => messages(/note|comment/i),
    };
  }

  const evaluationIndividualCreateSwu: S.EvaluationIndividualCreateSwuPage = {
    ...scoreSheet(
      "evaluation-individual-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create",
    ),
    saveDraft: () =>
      press("evaluation-individual-create-swu.save_draft", ["Save Draft", "Save"], navBar()),
    saveAndGoToPreviousProponent: () =>
      press("evaluation-individual-create-swu.save_and_go_to_previous_proponent", [
        "Save & Go to Previous Proponent",
        "Save and Go to Previous Proponent",
        "Previous Proponent",
      ]),
    anonymousProponentName: () => anonymousProponent(),
    questionResponse: () => contentText(),
    duplicateEvaluationError: () => messages(/already|duplicate/i),
  };

  const evaluationIndividualEditSwu: S.EvaluationIndividualEditSwuPage = {
    ...scoreSheet(
      "evaluation-individual-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit",
    ),
    saveChanges: () =>
      press("evaluation-individual-edit-swu.save_changes", ["Save Changes", "Save"], navBar()),
    evaluationStatus: () => valueAfter(["Status", "Evaluation Status"]),
    readOnlyAfterSubmitted: () => controlState(["Save Changes", "Save"], navBar()),
  };

  const evaluationConsensusCreateSwu: S.EvaluationConsensusCreateSwuPage = {
    ...scoreSheet(
      "evaluation-consensus-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create",
    ),
    saveDraft: () =>
      press("evaluation-consensus-create-swu.save_draft", ["Save Draft", "Save"], navBar()),
    anonymousProponentName: () => anonymousProponent(),
    panelMemberScore: () => contentText(),
    panelMemberNotes: () => contentText(),
    chairOnly: () => contentText(),
    duplicateConsensusError: () => messages(/already|duplicate/i),
  };

  const evaluationConsensusEditSwu: S.EvaluationConsensusEditSwuPage = {
    ...scoreSheet(
      "evaluation-consensus-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/:userId/edit",
    ),
    saveChanges: () =>
      press("evaluation-consensus-edit-swu.save_changes", ["Save Changes", "Save"], navBar()),
    consensusStatus: () => valueAfter(["Status", "Consensus Status"]),
    editableAfterSubmitted: () => controlState(["Save Changes", "Save"], navBar()),
    panelMemberScore: () => contentText(),
    panelMemberNotes: () => contentText(),
  };

  const evaluationIndividualCreateTwu: S.EvaluationIndividualCreateTwuPage = {
    ...scoreSheet(
      "evaluation-individual-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create",
    ),
    saveDraft: () =>
      press("evaluation-individual-create-twu.save_draft", ["Save Draft", "Save"], navBar()),
    saveAndGoToPreviousProponent: () =>
      press("evaluation-individual-create-twu.save_and_go_to_previous_proponent", [
        "Save & Go to Previous Proponent",
        "Save and Go to Previous Proponent",
        "Previous Proponent",
      ]),
    anonymousProponentName: () => anonymousProponent(),
    questionResponse: () => contentText(),
    duplicateEvaluationError: () => messages(/already|duplicate/i),
  };

  const evaluationIndividualEditTwu: S.EvaluationIndividualEditTwuPage = {
    ...scoreSheet(
      "evaluation-individual-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit",
    ),
    saveChanges: () =>
      press("evaluation-individual-edit-twu.save_changes", ["Save Changes", "Save"], navBar()),
    evaluationStatus: () => valueAfter(["Status", "Evaluation Status"]),
    readOnlyAfterSubmitted: () => controlState(["Save Changes", "Save"], navBar()),
  };

  const evaluationConsensusCreateTwu: S.EvaluationConsensusCreateTwuPage = {
    ...scoreSheet(
      "evaluation-consensus-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create",
    ),
    saveDraft: () =>
      press("evaluation-consensus-create-twu.save_draft", ["Save Draft", "Save"], navBar()),
    anonymousProponentName: () => anonymousProponent(),
    panelMemberScore: () => contentText(),
    panelMemberNotes: () => contentText(),
    chairOnly: () => contentText(),
    duplicateConsensusError: () => messages(/already|duplicate/i),
  };

  const evaluationConsensusEditTwu: S.EvaluationConsensusEditTwuPage = {
    ...scoreSheet(
      "evaluation-consensus-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/:userId/edit",
    ),
    saveChanges: () =>
      press("evaluation-consensus-edit-twu.save_changes", ["Save Changes", "Save"], navBar()),
    consensusStatus: () => valueAfter(["Status", "Consensus Status"]),
    editableAfterSubmitted: () => controlState(["Save Changes", "Save"], navBar()),
    panelMemberScore: () => contentText(),
    panelMemberNotes: () => contentText(),
  };

  // ================================================================ notifications

  const notificationUnsubscribeLanding: S.NotificationUnsubscribeLandingPage = {
    ...at("/users/me?tab=notifications&unsubscribe"),
    confirmUnsubscribe: () =>
      inDialog("notification-unsubscribe-landing.confirm_unsubscribe", ["Unsubscribe"]),
    cancelUnsubscribe: () =>
      inDialog("notification-unsubscribe-landing.cancel_unsubscribe", ["Cancel"]),
    unsubscribeConfirmation: () => dialogText(),
    confirmationNamesSignedInAddress: () => dialogText(),
    // "me" in the address is resolved by the application to the signed-in person, whose
    // name the page then carries.
    resolvesToSignedInPerson: () => page.title(),
    signInRequired: async () => (page.url().includes("/sign-in") ? page.url() : ""),
  };

  const notificationOptinOpportunityList: S.NotificationOptinOpportunityListPage = {
    ...at("/opportunities"),
    toggleNewOpportunityNotifications: () =>
      press("notification-optin-opportunity-list.toggle_new_opportunity_notifications", [
        "Stop notifying me about new opportunities",
        "Notify me about new opportunities",
      ]),
    notificationControl: () => linesMatching(/notif(y|ying) me about new opportunities/i),
    // The control says what it will do next, which is how its present state reads.
    notificationControlState: () => linesMatching(/notif(y|ying) me about new opportunities/i),
    async notificationControlHiddenOnNarrowScreen() {
      const was = page.viewportSize();
      await page.setViewportSize({ width: 390, height: 800 });
      await settle();
      const state = await controlState([
        "Stop notifying me about new opportunities",
        "Notify me about new opportunities",
      ]);
      if (was) await page.setViewportSize(was);
      await settle();
      return state === "absent" ? "hidden" : "visible";
    },
  };

  const notificationTermsBroadcast: S.NotificationTermsBroadcastPage = {
    ...at("/content/terms-and-conditions/edit"),
    notifyVendorsOfUpdatedTerms: () =>
      press(
        "notification-terms-broadcast.notify_vendors_of_updated_terms",
        ["Notify Vendors"],
        navBar(),
      ),
    confirmNotifyVendors: () =>
      inDialog("notification-terms-broadcast.confirm_notify_vendors", ["Notify Vendors"]),
    cancelNotifyVendors: () =>
      inDialog("notification-terms-broadcast.cancel_notify_vendors", ["Cancel"]),
    notifyVendorsControl: () => controlState(["Notify Vendors"], navBar()),
    notifyVendorsConfirmation: () => dialogText(),
    notifyVendorsSuccess: () => linesMatching(/notified|success/i),
    notifyVendorsFailure: () => messages(/unable|failed/i),
  };

  const notificationEmailReference: S.NotificationEmailReferencePage = {
    ...at("/admin/email-notification-reference"),
    openReference: () => go("/admin/email-notification-reference"),
    messageGroupTitle: async () =>
      (await page.getByRole("heading", { level: 2 }).allInnerTexts())
        .map((title) => title.trim())
        .join("\n"),
    messageSubject: () => linesMatching(/^Subject:/),
    messageSummary: () => linesMatching(/^Summary:/),
    messageBody: () => contentText(),
    refusedForNonAdministrator: () => contentText(),
  };

  // ================================================================ content

  const contentFooter: S.ContentFooterPage = {
    ...at("/"),
    openAbout: () => followTo("content-footer.open_about", "About", "/content/about"),
    openDisclaimer: () =>
      followTo("content-footer.open_disclaimer", "Disclaimer", "/content/disclaimer"),
    openPrivacy: () => followTo("content-footer.open_privacy", "Privacy", "/content/privacy"),
    openAccessibility: () =>
      followTo("content-footer.open_accessibility", "Accessibility", "/content/accessibility"),
    openCopyright: () =>
      followTo("content-footer.open_copyright", "Copyright", "/content/copyright"),
    aboutLink: () => footerLink("About"),
    disclaimerLink: () => footerLink("Disclaimer"),
    privacyLink: () => footerLink("Privacy"),
    accessibilityLink: () => footerLink("Accessibility"),
    copyrightLink: () => footerLink("Copyright"),
    presentWhenSignedOut: () => footerText(),
  };

  async function footerLink(name: string): Promise<string> {
    const links = seen(page.getByRole("link", { name, exact: true }));
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href.startsWith("/content/")) return href;
    }
    return "";
  }

  async function footerText(): Promise<string> {
    const whole = await wholeText();
    const start = whole.lastIndexOf("\nHome|");
    return start > 0 ? whole.slice(start).trim() : "";
  }

  const contentList: S.ContentListPage = {
    ...at("/content"),
    openPageForEditing: (input) => openNamed("content-list.open_page_for_editing", input),
    openPublicPage: async (input) => {
      const slug = asText(input);
      const links = seen(page.getByRole("link"));
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute("href");
        if (!href || !href.startsWith("/content/") || href.endsWith("/edit")) continue;
        if (slug && !href.endsWith(`/${slug}`)) continue;
        // The address link opens a window of its own, so follow where it leads.
        await go(href);
        return;
      }
      throw new Error(
        `unbound: content-list.open_public_page — no public address${slug ? ` for "${slug}"` : ""} on ${page.url()}`,
      );
    },
    createPage: () => press("content-list.create_page", ["Create Page"], navBar()),
    pageTitle: () => tableText(),
    pagePublicAddress: () => linesMatching(/^\/CONTENT\//i),
    pageIsFixed: () => markUnder("", "Fixed?"),
    pageCreatedDate: async () => {
      const cell = await cellUnder("", "Created");
      return cell ? (await cell.innerText()).trim() : "";
    },
    pageUpdatedDate: async () => {
      const cell = await cellUnder("", "Updated");
      return cell ? (await cell.innerText()).trim() : "";
    },
    orderedByTitle: () => tableText(),
    refusedForNonAdministrator: () => contentText(),
  };

  const contentCreate: S.ContentCreatePage = {
    ...at("/content/create"),
    enterTitle: (input) => fill("content-create.enter_title", ["Title"], asText(input)),
    enterSlug: (input) => fill("content-create.enter_slug", ["Slug"], asText(input)),
    enterBody: (input) => fill("content-create.enter_body", ["Body"], asText(input)),
    uploadBodyImage: (input) => uploadBodyImage("content-create.upload_body_image", input),
    publishPage: () => press("content-create.publish_page", ["Publish"], navBar()),
    confirmPublish: () => inDialog("content-create.confirm_publish", ["Publish", "Yes"]),
    cancel: () => press("content-create.cancel", ["Cancel"], navBar()),
    fieldError: () => messages(),
    async slugRuleHelp() {
      const label = seen(page.getByText("Slug*", { exact: true }));
      if (await label.count()) {
        const marks = label.last().getByRole("img");
        if (await marks.count()) {
          await marks.first().click();
          await settle();
        }
      }
      return linesMatching(/slug/i);
    },
    resultingPublicAddress: () => linesMatching(/will be available at/i),
    publishDisabledUntilValid: () => controlState(["Publish"], navBar()),
    publishConfirmation: () => dialogText(),
    publishedSuccess: () => linesMatching(/published/i),
    duplicateSlugError: () => messages(/slug/i),
    refusedForNonAdministrator: () => contentText(),
  };

  async function uploadBodyImage(where: string, input: unknown): Promise<void> {
    const files = filePaths(input);
    if (!files.length) throw new Error(`unbound: ${where} — no image file was named`);
    const control = await findControl(page, "Choose File");
    if (!control) {
      throw new Error(
        `unbound: ${where} — the formatted-text editor offers no image control on ${page.url()}`,
      );
    }
    const chooser = page.waitForEvent("filechooser");
    await control.click();
    await (await chooser).setFiles(files);
    await settle();
  }

  const contentEdit: S.ContentEditPage = {
    ...at("/content/:slug/edit"),
    startEditing: () => press("content-edit.start_editing", ["Edit"], navBar()),
    editTitle: (input) => fill("content-edit.edit_title", ["Title"], asText(input)),
    editSlug: (input) => fill("content-edit.edit_slug", ["Slug"], asText(input)),
    editBody: (input) => fill("content-edit.edit_body", ["Body"], asText(input)),
    uploadBodyImage: (input) => uploadBodyImage("content-edit.upload_body_image", input),
    publishChanges: () => press("content-edit.publish_changes", ["Publish Changes"], navBar()),
    confirmPublishChanges: () =>
      inDialog("content-edit.confirm_publish_changes", ["Publish Changes", "Publish", "Yes"]),
    cancelEditing: () => press("content-edit.cancel_editing", ["Cancel"], navBar()),
    deletePage: () => press("content-edit.delete_page", ["Delete"], navBar()),
    confirmDeletePage: () =>
      inDialog("content-edit.confirm_delete_page", ["Delete Page", "Delete", "Yes"]),
    publishedDate: () => linesMatching(/^Published /),
    updatedDate: () => linesMatching(/^Updated /),
    publishedBy: () => valueAfter(["Published By"]),
    updatedBy: () => valueAfter(["Updated By"]),
    fixedPageWarning: () => linesMatching(/"fixed" page|fixed. page/i),
    slugLockedForFixedPage: () => linesMatching(/slug cannot be changed/i),
    deleteWithheldForFixedPage: () => controlState(["Delete"], navBar()),
    fieldError: () => messages(),
    duplicateSlugError: () => messages(/slug/i),
    changesPublishedSuccess: () => linesMatching(/published/i),
    deletedSuccess: () => linesMatching(/deleted/i),
    refusedForNonAdministrator: () => contentText(),
  };

  const contentView: S.ContentViewPage = {
    ...at("/content/:slug"),
    followBodyLink: (input) => openNamed("content-view.follow_body_link", input),
    pageTitle: () => page.title(),
    pageBody: () => contentText(),
    publishedDate: () => linesMatching(/^Published /),
    updatedDate: () => linesMatching(/^Updated /),
    readableWhenSignedOut: () => contentText(),
    notFoundForUnknownAddress: () => contentText(),
  };

  // ================================================================ files

  // A stored file is not a screen: it is an address that answers with the bytes and the
  // headers that say how to keep them. The request is made in the browser's own session
  // so that what it is allowed to see is what the signed-in person is allowed to see.
  let lastFile: {
    status: number;
    headers: Record<string, string>;
    body: string;
  } | null = null;

  async function fetchFile(where: string, params?: Record<string, string>): Promise<void> {
    const target = address("/api/files/:fileId?type=blob", params);
    const response = await page.request.get(target).catch((error: unknown) => {
      throw new Error(`unbound: ${where} — ${target} could not be reached (${String(error)})`);
    });
    lastFile = {
      status: response.status(),
      headers: response.headers(),
      body: await response.text().catch(() => ""),
    };
  }

  function fileHeader(name: string): string {
    return lastFile?.headers[name] ?? "";
  }

  const fileDownload: S.FileDownloadPage = {
    open: (params) => fetchFile("file-download.open", params),
    downloadFile: (input) =>
      fetchFile("file-download.download_file", {
        fileId: field(input, "fileId", "id") || asText(input),
      }),
    fileContents: async () => lastFile?.body ?? "",
    // The name the file is kept under travels in the disposition the answer carries.
    fileNameOnSave: async () => {
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(
        fileHeader("content-disposition"),
      );
      return match ? decodeURIComponent(match[1]) : "";
    },
    offeredAsDownloadNotDisplayed: async () =>
      /attachment/i.test(fileHeader("content-disposition")) ? "attachment" : "",
    contentTypeFromName: async () => fileHeader("content-type"),
    readableWhenSignedOutIfPublic: async () =>
      lastFile && lastFile.status === 200 ? lastFile.body : "",
    refusedWhenNotPermitted: async () =>
      lastFile && lastFile.status >= 400 ? `${lastFile.status} ${lastFile.body}` : "",
    refusedForUnknownFile: async () =>
      lastFile && lastFile.status >= 400 ? `${lastFile.status} ${lastFile.body}` : "",
    notFoundForAdministrator: async () =>
      lastFile && lastFile.status >= 400 ? `${lastFile.status} ${lastFile.body}` : "",
  };

  // The attachment control is a step of the opportunity and proposal forms rather than
  // a tab of its own; opening it means opening the form and walking to that step.
  const fileAttachmentControl: S.FileAttachmentControlPage = {
    async open(params) {
      const programme = params?.program ?? params?.programme ?? "code-with-us";
      const opportunityId = params?.opportunityId ?? params?.id;
      if (!opportunityId) {
        throw new Error(
          "unbound: file-attachment-control.open — the attachments step needs the opportunity it belongs to",
        );
      }
      await go(`/opportunities/${programme}/${opportunityId}/edit?tab=opportunity`);
      await advanceTo("file-attachment-control.open", "Add Attachment");
    },
    addAttachment: (input) => addAttachment("file-attachment-control.add_attachment", input),
    renameNewAttachment: (input) =>
      renameAttachment("file-attachment-control.rename_new_attachment", input),
    removeNewAttachment: (input) =>
      removeAttachment("file-attachment-control.remove_new_attachment", input),
    removeExistingAttachment: (input) =>
      removeAttachment("file-attachment-control.remove_existing_attachment", input),
    downloadAttachment: async (input) => {
      const boxes = attachmentNameBoxes();
      const count = await boxes.count();
      if (count) {
        const which = Math.min(indexOf(input), count - 1);
        const link = boxes.nth(which).locator("xpath=following-sibling::a[1]");
        if (await link.count()) {
          await link.first().click();
          await settle();
          return;
        }
      }
      await press("file-attachment-control.download_attachment", ["Download"]);
    },
    async newAttachmentRow() {
      const boxes = attachmentNameBoxes();
      const count = await boxes.count();
      const names: string[] = [];
      for (let i = 0; i < count; i++) {
        const typed = await boxes.nth(i).inputValue();
        const original = (await boxes.nth(i).getAttribute("placeholder")) ?? "";
        names.push(typed || original);
      }
      return names.join("\n");
    },
    existingAttachmentRow: () => sectionFrom(["Attachments"]),
    // An attachment already saved is shown as plain words; a newly added one is shown in
    // a box that can still be typed into.
    existingAttachmentNameReadOnly: async () =>
      (await attachmentNameBoxes().count()) ? "editable" : "read-only",
    async originalExtensionRestored() {
      const boxes = attachmentNameBoxes();
      if (!(await boxes.count())) return "";
      const typed = await boxes.first().inputValue();
      const original = (await boxes.first().getAttribute("placeholder")) ?? "";
      return typed || original;
    },
    fileNameError: () => messages(/name|extension|file/i),
    removeControlHiddenWhenNotRemovable: async () =>
      controlState(["Remove", "Remove Attachment"]),
    attachmentListOnPublicView: () => tabContent(["Attachments"]),
  };

  const fileImagePicker: S.FileImagePickerPage = {
    ...at("/users/:userId"),
    chooseImage: (input) => chooseImage("file-image-picker.choose_image", input),
    currentImage: async () => {
      const images = seen(page.getByRole("img"));
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const source = await images.nth(i).getAttribute("src");
        if (source) return source;
      }
      return "";
    },
    chosenImagePreview: async () => {
      const images = seen(page.getByRole("img"));
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const source = await images.nth(i).getAttribute("src");
        if (source && (source.startsWith("blob:") || source.startsWith("data:"))) return source;
      }
      return "";
    },
    onlyJpegAndPngOffered: async () => {
      throw new Error(
        "unbound: file-image-picker.only_jpeg_and_png_offered — the picker says nothing on the page about which kinds of image it takes; the restriction lives only in the chooser the operating system opens",
      );
    },
    rejectedImageError: () => messages(/image|file|type/i),
    imageReadableWhenSignedOut: async () => {
      const images = seen(page.getByRole("img"));
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const source = await images.nth(i).getAttribute("src");
        if (source && source.includes("/api/files/")) {
          const response = await page.request.get(source).catch(() => null);
          return response ? String(response.status()) : "";
        }
      }
      return "";
    },
  };

  const fileEmbeddedImage: S.FileEmbeddedImagePage = {
    ...at("/content/:slug/edit"),
    uploadBodyImage: (input) => uploadBodyImage("file-embedded-image.upload_body_image", input),
    imageInsertedIntoText: () => fieldValue(["Body"]),
    onlyJpegAndPngOffered: async () => {
      throw new Error(
        "unbound: file-embedded-image.only_jpeg_and_png_offered — the editor states nothing on the page about the kinds of image it takes",
      );
    },
    uploadingIndicator: () => linesMatching(/uploading/i),
    imageRenderedInPublishedText: async () => {
      const images = seen(page.getByRole("img"));
      const count = await images.count();
      const sources: string[] = [];
      for (let i = 0; i < count; i++) {
        const source = await images.nth(i).getAttribute("src");
        if (source) sources.push(source);
      }
      return sources.join("\n");
    },
    uploadFailureLeavesTextUnchanged: () => fieldValue(["Body"]),
  };

  return {
    signIn,
    signOut,
    home,
    opportunityDashboard,
    opportunityList,
    opportunityProgramSelect,
    opportunityCwuCreate,
    opportunityCwuView,
    opportunityCwuEdit,
    opportunityCwuComplete,
    opportunitySwuCreate,
    opportunitySwuView,
    opportunitySwuEdit,
    opportunitySwuComplete,
    opportunityTwuCreate,
    opportunityTwuView,
    opportunityTwuEdit,
    opportunityTwuComplete,
    proposalCwuCreate,
    proposalCwuEdit,
    proposalCwuView,
    proposalCwuExportOne,
    proposalCwuExportAll,
    proposalSwuCreate,
    proposalSwuEdit,
    proposalSwuView,
    proposalSwuExportOne,
    proposalSwuExportAll,
    proposalTwuCreate,
    proposalTwuEdit,
    proposalTwuView,
    proposalTwuExportOne,
    proposalTwuExportAll,
    proposalVendorDashboard,
    proposalListStub,
    organizationList,
    organizationCreate,
    organizationEdit,
    organizationSwuTerms,
    organizationTwuTerms,
    organizationUserMemberships,
    userSignIn,
    userSignUpChooseAccount,
    userSignUpComplete,
    userSignOut,
    userNotice,
    userList,
    userProfile,
    userProfileCapabilities,
    userProfileNotifications,
    userProfileLegal,
    evaluationPanelDashboard,
    evaluationPanelSwu,
    evaluationPanelTwu,
    evaluationInstructionsSwu,
    evaluationInstructionsTwu,
    evaluationIndividualListSwu,
    evaluationIndividualListTwu,
    evaluationConsensusListSwu,
    evaluationConsensusListTwu,
    evaluationIndividualCreateSwu,
    evaluationIndividualEditSwu,
    evaluationConsensusCreateSwu,
    evaluationConsensusEditSwu,
    evaluationIndividualCreateTwu,
    evaluationIndividualEditTwu,
    evaluationConsensusCreateTwu,
    evaluationConsensusEditTwu,
    notificationUnsubscribeLanding,
    notificationOptinOpportunityList,
    notificationTermsBroadcast,
    notificationEmailReference,
    contentFooter,
    contentList,
    contentCreate,
    contentEdit,
    contentView,
    fileDownload,
    fileAttachmentControl,
    fileImagePicker,
    fileEmbeddedImage,
  };
}
