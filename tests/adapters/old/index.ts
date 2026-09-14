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
import { uploadFile } from "../../fixtures/upload";

type Scope = Page | Locator;

// Two ways an observation can come up with nothing, and they are not the same answer.
// When the page loaded and simply shows nothing there — a label this programme's page does
// not carry, a panel with no evaluators, a refused upload that stored no file — the reader
// returns "" and the test decides what that emptiness means. Only when the place itself
// could not be reached (no record's screen to take an identifier from, no request made)
// does it throw this.
function nothing(reason: string): never {
  throw new Error(`unbound: ${reason}`);
}

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
        // Not unbound: the page exists, the caller did not say which record to open.
        throw new Error(
          `open() of ${route} was called without a value for ":${name}" (given: ${JSON.stringify(params ?? {})})`,
        );
      }
      return String(value);
    });
    return baseURL + filled;
  }

  // A save or a screen still fetching says "Loading..." where its control or its content
  // will be; nothing read or pressed before that goes away is what the page will show.
  async function settle(): Promise<void> {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
    await seen(page.getByText("Loading...", { exact: true }))
      .first()
      .waitFor({ state: "hidden", timeout: 30000 })
      .catch(() => undefined);
  }

  // A screen has rendered once its heading is up and nothing on it is still loading.
  async function ready(): Promise<void> {
    await settle();
    await seen(page.getByRole("heading"))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
  }

  async function notFoundShown(): Promise<boolean> {
    return (await seen(page.getByRole("heading", { name: "Not Found", exact: true })).count()) > 0;
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

  // Whether a pattern finds anything in a piece of text.
  function matches(pattern: RegExp, text: string): boolean {
    pattern.lastIndex = 0;
    return pattern.exec(text) !== null;
  }

  const LOOKS_LIKE_A_VALUE = /^(—|-|\$?\d[\d,.]*%?)$/;

  // A figure shown above its label, the way the reporting and summary panels read.
  async function statFor(labels: string[]): Promise<string> {
    const lines = await textLines();
    for (let i = 1; i < lines.length; i++) {
      if (labels.includes(lines[i]) && matches(LOOKS_LIKE_A_VALUE, lines[i - 1])) return lines[i - 1];
    }
    return valueBefore(labels);
  }

  async function findBefore(labels: string[]): Promise<string | null> {
    const lines = await textLines();
    for (let i = 1; i < lines.length; i++) if (labels.includes(lines[i])) return lines[i - 1];
    return null;
  }

  // A label the loaded page does not carry reads as nothing: another programme's page, or
  // a record this reader is not shown, has no such value to give.
  async function valueBefore(labels: string[]): Promise<string> {
    return (await findBefore(labels)) ?? "";
  }

  // A value shown under its label, the way the definition panels read.
  async function findAfter(labels: string[]): Promise<string | null> {
    const lines = await textLines();
    for (let i = 0; i < lines.length - 1; i++) if (labels.includes(lines[i])) return lines[i + 1];
    return null;
  }

  async function valueAfter(labels: string[]): Promise<string> {
    return (await findAfter(labels)) ?? "";
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
    return (await textLines()).filter((line) => matches(pattern, line)).join("\n");
  }

  // Everything above the numbered step list: the header a form carries about the thing
  // it belongs to.
  async function headerText(): Promise<string> {
    const lines = await textLines();
    const step = lines.findIndex((line) => matches(/^\d+\.\s/, line));
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
    const found = (await textLines()).filter((line) => !prose.has(line) && matches(MESSAGE, line));
    const picked = pattern ? found.filter((line) => matches(pattern, line)) : found;
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
  // A column or row the loaded list does not show reads as nothing.
  async function textUnder(rowName: string, header: string): Promise<string> {
    const cell = await cellUnder(rowName, header);
    if (!cell) return "";
    return (await cell.innerText()).trim();
  }

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

  // A control taken out of use is the page saying it is not ready — usually a required
  // field left empty. The anchors this application uses as buttons show it by leaving the
  // tab order with no address to go to; a real link that skips the tab order still leads
  // somewhere and is not disabled.
  async function isDisabled(control: Locator): Promise<boolean> {
    if (await control.isDisabled().catch(() => false)) return true;
    const ariaDisabled = await control.getAttribute("aria-disabled").catch(() => null);
    const tabIndex = await control.getAttribute("tabindex").catch(() => null);
    const href = await control.getAttribute("href").catch(() => null);
    return ariaDisabled === "true" || (tabIndex === "-1" && href === null);
  }

  // A disabled control is reported at once, with what the page is showing beside it,
  // rather than clicked until the test runs out of time.
  async function press(where: string, names: string[], scope: Scope = page): Promise<void> {
    for (const name of names) {
      const control = await findControl(scope, name);
      if (control) {
        if (await isDisabled(control)) {
          const shown = await messages().catch(() => "");
          throw new Error(
            `${where} — "${name}" is disabled on ${page.url()}; ${
              shown ? `the page shows: ${shown.replace(/\n/g, " | ")}` : "the page shows no message"
            }`,
          );
        }
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
      const control = await findControl(scope, name);
      if (control) return (await isDisabled(control)) ? "disabled" : "enabled";
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
    await ready();
    let toggle = await findControl(navBar(), "Actions");
    // The menu belongs to the record's own tab; the summary a record opens on has none.
    if (!toggle && (await enterTab(["Opportunity"]))) toggle = await findControl(navBar(), "Actions");
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

  // A screen's own tabs lead back to the same address with "?tab=" on it. The site-wide
  // links along the top are never tabs, even where one shares a tab's name
  // ("Organizations" on a profile), so a word the top bar also carries is not taken.
  async function findTab(label: string): Promise<Locator | null> {
    const links = seen(page.getByRole("link", { name: label, exact: true }));
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      if (href.includes("tab=")) return links.nth(i);
    }
    if (await seen(navBar().getByText(label, { exact: true })).count()) return null;
    const control = await findControl(page, label);
    if (!control) return null;
    const href = await control.getAttribute("href");
    return href === null || href.includes("tab=") ? control : null;
  }

  async function openTab(where: string, labels: string[]): Promise<void> {
    if (!(await enterTab(labels))) {
      throw new Error(`unbound: ${where} — no tab labelled ${quoted(labels)} on ${page.url()}`);
    }
  }

  // Whether this reader is offered the tab at all, opening it when so.
  async function enterTab(labels: string[]): Promise<boolean> {
    await ready();
    for (const label of labels) {
      const tab = await findTab(label);
      if (tab) {
        await tab.click();
        await ready();
        return true;
      }
    }
    return false;
  }

  // A withheld tab is how a test sees something being kept from somebody, so a reader of
  // one reads as nothing rather than failing.
  async function inTab(labels: string[], read: () => Promise<string>): Promise<string> {
    return (await enterTab(labels)) ? read() : "";
  }

  async function tabContent(labels: string[]): Promise<string> {
    return inTab(labels, contentText);
  }

  // The whole screen with only the standing footer taken off, the top bar's controls kept.
  async function screenText(): Promise<string> {
    const whole = await wholeText();
    const footer = whole.lastIndexOf("\nHome|");
    return (footer > 0 ? whole.slice(0, footer) : whole).trim();
  }

  // The long forms are wizards showing one numbered step at a time. The current step's
  // name opens a menu listing every step, so any step can be reached directly, wherever
  // an earlier action left the form.
  const STEP = /^\d+\.\s+\S/;

  async function currentStep(): Promise<Locator | null> {
    const shown = seen(page.getByText(STEP));
    return (await shown.count()) ? shown.first() : null;
  }

  async function chooseStep(pattern: RegExp): Promise<boolean> {
    const current = await currentStep();
    if (!current) return false;
    if (matches(pattern, (await current.innerText()).trim())) return true;
    await current.click();
    const choice = seen(page.getByText(pattern));
    const count = await choice.count();
    if (!count) {
      await page.keyboard.press("Escape").catch(() => undefined);
      return false;
    }
    await choice.nth(count - 1).click();
    await settle();
    return true;
  }

  async function goToStep(name: string): Promise<boolean> {
    await settle();
    return chooseStep(new RegExp(`^\\d+\\.\\s+${escapeRegExp(name)}$`, "i"));
  }

  async function advanceTo(where: string, marker: string, limit = 12): Promise<void> {
    await settle();
    if (await seen(page.getByText(marker, { exact: false })).count()) return;
    await chooseStep(/^1\.\s+\S/);
    for (let step = 0; step <= limit; step++) {
      if (await seen(page.getByText(marker, { exact: false })).count()) return;
      const next = await findControl(page, "Next");
      if (!next || (await isDisabled(next))) break;
      await next.click();
      await settle();
    }
    throw new Error(
      `unbound: ${where} — could not reach a step showing "${marker}" on ${page.url()}`,
    );
  }

  // ---------------------------------------------------------------- filling forms from input

  const escapeRegExp = (words: string): string => words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // A field's label as the form shows it, its required mark and "(Optional)" aside.
  function labelled(label: string): RegExp {
    return new RegExp(`^\\s*${escapeRegExp(label)}\\s*\\*?\\s*(\\(optional\\))?\\s*$`, "i");
  }

  const squash = (words: string): string => words.toLowerCase().replace(/[^a-z0-9]/g, "");

  // What a test calls a value, mapped to the label the form puts on its field. A key not
  // listed is looked for under its own words, so "costRecovery" finds "Cost Recovery" and
  // "legalName" finds "Legal Name". "#2" picks the second field carrying the same label.
  const FIELD_LABELS: Record<string, string[]> = {
    remoteok: ["Remote OK?"],
    remote: ["Remote OK?"],
    remotedesc: ["Remote Description"],
    reward: ["Fixed-Price Award"],
    skills: ["Required Skills", "Mandatory Skills"],
    description: ["Description", "Description and Contract Details"],
    deadline: ["Proposal Deadline"],
    assignmentdate: ["Assignment Date", "Contract Award Date"],
    awarddate: ["Contract Award Date", "Assignment Date"],
    startdate: ["Proposed Start Date", "Contract Start Date"],
    completiondate: ["Completion Date", "Contract Completion Date"],
    submissioninfo: ["Project Submission Info"],
    totalmaxbudget: ["Total Maximum Budget"],
    maxbudget: ["Maximum Budget", "Total Maximum Budget"],
    budget: ["Maximum Budget", "Total Maximum Budget"],
    minteammembers: ["Recommended Minimum Team Members"],
    minteamsize: ["Recommended Minimum Team Members"],
    proposaltext: ["Proposal"],
    comments: ["Additional Comments"],
    website: ["Website Url"],
    street: ["Street Address"],
    address: ["Street Address"],
    streetaddress1: ["Street Address"],
    addressline1: ["Street Address"],
    streetaddress2: ["Street Address#2"],
    addressline2: ["Street Address#2"],
    region: ["Province/State", "Province / State"],
    province: ["Province/State", "Province / State"],
    state: ["Province/State", "Province / State"],
    provincestate: ["Province/State", "Province / State"],
    mailcode: ["Postal / ZIP Code"],
    postalcode: ["Postal / ZIP Code"],
    postal: ["Postal / ZIP Code"],
    zip: ["Postal / ZIP Code"],
    zipcode: ["Postal / ZIP Code"],
    contacttitle: ["Job Title"],
    contactphone: ["Phone Number"],
    phone: ["Phone Number"],
    email: ["Email Address", "Contact Email"],
    name: ["Name", "Legal Name"],
    questiontext: ["Question"],
    guideline: ["Response Guidelines"],
    guidelines: ["Response Guidelines"],
    wordlimit: ["Response Word Limit"],
    maxscore: ["Score"],
    minscore: ["Minimum Score"],
    allocation: ["Resource Target Allocation"],
    targetallocation: ["Resource Target Allocation"],
    disqualificationreason: ["Reason"],
  };

  function labelsFor(key: string): string[] {
    const own = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
    return [...(FIELD_LABELS[squash(key)] ?? []), own];
  }

  type Entry = { key: string; value: unknown };

  // The values a test handed an action, one per field; a group of values given under one
  // name ({ address: { city, country } }) is entered field by field.
  function entriesOf(input: unknown, skip: string[] = []): Entry[] {
    if (!input || typeof input !== "object" || Array.isArray(input) || input instanceof Date) return [];
    const skipped = skip.map(squash);
    const found: Entry[] = [];
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      if (value === undefined || value === null || skipped.includes(squash(key))) continue;
      if (typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
        found.push(...entriesOf(value, skip));
      } else {
        found.push({ key, value });
      }
    }
    return found;
  }

  const isYesNo = (value: unknown): boolean =>
    typeof value === "boolean" || (typeof value === "string" && /^(yes|no|true|false)$/i.test(value));
  const saysYes = (value: unknown): boolean =>
    value === true || (typeof value === "string" && /^(yes|true|on|checked)$/i.test(value));

  async function pickOption(where: string, box: Locator, item: string): Promise<void> {
    await box.click();
    await box.fill(item).catch(() => page.keyboard.type(item));
    const exact = seen(page.getByRole("option", { name: item, exact: true }));
    const loose = seen(page.getByRole("option", { name: item, exact: false }));
    await loose.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    const option = (await exact.count()) ? exact.first() : (await loose.count()) ? loose.first() : null;
    if (!option) {
      await page.keyboard.press("Escape").catch(() => undefined);
      throw new Error(`unbound: ${where} — the chooser offers no option matching "${item}" on ${page.url()}`);
    }
    await option.click();
  }

  async function enterValue(where: string, entry: Entry, role: string, box: Locator): Promise<void> {
    if (role === "checkbox") {
      if ((await box.isChecked()) !== saysYes(entry.value)) await box.click();
      return;
    }
    if (role === "combobox") {
      const items = (Array.isArray(entry.value) ? entry.value : [entry.value]).map(asText).filter(Boolean);
      for (const item of items) await pickOption(where, box, item);
      return;
    }
    let text = asText(entry.value);
    if ((await box.getAttribute("type")) === "date") {
      const day = /^\d{4}-\d{2}-\d{2}/.exec(text);
      if (day) text = day[0];
    }
    if (await box.isDisabled()) {
      throw new Error(`${where} — the field for "${entry.key}" is disabled on ${page.url()}`);
    }
    await box.fill(text);
    await box.blur().catch(() => undefined);
  }

  async function setField(where: string, entry: Entry, scope: Scope, last: boolean): Promise<boolean> {
    for (const wanted of labelsFor(entry.key)) {
      const [label, position] = wanted.split("#");
      const name = labelled(label);
      for (const role of ["textbox", "spinbutton", "combobox", "checkbox"] as const) {
        const boxes = seen(scope.getByRole(role, { name }));
        const count = await boxes.count();
        if (!count) continue;
        const at = position ? Number(position) - 1 : last ? count - 1 : 0;
        if (at >= count) continue;
        await enterValue(where, entry, role, boxes.nth(at));
        return true;
      }
      // A yes-or-no question is a pair of radios under a plain label.
      if (isYesNo(entry.value) && (await seen(scope.getByText(name)).count())) {
        const radio = seen(
          scope.getByRole("radio", { name: saysYes(entry.value) ? "Yes" : "No", exact: true }),
        );
        if (await radio.count()) {
          await radio.first().check();
          return true;
        }
      }
    }
    // A choice of kind ("Individual" or "Organization") is one radio per option.
    if (/type|kind|proponent/i.test(entry.key) && !isYesNo(entry.value)) {
      const radio = seen(scope.getByRole("radio", { name: asText(entry.value), exact: false }));
      if (asText(entry.value) && (await radio.count())) {
        await radio.first().check();
        return true;
      }
    }
    return false;
  }

  // Enters every value the test gave before anything is pressed. On a wizard it walks the
  // steps from the first, entering each value where its field appears; a value that no
  // step has a field for is named, since dropping it would test a different form.
  async function fillForm(
    where: string,
    input: unknown,
    options: { scope?: Scope; last?: boolean; skip?: string[] } = {},
  ): Promise<void> {
    const pending = entriesOf(input, options.skip ?? []);
    if (!pending.length) return;
    // Answers to yes-or-no questions go first: they reveal the fields that follow them.
    pending.sort((a, b) => Number(isYesNo(b.value)) - Number(isYesNo(a.value)));
    const scope = options.scope ?? page;
    const wizard = options.scope === undefined && (await currentStep()) !== null;
    if (wizard) await chooseStep(/^1\.\s+\S/);
    for (let step = 0; step < 16 && pending.length; step++) {
      let progress = true;
      while (progress && pending.length) {
        progress = false;
        for (let i = 0; i < pending.length; i++) {
          if (await setField(where, pending[i], scope, options.last ?? false)) {
            pending.splice(i, 1);
            i--;
            progress = true;
          }
        }
      }
      if (!wizard || !pending.length) break;
      const next = await findControl(page, "Next");
      if (!next || (await isDisabled(next))) break;
      await next.click();
      await settle();
    }
    await settle();
    if (pending.length) {
      throw new Error(
        `unbound: ${where} — no field on ${page.url()} takes ${pending.map((entry) => `"${entry.key}"`).join(", ")}`,
      );
    }
  }

  async function chooseRadio(where: string, name: string): Promise<void> {
    const radio = seen(page.getByRole("radio", { name, exact: true }));
    if (!(await radio.count())) {
      throw new Error(`unbound: ${where} — no "${name}" option on ${page.url()}`);
    }
    await radio.first().check();
    await settle();
  }

  // A box that must end up ticked, whatever it was before.
  async function ensureTicked(where: string, labels: string[], scope: Scope): Promise<void> {
    for (const label of labels) {
      const box = seen(scope.getByRole("checkbox", { name: label, exact: false }));
      if (await box.count()) {
        if (!(await box.first().isChecked())) await box.first().click();
        await settle();
        return;
      }
    }
    throw new Error(`unbound: ${where} — no box labelled ${quoted(labels)} on ${page.url()}`);
  }

  // An edit ends when its save control leaves the top bar.
  async function saved(names: string[]): Promise<void> {
    for (const name of names) {
      await seen(navBar().getByText(name, { exact: true }))
        .first()
        .waitFor({ state: "hidden", timeout: 30000 })
        .catch(() => undefined);
    }
    await ready();
  }

  // A record's own address, once an action that creates it has landed there.
  function recordAddress(prefix: string): RegExp {
    return new RegExp(`^${prefix}/${UUID}`);
  }

  async function landOn(pattern: RegExp): Promise<void> {
    await page.waitForURL((url) => pattern.test(url.pathname), { timeout: 20000 }).catch(() => undefined);
    await ready();
  }

  const ATTACHMENT_KEYS = ["files", "attachments", "attachment", "file"];

  function hasFiles(input: unknown): boolean {
    if (!input || typeof input !== "object" || Array.isArray(input)) return false;
    return ATTACHMENT_KEYS.some((key) => (input as Record<string, unknown>)[key] !== undefined);
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

  // The evaluation and consensus lists name each proponent in a plain cell and put the way
  // in ("Edit", "View", "Start") as a link at the end of the same row.
  async function openRow(where: string, input: unknown): Promise<void> {
    const name = asText(input);
    const bodyRows = seen(page.getByRole("row")).filter({ has: page.getByRole("cell") });
    const rows = name ? bodyRows.filter({ hasText: name }) : bodyRows;
    if (!(await rows.count())) {
      nothing(`${where} — no proponent row${name ? ` for "${name}"` : ""} on ${page.url()}`);
    }
    const link = seen(rows.first().getByRole("link"));
    const count = await link.count();
    if (!count) nothing(`${where} — the row${name ? ` for "${name}"` : ""} offers no link on ${page.url()}`);
    await link.nth(count - 1).click();
    await settle();
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
    if (input instanceof Date) return input.toISOString();
    if (Array.isArray(input)) return input.map(asText).filter(Boolean).join(", ");
    const record = input as Record<string, unknown>;
    for (const key of [
      "value", "name", "text", "title", "label", "answer", "score", "id",
      "slug", "body", "reason", "email", "content", "query", "search",
    ]) {
      const found = record[key];
      if (typeof found === "string" || typeof found === "number") return String(found);
    }
    // Anything else carrying exactly one value means that value.
    const values = Object.values(record).filter(
      (value) => typeof value === "string" || typeof value === "number",
    );
    return values.length === 1 ? String(values[0]) : "";
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

  // A test names a file the way a person would ({ file: "scan0001.pdf", content?, bytes? }),
  // never by where it lives. The harness makes a real file under that name for the chooser.
  function filePaths(input: unknown): string[] {
    const one = (item: unknown): string | null => {
      if (typeof item === "string") return item ? uploadFile({ name: item }) : null;
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = ["file", "name", "fileName", "file_name", "attachment", "image"]
        .map((key) => record[key])
        .find((value): value is string => typeof value === "string" && value.length > 0);
      if (!name) return null;
      const content = record.content ?? record.contents;
      const bytes = record.bytes ?? record.size ?? record.sizeBytes;
      return uploadFile({
        name,
        content: typeof content === "string" || content instanceof Uint8Array ? content : undefined,
        bytes: typeof bytes === "number" ? bytes : undefined,
      });
    };
    const listed =
      input && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>).files
        : undefined;
    const items = Array.isArray(listed) ? listed : Array.isArray(input) ? input : [input];
    return items.map(one).filter((path): path is string => path !== null);
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
    if (!(await goToStep("Attachments")) || !(await findControl(page, "Add Attachment"))) {
      await advanceTo(where, "Add Attachment");
    }
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

  function fromAddress(pattern: string, what = "identifier"): string {
    const match = new RegExp(pattern).exec(new URL(page.url()).pathname);
    return match ? match[1] : nothing(`no ${what} in the address ${page.url()}`);
  }

  const opportunityId = (): string =>
    fromAddress(`^/opportunities/[a-z-]+/(${UUID})`, "opportunity identifier");
  const proposalId = (): string => fromAddress(`/proposals/(${UUID})`, "proposal identifier");
  const organizationId = (): string =>
    fromAddress(`^/organizations/(${UUID})`, "organization identifier");

  // "/users/me" keeps "me" in its address, so the tabs beside the profile are read
  // instead: each one leads to the same person under their own identifier.
  async function userId(): Promise<string> {
    const shown = new RegExp(`^/users/(${UUID})`).exec(new URL(page.url()).pathname);
    if (shown) return shown[1];
    const links = seen(page.getByRole("link"));
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      const match = new RegExp(`^/users/(${UUID})\\?tab=`).exec(href);
      if (match) return match[1];
    }
    return nothing(`no user identifier in the address or the profile tabs on ${page.url()}`);
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
    // The tab opened and lists nobody.
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
  // An answer must exist before it can be read; with no request made there is nothing.
  function answer(what: string): Answer {
    return lastAnswer ?? nothing(`${what} — no request has been made on this surface yet`);
  }

  // The body of a successful answer, field by field; a refusal carries no such field and
  // reads as nothing.
  function answeredField(what: string, key: string): string {
    const got = answer(what);
    if (got.status !== 200) return "";
    const value = answered()[key];
    if (value === undefined || value === null) return "";
    return String(value);
  }

  function refusal(isRefusal: (status: number) => boolean, about?: RegExp): string {
    const got = answer("refusal");
    if (!isRefusal(got.status)) return "";
    if (about && !matches(about, got.body)) return "";
    return `${got.status} ${got.body}`;
  }

  // ---------------------------------------------------------------- sign in and out

  type SignInEntry = { route?: string; username?: string; unavailable?: string };

  async function signIn(who: Persona): Promise<void> {
    const table = who.signIn as unknown as null | Record<string, SignInEntry>;
    if (!table) {
      // The anonymous visitor has no account; being signed out is the whole state.
      await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" });
      await settle();
      return;
    }
    // The session route mints a session for any account, a deactivated one included, so a
    // sign-in that exists to be refused has to go through the identity provider instead.
    if ((who.can as readonly string[]).some((can) => /sign in and be refused/i.test(can))) {
      await signInThroughIdentityProvider(who, table["sandbox-idp"], table["session-route"]?.route ?? "");
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

  async function signInThroughIdentityProvider(
    who: Persona,
    entry: SignInEntry | undefined,
    sessionRoute: string,
  ): Promise<void> {
    const where = `signIn.${who.id}`;
    if (!entry || entry.unavailable !== undefined || !entry.username) {
      throw new Error(`unbound: ${where} — ${entry?.unavailable ?? "this persona has no identity provider account"}`);
    }
    const password = process.env.SDLC_SANDBOX_PASSWORD;
    if (!password) {
      throw new Error(`unbound: ${where} — SDLC_SANDBOX_PASSWORD is not set, so there is no password to sign in with`);
    }
    await go("/sign-in");
    await press(where, [/vendor/i.test(sessionRoute) ? "Sign In Using GitHub" : "Sign In Using IDIR"]);
    const home = new URL(baseURL).origin;
    const reached = new URL(page.url());
    // The service answered by itself, without sending the browser anywhere.
    if (reached.origin === home) return;
    if (/(^|\.)github\.com$/i.test(reached.hostname)) {
      throw new Error(
        `unbound: ${where} — on this target "Sign In Using GitHub" goes to github.com itself, not to a sandbox identity provider, and the sandbox account "${entry.username}" is not an account there; the session route that does reach this persona mints a session even for a deactivated account, so the refusal cannot be exercised`,
      );
    }
    await page.getByLabel(/username/i).first().fill(entry.username);
    await page.getByLabel(/password/i).first().fill(password);
    await press(where, ["Sign In", "Sign in", "Log In", "Log in", "Continue"]);
    await page.waitForURL((url) => url.origin === home, { timeout: 30000 }).catch(() => undefined);
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
    // The dashboard's own table holds only the administrator's opportunities; its "View
    // all opportunities" leads to the full list, read with every group opened.
    async allOpportunitiesForAdministrator() {
      await ready();
      const all = await findControl(page, "View all opportunities");
      if (!all) return "";
      await all.click();
      await ready();
      const groups: string[] = [];
      for (const name of OPPORTUNITY_GROUPS) groups.push(await opportunityGroup(name));
      return groups.filter(Boolean).join("\n");
    },
    async emptyMyOpportunitiesMessage() {
      const body = await tabContent(["My Opportunities"]);
      return (await tableText()) ? "" : body;
    },
  };

  // The list groups opportunities under headers carrying their count. A group may be shown
  // folded, with only the header; it is opened by its header before its rows are read.
  const OPPORTUNITY_GROUPS = ["Unpublished Opportunities", "Open Opportunities", "Closed Opportunities"];

  async function opportunityGroup(name: string): Promise<string> {
    const isHeader = (line: string, group: string): boolean =>
      line === group || line.startsWith(`${group} `);
    const rows = async (): Promise<string[] | null> => {
      const lines = await textLines();
      const start = lines.findIndex((line) => isHeader(line, name));
      if (start < 0) return null;
      const body: string[] = [];
      for (let i = start + 1; i < lines.length; i++) {
        if (OPPORTUNITY_GROUPS.some((group) => isHeader(lines[i], group))) break;
        body.push(lines[i]);
      }
      if (body.length && matches(/^\d+$/, body[0])) body.shift();
      return body;
    };
    await ready();
    let body = await rows();
    // This reader is shown no such group at all.
    if (body === null) return "";
    if (!body.length) {
      const header = seen(page.getByText(new RegExp(`^${escapeRegExp(name)}`)));
      const count = await header.count();
      if (count) {
        await header.nth(count - 1).click();
        await settle();
        body = (await rows()) ?? [];
      }
    }
    return body.join("\n");
  }

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
    unpublishedGroup: () => opportunityGroup("Unpublished Opportunities"),
    openGroup: () => opportunityGroup("Open Opportunities"),
    closedGroup: () => opportunityGroup("Closed Opportunities"),
    async opportunityStatus() {
      const lines = await textLines();
      const start = lines.findIndex((line) => matches(/Opportunities$/, line));
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
  // top navigation. Each action enters every value it was given before pressing anything.
  function opportunityCreate(where: string, route: string) {
    async function enter(member: string, input: unknown): Promise<void> {
      await ready();
      await fillForm(`${where}.${member}`, input, { skip: ATTACHMENT_KEYS });
      if (hasFiles(input)) await addAttachment(`${where}.${member}`, input);
    }
    // A control this person is not offered at all is the refusal the test goes on to
    // read, so its absence ends the action quietly. A control offered but disabled is
    // reported by press() instead.
    const offered = async (name: string): Promise<boolean> =>
      (await findControl(navBar(), name)) !== null;
    const record = () => recordAddress("/opportunities/[a-z-]+");
    return {
      ...at(route),
      saveDraft: async (input?: unknown) => {
        await enter("save_draft", input);
        await press(`${where}.save_draft`, ["Save Draft"], navBar());
        await landOn(record());
      },
      submitForReview: async (input?: unknown) => {
        await enter("submit_for_review", input);
        if (!(await offered("Submit for Review"))) return;
        await press(`${where}.submit_for_review`, ["Submit for Review"], navBar());
        await confirmIfAsked(`${where}.submit_for_review`, [
          "Submit for Review",
          "Submit Opportunity",
        ]);
        await landOn(record());
      },
      publish: async (input?: unknown) => {
        await enter("publish", input);
        if (!(await offered("Publish"))) return;
        await press(`${where}.publish`, ["Publish"], navBar());
        await confirmIfAsked(`${where}.publish`, ["Publish Opportunity", "Publish"]);
        await landOn(record());
      },
      fieldError: () => messages(),
    };
  }

  // A question is added at the end of its step, and its fields are the last ones there.
  async function addQuestion(where: string, step: string, input: unknown): Promise<void> {
    if (!(await goToStep(step))) await advanceTo(where, "Add Question");
    await press(where, ["Add Question"]);
    await fillForm(where, input, { scope: page, last: true });
  }

  const opportunityCwuCreate: S.OpportunityCwuCreatePage = {
    ...opportunityCreate("opportunity-cwu-create", "/opportunities/code-with-us/create"),
    addAttachment: (input) => addAttachment("opportunity-cwu-create.add_attachment", input),
  };

  const opportunitySwuCreate: S.OpportunitySwuCreatePage = {
    ...opportunityCreate("opportunity-swu-create", "/opportunities/sprint-with-us/create"),
    addPhase: async (input) => {
      const where = "opportunity-swu-create.add_phase";
      if (!(await goToStep("Phases"))) await advanceTo(where, "Which phase do you want to start with?");
      const phaseKeys = ["phase", "startingPhase", "name"];
      await choose(
        where,
        ["Which phase do you want to start with?", "Select Phase"],
        field(input, ...phaseKeys) || asText(input),
      );
      await fillForm(where, input, { scope: page, skip: phaseKeys });
    },
    addTeamQuestion: (input) =>
      addQuestion("opportunity-swu-create.add_team_question", "Team Questions", input),
    setEvaluationPanel: (input) =>
      setEvaluationPanel("opportunity-swu-create.set_evaluation_panel", input),
    scoreWeightError: () => messages(/100%|weight/i),
  };

  const opportunityTwuCreate: S.OpportunityTwuCreatePage = {
    ...opportunityCreate("opportunity-twu-create", "/opportunities/team-with-us/create"),
    addResource: async (input) => {
      const where = "opportunity-twu-create.add_resource";
      if (!(await goToStep("Resource Details"))) await advanceTo(where, "Add a Resource");
      await press(where, ["Add a Resource"]);
      await fillForm(where, input, { scope: page, last: true });
    },
    addResourceQuestion: (input) =>
      addQuestion("opportunity-twu-create.add_resource_question", "Resource Questions", input),
    setEvaluationPanel: (input) =>
      setEvaluationPanel("opportunity-twu-create.set_evaluation_panel", input),
    scoreWeightError: () => messages(/100%|weight/i),
  };

  // The panel is a list of evaluator slots plus a chair. More slots are added one at a
  // time, and each slot picks a public sector person by name. On the creation forms the
  // panel is its own step, reached directly wherever the form was left.
  async function setEvaluationPanel(where: string, input: unknown): Promise<void> {
    const record =
      input && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};
    const members = asList(
      record.members ?? record.evaluators ?? (typeof input === "string" || Array.isArray(input) ? input : undefined),
    );
    const chair = field(input, "chair");
    if (!(await goToStep("Evaluation Panel"))) await advanceTo(where, "Panel Member");
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
    if (chair) await makeChair(where, chair);
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
      // Team With Us calls its deadline the "Closing Date".
      proposalDeadline: () =>
        valueBefore(["Proposal Deadline", "Proposals Deadline", "Closing Date"]),
      addenda: () => tabContent(["Addenda"]),
      successfulProponent: async () => {
        const named = await findAfter(["Successful Proponent", "Awarded To"]);
        return named || linesMatching(/successful proponent/i);
      },
    };
  }

  // All three programmes label their money "Value", so a programme's figure is read only
  // from a page whose badge names that programme. Another programme's page, or the
  // "Not Found" screen a withheld record shows, has no such figure and reads as nothing.
  async function programmeValue(programme: string, labels: string[]): Promise<string> {
    if (!(await textLines()).includes(programme)) return "";
    return valueBefore(labels);
  }

  const opportunityCwuView: S.OpportunityCwuViewPage = {
    ...opportunityView(
      "opportunity-cwu-view",
      "/opportunities/code-with-us/:opportunityId",
      "Code With Us",
    ),
    reward: () => programmeValue("Code With Us", ["Value", "Fixed-Price Award", "Reward"]),
  };

  const opportunitySwuView: S.OpportunitySwuViewPage = {
    ...opportunityView(
      "opportunity-swu-view",
      "/opportunities/sprint-with-us/:opportunityId",
      "Sprint With Us",
    ),
    totalMaxBudget: () =>
      programmeValue("Sprint With Us", ["Total Maximum Budget", "Maximum Budget", "Value"]),
    phases: () => sectionFrom(["Phases of Work", "Phases"], ["Addenda", "Attachments"]),
  };

  const opportunityTwuView: S.OpportunityTwuViewPage = {
    ...opportunityView(
      "opportunity-twu-view",
      "/opportunities/team-with-us/:opportunityId",
      "Team With Us",
    ),
    maxBudget: () =>
      programmeValue("Team With Us", ["Maximum Contract Value", "Maximum Budget", "Value"]),
    // The resources sought are listed under "Service Areas" with their allocation.
    resources: () => sectionFrom(["Service Areas"], ["Required Skills", "Addenda"]),
  };

  // The management pages share a sidebar of tabs and an Actions menu.
  function opportunityEdit(where: string, route: string) {
    return {
      ...at(route),
      // Editing reopens the creation wizard in place; what the test gave is entered and
      // saved with the control the top bar offers for this opportunity's state.
      editDetails: async (input?: unknown) => {
        await fromActions(`${where}.edit_details`, ["Edit"]);
        await settle();
        if (!entriesOf(input, ATTACHMENT_KEYS).length && !hasFiles(input)) return;
        await fillForm(`${where}.edit_details`, input, { skip: ATTACHMENT_KEYS });
        if (hasFiles(input)) await addAttachment(`${where}.edit_details`, input);
        const saves = ["Publish Changes", "Save Changes", "Submit Changes for Review", "Save Draft"];
        await press(`${where}.edit_details`, saves, navBar());
        await confirmIfAsked(`${where}.edit_details`, saves);
        await saved(saves);
      },
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
    reportingViews: () => reportFigure(["Total Views", "Views"]),
    reportingWatchers: () => reportFigure(["Watching", "Watchers"]),
    reportingProposals: () => reportFigure(["Proposals"]),
  };

  // Each reporting figure sits in a card of its own, the number beside the words naming
  // it. A reader not offered the Opportunity tab is shown no figures at all.
  async function reportFigure(labels: string[]): Promise<string> {
    if (!(await enterTab(["Opportunity"]))) return "";
    for (const label of labels) {
      const card = seen(
        page.getByText(new RegExp(`^\\s*\\$?\\d[\\d,.]*\\s*${escapeRegExp(label)}\\s*$`)),
      );
      const count = await card.count();
      if (!count) continue;
      const figure = /\$?\d[\d,.]*/.exec(await card.nth(count - 1).innerText());
      if (figure) return figure[0];
    }
    return statFor(labels);
  }

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
      const got = await ask("scheduled-transition-trigger.service_is_up", baseURL + "/status");
      return got.status === 200 ? got.body.trim() : "";
    },
  };

  // ================================================================ proposals

  // Submitting raises a terms dialog that must be agreed to before it will go through.
  // The top bar's "Submit" stays disabled until the proposal is complete; press() reports
  // that at once rather than waiting on it.
  async function openTermsDialog(where: string): Promise<void> {
    if (await dialog().count()) return;
    await press(where, ["Submit", "Submit Proposal"], navBar());
    await dialog().first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) {
      throw new Error(`unbound: ${where} — submitting raised no terms dialog on ${page.url()}`);
    }
  }

  function proposalCreate(where: string, route: string, programme: string) {
    // The form sits behind the terms dialog once that is open, so values still to be
    // entered close it first; the submit that follows opens it again.
    async function enter(member: string, input: unknown): Promise<void> {
      if (!entriesOf(input, ATTACHMENT_KEYS).length && !hasFiles(input)) return;
      if (await dialog().count()) await inDialog(`${where}.${member}`, ["Cancel"]);
      await ready();
      await fillForm(`${where}.${member}`, input, { skip: ATTACHMENT_KEYS });
      if (hasFiles(input)) await addAttachment(`${where}.${member}`, input);
    }
    const record = () => recordAddress("/opportunities/[a-z-]+/[^/]+/proposals");
    return {
      ...at(route),
      addAttachment: (input: unknown) => addAttachment(`${where}.add_attachment`, input),
      saveDraft: async (input?: unknown) => {
        await enter("save_draft", input);
        await press(`${where}.save_draft`, ["Save Draft"], navBar());
        await landOn(record());
      },
      submitProposal: async (input?: unknown) => {
        await enter("submit_proposal", input);
        await openTermsDialog(`${where}.submit_proposal`);
        await inDialog(`${where}.submit_proposal`, ["Submit Proposal", "Submit"]);
        await landOn(record());
      },
      acceptProgramTerms: async (input?: unknown) => {
        await enter("accept_program_terms", input);
        await openTermsDialog(`${where}.accept_program_terms`);
        await ensureTicked(
          `${where}.accept_program_terms`,
          [`agree to the ${programme} Terms & Conditions`],
          dialog().first(),
        );
      },
      acceptAppTerms: async (input?: unknown) => {
        await enter("accept_app_terms", input);
        await openTermsDialog(`${where}.accept_app_terms`);
        await ensureTicked(
          `${where}.accept_app_terms`,
          ["Digital Marketplace Terms & Conditions for E-Bidding"],
          dialog().first(),
        );
      },
      fieldError: () => messages(),
    };
  }

  // Disqualifying asks for the reason in a dialog whose confirmation stays disabled until
  // one is typed.
  async function disqualify(where: string, input: unknown): Promise<void> {
    await ready();
    await press(where, ["Disqualify", "Disqualify Proposal"]);
    await dialog().first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) return;
    const reason = field(input, "reason", "disqualificationReason", "text") || asText(input);
    const box = seen(dialog().first().getByRole("textbox", { name: labelled("Reason") }));
    if (reason && (await box.count())) await box.first().fill(reason);
    await press(where, ["Disqualify", "Disqualify Proposal"], dialog().first());
  }

  const proposalCwuCreate: S.ProposalCwuCreatePage = {
    ...proposalCreate(
      "proposal-cwu-create",
      "/opportunities/code-with-us/:opportunityId/proposals/create",
      "Code With Us",
    ),
    // Choosing to answer as an individual opens the individual's own details on the same
    // step, and those are entered from the input.
    chooseProponentIndividual: async (input) => {
      const where = "proposal-cwu-create.choose_proponent_individual";
      await ready();
      await goToStep("Proponent");
      await chooseRadio(where, "Individual");
      await fillForm(where, input, { scope: page });
    },
    chooseProponentOrganization: async (input) => {
      const where = "proposal-cwu-create.choose_proponent_organization";
      await ready();
      await goToStep("Proponent");
      await chooseRadio(where, "Organization");
      const name = field(input, "organization", "organizationName", "legalName", "name") || asText(input);
      if (name) await choose(where, ["Organization"], name);
    },
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
      proposalTab: () => tabContent(["Proposal Details", "Proposal"]),
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
      const shown = await findAfter(["Submitted On", "Submitted At", "Submitted"]);
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
    disqualifyProposal: (input) => disqualify("proposal-cwu-view.disqualify_proposal", input),
    proposalTab: () => tabContent(["Proposal Details", "Proposal"]),
    historyTab: () => tabContent(["Proposal History", "History"]),
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
    disqualifyProposal: (input) => disqualify("proposal-swu-view.disqualify_proposal", input),
    proposalTab: () => tabContent(["Proposal Details", "Proposal"]),
    teamQuestionsTab: () => tabContent(["Team Questions", "Team Questions (Eval)"]),
    codeChallengeTab: () => tabContent(["Code Challenge"]),
    teamScenarioTab: () => tabContent(["Team Scenario"]),
    historyTab: () => tabContent(["Proposal History", "History"]),
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
    disqualifyProposal: (input) => disqualify("proposal-twu-view.disqualify_proposal", input),
    proposalTab: () => tabContent(["Proposal Details", "Proposal"]),
    resourceQuestionsTab: () => tabContent(["Resource Questions", "Resource Questions (Eval)"]),
    challengeTab: () => tabContent(["Interview/Challenge", "Challenge"]),
    historyTab: () => tabContent(["Proposal History", "History"]),
    wrongStageError: () => messages(/stage|not yet|cannot/i),
    questionsScore: () => statFor(["Resource Questions", "Questions Score"]),
    challengeScore: () => statFor(["Interview/Challenge", "Challenge", "Challenge Score"]),
    priceScore: () => statFor(["Price", "Price Score"]),
    totalScore: () => statFor(["Total Score"]),
  };

  // A withheld export answers with the "Not Found" screen, which is no exported document.
  async function exported(): Promise<string> {
    await ready();
    return (await notFoundShown()) ? "" : contentText();
  }

  const proposalCwuExportOne: S.ProposalCwuExportOnePage = {
    ...at("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export"),
    exportedProposal: exported,
  };
  const proposalCwuExportAll: S.ProposalCwuExportAllPage = {
    ...at("/opportunities/code-with-us/:opportunityId/proposals/export"),
    exportedProposal: exported,
  };
  const proposalSwuExportOne: S.ProposalSwuExportOnePage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export"),
    exportedProposal: exported,
    anonymousProponentName: () => anonymousProponent(),
  };
  const proposalSwuExportAll: S.ProposalSwuExportAllPage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/proposals/export"),
    exportedProposal: exported,
  };
  const proposalTwuExportOne: S.ProposalTwuExportOnePage = {
    ...at("/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export"),
    exportedProposal: exported,
  };
  const proposalTwuExportAll: S.ProposalTwuExportAllPage = {
    ...at("/opportunities/team-with-us/:opportunityId/proposals/export"),
    exportedProposal: exported,
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
    // The public list heads the column "Organization Name"; a profile's Organizations tab,
    // where "My Organizations" leads, heads it "Legal Name".
    organizationName: () => columnValues(["Organization Name", "Legal Name"]),
    ownerName: () => textUnder("", "Owner"),
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

  // Every value in a column, in the order the page lists them, across every table
  // carrying that column.
  async function columnValues(headers: string[]): Promise<string> {
    await ready();
    const wanted = headers.map((title) => title.trim().toLowerCase());
    const values: string[] = [];
    const tables = seen(page.getByRole("table"));
    const tableCount = await tables.count();
    for (let t = 0; t < tableCount; t++) {
      const table = tables.nth(t);
      const titles = (await table.getByRole("columnheader").allInnerTexts()).map((title) =>
        title.trim().toLowerCase(),
      );
      const column = titles.findIndex((title) => wanted.includes(title));
      if (column < 0) continue;
      const rows = table.getByRole("row");
      const rowCount = await rows.count();
      for (let r = 0; r < rowCount; r++) {
        const cells = rows.nth(r).getByRole("cell");
        if (column < (await cells.count())) values.push((await cells.nth(column).innerText()).trim());
      }
    }
    return values.filter(Boolean).join("\n");
  }

  // A picture handed to a form action alongside its other values.
  const LOGO_KEYS = ["logo", "image", "avatar", "picture"];
  const pictureOf = (input: unknown): unknown =>
    input && typeof input === "object" && !Array.isArray(input)
      ? LOGO_KEYS.map((key) => (input as Record<string, unknown>)[key]).find((value) => value !== undefined)
      : undefined;

  const organizationCreate: S.OrganizationCreatePage = {
    ...at("/organizations/create"),
    createOrganization: async (input) => {
      const where = "organization-create.create_organization";
      await ready();
      // Public sector staff and administrators are shown "Not Found" here, with no form and
      // no control: that refusal is what the test reads next, so nothing is attempted.
      if ((await notFoundShown()) || !(await findControl(navBar(), "Create Organization"))) return;
      await fillForm(where, input, { skip: LOGO_KEYS });
      const picture = pictureOf(input);
      if (picture !== undefined) await chooseImage(where, picture);
      await press(where, ["Create Organization"], navBar());
      await landOn(recordAddress("/organizations"));
    },
    cancel: () => press("organization-create.cancel", ["Cancel"], navBar()),
    changeLogo: (input) => chooseImage("organization-create.change_logo", input),
    fieldError: () => messages(),
    submitDisabledUntilValid: () => controlState(["Create Organization"], navBar()),
  };

  async function chooseImage(where: string, input: unknown): Promise<void> {
    const files = filePaths(input);
    if (!files.length) throw new Error(`unbound: ${where} — no image file was named`);
    await ready();
    const control = await findControl(page, "Choose Image");
    if (!control) {
      throw new Error(`unbound: ${where} — no "Choose Image" control on ${page.url()}`);
    }
    const chooser = page.waitForEvent("filechooser");
    await control.click();
    await (await chooser).setFiles(files);
    // The chooser has taken the file once its preview stands in for the picture. A file
    // the form refuses shows no preview, and that is left for the test to read.
    for (let wait = 0; wait < 20; wait++) {
      if ((await pictures()).some((source) => /^(blob|data):/.test(source))) break;
      await page.waitForTimeout(250);
    }
    await settle();
  }

  const organizationEdit: S.OrganizationEditPage = {
    ...at("/organizations/:orgId/edit"),
    editOrganization: async (input) => {
      const where = "organization-edit.edit_organization";
      await ready();
      if (!(await findControl(navBar(), "Edit Organization"))) await enterTab(["Organization"]);
      await press(where, ["Edit Organization"], navBar());
      await fillForm(where, input, { skip: LOGO_KEYS });
      const picture = pictureOf(input);
      if (picture !== undefined) await chooseImage(where, picture);
    },
    saveChanges: async (input) => {
      const where = "organization-edit.save_changes";
      await settle();
      await fillForm(where, input, { skip: LOGO_KEYS });
      const picture = pictureOf(input);
      if (picture !== undefined) await chooseImage(where, picture);
      await press(where, ["Save Changes"], navBar());
      await saved(["Save Changes"]);
    },
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
    // Each of these sits on a tab an ordinary member or an outsider is not offered; for
    // them the tab's absence is the answer, and it reads as nothing.
    ownerBadge: () => inTab(["Team"], () => linesMatching(/\bOwner\b/)),
    pendingBadge: () => inTab(["Team"], () => linesMatching(/\bPending\b/)),
    teamMemberRow: () => inTab(["Team"], tableText),
    teamCapabilities: () => inTab(["Team"], () => sectionFrom(["Team Capabilities"])),
    swuRequirementTwoMembers: () =>
      inTab(["SWU Qualification"], () => linesMatching(/two team members/i)),
    swuRequirementAllCapabilities: () =>
      inTab(["SWU Qualification"], () => linesMatching(/all capabilities/i)),
    swuRequirementTermsAccepted: () =>
      inTab(["SWU Qualification"], () =>
        linesMatching(/agreed to the sprint with us|agreed to sprint with us/i),
      ),
    twuRequirementServiceArea: () =>
      inTab(["TWU Qualification"], () => linesMatching(/service area/i)),
    twuRequirementTermsAccepted: () =>
      inTab(["TWU Qualification"], () =>
        linesMatching(/agreed to the team with us|agreed to team with us/i),
      ),
    serviceAreaCheckbox: () =>
      inTab(["TWU Qualification"], () => sectionFrom(["Service Areas"], ["Terms & Conditions"])),
    notQualifiedNotice: () => linesMatching(/not qualified/i),
    changelogEntry: () => inTab(["Changelog"], tableText),
    fieldError: () => messages(),
    organizationIdentifier: async () => organizationId(),
    // The latest refusal, whole, when the invitation was refused; otherwise whatever
    // messages the screen is showing.
    async invalidMembershipTypeError() {
      // An invitation made through the Team dialog sends no request of ours to read.
      return (lastAnswer ? refusal((status) => status >= 400) : "") || messages();
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
      teamMemberCount: () => textUnder("", "Team Members"),
      swuQualifiedMark: () => markUnder("", "SWU Qualified?"),
      async emptyOwnedMessage() {
        const owned = await sectionFrom(["Owned Organizations"], ["Affiliated Organizations"]);
        return matches(/^you do not own/i, owned) ? owned : "";
      },
      async emptyAffiliatedMessage() {
        const affiliated = await sectionFrom(["Affiliated Organizations"]);
        return matches(/^you are not affiliated/i, affiliated) ? affiliated : "";
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
    // Something to read only while Export cannot be pressed; once it can, nothing.
    exportDisabledUntilSelection: async () => {
      if (!(await dialog().count())) {
        nothing(`user-list.export_disabled_until_selection — the export dialog is not open on ${page.url()}`);
      }
      const control = await findControl(dialog().first(), "Export");
      return control && (await isDisabled(control)) ? "disabled" : "";
    },
  };

  // The profile screen, reached under a person's identifier or as the signed-in "me".
  function profile(where: string, route: string) {
    return {
      ...at(route),
      editProfile: async () => {
        await ready();
        await press(`${where}.edit_profile`, ["Edit Profile"], navBar());
      },
      // What the test gave is typed into the profile before saving, putting the profile
      // into editing first when it is not already.
      saveChanges: async (input?: unknown) => {
        await ready();
        const picture = pictureOf(input);
        if (entriesOf(input, LOGO_KEYS).length || picture !== undefined) {
          const name = seen(page.getByRole("textbox", { name: labelled("Name") }));
          if (!(await name.count()) || (await name.first().isDisabled())) {
            const edit = await findControl(navBar(), "Edit Profile");
            if (edit) {
              await edit.click();
              await settle();
            }
          }
          await fillForm(`${where}.save_changes`, input, { skip: LOGO_KEYS });
          if (picture !== undefined) await chooseImage(`${where}.save_changes`, picture);
        }
        await press(`${where}.save_changes`, ["Save Changes"], navBar());
        await saved(["Save Changes"]);
      },
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
      // An administrator looking at somebody else's account is shown the profile with no
      // tab strip at all; that screen, with its top-bar controls, is the profile tab.
      profileTab: async () => {
        await ready();
        if (await notFoundShown()) return "";
        await enterTab(["Profile"]);
        return screenText();
      },
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
    // Only the "Not Found" screen reads as anything; a profile shown reads as nothing.
    notFoundPage: async () => {
      await ready();
      return (await notFoundShown()) ? contentText() : "";
    },
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
    // Read-only, the profile shows the value as plain words under its label.
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

  // The panel tab shows each evaluator as "Evaluator N", a "Panel Member*" chooser showing
  // who is picked, and a "Panel Chair" box. It is read-only until "Edit" in the top bar is
  // pressed, which is what an owner or administrator does before changing it.
  async function editingPanel(where: string): Promise<void> {
    if (await seen(page.getByRole("combobox", { name: "Panel Member", exact: false })).count()) return;
    const edit = await findControl(navBar(), "Edit");
    if (!edit) nothing(`${where} — the evaluation panel is not editable and offers no "Edit" on ${page.url()}`);
    await edit.click();
    await settle();
  }

  // The evaluators in order, each with who is picked and whether they chair. A page that
  // shows no evaluators — as it does to a vendor or to staff with no part in the
  // opportunity — gives an empty list, and the readers built on it read as nothing.
  async function panelMembers(): Promise<{ name: string; chair: boolean }[]> {
    const lines = await textLines();
    const names: string[] = [];
    for (let i = 0; i < lines.length - 1; i++) {
      if (matches(/^Panel Member\*?$/, lines[i])) names.push(lines[i + 1]);
    }
    const boxes = seen(page.getByRole("checkbox", { name: "Panel Chair", exact: true }));
    const count = await boxes.count();
    const members: { name: string; chair: boolean }[] = [];
    for (let i = 0; i < Math.max(names.length, count); i++) {
      members.push({
        name: names[i] ?? "",
        chair: i < count ? await boxes.nth(i).isChecked() : false,
      });
    }
    return members;
  }

  async function chairBox(where: string, input: unknown): Promise<Locator> {
    const boxes = seen(page.getByRole("checkbox", { name: "Panel Chair", exact: true }));
    const count = await boxes.count();
    if (!count) nothing(`${where} — no "Panel Chair" box on ${page.url()}`);
    const name = field(input, "member", "user", "name", "email") || (typeof input === "string" ? input : "");
    if (name) {
      const members = await panelMembers();
      const at = members.findIndex((member) => member.name.toLowerCase().includes(name.toLowerCase()));
      if (at < 0 || at >= count) nothing(`${where} — no evaluator matching "${name}" on ${page.url()}`);
      return boxes.nth(at);
    }
    return boxes.nth(Math.min(indexOf(input), count - 1));
  }

  async function makeChair(where: string, input: unknown): Promise<void> {
    await editingPanel(where);
    const box = await chairBox(where, input);
    if (!(await box.isChecked())) await box.click();
    await settle();
  }

  function evaluationPanel(where: string, route: string) {
    return {
      ...at(route),
      addPanelMember: async (input: unknown) => {
        await editingPanel(`${where}.add_panel_member`);
        await setEvaluationPanel(`${where}.add_panel_member`, input);
      },
      removePanelMember: async () => {
        await editingPanel(`${where}.remove_panel_member`);
        await press(`${where}.remove_panel_member`, ["Remove this evaluator", "Remove"]);
      },
      choosePanelChair: (input: unknown) => makeChair(`${where}.choose_panel_chair`, input),
      markMemberAsChair: (input: unknown) => makeChair(`${where}.mark_member_as_chair`, input),
      saveEvaluationPanel: () =>
        press(`${where}.save_evaluation_panel`, ["Save Changes", "Save"], navBar()),
      panelMemberRow: async () =>
        (await panelMembers())
          .map((member) => `${member.name}${member.chair ? " (Panel Chair)" : ""}`)
          .join("\n"),
      // Who chairs, by the name the chooser shows; nobody ticked reads as nobody.
      chairField: async () =>
        (await panelMembers())
          .filter((member) => member.chair)
          .map((member) => member.name)
          .join("\n"),
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
        openRow(`${where}.open_proponent_evaluation`, input),
      submitScoresForConsensus: async () => {
        await press(`${where}.submit_scores_for_consensus`, [
          "Submit Scores for Consensus",
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
        controlState(["Submit Scores for Consensus", "Submit for Consensus", "Submit Scores"]),
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
        openRow(`${where}.open_proponent_consensus`, input),
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

  // The score sheet shows its form only when the address names the questions tab
  // ("?tab=teamQuestions" or "?tab=resourceQuestions"); without it the route renders the
  // proposal's details instead. Each question carries an "Evaluator Notes" box and a
  // "Score" field, in question order, so a question is picked by its position.
  function scoreSheet(where: string, route: string) {
    const tab = route.includes("/team-questions/") ? "teamQuestions" : "resourceQuestions";
    // A saved sheet shows its boxes disabled until "Edit" in the top bar is pressed. The
    // consensus sheet leaves its boxes unlabelled: one number box and one text box per
    // question, under "Consensus Score", so there they are taken by kind and position.
    async function enter(member: string, labels: string[], input: unknown): Promise<void> {
      const kind = labels.includes("Score") ? "spinbutton" : "textbox";
      const value =
        field(input, kind === "spinbutton" ? "score" : "notes", "value") || asText(input);
      const which = indexOf(input) || Math.max(0, Number.parseInt(field(input, "question"), 10) - 1 || 0);
      let boxes: Locator | null = null;
      for (const label of labels) {
        const named = seen(page.getByRole(kind, { name: label, exact: false }));
        if (await named.count()) {
          boxes = named;
          break;
        }
      }
      if (!boxes && (await seen(page.getByText("Consensus Score", { exact: true })).count())) {
        boxes = seen(page.getByRole("main").getByRole(kind));
      }
      const count = boxes ? await boxes.count() : 0;
      if (boxes && count) {
        const box = boxes.nth(Math.min(which, count - 1));
        if (await box.isDisabled()) {
          const edit = await findControl(navBar(), "Edit");
          if (edit) {
            await edit.click();
            await settle();
          }
        }
        await box.fill(value);
        await box.blur().catch(() => undefined);
        await settle();
        return;
      }
      throw new Error(
        `unbound: ${where}.${member} — no field labelled ${quoted(labels)} on ${page.url()}`,
      );
    }
    return {
      open: (params?: Record<string, string>) => go(`${route}?tab=${tab}`, params),
      enterQuestionScore: (input: unknown) => enter("enter_question_score", ["Score"], input),
      enterQuestionNotes: (input: unknown) =>
        enter("enter_question_notes", ["Evaluator Notes", "Notes"], input),
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
    notifyVendorsSuccess: () => alertLines(/notified/i),
    notifyVendorsFailure: () => alertLines(/unable|failed/i),
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
    if (matches(/^https?:\/\//, href)) {
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
      ((await slaLink().count()) ? await slaLink().first().getAttribute("href") : null) ?? "",
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
    pageCreatedDate: () => textUnder("", "Created"),
    pageUpdatedDate: () => textUnder("", "Updated"),
    orderedByTitle: () => tableText(),
    refusedForNonAdministrator: () => contentText(),
  };

  const contentCreate: S.ContentCreatePage = {
    ...at("/content/create"),
    enterTitle: (input) =>
      fill("content-create.enter_title", ["Title"], field(input, "title") || asText(input)),
    enterSlug: (input) =>
      fill("content-create.enter_slug", ["Slug"], field(input, "slug") || asText(input)),
    enterBody: (input) =>
      fill("content-create.enter_body", ["Body"], field(input, "body", "content") || asText(input)),
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
    editTitle: (input) =>
      fill("content-edit.edit_title", ["Title"], field(input, "title") || asText(input)),
    editSlug: (input) =>
      fill("content-edit.edit_slug", ["Slug"], field(input, "slug") || asText(input)),
    editBody: (input) =>
      fill("content-edit.edit_body", ["Body"], field(input, "body", "content") || asText(input)),
    uploadBodyImage: (input) => uploadBodyImage("content-edit.upload_body_image", input),
    publishChanges: () => press("content-edit.publish_changes", ["Publish Changes"], navBar()),
    confirmPublishChanges: () =>
      inDialog("content-edit.confirm_publish_changes", ["Publish Changes", "Publish", "Yes"]),
    cancelEditing: () => press("content-edit.cancel_editing", ["Cancel"], navBar()),
    deletePage: () => press("content-edit.delete_page", ["Delete"], navBar()),
    confirmDeletePage: () =>
      inDialog("content-edit.confirm_delete_page", ["Delete Page", "Delete", "Yes"]),
    publishedDate: () => linesMatching(/^Published /),
    // "Updated By" is the label of the person, not the date.
    updatedDate: () => linesMatching(/^Updated (?!By\b)/),
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
    // The page's own heading, not the browser tab's title.
    pageTitle: async () => {
      await ready();
      const heading = seen(page.getByRole("heading", { level: 1 }));
      return (await heading.count()) ? (await heading.first().innerText()).trim() : "";
    },
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
      return matches(/^[A-Za-z]+$/, stated) ? JSON.stringify([{ tag: stated }]) : stated;
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

  // The uploads that are about something other than read access state an empty list,
  // which this target accepts, so whatever they are refused for is what they are named for.
  const NO_STATED_ACCESS = "[]";

  const fileUpload: S.FileUploadPage = {
    ...at("/api/files"),
    // An upload that states no read access sends no statement of it at all.
    uploadFile: (input) => upload("file-upload.upload_file", uploadForm(input, readAccess(input))),
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
    // A refused upload stored nothing, so it has no identifier to give: that reads as "".
    // Only reading before any upload was sent at all is unreachable.
    storedFileIdentifier: async () => {
      const got = answer("file-upload.stored_file_identifier");
      if (got.status >= 300) return "";
      const id = answered().id;
      return id ? String(id) : "";
    },
    // The refusal readers hand over the latest refusal whole — its status and its body —
    // and leave it to the test to decide what that refusal says.
    refusedForSize: async () => refusal((status) => status >= 400),
    sizeLimitNamedInRefusal: async () => refusal((status) => status >= 400),
    refusedForFileNameLength: async () => refusal((status) => status >= 400),
    refusedForReadAccess: async () => refusal((status) => status >= 400),
    refusedWhenSignedOut: async () => refusal((status) => status === 401),
    serviceFault: async () => {
      const got = answer("file-upload.service_fault");
      if (got.status < 500) return "";
      const message = answered().message;
      return `${got.status} ${typeof message === "string" ? message : got.body}`;
    },
  };

  const fileDescription: S.FileDescriptionPage = {
    open: async (params) => {
      await ask("file-description.open", address("/api/files/:fileId", params));
    },
    fileIdentifier: async () => answeredField("file-description.file_identifier", "id"),
    fileName: async () => answeredField("file-description.file_name", "name"),
    storedDate: async () => answeredField("file-description.stored_date", "createdAt"),
    // The description names the stored content by the digest it is kept under.
    storedContentIdentifier: async () =>
      answeredField("file-description.stored_content_identifier", "fileBlob"),
    refusedWhenNotPermitted: async () => refusal((status) => status === 401 || status === 403),
    refusedForUnknownFile: async () => refusal((status) => status === 404),
    notFoundForAdministrator: async () => refusal((status) => status === 404),
  };

  // Downloading takes the file that was opened, unless the action names another.
  let openedFileId = "";

  const fileDownload: S.FileDownloadPage = {
    open: async (params) => {
      openedFileId = params?.fileId ?? "";
      await ask("file-download.open", address("/api/files/:fileId?type=blob", params));
    },
    downloadFile: async (input) => {
      const fileId =
        field(input, "fileId", "id") || (typeof input === "string" ? input : "") || openedFileId;
      if (!fileId) nothing("file-download.download_file — no file has been opened to download");
      await ask(
        "file-download.download_file",
        address("/api/files/:fileId?type=blob", { fileId }),
      );
    },
    fileContents: async () => {
      // A refused download hands over no contents.
      const got = answer("file-download.file_contents");
      return got.status < 300 ? got.body : "";
    },
    // The name the file is kept under travels in the disposition the answer carries; an
    // answer that names no file reads as nothing.
    fileNameOnSave: async () => {
      answer("file-download.file_name_on_save");
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header("content-disposition"));
      return match ? decodeURIComponent(match[1]) : "";
    },
    // "attachment" or "inline" as the answer states it; a stated nothing reads as nothing.
    offeredAsDownloadNotDisplayed: async () => {
      answer("file-download.offered_as_download_not_displayed");
      const disposition = header("content-disposition");
      return /^\s*(attachment|inline)/i.exec(disposition)?.[1].toLowerCase() ?? "";
    },
    contentTypeFromName: async () => {
      answer("file-download.content_type_from_name");
      return header("content-type");
    },
    // The body only when the file was actually read; a refusal reads as nothing.
    readableWhenSignedOutIfPublic: async () => {
      const got = answer("file-download.readable_when_signed_out_if_public");
      return got.status === 200 ? got.body : "";
    },
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
      // The step is headed "N. Attachments" and states its size limit whether or not the
      // form is being edited; "Add Attachment" appears only once editing has begun.
      await attachmentsStep();
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
    // Whichever form is open, the limit is stated on its Attachments step.
    sizeLimitStatedBeforeChoosing: async () => {
      await attachmentsStep();
      return linesMatching(/smaller than|\b\d+\s?MB\b/i);
    },
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
    // The names listed on the Attachments step, between its note and its step controls.
    async existingAttachmentRow() {
      await attachmentsStep();
      const lines = await textLines();
      const start = lines.findIndex((line) => matches(/^\d+\.\s+Attachments$/i, line));
      if (start < 0) return sectionFrom(["Attachments"]);
      const names: string[] = [];
      for (let i = start + 1; i < lines.length; i++) {
        if (matches(/^(Previous|Next|Add Attachment)$/, lines[i])) break;
        if (matches(/smaller than|supporting material/i, lines[i])) continue;
        names.push(lines[i]);
      }
      const boxes = attachmentNameBoxes();
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        const typed = await boxes.nth(i).inputValue();
        names.push(typed || ((await boxes.nth(i).getAttribute("placeholder")) ?? ""));
      }
      return names.filter(Boolean).join("\n");
    },
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

  // An opportunity or proposal form's Attachments step, reached from its own tab when the
  // record's screen opened on another.
  async function attachmentsStep(): Promise<void> {
    await ready();
    if (!(await currentStep())) await enterTab(["Opportunity", "Proposal Details"]);
    await goToStep("Attachments");
  }

  // An outcome announced as an alert drawn after the page's footer, once the confirmation
  // that led to it has closed.
  async function alertLines(pattern: RegExp): Promise<string> {
    await dialog().first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => undefined);
    await seen(page.getByText(pattern)).first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    const prose = await proseLines();
    const whole = await page.evaluate(() => document.body.innerText);
    return whole
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !prose.has(line) && matches(pattern, line))
      .join("\n");
  }

  // The pictures a screen shows as its own, below the top bar: the site logo and the
  // signed-in person's small avatar up there are never the picture being asked about.
  async function pictures(): Promise<string[]> {
    const bar = await navBar().boundingBox().catch(() => null);
    const below = bar ? bar.y + bar.height : 0;
    const images = seen(page.getByRole("img"));
    const count = await images.count();
    const sources: string[] = [];
    for (let i = 0; i < count; i++) {
      const source = await images.nth(i).getAttribute("src");
      if (!source) continue;
      const box = await images.nth(i).boundingBox();
      if (box && box.y + box.height <= below) continue;
      sources.push(source);
    }
    return sources;
  }

  // A stored picture is shown from the service's file address; the placeholder shown when
  // there is none comes from the site's static images and is not a stored image.
  async function storedImageAddress(): Promise<string> {
    await ready();
    // Only the placeholder, or no picture at all: nothing is stored to point at.
    return (await pictures()).find((source) => source.includes("/api/files/")) ?? "";
  }

  // The size the image was stored at, read by loading the stored image itself. With no
  // stored image, or one the service will not hand back, there is no size to read.
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
      await ready();
      return (await pictures())[0] ?? "";
    },
    chosenImagePreview: async () =>
      (await pictures()).find((source) => /^(blob|data):/.test(source)) ?? "",
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
          return response
            ? String(response.status())
            : nothing(`file-image-picker.image_readable_when_signed_out — ${source} could not be requested`);
        }
      }
      // No stored picture on the loaded page: nothing to be readable.
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
