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

import { request as httpRequest } from "node:http";
import type { IncomingMessage, RequestOptions } from "node:http";
import { request as httpsRequest } from "node:https";
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

  // Each attachment is a box holding its name, an unlabelled remove mark drawn just to
  // the right of that box, and an unnamed link to its file. The link is known by where it
  // leads; the mark carries nothing to read, so it is known by where it is drawn.
  async function markBeside(box: Locator): Promise<Locator | null> {
    const edge = await box.boundingBox();
    if (!edge) return null;
    const marks = seen(page.getByRole("img"));
    const count = await marks.count();
    let best: Locator | null = null;
    let nearest = Number.POSITIVE_INFINITY;
    for (let i = 0; i < count; i++) {
      const mark = await marks.nth(i).boundingBox();
      if (!mark) continue;
      const middle = mark.y + mark.height / 2;
      if (middle < edge.y || middle > edge.y + edge.height) continue;
      const gap = mark.x - (edge.x + edge.width);
      if (gap < -1 || gap >= nearest) continue;
      nearest = gap;
      best = marks.nth(i);
    }
    return best;
  }

  async function attachmentLink(which: number): Promise<Locator | null> {
    const links = seen(page.getByRole("link"));
    const count = await links.count();
    let passed = 0;
    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      if (!href.startsWith("blob:") && !href.includes("/api/files/")) continue;
      if (passed === which) return links.nth(i);
      passed++;
    }
    return null;
  }

  // The mark drawn right beside an attachment's name takes it off the list.
  async function removeAttachment(where: string, input: unknown): Promise<void> {
    await advanceTo(where, "Add Attachment");
    const boxes = attachmentNameBoxes();
    const count = await boxes.count();
    if (count) {
      const which = Math.min(indexOf(input), count - 1);
      const beside = await markBeside(boxes.nth(which));
      if (beside) {
        await beside.click();
        await settle();
        return;
      }
    }
    await press(where, ["Remove", "Remove Attachment"]);
  }

  // ---------------------------------------------------------------- identifiers

  // A record's own screen carries its identifier in the address it lands on.
  const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

  function fromAddress(pattern: string): string {
    const match = new RegExp(pattern).exec(new URL(page.url()).pathname);
    return match ? match[1] : "";
  }

  const opportunityId = (): string => fromAddress(`^/opportunities/[a-z-]+/(${UUID})`);
  const proposalId = (): string => fromAddress(`/proposals/(${UUID})`);
  const organizationId = (): string => fromAddress(`^/organizations/(${UUID})`);

  // "/users/me" keeps "me" in its address, so the tabs beside the profile are read
  // instead: each one leads to the same person under their own identifier.
  async function userId(): Promise<string> {
    const shown = fromAddress(`^/users/(${UUID})`);
    if (shown) return shown;
    const links = seen(page.getByRole("link"));
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      const match = new RegExp(`^/users/(${UUID})\\?tab=`).exec(href);
      if (match) return match[1];
    }
    return "";
  }

  // The History tab lists its entries newest first, each signed by the person who made
  // it. The name is drawn in capitals, so its own spelling is taken from the text itself.
  async function latestHistoryAuthor(where: string): Promise<string> {
    await openTab(where, ["History"]);
    const rows = seen(page.getByRole("row"));
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).getByRole("cell");
      const cellCount = await cells.count();
      if (!cellCount) continue;
      const signed = cells.nth(cellCount - 1);
      const lines = (await signed.innerText())
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const shown = lines[lines.length - 1] ?? "";
      if (!shown) return "";
      const own = (await signed.textContent()) ?? "";
      const at = own.toLowerCase().lastIndexOf(shown.toLowerCase());
      return at >= 0 ? own.slice(at, at + shown.length) : shown;
    }
    return "";
  }

  // ---------------------------------------------------------------- answers from addresses

  // A few surfaces are addresses that answer with a document rather than screens. They
  // are asked from the browser's own session, so the answer is the one the signed-in
  // person would get, and the latest answer is what the observations on them read.
  type Answer = { status: number; headers: Record<string, string>; body: string };
  let lastAnswer: Answer | null = null;

  async function ask(where: string, target: string, data?: unknown): Promise<Answer> {
    const sent = data === undefined ? page.request.get(target) : page.request.post(target, { data });
    const response = await sent.catch((error: unknown) => {
      throw new Error(`unbound: ${where} — ${target} could not be reached (${String(error)})`);
    });
    const answer: Answer = {
      status: response.status(),
      headers: response.headers(),
      body: await response.text().catch(() => ""),
    };
    lastAnswer = answer;
    return answer;
  }

  function answered(): Record<string, unknown> {
    try {
      const parsed: unknown = JSON.parse(lastAnswer?.body ?? "");
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  const header = (name: string): string => lastAnswer?.headers[name] ?? "";

  // A refusal reads as its status and the body it came with, and only when the latest
  // answer was one; a request that went through reads as nothing.
  function refusal(isRefusal: (status: number) => boolean, about?: RegExp): string {
    if (!lastAnswer || !isRefusal(lastAnswer.status)) return "";
    if (about && !about.test(lastAnswer.body)) return "";
    return `${lastAnswer.status} ${lastAnswer.body}`;
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
      opportunityIdentifier: async () => opportunityId(),
      // The header reads "Published <date>" above the title, beside "Updated <date>".
      publishedDate: () => linesMatching(/^Published\s/),
      // The public page names nobody: its header carries only the published and updated
      // dates. Who made and last changed an opportunity is shown on its management page.
      createdByName: async (): Promise<string> => {
        throw new Error(
          `unbound: ${where}.created_by_name — the public opportunity page names no creator; its header shows only the published and updated dates, and the creator's name appears only on the management page`,
        );
      },
      lastChangedByName: async (): Promise<string> => {
        throw new Error(
          `unbound: ${where}.last_changed_by_name — the public opportunity page names nobody who changed it; only the updated date is shown`,
        );
      },
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
      opportunityIdentifier: async () => opportunityId(),
      createdByName: () => valueAfter(["Created By"]),
      lastChangedByName: () => latestHistoryAuthor(`${where}.last_changed_by_name`),
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

  // Not a screen. The service moves time-driven transitions on in front of this address,
  // so asking for it is the whole of the action; it answers "OK" when it is up.
  const scheduledTransitionTrigger: S.ScheduledTransitionTriggerPage = {
    ...at("/status"),
    runPendingTransitions: async () => {
      await ask("scheduled-transition-trigger.run_pending_transitions", baseURL + "/status");
    },
    async serviceIsUp() {
      if (new URL(page.url()).pathname === "/status") {
        return (await page.evaluate(() => document.body.innerText)).trim();
      }
      const answer = await ask("scheduled-transition-trigger.service_is_up", baseURL + "/status");
      return answer.status === 200 ? answer.body.trim() : "";
    },
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
      proposalIdentifier: async () => proposalId(),
      opportunityIdentifier: async () => opportunityId(),
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
    proposalIdentifier: async () => proposalId(),
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
    proposalIdentifier: async () => proposalId(),
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
    proposalIdentifier: async () => proposalId(),
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
    // A refused visitor is sent to sign in or shown a permission message; a visitor who
    // may see the list, even an empty one, reads as nothing here.
    async refusedWhenNotPermitted() {
      if (new URL(page.url()).pathname.startsWith("/sign-in")) return page.url();
      return messages(/permission|not authori[sz]ed|sign in/i);
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
      // The team screen invites ordinary members only. Any other kind of membership can
      // be asked for only at the address that screen itself sends its invitations to.
      const kind = field(input, "membershipType", "membership_type", "kind");
      if (kind && kind.toUpperCase() !== "MEMBER") {
        const organization = organizationId();
        if (!organization) {
          throw new Error(
            `unbound: organization-edit.add_team_members — no organization in the address ${page.url()} to invite to`,
          );
        }
        const invited = asList(field(input, "emails", "email", "userEmail"));
        for (const userEmail of invited.length ? invited : [""]) {
          await ask("organization-edit.add_team_members", baseURL + "/api/affiliations", {
            userEmail,
            organization,
            membershipType: kind,
          });
        }
        return;
      }
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
    organizationIdentifier: async () => organizationId(),
    // The latest refusal, whole, when the invitation was refused; otherwise whatever
    // messages the screen is showing.
    async invalidMembershipTypeError() {
      return refusal((status) => status >= 400) || messages();
    },
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

  // The organizations tab lists a pending invitation with nothing beside it to answer it
  // with. An invitation is answered from the message that carries it: its Approve and
  // Reject buttons lead to this tab with the invitation and the answer in the address,
  // and the tab opens a confirmation ("Approve Request?" / "Reject Request?") waiting.
  function organizationMemberships(where: string, route: string) {
    const confirmation = (answer: "approve" | "reject") =>
      seen(
        page
          .getByRole("dialog")
          .filter({ hasText: answer === "approve" ? "Approve Request?" : "Reject Request?" }),
      );

    const answerInvitation =
      (member: string, answer: "approve" | "reject") =>
      async (input?: unknown): Promise<void> => {
        if (!(await confirmation(answer).count())) {
          const affiliation =
            field(input, "invitationAffiliationId", "affiliationId", "affiliation", "id") ||
            (typeof input === "string" ? input : "");
          if (!affiliation) {
            throw new Error(
              `unbound: ${where}.${member} — the organizations tab offers no ${answer} control beside a pending invitation; it is answered only through the invitation message's link, which needs the invitation's affiliation identifier, and none was supplied`,
            );
          }
          await go(
            `/users/me?tab=organizations&invitationAffiliationId=${encodeURIComponent(affiliation)}&invitationResponse=${answer}`,
          );
        }
        if (!(await confirmation(answer).count())) {
          throw new Error(
            `unbound: ${where}.${member} — no ${answer} confirmation opened on ${page.url()}`,
          );
        }
        await press(
          `${where}.${member}`,
          [answer === "approve" ? "Approve Request" : "Reject Request"],
          confirmation(answer).first(),
        );
      };

    return {
      ...at(route),
      approveInvitation: answerInvitation("approve_invitation", "approve"),
      rejectInvitation: answerInvitation("reject_invitation", "reject"),
      leaveOrganization: async (): Promise<void> => {
        throw new Error(
          `unbound: ${where}.leave_organization — an affiliated organization's row carries only its name; the column beside it is empty and no leave control appears anywhere on the tab`,
        );
      },
      createOrganization: () =>
        press(`${where}.create_organization`, ["Create Organization"], navBar()),
      openOrganization: (input?: unknown) => openNamed(`${where}.open_organization`, input),
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
      async acceptConfirmation() {
        const shown = confirmation("approve");
        return (await shown.count()) ? (await shown.first().innerText()).trim() : "";
      },
      async declineConfirmation() {
        const shown = confirmation("reject");
        return (await shown.count()) ? (await shown.first().innerText()).trim() : "";
      },
    };
  }

  const organizationUserMemberships: S.OrganizationUserMembershipsPage = organizationMemberships(
    "organization-user-memberships",
    "/users/:userId?tab=organizations",
  );
  const organizationUserMembershipsSelf: S.OrganizationUserMembershipsSelfPage =
    organizationMemberships("organization-user-memberships-self", "/users/me?tab=organizations");

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

  // The profile screen, reached under a person's identifier or as the signed-in "me".
  function profile(where: string, route: string) {
    return {
      ...at(route),
      editProfile: () => press(`${where}.edit_profile`, ["Edit Profile"], navBar()),
      saveChanges: () => press(`${where}.save_changes`, ["Save Changes"], navBar()),
      cancelEditing: () => press(`${where}.cancel_editing`, ["Cancel"], navBar()),
      changeAvatar: (input?: unknown) => chooseImage(`${where}.change_avatar`, input),
      deactivateAccount: () => press(`${where}.deactivate_account`, ["Deactivate Account"]),
      confirmActivationChange: () =>
        inDialog(`${where}.confirm_activation_change`, [
          "Deactivate Account",
          "Reactivate Account",
        ]),
      cancelActivationChange: () => inDialog(`${where}.cancel_activation_change`, ["Cancel"]),
      userIdentifier: () => userId(),
      profileTab: () => tabContent(["Profile"]),
      capabilitiesTab: () => tabContent(["Capabilities"]),
      notificationsTab: () => tabContent(["Notifications"]),
      legalTab: () => tabContent(["Policies, Terms & Agreements"]),
      organizationsTab: () => tabContent(["Organizations"]),
      statusBadge: () => valueAfter(["Status"]),
      accountType: () => valueAfter(["Account Type"]),
      idpUsernameReadonly: () => fieldValue(["IDIR", "GitHub"]),
      nameField: () => fieldValue(["Name"]),
      emailField: () => fieldValue(["Email Address"]),
      jobTitleField: () => fieldValue(["Job Title"]),
      fieldError: () => messages(),
      activationModal: () => dialogText(),
    };
  }

  const userProfile: S.UserProfilePage = {
    ...profile("user-profile", "/users/:userId"),
    toggleAdminPermission: () => tick("user-profile.toggle_admin_permission", ["Admin"]),
    reactivateAccount: () => press("user-profile.reactivate_account", ["Reactivate Account"]),
    permissionsLabel: () => valueAfter(["Permission(s)", "Permissions"]),
    adminCheckbox: () => tickState(["Admin"]),
    notFoundPage: () => contentText(),
  };

  const userProfileSelf: S.UserProfileSelfPage = {
    ...profile("user-profile-self", "/users/me"),
    // Signed out, "/users/me" sends the browser to the sign-in page, carrying the way back.
    async signInRequired() {
      if (!new URL(page.url()).pathname.startsWith("/sign-in")) return "";
      return (await linesMatching(/sign in/i)) || page.url();
    },
  };

  async function fieldValue(labels: string[]): Promise<string> {
    for (const label of labels) {
      const box = seen(page.getByRole("textbox", { name: label, exact: false }));
      if (await box.count()) return (await box.first().inputValue()).trim();
    }
    return valueAfter(labels);
  }

  function profileCapabilities(where: string, route: string) {
    return {
      ...at(route),
      toggleCapability: (input?: unknown) => press(`${where}.toggle_capability`, [asText(input)]),
      expandCapabilityDescription: async (input?: unknown) => {
        const name = asText(input);
        if (!name) {
          throw new Error(`unbound: ${where}.expand_capability_description — no capability was named`);
        }
        const row = seen(page.getByText(name, { exact: true })).first();
        if (!(await row.count())) {
          throw new Error(
            `unbound: ${where}.expand_capability_description — no capability named "${name}" on ${page.url()}`,
          );
        }
        const marks = row.getByRole("img");
        const count = await marks.count();
        if (!count) {
          throw new Error(
            `unbound: ${where}.expand_capability_description — "${name}" offers no control to open its description`,
          );
        }
        await marks.nth(count - 1).click();
        await settle();
      },
      capabilityRow: () => sectionFrom(["Capabilities"]),
      capabilityChecked: async (): Promise<string> => {
        throw new Error(
          `unbound: ${where}.capability_checked — whether a capability is held is shown only by the colour and shape of an unlabelled icon; the row carries no text, no checkbox and no state in the accessibility tree`,
        );
      },
      capabilityDescription: () => sectionFrom(["Capabilities"]),
    };
  }

  const userProfileCapabilities: S.UserProfileCapabilitiesPage = profileCapabilities(
    "user-profile-capabilities",
    "/users/:userId?tab=capabilities",
  );
  const userProfileSelfCapabilities: S.UserProfileSelfCapabilitiesPage = profileCapabilities(
    "user-profile-self-capabilities",
    "/users/me?tab=capabilities",
  );

  function profileNotifications(where: string, route: string) {
    return {
      ...at(route),
      toggleNewOpportunityNotifications: () =>
        tick(`${where}.toggle_new_opportunity_notifications`, ["New opportunities"]),
      confirmUnsubscribe: async (): Promise<void> => {
        throw new Error(
          `unbound: ${where}.confirm_unsubscribe — turning the notice off on this tab takes effect at once and raises no confirmation; the confirmation belongs to the unsubscribe landing page`,
        );
      },
      cancelUnsubscribe: async (): Promise<void> => {
        throw new Error(
          `unbound: ${where}.cancel_unsubscribe — this tab raises no unsubscribe confirmation to cancel`,
        );
      },
      newOpportunitiesCheckbox: () => tickState(["New opportunities"]),
      notificationEmailAddress: () => linesMatching(/@/),
      unsubscribeModal: async (): Promise<string> => {
        throw new Error(`unbound: ${where}.unsubscribe_modal — no confirmation appears on this tab`);
      },
    };
  }

  const userProfileNotifications: S.UserProfileNotificationsPage = profileNotifications(
    "user-profile-notifications",
    "/users/:userId?tab=notifications",
  );
  const userProfileSelfNotifications: S.UserProfileSelfNotificationsPage = profileNotifications(
    "user-profile-self-notifications",
    "/users/me?tab=notifications",
  );

  function profileLegal(where: string, route: string) {
    return {
      ...at(route),
      openAppTerms: () =>
        press(`${where}.open_app_terms`, ["Digital Marketplace Terms & Conditions for E-Bidding"]),
      acceptUpdatedTerms: () =>
        press(`${where}.accept_updated_terms`, ["agree to the updated terms"]),
      confirmAcceptUpdatedTerms: async () => {
        const box = seen(dialog().getByRole("checkbox"));
        if (await box.count()) await box.first().click();
        await inDialog(`${where}.confirm_accept_updated_terms`, ["Agree & Continue", "Agree"]);
      },
      privacyPolicy: () => sectionFrom(["Privacy Policy"], ["Terms & Conditions"]),
      appTermsLink: () => linesMatching(/^Digital Marketplace Terms & Conditions for E-Bidding$/),
      acceptedOnNotice: () => linesMatching(/you agreed to/i),
      termsUpdatedWarning: () => linesMatching(/have been updated/i),
      programTermsLinks: () => linesMatching(/(Code|Sprint|Team) With Us Terms & Conditions/),
      acceptUpdatedTermsModal: () => dialogText(),
    };
  }

  const userProfileLegal: S.UserProfileLegalPage = profileLegal(
    "user-profile-legal",
    "/users/:userId?tab=legal",
  );
  const userProfileSelfLegal: S.UserProfileSelfLegalPage = profileLegal(
    "user-profile-self-legal",
    "/users/me?tab=legal",
  );

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

  // The program pages offer "See Service Level Agreement ..." as an ordinary link. The
  // service creates no page at the address it leads to, and answers there with its own
  // "Not Found" screen.
  function slaLink(): Locator {
    return seen(page.getByRole("link", { name: /service level agreement/i }));
  }

  async function visit(href: string): Promise<void> {
    if (/^https?:\/\//.test(href)) {
      await page.goto(href, { waitUntil: "domcontentloaded" });
      await settle();
      return;
    }
    await go(href.startsWith("/") ? href : `/${href}`);
  }

  const contentServiceLevelAgreementLink: S.ContentServiceLevelAgreementLinkPage = {
    ...at("/learn-more/code-with-us"),
    followServiceLevelAgreementLink: async () => {
      const href = (await slaLink().count()) ? await slaLink().first().getAttribute("href") : null;
      if (!href) {
        throw new Error(
          `unbound: content-service-level-agreement-link.follow_service_level_agreement_link — no service level agreement link on ${page.url()}`,
        );
      }
      // The link may open a window of its own, so follow where it leads.
      await visit(href);
    },
    serviceLevelAgreementLink: async () =>
      (await slaLink().count()) ? (await slaLink().first().innerText()).trim() : "",
    linkTargetAddress: async () =>
      (await slaLink().count()) ? ((await slaLink().first().getAttribute("href")) ?? "") : "",
    async answerAtLinkTarget() {
      if (await slaLink().count()) {
        const href = await slaLink().first().getAttribute("href");
        if (href) await visit(href);
      }
      return contentText();
    },
  };

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
    // The form states "This page is available at /content/<slug>." under the slug.
    async pageAddress() {
      const stated = /(\/content\/[A-Za-z0-9_-]+)/.exec(await linesMatching(/is available at/i));
      return stated ? stated[1] : fromAddress("^(/content/[^/]+)/edit");
    },
    bodyBeingEdited: () => fieldValue(["Body"]),
    // Nothing on this screen offers a page's earlier versions, so this reads empty here.
    versionHistory: () =>
      sectionFrom(["History", "Version History", "Versions", "Previous Versions"]),
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
    pageAddress: async () => new URL(page.url()).pathname,
  };

  // ================================================================ files

  // A stored file is not a screen: it is an address that answers with the bytes, or with
  // a description of them, and with the headers that say how to keep them. Every request
  // is made in the browser's own session, so what it may see is what the signed-in person
  // may see. On this target an unknown file answers 404 and a signed-out upload 401.

  type Upload = {
    name: string;
    metadata?: string;
    file?: { fileName: string; mimeType: string; contents: string };
  };

  // Uploads are sent from inside the page, the way the attachment control sends them, so
  // the session travels with them and nothing outside the browser is needed.
  async function upload(where: string, form: Upload): Promise<void> {
    if (!page.url().startsWith(baseURL)) await go("/api/files");
    lastAnswer = await page
      .evaluate(async (sent) => {
        const body = new FormData();
        body.append("name", sent.name);
        if (sent.metadata !== undefined) body.append("metadata", sent.metadata);
        if (sent.file) {
          body.append(
            "file",
            new Blob([sent.file.contents], { type: sent.file.mimeType }),
            sent.file.fileName,
          );
        }
        const response = await fetch("/api/files", { method: "POST", body });
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return { status: response.status, headers, body: await response.text() };
      }, form)
      .catch((error: unknown) => {
        throw new Error(`unbound: ${where} — the upload could not be sent (${String(error)})`);
      });
  }

  // Neither the browser nor Playwright's request client will send a body without stating
  // its length, so this one submission leaves from the test process itself: the same
  // multipart form, carrying the browser's session cookies, written in chunks with no
  // Content-Length header at all.
  async function uploadWithoutLength(where: string, form: Upload): Promise<void> {
    const target = new URL(baseURL + "/api/files");
    const cookie = (await page.context().cookies(target.origin))
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    const boundary = `----withoutLength${Date.now().toString(16)}`;
    const part = (disposition: string, value: string, type?: string): string =>
      `--${boundary}\r\nContent-Disposition: form-data; ${disposition}\r\n` +
      (type ? `Content-Type: ${type}\r\n` : "") +
      `\r\n${value}\r\n`;
    const pieces = [part(`name="name"`, form.name)];
    if (form.metadata !== undefined) pieces.push(part(`name="metadata"`, form.metadata));
    if (form.file) {
      pieces.push(
        part(
          `name="file"; filename="${form.file.fileName.replace(/"/g, "%22")}"`,
          form.file.contents,
          form.file.mimeType,
        ),
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
    lastAnswer = await new Promise<Answer>((resolve, reject) => {
      const onResponse = (response: IncomingMessage): void => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("error", reject);
        response.on("end", () => {
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.headers)) {
            if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(", ") : value;
          }
          resolve({
            status: response.statusCode ?? 0,
            headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      };
      const request =
        target.protocol === "https:"
          ? httpsRequest(target, options, onResponse)
          : httpRequest(target, options, onResponse);
      request.on("error", reject);
      for (const piece of pieces) request.write(piece);
      request.end();
    }).catch((error: unknown) => {
      throw new Error(`unbound: ${where} — the upload could not be sent (${String(error)})`);
    });
  }

  // Who may read a stored file travels as a list of { tag, value } entries, with tag one
  // of any, user or userType. A bare word is taken as a tag; anything already written out
  // is sent exactly as given, malformed or not.
  function readAccess(input: unknown): string | undefined {
    if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
    const record = input as Record<string, unknown>;
    const stated = record.readAccess ?? record.read_access ?? record.metadata ?? record.access;
    if (stated === undefined || stated === null) return undefined;
    if (typeof stated === "string") {
      return /^[A-Za-z]+$/.test(stated) ? JSON.stringify([{ tag: stated }]) : stated;
    }
    return JSON.stringify(Array.isArray(stated) ? stated : [stated]);
  }

  function uploadForm(input: unknown, metadata: string | undefined, withFile = true): Upload {
    const name =
      field(input, "name", "fileName", "file_name") ||
      (typeof input === "string" ? input : "") ||
      "upload.txt";
    const size = Number.parseInt(field(input, "size", "sizeBytes", "size_bytes", "bytes"), 10);
    const contents = Number.isFinite(size)
      ? "A".repeat(size)
      : field(input, "contents", "content", "body", "text");
    return {
      name,
      metadata,
      file: withFile
        ? {
            fileName: field(input, "fileName", "file_name") || name,
            mimeType: field(input, "mimeType", "contentType", "content_type") || "text/plain",
            contents,
          }
        : undefined,
    };
  }

  // An upload that says nothing about who may read it sends an empty list, which this
  // target accepts; leaving the field out altogether is refused as invalid.
  const NO_STATED_ACCESS = "[]";

  const fileUpload: S.FileUploadPage = {
    ...at("/api/files"),
    uploadFile: (input) =>
      upload("file-upload.upload_file", uploadForm(input, readAccess(input) ?? NO_STATED_ACCESS)),
    uploadFileStatingItsReadAccess: async (input) => {
      const stated = readAccess(input);
      if (stated === undefined) {
        throw new Error(
          "unbound: file-upload.upload_file_stating_its_read_access — no read access was supplied to state",
        );
      }
      await upload("file-upload.upload_file_stating_its_read_access", uploadForm(input, stated));
    },
    uploadFileWithoutDeclaringItsSize: (input) =>
      uploadWithoutLength(
        "file-upload.upload_file_without_declaring_its_size",
        uploadForm(input, readAccess(input) ?? NO_STATED_ACCESS),
      ),
    uploadFileWithNoFilePart: (input) =>
      upload(
        "file-upload.upload_file_with_no_file_part",
        uploadForm(input, readAccess(input) ?? NO_STATED_ACCESS, false),
      ),
    uploadFileWithUnrecognisedReadAccess: (input) =>
      upload(
        "file-upload.upload_file_with_unrecognised_read_access",
        uploadForm(input, readAccess(input) ?? JSON.stringify([{ tag: "nobodyInParticular" }])),
      ),
    uploadFileWithMalformedReadAccess: (input) =>
      upload(
        "file-upload.upload_file_with_malformed_read_access",
        uploadForm(input, readAccess(input) ?? "{not a read access"),
      ),
    storedFileIdentifier: async () =>
      lastAnswer && lastAnswer.status < 300 ? String(answered().id ?? "") : "",
    // The refusal readers hand over the latest refusal whole — its status and its body —
    // and leave it to the test to decide what that refusal says.
    refusedForSize: async () => refusal((status) => status >= 400),
    sizeLimitNamedInRefusal: async () => refusal((status) => status >= 400),
    refusedForFileNameLength: async () => refusal((status) => status >= 400),
    refusedForReadAccess: async () => refusal((status) => status >= 400),
    refusedWhenSignedOut: async () => refusal((status) => status === 401),
    serviceFault: async () => {
      if (!lastAnswer || lastAnswer.status < 500) return "";
      const message = answered().message;
      return `${lastAnswer.status} ${typeof message === "string" ? message : lastAnswer.body}`;
    },
  };

  const fileDescription: S.FileDescriptionPage = {
    open: async (params) => {
      await ask("file-description.open", address("/api/files/:fileId", params));
    },
    fileIdentifier: async () => (lastAnswer?.status === 200 ? String(answered().id ?? "") : ""),
    fileName: async () => (lastAnswer?.status === 200 ? String(answered().name ?? "") : ""),
    storedDate: async () => (lastAnswer?.status === 200 ? String(answered().createdAt ?? "") : ""),
    // The description names the stored content by the digest it is kept under.
    storedContentIdentifier: async () =>
      lastAnswer?.status === 200 ? String(answered().fileBlob ?? "") : "",
    refusedWhenNotPermitted: async () => refusal((status) => status === 401 || status === 403),
    refusedForUnknownFile: async () => refusal((status) => status === 404),
    notFoundForAdministrator: async () => refusal((status) => status === 404),
  };

  const fileDownload: S.FileDownloadPage = {
    open: async (params) => {
      await ask("file-download.open", address("/api/files/:fileId?type=blob", params));
    },
    downloadFile: async (input) => {
      await ask(
        "file-download.download_file",
        address("/api/files/:fileId?type=blob", {
          fileId: field(input, "fileId", "id") || asText(input),
        }),
      );
    },
    fileContents: async () => (lastAnswer && lastAnswer.status < 300 ? lastAnswer.body : ""),
    // The name the file is kept under travels in the disposition the answer carries.
    fileNameOnSave: async () => {
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header("content-disposition"));
      return match ? decodeURIComponent(match[1]) : "";
    },
    offeredAsDownloadNotDisplayed: async () =>
      /attachment/i.test(header("content-disposition")) ? "attachment" : "",
    contentTypeFromName: async () => header("content-type"),
    readableWhenSignedOutIfPublic: async () =>
      lastAnswer && lastAnswer.status === 200 ? lastAnswer.body : "",
    refusedWhenNotPermitted: async () => refusal((status) => status === 401 || status === 403),
    refusedForUnknownFile: async () => refusal((status) => status === 404),
    notFoundForAdministrator: async () => refusal((status) => status === 404),
  };

  // The attachment control is a step of the opportunity and proposal forms rather than
  // a tab of its own; opening it means opening the form and walking to that step.
  const fileAttachmentControl: S.FileAttachmentControlPage = {
    async open(params) {
      const programme = params?.program || "code-with-us";
      const opportunityId = params?.opportunityId;
      if (!opportunityId) {
        throw new Error(
          "unbound: file-attachment-control.open — the attachments step needs the opportunity it belongs to",
        );
      }
      await go(`/opportunities/${programme}/${opportunityId}/edit?tab=opportunity`);
      // The step is headed "Attachments" and states its size limit whether or not the
      // form is being edited; "Add Attachment" appears only once editing has begun.
      await advanceTo("file-attachment-control.open", "Attachments");
    },
    // A stored attachment is offered as a link to the address the file is kept at.
    async attachmentAddress() {
      const links = seen(page.getByRole("link"));
      const count = await links.count();
      const found: string[] = [];
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute("href");
        if (href && href.includes("/api/files/")) found.push(href);
      }
      return found.join("\n");
    },
    sizeLimitStatedBeforeChoosing: () => linesMatching(/smaller than|\b\d+\s?MB\b/i),
    // The upload is made through the page's own file chooser, so its refusal is whatever
    // message the step shows afterwards, whole.
    uploadRefusedForSize: () => messages(),
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
        const link = await attachmentLink(which);
        if (link) {
          await link.click();
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

  // A stored picture is shown from the service's own address; the placeholder shown when
  // there is none comes from the site's static images and is not a stored image.
  async function storedImageAddress(): Promise<string> {
    const images = seen(page.getByRole("img"));
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const source = await images.nth(i).getAttribute("src");
      if (source && source.includes("/api/")) return source;
    }
    return "";
  }

  // The size the image was stored at, read by loading the stored image itself.
  async function storedImageSize(): Promise<{ width: number; height: number } | null> {
    const source = await storedImageAddress();
    if (!source) return null;
    return page.evaluate(
      (src) =>
        new Promise<{ width: number; height: number } | null>((resolve) => {
          const image = new Image();
          image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
          image.onerror = () => resolve(null);
          image.src = src;
        }),
      source,
    );
  }

  const fileImagePicker: S.FileImagePickerPage = {
    ...at("/users/me"),
    chooseImage: (input) => chooseImage("file-image-picker.choose_image", input),
    imageAddress: () => storedImageAddress(),
    storedImageWidth: async () => {
      const size = await storedImageSize();
      return size ? String(size.width) : "";
    },
    storedImageHeight: async () => {
      const size = await storedImageSize();
      return size ? String(size.height) : "";
    },
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
    // An uploaded image goes into the text as a reference to the address it is kept at.
    async imageAddress() {
      const inText = /\/api\/files\/[^\s)"'\]]+/.exec(await fieldValue(["Body"]));
      return inText ? inText[0] : storedImageAddress();
    },
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
    scheduledTransitionTrigger,
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
    userProfileSelf,
    userProfileSelfCapabilities,
    userProfileSelfNotifications,
    userProfileSelfLegal,
    organizationUserMembershipsSelf,
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
  };
}
