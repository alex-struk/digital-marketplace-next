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
import { seed } from "../../generated/seed";
import type * as S from "../../generated/surface";
import { uploadFile } from "../../fixtures/upload";

// The surface this adapter is compiled against may be the one generated from this contract
// or one generated from an earlier one, so it has to compile against both. A page only the
// newer surface declares is typed through PageOf, and a page that gained members is typed
// Open so a member the older surface lacks is not refused as an unknown property.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Members = { [member: string]: (...args: any[]) => any };
type PageOf<K extends string> = S.Surface extends { [P in K]: infer T } ? T : Members;
type Open<T> = T & { [member: string]: unknown };

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

  // Every dialog (alert, confirm, prompt) the page raises since it last loaded a screen.
  // Markup in a page's body that ran as script shows itself this way and no other, so the
  // record is kept from the moment the adapter exists, not from when it is asked. The
  // dialog is then dismissed — what the browser does with one nobody listens for — a moment
  // later, so a test listening for it itself has already answered it and the dismissal
  // quietly does nothing.
  const raisedDialogs: string[] = [];
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) raisedDialogs.length = 0;
  });
  page.on("dialog", (raised) => {
    raisedDialogs.push(`${raised.type()}: ${raised.message()}`);
    setTimeout(() => raised.dismiss().catch(() => undefined), 0);
  });

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

  async function currentHeading(): Promise<string> {
    const heading = seen(page.getByRole("heading"));
    return (await heading.count()) ? (await heading.first().innerText().catch(() => "")).trim() : "";
  }

  async function notFoundShown(): Promise<boolean> {
    return (await seen(page.getByRole("heading", { name: "Not Found", exact: true })).count()) > 0;
  }

  async function go(route: string, params?: Record<string, string>): Promise<void> {
    // A screen opened is a form begun afresh: the fields and terms an earlier form was given
    // say nothing about this one.
    namedLabels.clear();
    namedTexts.clear();
    acceptedTerms.clear();
    leavePhaseChoice = false;
    termsRefused = false;
    refusalShown = [];
    refusalFieldsShown = [];
    organizationWithheld = false;
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

  // A figure shown above its label and nothing else: a label with no figure over it (a tab
  // name, a heading) is no score, and reads as nothing.
  async function figureAbove(labels: string[]): Promise<string> {
    const lines = await textLines();
    for (let i = 1; i < lines.length; i++) {
      if (labels.includes(lines[i]) && matches(LOOKS_LIKE_A_VALUE, lines[i - 1])) return lines[i - 1];
    }
    return "";
  }

  // A proposal shows each stage's score on that stage's own tab ("66.00%" over "Team Scenario
  // Score" on Team Scenario) and its total on every tab. The figure is read where the screen
  // is; when it is not there, the stage's tab is opened and read, and a reader not offered
  // that tab, or a stage not yet scored, reads as nothing.
  async function stageFigure(tabs: string[], labels: string[]): Promise<string> {
    await ready();
    const here = await figureAbove(labels);
    if (here || !tabs.length) return here;
    return (await enterTab(tabs)) ? figureAbove(labels) : "";
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
  // it belongs to. A screen with no step list — the "Not Found" a withheld form shows —
  // carries no such header and reads as nothing.
  async function headerText(): Promise<string> {
    await ready();
    if (await notFoundShown()) return "";
    const lines = await textLines();
    const step = lines.findIndex((line) => matches(/^\d+\.\s/, line));
    return step > 0 ? lines.slice(0, step).join("\n") : "";
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

  // The message a form draws directly after one of its fields ("Teaser must be between 0 and
  // 500 characters long."), read from that field's own group and no further: the words that
  // follow the box up to where another field begins. Labels come before a field, so they are
  // never read; headings and titles elsewhere on the screen are never read either.
  async function fieldErrors(pattern?: RegExp): Promise<string[]> {
    const found: string[] = [];
    for (const role of ["textbox", "spinbutton", "combobox"] as const) {
      const fields = seen(page.getByRole(role));
      const count = await fields.count();
      for (let i = 0; i < count; i++) {
        for (const line of await saidAfterField(fields.nth(i))) {
          if (!matches(MESSAGE, line)) continue;
          if (pattern && !matches(pattern, line)) continue;
          if (!found.includes(line)) found.push(line);
        }
      }
    }
    return found;
  }

  // Each message the screen draws against a field, as "<field>: <message>", the field named
  // by its label. The Code With Us proponent step labels its two address lines both "Street
  // Address", the first required ("Street Address*") and the second not; they are told apart
  // by that order.
  async function fieldErrorsByLabel(): Promise<string[]> {
    const found: string[] = [];
    let streets = 0;
    for (const role of ["textbox", "spinbutton", "combobox"] as const) {
      const fields = seen(page.getByRole(role));
      const count = await fields.count();
      for (let i = 0; i < count; i++) {
        const label = bareLabel(await accessibleName(fields.nth(i)));
        const street = /^street address/i.test(label) ? streets++ : -1;
        const said = (await saidAfterField(fields.nth(i))).filter((line) => matches(MESSAGE, line));
        if (!said.length) continue;
        const name = street > 0 ? "second address line" : proposalFieldName(label);
        for (const line of said) {
          const entry = `${name}: ${line}`;
          if (!found.includes(entry)) found.push(entry);
        }
      }
    }
    return found;
  }

  // A proposal form's field label as the contract names that field.
  function proposalFieldName(label: string): string {
    const named: [RegExp, string][] = [
      [/^legal name/i, "legal name"],
      [/^email/i, "email address"],
      [/^phone/i, "phone"],
      [/^street address/i, "street address"],
      [/^city/i, "city"],
      [/^(province|state)/i, "province"],
      [/^(postal|zip)/i, "postal code"],
      [/^country/i, "country"],
      [/^additional comments?/i, "additional comments"],
      [/^proposal/i, "proposal text"],
      [/^organization/i, "organization"],
    ];
    for (const [pattern, name] of named) if (pattern.test(label)) return name;
    return label.toLowerCase();
  }

  // The words a form draws directly after one field, up to where another field begins.
  // A formatted-text editor (Description, Acceptance Criteria) carries its own image
  // "Choose File" input in its toolbar, above the box: that is part of the editor, not a
  // second field, so it never stops the climb — otherwise the message drawn under the
  // editor, in the field's own group, is never reached (seen as the administrator on the
  // Code With Us form's Description step, with 10,001 characters entered). The field's own
  // group — the element holding its label — is then read too, for whatever follows the box
  // inside it, so a message drawn beneath a box wrapped in its own frames is still found.
  async function saidAfterField(control: Locator): Promise<string[]> {
    const said = await control
      .evaluate((box) => {
        const isField = (node: Element): boolean =>
          (node instanceof HTMLInputElement && node.type !== "hidden" && node.type !== "file") ||
          node instanceof HTMLTextAreaElement ||
          node instanceof HTMLSelectElement;
        const fieldsIn = (node: Element): number =>
          (isField(node) ? 1 : 0) + Array.from(node.children).reduce((sum, child) => sum + fieldsIn(child), 0);
        const words: string[] = [];
        let node: Element = box;
        for (let level = 0; level < 5; level++) {
          for (let next = node.nextElementSibling; next; next = next.nextElementSibling) {
            if (fieldsIn(next)) continue;
            const text = ((next as HTMLElement).innerText ?? "").trim();
            if (text) words.push(...text.split("\n"));
          }
          const parent: Element | null = node.parentElement;
          if (!parent || fieldsIn(parent) > 1) break;
          node = parent;
        }
        // The field's own group: the nearest ancestor that also holds its label, provided it
        // holds no other field. Everything in it that comes after the box is read.
        const label = (box as HTMLInputElement).labels?.[0] ?? null;
        let group: Element | null = null;
        if (label) {
          for (let up = box.parentElement, level = 0; up && level < 8; up = up.parentElement, level++) {
            if (up.contains(label)) {
              group = up;
              break;
            }
          }
        }
        if (group && fieldsIn(group) === 1) {
          const after = (element: Element): void => {
            for (const child of Array.from(element.children)) {
              if (child === label || child.contains(label as Node)) continue;
              if (child.contains(box)) {
                after(child);
                continue;
              }
              if (!(box.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
              const text = ((child as HTMLElement).innerText ?? "").trim();
              if (text) for (const line of text.split("\n")) if (!words.includes(line)) words.push(line);
            }
          };
          after(group);
        }
        return words;
      })
      .catch(() => [] as string[]);
    return said.map((words) => words.trim()).filter(Boolean);
  }

  // Every alert the screen is showing, whole and wherever it is drawn — the outcome notices
  // come after the footer — list items included.
  async function everyAlert(pattern?: RegExp): Promise<string[]> {
    const alerts = seen(page.getByRole("alert"));
    const count = await alerts.count();
    const found: string[] = [];
    for (let i = 0; i < count; i++) {
      const words = (await alerts.nth(i).innerText().catch(() => "")).trim();
      if (!words || (pattern && !matches(pattern, words))) continue;
      if (!found.includes(words)) found.push(words);
    }
    return found;
  }

  // What a form is saying back: its alerts that carry a message, then each field's own error.
  async function formErrors(pattern?: RegExp): Promise<string> {
    const alerts = (await everyAlert(pattern)).filter((words) => matches(MESSAGE, words));
    return [...alerts, ...(await fieldErrors(pattern))].join("\n");
  }

  // The steps the wizard's step menu marks with its warning icon: the ones not yet complete.
  async function incompleteSteps(): Promise<string[]> {
    const current = await currentStep();
    if (!current) return [];
    await current.click().catch(() => undefined);
    const menu = seen(page.getByRole("menu"));
    await menu.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    const names: string[] = [];
    if (await menu.count()) {
      const entries = seen(menu.first().getByText(STEP));
      const count = await entries.count();
      for (let i = 0; i < count; i++) {
        if (await entries.nth(i).getByRole("img").count()) names.push((await entries.nth(i).innerText()).trim());
      }
    }
    // The menu ignores Escape; it is closed by its own toggle, the current step's name.
    if (await menu.count()) await current.click().catch(() => undefined);
    await menu.first().waitFor({ state: "hidden", timeout: 2000 }).catch(() => undefined);
    return names;
  }

  async function tableText(): Promise<string> {
    const tables = seen(page.getByRole("table"));
    const count = await tables.count();
    const parts: string[] = [];
    for (let i = 0; i < count; i++) parts.push((await tables.nth(i).innerText()).trim());
    return parts.filter(Boolean).join("\n");
  }

  // Every visible table, one line per row with its cells joined by " | ": a row whose cells
  // wrap over several lines still reads as one line, its title beside its status.
  // A cell's words as written, one text run per line: a name the page draws in capitals
  // ("text-uppercase") reads in the case the person's profile shows it.
  async function cellText(cell: Locator): Promise<string> {
    return cell.evaluate((element) => {
      const runs: string[] = [];
      const walk = (node: Node): void => {
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            const words = (child.textContent ?? "").trim();
            if (words) runs.push(words);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const style = getComputedStyle(child as Element);
            if (style.display === "none" || style.visibility === "hidden") continue;
            walk(child);
          }
        }
      };
      walk(element);
      return runs.join("\n");
    });
  }

  async function tableRows(withHeader = true, asWritten = false): Promise<string> {
    const lines: string[] = [];
    const tables = seen(page.getByRole("table"));
    const tableCount = await tables.count();
    for (let t = 0; t < tableCount; t++) {
      const rows = tables.nth(t).getByRole("row");
      const rowCount = await rows.count();
      for (let r = 0; r < rowCount; r++) {
        const cells = rows.nth(r).getByRole("cell");
        const cellCount = await cells.count();
        const parts: string[] = [];
        if (cellCount) {
          for (let c = 0; c < cellCount; c++) {
            const words = asWritten ? await cellText(cells.nth(c)) : await cells.nth(c).innerText();
            parts.push(words.replace(/\s*\n\s*/g, " ").trim());
          }
        } else if (withHeader) {
          const heads = await rows.nth(r).getByRole("columnheader").allInnerTexts();
          parts.push(...heads.map((head) => head.replace(/\s*\n\s*/g, " ").trim()));
        }
        const line = parts.filter(Boolean).join(" | ");
        if (line) lines.push(line);
      }
    }
    return lines.join("\n");
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
    // A dash is the cell withheld or saying no, which is no mark.
    if (/^[—–-]$/.test(words)) return "";
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
  // The top bar's controls are drawn once the record they act on has loaded, a moment after
  // the screen itself, so a control not there yet is looked for again for a few seconds.
  const LATE_CONTROL_MS = 5000;

  // A click that cannot land (the control sliding in with its dialog, or covered for a moment
  // by one on its way out) is tried again with the control found afresh, a bounded number of
  // times, and then reported, rather than left waiting out the test.
  const CLICK_MS = 8000;

  async function press(where: string, names: string[], scope: Scope = page): Promise<void> {
    const deadline = Date.now() + LATE_CONTROL_MS;
    let missed = 0;
    for (;;) {
      let retry = false;
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
          const clicked = await control
            .click({ timeout: CLICK_MS })
            .then(() => true)
            .catch(() => false);
          if (clicked) {
            await settle();
            return;
          }
          if (++missed >= 3) {
            throw new Error(`${where} — "${name}" was found but would not take a click on ${page.url()}`);
          }
          await page.waitForTimeout(400);
          retry = true;
          break;
        }
      }
      if (retry) continue;
      if (Date.now() >= deadline) break;
      await page.waitForTimeout(250);
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

  // A dialog on its way out is emptied before it leaves the tree (its heading left with no
  // text, seen after "Submit Proposal" on a Sprint With Us proposal), and for that moment it
  // can sit in front of a newly raised one. A dialog showing no words is taken as gone.
  function dialog(): Locator {
    return seen(page.getByRole("dialog")).filter({ hasText: /\S/ });
  }

  async function dialogText(): Promise<string> {
    return (await dialog().count()) ? (await dialog().first().innerText()).trim() : "";
  }

  // A dialog slides in over a moment after it is raised, and a control in it pressed while it
  // is still arriving is ignored: the dialog simply stays open. So once one is up, the page is
  // given that moment before anything in it is pressed.
  const DIALOG_ARRIVAL_MS = 400;

  async function dialogUp(timeout = 5000): Promise<boolean> {
    await dialog().first().waitFor({ state: "visible", timeout }).catch(() => undefined);
    if (!(await dialog().count())) return false;
    await page.waitForTimeout(DIALOG_ARRIVAL_MS);
    return true;
  }

  // A dialog left open by an earlier action is put away without choosing anything in it. A
  // close pressed while it was still arriving is ignored, so it is tried more than once.
  async function dismissDialog(): Promise<void> {
    for (let attempt = 0; attempt < 3 && (await dialog().count()); attempt++) {
      await page.waitForTimeout(DIALOG_ARRIVAL_MS);
      await page.keyboard.press("Escape").catch(() => undefined);
      await dialog().first().waitFor({ state: "hidden", timeout: 1500 }).catch(() => undefined);
      for (const name of ["Cancel", "Close", "×"]) {
        if (!(await dialog().count())) break;
        const control = await findControl(dialog().first(), name);
        if (control) {
          await control.click().catch(() => undefined);
          await dialog().first().waitFor({ state: "hidden", timeout: 3000 }).catch(() => undefined);
        }
      }
    }
    await settle();
  }

  // A dialog that must be gone before the form behind it is touched again — a click on the
  // form while it is up lands on the dialog instead and waits out the test. When it will not
  // close, that is said at once, naming it.
  async function mustDismissDialog(where: string): Promise<void> {
    if (!(await dialog().count())) return;
    await dismissDialog();
    if (await dialog().count()) {
      const title = ((await dialogText()).split("\n")[0] ?? "").trim();
      throw new Error(
        `${where} — the "${title}" dialog stayed open over the form after Escape and its own "Cancel" were pressed on ${page.url()}`,
      );
    }
  }

  // A save's own confirmation left open is confirmed rather than put away, so what was
  // being saved is kept.
  async function confirmOpenSave(where: string): Promise<void> {
    if (!(await dialog().count())) return;
    const saves = ["Publish Changes", "Save Changes", "Submit Changes for Review"];
    for (const name of saves) {
      const control = await findControl(dialog().first(), name);
      if (!control || (await isDisabled(control))) continue;
      await control.click();
      await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
      await settle();
      await saved(saves);
      return;
    }
  }

  async function inDialog(where: string, names: string[]): Promise<void> {
    if (!(await dialogUp())) {
      throw new Error(`unbound: ${where} — no dialog is open on ${page.url()}`);
    }
    await press(where, names, dialog().first());
  }

  // Many actions raise a confirmation first; step through it when one appears, and wait for
  // it to close so the next thing pressed is not swallowed by it.
  async function confirmIfAsked(where: string, names: string[]): Promise<void> {
    if (!(await dialogUp(2000))) return;
    await press(where, names, dialog().first());
    await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  // A confirmation the action cannot finish without ("Save Changes?", "Publish Addendum?").
  async function confirmDialog(where: string, names: string[]): Promise<void> {
    if (!(await dialogUp())) {
      throw new Error(`${where} — no confirmation opened on ${page.url()}`);
    }
    await press(where, names, dialog().first());
    await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  // The entry an Actions menu offers under one of these names, or null when this reader is
  // offered no such menu or the menu has no such entry — the refusal a test goes on to read.
  async function offeredInActions(names: string[]): Promise<Locator | null> {
    await ready();
    let toggle = await findControl(navBar(), "Actions");
    if (!toggle && (await enterTab(["Opportunity"]))) toggle = await findControl(navBar(), "Actions");
    if (!toggle) return null;
    const menu = seen(navBar().getByRole("menu"));
    if (!(await menu.count())) {
      await toggle.click();
      await menu.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    }
    if (!(await menu.count())) return null;
    for (const name of names) {
      const entry = await findControl(menu.first(), name);
      if (entry) return entry;
    }
    return null;
  }

  async function closeActionsMenu(): Promise<void> {
    if (!(await seen(navBar().getByRole("menu")).count())) return;
    await page.keyboard.press("Escape").catch(() => undefined);
    if (await seen(navBar().getByRole("menu")).count()) {
      const toggle = await findControl(navBar(), "Actions");
      if (toggle) await toggle.click().catch(() => undefined);
    }
  }

  // An Actions-menu entry taken when offered and enabled. A missing or disabled entry is the
  // record or the reader refusing, so the menu is closed and nothing is attempted.
  async function fromActionsIfOffered(where: string, names: string[]): Promise<boolean> {
    const entry = await offeredInActions(names);
    if (!entry || (await isDisabled(entry))) {
      await closeActionsMenu();
      return false;
    }
    await entry.click();
    await settle();
    return true;
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

  // A record's screen puts its one or two actions straight in the top bar ("Withdraw",
  // "Award", "Enter Score") and gathers them under "Actions" when there are more ("Award |
  // Edit Score | Disqualify"). Whichever the screen shows is used, once it has drawn either.
  async function fromBarOrActions(where: string, names: string[]): Promise<void> {
    await ready();
    const deadline = Date.now() + LATE_CONTROL_MS;
    for (;;) {
      for (const name of names) {
        if (await findControl(navBar(), name)) {
          await press(where, names, navBar());
          return;
        }
      }
      if (await findControl(navBar(), "Actions")) {
        await fromActions(where, names);
        return;
      }
      if (Date.now() >= deadline) break;
      await page.waitForTimeout(250);
    }
    const bar = (await navBar().innerText().catch(() => "")).replace(/\s*\n\s*/g, " | ");
    throw new Error(
      `unbound: ${where} — neither the top bar nor an "Actions" menu offers ${quoted(names)} on ${page.url()}; the top bar shows: ${bar}`,
    );
  }

  // Every score a proposal is given is entered in the "Enter Score" dialog ("Edit Score" once
  // one is recorded): one number box named for what is scored ("Total Score", "Team Scenario
  // Score", "Challenge Score"), then "Submit Score". The dialog belongs to the tab of the stage
  // being scored, which is opened first.
  async function scoreProposal(where: string, tabs: string[], input: unknown): Promise<void> {
    await ready();
    if (tabs.length) await openTab(where, tabs);
    try {
      await fromBarOrActions(where, ["Enter Score", "Edit Score"]);
    } catch (error) {
      // A stage the opportunity has not reached says so on its tab, with nothing in the top
      // bar ("If this proposal is screened into the Team Scenario, it can be scored once the
      // opportunity reaches the Team Scenario too." — seen as the administrator on the seeded
      // closed opportunities, still at question evaluation). That is the page refusing: nothing
      // is scored, and the notice is left on the tab for wrong_stage_error to read — and kept,
      // in case the reader has moved off the tab by the time it is asked.
      const notice = await wrongStage();
      if (notice) {
        stageRefusal = { proposal: new URL(page.url()).pathname, notice };
        return;
      }
      throw error;
    }
    stageRefusal = null;
    await dialog().first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) {
      throw new Error(`unbound: ${where} — "Enter Score" opened no dialog on ${page.url()}`);
    }
    const value = field(input, "score", "value", "total", "totalScore") || asText(input);
    const box = seen(dialog().first().getByRole("spinbutton"));
    if (!(await box.count())) {
      throw new Error(`unbound: ${where} — the score dialog holds no number box on ${page.url()}`);
    }
    await box.first().fill(value);
    await box.first().blur().catch(() => undefined);
    await settle();
    await press(where, ["Submit Score"], dialog().first());
    await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  // The notice the last refused score met, with the proposal it was on.
  let stageRefusal: { proposal: string; notice: string } | null = null;

  // wrong_stage_error: what the screen says now, else what the score just refused on this
  // same proposal was told.
  async function wrongStageError(): Promise<string> {
    await ready();
    const shown = await wrongStage();
    if (shown) return shown;
    return stageRefusal && stageRefusal.proposal === new URL(page.url()).pathname ? stageRefusal.notice : "";
  }

  // What a stage's tab says while the opportunity has not reached that stage, in its prose.
  async function wrongStage(): Promise<string> {
    const said = await linesMatching(/can be scored once|will be available once|has not (yet )?reached|not yet/i);
    return said || messages(/stage|not yet|cannot/i);
  }

  // offered_score_actions: each stage's tab carries its score in the top bar ("Enter Score",
  // "Edit Score" once one is recorded), or inside "Actions" beside other controls. A stage the
  // opportunity has not reached says it "can be scored once" it has, and a stage the proposal
  // has been carried past shows only its other controls ("Screen Out"). Resource Questions on
  // Team With Us is scored through the consensus and never offers one here. The names are the
  // page's own action names, one per line, empty when none is offered.
  // Each tab is loaded from its own address: switched to in place, the top bar keeps the
  // previous tab's "Enter Score" for a moment, which would read as this tab's.
  const SCORE_SHOWN_MS = 2500;
  async function offeredScoreActions(stages: { action: string; tabs: string[] }[]): Promise<string> {
    await ready();
    const offered: string[] = [];
    for (const stage of stages) {
      let tab: Locator | null = null;
      for (const label of stage.tabs) {
        tab = await findTab(label);
        if (tab) break;
      }
      if (!tab) continue;
      const href = await tab.getAttribute("href");
      if (href) await page.goto(new URL(href, page.url()).toString());
      else await tab.click();
      await ready();
      const deadline = Date.now() + SCORE_SHOWN_MS;
      for (;;) {
        if ((await findControl(navBar(), "Enter Score")) || (await findControl(navBar(), "Edit Score"))) {
          offered.push(stage.action);
          break;
        }
        if (await findControl(navBar(), "Actions")) {
          const menu = await actionsMenuText();
          await closeActionsMenu();
          if (/\b(Enter|Edit) Score\b/.test(menu)) offered.push(stage.action);
          break;
        }
        if (Date.now() >= deadline || (await wrongStage())) break;
        await page.waitForTimeout(250);
      }
    }
    return offered.join("\n");
  }

  // An award is confirmed in "Award ... Opportunity?" with its own "Award Opportunity".
  async function awardProposal(where: string): Promise<void> {
    await fromBarOrActions(where, ["Award"]);
    await confirmIfAsked(where, ["Award Opportunity", "Award Proposal", "Award"]);
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

  // A tab whose name is also an ordinary word on the screen ("Instructions", "Evaluation")
  // is taken only as the screen's own "?tab=" link, so a reader not offered it reads as
  // nothing rather than as whatever else carries the word.
  async function linkedTabContent(label: string): Promise<string> {
    await ready();
    const links = seen(page.getByRole("link", { name: label, exact: true }));
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      if (!href.includes("tab=")) continue;
      await links.nth(i).click();
      await ready();
      return contentText();
    }
    return "";
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
    await letValidationRun();
    // A dialog still open over the form (the terms dialog) would take the click.
    await mustDismissDialog(`going to the step matching ${pattern}`);
    await current.click();
    const choice = seen(page.getByText(pattern));
    // The menu of steps drops open over a moment after the step's name is pressed.
    await choice.first().waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
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

  // Walking with the form's own "Previous" and "Next" reaches every step in order, from
  // wherever an earlier action left the form.
  // A walk that has not reached step 1 by then (a "Previous" press that did not land) is
  // finished from the step menu, so the first step's fields are never left unread.
  async function toFirstStep(): Promise<void> {
    await letValidationRun();
    for (let step = 0; step < 16; step++) {
      const previous = await findControl(page, "Previous");
      if (!previous) break;
      await previous.click();
      await settle();
    }
    const onStep = await currentStep();
    if (onStep && !matches(/^1\.\s/, (await onStep.innerText().catch(() => "")).trim())) {
      await chooseStep(/^1\.\s+\S/);
    }
  }

  async function walkSteps(visit: () => Promise<boolean | void>): Promise<void> {
    await toFirstStep();
    for (let step = 0; step < 16; step++) {
      if ((await visit()) === true) return;
      await letValidationRun();
      const next = await findControl(page, "Next");
      if (!next || (await isDisabled(next))) return;
      await next.click();
      await settle();
    }
  }

  // A wizard shows a field's error only on the step holding that field, so errors are
  // gathered from every step in turn.
  async function stepMessages(pattern?: RegExp): Promise<string> {
    if (!(await currentStep())) return messages(pattern);
    const found: string[] = [];
    await walkSteps(async () => {
      for (const line of (await messages(pattern)).split("\n")) {
        if (line && !found.includes(line)) found.push(line);
      }
    });
    return found.join("\n");
  }

  // The first step showing an error, where a refused form is left for the reader.
  async function toStepShowingMessages(): Promise<void> {
    if (!(await currentStep())) return;
    await walkSteps(async () => (await messages()) !== "");
  }

  // What a form shows with its fields' values included: a screen's text leaves out what
  // sits inside its boxes, a disabled read-only box included.
  async function fieldValues(): Promise<string[]> {
    const found: string[] = [];
    for (const role of ["textbox", "spinbutton"] as const) {
      const boxes = seen(page.getByRole(role));
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        const value = (await boxes.nth(i).inputValue().catch(() => "")).trim();
        if (!value) continue;
        const name = bareLabel(await accessibleName(boxes.nth(i)));
        found.push(name ? `${name}: ${value}` : value);
      }
    }
    return found;
  }

  async function formText(): Promise<string> {
    return [await contentText(), ...(await fieldValues())].filter(Boolean).join("\n");
  }

  // Every step of a wizard read in turn, from the first.
  async function everyStepText(): Promise<string> {
    if (!(await currentStep())) return formText();
    const parts: string[] = [];
    await walkSteps(async () => {
      parts.push(await formText());
    });
    return parts.join("\n");
  }

  async function walkToStep(pattern: RegExp): Promise<boolean> {
    let reached = false;
    await walkSteps(async () => {
      const current = await currentStep();
      reached = current !== null && matches(pattern, (await current.innerText()).trim());
      return reached;
    });
    return reached;
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
    addressline: ["Street Address"],
    addresslineone: ["Street Address"],
    streetaddressone: ["Street Address"],
    // The form labels its second address line "Street Address" as well.
    streetaddress2: ["Street Address#2"],
    addressline2: ["Street Address#2"],
    addresslinetwo: ["Street Address#2"],
    streetaddresstwo: ["Street Address#2"],
    addresstwo: ["Street Address#2"],
    address2: ["Street Address#2"],
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
    // The weights are the percentage fields on the creation forms' Scoring step.
    questionsweight: ["Team Questions", "Resource Questions"],
    teamquestionsweight: ["Team Questions"],
    resourcequestionsweight: ["Resource Questions"],
    codechallengeweight: ["Code Challenge"],
    challengeweight: ["Interview/Challenge", "Code Challenge"],
    interviewweight: ["Interview/Challenge"],
    teamscenarioweight: ["Team Scenario"],
    priceweight: ["Price"],
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

  // A value written the way records store it ("FULL_STACK_DEVELOPER") is looked for in the
  // words the chooser shows ("Full Stack Developer").
  const humanized = (value: string): string => value.replace(/[_-]+/g, " ").trim().toLowerCase();

  async function pickOption(where: string, box: Locator, item: string): Promise<void> {
    for (const wanted of [...new Set([item, humanized(item)])]) {
      await box.click();
      await box.fill(wanted).catch(() => page.keyboard.type(wanted));
      const exact = seen(page.getByRole("option", { name: new RegExp(`^\\s*${escapeRegExp(wanted)}\\s*$`, "i") }));
      const loose = seen(page.getByRole("option", { name: wanted, exact: false }));
      await loose.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      const option = (await exact.count()) ? exact.first() : (await loose.count()) ? loose.first() : null;
      if (option) {
        await option.click();
        return;
      }
      await box.fill("").catch(() => undefined);
    }
    await page.keyboard.press("Escape").catch(() => undefined);
    throw new Error(`unbound: ${where} — the chooser offers no option matching "${item}" on ${page.url()}`);
  }

  async function enterValue(
    where: string,
    entry: Entry,
    role: string,
    box: Locator,
    typed = false,
  ): Promise<void> {
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
    entered();
    // The box must hold every character given — a 501-character teaser is the value under
    // test, and one cut short would test a different value. A box that took only the start
    // of it is filled again key by key; one that still holds less is reported with what it
    // took. A box that reformats what it is given (a date, a figure) is left as it is.
    const wanted = text.replace(/\r\n?/g, "\n");
    const held = async (): Promise<string> => (await box.inputValue().catch(() => wanted)).replace(/\r\n?/g, "\n");
    // Spaces a box trims from either end are its own doing, not a value cut short.
    const cutShort = (now: string): boolean =>
      now.trim().length < wanted.trim().length && wanted.trim().startsWith(now.trim());
    if (cutShort(await held())) {
      // The form may have been drawn afresh under the first fill; it is given once more.
      await page.waitForTimeout(300);
      await box.fill(text);
      entered();
      if (cutShort(await held()) && wanted.length <= 2000) {
        await box.fill("");
        await box.pressSequentially(wanted, { timeout: 60000 });
        entered();
      }
      const now = await held();
      if (cutShort(now)) {
        throw new Error(
          `${where} — the field for "${entry.key}" on ${page.url()} took ${now.length} of the ${wanted.length} characters given`,
        );
      }
    }
    if (typed && role === "textbox") {
      // Entered as a person would finish it: one key typed at the end and taken back, then
      // the box left. A question box just added by "Add Question" keeps the text a fill puts
      // there without taking it in (Submit for Review stays disabled and no message shows),
      // and a value given as empty put into a box already empty changes nothing, so old never
      // checks it; the keystroke makes old read the box as it stands and show its own verdict.
      await box.focus();
      await page.keyboard.press("ControlOrMeta+End");
      await page.keyboard.type("a");
      await page.keyboard.press("Backspace");
      await box.blur().catch(() => undefined);
      entered();
      // Old checks a question's box about half a second after its last change, and a change
      // to another box of the same question before then discards that check: the Question
      // entered before its Response Guidelines never showed "Question must be between 1 and
      // 1000 characters long." (seen as the government user on a new Sprint With Us form's
      // Team Questions step, 1,001 characters and then empty). A value outside the 1 to
      // 1000 characters old states for these boxes is therefore left to be checked before
      // anything else is touched; a value inside it needs no wait, so a hundred questions
      // are still entered in good time.
      if (text.length === 0 || text.length > 1000) await letValidationRun();
      return;
    }
    await box.blur().catch(() => undefined);
    // The same holds between boxes of one form: on the Code With Us Overview step a change to
    // Remote Description within half a second of the Teaser discards the Teaser's check, and a
    // 501-character Teaser then never shows "Teaser must be between 0 and 500 characters
    // long." (seen as the administrator, Remote OK "Yes", Teaser then Remote Description
    // entered back to back). A value long enough to be over a limit, or given as empty, is
    // therefore left to be checked before the next box is touched.
    if (text.length === 0 || text.length > 200) await letValidationRun();
  }

  // The forms check what was entered a moment after the last change (about half a second on
  // the opportunity forms), and only then draw their message under the field. A step left, or
  // a control pressed, before then may never show it, so each waits out that moment first.
  const VALIDATION_MS = 900;
  let enteredAt = 0;
  function entered(): void {
    enteredAt = Date.now();
  }
  async function letValidationRun(): Promise<void> {
    const left = enteredAt + VALIDATION_MS - Date.now();
    if (left > 0) await page.waitForTimeout(left);
  }

  // Every field label a test has given a value for, empty values included. A required field
  // the test named is left exactly as the test left it, never filled in on its behalf.
  const namedLabels = new Set<string>();
  // The text boxes among them the test gave a value with words in.
  const namedTexts = new Set<string>();

  // Set while the phases of a Sprint With Us form are left for the test to choose.
  let leavePhaseChoice = false;

  async function setField(
    where: string,
    entry: Entry,
    scope: Scope,
    last: boolean,
    slot?: number,
    typed = false,
  ): Promise<boolean> {
    for (const wanted of labelsFor(entry.key)) {
      const [label, position] = wanted.split("#");
      const name = labelled(label);
      for (const role of ["textbox", "spinbutton", "combobox", "checkbox"] as const) {
        const boxes = seen(scope.getByRole(role, { name }));
        const count = await boxes.count();
        if (!count) continue;
        const at = position ? Number(position) - 1 : slot !== undefined ? slot : last ? count - 1 : 0;
        if (at >= count) continue;
        await enterValue(where, entry, role, boxes.nth(at), typed);
        namedLabels.add(squash(label));
        if (role === "textbox" && asText(entry.value) !== "") namedTexts.add(squash(label));
        return true;
      }
      // A yes-or-no question is a pair of radios under a plain label.
      if (isYesNo(entry.value) && (await seen(scope.getByText(name)).count())) {
        const radio = seen(
          scope.getByRole("radio", { name: saysYes(entry.value) ? "Yes" : "No", exact: true }),
        );
        if (await radio.count()) {
          await radio.first().check();
          namedLabels.add(squash(label));
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
    options: { scope?: Scope; last?: boolean; skip?: string[]; slot?: number; typed?: boolean } = {},
  ): Promise<void> {
    const pending = entriesOf(input, options.skip ?? []);
    if (!pending.length) return;
    // Answers to yes-or-no questions go first: they reveal the fields that follow them.
    pending.sort((a, b) => Number(isYesNo(b.value)) - Number(isYesNo(a.value)));
    const scope = options.scope ?? page;
    const wizard = options.scope === undefined && (await currentStep()) !== null;
    if (wizard) await toFirstStep();
    for (let step = 0; step < 16 && pending.length; step++) {
      let progress = true;
      while (progress && pending.length) {
        progress = false;
        for (let i = 0; i < pending.length; i++) {
          if (await setField(where, pending[i], scope, options.last ?? false, options.slot, options.typed ?? false)) {
            pending.splice(i, 1);
            i--;
            progress = true;
          }
        }
      }
      if (!wizard || !pending.length) break;
      await letValidationRun();
      const next = await findControl(page, "Next");
      if (!next || (await isDisabled(next))) break;
      await next.click();
      await settle();
    }
    await settle();
    // An empty value for a field the form does not show — a remote description once remote
    // work is refused — asks nothing of the form, so it is not reported as unplaced.
    const unplaced = pending.filter((entry) => asText(entry.value) !== "");
    if (unplaced.length) {
      throw new Error(
        `unbound: ${where} — no field on ${page.url()} takes ${unplaced.map((entry) => `"${entry.key}"`).join(", ")}`,
      );
    }
  }

  // ---------------------------------------------------------------- required fields the input never names

  // The forms mark a field they will not save without by ending its label with "*". A test
  // hands an action only the values its criterion is about, so every other required field
  // is given something valid here — leaving it blank would keep Publish or Save Draft
  // disabled whatever the value under test holds. A field the test named, even as empty,
  // is never touched; nor is one that already holds a value.
  const REQUIRED = /\*\s*$/;
  const TEAM_FIELD = /^(resource name|hourly rate|team members?)$/i;
  const DAY = 86400000;
  const isoDay = (time: number): string => new Date(time).toISOString().slice(0, 10);
  const bareLabel = (name: string): string => name.replace(/\*\s*$/, "").trim();

  async function accessibleName(box: Locator): Promise<string> {
    const described = await box.ariaSnapshot().catch(() => "");
    return /^-\s*\w+\s+"([^"]*)"/.exec(described.trim())?.[1] ?? "";
  }

  // A chooser with nothing picked describes itself by its placeholder.
  async function chooserIsEmpty(box: Locator): Promise<boolean> {
    return ((await box.getAttribute("aria-describedby")) ?? "").includes("placeholder");
  }

  function placeholderValue(label: string, role: string): string {
    const words = label.toLowerCase();
    if (role === "spinbutton") {
      if (/fixed-price award/.test(words)) return "50000";
      if (/total maximum budget/.test(words)) return "1000000";
      if (/phase budget/.test(words)) return "100000";
      if (/budget|value|cost|rate/.test(words)) return "300000";
      if (/score/.test(words)) return "5";
      if (/word limit/.test(words)) return "300";
      return "1";
    }
    if (/email/.test(words)) return "adapter.proponent@example.test";
    if (/postal|zip/.test(words)) return "V8W 9V1";
    if (/country/.test(words)) return "Canada";
    if (/province|state/.test(words)) return "BC";
    if (/city/.test(words)) return "Victoria";
    if (/street/.test(words)) return "501 Belleville Street";
    if (/phone/.test(words)) return "250-555-0100";
    if (/legal name|^name$/.test(words)) return "Adapter Proponent";
    if (/title/.test(words)) return "Entered by the acceptance adapter";
    if (/location/.test(words)) return "Victoria";
    return "Entered by the acceptance adapter so the form can be saved.";
  }

  // The first option nobody has already picked, so a second evaluator is not the first again.
  async function pickUnusedOption(box: Locator): Promise<void> {
    await box.click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    const count = await options.count();
    if (!count) {
      await page.keyboard.press("Escape").catch(() => undefined);
      return;
    }
    for (let i = 0; i < count; i++) {
      const words = (await options.nth(i).innerText()).trim();
      if (words && (await seen(page.getByText(words, { exact: true })).count()) <= 1) {
        await options.nth(i).click();
        return;
      }
    }
    await options.first().click();
  }

  async function completeRequiredHere(dates: { last: number }): Promise<void> {
    // The phases shown are unfolded, and each given a capability, before their fields are read.
    await completePhases();
    // Dates are given in the order the form lists them, each a week after the one before, so
    // a deadline comes before an award and an award before a start.
    const textboxes = seen(page.getByRole("textbox"));
    const textCount = await textboxes.count();
    for (let i = 0; i < textCount; i++) {
      const box = textboxes.nth(i);
      if ((await box.getAttribute("type")) !== "date") continue;
      const value = (await box.inputValue().catch(() => "")).trim();
      if (value) {
        const time = Date.parse(value);
        if (Number.isFinite(time)) dates.last = Math.max(dates.last, time);
        continue;
      }
      const name = await accessibleName(box);
      if (!REQUIRED.test(name) || namedLabels.has(squash(bareLabel(name)))) continue;
      if (await box.isDisabled().catch(() => true)) continue;
      dates.last = Math.max(dates.last + 7 * DAY, Date.now() + 14 * DAY);
      await box.fill(isoDay(dates.last));
      entered();
      await box.blur().catch(() => undefined);
    }
    for (const role of ["textbox", "spinbutton", "combobox"] as const) {
      const boxes = seen(page.getByRole(role, { name: REQUIRED }));
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        const box = boxes.nth(i);
        if (await box.isDisabled().catch(() => true)) continue;
        const name = await accessibleName(box);
        if (namedLabels.has(squash(bareLabel(name)))) continue;
        // Who is on a proposal's team, and at what rate, is what a criterion about the team
        // turns on: a team-member chooser or an hourly rate is never filled on the test's behalf.
        if (TEAM_FIELD.test(bareLabel(name))) continue;
        if (role === "combobox") {
          // An input that gave dates for the whole opportunity but named no phase is about the
          // phases themselves, so none is chosen for it. Otherwise the form is started at
          // Implementation, the one phase every opportunity runs through, and nothing earlier.
          if (/which phase/i.test(name)) {
            if (!leavePhaseChoice && (await chooserIsEmpty(box))) {
              await pickOption("completing the form", box, "Implementation");
              await settle();
              // The phase brings fields of its own: the step is gone over again from the top.
              await completeRequiredHere(dates);
              return;
            }
            continue;
          }
          if (await chooserIsEmpty(box)) await pickUnusedOption(box);
          continue;
        }
        if ((await box.getAttribute("type")) === "date") continue;
        if ((await box.inputValue().catch(() => "")).trim() !== "") continue;
        await box.fill(placeholderValue(bareLabel(name), role));
        entered();
        await box.blur().catch(() => undefined);
      }
    }
    // A yes-or-no question ("Remote OK?*") is never answered on the test's behalf: whether
    // remote work is acceptable is itself something a criterion asks the author to state.
    await settle();
  }

  async function completeRequired(wholeForm: boolean): Promise<void> {
    const dates = { last: 0 };
    if (wholeForm && (await currentStep())) {
      await walkSteps(() => completeRequiredHere(dates));
    } else {
      await completeRequiredHere(dates);
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

  // A save that must end on the record it made. When it does not, what the page says
  // ("Unable to Save Draft Opportunity") is reported rather than a later reader finding no
  // record to read.
  async function mustLandOn(where: string, pattern: RegExp): Promise<void> {
    const reached = await page
      .waitForURL((url) => pattern.test(url.pathname), { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (!reached) {
      const shown = [await alertMessages(), await messages().catch(() => "")].filter(Boolean).join(" | ");
      throw new Error(
        `${where} — the save never reached the record's address; still on ${page.url()}; ${
          shown ? `the page shows: ${shown.replace(/\n/g, " ")}` : "the page shows no message"
        }`,
      );
    }
    await ready();
  }

  // Visible alerts that carry a message back at the reader, their list items included.
  async function alertMessages(): Promise<string> {
    const alerts = seen(page.getByRole("alert"));
    const count = await alerts.count();
    const found: string[] = [];
    for (let i = 0; i < count; i++) {
      const words = (await alerts.nth(i).innerText().catch(() => "")).trim();
      if (words && (matches(MESSAGE, words) || /@/.test(words))) found.push(words);
    }
    return found.join("\n");
  }

  const ATTACHMENT_KEYS = ["files", "attachments", "attachment", "file"];

  function hasFiles(input: unknown): boolean {
    if (!input || typeof input !== "object" || Array.isArray(input)) return false;
    return ATTACHMENT_KEYS.some((key) => (input as Record<string, unknown>)[key] !== undefined);
  }

  async function fill(where: string, labels: string[], value: string, scope: Scope = page): Promise<void> {
    const deadline = Date.now() + LATE_CONTROL_MS;
    for (;;) {
      for (const label of labels) {
        for (const role of ["textbox", "spinbutton"] as const) {
          const box = seen(scope.getByRole(role, { name: label, exact: false }));
          if (await box.count()) {
            await box.first().fill(value);
            await box.first().blur().catch(() => undefined);
            await settle();
            return;
          }
        }
      }
      if (Date.now() >= deadline) break;
      await page.waitForTimeout(250);
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
  // A proponent is named by its place in the list (a number, or { index }, counted from 0),
  // by its proposal (an identifier, or a seeded proposal record, found in the row link's
  // address), or by the words its row shows ("Proponent 2").
  async function openRow(where: string, input: unknown): Promise<void> {
    await ready();
    const bodyRows = seen(page.getByRole("row")).filter({ has: page.getByRole("cell") });
    await bodyRows.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    const record =
      input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    const proposal = record.proposal ?? record.proposalId ?? record.id ?? input;
    const proposalId =
      typeof proposal === "string" && UUID_ONLY.test(proposal)
        ? proposal
        : proposal && typeof proposal === "object" && typeof (proposal as Record<string, unknown>).id === "string"
          ? String((proposal as Record<string, unknown>).id)
          : "";
    const place =
      typeof input === "number"
        ? input
        : typeof input === "string" && /^\d+$/.test(input.trim())
          ? Number(input.trim())
          : Number.parseInt(field(input, "index", "position", "row", "order"), 10);
    const total = await bodyRows.count();
    let row: Locator | null = null;
    let named = "";
    if (proposalId) {
      named = `proposal ${proposalId}`;
      for (let i = 0; i < total && !row; i++) {
        const hrefs = await bodyRows.nth(i).getByRole("link").evaluateAll((links) => links.map((a) => a.getAttribute("href") ?? ""));
        if (hrefs.some((href) => href.includes(proposalId))) row = bodyRows.nth(i);
      }
    } else if (Number.isFinite(place) && place >= 0) {
      named = `place ${place}`;
      if (place < total) row = bodyRows.nth(place);
    } else {
      const name = asText(input);
      named = name;
      const rows = name ? bodyRows.filter({ hasText: name }) : bodyRows;
      if (await rows.count()) row = rows.first();
    }
    if (!row) {
      nothing(`${where} — no proponent row${named ? ` for ${named}` : ""} among the ${total} rows on ${page.url()}`);
    }
    const link = seen(row.getByRole("link"));
    const count = await link.count();
    if (!count) nothing(`${where} — the row${named ? ` for ${named}` : ""} offers no link on ${page.url()}`);
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
    const NAME_KEYS = ["file", "name", "fileName", "file_name", "filename", "attachment", "image", "picture", "upload"];
    const one = (item: unknown): string | null => {
      if (typeof item === "string") return item ? uploadFile({ name: item }) : null;
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      // A file handed over whole under one of those names ({ image: { name, content } }).
      for (const key of NAME_KEYS) {
        const inner = record[key];
        if (inner && typeof inner === "object" && !Array.isArray(inner) && !(inner instanceof Uint8Array)) {
          const found = one(inner);
          if (found) return found;
        }
      }
      const name = NAME_KEYS.map((key) => record[key]).find(
        (value): value is string => typeof value === "string" && value.length > 0,
      );
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
    // "Add Attachment" is drawn over a "Choose File" input that takes the file. The drawn
    // control sits out of the tab order whether or not it is usable, so the input beneath it
    // is what shows the step is open to attachments.
    // The formatted-text editors on other steps (Description, Acceptance Criteria) carry a
    // "Choose File" of their own that takes only images (".jpg,.jpeg,.png"); a file handed to
    // it goes into that text, not onto the record's attachments. Only an input that limits
    // nothing to images, on the Attachments step where the form has steps, is the one.
    const usable = async (): Promise<Locator | null> => {
      if ((await currentStep()) && !(await onAttachmentsStep())) return null;
      const inputs = seen(page.getByRole("button", { name: "Choose File", exact: true }));
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const accepts = (await inputs.nth(i).getAttribute("accept").catch(() => null)) ?? "";
        if (/^\s*(\.(jpe?g|png|gif)\s*,?\s*)+$/i.test(accepts)) continue;
        if (await inputs.nth(i).isDisabled().catch(() => false)) continue;
        return inputs.nth(i);
      }
      const drawn = await findControl(page, "Add Attachment");
      return drawn && !(await isDisabled(drawn)) ? drawn : null;
    };
    const reach = async (): Promise<Locator | null> => {
      await settle();
      const shown = await usable();
      if (shown) return shown;
      if (!(await currentStep())) await enterTab(["Opportunity", "Proposal Details", "Proposal"]);
      if (!(await goToStep("Attachments"))) await walkToStep(/Attachments$/i);
      return usable();
    };
    let control = await reach();
    // A saved record's form is read-only until "Edit" is chosen, from its Actions menu or,
    // where the record offers no menu, from the top bar itself.
    if (!control && (await fromActionsIfOffered(where, ["Edit"]))) control = await reach();
    if (!control) {
      const edit = await findControl(navBar(), "Edit");
      if (edit && !(await isDisabled(edit))) {
        await edit.click();
        await settle();
        control = await reach();
      }
    }
    if (!control) {
      throw new Error(
        `unbound: ${where} — went to the Attachments step by the step menu and by Previous/Next, and chose "Edit" where the Actions menu or the top bar offered it, but neither a "Choose File" input nor a usable "Add Attachment" control appeared on ${page.url()}`,
      );
    }
    const taken = await control
      .setInputFiles(files)
      .then(() => true)
      .catch(() => false);
    if (!taken) {
      const chooser = page.waitForEvent("filechooser", { timeout: 10000 });
      await control.click();
      await (await chooser).setFiles(files);
    }
    await settle();
  }

  function attachmentNameBoxes(): Locator {
    return seen(page.getByRole("textbox"));
  }

  async function renameAttachment(where: string, input: unknown): Promise<void> {
    await attachmentsOpenToChange(where);
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

  // The Attachments step open to change. A saved record — a published opportunity, a
  // submitted proposal — shows its attachments read-only, in disabled boxes, until "Edit"
  // is chosen from its Actions menu or, where it offers no menu, from the top bar.
  async function attachmentsOpenToChange(where: string): Promise<void> {
    const open = async (): Promise<boolean> =>
      (await seen(page.getByText("Add Attachment", { exact: false })).count()) > 0;
    await settle();
    if (await open()) return;
    await attachmentsStep();
    if (await open()) return;
    let editing = await fromActionsIfOffered(where, ["Edit"]);
    if (!editing) {
      const edit = await findControl(navBar(), "Edit");
      if (edit && !(await isDisabled(edit))) {
        await edit.click();
        await settle();
        editing = true;
      }
    }
    if (editing) await attachmentsStep();
    // Says what was tried when the step still offers no change.
    await advanceTo(where, "Add Attachment");
  }

  // The mark drawn right beside an attachment's name takes it off the list.
  async function removeAttachment(where: string, input: unknown): Promise<void> {
    await attachmentsOpenToChange(where);
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

  // Saves the opportunity or proposal form an attachment was changed on, through the control
  // its top bar offers: "Publish Changes" on a published opportunity, "Save Changes" on a
  // draft, "Submit Changes for Review" for an author awaiting review, and on a submitted
  // proposal "Submit Changes" with its terms dialog.
  async function saveAttachmentForm(where: string, change = "removed the attachment"): Promise<void> {
    const saves = ["Publish Changes", "Save Changes", "Submit Changes for Review"];
    for (const name of saves) {
      if (!(await findControl(navBar(), name))) continue;
      await press(where, [name], navBar());
      await confirmIfAsked(where, [name, ...saves]);
      await saved(saves);
      return;
    }
    if (await findControl(navBar(), "Submit Changes")) {
      await saveProposalChanges(where);
      return;
    }
    throw new Error(
      `unbound: ${where} — ${change}, then found no ${quoted([...saves, "Submit Changes"])} in the top bar of ${page.url()} to save it with`,
    );
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

  // A reader not offered the History tab never reaches the place the question is asked, so
  // that is reported unbound rather than read as "no control".
  async function noteControlOffered(where: string): Promise<string> {
    await openTab(where, ["History"]);
    await seen(page.getByRole("heading", { name: "History" }))
      .first()
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => undefined);
    const main = page.getByRole("main").first();
    const offered = [
      seen(main.getByRole("textbox")),
      seen(main.getByLabel(/\bnotes?\b|attach|\bfiles?\b/i)),
      seen(main.getByRole("button", { name: /note|attach|upload|file|save/i })),
      seen(main.getByRole("link", { name: /add note|attach|upload|save note/i })),
    ];
    for (const control of offered) if (await control.count()) return "true";
    return "false";
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
    // Every persona signs in through its session route. Whoever was signed in before is
    // signed out first, so the session that follows is this persona's alone.
    const entry = table["session-route"];
    if (!entry || entry.unavailable !== undefined || !entry.route) {
      throw new Error(
        `unbound: signIn.${who.id} — ${entry?.unavailable ?? "this target has no session route for this persona"}`,
      );
    }
    await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" });
    await settle();
    await page.goto(baseURL + entry.route, { waitUntil: "domcontentloaded" });
    await settle();
    // The session route mints a session without looking at the account's status, so it
    // cannot show the identity provider refusing a deactivated account. For the deactivated
    // vendor the session is kept only when the target says, right now, that the account is
    // active (as it is once an administrator has reactivated it); otherwise it is dropped
    // and the sign-in is reported unbound rather than as an account let in.
    if (who.id === "deactivated-vendor") {
      const status = await accountStatus();
      if (status !== "ACTIVE") {
        await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" });
        await settle();
        throw new Error(
          `unbound: signIn.${who.id} — the session route mints a session without checking account status, ` +
            `so it cannot show the identity provider's refusal of this account (status: ${status || "unknown"})`,
        );
      }
    }
  }

  // The signed-in account's status, as the target's own current-session answer gives it.
  async function accountStatus(): Promise<string> {
    const response = await page.request.get(baseURL + "/api/sessions/current").catch(() => null);
    if (!response || !response.ok()) return "";
    const body = (await response.json().catch(() => null)) as null | { user?: { status?: unknown } };
    return typeof body?.user?.status === "string" ? body.user.status : "";
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
    // The status chooser carries no name of its own; it is the list's other chooser, beside
    // the one named "Filter Opportunities". Its placeholder words sit over it and take no
    // click, so the chooser itself is typed into.
    filterByStatus: async (input) => {
      const where = "opportunity-list.filter_by_status";
      await ready();
      // The chooser offers "Draft", "Under Review", "Published", "Evaluation" and "Awarded".
      // A status written as records store it, or as the list's "Open" group names it, is
      // looked for under those words.
      const given = asText(field(input, "status", "value") || input);
      const code = given.toUpperCase().replace(/[^A-Z]+/g, "_");
      const value =
        /^(OPEN|PUBLISHED)$/.test(code)
          ? "Published"
          : /^EVAL/.test(code)
            ? "Evaluation"
            : /^(DRAFT|UNDER_REVIEW|AWARDED)$/.test(code)
              ? humanized(code)
              : given;
      if (!value) throw new Error(`unbound: ${where} — no status was named to filter by`);
      const boxes = seen(page.getByRole("combobox"));
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        if (/filter opportunities/i.test(await accessibleName(boxes.nth(i)))) continue;
        await pickOption(where, boxes.nth(i), value);
        await settle();
        return;
      }
      throw new Error(`unbound: ${where} — no status chooser beside "Filter Opportunities" on ${page.url()}`);
    },
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
  function opportunityCreate(where: string, route: string, phased = false) {
    // Every value the test gave is entered, then every required field it did not name is
    // given a valid value, so the value under test decides whether the form will save.
    // Dates a Sprint With Us input gives for the whole opportunity when it names no phase and
    // the form holds none: this form keeps dates only on phases, so they have nowhere to go.
    let homelessDates: string[] = [];
    // A reader who may not create opportunities (a vendor, seen as the vendor persona) is shown
    // "Not Found" at the form's address: no form to fill and nothing to press. That refusal is
    // what the test goes on to read, so the action ends there.
    let withheld = false;
    async function enter(member: string, input: unknown): Promise<void> {
      await ready();
      withheld = await notFoundShown();
      if (withheld) return;
      // The form is drawn a moment after the screen's heading.
      await seen(page.getByText(STEP)).first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
      homelessDates = [];
      let rest = input;
      if (phased) {
        const split = phaseDatesOf(input);
        rest = split.rest;
        // Once the test has given a phase its own dates (add_phase), those dates are the
        // test's: the whole opportunity's start and completion are never written over them.
        const phaseDated =
          namedLabels.has(squash("Phase Start Date")) || namedLabels.has(squash("Phase Completion Date"));
        if (split.phase && !phaseDated) {
          const named = field(split.phase, "phase");
          // The phase the dates belong to: the one the input names, else the phase the form
          // already starts with. None is ever added on the input's behalf.
          const starting = named ? named : await startingPhase();
          if (starting) {
            await addPhase(`${where}.${member}`, { ...split.phase, phase: starting });
          } else {
            homelessDates = Object.keys(split.phase).filter((key) => key !== "phase");
          }
        }
      }
      leavePhaseChoice = homelessDates.length > 0;
      await fillForm(`${where}.${member}`, rest, { skip: ATTACHMENT_KEYS });
      if (hasFiles(input)) await addAttachment(`${where}.${member}`, input);
      await completeRequired(true);
    }
    // A control this person is not offered is the refusal the test goes on to read (the
    // unchanged list), so the action ends quietly there. A control offered but still disabled
    // once every value is in is the form refusing what it was given: that is reported at once,
    // naming the steps the form still marks incomplete and what they say.
    async function pressWhenReady(member: string, name: string): Promise<boolean> {
      await letValidationRun();
      const control = await findControl(navBar(), name);
      if (!control) return false;
      if (await isDisabled(control)) {
        const steps = await incompleteSteps();
        const shown = await stepFormErrors();
        // Disabled with the form's own refusal on show ("The scoring weights should total
        // 100% exactly.") is the answer the test goes on to read, not a missing value: the
        // action ends there, with nothing pressed, and the readers find the message.
        if (shown.trim() && !homelessDates.length) return false;
        // Disabled with steps marked incomplete once every value given is in is the form
        // refusing those values (phases whose dates overlap, say) without a word: the action
        // ends there too; fieldError() then reads only what the page says against fields
        // (nothing, when it says nothing), never a step's title.
        if (steps.length && !homelessDates.length) return false;
        const dates = homelessDates.length
          ? `; the input gave ${quoted(homelessDates)} but named no phase and the form holds none, and this form takes dates only on a phase`
          : "";
        throw new Error(
          `${where}.${member} — "${name}" is disabled on ${page.url()}; ${
            steps.length ? `the form marks ${quoted(steps)} incomplete` : "no step is marked incomplete"
          }${shown ? `; the form shows: ${shown.replace(/\n/g, " | ")}` : ""}${dates}`,
        );
      }
      await control.click();
      await settle();
      return true;
    }
    const record = () => recordAddress("/opportunities/[a-z-]+");
    // What old answered a submission it refused: pressed and confirmed, the form stays where
    // it is and an alert says so ("Unable to Submit Opportunity" / "Sprint With Us
    // opportunity could not be submitted. Please try again later." — seen as the government
    // user on a new Sprint With Us form holding 102 questions, where "Submit for Review" is
    // offered and pressed). It is kept here, since the alert may be gone by the time the
    // reader has walked the form's steps.
    let refused: string[] = [];
    // Alerts already up before the press are not its answer.
    async function landOrRefused(pattern: RegExp, standing: Set<string>): Promise<void> {
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        if (pattern.test(new URL(page.url()).pathname)) {
          await ready();
          return;
        }
        const said = (await everyAlert()).filter((words) => !standing.has(words) && matches(MESSAGE, words));
        if (said.length) {
          refused = said;
          return;
        }
        await page.waitForTimeout(250);
      }
    }
    return {
      ...at(route),
      saveDraft: async (input?: unknown) => {
        await enter("save_draft", input);
        if (withheld) return;
        await press(`${where}.save_draft`, ["Save Draft"], navBar());
        await mustLandOn(`${where}.save_draft`, record());
      },
      submitForReview: async (input?: unknown) => {
        refused = [];
        await enter("submit_for_review", input);
        if (withheld) return;
        // Left disabled once every value is in, the form's own messages are the answer and
        // fieldError reads them; pressed, the submission ends on the record or on old's refusal.
        const standing = new Set(await everyAlert());
        if (!(await pressWhenReady("submit_for_review", "Submit for Review"))) return;
        await confirmIfAsked(`${where}.submit_for_review`, [
          "Submit for Review",
          "Submit Opportunity",
        ]);
        await landOrRefused(record(), standing);
      },
      publish: async (input?: unknown) => {
        await enter("publish", input);
        if (withheld) return;
        if (!(await pressWhenReady("publish", "Publish"))) return;
        await confirmIfAsked(`${where}.publish`, ["Publish Opportunity", "Publish"]);
        // A publish pressed and confirmed that stays on the form is the page refusing it:
        // what the page says is reported, rather than a later reader taking "create" from
        // the form's address for the record's identifier.
        await mustLandOn(`${where}.publish`, record());
      },
      // Alerts and each field's own error, from every step in turn; a heading or a title
      // that happens to hold a word like "cannot" is never read as an error.
      // A step marked incomplete is not a message against a field, so step titles are never
      // reported; a form that refuses without a word reads as empty. A refusal old announced
      // once a submission was pressed is included, whether or not its alert is still up.
      // One walk of the steps, from '1. Overview', reads it all within a few seconds: the
      // boxes the test named share one short wait for a check still on its way.
      fieldError: async () => {
        const found = await stepFieldErrors(true);
        for (const words of refused) {
          for (const line of words.split("\n").map((each) => each.trim())) {
            if (line && !found.includes(line)) found.push(line);
          }
        }
        return found.join("\n");
      },
    };
  }

  // A wizard shows a field's error only on the step holding that field, so the form's alerts
  // and field errors are gathered from every step in turn.
  async function stepFormErrors(pattern?: RegExp): Promise<string> {
    return (await stepFieldErrors(false, pattern)).join("\n");
  }

  // The wizard walked once, quickly: to step 1 from the step menu, then forward with "Next",
  // each step read as soon as its name has changed rather than after the network has gone
  // quiet (the steps are drawn in place; nothing is fetched between them).
  async function quickWalk(visit: () => Promise<void>): Promise<void> {
    const first = /^1\.\s+\S/;
    const stepName = async (): Promise<string> =>
      ((await (await currentStep())?.innerText().catch(() => "")) ?? "").trim();
    await letValidationRun();
    if (!matches(first, await stepName())) await chooseStep(first);
    for (let step = 0; step < 16; step++) {
      await visit();
      const before = await stepName();
      const next = await findControl(page, "Next");
      if (!next || (await isDisabled(next))) return;
      await next.click();
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline && (await stepName()) === before) await page.waitForTimeout(50);
      if ((await stepName()) === before) return;
    }
  }

  // Alerts and each field's own message, from every step of the wizard in turn. With `named`,
  // a box the test gave words that is silent while nothing at all has been read yet is given
  // a moment for old's check to draw — one short allowance shared by every such box, not a
  // wait apiece — so a check still on its way is not read as no message.
  const NAMED_WAIT_MS = 1200;
  async function stepFieldErrors(named: boolean, pattern?: RegExp): Promise<string[]> {
    const found: string[] = [];
    const add = (line: string): void => {
      if (line && !found.includes(line)) found.push(line);
    };
    let allowance = named ? NAMED_WAIT_MS : 0;
    const visit = async (): Promise<void> => {
      for (const line of (await formErrors(pattern)).split("\n")) add(line);
      if (!named || !namedTexts.size) return;
      const silent: Locator[] = [];
      const boxes = seen(page.getByRole("textbox"));
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        const box = boxes.nth(i);
        if (!namedTexts.has(squash(bareLabel(await accessibleName(box))))) continue;
        const said = (await saidAfterField(box)).filter((line) => matches(MESSAGE, line));
        if (said.length) said.forEach(add);
        else silent.push(box);
      }
      while (silent.length && allowance > 0 && !found.length) {
        await page.waitForTimeout(250);
        allowance -= 250;
        for (let i = silent.length - 1; i >= 0; i--) {
          const said = (await saidAfterField(silent[i])).filter((line) => matches(MESSAGE, line));
          if (said.length) {
            said.forEach(add);
            silent.splice(i, 1);
          }
        }
      }
    };
    if (await currentStep()) await quickWalk(visit);
    else await visit();
    return found;
  }

  // The phase a Sprint With Us form starts with, when one has been chosen.
  async function startingPhase(): Promise<string> {
    const onStep = await currentStep();
    if (!onStep || !matches(/Phases$/i, (await onStep.innerText()).trim())) {
      if (!(await goToStep("Phases")) && !(await walkToStep(/Phases$/i))) return "";
    }
    const chooser = seen(
      page.getByRole("combobox", { name: labelled("Which phase do you want to start with?") }),
    ).first();
    if (!(await chooser.count()) || (await chooserIsEmpty(chooser))) return "";
    for (const phase of PHASES) if (await phaseBand(phase)) return phase;
    return "";
  }

  // Resources and questions are numbered slots ("Resource 1", "Question 2"), each with the
  // same fields. An "order" in the input names the slot, counted from 0 as the records
  // count it; without one the first slot still empty is used, and a new one is added when
  // none is. Each field is then the one at that slot's position.
  const ORDER_KEYS = ["order", "index", "position"];

  async function fillSlot(
    where: string,
    step: RegExp,
    heading: string,
    add: string,
    isEmpty: (slot: number) => Promise<boolean>,
    input: unknown,
    orderNamesSlot = true,
    typed = false,
  ): Promise<void> {
    const onStep = await currentStep();
    if (!onStep || !matches(step, (await onStep.innerText()).trim())) {
      if (!(await walkToStep(step))) {
        throw new Error(`unbound: ${where} — walked every step of the form and none matched ${step} on ${page.url()}`);
      }
    }
    const headings = seen(page.getByRole("heading", { name: new RegExp(`^${escapeRegExp(heading)}\\s+\\d+$`) }));
    const ordered = Number.parseInt(field(input, ...ORDER_KEYS), 10);
    let slot = orderNamesSlot && Number.isFinite(ordered) && ordered >= 0 ? ordered : -1;
    if (slot < 0) {
      const count = await headings.count();
      for (let i = 0; i < count && slot < 0; i++) if (await isEmpty(i)) slot = i;
      if (slot < 0) slot = count;
    }
    for (let tries = 0; (await headings.count()) <= slot && tries < 12; tries++) {
      await press(where, [add]);
    }
    if ((await headings.count()) <= slot) {
      throw new Error(`unbound: ${where} — "${add}" did not make a ${heading} ${slot + 1} on ${page.url()}`);
    }
    await fillForm(where, input, { scope: page, slot, skip: ORDER_KEYS, typed });
  }

  async function addQuestion(where: string, step: string, input: unknown): Promise<void> {
    await fillSlot(
      where,
      new RegExp(`^\\d+\\.\\s+${escapeRegExp(step)}$`, "i"),
      "Question",
      "Add Question",
      async (slot) => {
        const box = seen(page.getByRole("textbox", { name: labelled("Question") })).nth(slot);
        return (await box.count()) > 0 && (await box.inputValue()).trim() === "";
      },
      input,
      // A question form has no position field: an "order" in the input is a value the form
      // does not take, not the number of a slot to make.
      false,
      // Question and Response Guidelines are typed into, so old checks each as it stands.
      true,
    );
  }

  // The criteria's words for the boxes one evaluation question offers. Any box the form
  // shows beyond these is reported under its own label, so an extra one is never hidden.
  const QUESTION_FIELD_NAMES: Record<string, string> = {
    question: "question",
    responseguidelines: "guideline",
    guideline: "guideline",
    guidelines: "guideline",
    responsewordlimit: "response_word_limit",
    wordlimit: "response_word_limit",
    score: "maximum_score",
    maximumscore: "maximum_score",
    minimumscore: "minimum_score",
  };

  // The boxes the question at a place in the list (the first is 1) offers, one name per line
  // in the order the form shows them. The step lists each question under its own "Question N"
  // heading, holding Question, Response Guidelines, Response Word Limit, Score and Minimum
  // Score (seen as the administrator on both new forms after "Add Question", and on the
  // seeded closed Sprint With Us and Team With Us opportunities' Opportunity tab, where they
  // are shown disabled). A list with no question at that place reads as nothing.
  // An opportunity's own authored questions, in the order it lists them: the "Opportunity"
  // tab's questions step ("5. Team Questions" on Sprint With Us, "5. Resource Questions" on
  // Team With Us), one "Question N" block per question holding its Question, Response
  // Guidelines, Response Word Limit, Score and Minimum Score boxes (seen as an administrator
  // on the seeded closed opportunities of both programmes). The sidebar link of the same name
  // under OPPORTUNITY EVALUATION is the proponents' scoring table, not this. A reader not
  // offered the Opportunity tab reads nothing.
  function authoredQuestions(where: string, step: string): Promise<string> {
    return inTab(["Opportunity"], async () => {
      if (!(await walkToStep(new RegExp(`^\\d+\\.\\s+${escapeRegExp(step)}$`)))) {
        nothing(`${where} — walked the Opportunity tab's steps and none is "${step}" on ${page.url()}`);
      }
      const questions = seen(page.getByRole("textbox", { name: "Question", exact: true }));
      const guidelines = seen(page.getByRole("textbox", { name: "Response Guidelines", exact: true }));
      const limits = seen(page.getByRole("spinbutton", { name: /Word Limit/ }));
      const scores = seen(page.getByRole("spinbutton", { name: "Score", exact: true }));
      const minimums = seen(page.getByRole("spinbutton", { name: "Minimum Score", exact: true }));
      const valueOf = async (boxes: Locator, i: number): Promise<string> =>
        i < (await boxes.count()) ? (await boxes.nth(i).inputValue().catch(() => "")).trim() : "";
      const blocks: string[] = [];
      const count = await questions.count();
      for (let i = 0; i < count; i++) {
        blocks.push(
          [
            `Question ${i + 1}: ${await valueOf(questions, i)}`,
            `Response Guidelines: ${await valueOf(guidelines, i)}`,
            `Response Word Limit: ${await valueOf(limits, i)}`,
            `Score: ${await valueOf(scores, i)}`,
            `Minimum Score: ${await valueOf(minimums, i)}`,
          ].join("\n"),
        );
      }
      return blocks.join("\n");
    });
  }

  async function evaluationQuestionFields(where: string, step: string, position?: unknown): Promise<string> {
    await ready();
    if (await notFoundShown()) return "";
    const pattern = new RegExp(`^\\d+\\.\\s+${escapeRegExp(step)}$`, "i");
    const onStep = await currentStep();
    if (!onStep || !matches(pattern, (await onStep.innerText()).trim())) {
      if (!(await goToStep(step)) && !(await walkToStep(pattern))) {
        throw new Error(`unbound: ${where} — walked every step of the form and none is "${step}" on ${page.url()}`);
      }
    }
    const given = Number.parseInt(typeof position === "object" && position ? field(position, ...ORDER_KEYS) : String(position ?? ""), 10);
    const place = Number.isFinite(given) && given >= 1 ? given : 1;
    const outline = (await page.getByRole("main").ariaSnapshot()).split("\n");
    const heading = (line: string): number | null => {
      const found = /^\s*-\s*heading\s+"Question\s+(\d+)"/.exec(line);
      return found ? Number(found[1]) : null;
    };
    const start = outline.findIndex((line) => heading(line) === place);
    if (start < 0) return "";
    const names: string[] = [];
    for (const line of outline.slice(start + 1)) {
      if (heading(line) !== null || /^\s*-\s*text:\s*Add Question/.test(line)) break;
      const box = /^\s*-\s*(textbox|spinbutton|combobox|checkbox|radio|slider|switch)\s+"([^"]*)"/.exec(line);
      if (!box) continue;
      const label = bareLabel(box[2]);
      const name = QUESTION_FIELD_NAMES[squash(label)] ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      names.push(name);
    }
    return names.join("\n");
  }

  // The phases a Sprint With Us opportunity runs through, in order. The form asks which to
  // start with and then shows that phase and every later one, each folded under its name.
  const PHASES = ["Inception", "Proof of Concept", "Implementation"];

  // The criteria call the phase between inception and implementation the "prototype"
  // phase; the form calls it "Proof of Concept".
  const PHASE_ALIASES: Record<string, string> = { prototype: "Proof of Concept" };

  function phaseNamed(value: string): string {
    return (
      PHASES.find((phase) => squash(phase) === squash(value)) ??
      PHASE_ALIASES[squash(value).replace(/phase$/, "")] ??
      value
    );
  }

  // The part of the phases step (or a proposal's Team step) between one phase's name and the
  // next phase's name.
  async function phaseBand(phase: string): Promise<{ top: number; bottom: number } | null> {
    const at = async (name: string): Promise<number | null> => {
      const shown = seen(page.getByText(name, { exact: true }));
      const count = await shown.count();
      const chooser = await seen(
        page.getByRole("combobox", { name: labelled("Which phase do you want to start with?") }),
      )
        .first()
        .boundingBox()
        .catch(() => null);
      // A proposal's Team step has no such chooser; a phase name there counts wherever it
      // sits, scrolled above the window or not.
      const below = chooser ? chooser.y + chooser.height : Number.NEGATIVE_INFINITY;
      for (let i = count - 1; i >= 0; i--) {
        const box = await shown.nth(i).boundingBox({ timeout: 500 }).catch(() => null);
        if (box && box.y > below) return box.y;
      }
      return null;
    };
    const top = await at(phase);
    if (top === null) return null;
    let bottom = Number.POSITIVE_INFINITY;
    for (const later of PHASES.slice(PHASES.indexOf(phase) + 1)) {
      const y = await at(later);
      if (y !== null && y > top) bottom = Math.min(bottom, y);
    }
    return { top, bottom };
  }

  async function inBand(locator: Locator, band: { top: number; bottom: number }): Promise<Locator | null> {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const box = await locator.nth(i).boundingBox({ timeout: 500 }).catch(() => null);
      if (box && box.y > band.top && box.y < band.bottom) return locator.nth(i);
    }
    return null;
  }

  // Where something sits on screen, once it has stopped moving: a phase unfolds with an
  // animation, and a control read mid-way is not where it will be clicked.
  // Each reading is bounded: mid-animation the box can drop out of the visible set for a
  // moment, and an unbounded reading would wait out the whole action timeout for it.
  async function steadyBox(locator: Locator): Promise<{ x: number; y: number; width: number; height: number } | null> {
    let before = await locator.boundingBox({ timeout: 500 }).catch(() => null);
    for (let tries = 0; tries < 20 && before; tries++) {
      await page.waitForTimeout(100);
      const now = await locator.boundingBox({ timeout: 500 }).catch(() => null);
      if (now && Math.abs(now.y - before.y) < 0.5 && Math.abs(now.height - before.height) < 0.5) return now;
      before = now;
    }
    return before;
  }

  // A phase unfolded and at rest, its band read again afterwards. Its name toggles it, so it
  // is pressed only while its "Phase Start Date" is not showing, and only once per try.
  async function openPhase(phase: string): Promise<{ top: number; bottom: number } | null> {
    for (let tries = 0; tries < 3; tries++) {
      const band = await phaseBand(phase);
      if (!band) return null;
      const shown = await phaseBox(phase, "Phase Start Date", "textbox");
      if (shown) {
        await steadyBox(shown);
        return (await phaseBand(phase)) ?? band;
      }
      const names = seen(page.getByText(phase, { exact: true }));
      const count = await names.count();
      if (!count) return null;
      await names.nth(count - 1).click();
      await settle();
      for (let wait = 0; wait < 15 && !(await phaseBox(phase, "Phase Start Date", "textbox")); wait++) {
        await page.waitForTimeout(200);
      }
    }
    return null;
  }

  // Which of the form's boxes carrying this label belongs to this phase, counted among the
  // boxes on show: the phase's name heads a section holding its own "Phase Start Date",
  // "Phase Completion Date" and "Maximum Phase Budget", and no other phase's name. A folded
  // phase shows none of its boxes, which reads as -1 (seen as the administrator on a new
  // Sprint With Us form starting at Proof of Concept, with each phase folded and unfolded).
  async function phaseBoxIndex(phase: string, label: string): Promise<number> {
    const others = PHASES.filter((each) => each !== phase);
    return page
      .evaluate(
        ([phase, label, others]) => {
          const bare = (words: string): string => words.replace(/\*\s*$/, "").trim().toLowerCase();
          const shown = (element: Element): boolean =>
            !!((element as HTMLElement).offsetWidth || (element as HTMLElement).offsetHeight || element.getClientRects().length);
          const boxes = Array.from(document.getElementsByTagName("input")).filter(
            (box) => shown(box) && box.labels?.[0] && bare(box.labels[0].textContent ?? "") === bare(label as string),
          );
          const leaves = Array.from(document.body.getElementsByTagName("*")).filter(
            (element) => element.children.length === 0 && shown(element),
          );
          const named = leaves.filter((element) => (element.textContent ?? "").trim() === phase);
          const heading = named[named.length - 1];
          if (!heading) return -1;
          const rivals = leaves.filter((element) => (others as string[]).includes((element.textContent ?? "").trim()));
          let section: Element | null = heading.parentElement;
          while (section && !boxes.some((box) => section!.contains(box))) {
            if (rivals.some((rival) => section!.contains(rival))) return -1;
            section = section.parentElement;
          }
          if (!section || rivals.some((rival) => section!.contains(rival))) return -1;
          const mine = boxes.filter((box) => section!.contains(box));
          return mine.length === 1 ? boxes.indexOf(mine[0]) : -1;
        },
        [phase, label, others] as [string, string, string[]],
      )
      .catch(() => -1);
  }

  async function phaseBox(phase: string, label: string, role: "textbox" | "spinbutton"): Promise<Locator | null> {
    const at = await phaseBoxIndex(phase, label);
    if (at < 0) return null;
    const boxes = seen(page.getByRole(role, { name: labelled(label) }));
    return at < (await boxes.count()) ? boxes.nth(at) : null;
  }

  // The capability chip of this name inside the phase's band, found afresh each time.
  async function capabilityChip(phase: string, name: string): Promise<Locator | null> {
    const band = await phaseBand(phase);
    if (!band) return null;
    return inBand(seen(page.getByText(name, { exact: true })), band);
  }

  // A chosen capability shows "P/T" and "F/T" on its own row.
  async function markBesideChip(chip: Locator, mark: string): Promise<Locator | null> {
    const row = await chip.boundingBox({ timeout: 500 }).catch(() => null);
    if (!row) return null;
    const marks = seen(page.getByText(mark, { exact: true }));
    const count = await marks.count();
    for (let i = 0; i < count; i++) {
      const box = await marks.nth(i).boundingBox({ timeout: 500 }).catch(() => null);
      if (box && Math.abs(box.y + box.height / 2 - (row.y + row.height / 2)) < row.height) return marks.nth(i);
    }
    return null;
  }

  async function chooseCapability(phase: string, name: string, fullTime?: unknown): Promise<boolean> {
    for (let tries = 0; tries < 3; tries++) {
      const chip = await capabilityChip(phase, name);
      if (!chip) return false;
      await steadyBox(chip);
      if (!(await markBesideChip(chip, "P/T"))) {
        await chip.click();
        await settle();
        const again = await capabilityChip(phase, name);
        if (!again || !(await markBesideChip(again, "P/T"))) continue;
      }
      if (fullTime !== undefined) {
        const chosen = await capabilityChip(phase, name);
        const mark = chosen ? await markBesideChip(chosen, saysYes(fullTime) ? "F/T" : "P/T") : null;
        if (mark) {
          await mark.click();
          await settle();
        }
      }
      return true;
    }
    return false;
  }

  // Every phase the form shows needs at least one capability; a phase with none chosen is
  // given the first it lists, so the phase under test decides whether the form will save.
  async function completePhases(): Promise<void> {
    const onStep = await currentStep();
    if (!onStep || !matches(/Phases$/i, (await onStep.innerText()).trim())) return;
    for (const phase of PHASES) {
      if (!(await phaseBand(phase))) continue;
      const band = await openPhase(phase);
      if (!band) continue;
      if (await inBand(seen(page.getByText("P/T", { exact: true })), band)) continue;
      for (const capability of CAPABILITIES) if (await chooseCapability(phase, capability)) break;
    }
  }

  const CAPABILITIES = [
    "Agile Coaching",
    "Backend Development",
    "Delivery Management",
    "DevOps Engineering",
    "Frontend Development",
    "Security Engineering",
    "Technical Architecture",
    "User Experience Design",
    "User Research",
  ];

  // A Sprint With Us opportunity holds its dates only on its phases, so a start or completion
  // date given for the whole opportunity is entered as "Phase Start Date" and "Phase
  // Completion Date" on the phase it starts with: the one the input names, else the one the
  // form already starts with. No phase is ever added that the input does not name.
  const PHASE_DATE_KEYS = ["startDate", "start_date", "completionDate", "completion_date", "endDate", "end_date"];

  function phaseDatesOf(input: unknown): { rest: unknown; phase: Record<string, unknown> | null } {
    if (!input || typeof input !== "object" || Array.isArray(input)) return { rest: input, phase: null };
    const rest = { ...(input as Record<string, unknown>) };
    const phase: Record<string, unknown> = {};
    for (const key of PHASE_DATE_KEYS) {
      if (rest[key] !== undefined && rest[key] !== null) phase[key] = rest[key];
      delete rest[key];
    }
    if (!Object.keys(phase).length) return { rest: input, phase: null };
    const starting = rest.startingPhase ?? rest.starting_phase;
    delete rest.startingPhase;
    delete rest.starting_phase;
    // Only a phase the input names; the caller decides what to do when it names none.
    if (typeof starting === "string" && starting) phase.phase = starting;
    return { rest, phase };
  }

  const PHASE_FIELDS: Record<string, string> = {
    startdate: "Phase Start Date",
    phasestartdate: "Phase Start Date",
    completiondate: "Phase Completion Date",
    enddate: "Phase Completion Date",
    phasecompletiondate: "Phase Completion Date",
    maxbudget: "Maximum Phase Budget",
    budget: "Maximum Phase Budget",
    maximumphasebudget: "Maximum Phase Budget",
  };

  async function addPhase(where: string, input: unknown): Promise<void> {
    const phaseKeys = ["phase", "startingPhase", "name"];
    const phase = phaseNamed(field(input, ...phaseKeys) || asText(input));
    if (!PHASES.includes(phase)) {
      throw new Error(`unbound: ${where} — no phase named "${phase}"; the form offers ${quoted(PHASES)}`);
    }
    const onStep = await currentStep();
    if (!onStep || !matches(/Phases$/i, (await onStep.innerText()).trim())) {
      if (!(await walkToStep(/Phases$/i))) {
        throw new Error(`unbound: ${where} — walked every step of the form and found no Phases step on ${page.url()}`);
      }
    }
    // Start with this phase unless an earlier one is already chosen.
    const chooser = seen(
      page.getByRole("combobox", { name: labelled("Which phase do you want to start with?") }),
    ).first();
    if (!(await chooser.count())) {
      throw new Error(`unbound: ${where} — the Phases step shows no starting-phase chooser on ${page.url()}`);
    }
    let startedAt = -1;
    if (!(await chooserIsEmpty(chooser))) {
      for (let i = 0; i < PHASES.length && startedAt < 0; i++) {
        if (await phaseBand(PHASES[i])) startedAt = i;
      }
    }
    if (startedAt < 0 || startedAt > PHASES.indexOf(phase)) {
      await pickOption(where, chooser, phase);
      await settle();
    }
    if (!(await phaseBand(phase))) {
      throw new Error(`unbound: ${where} — "${phase}" is not shown on the Phases step at ${page.url()}`);
    }
    let band = await openPhase(phase);
    if (!band) {
      throw new Error(`unbound: ${where} — opened "${phase}" on the Phases step but no "Phase Start Date" appeared on ${page.url()}`);
    }
    const record =
      input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    const unplaced: string[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (value === undefined || value === null || phaseKeys.includes(key)) continue;
      const label = PHASE_FIELDS[squash(key)];
      if (label) {
        const role = /budget/i.test(label) ? "spinbutton" : "textbox";
        // The box is found inside the phase's own section, never by where it sits on screen,
        // so one phase's dates never land in another's; a phase that folded is reopened.
        let box = await phaseBox(phase, label, role);
        if (!box) {
          band = (await openPhase(phase)) ?? band;
          box = await phaseBox(phase, label, role);
        }
        if (!box) {
          unplaced.push(key);
          continue;
        }
        let text = asText(value);
        const day = /^\d{4}-\d{2}-\d{2}/.exec(text);
        if (day && role === "textbox") text = day[0];
        await box.fill(text);
        entered();
        await box.blur().catch(() => undefined);
        // Once the test gives a phase its dates, the phases' dates are the test's alone: none
        // is ever made up for another phase. A budget is not recorded so: every phase carries
        // the same label, and the other phases' budgets still need a value.
        if (role === "textbox") namedLabels.add(squash(label));
        continue;
      }
      if (/capabilit/i.test(key)) {
        for (const item of Array.isArray(value) ? value : [value]) {
          const name = typeof item === "string" ? item : field(item, "capability", "name");
          if (!name) continue;
          const time =
            item && typeof item === "object"
              ? (item as Record<string, unknown>).fullTime ?? (item as Record<string, unknown>).full_time
              : undefined;
          band = (await openPhase(phase)) ?? band;
          if (!(await chooseCapability(phase, name, time))) unplaced.push(`${key}: ${name}`);
        }
        continue;
      }
      unplaced.push(key);
    }
    await settle();
    if (unplaced.length) {
      throw new Error(`unbound: ${where} — no field for "${phase}" on the Phases step takes ${quoted(unplaced)}`);
    }
  }

  const opportunityCwuCreate: S.OpportunityCwuCreatePage = {
    ...opportunityCreate("opportunity-cwu-create", "/opportunities/code-with-us/create"),
    addAttachment: (input) => addAttachment("opportunity-cwu-create.add_attachment", input),
  };

  const opportunitySwuCreate: S.OpportunitySwuCreatePage = {
    ...opportunityCreate("opportunity-swu-create", "/opportunities/sprint-with-us/create", true),
    addPhase: (input) => addPhase("opportunity-swu-create.add_phase", input),
    addTeamQuestion: (input) =>
      addQuestion("opportunity-swu-create.add_team_question", "Team Questions", input),
    setEvaluationPanel: (input) =>
      setEvaluationPanel("opportunity-swu-create.set_evaluation_panel", input),
    // The weights and their total are on the Scoring step, wherever publishing left the
    // form, so the refusal is gathered from every step.
    scoreWeightError: () => stepMessages(/100%|weight/i),
    evaluationQuestionFields: (position?: unknown) =>
      evaluationQuestionFields("opportunity-swu-create.evaluation_question_fields", "Team Questions", position),
  };

  const opportunityTwuCreate: S.OpportunityTwuCreatePage = {
    ...opportunityCreate("opportunity-twu-create", "/opportunities/team-with-us/create"),
    // The step opens with "Resource 1" already there and empty.
    addResource: (input) =>
      fillSlot(
        "opportunity-twu-create.add_resource",
        /Resource Details$/i,
        "Resource",
        "Add a Resource",
        async (slot) => {
          const box = seen(page.getByRole("combobox", { name: labelled("Service Area") })).nth(slot);
          return (await box.count()) > 0 && (await chooserIsEmpty(box));
        },
        input,
      ),
    addResourceQuestion: (input) =>
      addQuestion("opportunity-twu-create.add_resource_question", "Resource Questions", input),
    setEvaluationPanel: (input) =>
      setEvaluationPanel("opportunity-twu-create.set_evaluation_panel", input),
    // The weights and their total are on the Scoring step, wherever publishing left the
    // form, so the refusal is gathered from every step.
    scoreWeightError: () => stepMessages(/100%|weight/i),
    evaluationQuestionFields: (position?: unknown) =>
      evaluationQuestionFields("opportunity-twu-create.evaluation_question_fields", "Resource Questions", position),
  };

  // The panel is a list of evaluator slots plus a chair. More slots are added one at a
  // time, and each slot picks a public sector person by name. On the creation forms the
  // panel is its own step, reached directly wherever the form was left.
  async function setEvaluationPanel(where: string, input: unknown): Promise<void> {
    const record =
      input && typeof input === "object" && !Array.isArray(input)
        ? (input as Record<string, unknown>)
        : {};
    const picks = panelPicks(input);
    // A chair named for the whole panel, as opposed to a flag on the one member given.
    const chair =
      record.member === undefined && record.chair && typeof record.chair !== "boolean" && !isYesNo(record.chair)
        ? personKey(record.chair)
        : "";
    if (!(await goToStep("Evaluation Panel"))) await advanceTo(where, "Panel Member");
    const slots = panelSlots();
    for (let i = 0; i < picks.length; i++) {
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
      await pickPanelMember(where, slots.nth(i), picks[i].key);
      if (picks[i].chair) await tickChairAt(i);
    }
    if (chair) await makeChair(where, chair);
    else if (namesNoChair(input)) await clearChair(where);
  }

  // An input saying the panel is to have no chair: a chair given as nothing, or a member to
  // chair given as nothing.
  function namesNoChair(input: unknown): boolean {
    if (input === null) return true;
    if (!input || typeof input !== "object" || Array.isArray(input)) return false;
    const record = input as Record<string, unknown>;
    for (const key of ["chair", "member", "user", "panelChair"]) {
      if (key in record && record[key] === null) return true;
    }
    return false;
  }

  // Nobody chairs: every "Panel Chair" box is unticked and the "Chair" chooser emptied.
  async function clearChair(where: string): Promise<void> {
    const boxes = seen(page.getByRole("checkbox", { name: "Panel Chair", exact: true }));
    const count = await boxes.count();
    for (let i = 0; i < count; i++) {
      if (await boxes.nth(i).isChecked()) {
        await boxes.nth(i).click();
        await settle();
      }
    }
    const chooser = seen(page.getByRole("combobox", { name: labelled("Chair") }));
    if (!(await chooser.count())) {
      if (!count) nothing(`${where} — neither a "Panel Chair" box nor a "Chair" chooser on ${page.url()}`);
      return;
    }
    if (await chooserIsEmpty(chooser.first())) return;
    await chooser.first().click();
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Escape").catch(() => undefined);
    await settle();
    if (!(await chooserIsEmpty(chooser.first()))) {
      nothing(`${where} — cleared the "Chair" chooser with Backspace but it still names a chair on ${page.url()}`);
    }
  }

  // The chooser names each person "Name (email)". A test names them as a seed user, a
  // persona, an identifier or an address, and each of those comes down to the address.
  type SeedUser = { id: string; email: string | null; persona?: string; account_type: string };
  const SEED_USERS = Object.values(seed.users) as ReadonlyArray<SeedUser>;

  function seedUserFor(key: string): SeedUser | undefined {
    const wanted = key.toLowerCase();
    return SEED_USERS.find(
      (user) => user.id === key || user.persona === key || (user.email ?? "").toLowerCase() === wanted,
    );
  }

  function personKey(value: unknown): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return seedUserFor(value)?.email ?? value;
    if (typeof value !== "object" || Array.isArray(value)) return "";
    const record = value as Record<string, unknown>;
    if (typeof record.email === "string" && record.email) return record.email;
    for (const key of ["user", "member", "person"]) {
      const found = personKey(record[key]);
      if (found) return found;
    }
    if (typeof record.id === "string" && record.id) return personKey(record.id);
    if (typeof record.name === "string" && record.name) return record.name;
    return "";
  }

  // The people an action names, each with whether they are to chair.
  function panelPicks(input: unknown): { key: string; chair: boolean }[] {
    const record =
      input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    let listed: unknown = record.members ?? record.evaluators ?? record.panel;
    if (listed === undefined && record.member !== undefined) listed = [{ member: record.member, chair: record.chair }];
    if (listed === undefined && (typeof input === "string" || Array.isArray(input))) listed = input;
    if (listed === undefined && (typeof record.email === "string" || typeof record.id === "string")) listed = [input];
    const items = Array.isArray(listed) ? listed : listed === undefined ? [] : [listed];
    return items
      .map((item) => {
        const flags = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return { key: personKey(item), chair: saysYes(flags.chair) };
      })
      .filter((pick) => pick.key);
  }

  function panelSlots(): Locator {
    return seen(page.getByRole("combobox", { name: "Panel Member", exact: false }));
  }

  async function pickPanelMember(where: string, box: Locator, key: string): Promise<void> {
    const wanted = seen(page.getByRole("option", { name: new RegExp(escapeRegExp(key), "i") }));
    await box.click();
    await box.fill(key).catch(() => page.keyboard.type(key));
    await wanted.first().waitFor({ state: "visible", timeout: 4000 }).catch(() => undefined);
    if (!(await wanted.count())) {
      // The typed words may not filter by address; look through the whole list instead.
      await box.fill("").catch(() => undefined);
      await wanted.first().waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
    }
    if (!(await wanted.count())) {
      await page.keyboard.press("Escape").catch(() => undefined);
      // Only public sector people are offered: a vendor left out is the page refusing them, and
      // that refusal is reported rather than passed off as the member having been added.
      if (seedUserFor(key)?.account_type === "VENDOR") {
        throw new Error(
          `${where} — the panel chooser on ${page.url()} offers only public sector people and has no entry for the vendor "${key}", so they cannot be added to the panel`,
        );
      }
      throw new Error(`unbound: ${where} — the panel chooser offers nobody matching "${key}" on ${page.url()}`);
    }
    await wanted.first().click();
    await settle();
  }

  async function tickChairAt(slot: number): Promise<void> {
    const boxes = seen(page.getByRole("checkbox", { name: "Panel Chair", exact: true }));
    if (slot >= (await boxes.count())) return;
    if (!(await boxes.nth(slot).isChecked())) await boxes.nth(slot).click();
    await settle();
  }

  // A member joins the first slot still empty, or a new one "Add an evaluator" makes.
  async function addPanelMember(where: string, input: unknown): Promise<void> {
    if (!(await editingPanel(where))) return;
    const picks = panelPicks(input);
    if (!picks.length) {
      throw new Error(`unbound: ${where} — no panel member was named in ${JSON.stringify(input)}`);
    }
    const slots = panelSlots();
    for (const pick of picks) {
      const members = await panelMembers();
      let at = members.findIndex((member) => member.name === "" || matches(/^Panel Member\*?$/, member.name));
      if (at < 0 || at >= (await slots.count())) {
        const before = await slots.count();
        const more = await findControl(page, "Add an evaluator");
        if (!more) nothing(`${where} — the panel is full and offers no "Add an evaluator" on ${page.url()}`);
        await more.click();
        await settle();
        if ((await slots.count()) <= before) {
          nothing(`${where} — "Add an evaluator" made no new slot on ${page.url()}`);
        }
        at = before;
      }
      await pickPanelMember(where, slots.nth(at), pick.key);
      if (pick.chair) await tickChairAt(at);
    }
  }

  // Each slot of a panel larger than two carries "Remove this evaluator": an icon and those
  // words drawn as one control with no button role, under the slot's "Panel Chair" box. A
  // panel of two shows none, and that absence is the refusal.
  async function removePanelMember(where: string, input: unknown): Promise<void> {
    if (!(await editingPanel(where))) return;
    const members = await panelMembers();
    const key = personKey(input);
    const at = key
      ? members.findIndex((member) => member.name.toLowerCase().includes(key.toLowerCase()))
      : Math.min(indexOf(input), members.length - 1);
    if (at < 0) nothing(`${where} — the panel lists nobody matching "${key}" on ${page.url()}`);
    const top = await seen(page.getByRole("heading", { name: new RegExp(`^Evaluator ${at + 1}$`) }))
      .first()
      .boundingBox()
      .catch(() => null);
    const after = await seen(page.getByRole("heading", { name: new RegExp(`^(Evaluator ${at + 2}|Panel Chair)$`) }))
      .first()
      .boundingBox()
      .catch(() => null);
    if (!top) nothing(`${where} — no "Evaluator ${at + 1}" slot on ${page.url()}`);
    const bottom = after ? after.y : Number.POSITIVE_INFINITY;
    const label = await inBand(seen(page.getByText("Remove this evaluator", { exact: true })), {
      top: top.y,
      bottom,
    });
    if (!label) return;
    const before = await panelSlots().count();
    await label.click();
    await settle();
    if ((await panelSlots().count()) >= before) {
      nothing(`${where} — pressed "Remove this evaluator" in the "Evaluator ${at + 1}" slot but the panel still has ${before} slots on ${page.url()}`);
    }
  }

  // A vendor looking at an open opportunity is offered "Start Proposal" twice: a link in the
  // top bar and another in the page's header, both leading to the opportunity's
  // "/proposals/create" (seen as vendors 1, 2, 5 and 8 on the seeded published Code With Us
  // opportunity; neither shows for a visitor, public sector staff or an administrator). The
  // links are drawn once the opportunity and the session have loaded, which on a slow target
  // takes longer than the other top-bar controls, so they are waited for longer. When neither
  // comes, the reason says what the page did show, so a page shown to the wrong person or an
  // opportunity not open reads as that rather than as a missing control.
  async function startProposal(where: string): Promise<void> {
    await ready();
    const starters = seen(page.getByRole("link", { name: "Start Proposal", exact: true }))
      .or(seen(page.getByRole("button", { name: "Start Proposal", exact: true })));
    await starters.first().waitFor({ state: "visible", timeout: 15000 }).catch(() => undefined);
    if (await starters.count()) {
      const inBar = seen(navBar().getByRole("link", { name: "Start Proposal", exact: true }));
      const control = (await inBar.count()) ? inBar.first() : starters.first();
      if (await isDisabled(control)) {
        throw new Error(`${where} — "Start Proposal" is disabled on ${page.url()}`);
      }
      await control.click({ timeout: CLICK_MS });
      await settle();
      return;
    }
    // A vendor who already holds a proposal on the opportunity is offered "View Proposal" in
    // the same two places instead (vendor 1 on an opportunity published during a run, after a
    // proposal of theirs was made on it). The application keeps one proposal per person per
    // opportunity, and this is its one way on from here to that vendor's proposal.
    const viewers = seen(page.getByRole("link", { name: "View Proposal", exact: true }));
    if (await viewers.count()) {
      const inBar = seen(navBar().getByRole("link", { name: "View Proposal", exact: true }));
      await ((await inBar.count()) ? inBar.first() : viewers.first()).click({ timeout: CLICK_MS });
      await settle();
      return;
    }
    const barText = ((await navBar().innerText().catch(() => "")) || "").replace(/\s*\n\s*/g, " | ");
    const signedIn = /@/.test(barText) ? "signed in" : "not signed in";
    const status = (await linesMatching(/^(Open|Closed|Draft|Under Review|Evaluation|Awarded|Suspended|Cancel+ed)$/i).catch(() => "")) || "no status shown";
    const proposalLinks = seen(page.getByRole("link", { name: /proposal/i }));
    const others = (await proposalLinks.allInnerTexts().catch(() => [])).map((each) => each.trim()).filter(Boolean);
    throw new Error(
      `unbound: ${where} — waited 15s for a "Start Proposal" link in the top bar or the page header on ${page.url()} and none came; the page is ${
        (await notFoundShown()) ? "showing Not Found" : `showing status "${status.replace(/\n/g, ", ")}"`
      }, ${signedIn} (top bar: ${barText || "empty"})${others.length ? `, proposal links shown: ${others.join(", ")}` : ""}`,
    );
  }

  // The three public opportunity pages share their shape; only the money and the middle
  // of the page differ by programme.
  function opportunityView(where: string, route: string, programme: string) {
    return {
      ...at(route),
      toggleWatch: () => press(`${where}.toggle_watch`, ["Watch", "Watching", "Unwatch"]),
      startProposal: () => startProposal(`${where}.start_proposal`),
      opportunityIdentifier: async () => opportunityId(),
      // The header reads "Published <date>" above the title, beside "Updated <date>".
      publishedDate: () => linesMatching(/^Published\s/),
      // The public page names nobody: its header carries only the published and updated
      // dates, whoever reads it (looked at again as an administrator on the seeded published
      // Code With Us and open Sprint With Us opportunities). Who made an opportunity is shown
      // on its management page. The page is reached and simply carries no creator, so it
      // reads as nothing; a screen that failed to open is still reported.
      createdByName: async (): Promise<string> => {
        await ready();
        if (await notFoundShown()) return "";
        if (!(await currentHeading())) {
          nothing(`${where}.created_by_name — the opportunity page did not open at ${page.url()}`);
        }
        return valueAfter(["Created By"]);
      },
      // Likewise nobody who changed it: only the updated date is shown.
      lastChangedByName: async (): Promise<string> => {
        await ready();
        if (await notFoundShown()) return "";
        if (!(await currentHeading())) {
          nothing(`${where}.last_changed_by_name — the opportunity page did not open at ${page.url()}`);
        }
        return valueAfter(["Updated By", "Last Changed By"]);
      },
      // The badge sits directly under the programme's name in the page header.
      status: () => valueAfter([programme]),
      // The header states the deadline with its time ("Closes Jun 1, 2030 at 4:59 PM PDT");
      // the figure beside "Proposal Deadline" carries the date alone. Team With Us calls its
      // deadline the "Closing Date".
      proposalDeadline: async () =>
        (await linesMatching(/^Close[sd]\b/)) ||
        valueBefore(["Proposal Deadline", "Proposals Deadline", "Closing Date"]),
      // The view's tabs are list items, the Addenda one carrying its count before its name.
      addenda: async () => {
        await ready();
        const tab = seen(page.getByRole("listitem").filter({ hasText: /Addenda\s*$/ }));
        if (!(await tab.count())) return "";
        await tab.last().click();
        await settle();
        return contentText();
      },
      // An awarded opportunity names its winner in the banner above its header: "This
      // opportunity was awarded to Northern Pines Digital Ltd.." on the seeded awarded Code
      // With Us opportunity, the sentence's own full stop after the name's. A labelled value
      // is read where a page carries one instead.
      successfulProponent: async () => {
        await ready();
        const named = await findAfter(["Successful Proponent", "Awarded To"]);
        if (named) return named;
        const banner = (await textLines()).find((line) => matches(/awarded to\s+\S/i, line));
        if (banner) {
          const name = /awarded to\s+(.+)$/i.exec(banner)?.[1] ?? "";
          return name.replace(/\.$/, "").trim();
        }
        return linesMatching(/successful proponent/i);
      },
      // An awarded opportunity announces its winner in a banner above the header ("This
      // opportunity was awarded to <name>."), the lines up to "Published <date>" being all
      // it says about them. Seen as an administrator on the seeded awarded Code With Us and
      // Sprint With Us opportunities, the banner carries the name alone, so what is read
      // here is whatever else the banner says of that kind — for this target, nothing.
      successfulProponentContactDetails: async () =>
        (await awardBanner(`${where}.successful_proponent_contact_details`))
          .filter((line) => matches(/@|\bphone\b|\bcontact\b|\+?\d[\d ()-]{6,}\d/i, line))
          .join("\n"),
      successfulProponentScore: async () =>
        (await awardBanner(`${where}.successful_proponent_score`))
          .filter((line) => matches(/score|points|\d+(\.\d+)?\s*%/i, line))
          .join("\n"),
    };
  }

  // The lines of an awarded opportunity's banner after the sentence naming the winner.
  // A page that loaded without such a banner — not awarded, or not shown to this reader —
  // has nothing to say about the winner.
  async function awardBanner(where: string): Promise<string[]> {
    await ready();
    if (await notFoundShown()) nothing(`${where} — the opportunity answers "Not Found" on ${page.url()}`);
    const lines = await textLines();
    const start = lines.findIndex((line) => matches(/awarded to\s/i, line));
    if (start < 0) return [];
    const said: string[] = [];
    for (let i = start + 1; i < lines.length && !matches(/^Published\s/, lines[i]); i++) said.push(lines[i]);
    return said;
  }

  // A fixed page the opportunity embeds, shown under a tab of the public view: the body
  // between the tab's own heading and the "Got Questions?" that closes every tab.
  async function embeddedSection(where: string, tab: string): Promise<string> {
    await ready();
    if (await notFoundShown()) nothing(`${where} — the opportunity answers "Not Found" on ${page.url()}`);
    const item = seen(page.getByRole("listitem").filter({ hasText: new RegExp(`^\\s*${escapeRegExp(tab)}\\s*$`) }));
    if (!(await item.count())) return "";
    await item.last().click();
    await settle();
    const lines = await textLines();
    const start = lines.lastIndexOf(tab);
    if (start < 0) return "";
    const body: string[] = [];
    for (let i = start + 1; i < lines.length && lines[i] !== "Got Questions?"; i++) body.push(lines[i]);
    return body.join("\n");
  }

  // All three programmes label their money "Value", so a programme's figure is read only
  // from a page whose badge names that programme. Another programme's page, or the
  // "Not Found" screen a withheld record shows, has no such figure and reads as nothing.
  async function programmeValue(programme: string, labels: string[]): Promise<string> {
    if (!(await textLines()).includes(programme)) return "";
    return valueBefore(labels);
  }

  // The public page's header draws each date above its label ("Jun 14, 2030" over
  // "Assignment Date"), read as the screen shows it. A withheld record's "Not Found" screen
  // carries no dates and reads as nothing.
  async function viewDate(labels: string[]): Promise<string> {
    await ready();
    if (await notFoundShown()) return "";
    return valueBefore(labels);
  }

  // A Team With Us page also lists its dates under "Key Dates" on the Details tab, one line
  // each ("Contract Completion Date (Anticipated) Jan 26, 2027") — the only place the
  // completion date is shown. The header's own figure is read first where there is one.
  async function keyDate(labels: string[], name: string): Promise<string> {
    const shown = await viewDate(labels);
    if (shown) return shown;
    if (await notFoundShown()) return "";
    const pattern = new RegExp(`^${escapeRegExp(name)}(?:\\s*\\(Anticipated\\))?\\s+(.+)$`, "i");
    const listed = async (): Promise<string> => {
      for (const line of await textLines()) {
        const found = pattern.exec(line);
        if (found) return found[1].trim();
      }
      return "";
    };
    const here = await listed();
    if (here) return here;
    // An earlier reader may have left another of the view's tabs open.
    const details = seen(page.getByRole("listitem").filter({ hasText: /^\s*Details\s*$/ }));
    if (!(await details.count())) return "";
    await details.first().click();
    await settle();
    return listed();
  }

  // The management screen's Opportunity tab is the creation wizard, its dates boxes on one of
  // its steps ("3. Details" for Code With Us, "2. Overview" for the other two), each holding
  // the day as YYYY-MM-DD. The steps are walked until the box labelled for the date is up.
  // A reader not offered the tab, or a form with no such box, is shown no such date.
  async function wizardDate(where: string, labels: string[]): Promise<string> {
    await ready();
    if (await notFoundShown()) return "";
    const pattern = new RegExp(`^\\s*(${labels.map(escapeRegExp).join("|")})\\s*\\*?\\s*$`);
    const box = (): Locator => seen(page.getByLabel(pattern));
    if (!(await box().count()) && !(await currentStep())) {
      if (!(await enterTab(["Opportunity"]))) return "";
    }
    if (!(await box().count())) {
      if (!(await currentStep())) {
        nothing(`${where} — opened the Opportunity tab but no wizard step or ${quoted(labels)} box is on ${page.url()}`);
      }
      await walkSteps(async () => (await box().count()) > 0);
    }
    if (!(await box().count())) return "";
    return (await box().first().inputValue().catch(() => "")).trim();
  }

  const opportunityCwuView: S.OpportunityCwuViewPage = {
    ...opportunityView(
      "opportunity-cwu-view",
      "/opportunities/code-with-us/:opportunityId",
      "Code With Us",
    ),
    reward: () => programmeValue("Code With Us", ["Value", "Fixed-Price Award", "Reward"]),
    assignmentDate: () => viewDate(["Assignment Date"]),
    startDate: () => viewDate(["Work Start Date", "Proposed Start Date", "Start Date"]),
  };

  const opportunitySwuView: Open<S.OpportunitySwuViewPage> = {
    ...opportunityView(
      "opportunity-swu-view",
      "/opportunities/sprint-with-us/:opportunityId",
      "Sprint With Us",
    ),
    totalMaxBudget: () =>
      programmeValue("Sprint With Us", ["Total Maximum Budget", "Maximum Budget", "Value"]),
    phases: () => sectionFrom(["Phases of Work", "Phases"], ["Addenda", "Attachments"]),
    // The scope page is embedded under the "Scope & Contract" tab.
    scopeSection: () => embeddedSection("opportunity-swu-view.scope_section", "Scope & Contract"),
    assignmentDate: () => viewDate(["Assignment Date"]),
    // The page raises its notices as alerts above the header ("This opportunity was awarded
    // to Northern Pines Digital Ltd.." on the seeded awarded one); the seeded closed one,
    // read as vendor 1 with and without its "Scope & Contract" tab open, shows none. The
    // observation is the messages shown outside the screen's own sections, so an alert drawn
    // inside one of them is left out: the tabbed region (the tab list "Details | Scope &
    // Contract | Attachments | Addenda" and the body under it, which scope_section and
    // addenda read), the "Budget" block and the "Phases of Work" block. Each region is the
    // widest part of the page around its tab list or heading that still leaves out the
    // opportunity's title, which on both seeded pages is the whole block and nothing of the
    // header or the award notice above it. Every other alert is read wherever it is drawn,
    // one per line in page order, so a notice a failed read raises late — after the
    // sections, or after the footer — is caught too.
    pageMessages: async () => {
      await ready();
      if (await notFoundShown()) {
        nothing(`opportunity-swu-view.page_messages — the opportunity answers "Not Found" on ${page.url()}`);
      }
      const title = seen(page.getByRole("heading", { level: 2 })).first();
      if (!(await currentHeading()) || !(await title.count())) {
        nothing(`opportunity-swu-view.page_messages — the opportunity page did not open at ${page.url()}`);
      }
      const titleHandle = await title.elementHandle();
      const tabList = seen(page.getByRole("list")).filter({
        has: page.getByRole("listitem").filter({ hasText: /^\s*Scope & Contract\s*$/ }),
      });
      const sectionHeadings = seen(
        page.getByRole("heading", { name: /^\s*(Budget|Phases of Work|Phases|Attachments|Addenda)\s*$/ }),
      );
      const anchors = [...(await tabList.elementHandles()), ...(await sectionHeadings.elementHandles())];
      const alerts = seen(page.getByRole("alert"));
      const count = await alerts.count();
      const found: string[] = [];
      for (let i = 0; i < count; i++) {
        const alert = alerts.nth(i);
        const inSection = await alert
          .evaluate(
            (element, [heading, marks]) =>
              (marks as Element[]).some((mark) => {
                let region: Element = mark;
                while (region.parentElement && !region.parentElement.contains(heading as Element)) {
                  region = region.parentElement;
                }
                return region.contains(element);
              }),
            [titleHandle, anchors] as const,
          )
          .catch(() => false);
        if (inSection) continue;
        const words = (await alert.innerText().catch(() => "")).trim();
        if (words && !found.includes(words)) found.push(words);
      }
      return found.flatMap((words) => words.split("\n").map((line) => line.trim())).filter(Boolean).join("\n");
    },
  };

  const opportunityTwuView: Open<S.OpportunityTwuViewPage> = {
    ...opportunityView(
      "opportunity-twu-view",
      "/opportunities/team-with-us/:opportunityId",
      "Team With Us",
    ),
    maxBudget: () =>
      programmeValue("Team With Us", ["Maximum Contract Value", "Maximum Budget", "Value"]),
    // The resources sought are listed under "Service Areas" with their allocation.
    resources: () => sectionFrom(["Service Areas"], ["Required Skills", "Addenda"]),
    // The Team With Us terms are embedded under the "Competition Rules" tab.
    termsSection: () => embeddedSection("opportunity-twu-view.terms_section", "Competition Rules"),
    assignmentDate: () => keyDate(["Contract Award Date"], "Contract Award Date"),
    startDate: () => keyDate(["Contract Start Date"], "Contract Start Date"),
    completionDate: () => keyDate(["Contract Completion Date"], "Contract Completion Date"),
  };

  // The management pages share a sidebar of tabs and an Actions menu.
  function opportunityEdit(where: string, route: string) {
    return {
      ...at(route),
      // Editing reopens the creation wizard in place; what the test gave is entered and
      // saved with the control the top bar offers for this opportunity's state.
      editDetails: async (input?: unknown) => {
        // A reader offered no Edit — an author on their published opportunity — is refused,
        // and that refusal is what the test reads next.
        if (!(await fromActionsIfOffered(`${where}.edit_details`, ["Edit"]))) return;
        await settle();
        if (!entriesOf(input, ATTACHMENT_KEYS).length && !hasFiles(input)) return;
        await fillForm(`${where}.edit_details`, input, { skip: ATTACHMENT_KEYS });
        if (hasFiles(input)) await addAttachment(`${where}.edit_details`, input);
        const saves = ["Publish Changes", "Save Changes", "Submit Changes for Review", "Save Draft"];
        await press(`${where}.edit_details`, saves, navBar());
        await confirmIfAsked(`${where}.edit_details`, saves);
        await saved(saves);
      },
      // What the Actions menu offers changes with the record's state and the reader: a
      // draft offers no Cancel, an incomplete draft's Publish is disabled. An entry missing
      // or disabled is that refusal, which the test reads next, so nothing is attempted.
      submitForReview: async () => {
        if (!(await fromActionsIfOffered(`${where}.submit_for_review`, ["Submit for Review"]))) return;
        await confirmIfAsked(`${where}.submit_for_review`, [
          "Submit for Review",
          "Submit Opportunity",
        ]);
      },
      publish: async () => {
        if (!(await fromActionsIfOffered(`${where}.publish`, ["Publish"]))) return;
        await confirmIfAsked(`${where}.publish`, ["Publish Opportunity", "Publish"]);
      },
      cancelOpportunity: async () => {
        if (!(await fromActionsIfOffered(`${where}.cancel_opportunity`, ["Cancel"]))) return;
        await confirmIfAsked(`${where}.cancel_opportunity`, ["Cancel Opportunity"]);
      },
      deleteOpportunity: async () => {
        if (!(await fromActionsIfOffered(`${where}.delete_opportunity`, ["Delete"]))) return;
        await confirmIfAsked(`${where}.delete_opportunity`, ["Delete Opportunity"]);
      },
      // A draft has no Addenda tab; that absence is the refusal.
      addAddendum: async (input?: unknown) => {
        if (!(await enterTab(["Addenda"]))) return;
        await press(`${where}.add_addendum`, ["Add Addendum"], navBar());
        const words = field(input, "text", "body", "addendum", "description") || asText(input);
        if (words) {
          await fill(`${where}.add_addendum`, ["Addendum", "Description"], words);
          // An addendum the form will not take keeps "Publish Addendum" disabled: the refusal.
          // The unsaved addendum is put away and nothing is published.
          const publishing = await findControl(navBar(), "Publish Addendum");
          if (publishing && (await isDisabled(publishing))) {
            const cancel = await findControl(navBar(), "Cancel");
            if (cancel) {
              await cancel.click();
              await settle();
            }
            return;
          }
          await press(`${where}.add_addendum`, ["Publish Addendum", "Publish", "Save"], navBar());
          await confirmDialog(`${where}.add_addendum`, ["Publish Addendum", "Publish"]);
        }
      },
      opportunityIdentifier: async () => opportunityId(),
      createdByName: () => valueAfter(["Created By"]),
      lastChangedByName: () => latestHistoryAuthor(`${where}.last_changed_by_name`),
      summaryTab: () => tabContent(["Summary"]),
      // The tab is the creation wizard shown one step at a time, so every step is read.
      opportunityTab: () => inTab(["Opportunity"], everyStepText),
      addendaTab: () => tabContent(["Addenda"]),
      // The History tab's table rows alone (entry type, note, when and by whom): the screen
      // around it carries the opportunity's own title, which is no history entry.
      historyTab: () =>
        inTab(["History"], async () => {
          await seen(page.getByRole("table")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
          return tableRows(false);
        }),
      // Whether the History tab offers any way to add a note: a text entry, a file to attach,
      // or a control to add or save one. Seen as the author (Code With Us) and as an
      // administrator (Sprint With Us), the tab holds the "History" heading and its table and
      // nothing else, which reads "false".
      noteControlOffered: () => noteControlOffered(`${where}.note_control_offered`),
      // Before an opportunity closes the tab withholds every proposal, showing only a notice
      // that they will be displayed later; that withholding reads as nothing.
      proposalsTab: () =>
        inTab(["Proposals"], async () => {
          const text = await contentText();
          const withheld = matches(/Proposals will be displayed here once this opportunity has closed/i, text);
          return withheld && !(await seen(page.getByRole("table")).count()) ? "" : text;
        }),
    };
  }

  // The controls in the top bar besides the site's own links and the signed-in address,
  // with an Actions menu read out entry by entry in place of its toggle.
  async function topBarControls(): Promise<string[]> {
    const bar = navBar();
    const siteLinks = new Set<string>();
    const links = seen(bar.getByRole("link"));
    for (let i = 0; i < (await links.count()); i++) {
      siteLinks.add((await links.nth(i).innerText()).trim());
    }
    const lines = (await bar.innerText())
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "|" && !siteLinks.has(line) && !line.includes("@"));
    const found: string[] = [];
    for (const line of lines) {
      if (line !== "Actions") {
        found.push(line);
        continue;
      }
      for (const entry of (await actionsMenuText()).split("\n")) if (entry.trim()) found.push(entry.trim());
      await closeActionsMenu();
    }
    return found;
  }

  // Every change of state the management screen offers this reader from where the
  // opportunity stands, gathered from the top bar of each of its tabs in turn: the
  // Opportunity tab offers "Cancel" and its Actions menu, the Consensus tab "Finalize
  // Consensus Scores", and so on. Awarding is offered on a proposal's own screen, not here.
  async function offeredStateChanges(where: string): Promise<string> {
    await ready();
    if (await notFoundShown()) nothing(`${where} — the opportunity answers "Not Found" on ${page.url()}`);
    const home = page.url();
    // The screen's own tabs only: the consensus tab also links each proponent's sheet,
    // which is an address of its own ending in "/edit?tab=".
    const own = `${new URL(home).pathname}?tab=`;
    const tabs: string[] = [];
    const links = seen(page.getByRole("link"));
    for (let i = 0; i < (await links.count()); i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      const path = href ? new URL(href, home).pathname + new URL(href, home).search : "";
      if (path.startsWith(own) && !tabs.includes(href)) tabs.push(href);
    }
    const offered: string[] = [];
    for (const href of tabs.length ? tabs : [home]) {
      await page.goto(new URL(href, home).toString(), { waitUntil: "domcontentloaded" });
      await ready();
      for (const control of await topBarControls()) if (!offered.includes(control)) offered.push(control);
    }
    await page.goto(home, { waitUntil: "domcontentloaded" });
    await ready();
    return offered.join("\n");
  }

  const opportunityCwuEdit: S.OpportunityCwuEditPage = {
    ...opportunityEdit("opportunity-cwu-edit", "/opportunities/code-with-us/:opportunityId/edit"),
    reportingViews: () => reportFigure(["Total Views", "Views"]),
    reportingWatchers: () => reportFigure(["Watching", "Watchers"]),
    reportingProposals: () => reportFigure(["Proposals"]),
    proposalDeadline: () => wizardDate("opportunity-cwu-edit.proposal_deadline", ["Proposal Deadline"]),
    assignmentDate: () => wizardDate("opportunity-cwu-edit.assignment_date", ["Assignment Date"]),
    startDate: () => wizardDate("opportunity-cwu-edit.start_date", ["Proposed Start Date", "Start Date"]),
    completionDate: () => wizardDate("opportunity-cwu-edit.completion_date", ["Completion Date"]),
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
    // The opportunity's own team questions, in the order it lists them: the "Opportunity"
    // tab's "5. Team Questions" step, one "Question N" block per question holding its
    // Question, Response Guidelines, Response Word Limit, Score and Minimum Score boxes (seen
    // as an administrator on the seeded closed Sprint With Us opportunity). The sidebar's
    // "Team Questions" under OPPORTUNITY EVALUATION is the proponents' scoring table, not
    // this. A reader not offered the Opportunity tab reads nothing.
    teamQuestionsTab: () => authoredQuestions("opportunity-swu-edit.team_questions_tab", "Team Questions"),
    codeChallengeTab: () => tabContent(["Code Challenge"]),
    teamScenarioTab: () => tabContent(["Team Scenario"]),
    evaluationPanelTab: () => tabContent(["Evaluation Panel"]),
    consensusTab: () => tabContent(["Consensus"]),
    // Offered only to an evaluator on the opportunity's panel. Spread in rather than written
    // into the literal, so the page still type-checks against a surface that lacks them.
    ...{
      instructionsTab: () => linkedTabContent("Instructions"),
      evaluationTab: () => linkedTabContent("Evaluation"),
    },
    proposalDeadline: () => wizardDate("opportunity-swu-edit.proposal_deadline", ["Proposal Deadline"]),
    assignmentDate: () => wizardDate("opportunity-swu-edit.assignment_date", ["Assignment Date"]),
    // The Opportunity tab's "Team Questions" step; a reader not offered the tab reads nothing.
    evaluationQuestionFields: (position?: unknown) =>
      inTab(["Opportunity"], () =>
        evaluationQuestionFields("opportunity-swu-edit.evaluation_question_fields", "Team Questions", position),
      ),
  };

  const opportunityTwuEdit: Open<S.OpportunityTwuEditPage> = {
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
    offeredStateChanges: () => offeredStateChanges("opportunity-twu-edit.offered_state_changes"),
    // The opportunity's own resource questions, from the Opportunity tab's
    // "5. Resource Questions" step — not the sidebar's scoring link of the same name.
    resourceQuestionsTab: () =>
      authoredQuestions("opportunity-twu-edit.resource_questions_tab", "Resource Questions"),
    challengeTab: () => tabContent(["Challenge", "Interview/Challenge", "Code Challenge"]),
    evaluationPanelTab: () => tabContent(["Evaluation Panel"]),
    consensusTab: () => tabContent(["Consensus"]),
    // Offered only to an evaluator on the opportunity's panel.
    instructionsTab: () => linkedTabContent("Instructions"),
    evaluationTab: () => linkedTabContent("Evaluation"),
    proposalDeadline: () => wizardDate("opportunity-twu-edit.proposal_deadline", ["Proposal Deadline"]),
    assignmentDate: () => wizardDate("opportunity-twu-edit.assignment_date", ["Contract Award Date", "Assignment Date"]),
    startDate: () => wizardDate("opportunity-twu-edit.start_date", ["Contract Start Date", "Start Date"]),
    completionDate: () => wizardDate("opportunity-twu-edit.completion_date", ["Contract Completion Date", "Completion Date"]),
    // The Opportunity tab's "Resource Questions" step; a reader not offered the tab reads nothing.
    evaluationQuestionFields: (position?: unknown) =>
      inTab(["Opportunity"], () =>
        evaluationQuestionFields("opportunity-twu-edit.evaluation_question_fields", "Resource Questions", position),
      ),
  };

  // The complete report, or nothing where the reader is refused it with the "Not Found" screen.
  async function fullReport(): Promise<string> {
    await ready();
    return (await notFoundShown()) ? "" : contentText();
  }

  const opportunityCwuComplete: S.OpportunityCwuCompletePage = {
    ...at("/opportunities/code-with-us/:opportunityId/complete"),
    fullReport,
  };
  const opportunitySwuComplete: S.OpportunitySwuCompletePage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/complete"),
    fullReport,
  };
  const opportunityTwuComplete: S.OpportunityTwuCompletePage = {
    ...at("/opportunities/team-with-us/:opportunityId/complete"),
    fullReport,
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
  // The terms boxes an action has ticked. Closing the dialog to enter more values unticks
  // them, so they are ticked again whenever the dialog is reopened.
  const acceptedTerms = new Set<string>();

  // Whether the terms dialog is open once this returns. When Submit stays disabled after
  // every field the test did not name has a valid value, a value the test gave is what the
  // form refuses: the form is left on the step showing that error and nothing is opened.
  // Once the form is known to refuse what it was given, the later actions of the same attempt
  // (the other terms, the submit) do not walk the whole wizard again: nothing they do can make
  // Submit usable, and each walk costs seconds on every step. Opening a form afresh forgets it.
  let termsRefused = false;

  // What the form said when it last refused a submit ("Please enter a valid email.",
  // "Please enter a valid phone number."), gathered from every step at that moment. The
  // form draws a field's message only once the field has been left, so each field is
  // entered and left in turn first — its value untouched — when no step shows one yet.
  let refusalShown: string[] = [];
  // The same refusal field by field ("email address: Please enter a valid email.").
  let refusalFieldsShown: string[] = [];

  async function touchFieldsHere(): Promise<void> {
    for (const role of ["textbox", "spinbutton"] as const) {
      const boxes = seen(page.getByRole(role));
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        const box = boxes.nth(i);
        if (await box.isDisabled().catch(() => true)) continue;
        await box.focus().catch(() => undefined);
        await box.blur().catch(() => undefined);
      }
    }
    await settle();
  }

  async function surfaceRefusal(): Promise<void> {
    const found: string[] = [];
    const byField: string[] = [];
    const gather = async (): Promise<void> => {
      for (const line of [
        ...(await messages()).split("\n"),
        ...(await formErrors()).split("\n"),
      ]) {
        if (line && !found.includes(line)) found.push(line);
      }
      for (const entry of await fieldErrorsByLabel()) if (!byField.includes(entry)) byField.push(entry);
    };
    if (await currentStep()) {
      await walkSteps(gather);
      if (!found.length) {
        await walkSteps(async () => {
          await touchFieldsHere();
          await gather();
        });
      }
    } else {
      await gather();
      if (!found.length) {
        await touchFieldsHere();
        await gather();
      }
    }
    refusalShown = found;
    refusalFieldsShown = byField;
    // The form is left on the first step showing the refusal, for the reader.
    await toStepShowingMessages();
  }

  async function openTermsDialog(where: string): Promise<boolean> {
    if (await dialog().count()) return true;
    let submit = await findControl(navBar(), "Submit");
    if (submit && (await isDisabled(submit)) && termsRefused) return false;
    if (submit && (await isDisabled(submit))) {
      await completeRequired(true);
      submit = await findControl(navBar(), "Submit");
    }
    if (submit && (await isDisabled(submit))) {
      await surfaceRefusal();
      termsRefused = true;
      return false;
    }
    await press(where, ["Submit", "Submit Proposal"], navBar());
    if (!(await dialogUp())) {
      throw new Error(`unbound: ${where} — submitting raised no terms dialog on ${page.url()}`);
    }
    for (const label of acceptedTerms) {
      const box = seen(dialog().first().getByRole("checkbox", { name: label, exact: false }));
      if ((await box.count()) && !(await box.first().isChecked())) await box.first().click();
    }
    await settle();
    return true;
  }

  // "Review Terms and Conditions" offers "Submit Proposal" as pressable text — neither a
  // button nor a link by role — below its two acknowledgement boxes (seen as the owner of
  // Northern Pines on the seeded open Sprint With Us opportunity). It is found by its words
  // inside the open dialog, and the dialog is waited out: once pressed it is emptied and then
  // leaves, while the page moves to the stored proposal.
  async function confirmTerms(where: string): Promise<void> {
    if (!(await dialogUp())) {
      throw new Error(`unbound: ${where} — submitting raised no terms dialog on ${page.url()}`);
    }
    for (let attempt = 0; attempt < 3 && (await dialog().count()); attempt++) {
      const box = dialog().first();
      let control: Locator | null = null;
      for (const name of ["Submit Proposal", "Submit"]) {
        const words = seen(box.getByText(name, { exact: true }));
        const count = await words.count();
        if (count) {
          control = words.nth(count - 1);
          break;
        }
      }
      if (!control) control = await findControl(box, "Submit Proposal");
      if (!control) {
        const shown = (await dialogText()).replace(/\s*\n\s*/g, " | ");
        throw new Error(`unbound: ${where} — the open terms dialog offers no "Submit Proposal" on ${page.url()} (it shows: ${shown})`);
      }
      if (await isDisabled(control)) {
        const unticked: string[] = [];
        const boxes = seen(box.getByRole("checkbox"));
        for (let i = 0; i < (await boxes.count()); i++) {
          if (!(await boxes.nth(i).isChecked())) unticked.push(await accessibleName(boxes.nth(i)));
        }
        throw new Error(
          `${where} — "Submit Proposal" in the terms dialog is disabled on ${page.url()}${
            unticked.length ? `; not ticked: ${unticked.join(" | ")}` : ""
          }`,
        );
      }
      await control.click({ timeout: CLICK_MS }).catch(() => undefined);
      await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    }
    if (await dialog().count()) {
      const title = ((await dialogText()).split("\n")[0] ?? "").trim();
      throw new Error(`${where} — pressed "Submit Proposal" but the "${title}" dialog stayed open on ${page.url()}`);
    }
    await settle();
  }

  // The terms dialog put away with its own "Cancel", and waited out, so nothing is left over
  // the form — its steps, its "Save Draft" — for the next action to click into. Whatever was
  // agreed to is remembered and ticked again when it next opens. A "Cancel" pressed while the
  // dialog was still arriving leaves it open, so the close is checked and tried again, and a
  // dialog that will not go is reported here rather than as a later click timing out.
  async function closeTerms(where: string): Promise<void> {
    for (let attempt = 0; attempt < 3 && (await dialog().count()); attempt++) {
      await page.waitForTimeout(DIALOG_ARRIVAL_MS);
      const cancel = await findControl(dialog().first(), "Cancel");
      if (!cancel) break;
      await cancel.click().catch(() => undefined);
      await dialog().first().waitFor({ state: "hidden", timeout: 3000 }).catch(() => undefined);
    }
    await mustDismissDialog(where);
  }

  function proposalCreate(where: string, route: string, programme: string) {
    // The form sits behind the terms dialog once that is open, so values still to be
    // entered close it first; the submit that follows opens it again, with the terms
    // already agreed to ticked once more.
    async function enter(member: string, input: unknown): Promise<void> {
      if (!entriesOf(input, ATTACHMENT_KEYS).length && !hasFiles(input)) return;
      // New values may be what the form was waiting for, so it is asked again.
      termsRefused = false;
      refusalShown = [];
      refusalFieldsShown = [];
      await closeTerms(`${where}.${member}`);
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
        // The terms dialog, if still open, sits over the top bar's "Save Draft".
        await closeTerms(`${where}.save_draft`);
        await press(`${where}.save_draft`, ["Save Draft"], navBar());
        await landOn(record());
      },
      submitProposal: async (input?: unknown) => {
        await enter("submit_proposal", input);
        if (!(await openTermsDialog(`${where}.submit_proposal`))) return;
        await confirmTerms(`${where}.submit_proposal`);
        await landOn(record());
        acceptedTerms.clear();
      },
      // The agreement is remembered even when the dialog cannot open yet, so the submit that
      // follows ticks it once the dialog is up. The box is ticked in the dialog to see that it
      // is there, and the dialog is then closed so the form behind it — its steps and its
      // "Save Draft" — can be reached again; the submit reopens it and ticks it once more.
      acceptProgramTerms: async (input?: unknown) => {
        await enter("accept_program_terms", input);
        const label = `agree to the ${programme} Terms & Conditions`;
        acceptedTerms.add(label);
        if (!(await openTermsDialog(`${where}.accept_program_terms`))) return;
        await ensureTicked(`${where}.accept_program_terms`, [label], dialog().first());
        await closeTerms(`${where}.accept_program_terms`);
      },
      acceptAppTerms: async (input?: unknown) => {
        await enter("accept_app_terms", input);
        const label = "Digital Marketplace Terms & Conditions for E-Bidding";
        acceptedTerms.add(label);
        if (!(await openTermsDialog(`${where}.accept_app_terms`))) return;
        await ensureTicked(`${where}.accept_app_terms`, [label], dialog().first());
        await closeTerms(`${where}.accept_app_terms`);
      },
      // What the form shows now, from every step, with what it showed when it last refused
      // the submit: a field's message is drawn only once the field has been left.
      fieldError: async () => {
        if (await dialog().count()) return messages();
        const found = (await stepMessages()).split("\n").filter(Boolean);
        for (const line of refusalShown) if (!found.includes(line)) found.push(line);
        return found.join("\n");
      },
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
    // With no reason the dialog keeps "Disqualify" disabled: that is the refusal, so the
    // dialog is put away and nothing is disqualified.
    const confirm =
      (await findControl(dialog().first(), "Disqualify")) ??
      (await findControl(dialog().first(), "Disqualify Proposal"));
    if (confirm && (await isDisabled(confirm))) {
      await press(where, ["Cancel"], dialog().first());
      await dialog().first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
      return;
    }
    await press(where, ["Disqualify", "Disqualify Proposal"], dialog().first());
  }

  // An organization handed over as a name, or as its record ({ legal_name }), or under
  // "organization" as either.
  function organizationName(input: unknown): string {
    if (typeof input === "string") return input;
    if (!input || typeof input !== "object" || Array.isArray(input)) return "";
    const record = input as Record<string, unknown>;
    const named = field(record, "legal_name", "legalName", "organizationName", "name");
    if (named) return named;
    if (record.organization !== undefined) return organizationName(record.organization);
    return "";
  }

  const proposalCwuCreate: Open<S.ProposalCwuCreatePage> = {
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
      // Legal name, address and the rest are required of an individual proponent.
      await completeRequired(false);
    },
    chooseProponentOrganization: async (input) => {
      const where = "proposal-cwu-create.choose_proponent_organization";
      await ready();
      await goToStep("Proponent");
      await chooseRadio(where, "Organization");
      const name = organizationName(input);
      if (!name) return;
      // The organization is the test's to name: one the chooser does not offer — an archived
      // one — is left unchosen, never replaced by whichever is offered first.
      namedLabels.add(squash("Organization"));
      const box = seen(page.getByRole("combobox", { name: labelled("Organization") })).first();
      if (!(await box.count())) {
        throw new Error(`unbound: ${where} — chose "Organization" but no Organization chooser appeared on ${page.url()}`);
      }
      await box.click();
      const option = seen(page.getByRole("option", { name, exact: false }));
      await option.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      if (!(await option.count())) {
        await page.keyboard.press("Escape").catch(() => undefined);
        await settle();
        return;
      }
      await option.first().click();
      await settle();
    },
    cancel: () => press("proposal-cwu-create.cancel", ["Cancel"], navBar()),
    // Every message the form draws against a field, on every step, as "<field>: <message>",
    // with what it drew when it last refused the submit (a field's message is drawn only once
    // the field has been left). Seen on the Proponent step as an individual: "email address:
    // Please enter a valid email." A form showing none reads as nothing.
    fieldErrorsByField: async () => {
      await ready();
      if (await dialog().count()) await closeTerms("proposal-cwu-create.field_errors_by_field");
      const found: string[] = [];
      const gather = async (): Promise<void> => {
        for (const entry of await fieldErrorsByLabel()) if (!found.includes(entry)) found.push(entry);
      };
      if (await currentStep()) {
        await walkSteps(gather);
        await toStepShowingMessages();
      } else {
        await gather();
      }
      for (const entry of refusalFieldsShown) if (!found.includes(entry)) found.push(entry);
      return found.join("\n");
    },
    opportunitySummary: () => headerText(),
    async termsModal() {
      if (!(await openTermsDialog("proposal-cwu-create.terms_modal"))) {
        nothing(`proposal-cwu-create.terms_modal — "Submit" stayed disabled with every required field filled, so no terms dialog could be opened on ${page.url()}`);
      }
      return dialogText();
    },
    async submitDisabledUntilTermsAccepted() {
      if (!(await openTermsDialog("proposal-cwu-create.submit_disabled_until_terms_accepted"))) {
        nothing(`proposal-cwu-create.submit_disabled_until_terms_accepted — "Submit" stayed disabled with every required field filled, so no terms dialog could be opened on ${page.url()}`);
      }
      return controlState(["Submit Proposal"], dialog().first());
    },
  };

  // An organization named by its seed handle, its identifier or its record, as the legal name
  // the chooser shows.
  function organizationNamed(input: unknown): string {
    const record =
      input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    const given = record.organization ?? record.org ?? input;
    const named = organizationName(given);
    const byKey = (key: string): string => {
      const groups = seed.organizations as unknown as Record<string, { id?: string; legal_name?: string }>;
      const found = groups[key] ?? Object.values(groups).find((each) => each.id === key);
      return found?.legal_name ?? "";
    };
    if (named) return byKey(named) || named;
    if (given && typeof given === "object") {
      const id = (given as Record<string, unknown>).id;
      if (typeof id === "string") return byKey(id);
    }
    return asText(input);
  }

  // The Sprint With Us and Team With Us proposal forms open on "1. Evaluation", which only
  // shows the scoring table; the "Organization*" chooser is on the team step ("2. Team" and
  // "2. Team Members"). It offers only the organizations this vendor may act for that qualify
  // for the programme, and says so beside it. An organization it does not offer is left
  // unchosen — never replaced by another — which is the refusal a test goes on to read.
  async function chooseProposalOrganization(where: string, step: string, input: unknown): Promise<void> {
    await ready();
    if (!(await goToStep(step))) await advanceTo(where, "Organization");
    const box = seen(page.getByRole("combobox", { name: labelled("Organization") })).first();
    await box.waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    if (!(await box.count())) {
      throw new Error(`unbound: ${where} — reached the "${step}" step but no "Organization" chooser is on it at ${page.url()}`);
    }
    const name = organizationNamed(input);
    namedLabels.add(squash("Organization"));
    if (step === "Team Members") await rememberTwuResources();
    await box.click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    const option = name ? seen(page.getByRole("option", { name, exact: false })) : options;
    if (await option.count()) {
      await option.first().click();
    } else {
      await page.keyboard.press("Escape").catch(() => undefined);
    }
    await settle();
    // What the chooser shows once the choice is made is read back. The form may have come
    // with another of the vendor's organizations already picked ("Northern Pines Digital
    // Ltd."), and a named organization the chooser does not offer leaves that one in place:
    // the proposal must not go on under it, so the choice is cleared (Backspace, as the
    // chooser allows), leaving the form with no organization — the refusal the test reads.
    const shown = await chosenOrganization(box);
    if (!name || (shown && squash(shown).includes(squash(name)))) {
      organizationWithheld = false;
      return;
    }
    organizationWithheld = true;
    if (!shown) return;
    await box.click();
    await page.keyboard.press("Backspace").catch(() => undefined);
    await page.keyboard.press("Escape").catch(() => undefined);
    await settle();
    const left = await chosenOrganization(box);
    if (left) {
      throw new Error(
        `${where} — refused: the "Organization" chooser on ${page.url()} does not offer "${name}", and "${left}" stays chosen in its place (Backspace did not clear it)`,
      );
    }
  }

  // Choosing another organization on "2. Team Members" empties every resource's "Resource
  // Name*" and "Hourly Rate*" (seen as the owner of Northern Pines and Salt Marsh Labs on a
  // submitted Team With Us proposal: Blake Placeholder and $100 both gone, "Submit Changes"
  // disabled). What each resource held before is kept here, so a save that changes the
  // organization can put it back and let the service rule on the change itself.
  let twuResourcesBefore: Array<{ name: string; rate: string }> = [];

  async function rememberTwuResources(): Promise<void> {
    const choosers = seen(page.getByRole("combobox", { name: labelled("Resource Name") }));
    const rates = seen(page.getByRole("spinbutton", { name: labelled("Hourly Rate") }));
    const count = await choosers.count();
    const held: Array<{ name: string; rate: string }> = [];
    for (let i = 0; i < count; i++) {
      const name = (await chosenOrganization(choosers.nth(i))).trim();
      const rate = i < (await rates.count()) ? (await rates.nth(i).inputValue().catch(() => "")).trim() : "";
      held.push({ name, rate });
    }
    // An emptied form is never taken over what was remembered before it was emptied.
    if (held.some((each) => each.name || each.rate)) twuResourcesBefore = held;
  }

  // Each resource left without a member or a rate gets back what it held before the
  // organization changed: the member when the chooser now offers them, the rate as it was.
  async function restoreTwuResources(where: string): Promise<void> {
    if (!twuResourcesBefore.length || !(await goToStep("Team Members"))) return;
    const choosers = seen(page.getByRole("combobox", { name: labelled("Resource Name") }));
    await choosers.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    const count = await choosers.count();
    for (let i = 0; i < count && i < twuResourcesBefore.length; i++) {
      const { name, rate } = twuResourcesBefore[i];
      const chooser = choosers.nth(i);
      if (name && (await chooserIsEmpty(chooser))) {
        await chooser.click();
        const option = seen(page.getByRole("option", { name, exact: true }));
        await seen(page.getByRole("option")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
        if (await option.count()) await option.first().click();
        else await page.keyboard.press("Escape").catch(() => undefined);
        await settle();
      }
      const box = seen(page.getByRole("spinbutton", { name: labelled("Hourly Rate") })).nth(i);
      if (rate && (await box.count()) && !(await box.inputValue().catch(() => "")).trim()) {
        await fillTwuRate(where, i, rate);
      }
    }
  }

  // Every required field (its label ending in "*") left empty, step by step, with any message
  // a step shows. The old form draws no message against an empty required field — "Resource
  // Name*" reads only "Please select a resource name" — so emptiness is read from the fields.
  async function emptyRequiredFields(): Promise<string[]> {
    const found: string[] = [];
    const visit = async (): Promise<void> => {
      const step = (await (await currentStep())?.innerText().catch(() => ""))?.trim() || "form";
      for (const role of ["textbox", "spinbutton", "combobox"] as const) {
        const fields = seen(page.getByRole("main").getByRole(role));
        const count = await fields.count();
        for (let i = 0; i < count; i++) {
          const box = fields.nth(i);
          const name = (await accessibleName(box)).trim();
          if (!/\*\s*$/.test(name) || (await box.isDisabled().catch(() => false))) continue;
          const empty = role === "combobox"
            ? await chooserIsEmpty(box)
            : !(await box.inputValue().catch(() => "")).trim();
          if (empty) found.push(`${step}: "${bareLabel(name)}" is empty`);
        }
      }
      for (const line of (await messages()).split("\n")) {
        const entry = `${step}: ${line}`;
        if (line && !found.includes(entry)) found.push(entry);
      }
    };
    if (await currentStep()) await walkSteps(visit);
    else await visit();
    return found;
  }

  // Set when the organization a test named could not be chosen, so no later step picks
  // another one for it.
  let organizationWithheld = false;

  // The organization a chooser shows as picked, or "" while it shows its placeholder.
  async function chosenOrganization(box: Locator): Promise<string> {
    if (await chooserIsEmpty(box)) return "";
    return box
      .evaluate((element) => {
        let node: HTMLElement | null = element as HTMLElement;
        for (let i = 0; i < 8 && node; i++) {
          node = node.parentElement;
          const words = (node?.innerText ?? "").trim();
          if (words) return words;
        }
        return "";
      })
      .catch(() => "");
  }

  // The people a test names for a proposal's team, in whatever shape it hands them over: one
  // person or a list, a name, an address, a seed handle or record, or a record carrying them
  // under "member(s)", "teamMember(s)", "user(s)" or "resource(Name)".
  function peopleIn(input: unknown): unknown[] {
    if (input === undefined || input === null) return [];
    if (Array.isArray(input)) return input.flatMap(peopleIn);
    if (typeof input === "string") return input ? [input] : [];
    if (typeof input !== "object") return [];
    const record = input as Record<string, unknown>;
    for (const key of [
      "members", "member", "teamMembers", "teamMember", "users", "user",
      "people", "person", "resourceName", "memberName",
    ]) {
      if (record[key] !== undefined && record[key] !== null) return peopleIn(record[key]);
    }
    if (typeof record.id === "string" || typeof record.email === "string") return [record];
    if (typeof record.name === "string" && record.name) return [record.name];
    return [];
  }

  // The team pickers name each person by name alone. A seed user carries an identifier and
  // an address but, for a vendor, no name, so the name is taken from the membership lists of
  // the organizations the signed-in vendor belongs to — the lists the pickers are drawn from.
  async function teamNamesById(): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    const mine = await page.request.get(`${baseURL}/api/affiliations`).catch(() => null);
    if (!mine || mine.status() !== 200) return names;
    const affiliations: unknown = await mine.json().catch(() => []);
    for (const affiliation of Array.isArray(affiliations) ? affiliations : []) {
      const organization = (affiliation as { organization?: { id?: string } }).organization?.id;
      if (!organization) continue;
      const members = await page.request
        .get(`${baseURL}/api/affiliations?organization=${organization}`)
        .catch(() => null);
      if (!members || members.status() !== 200) continue;
      const listed: unknown = await members.json().catch(() => []);
      for (const member of Array.isArray(listed) ? listed : []) {
        const user = (member as { user?: { id?: string; name?: string } }).user;
        if (user?.id && user.name) names.set(user.id, user.name);
      }
    }
    return names;
  }

  async function teamMemberNames(where: string, input: unknown): Promise<string[]> {
    const people = peopleIn(input);
    let byId: Map<string, string> | null = null;
    const names: string[] = [];
    for (const person of people) {
      const record =
        person && typeof person === "object" ? (person as Record<string, unknown>) : null;
      if (record && typeof record.name === "string" && record.name) {
        names.push(record.name);
        continue;
      }
      const id = userIdOf(person);
      if (!id) {
        // A plain name, as the picker shows it.
        if (typeof person === "string" && !/@/.test(person)) names.push(person);
        else nothing(`${where} — no account could be found for ${JSON.stringify(person)}`);
        continue;
      }
      const seeded = SEED_USERS.find((user) => user.id === id) as (SeedUser & { name?: string }) | undefined;
      if (seeded?.name) {
        names.push(seeded.name);
        continue;
      }
      const known = byId ?? (byId = await teamNamesById());
      const name = known.get(id);
      // Somebody in none of this vendor's organizations cannot be on its team: the picker
      // will not offer them, and saying so is the refusal.
      if (!name) {
        throw new Error(
          `${where} — refused: ${JSON.stringify(person)} is not a member of any organization the signed-in vendor belongs to, so no team picker on ${page.url()} offers them`,
        );
      }
      names.push(name);
    }
    return names;
  }

  // A team step shows its phases or resources only once an organization is chosen. When the
  // test chose none, the one the chooser offers first is taken, so the step can be reached;
  // a chooser offering none is the vendor having no qualifying organization. An organization
  // the test named and the chooser would not take is never replaced by another. Resolves
  // whether an organization is chosen.
  async function ensureProposalOrganization(where: string): Promise<boolean> {
    const box = seen(page.getByRole("combobox", { name: labelled("Organization") })).first();
    await box.waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    if (!(await box.count())) return true;
    if (!(await chooserIsEmpty(box))) return true;
    if (organizationWithheld) return false;
    await box.click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    if (!(await options.count())) {
      await page.keyboard.press("Escape").catch(() => undefined);
      await settle();
      return false;
    }
    await options.first().click();
    await settle();
    return true;
  }

  // Each team question sits folded under "Question N"; its "Question N Response" box shows
  // once the heading is opened. A question is picked by its number (from 1) or its order
  // (from 0), and the first is meant when neither is given.
  async function answerProposalQuestion(where: string, steps: string[], input: unknown): Promise<void> {
    await ready();
    let reached = false;
    for (const step of steps) if (!reached && (await goToStep(step))) reached = true;
    if (!reached) await advanceTo(where, "Question 1");
    const numbered = Number.parseInt(field(input, "question", "questionNumber", "number"), 10);
    const ordered = Number.parseInt(field(input, "order", "index", "position"), 10);
    const which = Number.isFinite(numbered) && numbered > 0
      ? numbered
      : Number.isFinite(ordered) && ordered >= 0
        ? ordered + 1
        : 1;
    const text =
      field(input, "response", "answer", "text", "body", "value", "content") ||
      (typeof input === "string" ? input : asText(input));
    const label = `Question ${which} Response`;
    const box = (): Locator => seen(page.getByRole("textbox", { name: labelled(label) }));
    if (!(await box().count())) {
      const heading = seen(page.getByText(`Question ${which}`, { exact: true }));
      const count = await heading.count();
      if (!count) {
        throw new Error(`unbound: ${where} — reached the questions step but it shows no "Question ${which}" on ${page.url()}`);
      }
      await heading.nth(count - 1).click();
      await box().first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    }
    if (!(await box().count())) {
      throw new Error(`unbound: ${where} — opened "Question ${which}" but no "${label}" box appeared on ${page.url()}`);
    }
    namedLabels.add(squash(label));
    await box().first().fill(text);
    await box().first().blur().catch(() => undefined);
    await settle();
  }

  // The phases the Team step shows once an organization is chosen, in order, by name.
  async function teamPhasesShown(): Promise<string[]> {
    const shown: string[] = [];
    for (const name of PHASES) {
      if (await seen(page.getByRole("main").getByText(name, { exact: true })).count()) shown.push(name);
    }
    return shown;
  }

  // Every "Add Team Member(s)" on show. It is plain pressable text, neither a button nor a
  // link by role, so it is found by its words.
  const teamAdders = (): Locator => seen(page.getByRole("main").getByText(/Add Team Member/i));

  // A phase's section on "2. Team" is the box that holds the phase's name and, while open,
  // its own "Phase Dates", team table and "Add Team Member(s)"; folded, the same box holds
  // the name alone, its contents still in the page but hidden (seen as the owner of Northern
  // Pines on a one-phase opportunity: "Implementation" open with "Phase Dates" below it,
  // pressed once to fold it, the dates then hidden). It is found from the name up — the
  // nearest box around the name that shows a "Phase Dates" before it takes in any other
  // phase's name — never from where things sit on screen, which an earlier phase unfolding
  // above shifts. Asked of an element, the probe says whether that element sits inside the
  // phase's open section; asked of the form itself, whether the section is open at all.
  function probePhaseSection(
    element: Element,
    [mode, phase, others]: [string, string, string[]],
  ): boolean {
    const shown = (node: Element): boolean => {
      const box = node as HTMLElement;
      if (!(box.offsetWidth || box.offsetHeight || node.getClientRects().length)) return false;
      const style = window.getComputedStyle(box);
      return style.visibility !== "hidden" && style.display !== "none";
    };
    const main = document.getElementsByTagName("main")[0] ?? document.body;
    const leaves = Array.from(main.getElementsByTagName("*")).filter(
      (node) => node.children.length === 0 && shown(node),
    );
    const said = (node: Element): string => (node.textContent ?? "").trim();
    const names = leaves.filter((node) => said(node) === phase);
    const rivals = leaves.filter((node) => others.includes(said(node)));
    const dates = leaves.filter((node) => said(node) === "Phase Dates");
    for (let i = names.length - 1; i >= 0; i--) {
      let section: Element | null = names[i].parentElement;
      while (section && section !== main && !rivals.some((rival) => section!.contains(rival))) {
        if (dates.some((each) => section!.contains(each))) {
          return mode === "open" ? true : section.contains(element);
        }
        section = section.parentElement;
      }
    }
    return false;
  }

  function phaseProbeArgs(mode: "open" | "holds", phase: string): [string, string, string[]] {
    return [mode, phase, PHASES.filter((each) => each !== phase)];
  }

  // Whether the phase's section is open: its name shows with its own "Phase Dates" around it.
  async function teamPhaseOpen(phase: string): Promise<boolean> {
    return page
      .getByRole("main")
      .first()
      .evaluate(probePhaseSection, phaseProbeArgs("open", phase))
      .catch(() => false);
  }

  // The first of these elements that sits inside the phase's open section.
  async function inPhaseSection(locator: Locator, phase: string): Promise<Locator | null> {
    const count = await locator.count();
    for (let i = 0; i < count; i++) {
      const holds = await locator
        .nth(i)
        .evaluate(probePhaseSection, phaseProbeArgs("holds", phase))
        .catch(() => false);
      if (holds) return locator.nth(i);
    }
    return null;
  }

  // The "Add Team Member(s)" inside one phase's open section.
  async function teamPhaseAdder(phase: string): Promise<Locator | null> {
    return inPhaseSection(teamAdders(), phase);
  }

  // An opportunity with one phase shows that phase's section open. One with more shows each
  // phase folded under its bare name, with no "Phase Dates", team table or "Add Team
  // Member(s)" until the name is pressed (seen as the owner of Northern Pines on a published
  // opportunity with Proof of Concept and Implementation: both names alone, each unfolding to
  // its own adder). The name toggles its section, so it is pressed only while that phase's
  // own section shows no "Phase Dates": a one-phase opportunity's "Implementation" is open
  // from the start, and pressing its name there folds it shut. A folded name is pressed once,
  // and its section waited for until it is open and at rest, before the next phase is
  // looked at.

  async function waitTeamPhaseOpen(phase: string, ms: number): Promise<boolean> {
    const until = Date.now() + ms;
    for (;;) {
      if (await teamPhaseOpen(phase)) return true;
      if (Date.now() >= until) return false;
      await page.waitForTimeout(200);
    }
  }

  async function openTeamPhases(): Promise<string[]> {
    // The sections appear a moment after the organization is chosen.
    await seen(page.getByRole("main").getByText(new RegExp(`^(${PHASES.join("|")})$`)))
      .or(teamAdders())
      .first()
      .waitFor({ state: "visible", timeout: LATE_CONTROL_MS })
      .catch(() => undefined);
    const shown = await teamPhasesShown();
    for (const phase of shown) {
      // An open section's contents are drawn with its name, a moment behind it at most.
      if (!(await waitTeamPhaseOpen(phase, 1000))) {
        const names = seen(page.getByRole("main").getByText(phase, { exact: true }));
        const count = await names.count();
        if (!count) continue;
        await names.nth(count - 1).click();
        await settle();
        await waitTeamPhaseOpen(phase, 5000);
      }
      const settled =
        (await teamPhaseAdder(phase)) ??
        (await inPhaseSection(seen(page.getByRole("main").getByText("Phase Dates", { exact: true })), phase));
      if (settled) await steadyBox(settled);
    }
    return shown;
  }

  // The adder of the phase asked about (the first shown when none is), every phase unfolded
  // first. A step naming no phase at all offers whichever adder it shows.
  async function phaseAdderFor(where: string, phase: string): Promise<{ adder: Locator; phase: string }> {
    const shownPhases = await openTeamPhases();
    await teamAdders().first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    if (phase && !shownPhases.includes(phase)) {
      throw new Error(
        `${where} — refused: this opportunity has no "${phase}" phase on ${page.url()} (its phases: ${shownPhases.join(", ") || "none shown"})`,
      );
    }
    const target = phase || shownPhases[0] || "";
    const adder = target ? await teamPhaseAdder(target) : (await teamAdders().count()) ? teamAdders().first() : null;
    if (!adder) {
      throw new Error(
        `unbound: ${where} — reached the Team step with an organization chosen and pressed the name of each phase showing no "Phase Dates" below it, once, to unfold it (${shownPhases.join(", ") || "no phase name shown"}), but no "Add Team Member(s)" showed inside ${target ? `"${target}"` : "any of them"} at ${page.url()}`,
      );
    }
    return { adder, phase: target };
  }

  // "2. Team" shows one section per phase ("Inception", "Proof of Concept", "Implementation"),
  // each with its own "Add Team Member(s)". That opens a dialog listing the organization's
  // confirmed members by name, each picked by pressing it, then "Add Team Member(s)" in the
  // dialog adds them to the phase's table (seen as the organization owner on published Sprint
  // With Us opportunities with only an implementation phase, and with Proof of Concept and
  // Implementation, adding to the Implementation table).
  async function addSwuPhaseMembers(where: string, input: unknown): Promise<void> {
    await ready();
    if (!(await goToStep("Team"))) await advanceTo(where, "Organization");
    // No organization chosen — the chooser offering the vendor none, or the named one
    // refused — leaves no team to put together, and that withholding is left for the test
    // to read rather than thrown.
    if (!(await ensureProposalOrganization(where))) return;
    const phaseGiven = field(input, "phase", "phaseName") || (typeof input === "string" && PHASES.some((p) => squash(p) === squash(phaseNamed(input))) ? input : "");
    const phase = phaseGiven ? phaseNamed(phaseGiven) : "";
    const found = await phaseAdderFor(where, phase);
    const names = typeof input === "string" && phaseGiven ? [] : await teamMemberNames(where, input);
    lastSwuPhase = found.phase;
    // The dialog lists only people not yet on the phase. Somebody already in its team table —
    // as a person belonging to both organizations stays after the organization is changed on
    // a submitted proposal (seen as the owner of Northern Pines and Salt Marsh Labs) — is
    // already added, and the dialog is not asked for them.
    const wanted: string[] = [];
    for (const name of names) if (!(await onSwuPhase(found.phase, name))) wanted.push(name);
    if (names.length && !wanted.length) {
      await tickSwuScrumMasterIfGiven(where, found.phase, names, input);
      return;
    }
    await found.adder.click();
    if (!(await dialogUp())) {
      throw new Error(`unbound: ${where} — "Add Team Member(s)" opened no dialog on ${page.url()}`);
    }
    for (const name of wanted) {
      const entry = seen(dialog().first().getByText(name, { exact: true }));
      if (!(await entry.count())) {
        const offered = (await dialogText()).replace(/\s*\n\s*/g, " | ");
        await dismissDialog();
        throw new Error(`${where} — refused: the member dialog does not offer "${name}", and "${name}" is not in the "${found.phase || "phase"}" team table either, on ${page.url()} (the dialog shows: ${offered})`);
      }
      await entry.last().click();
    }
    await press(where, ["Add Team Member(s)"], dialog().first());
    await dialog().first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
    await settle();
    await tickSwuScrumMasterIfGiven(where, found.phase, names, input);
  }

  // A member handed over as the phase's scrum master ({ member, scrumMaster: true }) has the
  // "Scrum Master" radio on their own row of the phase's table ticked once they are on it.
  // Nothing else is pressed on the Team step afterwards: the member on the phase with the
  // radio ticked is the whole of what the action asked.
  async function tickSwuScrumMasterIfGiven(where: string, phase: string, names: string[], input: unknown): Promise<void> {
    const flag = input && typeof input === "object" && !Array.isArray(input)
      ? given(input, ["scrumMaster", "scrum_master", "isScrumMaster"])
      : undefined;
    if (flag === undefined || flag === null || !saysYes(flag) || !names.length) return;
    await tickSwuScrumMaster(where, phase, names[0]);
  }

  async function tickSwuScrumMaster(where: string, phase: string, name: string): Promise<void> {
    const rows = seen(page.getByRole("row").filter({ has: page.getByRole("radio") }));
    const mine = name ? rows.filter({ hasText: name }) : rows;
    await mine.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    const count = await mine.count();
    if (!count) {
      throw new Error(`unbound: ${where} — every phase on the Team step unfolded, but no team member row${name ? ` for "${name}"` : ""} with a Scrum Master choice on ${page.url()}`);
    }
    const row = phase && count > 1 ? await inPhaseSection(mine, phase) : mine.first();
    if (!row) {
      throw new Error(`unbound: ${where} — no team member row${name ? ` for "${name}"` : ""} with a Scrum Master choice inside the unfolded "${phase}" section on ${page.url()}`);
    }
    const radio = row.getByRole("radio").first();
    if (!(await radio.isChecked().catch(() => false))) {
      await radio.click({ timeout: CLICK_MS });
      await settle();
    }
  }

  // Whether a phase's team table already has a row for the person: each member sits on a row
  // of their own under "TEAM MEMBER", beside a "Remove" (seen as the owner of Northern Pines
  // adding Blake and Charlie to Implementation). With several phases the row must sit in the
  // phase's own section.
  async function onSwuPhase(phase: string, name: string): Promise<boolean> {
    const rows = seen(page.getByRole("row").filter({ has: page.getByText(name, { exact: true }) }));
    if (!(await rows.count())) return false;
    if (!phase || (await teamPhasesShown()).length < 2) return true;
    return (await inPhaseSection(rows, phase)) !== null;
  }

  // "5. References" holds three blocks headed "Reference 1" to "Reference 3", each with
  // "Name*", "Company*", "Phone Number*" and "Email*" boxes, in that order down the step
  // (seen as the owner of Northern Pines on the seeded open Sprint With Us opportunity). A
  // reference goes under "Reference N", N being its order plus one — or, in a list handed
  // over without orders, its place in the list — and each of its values into its own box.
  async function addSwuReferences(where: string, input: unknown): Promise<void> {
    await ready();
    if (!(await goToStep("References"))) await advanceTo(where, "Reference 1");
    const given = Array.isArray(input) ? input : [input];
    const BOXES: Array<[string, string[]]> = [
      ["Name", ["name", "fullName", "full_name", "referenceName"]],
      ["Company", ["company", "companyName", "company_name", "organization"]],
      ["Phone Number", ["phone", "phoneNumber", "phone_number", "telephone"]],
      ["Email", ["email", "emailAddress", "email_address"]],
    ];
    const known = new Set(["order", "index", "position", "number", ...BOXES.flatMap(([, keys]) => keys)]);
    for (const [place, reference] of given.entries()) {
      if (!reference || typeof reference !== "object") {
        throw new Error(`unbound: ${where} — a reference is handed over as ${JSON.stringify(reference)}, not as its name, company, phone and email`);
      }
      for (const key of Object.keys(reference as Record<string, unknown>)) {
        if (!known.has(key)) {
          throw new Error(`unbound: ${where} — no box on "Reference N" for the input's "${key}" (it holds Name, Company, Phone Number and Email) on ${page.url()}`);
        }
      }
      const numbered = Number.parseInt(field(reference, "number"), 10);
      const ordered = Number.parseInt(field(reference, "order", "index", "position"), 10);
      const at = Number.isFinite(numbered) && numbered > 0
        ? numbered - 1
        : Number.isFinite(ordered) && ordered >= 0
          ? ordered
          : place;
      if (!(await seen(page.getByRole("heading", { name: `Reference ${at + 1}`, exact: true })).count())) {
        throw new Error(`${where} — refused: the References step shows no "Reference ${at + 1}" block on ${page.url()}`);
      }
      for (const [label, keys] of BOXES) {
        const record = reference as Record<string, unknown>;
        if (!keys.some((key) => record[key] !== undefined && record[key] !== null)) continue;
        const value = field(reference, ...keys);
        const box = seen(page.getByRole("main").getByRole("textbox", { name: labelled(label) })).nth(at);
        if (!(await box.count())) {
          throw new Error(`unbound: ${where} — reached "5. References" but "Reference ${at + 1}" has no "${label}" box on ${page.url()}`);
        }
        // A value given as empty is left empty, never filled in on the test's behalf; a
        // value given leaves the other references' boxes of that label still to be completed.
        if (!value) namedLabels.add(squash(label));
        await box.fill(value);
        await box.blur().catch(() => undefined);
      }
      await settle();
    }
  }

  // Each phase's team table has a "Scrum Master" column holding one unlabelled radio per
  // member, picked on the member's own row.
  async function setSwuScrumMaster(where: string, input: unknown): Promise<void> {
    await ready();
    if (!(await goToStep("Team"))) await advanceTo(where, "Organization");
    const names = await teamMemberNames(where, input);
    const phaseGiven = field(input, "phase", "phaseName");
    // A phase's team table shows only while its section is unfolded.
    await openTeamPhases();
    for (const name of names.length ? names : [""]) {
      await tickSwuScrumMaster(where, phaseGiven ? phaseNamed(phaseGiven) : "", name);
    }
  }

  // The phase a team member was last added to, whose choice team_member_choices reads; the
  // first phase shown when nobody has been added yet.
  let lastSwuPhase = "";

  // Whether the form's "Organization*" chooser has an organization picked; a form showing no
  // such chooser is taken as having one.
  async function organizationChosen(): Promise<boolean> {
    const box = seen(page.getByRole("combobox", { name: labelled("Organization") })).first();
    await box.waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    if (!(await box.count())) return true;
    return !(await chooserIsEmpty(box));
  }

  // The people a phase's "Add Team Member(s)" dialog offers, one per line, by name alone. The
  // dialog lists the chosen organization's members under its note and leaves out whoever is
  // already on that phase; a member still to answer their invitation carries "Pending" on
  // the line below their name (seen as an organization member of Northern Pines on a
  // published Sprint With Us opportunity: "Blake Placeholder | Charlie Placeholder | Dana
  // Placeholder | Quinn Placeholder | Pending", then without Blake once Blake was added). The
  // dialog is put away without adding anybody. With no organization chosen the step offers
  // no choice at all, which reads as nothing.
  async function swuMemberChoices(where: string): Promise<string> {
    await ready();
    if (!(await goToStep("Team"))) await advanceTo(where, "Organization");
    if (!(await organizationChosen())) return "";
    const shownPhases = await teamPhasesShown();
    const { adder } = await phaseAdderFor(where, shownPhases.includes(lastSwuPhase) ? lastSwuPhase : "");
    await adder.click();
    if (!(await dialogUp())) nothing(`${where} — "Add Team Member(s)" opened no dialog on ${page.url()}`);
    const box = dialog().first();
    const standing = new Set<string>(["Add Team Member(s)", "Cancel"]);
    for (const block of [
      ...(await box.getByRole("paragraph").allInnerTexts()),
      ...(await box.getByRole("heading").allInnerTexts()),
    ]) {
      for (const line of block.split("\n")) standing.add(line.trim());
    }
    const names: string[] = [];
    for (const line of (await box.innerText()).split("\n").map((each) => each.trim())) {
      if (!line || standing.has(line) || /^pending$/i.test(line)) continue;
      names.push(line);
    }
    await closeTerms(where);
    return names.join("\n");
  }

  // The members named on the phases' team tables who still carry "Pending": each member sits
  // on a row of their own under "TEAM MEMBER", their name in the first cell with "Pending" on
  // the line below it while their invitation is unanswered (seen as the owner of Northern
  // Pines on the seeded open Sprint With Us opportunity, "Blake Placeholder" and "Quinn
  // Placeholder" added to Implementation: Quinn's cell reads "Quinn Placeholder | Pending",
  // Blake's the name alone). One line per such member, "<name> — Pending". The step's standing
  // instructions, which also say "pending", are not a member's entry and are not read. The
  // rows are read in one pass, so a table redrawn part way through cannot leave a read waiting.
  // With the Team step reached and nobody pending on it, that nothing is the answer.
  async function swuPendingMembers(where: string): Promise<string> {
    await ready();
    if (!(await goToStep("Team"))) await advanceTo(where, "Organization");
    if (!(await organizationChosen())) return "";
    await openTeamPhases();
    const entries = await page
      .getByRole("main")
      .getByRole("row")
      .evaluateAll((rows) =>
        rows.map((row) => {
          const box = row as HTMLElement;
          const shown = !!(box.offsetWidth || box.offsetHeight || row.getClientRects().length);
          const first = row.children[0] as HTMLElement | undefined;
          return { shown, cell: first ? first.innerText : "" };
        }),
      )
      .catch(() => [] as Array<{ shown: boolean; cell: string }>);
    const pending: string[] = [];
    for (const { shown, cell } of entries) {
      if (!shown) continue;
      const lines = cell.split("\n").map((line) => line.trim()).filter(Boolean);
      if (lines.length < 2 || !lines.slice(1).some((line) => /^pending$/i.test(line))) continue;
      const line = `${lines[0]} — Pending`;
      if (!pending.includes(line)) pending.push(line);
    }
    return pending.join("\n");
  }

  // The resource a team member was last named for, whose choice team_member_choices reads
  // when every resource already has somebody.
  let lastTwuResourceAt = 0;

  // The people a "Resource Name*" chooser offers, one per line: the first chooser still empty,
  // else the one last filled. It lists the chosen organization's confirmed members (seen as
  // the owner of Northern Pines: "Blake Placeholder | Charlie Placeholder | Dana Placeholder",
  // the pending invitee not among them). The list is closed without picking anybody.
  async function twuMemberChoices(where: string): Promise<string> {
    await ready();
    if (!(await goToStep("Team Members"))) await advanceTo(where, "Organization");
    if (!(await organizationChosen())) return "";
    const choosers = seen(page.getByRole("combobox", { name: labelled("Resource Name") }));
    await choosers.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    const count = await choosers.count();
    if (!count) {
      nothing(`${where} — reached "Team Members" with an organization chosen, but no "Resource Name" chooser is on it at ${page.url()}`);
    }
    let which = -1;
    for (let i = 0; i < count && which < 0; i++) if (await chooserIsEmpty(choosers.nth(i))) which = i;
    if (which < 0) which = Math.min(lastTwuResourceAt, count - 1);
    await choosers.nth(which).click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    const offered = (await options.allInnerTexts()).map((each) => each.trim()).filter(Boolean);
    await page.keyboard.press("Escape").catch(() => undefined);
    await settle();
    return offered.join("\n");
  }

  const proposalSwuCreate: Open<S.ProposalSwuCreatePage> = {
    ...proposalCreate(
      "proposal-swu-create",
      "/opportunities/sprint-with-us/:opportunityId/proposals/create",
      "Sprint With Us",
    ),
    chooseOrganization: (input) =>
      chooseProposalOrganization("proposal-swu-create.choose_organization", "Team", input),
    addPhaseTeamMember: (input) => addSwuPhaseMembers("proposal-swu-create.add_phase_team_member", input),
    setScrumMaster: (input) => setSwuScrumMaster("proposal-swu-create.set_scrum_master", input),
    // "3. Pricing" asks one "<Phase> Cost*" per phase ("Implementation Cost*"), beside a
    // read-only "Total Proposed Cost".
    setPhaseProposedCost: async (input) => {
      const where = "proposal-swu-create.set_phase_proposed_cost";
      await ready();
      const phase = field(input, "phase", "name");
      const value = field(input, "cost", "proposedCost", "proposed_cost", "amount", "price", "value") || asText(input);
      const label = phase ? `${phaseNamed(phase)} Cost` : "";
      const boxes = seen(page.getByRole("spinbutton", { name: label ? labelled(label) : /Cost\s*\*\s*$/ }));
      // From "2. Team" — the member on the phase and Scrum Master ticked — the form moves on
      // with its own "Next", plain pressable text at the foot of the form rather than a
      // button, pressed until a phase cost box shows (seen as the owner of Northern Pines on
      // a one-phase opportunity: one press from "2. Team" lands on "3. Pricing" with
      // "Implementation Cost*"). The step menu is the way there only from a step past it.
      await settle();
      const startedOn = await currentStep();
      const startedAt = Number.parseInt(
        (startedOn ? await startedOn.innerText().catch(() => "") : "").trim(),
        10,
      );
      if (!(await boxes.count()) && Number.isFinite(startedAt) && startedAt > 3) await goToStep("Pricing");
      if (!(await boxes.count())) {
        await mustDismissDialog(where);
        for (let step = 0; step < 8 && !(await boxes.count()); step++) {
          const next = await findControl(page.getByRole("main"), "Next");
          if (!next) break;
          const on = await currentStep();
          const stepName = on ? (await on.innerText().catch(() => "")).trim() : "the current step";
          if (await isDisabled(next)) {
            throw new Error(`${where} — "Next" is disabled on "${stepName}" at ${page.url()}`);
          }
          const clicked = await next.click({ timeout: CLICK_MS }).then(() => true).catch(() => false);
          if (!clicked) {
            throw new Error(`${where} — the form's "Next" on "${stepName}" would not take a press at ${page.url()}`);
          }
          await settle();
          await boxes.first().waitFor({ state: "visible", timeout: 2500 }).catch(() => undefined);
        }
        if (!(await boxes.count())) await goToStep("Pricing");
        if (!(await boxes.count())) await advanceTo(where, "Total Proposed Cost");
      }
      await boxes.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
      const count = await boxes.count();
      for (let i = 0; i < count; i++) {
        if (await boxes.nth(i).isDisabled()) continue;
        namedLabels.add(squash(bareLabel(await accessibleName(boxes.nth(i)))));
        await boxes.nth(i).fill(value);
        await boxes.nth(i).blur().catch(() => undefined);
        await settle();
        return;
      }
      throw new Error(
        `unbound: ${where} — reached the Pricing step but no ${label ? `"${label}"` : "phase cost"} field is on it at ${page.url()}`,
      );
    },
    answerTeamQuestion: (input) =>
      answerProposalQuestion("proposal-swu-create.answer_team_question", ["Team Questions"], input),
    addReference: (input) => addSwuReferences("proposal-swu-create.add_reference", input),
    capabilityGapError: () => messages(/capabilit/i),
    budgetExceededError: () => messages(/budget|exceed/i),
    unqualifiedOrganizationNotice: () => linesMatching(/qualif/i),
    pendingTeamMember: () => swuPendingMembers("proposal-swu-create.pending_team_member"),
    teamMemberChoices: () => swuMemberChoices("proposal-swu-create.team_member_choices"),
    phaseTeamSections: () => swuPhaseTeamSections("proposal-swu-create.phase_team_sections"),
    phaseRequirements: () => swuPhaseRequirements("proposal-swu-create.phase_requirements"),
    costErrors: () => swuCostErrors("proposal-swu-create.cost_errors"),
  };

  // The contract names the phases Inception, Prototype and Implementation; the form calls
  // the middle one "Proof of Concept".
  const contractPhase = (shown: string): string => (shown === "Proof of Concept" ? "Prototype" : shown);

  // "2. Team" shows its phase sections only once an organization is chosen, so reaching them
  // takes one: the test's own when it chose one, else the first the chooser offers (as the
  // team actions do). A vendor offered no organization reaches the step and is shown no
  // section, which reads as nothing.
  async function toSwuTeamSections(where: string): Promise<boolean> {
    await ready();
    if (!(await goToStep("Team"))) await advanceTo(where, "Organization");
    return ensureProposalOrganization(where);
  }

  // One line per phase the Team step offers a section for, in the form's order (seen as
  // the owner of Northern Pines: "Implementation" alone on the seeded open opportunity,
  // "Proof of Concept" then "Implementation" on one with both).
  async function swuPhaseTeamSections(where: string): Promise<string> {
    if (!(await toSwuTeamSections(where))) return "";
    await seen(page.getByRole("main").getByText(new RegExp(`^(${PHASES.join("|")})$`)))
      .first()
      .waitFor({ state: "visible", timeout: LATE_CONTROL_MS })
      .catch(() => undefined);
    return (await teamPhasesShown()).map(contractPhase).join("\n");
  }

  // What one phase's open section shows about meeting its requirements. The icon beside the
  // phase's name is drawn in the name's own colour while the section is complete and turns
  // to an orange warning while it is not (seen as the owner of Northern Pines: nobody named,
  // or a "Pending" member named, gives the warning; Blake alone, holding both capabilities,
  // gives the plain icon). Under "Required Capabilities" each capability sits beside an icon:
  // a grey hollow circle in the label's own grey while the team does not hold it, a green
  // check beside darker words once it does. So a mark drawn in a colour other than its words
  // is the one that says something: the warning on a phase, the check on a capability.
  function probePhaseRequirements(
    _main: Element,
    [phase, others]: [string, string[]],
  ): { warned: boolean; capabilities: Array<{ name: string; held: boolean }> } | null {
    const shown = (node: Element): boolean => {
      const box = node as HTMLElement;
      if (!(box.offsetWidth || box.offsetHeight || node.getClientRects().length)) return false;
      const style = window.getComputedStyle(box);
      return style.visibility !== "hidden" && style.display !== "none";
    };
    const main = document.getElementsByTagName("main")[0] ?? document.body;
    const leaves = Array.from(main.getElementsByTagName("*")).filter(
      (node) => node.children.length === 0 && shown(node),
    );
    const said = (node: Element): string => (node.textContent ?? "").trim();
    const colour = (node: Element): string => window.getComputedStyle(node).color;
    const markBeside = (node: Element): Element | null =>
      Array.from(node.parentElement?.children ?? []).find(
        (each) => each !== node && each.tagName.toLowerCase() === "svg",
      ) ?? null;
    const names = leaves.filter((node) => said(node) === phase);
    const rivals = leaves.filter((node) => others.includes(said(node)));
    const dates = leaves.filter((node) => said(node) === "Phase Dates");
    for (let i = names.length - 1; i >= 0; i--) {
      let section: Element | null = names[i].parentElement;
      while (section && section !== main && !rivals.some((rival) => section!.contains(rival))) {
        if (dates.some((each) => section!.contains(each))) {
          const mark = markBeside(names[i]);
          const warned = mark !== null && colour(mark) !== colour(names[i]);
          const inside = leaves.filter((node) => section!.contains(node));
          const heading = inside.findIndex((node) => said(node) === "Required Capabilities");
          const capabilities: Array<{ name: string; held: boolean }> = [];
          if (heading >= 0) {
            for (const node of inside.slice(heading + 1)) {
              const icon = markBeside(node);
              if (!icon || !said(node)) continue;
              capabilities.push({ name: said(node), held: colour(icon) !== colour(node) });
            }
          }
          return { warned, capabilities };
        }
        section = section.parentElement;
      }
    }
    return null;
  }

  // One line per offered phase: "<phase> | complete" or "<phase> | incomplete", then the
  // phase's required capabilities the named team does not hold, comma-separated (nothing
  // after the last bar when every one is held) — e.g. "Implementation | incomplete |
  // Backend Development, Delivery Management" with nobody named.
  async function swuPhaseRequirements(where: string): Promise<string> {
    if (!(await toSwuTeamSections(where))) return "";
    const lines: string[] = [];
    for (const phase of await openTeamPhases()) {
      const read = await page
        .getByRole("main")
        .first()
        .evaluate(probePhaseRequirements, [phase, PHASES.filter((each) => each !== phase)] as [string, string[]])
        .catch(() => null);
      if (!read) {
        nothing(`${where} — reached the Team step with an organization chosen and unfolded "${phase}", but no open section with its "Phase Dates" showed under that name on ${page.url()}`);
      }
      const missing = read.capabilities.filter((each) => !each.held).map((each) => each.name);
      lines.push(`${contractPhase(phase)} | ${read.warned ? "incomplete" : "complete"} | ${missing.join(", ")}`);
    }
    return lines.join("\n");
  }

  // "3. Pricing" asks "<Phase> Cost*" per phase beside a read-only "Total Proposed Cost",
  // and writes a message directly under a box whose amount is over its budget: "Please enter
  // a Proposed Cost less than or equal to 500,000." under the phase's, "The proposed cost
  // exceeds the maximum budget for this opportunity." under the total (seen as the owner of
  // Northern Pines entering 99999999 as the Implementation cost). One line per message, as
  // "<phase>: <message>" or "total: <message>".
  async function swuCostErrors(where: string): Promise<string> {
    await ready();
    const boxes = seen(page.getByRole("spinbutton", { name: /Cost\s*\*?\s*$/ }));
    if (!(await boxes.count())) await goToStep("Pricing");
    if (!(await boxes.count())) await advanceTo(where, "Total Proposed Cost");
    await boxes.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    const count = await boxes.count();
    if (!count) nothing(`${where} — reached the Pricing step but no cost box is on it at ${page.url()}`);
    const found: string[] = [];
    for (let i = 0; i < count; i++) {
      const label = bareLabel(await accessibleName(boxes.nth(i)));
      const against = /^total/i.test(label)
        ? "total"
        : contractPhase(phaseNamed(label.replace(/\s*Cost\s*$/i, "").trim()));
      for (const line of await saidAfterField(boxes.nth(i))) {
        if (!matches(MESSAGE, line)) continue;
        const entry = `${against}: ${line}`;
        if (!found.includes(entry)) found.push(entry);
      }
    }
    return found.join("\n");
  }

  // "2. Team Members" shows, once an organization is chosen, one "Resource N" per resource
  // the opportunity asks for, each with a "Resource Name*" chooser listing the organization's
  // confirmed members by name and an "Hourly Rate*" box (seen as the organization owner on a
  // published Team With Us opportunity with one Full Stack Developer resource). A resource is
  // picked by its number (from 1), its order (from 0) or its service area, else the first.
  async function twuResourceIndex(input: unknown): Promise<number> {
    const numbered = Number.parseInt(field(input, "resource", "resourceNumber", "number"), 10);
    if (Number.isFinite(numbered) && numbered > 0) return numbered - 1;
    const ordered = Number.parseInt(field(input, "order", "index", "resourceIndex", "position"), 10);
    if (Number.isFinite(ordered) && ordered >= 0) return ordered;
    const area = field(input, "serviceArea", "service_area", "area", "resource");
    if (area) {
      const wanted = squash(area);
      const areas = seen(page.getByText("Service Area", { exact: true }));
      const count = await areas.count();
      for (let i = 0; i < count; i++) {
        const shown = await areas
          .nth(i)
          .evaluate((label) => ((label.nextElementSibling as HTMLElement | null)?.innerText ?? "").trim())
          .catch(() => "");
        if (squash(shown) === wanted) return i;
      }
    }
    return 0;
  }

  // Resolves whether an organization is chosen on "2. Team Members". None chosen — the
  // chooser offering the vendor none, or the named one refused — leaves no resource to fill,
  // and that withholding is left for the test to read rather than thrown.
  async function toTwuTeamStep(where: string): Promise<boolean> {
    await ready();
    if (!(await goToStep("Team Members"))) await advanceTo(where, "Organization");
    return ensureProposalOrganization(where);
  }

  async function addTwuResourceMember(where: string, input: unknown): Promise<void> {
    if (!(await toTwuTeamStep(where))) return;
    const choosers = seen(page.getByRole("combobox", { name: labelled("Resource Name") }));
    await choosers.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    const count = await choosers.count();
    if (!count) {
      throw new Error(`unbound: ${where} — reached "Team Members" with an organization chosen, but no "Resource Name" chooser is on it at ${page.url()}`);
    }
    const which = Math.min(await twuResourceIndex(input), count - 1);
    lastTwuResourceAt = which;
    const names = await teamMemberNames(where, input);
    const name = names[0] ?? "";
    const chooser = choosers.nth(which);
    namedLabels.add(squash("Resource Name"));
    const rate = field(input, "hourlyRate", "hourly_rate", "rate");
    // A chooser already showing the person has them named; its list would leave them out.
    const already = name ? await chosenOrganization(chooser) : "";
    if (already && squash(already).includes(squash(name))) {
      if (rate) await fillTwuRate(where, which, rate);
      return;
    }
    await chooser.click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    const option = name ? seen(page.getByRole("option", { name, exact: true })) : options;
    if (!(await option.count())) {
      const offered = (await options.allInnerTexts()).join(" | ");
      await page.keyboard.press("Escape").catch(() => undefined);
      await settle();
      throw new Error(
        `${where} — refused: the "Resource Name" chooser does not offer ${name ? `"${name}"` : "anybody"} on ${page.url()} (it offers: ${offered || "nobody"})`,
      );
    }
    await option.first().click();
    await settle();
    // A rate handed over with the member is entered beside them.
    if (rate) await fillTwuRate(where, which, rate);
  }

  async function fillTwuRate(where: string, which: number, rate: string): Promise<void> {
    const boxes = seen(page.getByRole("spinbutton", { name: labelled("Hourly Rate") }));
    const count = await boxes.count();
    if (!count) {
      throw new Error(`unbound: ${where} — no "Hourly Rate" box on ${page.url()}`);
    }
    const box = boxes.nth(Math.min(which, count - 1));
    namedLabels.add(squash("Hourly Rate"));
    await box.fill(rate);
    await box.blur().catch(() => undefined);
    await settle();
  }

  async function setTwuHourlyRate(where: string, input: unknown): Promise<void> {
    if (!(await toTwuTeamStep(where))) return;
    await seen(page.getByRole("spinbutton", { name: labelled("Hourly Rate") }))
      .first()
      .waitFor({ state: "visible", timeout: LATE_CONTROL_MS })
      .catch(() => undefined);
    const rate = field(input, "hourlyRate", "hourly_rate", "rate", "value", "amount") || asText(input);
    await fillTwuRate(where, await twuResourceIndex(input), rate);
  }

  const proposalTwuCreate: Open<S.ProposalTwuCreatePage> = {
    ...proposalCreate(
      "proposal-twu-create",
      "/opportunities/team-with-us/:opportunityId/proposals/create",
      "Team With Us",
    ),
    chooseOrganization: (input) =>
      chooseProposalOrganization("proposal-twu-create.choose_organization", "Team Members", input),
    addTeamMemberForResource: (input) =>
      addTwuResourceMember("proposal-twu-create.add_team_member_for_resource", input),
    setHourlyRate: (input) => setTwuHourlyRate("proposal-twu-create.set_hourly_rate", input),
    answerResourceQuestion: (input) =>
      answerProposalQuestion("proposal-twu-create.answer_resource_question", ["Questions", "Resource Questions"], input),
    serviceAreaError: () => messages(/service area/i),
    unqualifiedOrganizationNotice: () => linesMatching(/qualif/i),
    teamMemberChoices: () => twuMemberChoices("proposal-twu-create.team_member_choices"),
  };

  // A proposal's form is put into editing from whichever control its screen offers: "Edit" in
  // the top bar, or "Edit" in an Actions menu, on the Proposal Details tab where the screen
  // opened on another. A form already open to change — its top bar offering "Save Changes"
  // or "Submit Proposal" — is left as it is.
  async function startEditingProposal(where: string): Promise<void> {
    await ready();
    const editable = async (): Promise<boolean> => {
      if (
        (await findControl(navBar(), "Save Changes")) !== null ||
        (await findControl(navBar(), "Save Draft")) !== null ||
        (await findControl(navBar(), "Submit Proposal")) !== null
      ) {
        return true;
      }
      for (const role of ["textbox", "combobox", "radio", "spinbutton"] as const) {
        const fields = seen(page.getByRole("main").getByRole(role));
        const count = await fields.count();
        for (let i = 0; i < count; i++) if (!(await fields.nth(i).isDisabled())) return true;
      }
      return false;
    };
    const tryEdit = async (): Promise<boolean> => {
      const edit = await findControl(navBar(), "Edit");
      if (edit && !(await isDisabled(edit))) {
        await edit.click();
        await settle();
        return true;
      }
      return fromActionsIfOffered(where, ["Edit"]);
    };
    if (await editable()) return;
    if (await tryEdit()) return;
    if ((await enterTab(["Proposal Details", "Proposal"])) && !(await editable()) && (await tryEdit())) return;
    if (await editable()) return;
    // Reached the proposal's form and it is read-only with no "Edit" anywhere — as a draft on
    // an opportunity past its deadline shows, its boxes disabled and only "Delete" offered.
    // That withholding is the refusal a test goes on to read, so nothing more is attempted.
    if (await currentStep()) return;
    throw new Error(
      `unbound: ${where} — looked for "Edit" in the top bar and in an Actions menu, on the screen as opened and on its Proposal Details tab, and found no proposal form at all on ${page.url()}`,
    );
  }

  // A draft proposal saves through "Save Changes". A submitted one offers "Submit Changes"
  // instead, which raises the terms dialog: its boxes are ticked, then its own "Submit
  // Changes" confirms.
  async function saveProposalChanges(where: string): Promise<void> {
    // A disabled "Save Changes" or "Submit Changes" is the form holding something invalid.
    // It draws no message for an empty required field, so every step is walked and each
    // empty required field named.
    for (const name of ["Save Changes", "Submit Changes"]) {
      const control = await findControl(navBar(), name);
      if (!control || !(await isDisabled(control))) continue;
      const found = await emptyRequiredFields();
      throw new Error(
        `${where} — "${name}" is disabled on ${page.url()}; walked every step of the form: ${
          found.length ? found.join(" | ") : "no required field is empty and no step shows a message"
        }`,
      );
    }
    if (await findControl(navBar(), "Save Changes")) {
      await press(where, ["Save Changes"], navBar());
      await confirmIfAsked(where, ["Save Changes"]);
      return;
    }
    await press(where, ["Submit Changes"], navBar());
    await dialog().first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) {
      await saved(["Submit Changes"]);
      return;
    }
    const boxes = seen(dialog().first().getByRole("checkbox"));
    const count = await boxes.count();
    for (let i = 0; i < count; i++) {
      if (!(await boxes.nth(i).isChecked())) await boxes.nth(i).click();
    }
    await settle();
    await press(where, ["Submit Changes", "Submit"], dialog().first());
    await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    // A refused change leaves the form open under "Unable to Submit Proposal Changes" (seen
    // after changing the organization of a submitted Team With Us proposal), with the
    // service's reason against the field; that notice ends the wait as the form closing does.
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (!(await findControl(navBar(), "Submit Changes"))) break;
      if ((await everyAlert(REFUSED_SUBMISSION)).length) break;
      await page.waitForTimeout(250);
    }
    await ready();
  }

  // A terms dialog, when one opens: every box in it ticked, then its own confirming control
  // pressed, and the dialog waited out.
  async function agreeAndConfirm(where: string, names: string[]): Promise<void> {
    if (!(await dialogUp())) return;
    const boxes = seen(dialog().first().getByRole("checkbox"));
    const count = await boxes.count();
    for (let i = 0; i < count; i++) {
      if (!(await boxes.nth(i).isChecked())) await boxes.nth(i).click();
    }
    await settle();
    await press(where, names, dialog().first());
    await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  const ORGANIZATION_KEYS = [
    "organization", "org", "organizationId", "organization_id",
    "organizationName", "organization_name", "legal_name", "legalName",
  ];

  // What a test hands a save of a proposal is entered first: the organization through the
  // form's "Organization*" chooser (on "2. Team Members", "2. Team", or — for Code With Us —
  // the "Proponent" step once "Organization" is chosen there), every other value by its label.
  async function applyProposalEdits(where: string, teamStep: string, input: unknown): Promise<void> {
    const record =
      input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : null;
    let organization: unknown;
    if (typeof input === "string" && input) organization = input;
    if (record) {
      const id = record.organizationId ?? record.organization_id;
      organization =
        record.organization ?? record.org ??
        (typeof id === "string" ? { id } : undefined) ??
        (record.organizationName ?? record.organization_name ?? record.legal_name ?? record.legalName);
    }
    const rest = entriesOf(input, [...ORGANIZATION_KEYS, ...ATTACHMENT_KEYS]);
    if (organization === undefined && !rest.length && !hasFiles(input)) return;
    await startEditingProposal(where);
    if (organization !== undefined) {
      if (teamStep) {
        await chooseProposalOrganization(where, teamStep, { organization });
      } else {
        await goToStep("Proponent");
        await chooseRadio(where, "Organization");
        await chooseProposalOrganization(where, "Proponent", { organization });
      }
    }
    if (rest.length) {
      await fillForm(where, Object.fromEntries(rest.map((entry) => [entry.key, entry.value])), {
        skip: [...ORGANIZATION_KEYS, ...ATTACHMENT_KEYS],
      });
    }
    if (hasFiles(input)) await addAttachment(where, input);
  }

  // What the screen said when a proposal was last submitted from its management page, and on
  // which proposal. A refused submission raises the notice "Unable to Submit Proposal — Your
  // Team With Us proposal could not be submitted. Please fix any errors in the form and try
  // again." (seen as the owner of Northern Pines submitting a draft Team With Us proposal
  // naming a member whose invitation is still pending); it does not repeat the service's
  // reason. The notice fades, so it is taken as soon as it shows.
  let submission: { proposal: string; notice: string[] } | null = null;

  const REFUSED_SUBMISSION = /unable|could not|cannot|can't|not be submitted|fail|error|invalid|please fix/i;

  async function noteSubmission(): Promise<void> {
    const proposal = new URL(page.url()).pathname;
    const notice: string[] = [];
    const deadline = Date.now() + 5000;
    for (;;) {
      const alerts = await everyAlert();
      for (const words of alerts) {
        const line = words.replace(/\s*\n\s*/g, " — ");
        if (matches(REFUSED_SUBMISSION, words) && !notice.includes(line)) notice.push(line);
      }
      // Any notice at all — the refusal, or "Proposal Submitted" — is the outcome.
      if (alerts.length || Date.now() >= deadline) break;
      await page.waitForTimeout(250);
    }
    submission = { proposal, notice };
  }

  // The refusal's notice, then any message the form shows against a field on any of its
  // steps. A submission that went through, or a proposal not submitted from this screen,
  // shows neither and reads as nothing.
  async function submissionRefusal(): Promise<string> {
    await ready();
    const found: string[] = [];
    const proposal = new URL(page.url()).pathname;
    if (submission && submission.proposal === proposal) found.push(...submission.notice);
    for (const words of await everyAlert(REFUSED_SUBMISSION)) {
      const line = words.replace(/\s*\n\s*/g, " — ");
      if (!found.includes(line)) found.push(line);
    }
    if (!found.length) return "";
    for (const line of (await stepMessages()).split("\n")) if (line && !found.includes(line)) found.push(line);
    return found.join("\n");
  }

  // A proposal's own management page: a tab, a header of standing facts, and an Actions
  // menu whose contents change with the proposal's state.
  function proposalEdit(where: string, route: string, teamStep: string) {
    return {
      ...at(route),
      startEditing: () => startEditingProposal(`${where}.start_editing`),
      saveChanges: async (input?: unknown) => {
        await applyProposalEdits(`${where}.save_changes`, teamStep, input);
        if (teamStep === "Team Members") await restoreTwuResources(`${where}.save_changes`);
        await saveProposalChanges(`${where}.save_changes`);
      },
      saveChangesAndSubmit: async () => {
        submission = null;
        await press(`${where}.save_changes_and_submit`, ["Submit Proposal"], navBar());
        await agreeAndConfirm(`${where}.save_changes_and_submit`, ["Submit Proposal", "Submit"]);
        await noteSubmission();
      },
      // "Submit" raises "Review Terms and Conditions", whose "Submit Proposal" stays disabled
      // until each of its boxes is ticked.
      submitProposal: async () => {
        submission = null;
        await fromBarOrActions(`${where}.submit_proposal`, ["Submit", "Submit Proposal"]);
        await agreeAndConfirm(`${where}.submit_proposal`, ["Submit Proposal", "Submit"]);
        await noteSubmission();
      },
      submissionRefusal: () => submissionRefusal(),
      // A vendor's own proposal carries "Withdraw" (or "Delete", for a draft) straight in
      // the top bar, beside "Edit"; seen as the competing vendor on the seeded open Sprint With
      // Us proposal, confirmed in "Withdraw ... Proposal?" with "Withdraw Proposal".
      withdrawProposal: async () => {
        await fromBarOrActions(`${where}.withdraw_proposal`, ["Withdraw"]);
        await confirmIfAsked(`${where}.withdraw_proposal`, ["Withdraw Proposal", "Withdraw"]);
      },
      // A draft offers "Delete" under Actions ("Submit | Edit | Delete"); a submitted proposal
      // offers only "Edit" and "Withdraw" in the top bar (both seen as the vendor on a Code
      // With Us proposal of their own). "Delete" missing from a proposal that is not a draft
      // is the page refusing: nothing is deleted and the action ends there, for the test to
      // read the proposal still standing.
      deleteProposal: async () => {
        const member = `${where}.delete_proposal`;
        try {
          await fromBarOrActions(member, ["Delete"]);
        } catch (error) {
          await closeActionsMenu();
          const status = await valueAfter(["Proposal Status"]);
          if (status && !/draft/i.test(status)) return;
          throw error;
        }
        await confirmIfAsked(member, ["Delete Proposal", "Delete"]);
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
      "",
    ),
    // The "Proposal" tab opens the wizard on "1. Proponent"; the proposal text itself sits on
    // "2. Proposal", in a "Proposal" box (disabled until "Edit" is pressed) whose value the
    // screen's text leaves out. Seen as the vendor on the seeded submitted Code With Us
    // proposal, whose step reads "The seeded proposal text of proponent 1." only in that box.
    proposalTab: async () => {
      if (!(await enterTab(["Proposal Details", "Proposal"]))) return "";
      if (!(await currentStep())) return formText();
      if (!(await goToStep("Proposal")) && !(await walkToStep(/^\d+\.\s+Proposal$/i))) {
        throw new Error(
          `unbound: proposal-cwu-edit.proposal_tab — opened the "Proposal" tab but the wizard offers no "Proposal" step on ${page.url()}`,
        );
      }
      return formText();
    },
    addAttachment: (input) => addAttachment("proposal-cwu-edit.add_attachment", input),
    removeAttachment: (input) => removeAttachment("proposal-cwu-edit.remove_attachment", input),
    submittedAt: async () => {
      const shown = await findAfter(["Submitted On", "Submitted At", "Submitted"]);
      return shown || linesMatching(/submitted/i);
    },
    // Figures sit above their labels in the header ("82.00%" over "Total Score").
    score: () => stageFigure([], ["Total Score", "Score"]),
    rank: async () => (await ready(), valueBefore(["Ranking", "Rank"])),
    availableActions: () => actionsMenuText(),
  };

  // Once "Edit" is pressed, a proposal's management page carries the same wizard as its create
  // screen ("1. Evaluation", "2. Team", "3. Pricing", ... on Sprint With Us; seen as the owner
  // of Silver Creek on the seeded open Sprint With Us proposal, whose "2. Team" shows
  // "Organization*" and each phase's "Add Team Member(s)" exactly as the create screen does).
  // The create screen's controls are therefore driven here once the form is open.
  function editingControl(where: string, run: (member: string) => Promise<void>) {
    return async (): Promise<void> => {
      await startEditingProposal(where);
      await run(where);
    };
  }

  // The messages the open form shows against its fields after a refused save, from every
  // step, each as "<field>: <message>" ("organization: Organization cannot be changed once the
  // proposal has been submitted"). A form that closed — the save went through — has no
  // fields left to carry any, and reads as nothing. A message the form draws where no field
  // can be told as its own is given on its own.
  async function proposalEditFieldErrors(): Promise<string> {
    await ready();
    if (!(await currentStep())) return "";
    const found: string[] = [];
    await walkSteps(async () => {
      for (const entry of await fieldErrorsByLabel()) if (!found.includes(entry)) found.push(entry);
      for (const line of (await messages()).split("\n")) {
        if (!line || matches(/qualif/i, line)) continue;
        if (found.some((entry) => entry.endsWith(`: ${line}`) || entry === line)) continue;
        found.push(line);
      }
    });
    return found.join("\n");
  }

  // The header of the Proposal tab names the organization under "Organization", as a link to
  // it ("Organization | Silver Creek Software Ltd."); another tab is left for that one first.
  async function proposalOrganization(): Promise<string> {
    await ready();
    const here = await findAfter(["Organization"]);
    if (here !== null) return here;
    return (await enterTab(["Proposal", "Proposal Details"])) ? valueAfter(["Organization"]) : "";
  }

  // A proposal's own screen draws its place above "Ranking" in the header of the Proposal
  // Details tab: "1st" once fully evaluated, "—" while it holds none (seen as the administrator
  // on both proposals of the seeded Sprint With Us opportunity at the team scenario, and of
  // the seeded Team With Us opportunity at the challenge). The dash reads as nothing.
  async function viewRank(): Promise<string> {
    await ready();
    let shown = await findBefore(["Ranking"]);
    if (shown === null && (await enterTab(["Proposal Details", "Proposal"]))) shown = await findBefore(["Ranking"]);
    const value = (shown ?? "").trim();
    return /^[—–-]$/.test(value) ? "" : value;
  }

  const proposalSwuEdit: S.ProposalSwuEditPage = {
    ...proposalEdit(
      "proposal-swu-edit",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit",
      "Team",
    ),
    chooseOrganization: (input) =>
      editingControl("proposal-swu-edit.choose_organization", (where) =>
        chooseProposalOrganization(where, "Team", input),
      )(),
    addPhaseTeamMember: (input) =>
      editingControl("proposal-swu-edit.add_phase_team_member", (where) => addSwuPhaseMembers(where, input))(),
    setScrumMaster: (input) =>
      editingControl("proposal-swu-edit.set_scrum_master", (where) => setSwuScrumMaster(where, input))(),
    fieldError: () => proposalEditFieldErrors(),
    organization: () => proposalOrganization(),
    scoresheetTab: () => tabContent(["Scoresheet", "Scoring"]),
    anonymousProponentName: () => anonymousProponent(),
    totalScore: () => scoresheetTotal(),
    rank: () => scoresheetRank(),
  };

  const proposalTwuEdit: S.ProposalTwuEditPage = {
    ...proposalEdit(
      "proposal-twu-edit",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit",
      "Team Members",
    ),
    chooseOrganization: (input) =>
      editingControl("proposal-twu-edit.choose_organization", (where) =>
        chooseProposalOrganization(where, "Team Members", input),
      )(),
    addTeamMemberForResource: (input) =>
      editingControl("proposal-twu-edit.add_team_member_for_resource", (where) =>
        addTwuResourceMember(where, input),
      )(),
    // Editing opens the create screen's form: "2. Team Members" carries an "Hourly Rate*" box
    // per resource, holding the rate the proposal was saved with, which this replaces.
    setHourlyRate: (input) =>
      editingControl("proposal-twu-edit.set_hourly_rate", (where) => setTwuHourlyRate(where, input))(),
    fieldError: () => proposalEditFieldErrors(),
    organization: () => proposalOrganization(),
    scoresheetTab: () => tabContent(["Scoresheet", "Scoring"]),
    anonymousProponentName: () => anonymousProponent(),
    totalScore: () => scoresheetTotal(),
    rank: () => scoresheetRank(),
  };

  // A vendor's own scores are on the Scoresheet tab, in a one-row table under "TEAM
  // QUESTIONS | CODE CHALLENGE | TEAM SCENARIO | PRICE | TOTAL SCORE"; the total is read from
  // that body row. Until the opportunity is awarded the tab says its scoresheet "will be
  // available once the opportunity has been awarded" and has no table, which reads as nothing.
  async function scoresheetTotal(): Promise<string> {
    await ready();
    if (!(await enterTab(["Scoresheet"]))) return "";
    await seen(page.getByRole("table")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    for (const header of ["Total Score", "Total"]) {
      const shown = await textUnder("", header);
      if (shown) return shown;
    }
    return "";
  }

  // The rank card reads "1st" over "Ranking", in the header once the proposal is ranked.
  async function scoresheetRank(): Promise<string> {
    await ready();
    const here = await valueBefore(["Ranking"]);
    if (here) return here;
    return (await enterTab(["Scoresheet"])) ? valueBefore(["Ranking"]) : "";
  }

  // Where a proponent is shown without its organization it is given a plain numbered
  // name instead. A screen about one proposal names it under "Proponent" and again as the
  // score sheet's own heading ("Proponent 1" twice), so it is read once: the value under the
  // label, else the first numbered line.
  async function anonymousProponent(): Promise<string> {
    await ready();
    // Whatever stands under the label is given whole, so an organization named beside its
    // number ("Northern Pines Digital Ltd. (Proponent 1)") is not hidden from the reader.
    const named = await valueAfter(["Proponent"]);
    if (/Proponent\s+\d+/.test(named)) return named.trim();
    // An organization's own name under the label (the vendor's copy of its proposal) is no
    // anonymised name: with no "Proponent N" on the screen there is none to report.
    return (await linesMatching(/^Proponent\s+\d+$/)).split("\n")[0] ?? "";
  }

  // A list of proponents names each of them, one per line; only anonymised names count.
  async function anonymousProponents(): Promise<string> {
    const numbered = await linesMatching(/^Proponent\s+\d+$/);
    if (numbered) return numbered;
    const named = await valueAfter(["Proponent"]);
    return /Proponent\s+\d+/.test(named) ? named.trim() : "";
  }

  const proposalCwuView: S.ProposalCwuViewPage = {
    ...at("/opportunities/code-with-us/:opportunityId/proposals/:proposalId"),
    proposalIdentifier: async () => proposalId(),
    // "Enter Score" in the top bar while the proposal is under review, "Edit Score" under
    // Actions once scored; either opens the "Total Score" dialog.
    enterScore: (input) => scoreProposal("proposal-cwu-view.enter_score", [], input),
    // Under "Actions" ("Award | Edit Score | Disqualify") once the opportunity is processing.
    awardProposal: () => awardProposal("proposal-cwu-view.award_proposal"),
    disqualifyProposal: (input) => disqualify("proposal-cwu-view.disqualify_proposal", input),
    proposalTab: () => tabContent(["Proposal Details", "Proposal"]),
    historyTab: () => tabContent(["Proposal History", "History"]),
    proponent: () => valueAfter(["Proponent"]),
    // The header draws its figures above their labels: "82.00%" over "Total Score", "1st"
    // over "Ranking", and "—" over each before a score is entered.
    score: () => stageFigure([], ["Total Score", "Score"]),
    rank: async () => (await ready(), valueBefore(["Ranking", "Rank"])),
    exportLink: async () => controlState(["Export Proposal", "Export"]),
  };

  const proposalSwuView: S.ProposalSwuViewPage = {
    ...at("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId"),
    proposalIdentifier: async () => proposalId(),
    scoreCodeChallenge: (input) =>
      scoreProposal("proposal-swu-view.score_code_challenge", ["Code Challenge"], input),
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
    // On the Team Scenario tab "Enter Score" opens "Team Scenario Score*".
    scoreTeamScenario: (input) =>
      scoreProposal("proposal-swu-view.score_team_scenario", ["Team Scenario"], input),
    awardProposal: () => awardProposal("proposal-swu-view.award_proposal"),
    disqualifyProposal: (input) => disqualify("proposal-swu-view.disqualify_proposal", input),
    proposalTab: () => tabContent(["Proposal Details", "Proposal"]),
    teamQuestionsTab: () => tabContent(["Team Questions", "Team Questions (Eval)"]),
    codeChallengeTab: () => tabContent(["Code Challenge"]),
    teamScenarioTab: () => tabContent(["Team Scenario"]),
    historyTab: () => historyRows(),
    historyEntries: () => historyEntries(),
    wrongStageError: () => wrongStageError(),
    questionsScore: () =>
      stageFigure(["Team Questions"], ["Team Questions Score", "Questions Score", "Team Questions"]),
    challengeScore: () =>
      stageFigure(["Code Challenge"], ["Code Challenge Score", "Challenge Score", "Code Challenge"]),
    scenarioScore: () =>
      stageFigure(["Team Scenario"], ["Team Scenario Score", "Scenario Score", "Team Scenario"]),
    priceScore: () => proposalPrice("sprint-with-us"),
    totalScore: () => proposalTotal(),
    rank: () => viewRank(),
    offeredScoreActions: () =>
      offeredScoreActions([
        { action: "score_code_challenge", tabs: ["Code Challenge"] },
        { action: "score_team_scenario", tabs: ["Team Scenario"] },
      ]),
  };

  const proposalTwuView: S.ProposalTwuViewPage = {
    ...at("/opportunities/team-with-us/:opportunityId/proposals/:proposalId"),
    proposalIdentifier: async () => proposalId(),
    scoreResourceQuestions: (input) =>
      scoreProposal("proposal-twu-view.score_resource_questions", ["Resource Questions"], input),
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
    // On the Interview/Challenge tab "Enter Score" opens "Challenge Score*".
    scoreChallenge: (input) =>
      scoreProposal("proposal-twu-view.score_challenge", ["Interview/Challenge", "Challenge"], input),
    awardProposal: () => awardProposal("proposal-twu-view.award_proposal"),
    disqualifyProposal: (input) => disqualify("proposal-twu-view.disqualify_proposal", input),
    proposalTab: () => tabContent(["Proposal Details", "Proposal"]),
    resourceQuestionsTab: () => tabContent(["Resource Questions", "Resource Questions (Eval)"]),
    challengeTab: () => tabContent(["Interview/Challenge", "Challenge"]),
    historyTab: () => historyRows(),
    historyEntries: () => historyEntries(),
    wrongStageError: () => wrongStageError(),
    questionsScore: () =>
      stageFigure(["Resource Questions"], ["Resource Questions Score", "Questions Score", "Resource Questions"]),
    challengeScore: () =>
      stageFigure(["Interview/Challenge", "Challenge"], ["Challenge Score", "Interview/Challenge Score", "Interview/Challenge"]),
    priceScore: () => proposalPrice("team-with-us"),
    totalScore: () => proposalTotal(),
    rank: () => viewRank(),
    offeredScoreActions: () =>
      offeredScoreActions([
        { action: "score_resource_questions", tabs: ["Resource Questions", "Resource Questions (Eval)"] },
        { action: "score_challenge", tabs: ["Interview/Challenge", "Challenge"] },
      ]),
  };

  // A proposal's own screen shows only "Total Score" and "Ranking"; its price score is the
  // "PRICE" column of the opportunity's Proposals table ("PROPONENT | STATUS | TQ | CC | TS |
  // PRICE | TOTAL" on edit?tab=proposals, seen as the administrator on the seeded Sprint With
  // Us opportunity in processing), in the row whose proponent links to this proposal. The
  // table is read and the proposal's screen opened again. A reader not shown that table, or a
  // row showing "—", has no price score shown to it.
  async function proposalPrice(programme: string): Promise<string> {
    await ready();
    const here = await figureAbove(["Price Score", "Price"]);
    if (here) return here;
    const back = page.url();
    const proposal = proposalId();
    await page.goto(`${baseURL}/opportunities/${programme}/${opportunityId()}/edit?tab=proposals`);
    await ready();
    const tables = seen(page.getByRole("table"));
    await tables.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    let found = "";
    let priced = false;
    const tableCount = await tables.count();
    for (let t = 0; t < tableCount && !found; t++) {
      const table = tables.nth(t);
      const headers = (await table.getByRole("columnheader").allInnerTexts()).map((h) => h.trim().toLowerCase());
      const column = headers.findIndex((h) => h === "price" || h === "price score");
      if (column < 0) continue;
      priced = true;
      const rows = table.getByRole("row");
      const rowCount = await rows.count();
      for (let r = 0; r < rowCount && !found; r++) {
        const links = rows.nth(r).getByRole("link");
        const linkCount = await links.count();
        let ours = false;
        for (let l = 0; l < linkCount && !ours; l++) {
          ours = ((await links.nth(l).getAttribute("href")) ?? "").includes(proposal);
        }
        if (!ours) continue;
        const cells = rows.nth(r).getByRole("cell");
        if ((await cells.count()) > column) found = (await cells.nth(column).innerText()).trim();
      }
    }
    // A reader not shown the Proposals table (the vendor gets "Not Found" there) is shown the
    // price on the exported proposal instead, under "Scores": "Price" over its figure, or "-"
    // while it is withheld (seen as the owner of Northern Pines on its own proposal to the
    // seeded Sprint With Us opportunity in processing).
    if (!priced) {
      await page.goto(`${baseURL}/opportunities/${programme}/${opportunityId()}/proposals/${proposal}/export`);
      await ready();
      if (!(await notFoundShown())) found = await valueAfter(["Price", "Price Score"]);
    }
    await page.goto(back);
    await ready();
    return /^[—–-]$/.test(found) ? "" : found;
  }

  // The "Total Score" card sits in the header of the Proposal Details tab alone; a stage's
  // tab (Team Scenario, Interview/Challenge) carries its own score and not the total, so the
  // details tab is opened before the figure over "Total Score" is read.
  async function proposalTotal(): Promise<string> {
    await ready();
    await enterTab(["Proposal Details", "Proposal"]);
    return figureAbove(["Total Score"]);
  }

  // The entries of a proposal's History panel, one per table row, and nothing else: the
  // screen around the panel carries the other tabs' names ("Code Challenge"), and a panel not
  // yet open says "This proposal's history will be available once the opportunity reaches the
  // Code Challenge." with no table under it, which is no history entry.
  async function historyRows(): Promise<string> {
    return inTab(["Proposal History", "History"], async () => {
      await seen(page.getByRole("table")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      return tableRows(false, true);
    });
  }

  // The same rows as entries, newest first, one per line as "<kind> | <note> | <who> | <when>".
  // The History table is "ENTRY TYPE | NOTE | CREATED", its created cell the date and time
  // over the maker's name, drawn in capitals but read as written ("System", "Blake Placeholder"), and a row with no
  // note shows "—" (seen as the administrator on the seeded proposals past consensus of both
  // programmes). Before the opportunity reaches the stage after consensus the panel says the
  // history "will be available once the opportunity reaches the Code Challenge" and holds no
  // table: the tab was reached and shows no entries, so that reads as nothing.
  async function historyEntries(): Promise<string> {
    return inTab(["Proposal History", "History"], async () => {
      await seen(page.getByRole("table")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      const lines: string[] = [];
      const tables = seen(page.getByRole("table"));
      const tableCount = await tables.count();
      for (let t = 0; t < tableCount; t++) {
        const rows = tables.nth(t).getByRole("row");
        const rowCount = await rows.count();
        for (let r = 0; r < rowCount; r++) {
          const cells = rows.nth(r).getByRole("cell");
          const cellCount = await cells.count();
          if (!cellCount) continue;
          const texts: string[] = [];
          for (let c = 0; c < cellCount; c++) texts.push((await cellText(cells.nth(c))).trim());
          const kind = (texts[0] ?? "").replace(/\s*\n\s*/g, " ");
          const note = (texts[1] ?? "").replace(/\s*\n\s*/g, " ").replace(/^[—–-]$/, "");
          const created = (texts[2] ?? "").split(/\n+/).map((each) => each.trim()).filter(Boolean);
          const who = created.length > 1 ? created[created.length - 1] : "";
          const when = (created.length > 1 ? created.slice(0, -1) : created).join(" ");
          lines.push([kind, note, who, when].join(" | "));
        }
      }
      return lines.join("\n");
    });
  }

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
    // One line per proposal, its cells joined, so a title reads beside its status.
    myProposalsTable: () => inTab(["My Proposals"], () => tableRows()),
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
    // A withheld owner is shown as a dash, which is no name.
    ownerName: async () => {
      const shown = await textUnder("", "Owner");
      return /^[—–-]$/.test(shown) ? "" : shown;
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

  // The icon drawn furthest right on the same row as a box: the one that adds another box.
  async function markBesideRightmost(scope: Scope, box: Locator): Promise<Locator | null> {
    const edge = await box.boundingBox();
    if (!edge) return null;
    const marks = seen(scope.getByRole("img"));
    const count = await marks.count();
    let best: Locator | null = null;
    let furthest = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < count; i++) {
      const mark = await marks.nth(i).boundingBox();
      if (!mark) continue;
      const middle = mark.y + mark.height / 2;
      if (middle < edge.y || middle > edge.y + edge.height) continue;
      if (mark.x < edge.x + edge.width - 1 || mark.x <= furthest) continue;
      furthest = mark.x;
      best = marks.nth(i);
    }
    return best;
  }

  async function colourOf(locator: Locator): Promise<string> {
    return locator.evaluate((element) => getComputedStyle(element).color).catch(() => "");
  }

  // "Team Capabilities" lists all nine capabilities whatever the team holds; one held is drawn
  // in the same ink as the section's heading, one not held is drawn muted.
  async function heldCapabilities(): Promise<string> {
    const heading = seen(page.getByRole("heading", { name: "Team Capabilities", exact: true })).first();
    if (!(await heading.count())) return "";
    const ink = await colourOf(heading);
    const prose = await proseLines();
    const names = (await sectionFrom(["Team Capabilities"])).split("\n").filter((line) => line && !prose.has(line));
    const held: string[] = [];
    for (const name of names) {
      const shown = seen(page.getByText(name, { exact: true }));
      const count = await shown.count();
      if (count && (await colourOf(shown.nth(count - 1))) === ink) held.push(name);
    }
    return held.join("\n");
  }

  // A requirement under "Requirements" with the mark before it: a met one is marked in a
  // colour of its own, an unmet one in the same ink as its words.
  async function requirement(pattern: RegExp): Promise<string> {
    const lines = await sectionFrom(["Requirements"], ["Service Areas", "Terms & Conditions"]);
    const line = lines.split("\n").find((candidate) => matches(pattern, candidate));
    if (!line) return "";
    const words = seen(page.getByText(pattern));
    const count = await words.count();
    if (!count) return "";
    const text = words.nth(count - 1);
    const edge = await text.boundingBox();
    if (!edge) return line;
    const marks = seen(page.getByRole("img"));
    const markCount = await marks.count();
    let mark: Locator | null = null;
    let nearest = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < markCount; i++) {
      const box = await marks.nth(i).boundingBox();
      if (!box || box.x + box.width > edge.x + 1) continue;
      if (box.y + box.height < edge.y || box.y > edge.y + edge.height) continue;
      if (box.x > nearest) {
        nearest = box.x;
        mark = marks.nth(i);
      }
    }
    if (!mark) return line;
    const met = (await colourOf(mark)) !== (await colourOf(text));
    return `${met ? "Met" : "Not met"}: ${line}`;
  }

  // What the organization form said about its logo when a save was last made from it, and on
  // which organization's page.
  let logoRefusal: { at: string; message: string } | null = null;

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
      // "Save Changes?" must be confirmed before anything is stored.
      await confirmDialog(where, ["Save Changes"]);
      // A save that went through closes the form; a refused one leaves it open under
      // "Unable to Update Organization", which is the outcome as much as the closing is.
      const closing = seen(navBar().getByText("Save Changes", { exact: true })).first();
      for (let wait = 0; wait < 120; wait++) {
        if (!(await closing.count())) break;
        if ((await everyAlert(/unable|could not/i)).length) break;
        await page.waitForTimeout(250);
      }
      await ready();
      // The logo's refusal is drawn under "Choose Image" only while the form stays open, so
      // it is taken now, before current_logo closes the form to read what is stored.
      logoRefusal = { at: new URL(page.url()).pathname, message: await messages(/logo|image/i) };
    },
    // Input: a file by name and content. "Choose Image" (under "Profile Picture (Optional)",
    // offered once "Edit Organization" has opened the form) raises the chooser; it lists
    // .jpg, .jpeg and .png, but the file handed to it is offered whatever its ending.
    changeLogo: async (input) => {
      const where = "organization-edit.change_logo";
      await ready();
      if (!(await findControl(navBar(), "Save Changes"))) {
        if (!(await findControl(navBar(), "Edit Organization"))) await enterTab(["Organization"]);
        await press(where, ["Edit Organization"], navBar());
      }
      await chooseImage(where, pictureOf(input) ?? input);
    },
    // The stored logo's address, as the closed form shows it; the placeholder
    // ("/images/default_organization_logo.svg") is no stored logo and reads as nothing. A form
    // left open after a refused save shows its unsaved preview, so it is cancelled first.
    currentLogo: async () => {
      await ready();
      if (await findControl(navBar(), "Save Changes")) {
        await press("organization-edit.current_logo", ["Cancel"], navBar());
        await settle();
      }
      if (!(await findControl(navBar(), "Edit Organization"))) await enterTab(["Organization"]);
      return storedImageAddress();
    },
    // "Please select a different logo image." under "Choose Image" (seen as the owner of
    // Northern Pines offering a .txt file and saving). Empty when the logo was accepted.
    logoRefusedError: async () => {
      await ready();
      const shown = await messages(/logo|image/i);
      if (shown) return shown;
      return logoRefusal && logoRefusal.at === new URL(page.url()).pathname ? logoRefusal.message : "";
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
        const invited = emailsIn(input);
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
      const addresses = emailsIn(input);
      if (!addresses.length) addresses.push(...asList(input));
      if (addresses.length) {
        const where = "organization-edit.add_team_members";
        if (!(await dialog().count())) throw new Error(`unbound: ${where} — no dialog opened on ${page.url()}`);
        const scope = dialog().first();
        // One address per box; the icon drawn furthest right beside the last box adds another.
        for (let i = 0; i < addresses.length; i++) {
          const boxes = seen(scope.getByRole("textbox"));
          if ((await boxes.count()) <= i) {
            const adder = await markBesideRightmost(scope, boxes.last());
            if (adder) await adder.click();
            await boxes.nth(i).waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
            if ((await boxes.count()) <= i) {
              throw new Error(
                `unbound: ${where} — pressed the icon beside the last "Email Addresses" box but no box appeared for "${addresses[i]}" on ${page.url()}`,
              );
            }
          }
          await boxes.nth(i).fill(addresses[i]);
          await boxes.nth(i).blur().catch(() => undefined);
        }
        await settle();
        await inDialog(where, ["Add Team Member(s)", "Add"]);
        await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
        await settle();
      }
    },
    // The Team tab draws each row's "Approve" (a pending member, offered to an administrator)
    // and "Remove" only while the pointer is over that row; the owner is offered no
    // "Approve" and nobody is offered "Remove" on the owner's own row. A row that shows no
    // such control when pointed at is this reader being refused, and nothing is pressed.
    approvePendingMember: (input) =>
      rowAction("organization-edit.approve_pending_member", "Approve", ["Approve Request", "Approve"], input, true),
    removeTeamMember: (input) =>
      rowAction("organization-edit.remove_team_member", "Remove", ["Remove Team Member", "Remove"], input, false),
    toggleMemberAdminStatus: (input) =>
      toggleMemberAdmin("organization-edit.toggle_member_admin_status", input),
    // Granting admin raises "Please Confirm", whose box must be ticked before "Share Admin
    // Access" will go. With that dialog open the agreement completes it; called before any
    // member's box was ticked, the agreement is kept for the tick that follows, or the named
    // member's box is ticked now to raise it.
    acceptOrgAdminTerms: async (input) => {
      const where = "organization-edit.accept_org_admin_terms";
      if (!(await dialog().count())) {
        adminTermsAgreed = true;
        const hasMember =
          input && typeof input === "object" && ("member" in (input as object) || "user" in (input as object));
        if (hasMember) await toggleMemberAdmin(where, input);
        return;
      }
      await agreeToAdminTerms(where);
    },
    // "Change Owner" in the Team tab's top bar opens a dialog listing the other members by
    // name, each a choice that is ticked when pressed, above its own "Change Owner" and
    // "Cancel". The new owner is handed over by name, address or as a seeded user
    // ({ newOwner: { id, email } }); a seeded vendor carries no name, so it is looked up in the
    // organization's own membership list, the one the Team tab is drawn from.
    changeOwner: async (input) => {
      const where = "organization-edit.change_owner";
      await openTab(where, ["Team"]);
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const who = record.newOwner ?? record.new_owner ?? record.owner ?? record.member ?? record.user ?? input;
      const named = who && typeof who === "object" ? (who as Record<string, unknown>).name : undefined;
      const id = userIdOf(who);
      let name = typeof named === "string" && named ? named : id ? await memberName({ member: { id } }) : "";
      if (!name && typeof who === "string" && !/@/.test(who)) name = who;
      if (!name) nothing(`${where} — no new owner could be named from ${JSON.stringify(input)}`);
      await press(where, ["Change Owner"], navBar());
      await dialog().first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      if (!(await dialog().count())) nothing(`${where} — pressing "Change Owner" opened no dialog on ${page.url()}`);
      const choice = seen(dialog().first().getByText(name, { exact: true }));
      if (!(await choice.count())) {
        const offered = (await dialogText()).replace(/\n/g, " | ");
        await dismissDialog();
        // The person is not offered as a new owner: the refusal the test goes on to read.
        throw new Error(`${where} — the "Change Owner" dialog on ${page.url()} does not offer "${name}"; it shows: ${offered}`);
      }
      await choice.first().click();
      await settle();
      await inDialog(where, ["Change Owner"]);
      await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
      await settle();
    },
    editServiceAreas: async () => {
      await openTab("organization-edit.edit_service_areas", ["TWU Qualification"]);
      await press("organization-edit.edit_service_areas", ["Edit"], navBar());
    },
    // The boxes are set to exactly the areas given, then the save is confirmed in "Are you
    // sure?" before the list is stored.
    saveServiceAreas: async (input) => {
      const where = "organization-edit.save_service_areas";
      await ready();
      if (!(await findControl(navBar(), "Save Changes"))) {
        await openTab(where, ["TWU Qualification"]);
        await press(where, ["Edit"], navBar());
      }
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const listed = Array.isArray(input)
        ? input
        : record.serviceAreas ?? record.service_areas ?? record.areas ?? record.serviceArea;
      if (listed !== undefined) {
        const wanted = asList(listed).map(squash);
        const boxes = seen(page.getByRole("checkbox"));
        const count = await boxes.count();
        for (let i = 0; i < count; i++) {
          const box = boxes.nth(i);
          if (await box.isDisabled()) continue;
          const name = squash(await accessibleName(box));
          if ((await box.isChecked()) !== wanted.includes(name)) await box.click();
        }
        await settle();
      }
      await press(where, ["Save Changes"], navBar());
      await confirmDialog(where, ["Save Changes"]);
      await saved(["Save Changes"]);
    },
    viewSwuTerms: async () => {
      await openTab("organization-edit.view_swu_terms", ["SWU Qualification"]);
      await press("organization-edit.view_swu_terms", ["View Terms & Conditions"]);
    },
    viewTwuTerms: async () => {
      await openTab("organization-edit.view_twu_terms", ["TWU Qualification"]);
      await press("organization-edit.view_twu_terms", ["View Terms & Conditions"]);
    },
    // The tab with its top-bar controls ("Edit Organization") kept, and the values of its
    // boxes, which the screen's text leaves out while they are read-only.
    organizationTab: () =>
      inTab(["Organization"], async () => [await screenText(), ...(await fieldValues())].join("\n")),
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
    teamMemberRow: () => inTab(["Team"], teamRowsText),
    teamCapabilities: () => inTab(["Team"], heldCapabilities),
    // The requirement's words read the same met or not; its mark says which ("Met: ..." or
    // "Not met: ...") — success-coloured when met, the body's ink when not.
    swuRequirementTwoMembers: () =>
      inTab(["SWU Qualification"], () => requirement(/^At least two team members\.?$/i)),
    swuRequirementAllCapabilities: () =>
      inTab(["SWU Qualification"], () => requirement(/^Team members collectively possess all capabilities\.?$/i)),
    swuRequirementTermsAccepted: () =>
      inTab(["SWU Qualification"], () => requirement(/^Agreed to Sprint With Us Terms & Conditions\.?$/i)),
    twuRequirementServiceArea: () =>
      inTab(["TWU Qualification"], () => requirement(/one or more Service Areas/i)),
    twuRequirementTermsAccepted: () =>
      inTab(["TWU Qualification"], () =>
        linesMatching(/agreed to the team with us|agreed to team with us/i),
      ),
    // The areas whose boxes are ticked, written the way records store them
    // ("Full Stack Developer" as "FULL_STACK_DEVELOPER").
    serviceAreaCheckbox: () =>
      inTab(["TWU Qualification"], async () => {
        const boxes = seen(page.getByRole("checkbox"));
        const count = await boxes.count();
        const ticked: string[] = [];
        for (let i = 0; i < count; i++) {
          if (!(await boxes.nth(i).isChecked())) continue;
          const name = (await accessibleName(boxes.nth(i))).trim();
          if (name) ticked.push(name.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, ""));
        }
        return ticked.join("\n");
      }),
    notQualifiedNotice: () => linesMatching(/not qualified/i),
    changelogEntry: () => inTab(["Changelog"], tableText),
    // A warning such as "Unable to Add Unregistered Team Members" is an alert listing the
    // addresses it is about; it is read whole, alongside any message beside a field.
    fieldError: async () =>
      [await alertMessages(), await messages()].filter(Boolean).join("\n"),
    organizationIdentifier: async () => organizationId(),
    // The latest refusal, whole, when the invitation was refused; otherwise whatever
    // messages the screen is showing.
    async invalidMembershipTypeError() {
      // An invitation made through the Team dialog sends no request of ours to read.
      return (lastAnswer ? refusal((status) => status >= 400) : "") || messages();
    },
  };

  async function rowAction(
    where: string,
    label: string,
    confirm: string[],
    input: unknown,
    pendingOnly: boolean,
  ): Promise<void> {
    await openTab(where, ["Team"]);
    const name = await memberName(input);
    const body = seen(page.getByRole("row")).filter({ has: page.getByRole("cell") });
    await body.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    let rows = name ? body.filter({ hasText: name }) : body;
    if (!name && pendingOnly) rows = rows.filter({ hasText: /Pending/ });
    if (!(await rows.count())) {
      nothing(`${where} — the Team tab on ${page.url()} lists no ${name ? `member named "${name}"` : pendingOnly ? "pending member" : "member"}`);
    }
    await rows.first().hover();
    const control = seen(rows.first().getByText(label, { exact: true }));
    await control.first().waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
    if (!(await control.count())) return;
    await control.last().click();
    await settle();
    await confirmIfAsked(where, confirm);
  }

  // The Team table's Admin column is a box with no words, so each row states it. The table
  // names each member by name alone, and neither it nor the member's own "View Team Member"
  // dialog shows an address (an owner may not read other users' records either), so each row
  // also carries the member's address: the organization's membership list pairs the name
  // with the account, and the seed pairs the account with its address.
  async function teamRowsText(): Promise<string> {
    const addresses = await teamAddressesByName();
    const lines: string[] = [];
    const tables = seen(page.getByRole("table"));
    const tableCount = await tables.count();
    for (let t = 0; t < tableCount; t++) {
      const rows = tables.nth(t).getByRole("row");
      const rowCount = await rows.count();
      for (let r = 0; r < rowCount; r++) {
        let text = (await rows.nth(r).innerText()).replace(/\s*\t\s*/g, " | ").replace(/\s*\n\s*/g, " ").trim();
        const cells = rows.nth(r).getByRole("cell");
        if (await cells.count()) {
          const shownName = ((await cells.first().innerText()).split("\n")[0] ?? "").trim();
          const address = addresses.get(shownName);
          if (address) text += ` | ${address}`;
        }
        const box = rows.nth(r).getByRole("checkbox");
        if (await box.count()) text += ` | Admin: ${(await box.first().isChecked()) ? "yes" : "no"}`;
        if (text) lines.push(text);
      }
    }
    return lines.join("\n");
  }

  async function teamAddressesByName(): Promise<Map<string, string>> {
    const found = new Map<string, string>();
    let organization = "";
    try {
      organization = organizationId();
    } catch {
      return found;
    }
    const response = await page.request
      .get(`${baseURL}/api/affiliations?organization=${organization}`)
      .catch(() => null);
    if (!response || response.status() !== 200) return found;
    const listed: unknown = await response.json().catch(() => []);
    for (const affiliation of Array.isArray(listed) ? listed : []) {
      const user = (affiliation as { user?: { id?: string; name?: string; email?: string } }).user;
      if (!user?.name) continue;
      const address = user.email || (user.id ? seedUserFor(user.id)?.email : "") || "";
      if (address) found.set(user.name.trim(), address);
    }
    return found;
  }

  // Every address a test handed over, wherever it put it: a list, "email", or a nested user
  // record ({ user: { email } }).
  function emailsIn(input: unknown): string[] {
    const found: string[] = [];
    const visit = (value: unknown, depth: number, anyKey: boolean): void => {
      if (value === undefined || value === null || depth > 4) return;
      if (typeof value === "string") {
        if (/^[^\s@,]+@[^\s@,]+$/.test(value.trim())) found.push(value.trim());
        return;
      }
      if (Array.isArray(value)) {
        for (const item of value) visit(item, depth + 1, true);
        return;
      }
      if (typeof value !== "object") return;
      for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
        if (anyKey || /email|user|member|invite/i.test(key)) visit(inner, depth + 1, true);
      }
    };
    visit(input, 0, false);
    if (!found.length) visit(input, 0, true);
    return [...new Set(found)];
  }

  // The Team tab names each member by name alone. A seed user carries an identifier and an
  // address but no name, so the name is taken from the organization's own membership list,
  // the one the Team tab itself is drawn from.
  async function memberName(input: unknown): Promise<string> {
    const record =
      input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    const who = record.member ?? record.user ?? input;
    if (typeof who === "string" && !new RegExp(`^${UUID}$`).test(who)) return who;
    const person: Record<string, unknown> =
      who && typeof who === "object" ? (who as Record<string, unknown>) : { id: who };
    if (typeof person.name === "string" && person.name) return person.name;
    const id = typeof person.id === "string" ? person.id : "";
    if (!id) return "";
    let organization = "";
    try {
      organization = organizationId();
    } catch {
      return "";
    }
    const response = await page.request
      .get(`${baseURL}/api/affiliations?organization=${organization}`)
      .catch(() => null);
    if (!response || response.status() !== 200) return "";
    const listed: unknown = await response.json().catch(() => []);
    for (const affiliation of Array.isArray(listed) ? listed : []) {
      const user = (affiliation as { user?: { id?: string; name?: string } }).user;
      if (user?.id === id && user.name) return user.name;
    }
    return "";
  }

  let adminTermsAgreed = false;

  async function agreeToAdminTerms(where: string): Promise<void> {
    const box = seen(dialog().first().getByRole("checkbox"));
    if ((await box.count()) && !(await box.first().isChecked())) await box.first().click();
    await press(where, ["Share Admin Access", "Confirm"], dialog().first());
    await dialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  async function toggleMemberAdmin(where: string, input: unknown): Promise<void> {
    // A reader not offered the Team tab may not change anyone's admin rights.
    if (!(await enterTab(["Team"]))) return;
    const name = await memberName(input);
    if (!name) {
      nothing(`${where} — no member name could be found for ${JSON.stringify(input)} on ${page.url()}`);
    }
    const row = seen(page.getByRole("row").filter({ hasText: name }));
    if (!(await row.count())) {
      nothing(`${where} — the Team tab lists no member named "${name}" on ${page.url()}`);
    }
    const box = seen(row.first().getByRole("checkbox"));
    // The owner's box, or any this reader may not change, is drawn disabled: the refusal.
    if (!(await box.count()) || (await box.first().isDisabled())) return;
    await box.first().click();
    await dialog().first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    if (await dialog().count()) {
      if (await seen(dialog().first().getByRole("checkbox")).count()) {
        if (adminTermsAgreed) await agreeToAdminTerms(where);
      } else {
        await confirmIfAsked(where, ["Remove Admin Access", "Revoke Admin Access", "Confirm", "Yes"]);
      }
    }
    await settle();
  }

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

    // The seeded invitation still awaiting an answer to the organization named (any, when none
    // is), preferring one held by the person whose profile is open.
    const seededInvitation = (name: string): string => {
      type Held = { id?: string; user?: string; organization?: string; membership_status?: string };
      const groups = seed as unknown as Record<string, Record<string, Record<string, unknown>>>;
      const handle = (ref: unknown): Record<string, unknown> | undefined => {
        const [group, key] = String(ref ?? "").split(".");
        return group && key ? groups[group]?.[key] : undefined;
      };
      const profile = new RegExp(`^/users/(${UUID})`).exec(new URL(page.url()).pathname)?.[1] ?? "";
      const held = Object.values((groups.affiliations ?? {}) as unknown as Record<string, Held>).filter(
        (each) =>
          each.membership_status === "PENDING" &&
          (!name || UUID_ONLY.test(name)
            ? !name || handle(each.organization)?.id === name
            : squash(String(handle(each.organization)?.legal_name ?? "")) === squash(name)),
      );
      const mine = held.find((each) => profile && handle(each.user)?.id === profile);
      return (mine ?? held[0])?.id ?? "";
    };

    // A pending invitation's row under "Affiliated Organizations" shows "Approve" and "Reject"
    // only while the pointer is over it (seen as the invited vendor on Salt Marsh Labs Ltd.);
    // either raises "Approve Request?" / "Reject Request?". The row is the organization the
    // input names, else the first one marked Pending.
    const answerInvitation =
      (member: string, answer: "approve" | "reject") =>
      async (input?: unknown): Promise<void> => {
        const label = answer === "approve" ? "Approve" : "Reject";
        if (!(await confirmation(answer).count())) {
          await ready();
          // The invitation message's "Reject" link leads to the profile's first tab (its address
          // says "tab=organization"), where no confirmation opens; the answer is then given
          // from the Organizations tab, as a person landing there would.
          if (!(await seen(page.getByRole("heading", { name: "Affiliated Organizations" })).count())) {
            await enterTab(["Organizations"]);
          }
          const seededOrganization = (id: string): boolean =>
            Object.values(seed.organizations as unknown as Record<string, { id?: string }>).some((each) => each.id === id);
          const affiliation =
            field(input, "invitationAffiliationId", "affiliationId", "affiliation") ||
            (typeof input === "string" && UUID_ONLY.test(input) && !seededOrganization(input) ? input : "");
          const name = affiliation ? "" : organizationNamed(input);
          // The row's hidden "Approve" and "Reject" run straight on from its "Pending" badge in
          // the row's text ("Ltd.PendingApproveReject"), so the badge is not a word of its own.
          const pending = seen(page.getByRole("row").filter({ hasText: /Pending/ }));
          // The tab draws its table a while after the profile, on a target in development mode.
          await pending.first().waitFor({ state: "visible", timeout: 15000 }).catch(() => undefined);
          const rows = name && !UUID_ONLY.test(name) ? pending.filter({ hasText: name }) : pending;
          const shownRows = await rows.count();
          let offered = false;
          if (!affiliation && (await rows.count())) {
            await rows.first().hover();
            const control = seen(rows.first().getByText(label, { exact: true }));
            await control.first().waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
            if (await control.count()) {
              await control.last().click();
              await settle();
              offered = true;
            }
          }
          // No row to point at: the invitation is answered from its own address, the one its
          // message's buttons lead to — the affiliation the input gives, else the seeded
          // pending invitation to the organization it names (seen as the invited vendor:
          // "?tab=organizations&invitationAffiliationId=…&invitationResponse=approve" opens
          // "Approve Request?" over the Organizations tab).
          const viaAddress = offered ? "" : affiliation || seededInvitation(name);
          const looked = `looked on ${page.url()} for ${name ? `a pending row for "${name}"` : "a row marked Pending"} showing "${label}" when pointed at (${shownRows} such rows)`;
          if (viaAddress) {
            await go(
              `/users/me?tab=organizations&invitationAffiliationId=${encodeURIComponent(viaAddress)}&invitationResponse=${answer}`,
            );
            await confirmation(answer).first().waitFor({ state: "visible", timeout: 15000 }).catch(() => undefined);
            if (!(await confirmation(answer).count())) {
              throw new Error(
                `unbound: ${where}.${member} — ${looked}, then opened the invitation's own address for affiliation ${viaAddress} and no "${label} Request?" confirmation opened on ${page.url()}; the signed-in person has no unanswered invitation there`,
              );
            }
          } else if (!offered) {
            throw new Error(`unbound: ${where}.${member} — ${looked}, and the seed holds no pending invitation to answer from its own address`);
          }
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
      // An active affiliation's row shows "Leave" only while pointed at (seen as the
      // organization admin on Northern Pines Digital Ltd.), confirmed in "Leave Organization?"
      // with "Leave Organization". A row showing none — an owned organization — is refused.
      leaveOrganization: async (input?: unknown): Promise<void> => {
        const member = `${where}.leave_organization`;
        await ready();
        if (!(await seen(page.getByRole("heading", { name: "Affiliated Organizations" })).count())) {
          await enterTab(["Organizations"]);
        }
        const name = organizationNamed(input);
        const body = seen(page.getByRole("row")).filter({ has: page.getByRole("cell") });
        await body.first().waitFor({ state: "visible", timeout: LATE_CONTROL_MS }).catch(() => undefined);
        const rows = name ? body.filter({ hasText: name }) : body;
        const count = await rows.count();
        for (let i = 0; i < count; i++) {
          await rows.nth(i).hover();
          const control = seen(rows.nth(i).getByText("Leave", { exact: true }));
          await control.first().waitFor({ state: "visible", timeout: 1000 }).catch(() => undefined);
          if (!(await control.count())) continue;
          await control.last().click();
          await settle();
          await confirmIfAsked(member, ["Leave Organization", "Leave"]);
          return;
        }
        if (!count) nothing(`${member} — the Organizations tab on ${page.url()} lists no ${name ? `organization named "${name}"` : "organization"}`);
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

  // /sign-up/complete shows its form only to an account that has not yet agreed to the terms
  // (the seeded vendorCompletingProfile, reached at /auth/createsessionvendor/17, is sent
  // there from every screen). Anyone who has agreed is sent on: signed out to /sign-in,
  // everyone else to /dashboard. The form is "You're almost done!": a "Choose Image" picture,
  // the identity provider's username as a disabled box ("GitHub" or "IDIR"), "Name*",
  // "Email Address*" (and "Job Title" for public sector staff), the terms box, the
  // "Notify me about new opportunities." box, and "Complete Profile", held back until the
  // terms box is ticked.
  const SIGN_UP_TERMS = /terms|agree/i;
  const SIGN_UP_NOTICES = "Notify me about new opportunities";
  const SIGN_UP_TERMS_KEYS = [
    "acceptTerms", "accept_terms", "acceptAppTerms", "accept_app_terms", "terms", "acceptedTerms",
    "agree", "agreed",
  ];
  const SIGN_UP_NOTICE_KEYS = [
    "notifications", "notificationsOn", "notifyNewOpportunities", "newOpportunities",
    "new_opportunities", "toggleNewOpportunityNotifications", "toggle_new_opportunity_notifications",
    "notify", "optIn",
  ];

  // Whether /sign-up/complete sent the visitor somewhere else rather than showing its form.
  async function signUpCompleteLeft(): Promise<boolean> {
    await ready();
    await page
      .waitForURL((url) => url.pathname !== "/sign-up/complete", { timeout: 5000 })
      .catch(() => undefined);
    return new URL(page.url()).pathname !== "/sign-up/complete";
  }

  // The form must be on screen for an action or a field to be read at all; a visitor sent on
  // never reached it.
  async function onSignUpForm(member: string): Promise<void> {
    if (await signUpCompleteLeft()) {
      throw new Error(
        `unbound: user-sign-up-complete.${member} — /sign-up/complete sent this visitor on to ${page.url()} instead of showing the profile form; it is shown only to an account that has not yet agreed to the terms (vendorCompletingProfile, /auth/createsessionvendor/17)`,
      );
    }
    await seen(page.getByRole("checkbox", { name: SIGN_UP_TERMS }))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
  }

  // A state the test gave for a box ({ checked: false }, false, "no"), or undefined when it
  // gave none.
  function boxState(input: unknown, keys: string[] = []): boolean | undefined {
    if (typeof input === "boolean") return input;
    if (typeof input === "string" && isYesNo(input)) return saysYes(input);
    if (input && typeof input === "object" && !Array.isArray(input)) {
      const record = input as Record<string, unknown>;
      for (const key of [...keys, "checked", "value", "on", "enabled", "state"]) {
        const found = record[key];
        if (typeof found === "boolean") return found;
        if (typeof found === "string" && isYesNo(found)) return saysYes(found);
      }
    }
    return undefined;
  }

  async function setSignUpBox(where: string, name: string | RegExp, wanted: boolean | undefined): Promise<void> {
    const box = seen(page.getByRole("checkbox", { name }));
    if (!(await box.count())) {
      throw new Error(`unbound: ${where} — the profile form on ${page.url()} shows no box labelled "${String(name)}"`);
    }
    const target = wanted ?? !(await box.first().isChecked());
    if ((await box.first().isChecked()) !== target) await box.first().click();
    await settle();
  }

  const userSignUpComplete: S.UserSignUpCompletePage = {
    ...at("/sign-up/complete"),
    changeAvatar: async (input?: unknown) => {
      await onSignUpForm("change_avatar");
      await chooseImage("user-sign-up-complete.change_avatar", pictureOf(input) ?? input);
    },
    // Ticks the terms box, or leaves it as the test says ({ checked: false }).
    acceptAppTerms: async (input?: unknown) => {
      await onSignUpForm("accept_app_terms");
      await setSignUpBox(
        "user-sign-up-complete.accept_app_terms",
        SIGN_UP_TERMS,
        boxState(input, SIGN_UP_TERMS_KEYS) ?? true,
      );
    },
    // Turns the notices box over, or sets it to the state the test gave.
    toggleNewOpportunityNotifications: async (input?: unknown) => {
      await onSignUpForm("toggle_new_opportunity_notifications");
      await setSignUpBox(
        "user-sign-up-complete.toggle_new_opportunity_notifications",
        SIGN_UP_NOTICES,
        boxState(input, SIGN_UP_NOTICE_KEYS),
      );
    },
    // Every value the test gave is entered first — the fields by label, the picture through
    // "Choose Image", the terms and notices boxes by what the test said of them — and then
    // "Complete Profile" is pressed. Held back (terms not ticked, a field refused) it is
    // reported at once with what the page shows; pressed, the application takes the visitor
    // off /sign-up/complete.
    completeProfile: async (input?: unknown) => {
      const where = "user-sign-up-complete.complete_profile";
      await onSignUpForm("complete_profile");
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const has = (keys: string[]) => keys.some((key) => record[key] !== undefined);
      if (has(SIGN_UP_TERMS_KEYS)) {
        await setSignUpBox(where, SIGN_UP_TERMS, boxState(input, SIGN_UP_TERMS_KEYS) ?? true);
      }
      if (has(SIGN_UP_NOTICE_KEYS)) {
        await setSignUpBox(where, SIGN_UP_NOTICES, boxState(input, SIGN_UP_NOTICE_KEYS) ?? true);
      }
      await fillForm(where, input, { skip: [...LOGO_KEYS, ...SIGN_UP_TERMS_KEYS, ...SIGN_UP_NOTICE_KEYS] });
      const picture = pictureOf(input);
      if (picture !== undefined) await chooseImage(where, picture);
      await press(where, ["Complete Profile"]);
      const left = await page
        .waitForURL((url) => url.pathname !== "/sign-up/complete", { timeout: 20000 })
        .then(() => true)
        .catch(() => false);
      if (!left) {
        const shown = [await alertMessages(), await messages().catch(() => "")].filter(Boolean).join(" | ");
        throw new Error(
          `${where} — "Complete Profile" was pressed but the page stayed on ${page.url()}; ${
            shown ? `the page shows: ${shown.replace(/\n/g, " ")}` : "the page shows no message"
          }`,
        );
      }
      await ready();
    },
    idpUsernameReadonly: async () => {
      await onSignUpForm("idp_username_readonly");
      return fieldValue(["GitHub", "IDIR"]);
    },
    nameField: async () => {
      await onSignUpForm("name_field");
      return fieldValue(["Name"]);
    },
    emailField: async () => {
      await onSignUpForm("email_field");
      return fieldValue(["Email Address"]);
    },
    // A vendor's form carries no job title; on it this reads as nothing.
    jobTitleField: async () => {
      await onSignUpForm("job_title_field");
      const box = seen(page.getByRole("textbox", { name: "Job Title", exact: false }));
      return (await box.count()) ? (await box.first().inputValue()).trim() : "";
    },
    // Whoever has already agreed is offered no agreement box and sent on (signed out to
    // /sign-in, everyone else to /dashboard): that reads as nothing. On the form, the box is
    // read as ticked or not.
    termsCheckbox: async () => {
      if (await signUpCompleteLeft()) return "";
      const box = seen(page.getByRole("checkbox", { name: SIGN_UP_TERMS }));
      await box.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      if (!(await box.count())) return "";
      return (await box.first().isChecked()) ? "checked" : "unchecked";
    },
    // Sent on elsewhere, there is no box and no Complete control to hold back: nothing. On the
    // form, "disabled" while its terms box is unticked and its completing control disabled.
    completeDisabledUntilTermsAccepted: async () => {
      if (await signUpCompleteLeft()) return "";
      const box = seen(page.getByRole("checkbox", { name: SIGN_UP_TERMS }));
      await box.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      if (!(await box.count()) || (await box.first().isChecked())) return "";
      const control = await findControl(page, "Complete Profile");
      return control && (await isDisabled(control)) ? "disabled" : "";
    },
    // The messages drawn under the fields ("Name must be between 1 and 100 characters
    // long.", "Please enter a valid email."); none drawn reads as nothing.
    fieldError: async () => {
      await onSignUpForm("field_error");
      return (await fieldErrors()).join("\n");
    },
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
    // "Export Contact List" opens a dialog whose user types are "Government Users" and "Vendor
    // Users", both ticked to start with. A type named the way the criteria name accounts
    // ("public sector employee", "GOV", "vendor") is that box. A state given ({ checked })
    // is set; otherwise the box is toggled.
    toggleExportUserType: async (input) => {
      const where = "user-list.toggle_export_user_type";
      await ready();
      if (!(await dialog().count())) await press(where, ["Export Contact List"]);
      const said = (field(input, "userType", "user_type", "type", "kind", "name", "label") || asText(input)).trim();
      const label = /vendor/i.test(said)
        ? "Vendor Users"
        : /gov|public sector|staff|admin/i.test(said) || !said
          ? "Government Users"
          : said;
      const box = seen(dialog().first().getByRole("checkbox", { name: label, exact: false }));
      if (!(await box.count())) {
        throw new Error(`unbound: ${where} — the export dialog has no box labelled "${label}" (asked for "${said}") on ${page.url()}`);
      }
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const wanted = record.checked ?? record.selected ?? record.on ?? record.include;
      if (wanted === undefined || (await box.first().isChecked()) !== saysYes(wanted)) await box.first().click();
      await settle();
    },
    // The same dialog's "Select Fields to Export" boxes are "First Name", "Last Name", "Email"
    // and "Organization Name", all ticked to start with. A field named the way the criteria
    // name it ("email address", "organization", "firstName") is the box it stands for. A
    // state given ({ checked }) is set; otherwise the box is toggled.
    toggleExportField: async (input) => {
      const where = "user-list.toggle_export_field";
      await ready();
      if (!(await dialog().count())) await press(where, ["Export Contact List"]);
      const said = (field(input, "field", "fieldName", "name", "label", "column") || asText(input)).trim();
      const words = squash(said);
      const label = !said || /email/.test(words)
        ? "Email"
        : /first/.test(words)
          ? "First Name"
          : /last|surname|family/.test(words)
            ? "Last Name"
            : /org|company/.test(words)
              ? "Organization Name"
              : said;
      const box = seen(dialog().first().getByRole("checkbox", { name: label, exact: true }));
      if (!(await box.count())) {
        throw new Error(`unbound: ${where} — the export dialog has no box labelled "${label}" (asked for "${said}") on ${page.url()}`);
      }
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const wanted = record.checked ?? record.selected ?? record.on ?? record.include;
      if (wanted === undefined || (await box.first().isChecked()) !== saysYes(wanted)) await box.first().click();
      await settle();
    },
    exportContactList: () => inDialog("user-list.export_contact_list", ["Export"]),
    cancelExport: () => inDialog("user-list.cancel_export", ["Cancel"]),
    openUserProfile: (input) => openNamed("user-list.open_user_profile", input),
    userRow: () => everyUserRow(),
    statusBadge: () => userColumn(0),
    accountType: () => userColumn(1),
    adminCheck: () => adminTicks(),
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

  // The user list draws only the rows in view — about twenty of the 143 seeded accounts — and
  // draws the rest as its body is scrolled, with no pager. So the body — the one part of the
  // table that scrolls — is stepped from top to bottom most of a screen at a time inside the
  // page itself, gathering the rows drawn after each step; one whole read takes well under a
  // second, so a test polling the list gets an answer on every call. Every row begins with its status badge ("Active" or "Inactive"); the row is the block
  // around that badge holding the four columns "Status | Account Type | Name | Admin?". The
  // Admin? cell holds an unlabelled icon with no text: a square tick for an administrator, a
  // narrower cross for everybody else, read as "Yes" and "No". Every reader of the list reads
  // its column from these same rows.
  async function userTableRows(): Promise<string[][]> {
    await ready();
    const table = seen(page.getByRole("table")).first();
    if (!(await table.count())) return [];
    await table.getByText(/^(Active|Inactive)$/i).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    // One pass in the page: put the body back at the top (an earlier read leaves it at the
    // bottom), then step it down, letting the list draw after each step, until it can go no
    // further. Rows are kept in the order they are first seen, each once.
    return table
      .evaluate(async (node) => {
        const drawn = (): Promise<void> =>
          new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 0))));
        const rows: string[][] = [];
        const keys = new Set<string>();
        const gather = (): void => {
          const rowsSeen = new Set<Element>();
          const walk = (each: Element): void => {
            const own = (each.textContent ?? "").trim();
            if (!each.children.length && /^(active|inactive)$/i.test(own)) {
              let row: Element | null = each.parentElement;
              while (row && row !== node && row.children.length < 4) row = row.parentElement;
              if (row && row !== node && !rowsSeen.has(row)) {
                rowsSeen.add(row);
                const cells = Array.from(row.children);
                const text = cells.map((cell) => ((cell as HTMLElement).innerText ?? "").trim());
                const last = cells[cells.length - 1];
                const icon = last ? last.getElementsByTagName("svg")[0] ?? null : null;
                const box = icon?.getAttribute("viewBox")?.trim().split(/\s+/).map(Number) ?? [];
                // A tick is drawn square; the cross beside the others is drawn narrower than tall.
                const mark = icon
                  ? box.length === 4 && box[2] > 0 && box[2] === box[3]
                    ? "Yes"
                    : "No"
                  : text[text.length - 1] ?? "";
                const read = [...text.slice(0, 3), mark];
                const key = read.join(" | ");
                if (!keys.has(key)) {
                  keys.add(key);
                  rows.push(read);
                }
              }
              return;
            }
            for (const child of Array.from(each.children)) walk(child);
          };
          walk(node);
        };
        const body =
          [node, ...Array.from(node.querySelectorAll("*"))].find(
            (each) => each.scrollHeight > each.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(each).overflowY),
          ) ?? null;
        window.scrollTo(0, 0);
        if (!body) {
          gather();
          return rows;
        }
        body.scrollTop = 0;
        await drawn();
        gather();
        const step = Math.max(Math.floor(body.clientHeight * 0.8), 40);
        const started = Date.now();
        for (let turn = 0; turn < 1000 && Date.now() - started < 3500; turn++) {
          if (body.scrollTop + body.clientHeight >= body.scrollHeight - 1) break;
          const before = body.scrollTop;
          body.scrollTop = before + step;
          await drawn();
          gather();
          if (body.scrollTop <= before) break;
        }
        await drawn();
        gather();
        return rows;
      })
      .catch(() => [] as string[][]);
  }

  // Each row as "Status | Account Type | Name", one per line.
  async function everyUserRow(): Promise<string> {
    return (await userTableRows()).map((cells) => cells.slice(0, 3).filter(Boolean).join(" | ")).join("\n");
  }

  // One column of those same rows, one line per row.
  async function userColumn(column: number): Promise<string> {
    return (await userTableRows()).map((cells) => cells[column] ?? "").join("\n");
  }

  // The Admin? column, each row's mark beside the name it belongs to: "Robin Placeholder: Yes".
  async function adminTicks(): Promise<string> {
    return (await userTableRows()).map((cells) => `${cells[2]}: ${cells[3]}`).join("\n");
  }


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
        // A name cleared or over the length limit leaves "Save Changes" disabled: that is the
        // refusal, read next from fieldError() and the reopened fields.
        const save = await findControl(navBar(), "Save Changes");
        if (save && (await isDisabled(save))) return;
        await press(`${where}.save_changes`, ["Save Changes"], navBar());
        await confirmIfAsked(`${where}.save_changes`, ["Save Changes"]);
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
    // A vendor's profile carries no Permission(s) box at all, and that absence is the
    // refusal. A tick is stored at once ("Admin Permissions Updated"); the action waits for
    // that save so a reopened profile shows it.
    toggleAdminPermission: async () => {
      await ready();
      const box = seen(page.getByRole("checkbox", { name: "Admin", exact: true }));
      if (!(await box.count()) || (await box.first().isDisabled())) return;
      const stored = page
        .waitForResponse(
          (response) => response.request().method() === "PUT" && response.url().includes("/api/users/"),
          { timeout: 15000 },
        )
        .catch(() => null);
      await box.first().click();
      await stored;
      await seen(page.getByText("Admin Permissions Updated"))
        .first()
        .waitFor({ state: "visible", timeout: 5000 })
        .catch(() => undefined);
      await settle();
    },
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
      // Each capability is its name with an unlabelled mark before it, and nothing else says
      // whether it is held: a held one's mark is drawn success-coloured (a filled tick), one
      // not held in the same ink as its name (an empty circle) — seen as the organization
      // member on their own Capabilities tab, where their three seeded capabilities are
      // marked and the other six are not. The held ones are read from that mark, one per line.
      capabilityChecked: async (): Promise<string> => {
        await ready();
        const held: string[] = [];
        for (const name of CAPABILITIES) {
          const words = seen(page.getByRole("main").getByText(name, { exact: true }));
          const count = await words.count();
          if (!count) continue;
          const marked = await words
            .nth(count - 1)
            .evaluate((element) => {
              const ink = getComputedStyle(element).color;
              let node: Element | null = element;
              for (let level = 0; level < 3 && node; level++) {
                for (const child of Array.from(node.children)) {
                  if (child instanceof SVGElement) return getComputedStyle(child).color !== ink;
                }
                node = node.parentElement;
              }
              return false;
            })
            .catch(() => false);
          if (marked) held.push(name);
        }
        return held.join("\n");
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
  // Resolves true once the panel is open to change, and false when the page shows it locked.
  async function editingPanel(where: string): Promise<boolean> {
    await ready();
    if (await seen(page.getByRole("combobox", { name: "Panel Member", exact: false })).count()) return true;
    // On the creation wizard the panel is a step of its own.
    if (await goToStep("Evaluation Panel")) {
      if (await panelSlots().count()) return true;
    }
    // "Edit" is drawn in the top bar once the opportunity has loaded, a moment after the tab.
    await seen(navBar().getByText("Edit", { exact: true }))
      .first()
      .waitFor({ state: "visible", timeout: LATE_CONTROL_MS })
      .catch(() => undefined);
    const edit = await findControl(navBar(), "Edit");
    if (!edit) {
      const bar = (await navBar().innerText().catch(() => "")).replace(/\s*\n\s*/g, " | ");
      // The panel shown with its evaluators and no "Edit" is the panel locked: seen as the
      // administrator on the seeded opportunities at consensus, where the tab lists both
      // evaluators and the chair and the top bar carries nothing, while the same tab of the
      // seeded closed opportunity still at individual evaluation offers "Edit". That is a
      // refusal the page gives, left in place for panel_locked_after_consensus to report:
      // nothing is changed and nothing is thrown.
      if ((await panelMembers()).some((member) => member.name)) {
        panelLeftLocked = true;
        return false;
      }
      nothing(`${where} — the evaluation panel tab shows no evaluators and its top bar offers no "Edit" on ${page.url()} (the top bar shows: ${bar})`);
    }
    await edit.click();
    await settle();
    panelLeftLocked = false;
    // Editing may reopen the opportunity's wizard, where the panel is its own step.
    await goToStep("Evaluation Panel");
    return true;
  }

  // Set when a change to the panel found it locked, so the save that follows changes nothing.
  let panelLeftLocked = false;

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
    const name = personKey(input);
    if (name) {
      const members = await panelMembers();
      const at = members.findIndex((member) => member.name.toLowerCase().includes(name.toLowerCase()));
      if (at < 0 || at >= count) nothing(`${where} — no evaluator matching "${name}" on ${page.url()}`);
      return boxes.nth(at);
    }
    return boxes.nth(Math.min(indexOf(input), count - 1));
  }

  // Below the evaluators the panel has a "Panel Chair" section with its own "Chair*" chooser,
  // offering every public sector person, evaluator or not (seen as an administrator on the
  // seeded closed Sprint With Us opportunity, after "Edit"). Who chairs is chosen there.
  function chairChooser(): Locator {
    return seen(page.getByRole("combobox", { name: labelled("Chair") }));
  }

  async function makeChair(where: string, input: unknown, byChooser = false): Promise<void> {
    if (!(await editingPanel(where))) return;
    // A panel composed with nobody in the chair.
    if (namesNoChair(input)) {
      await clearChair(where);
      return;
    }
    const key = personKey(input);
    if (byChooser && key && (await chairChooser().count())) {
      await pickPanelMember(where, chairChooser().first(), key);
      return;
    }
    const box = await chairBox(where, input);
    if (!(await box.isChecked())) await box.click();
    await settle();
  }

  // What the panel says back about one kind of fault: a field error beside a slot or the
  // Chair chooser ("Please select a panel chair."), or an alert, wherever it is drawn. Saving a
  // panel with the same person twice is refused (seen as an administrator on the seeded closed
  // Sprint With Us opportunity) with only "Unable to Publish Changes ... Please fix the errors in
  // the form and try again." after the footer, naming no reason. That general refusal names no
  // rule, so it is never read as this fault's message: only an alert or field error whose own
  // words name the fault is returned, and a page naming none reads as nothing.
  async function panelRefusal(about: RegExp): Promise<string> {
    await settle();
    await seen(page.getByRole("alert").filter({ hasText: /unable to|please fix/i }))
      .first()
      .waitFor({ state: "visible", timeout: 3000 })
      .catch(() => undefined);
    const alerts = await everyAlert();
    const named = [...alerts.filter((words) => matches(about, words)), ...(await fieldErrors(about))];
    return [...new Set(named)].join("\n");
  }

  function evaluationPanel(where: string, route: string) {
    return {
      ...at(route),
      // "Edit" in the top bar turns the read-only tab into the panel's form, with a
      // "Panel Member*" chooser per evaluator, "Add an evaluator" and the "Chair*" chooser
      // (seen as the administrator on the seeded closed Sprint With Us opportunity). A panel
      // shown locked offers no "Edit"; that is left for panel_locked_after_consensus to report.
      startEditing: async () => {
        await editingPanel(`${where}.start_editing`);
      },
      addPanelMember: (input: unknown) => addPanelMember(`${where}.add_panel_member`, input),
      removePanelMember: (input: unknown) => removePanelMember(`${where}.remove_panel_member`, input),
      choosePanelChair: (input: unknown) => makeChair(`${where}.choose_panel_chair`, input, true),
      markMemberAsChair: (input: unknown) => makeChair(`${where}.mark_member_as_chair`, input),
      // A panel the change before found locked is left as the page shows it: there is nothing
      // to save, and the lock is panel_locked_after_consensus's to report.
      saveEvaluationPanel: async () => {
        await ready();
        if (
          panelLeftLocked &&
          !(await findControl(navBar(), "Save Changes")) &&
          !(await findControl(navBar(), "Save"))
        ) {
          return;
        }
        await press(`${where}.save_evaluation_panel`, ["Save Changes", "Save"], navBar());
      },
      panelMemberRow: async () =>
        (await panelMembers())
          .map((member) => `${member.name}${member.chair ? " (Panel Chair)" : ""}`)
          .join("\n"),
      // Who chairs, as the "Chair" field under "Panel Chair" names them, else by the ticked
      // "Panel Chair" boxes; nobody named reads as nobody.
      chairField: async () => {
        const named = await findAfter(["Chair", "Chair*"]);
        if (named && !matches(/^(Panel Chair|Chair\*?|Select\b.*)$/i, named) && !/^Home\|?$/.test(named)) return named;
        return (await panelMembers())
          .filter((member) => member.chair)
          .map((member) => member.name)
          .join("\n");
      },
      minimumMembersError: () => panelRefusal(/two|minimum|at least/i),
      duplicateMemberError: () => panelRefusal(/duplicate|already|more than once|same (person|member)/i),
      nonPublicSectorMemberError: () => messages(/public sector|identifier/i),
      missingChairError: () => panelRefusal(/chair/i),
      // The page names no lock in words: a locked panel is the tab shown with its evaluators,
      // read-only, and no "Edit" in the top bar. That state is reported, with the status the
      // header gives, so a panel that can still be edited reads as nothing.
      panelLockedAfterConsensus: async () => {
        await ready();
        const said = await messages(/consensus|locked|cannot/i);
        if (said) return said;
        if (await seen(page.getByRole("combobox", { name: "Panel Member", exact: false })).count()) return "";
        if (!(await panelMembers()).some((member) => member.name)) return "";
        await seen(navBar().getByText("Edit", { exact: true }))
          .first()
          .waitFor({ state: "visible", timeout: LATE_CONTROL_MS })
          .catch(() => undefined);
        if (await findControl(navBar(), "Edit")) return "";
        const status = await valueAfter(["Status"]);
        return `Evaluation panel locked: shown read-only with no "Edit" (Status: ${status || "not shown"})`;
      },
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

  // Whether the screen up is the opportunity's editing screen on its Instructions tab, as the
  // tab's address and the page title ("Instructions — <opportunity> — …") both say.
  async function onInstructionsTab(): Promise<boolean> {
    if (!/[?&]tab=instructions\b/.test(page.url())) return false;
    return /^Instructions\b/.test(await page.title());
  }

  // The instructions tab, seen as the opportunity's owner and panel member on the seeded
  // closed opportunities: the left menu, then a column holding the header (the "Sprint With
  // Us: <title>" heading, published/updated dates, "Status" and "Created By"), then the
  // embedded instructions page rendered ("Initial version", the body the service's page at
  // "<program>-evaluation-instructions" holds), then a "Begin Evaluation" link to the
  // Evaluation tab. The body is what that column holds after the header, less any block that
  // is only a link to another tab of the same screen; a page that could not be read leaves
  // nothing there, and that nothing is the answer. A screen this reader is refused — "Not
  // Found", or sent elsewhere — shows no instructions at all.
  async function instructionsBody(where: string): Promise<string> {
    await ready();
    if (await notFoundShown()) return "";
    if (!(await onInstructionsTab())) return "";
    const heading = seen(page.getByRole("heading", { name: /^(Sprint|Team) With Us:/ }));
    if (!(await heading.count())) {
      nothing(`${where} — the Instructions tab on ${page.url()} shows no "… With Us: <title>" heading to find its body under`);
    }
    const body = await heading.first().evaluate((title: Element): string | null => {
      const text = (element: Element): string => ((element as HTMLElement).innerText ?? "").trim();
      const isStatusLabel = (element: Element): boolean => text(element) === "Status";
      const holdsBeginLink = (element: Element): boolean =>
        Array.from(element.querySelectorAll("a")).some((link) => text(link) === "Begin Evaluation");
      let header: Element | null = null;
      for (let at: Element | null = title.parentElement; at && at !== document.body; at = at.parentElement) {
        if (Array.from(at.querySelectorAll("*")).some(isStatusLabel)) {
          header = at;
          break;
        }
      }
      if (!header) {
        let at: Element = title;
        let up: Element | null = title.parentElement;
        while (up && up !== document.body) {
          if (holdsBeginLink(up)) {
            header = at;
            break;
          }
          at = up;
          up = up.parentElement;
        }
      }
      if (!header || !header.parentElement) return null;
      const onlyATabLink = (element: Element): boolean => {
        const links = Array.from(element.querySelectorAll("a"));
        return (
          links.length === 1 &&
          /\/edit\?tab=/.test(links[0].getAttribute("href") ?? "") &&
          text(links[0]) === text(element)
        );
      };
      const after: string[] = [];
      let seenHeader = false;
      for (const child of Array.from(header.parentElement.children)) {
        if (child === header) {
          seenHeader = true;
          continue;
        }
        if (!seenHeader || onlyATabLink(child)) continue;
        const said = text(child);
        if (said) after.push(said);
      }
      return after.join("\n");
    });
    if (body === null) {
      nothing(`${where} — the Instructions tab on ${page.url()} has no opportunity header ("Status") to find its body under`);
    }
    return body;
  }

  // The "Instructions" tab in the editing screen's left menu (under "Opportunity
  // Evaluation"), read as its name when this reader is shown it and as nothing when not:
  // a vendor opening the same address is answered "Not Found" and shown no menu at all.
  async function instructionsTab(): Promise<string> {
    await ready();
    if (await notFoundShown()) return "";
    const links = seen(page.getByRole("link", { name: "Instructions", exact: true }));
    for (let i = 0; i < (await links.count()); i++) {
      const link = links.nth(i);
      if (/[?&]tab=instructions\b/.test((await link.getAttribute("href")) ?? "")) return (await link.innerText()).trim();
    }
    return "";
  }

  function evaluationInstructions(where: string, route: string) {
    return {
      ...at(route),
      instructionsBody: () => instructionsBody(`${where}.instructions_body`),
      visibleToEvaluatorsOnly: () => instructionsTab(),
    };
  }

  const evaluationInstructionsSwu: S.EvaluationInstructionsSwuPage = evaluationInstructions(
    "evaluation-instructions-swu",
    "/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions",
  );
  const evaluationInstructionsTwu: S.EvaluationInstructionsTwuPage = evaluationInstructions(
    "evaluation-instructions-twu",
    "/opportunities/team-with-us/:opportunityId/edit?tab=instructions",
  );

  // Why the last "Submit Scores for Consensus" was refused, for incomplete_evaluation_error.
  let submitRefusal = "";

  function evaluationIndividualList(where: string, route: string) {
    return {
      ...at(route),
      openProponentEvaluation: (input: unknown) =>
        openRow(`${where}.open_proponent_evaluation`, input),
      // "Submit Scores for Consensus" sits in the top bar and is disabled, with no message
      // beside it, while any of this evaluator's proponents is unevaluated (seen as the panel's
      // evaluator on the seeded closed Sprint With Us opportunity, every row "Start
      // Evaluation"). That disabled control is the refusal: it is reported at once, and kept
      // for incomplete_evaluation_error, rather than passed over as though it had been pressed.
      submitScoresForConsensus: async () => {
        submitRefusal = "";
        await ready();
        const names = ["Submit Scores for Consensus", "Submit for Consensus", "Submit Scores"];
        const deadline = Date.now() + LATE_CONTROL_MS;
        let control: Locator | null = null;
        let shownAs = "";
        while (!control) {
          for (const name of names) {
            control = await findControl(navBar(), name);
            if (control) {
              shownAs = name;
              break;
            }
          }
          if (control || Date.now() >= deadline) break;
          await page.waitForTimeout(250);
        }
        if (!control) {
          const bar = (await navBar().innerText().catch(() => "")).replace(/\s*\n\s*/g, " | ");
          submitRefusal = `"Submit Scores for Consensus" is not offered (the top bar shows: ${bar})`;
          throw new Error(`${where}.submit_scores_for_consensus — refused: ${submitRefusal} on ${page.url()}`);
        }
        if (await isDisabled(control)) {
          const rows = (await tableRows(false)).replace(/\n/g, " ; ");
          submitRefusal = `"${shownAs}" is disabled: evaluations are incomplete${rows ? ` (${rows})` : ""}`;
          throw new Error(`${where}.submit_scores_for_consensus — refused: ${submitRefusal} on ${page.url()}`);
        }
        await press(`${where}.submit_scores_for_consensus`, [shownAs], navBar());
        await confirmIfAsked(`${where}.submit_scores_for_consensus`, [
          "Submit Scores for Consensus",
          "Submit for Consensus",
          "Submit",
        ]);
      },
      proponentRow: () => tableText(),
      anonymousProponentName: () => anonymousProponents(),
      evaluationStatus: () => tableText(),
      // Empty when "Submit Scores for Consensus" is offered and may be pressed; otherwise why
      // it is withheld.
      submitDisabledUntilComplete: async () => {
        await ready();
        const state = await controlState(["Submit Scores for Consensus", "Submit for Consensus", "Submit Scores"]);
        if (state === "enabled") return "";
        return state === "disabled"
          ? `"Submit Scores for Consensus" is disabled`
          : `"Submit Scores for Consensus" is not offered`;
      },
      incompleteEvaluationError: async () =>
        [...(await everyAlert(/complete|incomplete/i)), await messages(/complete|incomplete/i), submitRefusal]
          .filter(Boolean)
          .join("\n"),
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

  // The consensus tab's controls sit in the top bar and appear only once the evaluation has
  // reached consensus: "Finalize Consensus Scores" there (seen as the chair on the seeded Sprint
  // With Us opportunities at consensus). Before that the tab says "Evaluators have not
  // completed their evaluations yet." and the bar carries nothing, which is named when a control
  // is missing so an earlier step that never landed is not mistaken for a missing control.
  async function consensusControl(where: string, names: string[]): Promise<void> {
    await ready();
    const deadline = Date.now() + LATE_CONTROL_MS;
    for (;;) {
      for (const name of names) {
        if (await findControl(navBar(), name)) {
          await press(where, [name], navBar());
          return;
        }
      }
      if (Date.now() >= deadline) break;
      await page.waitForTimeout(250);
    }
    const bar = (await navBar().innerText().catch(() => "")).replace(/\s*\n\s*/g, " | ");
    const said = await linesMatching(/not completed|not yet|no proponents|consensus/i);
    // The opportunity is at consensus (its header's Status says so) and this reader is not
    // offered the control: seen signed in as the panel's evaluator who is not its chair, on
    // the seeded opportunities at consensus, where the chair's top bar carries "Finalize
    // Consensus Scores" and theirs carries nothing. That is the page refusing this reader.
    const status = await valueAfter(["Status"]);
    if (/consensus/i.test(status)) {
      throw new Error(
        `${where} — refused: the opportunity is at "${status}" but the top bar of ${page.url()} offers this reader no ${quoted(names)} (it shows: ${bar})`,
      );
    }
    throw new Error(
      `unbound: ${where} — no control labelled ${quoted(names)} in the top bar of ${page.url()} (it shows: ${bar})${
        said ? `; the tab says: ${said.replace(/\n/g, " | ")}` : ""
      }`,
    );
  }

  // "Finalize Consensus Scores" in the "Please Confirm" dialog closes the dialog first and
  // sends its request after, so neither the dialog closing nor an idle network says it is
  // done. What does: a notice drawn after the footer, or the control leaving the top bar as the
  // opportunity moves on. A refusal is its own notice ("Unable to Finalize Consensuses — Your
  // consensuses for this Sprint With Us opportunity could not be finalized.", seen as the
  // chair on the seeded opportunity at consensus with nobody screenable), and is reported.
  const FINALIZE_WAIT_MS = 30000;

  async function confirmFinalize(where: string, names: string[], only?: RegExp): Promise<void> {
    await dialog().first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) {
      throw new Error(`unbound: ${where} — no confirmation dialog is open on ${page.url()}`);
    }
    // Where the dialog must be one confirmation and not the other, one whose own button is
    // not the expected one is left alone and named.
    if (only && !(await isConfirmation(only))) {
      const shown = (await dialogText()).replace(/\s*\n\s*/g, " | ");
      throw new Error(`${where} — the open dialog is not the one it confirms (it shows: ${shown}) on ${page.url()}`);
    }
    const before = new Set(await everyAlert());
    consensusRefusal = "";
    await press(where, names, dialog().first());
    const deadline = Date.now() + FINALIZE_WAIT_MS;
    for (;;) {
      const fresh = (await everyAlert()).filter((words) => !before.has(words));
      const failed = fresh.find((words) => /unable|could not|error|failed/i.test(words));
      if (failed) {
        consensusRefusal = failed;
        throw new Error(`${where} — refused: the page shows "${failed.replace(/\s*\n\s*/g, " — ")}" on ${page.url()}`);
      }
      if (fresh.length) break;
      if (!(await dialog().count())) {
        let stillOffered = false;
        for (const name of names) if (await findControl(navBar(), name)) stillOffered = true;
        if (!stillOffered) break;
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `${where} — pressed ${quoted(names)} and within ${FINALIZE_WAIT_MS / 1000}s the page showed no notice and still offers it in the top bar of ${page.url()}`,
        );
      }
      await page.waitForTimeout(250);
    }
    await settle();
  }

  // The refusal notice the last finalize drew, kept for the error readers: it is drawn after
  // the footer, where the screen's own messages are not read.
  let consensusRefusal = "";

  async function consensusError(pattern: RegExp): Promise<string> {
    const found = [
      ...(await everyAlert(pattern)),
      ...(consensusRefusal && matches(pattern, consensusRefusal) ? [consensusRefusal] : []),
      ...(await messages(pattern)).split("\n"),
    ].filter(Boolean);
    return [...new Set(found)].join("\n");
  }

  const SUBMIT_CONSENSUS = "Submit Final Consensus Scores";
  const FINALIZE_CONSENSUS = "Finalize Consensus Scores";

  // Whether the open dialog is the confirmation whose own button is this one: the submit and
  // finalize confirmations are both titled "Please Confirm" and differ only in their button.
  async function isConfirmation(button: RegExp): Promise<boolean> {
    if (!(await dialog().count())) return false;
    const box = dialog().first();
    if (await seen(box.getByRole("button", { name: button })).count()) return true;
    if (await seen(box.getByRole("link", { name: button })).count()) return true;
    return (await seen(box.getByText(button)).count()) > 0;
  }

  async function submitConsensus(where: string): Promise<void> {
    await ready();
    const deadline = Date.now() + LATE_CONTROL_MS;
    let submit: Locator | null = null;
    let finalize: Locator | null = null;
    for (;;) {
      submit = await findControl(navBar(), SUBMIT_CONSENSUS);
      finalize = submit ? null : await findControl(navBar(), FINALIZE_CONSENSUS);
      if (submit || finalize || Date.now() >= deadline) break;
      await page.waitForTimeout(250);
    }
    const bar = (await navBar().innerText().catch(() => "")).replace(/\s*\n\s*/g, " | ");
    if (submit) {
      if (await isDisabled(submit)) {
        consensusRefusal = `"${SUBMIT_CONSENSUS}" is disabled`;
        throw new Error(`${where} — refused: "${SUBMIT_CONSENSUS}" is disabled in the top bar of ${page.url()}`);
      }
      await submit.click();
      await settle();
      return;
    }
    if (finalize) {
      // Every consensus that exists is already submitted and the reader is an administrator:
      // there is nothing left to submit, and the page offers finalising instead.
      consensusRefusal = `"${SUBMIT_CONSENSUS}" is not offered: the top bar offers "${FINALIZE_CONSENSUS}" instead`;
      throw new Error(
        `${where} — refused: the top bar of ${page.url()} offers "${FINALIZE_CONSENSUS}" instead of "${SUBMIT_CONSENSUS}" (no consensus left in draft; it shows: ${bar})`,
      );
    }
    // Neither: the same reading consensusControl gives of a bar with nothing for this reader.
    await consensusControl(where, [SUBMIT_CONSENSUS]);
  }

  function evaluationConsensusList(where: string, route: string) {
    return {
      ...at(route),
      openProponentConsensus: (input: unknown) =>
        openRow(`${where}.open_proponent_consensus`, input),
      // The top bar carries one of two controls for the chair at consensus: "Submit Final
      // Consensus Scores" while any consensus is still a draft (or the chair is not an
      // administrator), and "Finalize Consensus Scores" once every consensus that exists is
      // submitted and the chair is an administrator. Only the first is this action's; the
      // second, or nothing, is the page's answer and is reported, never pressed.
      submitFinalConsensusScores: () => submitConsensus(`${where}.submit_final_consensus_scores`),
      // "Submit Final Consensus Scores" opens "Please Confirm" ("By submitting this consensus,
      // you, as the chair, ..."), whose own "Submit Final Consensus Scores" sends it; the
      // outcome is its notice, "Consensuses Submitted" or "Unable to Submit Consensuses".
      confirmSubmitConsensus: () =>
        confirmFinalize(
          `${where}.confirm_submit_consensus`,
          [SUBMIT_CONSENSUS],
          new RegExp(`^${SUBMIT_CONSENSUS}$`),
        ),
      finalizeConsensusScores: () =>
        consensusControl(`${where}.finalize_consensus_scores`, [
          "Finalize Consensus Scores",
          "Finalize Scores",
          "Finalize",
        ]),
      confirmFinalizeConsensus: () =>
        confirmFinalize(`${where}.confirm_finalize_consensus`, [
          "Finalize Consensus Scores",
          "Finalize",
        ]),
      cancelModal: () => inDialog(`${where}.cancel_modal`, ["Cancel"]),
      proponentRow: () => tableText(),
      consensusStatus: () => tableText(),
      // Only the submit confirmation: the finalize one, or any other dialog, reads as nothing.
      submitConfirmationModal: async () =>
        (await isConfirmation(new RegExp(`^${SUBMIT_CONSENSUS}$`))) ? dialogText() : "",
      finalizeConfirmationModal: () => dialogText(),
      notAllConsensusesSubmittedError: () => consensusError(/consensus|all/i),
      noScreenableProponentError: () => consensusError(/screen|proponent/i),
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
      // Questions are kept in an "order" counted from 0, the order the sheet shows them in;
      // a "question" number counts from 1.
      const ordered = Number.parseInt(field(input, "order", "index", "position", "row"), 10);
      const numbered = Number.parseInt(field(input, "question", "questionNumber"), 10);
      const which =
        Number.isFinite(ordered) && ordered >= 0
          ? ordered
          : Number.isFinite(numbered) && numbered > 0
            ? numbered - 1
            : 0;
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

  // A sheet's first "Save Draft" moves it to its own address (".../evaluations/<member>/edit"),
  // where it is shown read-only under "Edit" until opened again, and saved with "Save Changes"
  // (seen as the panel's evaluator on the seeded closed Sprint With Us opportunity). Saving the
  // draft again is whichever of those the sheet is showing.
  async function saveSheetDraft(where: string): Promise<void> {
    await ready();
    const deadline = Date.now() + LATE_CONTROL_MS;
    for (;;) {
      for (const name of ["Save Draft", "Save Changes"]) {
        if (await findControl(navBar(), name)) {
          await press(where, [name], navBar());
          await confirmIfAsked(where, [name, "Save"]);
          return;
        }
      }
      const edit = await findControl(navBar(), "Edit");
      if (edit && !(await isDisabled(edit))) {
        await edit.click();
        await settle();
        await press(where, ["Save Changes"], navBar());
        await confirmIfAsked(where, ["Save Changes", "Save"]);
        return;
      }
      if (Date.now() >= deadline) break;
      await page.waitForTimeout(250);
    }
    const bar = (await navBar().innerText().catch(() => "")).replace(/\s*\n\s*/g, " | ");
    throw new Error(
      `unbound: ${where} — the score sheet's top bar offers neither "Save Draft", "Save Changes" nor "Edit" on ${page.url()} (it shows: ${bar})`,
    );
  }

  const evaluationIndividualCreateSwu: Open<S.EvaluationIndividualCreateSwuPage> = {
    ...scoreSheet(
      "evaluation-individual-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create",
    ),
    saveDraft: () => saveSheetDraft("evaluation-individual-create-swu.save_draft"),
    saveAndGoToPreviousProponent: () =>
      press("evaluation-individual-create-swu.save_and_go_to_previous_proponent", [
        "Save & Go to Previous Proponent",
        "Save and Go to Previous Proponent",
        "Previous Proponent",
      ]),
    anonymousProponentName: () => anonymousProponent(),
    questionResponse: () => contentText(),
    duplicateEvaluationError: () => messages(/already|duplicate/i),
    refusedWhenNotPermitted: () => refusedScreen(),
  };

  const evaluationIndividualEditSwu: Open<S.EvaluationIndividualEditSwuPage> = {
    ...scoreSheet(
      "evaluation-individual-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit",
    ),
    saveChanges: () =>
      press("evaluation-individual-edit-swu.save_changes", ["Save Changes", "Save"], navBar()),
    evaluationStatus: () => valueAfter(["Status", "Evaluation Status"]),
    readOnlyAfterSubmitted: () => readOnlyAfterSubmitted("evaluation-individual-edit-swu.read_only_after_submitted"),
    refusedWhenNotPermitted: () => refusedScreen(),
  };

  // An evaluation screen this reader may not use answers with the site's "Not Found"
  // screen: signed in as the one public sector account the session routes reach, on the
  // seeded Sprint With Us opportunity whose panel is somebody else, both the evaluation
  // and the create screen show "Not Found — The page you are looking for doesn't exist."
  // A screen that opened on the score sheet refused nothing and reads as nothing.
  async function refusedScreen(): Promise<string> {
    await ready();
    if (await notFoundShown()) return linesMatching(/^Not Found$|doesn't exist|permission/i);
    return linesMatching(/do not have permission|not permitted|not authori[sz]ed/i);
  }

  // Whether the consensus sheet is withheld from this reader. The sheet offered — its score
  // fields or its "Save Draft" — reads as nothing, whatever else the proposal page says; the
  // "Not Found" screen, or a notice that only the chair may record consensus, is the refusal.
  async function chairOnlyRefusal(): Promise<string> {
    await ready();
    if (await notFoundShown()) return (await linesMatching(/^Not Found$|doesn't exist/i)) || "Not Found";
    const offered =
      (await seen(page.getByRole("spinbutton")).count()) > 0 ||
      (await findControl(navBar(), "Save Draft")) !== null ||
      (await seen(page.getByText("Consensus Score", { exact: true })).count()) > 0;
    if (offered) return "";
    return linesMatching(/only the (panel )?chair|chair only|must be the (panel )?chair|not the (panel )?chair/i);
  }

  // A sheet still open to change offers "Edit" or an enabled "Save Changes" in the top bar
  // and reads as nothing; one offering neither is read-only.
  async function readOnlyAfterSubmitted(where: string): Promise<string> {
    await ready();
    if (await notFoundShown()) nothing(`${where} — the evaluation answers "Not Found" on ${page.url()}`);
    if (await findControl(navBar(), "Edit")) return "";
    const save = await findControl(navBar(), "Save Changes");
    if (save && !(await isDisabled(save))) return "";
    return "read-only";
  }

  const evaluationConsensusCreateSwu: S.EvaluationConsensusCreateSwuPage = {
    ...scoreSheet(
      "evaluation-consensus-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create",
    ),
    saveDraft: () => saveSheetDraft("evaluation-consensus-create-swu.save_draft"),
    anonymousProponentName: () => anonymousProponent(),
    panelMemberScore: () => contentText(),
    panelMemberNotes: () => contentText(),
    chairOnly: () => chairOnlyRefusal(),
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

  const evaluationIndividualCreateTwu: Open<S.EvaluationIndividualCreateTwuPage> = {
    ...scoreSheet(
      "evaluation-individual-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create",
    ),
    saveDraft: () => saveSheetDraft("evaluation-individual-create-twu.save_draft"),
    saveAndGoToPreviousProponent: () =>
      press("evaluation-individual-create-twu.save_and_go_to_previous_proponent", [
        "Save & Go to Previous Proponent",
        "Save and Go to Previous Proponent",
        "Previous Proponent",
      ]),
    anonymousProponentName: () => anonymousProponent(),
    questionResponse: () => contentText(),
    duplicateEvaluationError: () => messages(/already|duplicate/i),
    refusedWhenNotPermitted: () => refusedScreen(),
  };

  const evaluationIndividualEditTwu: Open<S.EvaluationIndividualEditTwuPage> = {
    ...scoreSheet(
      "evaluation-individual-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit",
    ),
    saveChanges: () =>
      press("evaluation-individual-edit-twu.save_changes", ["Save Changes", "Save"], navBar()),
    evaluationStatus: () => valueAfter(["Status", "Evaluation Status"]),
    readOnlyAfterSubmitted: () => readOnlyAfterSubmitted("evaluation-individual-edit-twu.read_only_after_submitted"),
    refusedWhenNotPermitted: () => refusedScreen(),
  };

  const evaluationConsensusCreateTwu: S.EvaluationConsensusCreateTwuPage = {
    ...scoreSheet(
      "evaluation-consensus-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create",
    ),
    saveDraft: () => saveSheetDraft("evaluation-consensus-create-twu.save_draft"),
    anonymousProponentName: () => anonymousProponent(),
    panelMemberScore: () => contentText(),
    panelMemberNotes: () => contentText(),
    chairOnly: () => chairOnlyRefusal(),
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

  const contentList: Open<S.ContentListPage> = {
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
    // One row of the table per page, under a header row of column names. A reader shown
    // no table (the "Not Found" a non-administrator gets) is shown no pages to count.
    async pageCount() {
      await ready();
      const table = seen(page.getByRole("table"));
      if (!(await table.count())) return "";
      await seen(table.first().getByRole("cell")).first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      const rows = table.first().getByRole("row").filter({ has: page.getByRole("cell") });
      return String(await rows.count());
    },
  };

  // A reader who may not manage pages is shown "Not Found" at /content/create: there is no
  // form to type into, and that refusal is what the test reads next.
  async function contentField(where: string, labels: string[], value: string): Promise<void> {
    await ready();
    if (await notFoundShown()) return;
    await fill(where, labels, value);
  }

  const contentCreate: S.ContentCreatePage = {
    ...at("/content/create"),
    enterTitle: (input) =>
      contentField("content-create.enter_title", ["Title"], field(input, "title") || asText(input)),
    enterSlug: (input) =>
      contentField("content-create.enter_slug", ["Slug"], field(input, "slug") || asText(input)),
    enterBody: (input) =>
      contentField("content-create.enter_body", ["Body"], field(input, "body", "content") || asText(input)),
    uploadBodyImage: (input) => uploadBodyImage("content-create.upload_body_image", input),
    // "Publish" can take a moment to act on the last value typed, so a press that raises no
    // "Publish Page?" is tried again before it is reported.
    // A reader who may not manage pages is shown "Not Found" there instead of the form (seen
    // signed in as public sector staff and as a vendor): no "Publish" to press, and that
    // refusal is what the test reads next, as with the form's fields.
    publishPage: async () => {
      const where = "content-create.publish_page";
      await ready();
      if (await notFoundShown()) return;
      for (let attempt = 0; attempt < 3; attempt++) {
        await press(where, ["Publish"], navBar());
        const opened = await dialog()
          .first()
          .waitFor({ state: "visible", timeout: 5000 })
          .then(() => true)
          .catch(() => false);
        if (opened) return;
        await page.waitForTimeout(500);
      }
      throw new Error(`${where} — pressing "Publish" raised no "Publish Page?" confirmation on ${page.url()}`);
    },
    // The save is answered either by leaving for the new page or, refused, by an alert drawn
    // after the footer while the form stays put; whichever comes first ends the wait.
    confirmPublish: async () => {
      await ready();
      if (await notFoundShown()) return;
      await inDialog("content-create.confirm_publish", ["Publish Page", "Publish", "Yes"]);
      await Promise.race([
        page.waitForURL((url) => !url.pathname.endsWith("/content/create"), { timeout: 15000 }),
        seen(page.getByRole("alert")).first().waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => undefined);
      await settle();
    },
    cancel: () => press("content-create.cancel", ["Cancel"], navBar()),
    // The form's alerts, wherever drawn, and each field's own error ("This slug is already in
    // use." under the slug).
    fieldError: () => formErrors(),
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
    // The success alert, drawn after the footer; "Unable to Publish Page ... could not be
    // published" is the refusal, not a success.
    publishedSuccess: async () => {
      await seen(page.getByRole("alert")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      return (await everyAlert(/published/i)).filter((words) => !matches(/unable|could not|not be/i, words)).join("\n");
    },
    // Seen with the address "about" as an administrator: "This slug is already in use." under
    // the slug, and "Unable to Publish Page" after the footer.
    duplicateSlugError: async () => {
      await seen(page.getByRole("alert")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      return [...(await fieldErrors(/slug|already|in use/i)), ...(await everyAlert(/slug|already in use/i))].join("\n");
    },
    refusedForNonAdministrator: () => contentText(),
  };

  // An image the test does not name is still an image put into the text: the harness's own
  // small PNG, under a plain name.
  async function uploadBodyImage(where: string, input: unknown): Promise<void> {
    // The page editor carries no heading to wait for; the body box is what it draws.
    await settle();
    await seen(page.getByRole("textbox", { name: labelled("Body") }))
      .first()
      .waitFor({ state: "visible", timeout: LATE_CONTROL_MS })
      .catch(() => undefined);
    let files = filePaths(input);
    if (!files.length) {
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const kind = field(record, "type", "extension", "format", "mimeType").toLowerCase();
      const ending = /jpe?g/.test(kind) ? "jpg" : /gif/.test(kind) ? "gif" : /pdf/.test(kind) ? "pdf" : "png";
      const content = record.content ?? record.contents;
      const bytes = record.bytes ?? record.size ?? record.sizeBytes;
      files = [
        uploadFile({
          name: `body-image.${ending}`,
          content: typeof content === "string" || content instanceof Uint8Array ? content : undefined,
          bytes: typeof bytes === "number" ? bytes : undefined,
        }),
      ];
    }
    // "Choose File" is the file input itself, drawn beneath the body box, which takes any
    // click aimed at it; the file is handed to the input directly.
    const control = page.getByRole("button", { name: "Choose File", exact: true });
    // A saved page shows its body read-only until "Edit" is pressed; its "Choose File" stays
    // pressable meanwhile, but an image chosen then goes nowhere (seen on "about-us").
    const body = seen(page.getByRole("textbox", { name: labelled("Body") }));
    const readOnly = (await body.count()) > 0 && (await body.first().isDisabled());
    if (!(await control.count()) || readOnly) {
      const edit = await findControl(navBar(), "Edit");
      if (edit && !(await isDisabled(edit))) {
        await edit.click();
        await settle();
      }
      await control.first().waitFor({ state: "attached", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    }
    if (!(await control.count())) {
      throw new Error(
        `unbound: ${where} — the formatted-text editor offers no "Choose File" image control on ${page.url()}`,
      );
    }
    const before = (await body.count()) ? await body.first().inputValue().catch(() => "") : "";
    const referencesBefore = bodyImageReferences(before);
    // A notice still up from an earlier step ("Page Published") is not this upload's answer.
    const standing = new Set(await everyAlert());
    const taken = await control
      .first()
      .setInputFiles(files)
      .then(() => true)
      .catch(() => false);
    if (!taken) {
      const chooser = page.waitForEvent("filechooser", { timeout: 10000 });
      await control.first().dispatchEvent("click");
      await (await chooser).setFiles(files);
    }
    await settle();
    // The image is stored first and only then written into the text as "![name](FILE_ID:…)";
    // a refused one leaves the text as it was and says so in an alert of its own. Either ends
    // the wait; an alert that was already up before the file was chosen does not.
    for (let waited = 0; waited < 15000 && (await body.count()); waited += 250) {
      const now = await body.first().inputValue().catch(() => before);
      if (bodyImageReferences(now) !== referencesBefore) {
        rememberBodyImage(now);
        break;
      }
      const said = (await everyAlert()).filter((words) => !standing.has(words));
      if (said.length) break;
      await page.waitForTimeout(250);
    }
  }

  // The identifier of the image last written into a page's body, so the published page can
  // be read for that very image once it is opened.
  let bodyImageId = "";
  function rememberBodyImage(body: string): void {
    const ids = [...body.matchAll(/FILE_ID:([0-9a-f-]+)/gi), ...body.matchAll(/\/api\/files\/([0-9a-f-]+)/gi)];
    if (ids.length) bodyImageId = ids[ids.length - 1][1];
  }

  // Images in the published body only: every image in the page's content region that comes
  // after its title, less the "Published … | Updated …" line and anything inside the site's
  // own navigation or footer, so the header's logo and avatar are never taken for an image
  // in the text. Named and unnamed images alike. Old draws the body's FILE_ID image as an
  // image named after the file whose source is left empty; such an image is still on the
  // page, so it is reported by its name rather than dropped.
  async function imageSources(): Promise<string[]> {
    const heading = seen(page.getByRole("heading", { level: 1 }));
    if (!(await heading.count())) return [];
    const found = await heading
      .first()
      .evaluate((title) => {
        const sources: string[] = [];
        let region: Element = title.parentElement ?? title;
        // Widen to the content region: the nearest ancestor that still holds no navigation
        // or footer of the site.
        while (region.parentElement && !region.parentElement.querySelector("nav, footer, header")) {
          region = region.parentElement;
        }
        for (const image of Array.from(region.querySelectorAll("img"))) {
          if (image.closest("nav, footer, header")) continue;
          if (!(title.compareDocumentPosition(image) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
          // Only the date line itself ("Published … | Updated …", every line of it a date or
          // the bar between them) is left out. The paragraphs of the body that follow it
          // share a container whose text starts with that line, and they are the body.
          let dated = false;
          for (let part = image.parentElement; part && part !== region; part = part.parentElement) {
            const lines = ((part as HTMLElement).innerText ?? "")
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean);
            if (lines.length && lines.every((line) => /^(Published|Updated)\b/.test(line) || line === "|")) dated = true;
          }
          if (dated) continue;
          const src = image.getAttribute("src") ?? "";
          const name = image.getAttribute("alt") ?? "";
          if (src) sources.push(src);
          else if (name) sources.push(`img "${name}" (no source)`);
          else sources.push("img (no source)");
        }
        return sources;
      })
      .catch(() => [] as string[]);
    return [...new Set(found.filter(Boolean))];
  }

  // The name shown under "Published By" or "Updated By" links to that person's profile;
  // a page no person wrote names "System" as plain words, with no link, and reads empty.
  async function personLink(where: string, labels: string[]): Promise<string> {
    await ready();
    const name = await findAfter(labels);
    if (name === null) {
      throw new Error(`unbound: ${where} — no "${labels[0]}" label on ${page.url()}`);
    }
    const link = seen(page.getByRole("link", { name, exact: true }));
    if (!(await link.count())) return "";
    const href = (await link.first().getAttribute("href")) ?? "";
    return href ? new URL(href, baseURL).pathname : "";
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
    // Spread rather than listed, so the page still compiles against a
    // ContentEditPage that predates these two members.
    ...{
      publishedByLink: () => personLink("content-edit.published_by_link", ["Published By"]),
      updatedByLink: () => personLink("content-edit.updated_by_link", ["Updated By"]),
    },
    fixedPageWarning: () => linesMatching(/"fixed" page|fixed. page/i),
    slugLockedForFixedPage: () => linesMatching(/slug cannot be changed/i),
    deleteWithheldForFixedPage: () => controlState(["Delete"], navBar()),
    fieldError: () => messages(),
    duplicateSlugError: () => messages(/slug/i),
    changesPublishedSuccess: () => linesMatching(/published/i),
    // "Page Deleted" is announced as an alert drawn after the footer, which the page's
    // own content leaves off.
    deletedSuccess: () => alertLines(/deleted/i),
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
    // The body alone: what follows the page's heading, its "Published ... | Updated ..." line
    // left out the way bodyElementNames leaves it out, one line per line of text, so it reads
    // the same as the body an opportunity embeds under its "Scope & Contract" tab.
    pageBody: async () => {
      await ready();
      if (await notFoundShown()) return "";
      const heading = seen(page.getByRole("heading", { level: 1 }));
      if (!(await heading.count())) return contentText();
      const parts = await heading.first().evaluate((title) => {
        const said: string[] = [];
        for (let part = title.nextElementSibling; part; part = part.nextElementSibling) {
          const words = (part as HTMLElement).innerText ?? "";
          if (/^\s*(Published|Updated)\b/.test(words)) continue;
          said.push(words);
        }
        return said;
      });
      return parts
        .join("\n")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && line !== "|")
        .join("\n");
    },
    // Spread in rather than written into the literal, so the page still type-checks against a
    // surface that lacks these two readers.
    ...{
    // The rendered body is what follows the page's heading and its dated line: every element
    // inside it, in document order. The markup is written into a paragraph as typed, so an
    // inline script or image the page kept shows up here by name even when it did not run.
    bodyElementNames: async () => {
      await ready();
      const heading = seen(page.getByRole("heading", { level: 1 }));
      if (!(await heading.count())) {
        nothing(`content-view.body_element_names — no page heading on ${page.url()} to find the body after`);
      }
      const names = await heading.first().evaluate((title) => {
        const found: string[] = [];
        const walk = (element: Element) => {
          for (const child of Array.from(element.children)) {
            found.push(child.tagName.toLowerCase());
            walk(child);
          }
        };
        for (let part = title.nextElementSibling; part; part = part.nextElementSibling) {
          const words = (part as HTMLElement).innerText ?? "";
          if (/^\s*(Published|Updated)\b/.test(words)) continue;
          walk(part);
        }
        return found;
      });
      return names.join("\n");
    },
    // A dialog raised on opening or in the few seconds after is markup in the body running.
    bodyScriptRan: async () => {
      await ready();
      await page.waitForTimeout(3000);
      return raisedDialogs.length ? "yes" : "";
    },
    },
    publishedDate: () => linesMatching(/^Published /),
    updatedDate: () => linesMatching(/^Updated /),
    readableWhenSignedOut: () => contentText(),
    // Only the "Not Found" screen reads as anything; a page that exists reads as nothing.
    notFoundForUnknownAddress: async () => {
      await ready();
      return (await notFoundShown()) ? contentText() : "";
    },
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
    // Somebody short of an administrator asking after an unknown file is refused as not
    // authorized (401 "You do not have permission…"), not told it is missing; only an
    // administrator is answered 404 "File not found.".
    refusedForUnknownFile: async () => refusal((status) => status === 401 || status === 403),
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
    // As on the description: unknown to a vendor reads as not authorized, 404 is for administrators.
    refusedForUnknownFile: async () => refusal((status) => status === 401 || status === 403),
    notFoundForAdministrator: async () => refusal((status) => status === 404),
  };

  // The attachment control is a step of the opportunity and proposal forms rather than
  // a tab of its own; opening it means opening the form and walking to that step.
  // The opportunity file-attachment-control.open was last given, so a later read can tell
  // whether the page still shows that opportunity's forms and go back to it when not.
  let attachmentsOf: { opportunityId: string; route: string } | null = null;

  // The addresses of the attachment links on the step: stored files ("/api/files/") and
  // additions only previewed until the form is saved ("blob:"). Read again for a few seconds,
  // since the links are drawn a moment after the step or the save that produces them.
  async function attachmentHrefs(wanted: (href: string) => boolean, waitMs = 0): Promise<string[]> {
    const deadline = Date.now() + waitMs;
    for (;;) {
      const found = await seen(page.getByRole("link"))
        .evaluateAll((links) => links.map((l) => l.getAttribute("href") ?? ""))
        .catch(() => [] as string[]);
      const picked = found.filter(wanted);
      if (picked.length || Date.now() >= deadline) return picked;
      await page.waitForTimeout(250);
    }
  }
  const isStored = (href: string): boolean => href.includes("/api/files/");
  const isPreview = (href: string): boolean => href.startsWith("blob:");

  async function onAttachmentsStep(): Promise<boolean> {
    const step = await currentStep();
    return step !== null && matches(/Attachments$/i, (await step.innerText().catch(() => "")).trim());
  }

  const fileAttachmentControl: S.FileAttachmentControlPage = {
    async open(params) {
      const programme = params?.program || "code-with-us";
      const opportunityId = params?.opportunityId;
      if (!opportunityId) {
        throw new Error(
          "unbound: file-attachment-control.open — the attachments step needs the opportunity it belongs to",
        );
      }
      const route = `/opportunities/${programme}/${opportunityId}/edit?tab=opportunity`;
      attachmentsOf = { opportunityId, route };
      await go(route);
      // The step is headed "N. Attachments" and states its size limit whether or not the
      // form is being edited; "Add Attachment" appears only once editing has begun.
      await attachmentsStep();
    },
    // A stored attachment is offered as a link to the address the file is kept at. A file
    // just added is only previewed ("blob:") until the form is saved, so when that preview
    // is all there is and "Save Changes" is offered, the form is saved first and the stored
    // link waited for on the Attachments step.
    async attachmentAddress() {
      // Wherever the last action left the form — a proposal just submitted sits on its
      // first step, sometimes with an emptied dialog still open — the links are on the
      // Attachments step. A save's confirmation left open ("Publish Changes to Team With Us
      // Opportunity?") is confirmed, since dismissing it would discard the addition.
      const where = "file-attachment-control.attachment_address";
      await confirmOpenSave(where);
      await dismissDialog();
      // The opportunity open() was given, whose forms (the opportunity's own, or a proposal
      // made against it) all sit under its address. A page left anywhere else is taken back
      // to that opportunity's form, read-only or being edited as it was left.
      if (attachmentsOf && !new URL(page.url()).pathname.includes(attachmentsOf.opportunityId)) {
        await go(attachmentsOf.route);
      }
      await attachmentsStep();
      if (!(await onAttachmentsStep())) await walkToStep(/Attachments$/i);
      if (!(await onAttachmentsStep())) {
        const step = await currentStep();
        throw new Error(
          `unbound: ${where} — went to the Attachments step by the opportunity tab, the step menu and Previous/Next, but ${page.url()} shows ${
            step ? `"${(await step.innerText()).trim()}"` : "no numbered step"
          } instead`,
        );
      }
      const stored = (waitMs = 0): Promise<string[]> => attachmentHrefs(isStored, waitMs);
      let found = await stored(3000);
      if (!found.length && (await attachmentHrefs(isPreview)).length) {
        // Only a preview: the file is not stored until the form is saved — a published
        // opportunity through "Publish Changes" and its "Publish Changes to Code With Us
        // Opportunity?" confirmation, a draft through "Save Changes". A save not offered
        // is reported rather than read as no address.
        await saveAttachmentForm(where, "found the added file only previewed (blob:) on the Attachments step");
        await attachmentsStep();
        found = await stored(10000);
        if (!found.length) {
          const shown = [await alertMessages(), await messages().catch(() => "")].filter(Boolean).join(" | ");
          throw new Error(
            `${where} — saved the form holding the added file, but the Attachments step on ${page.url()} still links no /api/files/ address; ${
              shown ? `the page shows: ${shown.replace(/\n/g, " ")}` : "the page shows no message"
            }`,
          );
        }
      }
      // On the Attachments step with nothing linked: the file the test attached is not
      // there, and an empty address would only send the next reader to the wrong place.
      if (!found.length) {
        const shown = [await alertMessages(), await messages().catch(() => "")].filter(Boolean).join(" | ");
        throw new Error(
          `${where} — on the Attachments step of ${page.url()} there is neither a stored /api/files/ link nor a blob: preview of an added file; ${
            shown ? `the page shows: ${shown.replace(/\n/g, " ")}` : "the page shows no message"
          }`,
        );
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
    // On a published opportunity of any program an attachment is added in "Edit" and only
    // stored once "Publish Changes" is pressed and its confirmation ("Publish Changes to Code
    // With Us Opportunity?", "... Team With Us Opportunity?") accepted — seen as the
    // administrator on the seeded published Code With Us opportunity and on a published Team
    // With Us one: the step then links the file at /api/files/ instead of a blob: preview.
    // The addition is saved there, so what the test reads next is the stored attachment. An
    // upload that leaves no preview and no message, or a saved record offering no save, is
    // reported rather than passed over.
    addAttachment: async (input) => {
      const where = "file-attachment-control.add_attachment";
      // Notices already up ("Opportunity Published" from the publish just before) and the
      // links already stored are not this addition's answer.
      const standing = new Set(await everyAlert());
      const storedBefore = new Set(await attachmentHrefs(isStored));
      await addAttachment(where, input);
      // A file the step takes is previewed at once as a "blob:" link beside its name box.
      const previewed = (await attachmentHrefs(isPreview, 5000)).length > 0;
      if (!previewed) {
        // A refused upload leaves no preview and its own message on the step; there is
        // nothing to store, and saving would clear the refusal the test reads next.
        const said = (await everyAlert()).filter((words) => !standing.has(words) && matches(MESSAGE, words));
        const shown = [...said, await messages().catch(() => "")].filter(Boolean).join(" | ");
        if (shown) return;
        const stored = await attachmentHrefs(isStored);
        throw new Error(
          `${where} — gave the Attachments step's file chooser the file on ${page.url()}, but no blob: preview of it appeared and the page shows no message${
            stored.length ? ` (only the attachments already stored: ${stored.join(", ")})` : ""
          }`,
        );
      }
      // On a form still being created the file is stored by the create action itself.
      if (/\/create$/.test(new URL(page.url()).pathname)) return;
      // On a saved record the addition is stored only once the form is saved — "Publish
      // Changes" and its "Publish Changes to Code With Us Opportunity?" confirmation on a
      // published opportunity — and the top bar draws that control a moment after the step.
      const saves = ["Publish Changes", "Save Changes", "Submit Changes for Review", "Submit Changes"];
      const deadline = Date.now() + LATE_CONTROL_MS;
      let offered = false;
      while (!offered) {
        for (const name of saves) if (await findControl(navBar(), name)) offered = true;
        if (offered || Date.now() >= deadline) break;
        await page.waitForTimeout(250);
      }
      if (!offered) {
        // A draft form saved by the test's own next action (a draft proposal's "Submit" or
        // "Save Draft") keeps the addition for that action, as a form being created does.
        const later = ["Submit", "Save Draft", "Publish", "Submit for Review"];
        for (const name of later) if (await findControl(navBar(), name)) return;
        throw new Error(
          `unbound: ${where} — added the file (previewed as blob:) on ${page.url()}, but the top bar offers none of ${quoted([...saves, ...later])} to store it with`,
        );
      }
      await saveAttachmentForm(where, "added the file");
      await attachmentsStep();
      if (!(await onAttachmentsStep())) await walkToStep(/Attachments$/i);
      // The stored link replaces the preview once the save lands ("Opportunity Changes
      // Published", and the step links the file at /api/files/<id> — seen as the administrator
      // on a Code With Us opportunity just published from the create form). A save that ends
      // with no new stored link has not kept the file, and says why or is reported as silent.
      const fresh = await attachmentHrefs((href) => isStored(href) && !storedBefore.has(href), 10000);
      if (!fresh.length) {
        const said = (await everyAlert()).filter((words) => !standing.has(words));
        const shown = [...said, await messages().catch(() => "")].filter(Boolean).join(" | ");
        if (said.some((words) => matches(MESSAGE, words))) return;
        throw new Error(
          `${where} — added the file (previewed as blob:) and saved the form through its save and confirmation, but the Attachments step of ${page.url()} links no new /api/files/ address; ${
            shown ? `the page shows: ${shown.replace(/\n/g, " ")}` : "the page shows no message"
          }`,
        );
      }
    },
    renameNewAttachment: (input) =>
      renameAttachment("file-attachment-control.rename_new_attachment", input),
    removeNewAttachment: (input) =>
      removeAttachment("file-attachment-control.remove_new_attachment", input),
    // An attachment already stored leaves the record only once the form is saved: the
    // removal is followed by whichever save the top bar offers for this record's state.
    removeExistingAttachment: async (input) => {
      const where = "file-attachment-control.remove_existing_attachment";
      await removeAttachment(where, input);
      await saveAttachmentForm(where);
    },
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
    // Every picture is read in one pass: a screen that redraws its pictures (the organization
    // edit screen does, once its record loads) cannot then leave a read waiting on a picture
    // that has gone.
    const images = await page
      .getByRole("img")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const box = node.getBoundingClientRect();
          const style = window.getComputedStyle(node);
          const shown =
            (box.width > 0 || box.height > 0) && style.visibility !== "hidden" && style.display !== "none";
          return {
            source: node.getAttribute("src") ?? "",
            shown,
            bottom: box.bottom,
          };
        }),
      )
      .catch(() => [] as Array<{ source: string; shown: boolean; bottom: number }>);
    return images
      .filter(({ source, shown, bottom }) => source && shown && bottom > below)
      .map(({ source }) => source);
  }

  // A stored picture is shown from the service's file address; the placeholder shown when
  // there is none comes from the site's static images and is not a stored image.
  async function storedImageAddress(): Promise<string> {
    await ready();
    // A screen that has just saved draws its stored picture a moment after its record
    // reloads, so the pictures are looked at again for a few seconds before concluding.
    const until = Date.now() + LATE_CONTROL_MS;
    for (;;) {
      const stored = (await pictures()).find((source) => source.includes("/api/files/"));
      if (stored) return stored;
      // Only the placeholder, or no picture at all: nothing is stored to point at.
      if (Date.now() >= until) return "";
      await page.waitForTimeout(250);
    }
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
          const timer = window.setTimeout(() => resolve(null), 10000);
          image.onload = () => {
            window.clearTimeout(timer);
            resolve({ width: image.naturalWidth, height: image.naturalHeight });
          };
          image.onerror = () => {
            window.clearTimeout(timer);
            resolve(null);
          };
          image.src = src;
        }),
      source,
    );
  }

  // The page states no rule in words, but its "Choose File" control tells the chooser it opens
  // which kinds to offer: ".jpg,.jpeg,.png" on the profile picture (after "Edit Profile") and
  // on the formatted-text editor of /content/create. That list is what the person is offered,
  // one kind per line; a control that limits nothing reads as nothing.
  async function imageKindsOffered(where: string, edit: string): Promise<string> {
    await settle();
    const control = page.getByRole("button", { name: "Choose File", exact: true });
    if (!(await control.count())) {
      const opener = await findControl(navBar(), edit);
      if (opener && !(await isDisabled(opener))) {
        await opener.click();
        await settle();
      }
      await control.first().waitFor({ state: "attached", timeout: LATE_CONTROL_MS }).catch(() => undefined);
    }
    if (!(await control.count())) {
      nothing(`${where} — no "Choose File" image control on ${page.url()}, after pressing "${edit}" where offered`);
    }
    const accepted = (await control.first().getAttribute("accept").catch(() => null)) ?? "";
    return accepted
      .split(",")
      .map((kind) => kind.trim())
      .filter(Boolean)
      .join("\n");
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
    onlyJpegAndPngOffered: () => imageKindsOffered("file-image-picker.only_jpeg_and_png_offered", "Edit Profile"),
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

  // The image references in a page's body: "FILE_ID:<id>" as the editor writes an upload
  // in, or an address under /api/files/. Empty when the body carries none.
  function bodyImageReferences(body: string): string {
    return [...body.matchAll(/FILE_ID:[0-9a-f-]+|\/api\/files\/[^\s)"'\]]+/gi)].map((found) => found[0]).join("\n");
  }

  // The page the image is being put into, by its slug: taken from the address the screen is
  // at (/content/<slug>/edit after "Publish Changes", or /content/<slug>), else from the
  // slug this page was last opened with.
  let embeddedSlug = "";
  function slugInView(): string {
    const path = new URL(page.url(), baseURL || "http://localhost").pathname;
    const found = /^\/content\/([^/]+)(?:\/edit)?\/?$/.exec(path);
    return found && found[1] !== "create" ? decodeURIComponent(found[1]) : embeddedSlug;
  }

  const fileEmbeddedImage: S.FileEmbeddedImagePage = {
    open: async (params?: Record<string, string>) => {
      const slug = params?.slug || params?.id;
      if (slug) embeddedSlug = slug;
      await go("/content/:slug/edit", params);
    },
    uploadBodyImage: (input) => uploadBodyImage("file-embedded-image.upload_body_image", input),
    // An uploaded image goes into the text as a reference to the address it is kept at.
    // The body refers to an upload as "![name](FILE_ID:<id>)"; the file is kept at its own
    // address under that identifier.
    async imageAddress() {
      const body = await fieldValue(["Body"]);
      rememberBodyImage(body);
      const inText = /\/api\/files\/[^\s)"'\]]+/.exec(body);
      if (inText) return inText[0];
      const byId = /FILE_ID:([0-9a-f-]+)/i.exec(body);
      if (byId) return `/api/files/${byId[1]}`;
      return storedImageAddress();
    },
    // Only the image reference the upload wrote into the text, never the rest of the body:
    // empty when no image was inserted.
    // The upload writes "![name](FILE_ID:<id>)" into the Body box once the file is stored, a
    // moment after it is chosen (seen as the administrator on /content/create), so the box is
    // read again for a few seconds before it is taken to hold no image.
    imageInsertedIntoText: async () => {
      let references = "";
      for (let waited = 0; waited <= 5000; waited += 250) {
        const body = await fieldValue(["Body"]);
        rememberBodyImage(body);
        references = bodyImageReferences(body);
        if (references) break;
        await page.waitForTimeout(250);
      }
      return references;
    },
    onlyJpegAndPngOffered: () => imageKindsOffered("file-embedded-image.only_jpeg_and_png_offered", "Edit"),
    uploadingIndicator: () => linesMatching(/uploading/i),
    // Read on the published /content/<slug> page, opened here for the page's slug (the edit
    // screen "Publish Changes" leaves behind shows the title, not the published body): once it
    // has drawn, the body's FILE_ID marker is shown as an image kept at /api/files/<id>, which
    // may arrive a moment after the text. When none arrives, the body's images are what is
    // there — empty when it shows none. Old draws the marker as an image named after the file
    // with an empty source, reported as `img "<name>" (no source)`, never as an address it
    // does not carry.
    imageRenderedInPublishedText: async () => {
      const slug = slugInView();
      if (!slug) {
        nothing(`file-embedded-image.image_rendered_in_published_text — no page slug known on ${page.url()}, and the page was never opened with one`);
      }
      const published = address("/content/:slug", { slug });
      if (new URL(page.url()).pathname !== new URL(published).pathname) {
        await page.goto(published, { waitUntil: "domcontentloaded" });
        await settle();
      }
      await ready();
      const wanted = bodyImageId ? `/api/files/${bodyImageId}` : "/api/files/";
      let sources: string[] = [];
      for (let waited = 0; waited <= 5000; waited += 250) {
        sources = await imageSources();
        if (sources.some((source) => source.includes(wanted))) break;
        await page.waitForTimeout(250);
      }
      return sources.join("\n");
    },
    uploadFailureLeavesTextUnchanged: () => fieldValue(["Body"]),
  };

  // ================================================================ caught mail

  // The mail catcher is not the target: it is Mailpit, at the address the harness names in
  // SDLC_MAIL_API. Its listing carries an identifier, a subject and the visible recipients;
  // one message read by its identifier carries the rest — sender, blind copies, reply-to
  // and both bodies. Every message this target sends comes from "Digital Marketplace
  // <donotreply@example.test>", is addressed visibly to that same address, and reaches its
  // real recipients as blind copies.

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

  // Each Playwright worker owns its own copy of the target and its own catcher, named
  // SDLC_MAIL_API_<worker number>; the unnumbered name is the fallback for a single copy,
  // exactly as the harness's own mail fixture resolves it.
  function mailApi(where: string): string {
    const copy = process.env.TEST_PARALLEL_INDEX ?? "0";
    const api = (process.env[`SDLC_MAIL_API_${copy}`] ?? process.env.SDLC_MAIL_API ?? "").replace(/\/+$/, "");
    return api || nothing(`${where} — SDLC_MAIL_API is not set, so there is no mail catcher to read`);
  }

  const mailbox = (address: MailAddress | null | undefined): string =>
    !address?.Address ? "" : address.Name ? `${address.Name} <${address.Address}>` : address.Address;
  const mailboxes = (list: MailAddress[] | null | undefined): string =>
    (list ?? []).map(mailbox).filter(Boolean).join("\n");

  async function mailJson(where: string, path: string): Promise<unknown> {
    const target = mailApi(where) + path;
    const response = await page.request.get(target).catch((error: unknown) => {
      throw new Error(`unbound: ${where} — the mail catcher at ${target} could not be reached (${String(error)})`);
    });
    if (response.status() !== 200) {
      nothing(`${where} — the mail catcher answered ${response.status()} for ${target}`);
    }
    return response.json();
  }

  let openedMessage: CaughtMessage | null = null;

  function message(where: string): CaughtMessage {
    return openedMessage ?? nothing(`${where} — no message has been opened`);
  }

  const decodeEntities = (words: string): string =>
    words
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

  // Every link of the formatted body as its label and where it leads. A link drawn as a
  // picture (the logo at the top) is labelled by the picture's own words.
  function bodyLinks(html: string): { label: string; href: string }[] {
    const found: { label: string; href: string }[] = [];
    const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = anchor.exec(html)) !== null) {
      const href = /\bhref\s*=\s*"([^"]*)"/i.exec(match[1])?.[1] ?? /\bhref\s*=\s*'([^']*)'/i.exec(match[1])?.[1];
      if (!href) continue;
      let label = decodeEntities(match[2].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
      if (!label) label = decodeEntities(/\balt\s*=\s*"([^"]*)"/i.exec(match[2])?.[1] ?? "").trim();
      found.push({ label, href: decodeEntities(href) });
    }
    return found;
  }

  const caughtMessage: PageOf<"caughtMessage"> = {
    async open(params) {
      const id = params?.messageId;
      if (!id) nothing("caught-message.open — no message identifier was given");
      openedMessage = (await mailJson(
        "caught-message.open",
        `/api/v1/message/${encodeURIComponent(id)}`,
      )) as CaughtMessage;
    },
    // Opens, in the browser, the link of the formatted body carrying the label given — its
    // exact words first, then any link whose words contain them.
    async followLinkInBody(input) {
      const where = "caught-message.follow_link_in_body";
      const wanted = (field(input, "label", "link", "name", "text") || asText(input)).trim();
      if (!wanted) nothing(`${where} — no link label was given`);
      const links = bodyLinks(message(where).HTML ?? "");
      // An invitation's message labels its two answers "Approve" and "Reject"; a criterion
      // that says accept or decline means those same two links.
      const SAME_ANSWER: Record<string, string[]> = {
        accept: ["approve"],
        approve: ["accept"],
        decline: ["reject"],
        reject: ["decline"],
      };
      const find = (words: string): { label: string; href: string } | undefined =>
        links.find((each) => each.label.toLowerCase() === words) ??
        links.find((each) => each.label.toLowerCase().includes(words));
      const lower = wanted.toLowerCase();
      const link =
        find(lower) ??
        Object.entries(SAME_ANSWER)
          .filter(([word]) => new RegExp(`\\b${word}`).test(lower))
          .flatMap(([, others]) => others)
          .map(find)
          .find((each) => each !== undefined);
      if (!link) {
        nothing(
          `${where} — the message's formatted body has no link labelled "${wanted}" (its links: ${
            links.map((each) => `"${each.label}"`).join(", ") || "none"
          })`,
        );
      }
      await page.goto(link.href, { waitUntil: "domcontentloaded" });
      await settle();
    },
    visibleRecipients: async () => mailboxes(message("caught-message.visible_recipients").To),
    copiedRecipients: async () => mailboxes(message("caught-message.copied_recipients").Bcc),
    sender: async () => mailbox(message("caught-message.sender").From),
    replyTo: async () => mailboxes(message("caught-message.reply_to").ReplyTo),
    subject: async () => message("caught-message.subject").Subject ?? "",
    htmlBody: async () => message("caught-message.html_body").HTML ?? "",
    plainTextBody: async () => message("caught-message.plain_text_body").Text ?? "",
    // The first picture of the formatted body is the logo, drawn inside a link home.
    logoAddress: async () =>
      decodeEntities(/<img\b[^>]*\bsrc\s*=\s*"([^"]*)"/i.exec(message("caught-message.logo_address").HTML ?? "")?.[1] ?? ""),
    linksInBody: async () =>
      bodyLinks(message("caught-message.links_in_body").HTML ?? "")
        .map((each) => `${each.label} -> ${each.href}`)
        .join("\n"),
  };

  let caughtList: CaughtMessage[] | null = null;
  let caughtTotal = 0;

  function caught(where: string): CaughtMessage[] {
    return caughtList ?? nothing(`${where} — the list of caught messages has not been opened`);
  }

  const caughtMessageList: PageOf<"caughtMessageList"> = {
    // Newest first, read a page at a time until the catcher's own total is reached.
    async open() {
      const all: CaughtMessage[] = [];
      let total = 0;
      for (let start = 0; start < 100000; ) {
        const got = (await mailJson(
          "caught-message-list.open",
          `/api/v1/messages?start=${start}&limit=500`,
        )) as { messages?: CaughtMessage[]; messages_count?: number; total?: number };
        const batch = got.messages ?? [];
        total = got.messages_count ?? got.total ?? all.length + batch.length;
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

  // The catcher's own fault injection (Mailpit "chaos"): while its sender fault is certain,
  // its SMTP server refuses every message at the first command, so nothing is caught.
  // Checked on this catcher: PUT with the sender's probability at 100 and then 0 is
  // answered 200 with the settings now in force.
  let chaosAnswer: Record<string, unknown> | null = null;

  async function chaos(where: string, probability?: number): Promise<void> {
    const target = `${mailApi(where)}/api/v1/chaos`;
    const sent =
      probability === undefined
        ? page.request.get(target)
        : page.request.put(target, { data: { Sender: { ErrorCode: 451, Probability: probability } } });
    const response = await sent.catch((error: unknown) => {
      throw new Error(`unbound: ${where} — the mail catcher at ${target} could not be reached (${String(error)})`);
    });
    if (response.status() !== 200) {
      nothing(`${where} — the mail catcher answered ${response.status()} for ${target}; its fault injection is not switched on`);
    }
    chaosAnswer = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  }

  const mailDeliveryFault: PageOf<"mailDeliveryFault"> = {
    open: () => chaos("mail-delivery-fault.open"),
    refuseDelivery: () => chaos("mail-delivery-fault.refuse_delivery", 100),
    restoreDelivery: () => chaos("mail-delivery-fault.restore_delivery", 0),
    // "refused <code>" while the fault is in force, as the catcher reads it now; nothing
    // when delivery is accepted.
    async deliveryRefused() {
      await chaos("mail-delivery-fault.delivery_refused");
      const sender = (chaosAnswer?.Sender ?? {}) as Record<string, unknown>;
      return Number(sender.Probability ?? 0) >= 100 ? `refused ${String(sender.ErrorCode ?? "")}`.trim() : "";
    },
  };

  // The pass-through proxy in front of the catcher's SMTP port (its control API beside the
  // catcher's, under /hold). Checked on this catcher: reading the toxics answers 200 with a
  // list; adding "hold" answers 200, and 409 when it is already there; deleting it answers
  // 204, and 404 when it is already gone. Either answer to each leaves the proxy in the
  // state asked for, so both are taken as done.
  let heldToxics: Array<Record<string, unknown>> = [];

  async function hold(where: string, method: "GET" | "POST" | "DELETE"): Promise<void> {
    const toxics = `${mailApi(where)}/hold/proxies/smtp/toxics`;
    const target = method === "DELETE" ? `${toxics}/hold` : toxics;
    const sent =
      method === "GET"
        ? page.request.get(target)
        : method === "DELETE"
          ? page.request.delete(target)
          : page.request.post(target, {
              data: {
                name: "hold",
                type: "latency",
                stream: "downstream",
                toxicity: 1,
                attributes: { latency: 3000, jitter: 0 },
              },
            });
    const response = await sent.catch((error: unknown) => {
      throw new Error(`unbound: ${where} — the mail delay proxy at ${target} could not be reached (${String(error)})`);
    });
    const settled =
      method === "GET"
        ? [200]
        : method === "POST"
          ? [200, 201, 409]
          : [200, 204, 404];
    if (!settled.includes(response.status())) {
      nothing(`${where} — the mail delay proxy answered ${response.status()} for ${method} ${target}`);
    }
    if (method === "GET") {
      const listed = await response.json().catch(() => null);
      heldToxics = Array.isArray(listed) ? (listed as Array<Record<string, unknown>>) : [];
    }
  }

  const mailDeliveryDelay: PageOf<"mailDeliveryDelay"> = {
    open: () => hold("mail-delivery-delay.open", "GET"),
    slowDelivery: () => hold("mail-delivery-delay.slow_delivery", "POST"),
    restoreDeliverySpeed: () => hold("mail-delivery-delay.restore_delivery_speed", "DELETE"),
    // "slowed <latency>ms" while the delay named "hold" is in force, as the proxy reads it
    // now; nothing when replies pass at full speed.
    async deliverySlowed() {
      await hold("mail-delivery-delay.delivery_slowed", "GET");
      const toxic = heldToxics.find((each) => each.name === "hold");
      if (!toxic) return "";
      const attributes = (toxic.attributes ?? {}) as Record<string, unknown>;
      return `slowed ${String(attributes.latency ?? "")}ms`;
    },
  };

  // ================================================================ requests no screen makes

  // Each of these is a request to the service's own interface, made from the browser's
  // session so it carries the signed-in person, and the latest answer is what the
  // observations read — the same answer the file pages above keep.
  async function send(where: string, method: string, target: string, data?: unknown): Promise<Answer> {
    const response = await page.request
      .fetch(target, { method, ...(data === undefined ? {} : { data }) })
      .catch((error: unknown) => {
        throw new Error(`unbound: ${where} — ${method} ${target} could not be made (${String(error)})`);
      });
    const got: Answer = {
      status: response.status(),
      headers: response.headers(),
      body: await response.text().catch(() => ""),
    };
    lastAnswer = got;
    return got;
  }

  // A record read on the side, to learn what a request must carry, without taking the
  // place of the answer the observations read.
  async function peek(target: string): Promise<{ status: number; json: unknown }> {
    const response = await page.request.get(target).catch(() => null);
    if (!response) return { status: 0, json: null };
    let json: unknown = null;
    try {
      json = JSON.parse(await response.text());
    } catch {
      json = null;
    }
    return { status: response.status(), json };
  }

  function parsedAnswer(): unknown {
    try {
      return JSON.parse(lastAnswer?.body ?? "");
    } catch {
      return null;
    }
  }

  // An answer that went through reads as its status and body; a refusal reads as nothing.
  function accepted(what: string): string {
    const got = answer(what);
    return got.status < 300 ? `${got.status} ${got.body}` : "";
  }

  // The form a refused answer takes: its body with every word of prose replaced by the
  // kind of thing it is, so two refusals can be compared by the fields they carry and how
  // they name their reason, not by their wording.
  function shapeOf(value: unknown): unknown {
    if (Array.isArray(value)) return value.length ? [shapeOf(value[0])] : [];
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, inner]) => [key, shapeOf(inner)]),
      );
    }
    return value === null ? null : typeof value;
  }

  const UUID_ONLY = new RegExp(`^${UUID}$`);

  function handleIn(group: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
    const found = group[key];
    return found && typeof found === "object" ? (found as Record<string, unknown>) : undefined;
  }

  // A person named as a seed handle, a persona, an identifier or an address, as the
  // service's identifier for them.
  function userIdFor(value: string): string {
    const byHandle = handleIn(seed.users as Record<string, unknown>, value);
    if (byHandle?.id) return String(byHandle.id);
    if (UUID_ONLY.test(value)) return value;
    return seedUserFor(value)?.id ?? "";
  }

  // The same, for a person handed over in any shape: a string, or a record carrying an
  // identifier, an address or a nested user.
  function userIdOf(value: unknown): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number") return userIdFor(String(value));
    if (typeof value !== "object" || Array.isArray(value)) return "";
    const record = value as Record<string, unknown>;
    if (typeof record.id === "string" && record.id) {
      const known = userIdFor(record.id);
      if (known) return known;
    }
    const key = personKey(record);
    return key ? userIdFor(key) : "";
  }

  function emailFor(value: string): string {
    const byHandle = handleIn(seed.users as Record<string, unknown>, value);
    if (byHandle?.email) return String(byHandle.email);
    return seedUserFor(value)?.email ?? value;
  }

  function organizationIdFor(value: string): string {
    const byHandle = handleIn(seed.organizations as Record<string, unknown>, value);
    return byHandle?.id ? String(byHandle.id) : value;
  }

  function fileIdFor(value: string): string {
    const byHandle = handleIn((seed as unknown as Record<string, unknown>).stored_files as Record<string, unknown>, value);
    if (byHandle?.id) return String(byHandle.id);
    const inAddress = new RegExp(`/api/files/(${UUID})`).exec(value);
    return inAddress ? inAddress[1] : value;
  }

  // Watching an opportunity, as a request. Checked here, as users.vendorOne on
  // seed.opportunities.publishedCodeWithUs: POST /api/subscribers/<program> with
  // { opportunity } answered 201 with the subscription, and asked again 409
  // {"conflict":["This user is already subscribed to this opportunity."]}; DELETE
  // /api/subscribers/<program>/<opportunity> answered 200, and asked again 404
  // {"notFound":["This user is not subscribed to this opportunity."]}; an identifier naming
  // no opportunity 404 {"notFound":["The specified opportunity does not exist"]}. As the
  // opportunity's author, 400 {"opportunity":["You cannot subscribe to your own
  // opportunity."]}; signed out, both requests 401 {"permissions":[...]}. Sprint With Us and
  // Team With Us answered the same way.
  const WATCH_REQUEST = "opportunity-watch-request";
  let watchProgram = "";
  let watchOpportunity = "";

  // The opportunity the input names, as a handle, an identifier or the seeded record, and
  // the programme it belongs to: the one opened, else the one the input or the seed names.
  function watchTarget(where: string, input: unknown): { program: string; opportunity: string } {
    const named = typeof input === "string" ? input : given(input, ["opportunity", "opportunityId", "opportunityIdentifier", "id"]);
    const opportunity = seededId(named, "opportunities");
    if (!opportunity) nothing(`${where} — the input names no opportunity (${JSON.stringify(input)})`);
    const fromSeed = Object.values(seed.opportunities as unknown as Record<string, { id?: unknown; program?: unknown }>).find(
      (each) => each && String(each.id) === opportunity,
    )?.program;
    const program =
      watchProgram ||
      givenText(input, ["program", "programme"]) ||
      (named && typeof named === "object" ? String((named as Record<string, unknown>).program ?? "") : "") ||
      (typeof fromSeed === "string" ? fromSeed : "");
    if (!program) nothing(`${where} — no programme was opened or named for opportunity ${opportunity}`);
    watchOpportunity = opportunity;
    return { program, opportunity };
  }

  const opportunityWatchRequest: PageOf<"opportunityWatchRequest"> = {
    open: async (params?: { program?: string }) => {
      watchProgram = params?.program ?? "";
      watchOpportunity = "";
      lastAnswer = null;
    },
    async watchByRequest(input?: unknown) {
      const where = `${WATCH_REQUEST}.watch_by_request`;
      const { program, opportunity } = watchTarget(where, input);
      await send(where, "POST", `${baseURL}/api/subscribers/${encodeURIComponent(program)}`, { opportunity });
    },
    async stopWatchingByRequest(input?: unknown) {
      const where = `${WATCH_REQUEST}.stop_watching_by_request`;
      const { program, opportunity } = watchTarget(where, input);
      await send(
        where,
        "DELETE",
        `${baseURL}/api/subscribers/${encodeURIComponent(program)}/${encodeURIComponent(opportunity)}`,
      );
    },
    requestAccepted: async () => accepted(`${WATCH_REQUEST}.request_accepted`),
    refusalStatus: async () => {
      const got = answer(`${WATCH_REQUEST}.refusal_status`);
      return got.status >= 400 ? String(got.status) : "";
    },
    // The name the refusal's messages are filed under (conflict, opportunity, notFound,
    // permissions); an accepted request reads as nothing.
    refusalReason: async () => {
      const got = answer(`${WATCH_REQUEST}.refusal_reason`);
      if (got.status < 400) return "";
      return Object.keys(answered()).join("\n");
    },
    refusalMessages: async () =>
      (lastRefusal(`${WATCH_REQUEST}.refusal_messages`) ?? []).map((entry) => entry.message).join("\n"),
    // The opportunity's own "subscribed" flag, read on the side so the watch request's
    // answer stays the one the other observations read. Signed out, the opportunity carries
    // no such flag, which reads as nothing.
    watching: async () => {
      const where = `${WATCH_REQUEST}.watching`;
      if (!watchOpportunity) nothing(`${where} — no watch request has named an opportunity yet`);
      const program = watchProgram || watchTarget(where, watchOpportunity).program;
      const found = await peek(
        `${baseURL}/api/opportunities/${encodeURIComponent(program)}/${encodeURIComponent(watchOpportunity)}`,
      );
      if (found.status !== 200 || !found.json || typeof found.json !== "object") {
        nothing(`${where} — /api/opportunities/${program}/${watchOpportunity} answered ${found.status}`);
      }
      const flag = (found.json as Record<string, unknown>).subscribed;
      return typeof flag === "boolean" ? String(flag) : "";
    },
  };

  const organizationActingForList: PageOf<"organizationActingForList"> = {
    open: async () => {
      await send("organization-acting-for-list.open", "GET", `${baseURL}/api/ownedOrganizations`);
    },
    // The organizations answered, one legal name per line. Signed out, this target answers
    // an empty list rather than refusing.
    organizationsOffered: async () => {
      const got = answer("organization-acting-for-list.organizations_offered");
      if (got.status !== 200) return "";
      const listed = parsedAnswer();
      return Array.isArray(listed)
        ? listed.map((each) => String((each as Record<string, unknown>).legalName ?? "")).join("\n")
        : "";
    },
    refusedWhenNotPermitted: async () => refusal((status) => status === 401 || status === 403),
  };

  const affiliationInvitationRequest: PageOf<"affiliationInvitationRequest"> = {
    open: async () => {
      await send("affiliation-invitation-request.open", "GET", `${baseURL}/api/affiliations`);
    },
    async inviteWithMembershipType(input) {
      const where = "affiliation-invitation-request.invite_with_membership_type";
      // The organization may come as a seed handle, an identifier or the seeded record itself,
      // and the person as an address, a handle or a seeded user record.
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const orgGiven = record.organization ?? record.organizationId ?? record.org ?? record.orgId;
      const organization =
        typeof orgGiven === "string"
          ? orgGiven
          : orgGiven && typeof orgGiven === "object" && typeof (orgGiven as Record<string, unknown>).id === "string"
            ? String((orgGiven as Record<string, unknown>).id)
            : "";
      const whoGiven = record.email ?? record.userEmail ?? record.invitee ?? record.address ?? record.user ?? record.member;
      const invitee =
        typeof whoGiven === "string" ? whoGiven : whoGiven && typeof whoGiven === "object" ? personKey(whoGiven) : "";
      const membershipType = field(input, "membershipType", "membership_type", "type", "role");
      for (const [key, value] of [["organization", organization], ["email", invitee], ["membershipType", membershipType]]) {
        if (!value) nothing(`${where} — the input names no ${key} to send`);
      }
      await send(where, "POST", `${baseURL}/api/affiliations`, {
        userEmail: emailFor(invitee),
        organization: organizationIdFor(organization),
        membershipType,
      });
    },
    invitationCreated: async () => accepted("affiliation-invitation-request.invitation_created"),
    // The refusal whole, when it is about the membership type; this target names the field
    // ({"membershipType":["Invalid membership type provided."]}).
    invalidMembershipTypeError: async () =>
      refusal((status) => status >= 400, /membershipType|membership type/i),
    // The created membership's "id", from the service's 201 answer; a refused invitation
    // created none and reads as nothing.
    membershipIdentifier: async () =>
      createdField("affiliation-invitation-request.membership_identifier", "id"),
  };

  // Accepting a membership is PUT /api/affiliations/:id with { tag: "approve" }, the tag the
  // service registers for it. Checked here: an active membership (affiliations.qualifiedMember)
  // came back 400 {"affiliation":["Membership is not pending."]}; the organization's owner
  // accepting somebody else's invitation (affiliations.pendingInvitation) and a signed-out
  // request both came back 401 {"permissions":["You do not have permission to perform this
  // action."]}.
  const APPROVAL_REQUEST = "affiliation-approval-request";
  let approvalAffiliation = "";

  const affiliationApprovalRequest: PageOf<"affiliationApprovalRequest"> = {
    open: async (params?: { affiliationId?: string }) => {
      approvalAffiliation = seededId(params?.affiliationId, "affiliations");
    },
    async acceptMembershipByRequest(input?: unknown) {
      const where = `${APPROVAL_REQUEST}.accept_membership_by_request`;
      const named = seededId(
        given(input, ["affiliation", "affiliationId", "membership", "membershipId", "membershipIdentifier", "id"]),
        "affiliations",
      );
      const affiliation = named || approvalAffiliation;
      if (!affiliation) nothing(`${where} — no membership was opened or named to accept`);
      await send(where, "PUT", `${baseURL}/api/affiliations/${encodeURIComponent(affiliation)}`, {
        tag: "approve",
        value: null,
      });
    },
    requestAccepted: async () => accepted(`${APPROVAL_REQUEST}.request_accepted`),
    membershipStatus: async () => createdField(`${APPROVAL_REQUEST}.membership_status`, "membershipStatus"),
    refusalMessages: async () =>
      (lastRefusal(`${APPROVAL_REQUEST}.refusal_messages`) ?? []).map((entry) => entry.message).join("\n"),
    refusalStatus: async () => {
      const got = answer(`${APPROVAL_REQUEST}.refusal_status`);
      return got.status >= 400 ? String(got.status) : "";
    },
  };

  // Ending a membership is DELETE /api/affiliations/:id. Checked here: signed in as the
  // organization's owner, ending affiliations.qualifiedOwner came back 400
  // {"affiliation":["Unable to remove membership. This is the sole owner for this organization."]}.
  const REMOVAL_REQUEST = "affiliation-removal-request";
  let removalAffiliation = "";

  const affiliationRemovalRequest: PageOf<"affiliationRemovalRequest"> = {
    open: async (params?: { affiliationId?: string }) => {
      removalAffiliation = seededId(params?.affiliationId, "affiliations");
    },
    async endMembershipByRequest(input?: unknown) {
      const where = `${REMOVAL_REQUEST}.end_membership_by_request`;
      const named = seededId(
        given(input, ["affiliation", "affiliationId", "membership", "membershipId", "membershipIdentifier", "id"]),
        "affiliations",
      );
      const affiliation = named || removalAffiliation;
      if (!affiliation) nothing(`${where} — no membership was opened or named to end`);
      await send(where, "DELETE", `${baseURL}/api/affiliations/${encodeURIComponent(affiliation)}`);
    },
    requestAccepted: async () => accepted(`${REMOVAL_REQUEST}.request_accepted`),
    refusalMessages: async () =>
      (lastRefusal(`${REMOVAL_REQUEST}.refusal_messages`) ?? []).map((entry) => entry.message).join("\n"),
    refusalStatus: async () => {
      const got = answer(`${REMOVAL_REQUEST}.refusal_status`);
      return got.status >= 400 ? String(got.status) : "";
    },
  };

  const userListRequest: PageOf<"userListRequest"> = {
    open: async () => {
      await send("user-list-request.open", "GET", `${baseURL}/api/users`);
    },
    // One account per line: its name, address, kind and standing.
    accountsAnswered: async () => {
      const got = answer("user-list-request.accounts_answered");
      if (got.status !== 200) return "";
      const listed = parsedAnswer();
      if (!Array.isArray(listed)) return "";
      return listed
        .map((each) => {
          const account = each as Record<string, unknown>;
          return `${account.name ?? ""} <${account.email ?? ""}> ${account.type ?? ""} ${account.status ?? ""}`.trim();
        })
        .join("\n");
    },
    refusedWhenNotPermitted: async () => refusal((status) => status === 401 || status === 403),
    refusalStatus: async () => {
      const got = answer("user-list-request.refusal_status");
      return got.status >= 400 ? String(got.status) : "";
    },
  };

  // A page is read by its address, but changed and removed only by its identifier: asked
  // to change "about" by its address, this target answers 404. So the page is looked up by
  // its address first, and the request made against the identifier that finds; when the
  // lookup finds nothing, the address itself is sent and the service answers for it.
  let openedSlug = "";

  function slugFrom(input: unknown): string {
    return field(input, "slug", "address", "page") || (typeof input === "string" ? input : "") || openedSlug;
  }

  async function pageRecord(slug: string): Promise<Record<string, unknown> | null> {
    const found = await peek(`${baseURL}/api/content/${encodeURIComponent(slug)}`);
    return found.status === 200 && found.json && typeof found.json === "object"
      ? (found.json as Record<string, unknown>)
      : null;
  }

  function pageFields(input: unknown): Record<string, unknown> {
    const given: Record<string, unknown> = {};
    if (!input || typeof input !== "object" || Array.isArray(input)) return given;
    const record = input as Record<string, unknown>;
    for (const key of ["title", "slug", "body", "fixed"]) if (record[key] !== undefined) given[key] = record[key];
    return given;
  }

  async function changePage(where: string, input: unknown, renamed?: string): Promise<void> {
    const slug = slugFrom(input);
    if (!slug) nothing(`${where} — no page was opened or named`);
    const current = await pageRecord(slug);
    const body: Record<string, unknown> = {
      title: current?.title,
      slug: current?.slug ?? slug,
      body: current?.body,
      ...pageFields(input),
    };
    if (renamed !== undefined) body.slug = renamed;
    await send(where, "PUT", `${baseURL}/api/content/${encodeURIComponent(String(current?.id ?? slug))}`, body);
  }

  const contentRequest: PageOf<"contentRequest"> = {
    open: async (params) => {
      openedSlug = params?.slug ?? "";
    },
    readPageListByRequest: async () => {
      await send("content-request.read_page_list_by_request", "GET", `${baseURL}/api/content`);
    },
    readPageByRequest: async (input) => {
      const where = "content-request.read_page_by_request";
      const slug = slugFrom(input);
      if (!slug) nothing(`${where} — no page was opened or named`);
      await send(where, "GET", `${baseURL}/api/content/${encodeURIComponent(slug)}`);
    },
    createPageByRequest: async (input) => {
      const where = "content-request.create_page_by_request";
      const given = pageFields(input);
      if (!Object.keys(given).length) nothing(`${where} — the input names no title, address or body to send`);
      await send(where, "POST", `${baseURL}/api/content`, given);
    },
    changePageByRequest: (input) => changePage("content-request.change_page_by_request", input),
    renamePageByRequest: async (input) => {
      const where = "content-request.rename_page_by_request";
      // The new address comes as "to" (or a like name), or as a "slug" that differs from the
      // page opened — the address the page is to have — or as the input itself.
      const given = field(input, "slug", "address");
      const to =
        field(input, "to", "newSlug", "new_slug", "renameTo", "rename_to", "newAddress", "new_address") ||
        (given && given !== openedSlug && (openedSlug || field(input, "from", "oldSlug", "old_slug")) ? given : "") ||
        (typeof input === "string" ? input : "");
      if (!to) {
        nothing(`${where} — the input names no new address for the page opened ("${openedSlug}"): no "to", and no "slug" other than the page's own`);
      }
      // The page being renamed is the one opened, unless the input names it as "from".
      const from = field(input, "from", "oldSlug", "old_slug") || openedSlug || given;
      await changePage(where, { ...pageFields(input), slug: from }, to);
    },
    removePageByRequest: async (input) => {
      const where = "content-request.remove_page_by_request";
      const slug = slugFrom(input);
      if (!slug) nothing(`${where} — no page was opened or named`);
      const current = await pageRecord(slug);
      await send(where, "DELETE", `${baseURL}/api/content/${encodeURIComponent(String(current?.id ?? slug))}`);
    },
    requestAccepted: async () => accepted("content-request.request_accepted"),
    refusalStatus: async () => {
      const got = answer("content-request.refusal_status");
      return got.status >= 400 ? String(got.status) : "";
    },
    refusalShape: async () => {
      const got = answer("content-request.refusal_shape");
      if (got.status < 400) return "";
      const parsed = parsedAnswer();
      return parsed === null ? typeof got.body : JSON.stringify(shapeOf(parsed));
    },
  };

  // An organization asked of the service directly. Checked here: POST /api/organizations
  // answered a vendor 201 with the organization (its "id" among it), and an administrator
  // 401 {"permissions":[...]}; a blank registration 400 with one list per field
  // ({"legalName":[...],"contactEmail":["Please enter a valid email."],...}). A profile
  // change is PUT /api/organizations/:id {tag: "updateProfile", value: {...}}: 200 for the
  // owner or an administrator, 401 {"permissions":[...]} for anybody else (the
  // organization's own administrator included), and a field's refusal comes back nested,
  // 400 {"organization":{"tag":"updateProfile","value":{"legalName":[...]}}}. An archive is
  // DELETE /api/organizations/:id: 200, 401 as above, 404 {"notFound":[...]} for none. Read
  // back, an archived organization answers 404 ["Organization not found."] to everybody,
  // the administrator included.
  const ORG_REQUEST = "organization-request";
  let requestOrg = "";
  let registeredOrg = "";

  const ORG_FIELDS: [string, string[]][] = [
    ["legalName", ["legalName", "legal_name", "name", "organizationName"]],
    ["websiteUrl", ["websiteUrl", "website", "websiteAddress", "url"]],
    ["streetAddress1", ["streetAddress1", "streetAddress", "street", "street1", "addressLine1", "address1", "address"]],
    ["streetAddress2", ["streetAddress2", "street2", "addressLine2", "address2"]],
    ["city", ["city"]],
    ["region", ["region", "province", "state"]],
    ["mailCode", ["mailCode", "postalCode", "postal", "zip", "zipCode"]],
    ["country", ["country"]],
    ["contactName", ["contactName"]],
    ["contactTitle", ["contactTitle", "title"]],
    ["contactEmail", ["contactEmail", "email", "emailAddress"]],
    ["contactPhone", ["contactPhone", "phone", "phoneNumber"]],
  ];
  const ORG_IDENTIFIER_KEYS = ["orgId", "organizationId", "organization", "org", "id"];
  const ORG_GROUPS = ["profile", "registration", "fields", "values", "address"];

  // The profile fields the input carries, each sent only when given (a value left out stays
  // out, so the service answers for it); a key no field answers to is named, not dropped.
  function organizationFields(where: string, input: unknown): Record<string, unknown> {
    const sent: Record<string, unknown> = {};
    if (!input || typeof input !== "object" || Array.isArray(input)) return sent;
    const known = new Set(
      [...ORG_FIELDS.flatMap(([, names]) => names), ...ORG_IDENTIFIER_KEYS, ...ORG_GROUPS].map(squash),
    );
    for (const key of Object.keys(input as Record<string, unknown>)) {
      if (!known.has(squash(key))) nothing(`${where} — the input's "${key}" names no field of an organization's profile`);
    }
    for (const [name, names] of ORG_FIELDS) {
      const value = given(input, names, ORG_GROUPS);
      if (value === undefined) continue;
      sent[name] =
        value && typeof value === "object" && !Array.isArray(value) ? givenText(value, names) : value;
    }
    return sent;
  }

  function requestOrganizationId(input: unknown): string {
    const named = given(input, ORG_IDENTIFIER_KEYS);
    return seededId(named, "organizations") || requestOrg;
  }

  // The name each refusal is filed under: "permissions", "notFound", or a field's name,
  // looked for inside the {tag, value} a profile change's refusal comes wrapped in.
  function refusalNames(body: unknown): string[] {
    if (!body || typeof body !== "object" || Array.isArray(body)) return [];
    const record = body as Record<string, unknown>;
    if (typeof record.tag === "string" && "value" in record) return refusalNames(record.value);
    return Object.entries(record).flatMap(([key, value]) => {
      const inner = value && typeof value === "object" && !Array.isArray(value) ? refusalNames(value) : [];
      return inner.length ? inner : [key];
    });
  }

  async function storedOrganization(where: string): Promise<Record<string, unknown> | null | "gone"> {
    const id = requestOrg || registeredOrg;
    if (!id) nothing(`${where} — no organization was opened, named or registered`);
    const found = await peek(`${baseURL}/api/organizations/${encodeURIComponent(id)}`);
    if (found.status === 200 && found.json && typeof found.json === "object") {
      return found.json as Record<string, unknown>;
    }
    // This target hides an archived organization from every reader, so not found is how an
    // inactive one reads; one the signed-in person may not read shows nothing.
    return found.status === 404 ? "gone" : null;
  }

  const organizationRequest: PageOf<"organizationRequest"> = {
    open: async (params?: { orgId?: string }) => {
      requestOrg = seededId(params?.orgId, "organizations");
      registeredOrg = "";
      lastAnswer = null;
    },
    async registerByRequest(input?: unknown) {
      const where = `${ORG_REQUEST}.register_by_request`;
      const got = await send(where, "POST", `${baseURL}/api/organizations`, organizationFields(where, input));
      registeredOrg = got.status === 201 ? createdField(where, "id") : "";
    },
    async changeProfileByRequest(input?: unknown) {
      const where = `${ORG_REQUEST}.change_profile_by_request`;
      const id = requestOrganizationId(input);
      if (!id) nothing(`${where} — no organization was opened or named`);
      const changes = organizationFields(where, input);
      // The rest of the profile as it stands, where the signed-in person may read it, so a
      // change to one field is not refused for the fields it left alone.
      const current = await peek(`${baseURL}/api/organizations/${encodeURIComponent(id)}`);
      const held: Record<string, unknown> = {};
      if (current.status === 200 && current.json && typeof current.json === "object") {
        for (const [name] of ORG_FIELDS) {
          const value = (current.json as Record<string, unknown>)[name];
          if (value !== null && value !== undefined) held[name] = value;
        }
      }
      await send(where, "PUT", `${baseURL}/api/organizations/${encodeURIComponent(id)}`, {
        tag: "updateProfile",
        value: { ...held, ...changes },
      });
    },
    async archiveByRequest(input?: unknown) {
      const where = `${ORG_REQUEST}.archive_by_request`;
      const id = requestOrganizationId(input);
      if (!id) nothing(`${where} — no organization was opened or named`);
      await send(where, "DELETE", `${baseURL}/api/organizations/${encodeURIComponent(id)}`);
    },
    requestAccepted: async () => accepted(`${ORG_REQUEST}.request_accepted`),
    refusalStatus: async () => {
      const got = answer(`${ORG_REQUEST}.refusal_status`);
      return got.status >= 400 ? String(got.status) : "";
    },
    refusalReason: async () => {
      const got = answer(`${ORG_REQUEST}.refusal_reason`);
      return got.status >= 400 ? refusalNames(parsedAnswer()).join("\n") : "";
    },
    refusalMessages: async () =>
      (lastRefusal(`${ORG_REQUEST}.refusal_messages`) ?? []).map((entry) => entry.message).join("\n"),
    organizationIdentifier: async () => {
      const got = answer(`${ORG_REQUEST}.organization_identifier`);
      return got.status === 201 ? createdField(`${ORG_REQUEST}.organization_identifier`, "id") : "";
    },
    storedActive: async () => {
      const held = await storedOrganization(`${ORG_REQUEST}.stored_active`);
      if (held === "gone") return "false";
      if (!held) return "";
      return typeof held.active === "boolean" ? String(held.active) : "";
    },
    storedLegalName: async () => {
      const held = await storedOrganization(`${ORG_REQUEST}.stored_legal_name`);
      if (held === "gone" || !held) return "";
      return held.legalName === undefined || held.legalName === null ? "" : String(held.legalName);
    },
  };

  // One panel member's own scores for one proponent. The service keeps a sheet under the
  // proposal and the member; the first save creates it (POST, as the score sheet's "Save
  // Draft" does, with {status: "DRAFT", scores: [{order, score, notes}]}) and every later
  // one changes it (PUT {tag: "edit", value: {scores}}). Asked to submit one sheet by
  // itself (PUT {tag: "submit"}), this target answers 400 {"evaluation":{"tag":"parseFailure"}}
  // whatever the value — tried with none, "", null, {}, [], true, 1 and a note.
  // The scores a test hands over, in whichever shape: a list of them, a list under "scores",
  // "questions", "answers" or "evaluations", a map from question to score, one question's
  // { score, notes } on its own, or scores and notes as two lists side by side.
  function scoresFrom(input: unknown): { order: number; score: unknown; notes: unknown }[] {
    const record = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
    const listKeys = ["scores", "questions", "answers", "evaluations", "entries", "items"];
    let listed: unknown[] | null = Array.isArray(input) ? input : null;
    for (const key of listKeys) if (!listed && Array.isArray(record[key])) listed = record[key] as unknown[];
    if (!listed) {
      for (const key of listKeys) {
        const map = record[key];
        if (map && typeof map === "object" && !Array.isArray(map)) {
          listed = Object.entries(map as Record<string, unknown>)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([, value]) => value);
          break;
        }
      }
    }
    const notes = Array.isArray(record.notes) ? record.notes : null;
    if (!listed && (record.score !== undefined || record.notes !== undefined || record.note !== undefined)) {
      listed = [record];
    }
    if (!listed && notes) listed = notes.map(() => "");
    if (!listed) return [];
    return listed.map((each, i) => {
      if (each && typeof each === "object") {
        const one = each as Record<string, unknown>;
        const order = Number(one.order ?? (one.question !== undefined ? Number(one.question) - 1 : i));
        return { order, score: one.score ?? one.value, notes: one.notes ?? one.note ?? notes?.[i] ?? "" };
      }
      return { order: i, score: each, notes: notes?.[i] ?? "" };
    });
  }

  function evaluationRequest(where: string, route: string) {
    let opened = "";
    let lastWasSubmission = false;
    const stored = async (what: string): Promise<Record<string, unknown> | null> => {
      if (!opened) nothing(`${where}.${what} — no evaluation has been opened`);
      const found = await peek(opened);
      return found.status === 200 && found.json && typeof found.json === "object"
        ? (found.json as Record<string, unknown>)
        : null;
    };
    const storedScores = async (what: string): Promise<Record<string, unknown>[]> => {
      const scores = (await stored(what))?.scores;
      return Array.isArray(scores) ? (scores as Record<string, unknown>[]) : [];
    };
    return {
      open: async (params?: Record<string, string>) => {
        opened = address(route, params);
        lastWasSubmission = false;
        await send(`${where}.open`, "GET", opened);
      },
      saveDraftAsEntered: async (input?: unknown) => {
        const what = `${where}.save_draft_as_entered`;
        if (!opened) nothing(`${what} — no evaluation has been opened`);
        const scores = scoresFrom(input);
        if (!scores.length) nothing(`${what} — the input carries no scores to send`);
        lastWasSubmission = false;
        if ((await peek(opened)).status === 200) {
          await send(what, "PUT", opened, { tag: "edit", value: { scores } });
        } else {
          await send(what, "POST", opened.replace(/\/[^/]+$/, ""), { status: "DRAFT", scores });
        }
      },
      submitThisEvaluationAlone: async () => {
        const what = `${where}.submit_this_evaluation_alone`;
        if (!opened) nothing(`${what} — no evaluation has been opened`);
        lastWasSubmission = true;
        await send(what, "PUT", opened, { tag: "submit", value: "" });
      },
      // Starts the signed-in evaluator's own sheet: POST to the proponent's collection of
      // evaluations with what the score sheet's create sends. The evaluator comes from the
      // session, so the :userId opened is not part of the request. On this target, signed in
      // as users.staffOne on the seeded proponent already evaluated, the answer was 409
      // {"conflict":["You already have a team question evaluation for this proposal."]}
      // ("resource question" for Team With Us).
      createEvaluationByRequest: async (input?: unknown) => {
        const what = `${where}.create_evaluation_by_request`;
        if (!opened) nothing(`${what} — no evaluation has been opened`);
        const scores = scoresFrom(input);
        if (!scores.length) nothing(`${what} — the input carries no scores to send`);
        lastWasSubmission = false;
        const proposal = opened.match(/\/proposal\/[^/]+\/([^/]+)\//)?.[1] ?? "";
        await send(what, "POST", opened.replace(/\/[^/]+$/, ""), { proposal, status: "DRAFT", scores });
      },
      // The evaluation the service answered a start with, or nothing when it refused.
      evaluationCreated: async () => {
        const got = answer(`${where}.evaluation_created`);
        return got.status < 300 ? got.body : "";
      },
      // The reasons a refused start was answered with, as text; nothing when it went through.
      creationRefusalMessage: async () => {
        const got = answer(`${where}.creation_refusal_message`);
        if (got.status < 400) return "";
        const parsed = parsedAnswer();
        const texts: string[] = [];
        const walk = (value: unknown): void => {
          if (typeof value === "string") texts.push(value);
          else if (Array.isArray(value)) value.forEach(walk);
          else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(walk);
        };
        walk(parsed);
        return texts.length ? texts.join("\n") : got.body;
      },
      // One line per question, in the sheet's order, as "<order>: <score>".
      storedScores: async () =>
        (await storedScores("stored_scores")).map((each) => `${each.order}: ${each.score ?? ""}`).join("\n"),
      storedNotes: async () =>
        (await storedScores("stored_notes")).map((each) => `${each.order}: ${each.notes ?? ""}`).join("\n"),
      evaluationStatus: async () => String((await stored("evaluation_status"))?.status ?? ""),
      // A request the service could not make sense of: this target names it "parseFailure".
      refusedAsUnrecognised: async () =>
        refusal((status) => status >= 400, /parseFailure|unrecogni[sz]ed|not a valid|unknown/i),
      refusedAtSubmission: async () => (lastWasSubmission ? refusal((status) => status >= 400) : ""),
    };
  }

  const evaluationIndividualRequestSwu: PageOf<"evaluationIndividualRequestSwu"> = evaluationRequest(
    "evaluation-individual-request-swu",
    "/api/proposal/sprint-with-us/:proposalId/team-questions/evaluations/:userId",
  );
  const evaluationIndividualRequestTwu: PageOf<"evaluationIndividualRequestTwu"> = evaluationRequest(
    "evaluation-individual-request-twu",
    "/api/proposal/team-with-us/:proposalId/resource-questions/evaluations/:userId",
  );

  // The chair's consensus for one proponent, kept under the proposal and the chair. Its
  // edit screen's save is PUT {tag: "edit", value: {scores: [{order, score, notes}]}},
  // answered 200 with the consensus as stored. On this target, on the seeded consensus of
  // opportunities.swuConsensusAllAgreed (and its Team With Us twin), the administrator's
  // change was answered 200; the same change signed in through /auth/createsessiongov, and
  // the administrator's change on swuPastConsensus, were both answered 401
  // {"permissions":["You do not have permission to perform this action."]}, and that
  // session's read 401 too.
  function consensusRequest(where: string, route: string) {
    let opened = "";
    const stored = async (what: string): Promise<Record<string, unknown>[]> => {
      if (!opened) nothing(`${where}.${what} — no consensus has been opened`);
      const found = await peek(opened);
      const scores =
        found.status === 200 && found.json && typeof found.json === "object"
          ? (found.json as Record<string, unknown>).scores
          : null;
      return Array.isArray(scores) ? (scores as Record<string, unknown>[]) : [];
    };
    return {
      open: async (params?: Record<string, string>) => {
        opened = address(route, params);
        await send(`${where}.open`, "GET", opened);
      },
      changeConsensusByRequest: async (input?: unknown) => {
        const what = `${where}.change_consensus_by_request`;
        if (!opened) nothing(`${what} — no consensus has been opened`);
        const scores = scoresFrom(input);
        if (!scores.length) nothing(`${what} — the input carries no scores to send`);
        await send(what, "PUT", opened, { tag: "edit", value: { scores } });
      },
      // One line per question, in the consensus's order, as "<order>: <score>".
      storedScores: async () =>
        (await stored("stored_scores")).map((each) => `${each.order}: ${each.score ?? ""}`).join("\n"),
      storedNotes: async () =>
        (await stored("stored_notes")).map((each) => `${each.order}: ${each.notes ?? ""}`).join("\n"),
      consensusStatus: async () => {
        if (!opened) nothing(`${where}.consensus_status — no consensus has been opened`);
        const found = await peek(opened);
        return found.status === 200 && found.json && typeof found.json === "object"
          ? String((found.json as Record<string, unknown>).status ?? "")
          : "";
      },
      requestAccepted: async () => accepted(`${where}.request_accepted`),
      refusedWhenNotPermitted: async () =>
        refusal((status) => status === 401 || status === 403 || status === 404),
    };
  }

  const evaluationConsensusRequestSwu: PageOf<"evaluationConsensusRequestSwu"> = consensusRequest(
    "evaluation-consensus-request-swu",
    "/api/proposal/sprint-with-us/:proposalId/team-questions/consensus/:userId",
  );
  const evaluationConsensusRequestTwu: PageOf<"evaluationConsensusRequestTwu"> = consensusRequest(
    "evaluation-consensus-request-twu",
    "/api/proposal/team-with-us/:proposalId/resource-questions/consensus/:userId",
  );

  // The panel is sent as the opportunity's "editEvaluationPanel" change, every member as
  // {user, chair, evaluator, order}: the members it has now, and the one the test names
  // holding neither role. On this target, as an administrator on the seeded closed Sprint
  // With Us opportunity, the panel as it stands is taken and such a panel is answered
  // 503 {"database":["Database error."]}.
  let openedPanel = "";
  let lastPanelSent = "";

  // Every member an input names: a list of them, a list under a key such as "members", or
  // one member per field.
  function namesIn(input: unknown): string[] {
    if (input === undefined || input === null) return [];
    if (typeof input === "string") return input.split(/\s*,\s*/).filter(Boolean);
    if (typeof input === "number") return [String(input)];
    if (Array.isArray(input)) return input.flatMap((each) => namesIn(each));
    const record = input as Record<string, unknown>;
    for (const key of ["members", "users", "evaluators", "panel"]) {
      if (record[key] !== undefined) return namesIn(record[key]);
    }
    const single = field(record, "user", "userId", "member", "handle", "email", "id");
    if (single) return [single];
    return Object.values(record).flatMap((each) => namesIn(each));
  }

  function panelNow(record: unknown): { user: string; chair: boolean; evaluator: boolean; order: number }[] {
    const panel = (record as Record<string, unknown> | null)?.evaluationPanel;
    if (!Array.isArray(panel)) return [];
    return panel.map((each, i) => {
      const member = each as Record<string, unknown>;
      const user = member.user as Record<string, unknown> | string | undefined;
      return {
        user: typeof user === "string" ? user : String(user?.id ?? ""),
        chair: member.chair === true,
        evaluator: member.evaluator === true,
        order: Number(member.order ?? i),
      };
    });
  }

  const evaluationPanelRequest: Open<PageOf<"evaluationPanelRequest">> = {
    open: async (params) => {
      openedPanel = address("/api/opportunities/:program/:opportunityId", params);
      await send("evaluation-panel-request.open", "GET", openedPanel);
    },
    async submitPanelWithMemberHoldingNoRole(input) {
      const where = "evaluation-panel-request.submit_panel_with_member_holding_no_role";
      if (!openedPanel) nothing(`${where} — no opportunity has been opened`);
      // The member may be named by handle, identifier or address, or handed over whole as a
      // seeded user ({ member: { id, email, ... } }).
      const record =
        input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
      const who = record.member ?? record.user ?? record.userId ?? record.person ?? record.email ?? input;
      const user = userIdOf(who);
      if (!user) {
        nothing(`${where} — ${JSON.stringify(who)} is not a seeded account, an identifier or an address the seed knows`);
      }
      const members = panelNow((await peek(openedPanel)).json).filter((member) => member.user !== user);
      members.push({ user, chair: false, evaluator: false, order: members.length });
      await send(where, "PUT", openedPanel, { tag: "editEvaluationPanel", value: members });
    },
    // Two or more public sector members, every one an evaluator and none the chair, sent as
    // the whole panel. On this target, as an administrator on the seeded closed Sprint With
    // Us opportunity, the service took such a panel (200) and stored it without a chair.
    async submitPanelWithNoChair(input?: unknown) {
      const where = "evaluation-panel-request.submit_panel_with_no_chair";
      if (!openedPanel) nothing(`${where} — no opportunity has been opened`);
      const named = namesIn(input);
      if (!named.length) nothing(`${where} — the input names no members`);
      const members = named.map((each, order) => {
        const user = userIdFor(each);
        if (!user) nothing(`${where} — "${each}" is not a seeded account, an identifier or an address the seed knows`);
        return { user, chair: false, evaluator: true, order };
      });
      lastPanelSent = "no-chair";
      await send(where, "PUT", openedPanel, { tag: "editEvaluationPanel", value: members });
    },
    memberWithoutRoleError: async () => refusal((status) => status >= 400),
    // The refusal of the chairless panel just sent; the service accepting it reads as nothing.
    missingChairError: async () => {
      if (lastPanelSent !== "no-chair") {
        nothing("evaluation-panel-request.missing_chair_error — no panel without a chair has been sent");
      }
      return refusal((status) => status >= 400);
    },
    // One member per line as the service now holds the panel.
    panelAsStored: async () => {
      if (!openedPanel) nothing("evaluation-panel-request.panel_as_stored — no opportunity has been opened");
      const stored = ((await peek(openedPanel)).json as Record<string, unknown> | null)?.evaluationPanel;
      const panel = Array.isArray(stored) ? (stored as Record<string, unknown>[]) : [];
      return panel
        .map((member) => {
          const user = (member.user ?? {}) as Record<string, unknown>;
          return `${user.name ?? user.id ?? ""} <${user.email ?? ""}> chair: ${member.chair === true} evaluator: ${member.evaluator === true}`;
        })
        .join("\n");
    },
  };

  // An opportunity or proposal saved as it stands with one more stored file among its
  // attachments: the record as the service answers it, each nested record it names (its
  // author, its organization, its opportunity) given as that record's identifier, sent back
  // as the "edit" change. Checked on a Code With Us opportunity as an administrator and on a
  // vendor's own draft Code With Us proposal, both of which the service took.
  let openedRecord = "";

  function editValue(record: Record<string, unknown>, fileId: string): Record<string, unknown> {
    const value: Record<string, unknown> = { ...record };
    for (const [key, inner] of Object.entries(value)) {
      if (inner && typeof inner === "object" && !Array.isArray(inner) && "id" in (inner as object)) {
        value[key] = (inner as Record<string, unknown>).id;
      }
    }
    const attached = Array.isArray(record.attachments) ? (record.attachments as unknown[]) : [];
    value.attachments = [
      ...attached.map((each) => (each && typeof each === "object" ? (each as Record<string, unknown>).id : each)),
      fileId,
    ];
    return value;
  }

  const fileAttachByIdentifier: PageOf<"fileAttachByIdentifier"> = {
    open: async (params) => {
      openedRecord = address("/api/:recordKind/:program/:recordId", params);
      await send("file-attach-by-identifier.open", "GET", openedRecord);
    },
    async attachStoredFile(input) {
      const where = "file-attach-by-identifier.attach_stored_file";
      if (!openedRecord) nothing(`${where} — no opportunity or proposal has been opened`);
      const named = field(input, "fileId", "file_id", "id", "file", "identifier", "address") || asText(input);
      if (!named) nothing(`${where} — the input names no stored file`);
      const current = await peek(openedRecord);
      const readable =
        current.status === 200 && !!current.json && typeof current.json === "object" && !Array.isArray(current.json);
      // When this person cannot read the record there is nothing to save it from, so the
      // attach is still sent, carrying only the attachment; the service's answer to that
      // change is what attachment_accepted and attachment_refused read.
      await send(where, "PUT", openedRecord, {
        tag: "edit",
        value: readable
          ? editValue(current.json as Record<string, unknown>, fileIdFor(named))
          : { attachments: [fileIdFor(named)] },
      });
    },
    attachmentAccepted: async () => accepted("file-attach-by-identifier.attachment_accepted"),
    attachmentRefused: async () => refusal((status) => status >= 400),
    // The identifiers of the files the record holds now, one per line.
    attachedFileIdentifiers: async () => {
      if (!openedRecord) nothing("file-attach-by-identifier.attached_file_identifiers — no record has been opened");
      const held = ((await peek(openedRecord)).json as Record<string, unknown> | null)?.attachments;
      const attached = Array.isArray(held) ? (held as unknown[]) : [];
      return attached
        .map((each) => (each && typeof each === "object" ? String((each as Record<string, unknown>).id ?? "") : String(each)))
        .join("\n");
    },
  };

  // ---------------------------------------------------------------- proposals by request

  // A value an input carries under any of several names, however the test spells them
  // ("proposalText", "proposal_text", "Proposal text"), looked for at the top of the input and
  // then inside a group it names ({ individual: { city } }, { proponent: { ... } }).
  function given(input: unknown, names: string[], within: string[] = []): unknown {
    if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
    const record = input as Record<string, unknown>;
    const wanted = names.map(squash);
    for (const [key, value] of Object.entries(record)) {
      if (wanted.includes(squash(key)) && value !== undefined) return value;
    }
    for (const group of within) {
      for (const [key, value] of Object.entries(record)) {
        if (squash(key) !== squash(group) || !value || typeof value !== "object" || Array.isArray(value)) continue;
        const inner = given(value, names);
        if (inner !== undefined) return inner;
      }
    }
    return undefined;
  }

  // Text exactly as given: a value left out is sent blank, never made up.
  function givenText(input: unknown, names: string[], within: string[] = []): string {
    const value = given(input, names, within);
    if (value === undefined || value === null) return "";
    // A group under one of the names ({ address: { street, city } }) holds the value inside it.
    if (typeof value === "object" && !Array.isArray(value)) return givenText(value, names);
    return Array.isArray(value) ? asText(value) : String(value);
  }

  // A seeded record named by its handle ("qualified", "organizations.qualified"), by its
  // identifier, or handed over whole ({ id }), as its identifier.
  function seededId(value: unknown, ...groups: string[]): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      if (typeof record.id === "string" && record.id) return record.id;
      return "";
    }
    const named = String(value).trim();
    const table = seed as unknown as Record<string, Record<string, { id?: unknown }> | undefined>;
    for (const group of groups) {
      const handle = named.startsWith(`${group}.`) ? named.slice(group.length + 1) : named;
      const found = table[group]?.[handle];
      if (found && typeof found === "object" && found.id !== undefined) return String(found.id);
    }
    return named;
  }

  function opportunityGiven(where: string, input: unknown): string {
    const id = seededId(
      given(input, ["opportunity", "opportunityId", "opportunityIdentifier", "opportunity_id"]),
      "opportunities",
    );
    if (!id) throw new Error(`${where} — the input names no opportunity (${JSON.stringify(input)})`);
    return id;
  }

  // The organization under its own name, else inside a proponent group, else the proponent
  // itself given as an organization.
  function organizationGiven(input: unknown): string {
    const names = ["organization", "organizationId", "organizationIdentifier", "organization_id", "org"];
    return seededId(
      given(input, names, ["proponent"]) ?? given(input, ["proponent"]),
      "organizations",
      "unassigned_identifiers",
    );
  }

  // A person named by seed handle ("users.teamCandidatePending"), persona, address or
  // identifier, or handed over whole, as their identifier; a name the seed does not know is
  // sent as given, for the service to answer.
  function memberId(value: unknown): string {
    if (typeof value === "string") {
      const handle = value.replace(/^users\./, "");
      return userIdFor(handle) || value;
    }
    return userIdOf(value);
  }

  // The service's refusal, one entry per message with where it is reported, in the order the
  // service gives them. A refusal body is a record of fields, each holding its messages, or a
  // record or list of further fields: a proponent's own fields sit under "proponent" as its
  // "value", a team member's under their position in "team", a phase's under its name.
  type Refused = { where: string; message: string };

  const REQUEST_FIELD_NAMES: Record<string, string> = {
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
    organization: "organization",
    opportunity: "opportunity",
    // A Sprint With Us phase is named as the phases are named everywhere else ("Inception"),
    // with the part of it a message concerns after it ("Inception phase: This opportunity
    // does not require this phase.", "Inception members: ...").
    inceptionphase: "Inception",
    prototypephase: "Prototype",
    implementationphase: "Implementation",
    teamquestionresponses: "team question responses",
    resourcequestionresponses: "resource question responses",
    hourlyrate: "hourly rate",
    scrummaster: "scrum master",
    proposedcost: "proposed cost",
  };

  function fieldNameOf(key: string): string {
    return REQUEST_FIELD_NAMES[squash(key)] ?? key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  }

  function refusedEntries(body: unknown, path: string[] = [], out: Refused[] = []): Refused[] {
    if (typeof body === "string") {
      out.push({ where: path.join(" "), message: body });
      return out;
    }
    if (Array.isArray(body)) {
      const allText = body.every((each) => typeof each === "string");
      body.forEach((each, i) => refusedEntries(each, allText ? path : [...path, `#${i + 1}`], out));
      return out;
    }
    if (!body || typeof body !== "object") return out;
    const record = body as Record<string, unknown>;
    // A proponent given as { tag, value }: an organization's messages are the organization's,
    // an individual's are reported against each of the individual's own fields.
    if (typeof record.tag === "string" && "value" in record) {
      if (record.tag === "organization") return refusedEntries(record.value, ["organization"], out);
      return refusedEntries(record.value, [], out);
    }
    for (const [key, value] of Object.entries(record)) {
      if (key === "proposalId" || (typeof value !== "object" && !Array.isArray(value))) continue;
      const named = key === "errors" || key === "proponent" ? path : [...path, fieldNameOf(key)];
      refusedEntries(value, named, out);
    }
    return out;
  }

  function lastRefusal(what: string): Refused[] | null {
    const got = answer(what);
    if (got.status < 400) return null;
    let body: unknown;
    try {
      body = JSON.parse(got.body);
    } catch {
      return got.body.trim() ? [{ where: "", message: got.body.trim() }] : [];
    }
    return refusedEntries(body);
  }

  // The readers every proposal request shares: the proposal the service answered with, or the
  // refusal it gave. Asked before any request was made there is nothing to read.
  // The service answers a proposal it made with 201; a refusal carries no proposal.
  function createdField(what: string, key: string): string {
    const got = answer(what);
    if (got.status >= 300) return "";
    const value = answered()[key];
    return value === undefined || value === null ? "" : String(value);
  }

  function proposalRequestReaders(where: string) {
    return {
      requestAccepted: async () => accepted(`${where}.request_accepted`),
      proposalIdentifier: async () => createdField(`${where}.proposal_identifier`, "id"),
      proposalStatus: async () => createdField(`${where}.proposal_status`, "status"),
      refusalByField: async () =>
        (lastRefusal(`${where}.refusal_by_field`) ?? [])
          .map((entry) => (entry.where ? `${entry.where}: ${entry.message}` : entry.message))
          .join("\n"),
      refusalMessages: async () =>
        (lastRefusal(`${where}.refusal_messages`) ?? []).map((entry) => entry.message).join("\n"),
      refusalStatus: async () => {
        const got = answer(`${where}.refusal_status`);
        return got.status >= 400 ? String(got.status) : "";
      },
    };
  }

  // A Code With Us proposal sent straight to the service as the signed-in vendor, the way its
  // form sends one: { opportunity, proposalText, additionalComment, proponent: { tag, value },
  // attachments, status }. As a vendor on the seeded published opportunity, an organization the
  // vendor has no membership of was taken (201), and an organization identifier naming nothing
  // came back as a blank individual's refusal (400, "Legal Name must be between 1 and 100
  // characters long." and the rest, under proponent.value).
  const CWU_REQUEST = "proposal-cwu-request";

  async function sendCwuProposal(where: string, input: unknown, proponent: unknown): Promise<void> {
    await send(where, "POST", `${baseURL}/api/proposals/code-with-us`, {
      opportunity: opportunityGiven(where, input),
      proposalText: givenText(input, ["proposalText", "proposal", "text"]),
      additionalComment: givenText(input, ["additionalComments", "additionalComment", "comments", "comment"]),
      proponent,
      attachments: [],
      status: "SUBMITTED",
    });
  }

  const proposalCwuRequest: PageOf<"proposalCwuRequest"> = {
    // The request needs no screen; opening it only says which address it goes to.
    open: async () => undefined,
    async submitWithOrganizationProponent(input) {
      const where = `${CWU_REQUEST}.submit_with_organization_proponent`;
      const organization = organizationGiven(input);
      if (!organization) throw new Error(`${where} — the input names no organization (${JSON.stringify(input)})`);
      await sendCwuProposal(where, input, { tag: "organization", value: organization });
    },
    async submitWithIndividualProponent(input) {
      const where = `${CWU_REQUEST}.submit_with_individual_proponent`;
      const within = ["individual", "proponent", "details", "contact", "address"];
      const text = (...names: string[]): string => givenText(input, names, within);
      await sendCwuProposal(where, input, {
        tag: "individual",
        value: {
          legalName: text("legalName", "legal_name", "name"),
          email: text("email", "emailAddress", "email_address"),
          phone: text("phone", "phoneNumber", "phone_number"),
          street1: text("streetAddress", "street1", "street", "address", "addressLine1", "streetAddress1", "street_address"),
          street2: text("secondAddressLine", "street2", "addressLine2", "streetAddress2", "second_address_line"),
          city: text("city"),
          region: text("province", "region", "state", "provinceState"),
          mailCode: text("postalCode", "mailCode", "postal_code", "zip", "zipCode", "postal"),
          country: text("country"),
        },
      });
    },
    ...proposalRequestReaders(CWU_REQUEST),
  };

  // A Sprint With Us or Team With Us proposal sent straight to the service, the way their forms
  // send one. Team With Us: { opportunity, organization, team: [{ member, resource,
  // hourlyRate }], resourceQuestionResponses: [{ order, response }], attachments, status }.
  // Sprint With Us: { opportunity, organization, inceptionPhase?, prototypePhase?,
  // implementationPhase: { members: [{ member, scrumMaster }], proposedCost },
  // teamQuestionResponses, references, attachments, status }. Checked as the owner of Northern
  // Pines on a published opportunity of each programme: a pending, a former and an outside
  // member each came back 400 "User is not an active member of the organization." against
  // their place in the team; a Team With Us member named twice came back "Please select
  // unique team members."; a Sprint With Us phase naming one person twice came back 503
  // {"database":["Database error."]}.
  const TEAM_REQUEST = "proposal-team-request";
  let requestProgram = "";

  function listGiven(input: unknown, names: string[]): unknown[] {
    const value = given(input, names);
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  // Answers by order: a list of answers, or of { order, response }. A question the input does
  // not answer is answered here, so the request is refused, if at all, for what the test gave.
  function answersFor(input: unknown, questions: unknown): { order: number; response: string }[] {
    const asked = Array.isArray(questions) ? questions.length : 0;
    const answers = listGiven(input, [
      "answers", "responses", "questionAnswers", "resourceQuestionResponses", "teamQuestionResponses",
      "resourceQuestions", "teamQuestions", "answer",
    ]).map((each, i) => {
      if (each && typeof each === "object") {
        const record = each as Record<string, unknown>;
        const order = Number(record.order ?? record.index ?? i);
        return { order: Number.isFinite(order) ? order : i, response: givenText(record, ["response", "answer", "text"]) };
      }
      return { order: i, response: asText(each) };
    });
    for (let order = 0; order < asked; order++) {
      if (!answers.some((each) => each.order === order)) {
        answers.push({ order, response: "Answered by the acceptance adapter so the proposal is complete." });
      }
    }
    return answers.sort((a, b) => a.order - b.order);
  }

  async function teamProposalBody(where: string, program: string, input: unknown): Promise<Record<string, unknown>> {
    const opportunity = opportunityGiven(where, input);
    const organization = organizationGiven(input);
    const read = await peek(`${baseURL}/api/opportunities/${program}/${opportunity}`);
    const record =
      read.status === 200 && read.json && typeof read.json === "object" ? (read.json as Record<string, unknown>) : {};
    const body: Record<string, unknown> = { opportunity, organization, attachments: [], status: "SUBMITTED" };
    if (program === "team-with-us") {
      const resources = (Array.isArray(record.resources) ? record.resources : []) as Record<string, unknown>[];
      if (!resources.length) {
        throw new Error(`${where} — the opportunity ${opportunity} answered ${read.status} with no resources to name a team for`);
      }
      // Each resource by its service area as the opportunity lists it ("FULL_STACK_DEVELOPER" or
      // "Full Stack Developer"), by its position, or the first when none is given.
      const resourceFor = (value: unknown): string => {
        if (value === undefined || value === null || value === "") return String(resources[0].id);
        const wanted = squash(String(value));
        const byArea = resources.find((each) => squash(String(each.serviceArea ?? "")) === wanted);
        if (byArea) return String(byArea.id);
        const byId = resources.find((each) => String(each.id) === String(value));
        if (byId) return String(byId.id);
        const position = Number(value);
        if (Number.isInteger(position) && position >= 0 && position < resources.length) return String(resources[position].id);
        return String(value);
      };
      body.team = listGiven(input, ["team", "members", "teamMembers", "resources"]).map((each) => {
        const member = each && typeof each === "object" && !Array.isArray(each) ? (each as Record<string, unknown>) : { member: each };
        const rate = given(member, ["hourlyRate", "hourly_rate", "rate"]);
        return {
          member: memberId(given(member, ["member", "user", "person", "teamMember"]) ?? member),
          resource: resourceFor(given(member, ["resource", "serviceArea", "service_area", "area"])),
          hourlyRate: rate === undefined || rate === null || rate === "" ? 100 : Number(rate),
        };
      });
      body.resourceQuestionResponses = answersFor(input, record.resourceQuestions);
      return body;
    }
    // Sprint With Us: each phase the input names, else the members it gives as the
    // implementation's, the one phase every opportunity has.
    const phaseKeys: [string, RegExp][] = [
      ["inceptionPhase", /inception/i],
      ["prototypePhase", /prototype|proof/i],
      ["implementationPhase", /implementation/i],
    ];
    const phases = new Map<string, unknown>();
    const grouped = given(input, ["phases", "team"]);
    const source: [string, unknown][] = Array.isArray(grouped)
      ? grouped.map((each, i): [string, unknown] => [givenText(each, ["phase", "name"]) || String(i), each])
      : grouped && typeof grouped === "object"
        ? Object.entries(grouped as Record<string, unknown>)
        : Object.entries((input ?? {}) as Record<string, unknown>);
    for (const [key, value] of source) {
      const phase = phaseKeys.find(([, pattern]) => pattern.test(key));
      if (phase) phases.set(phase[0], value);
    }
    if (!phases.size) {
      const members = given(input, ["members", "teamMembers"]) ?? (Array.isArray(grouped) ? grouped : undefined);
      if (members !== undefined) phases.set("implementationPhase", { members, proposedCost: given(input, ["proposedCost", "cost"]) });
    }
    for (const [key, value] of phases) {
      const phase = Array.isArray(value) ? { members: value } : ((value ?? {}) as Record<string, unknown>);
      const listed = listGiven(phase, ["members", "team", "teamMembers"]);
      const members = listed.map((each) => {
        const member = each && typeof each === "object" && !Array.isArray(each) ? (each as Record<string, unknown>) : { member: each };
        const scrum = given(member, ["scrumMaster", "scrum_master", "isScrumMaster"]);
        return {
          member: memberId(given(member, ["member", "user", "person", "teamMember"]) ?? member),
          scrumMaster: scrum === undefined ? undefined : saysYes(scrum),
        };
      });
      // Nobody marked either way: the first named leads, as the form asks one person to.
      if (members.length && members.every((each) => each.scrumMaster === undefined)) members[0].scrumMaster = true;
      const cost = given(phase, ["proposedCost", "proposed_cost", "cost", "price"]);
      body[key] = {
        members: members.map((each) => ({ member: each.member, scrumMaster: each.scrumMaster === true })),
        proposedCost: cost === undefined || cost === null || cost === "" ? 1000 : Number(cost),
      };
    }
    body.teamQuestionResponses = answersFor(input, record.teamQuestions);
    // References the input leaves out are given here, as the form requires them; those it
    // gives are sent as given.
    const givenReferences = listGiven(input, ["references"]);
    const references: unknown[] = givenReferences.length
      ? givenReferences
      : [1, 2, 3].map((n) => ({
          name: `Reference ${n} (acceptance adapter)`,
          company: "Placeholder Ministry",
          phone: "250-555-0100",
          email: `reference.${n}@example.test`,
        }));
    body.references = references.map((each, order) => ({
      name: givenText(each, ["name"]),
      company: givenText(each, ["company", "organization"]),
      phone: givenText(each, ["phone", "phoneNumber"]),
      email: givenText(each, ["email", "emailAddress"]),
      order,
    }));
    return body;
  }

  const proposalTeamRequest: PageOf<"proposalTeamRequest"> = {
    open: async (params?: { program?: string }) => {
      requestProgram = String(params?.program ?? "");
    },
    async submitTeamProposal(input) {
      const where = `${TEAM_REQUEST}.submit_team_proposal`;
      const program = givenText(input, ["program", "programme"]) || requestProgram;
      if (program !== "sprint-with-us" && program !== "team-with-us") {
        throw new Error(`${where} — no programme was opened or given ("sprint-with-us" or "team-with-us"; given: "${program}")`);
      }
      const body = await teamProposalBody(where, program, input);
      await send(where, "POST", `${baseURL}/api/proposals/${program}`, body);
    },
    ...proposalRequestReaders(TEAM_REQUEST),
  };

  // A stage score sent as PUT /api/proposals/:program/:id with the tag the service registers
  // for it — scoreCodeChallenge and scoreTeamScenario on Sprint With Us, scoreChallenge on
  // Team With Us — and the score as its value. Checked as the administrator: the team scenario
  // score on seed.proposals.swuScreenedIntoScenarioEarly came back 401 {"permissions":["The
  // opportunity is not in the correct stage of evaluation to perform that action."]}; the same
  // score on a proposal not carried into the team scenario, and a challenge score on a Team
  // With Us proposal still at the questions, came back 401 with the general permission
  // message; a tag the service does not know came back 400 parseFailure.
  const EVALUATION_REQUEST = "proposal-evaluation-request";
  let evaluationTarget = { program: "", proposal: "" };

  function scoreGiven(input: unknown): number {
    const value =
      typeof input === "number" || typeof input === "string"
        ? input
        : given(input, ["score", "value", "points", "mark"]);
    const score = Number(value);
    if (value === undefined || value === null || value === "" || !Number.isFinite(score)) {
      throw new Error(`unbound: ${EVALUATION_REQUEST} — the input names no score to send (${JSON.stringify(input)})`);
    }
    return score;
  }

  async function sendStageScore(member: string, program: string, tag: string, input: unknown): Promise<void> {
    const where = `${EVALUATION_REQUEST}.${member}`;
    const opened = givenText(input, ["program", "programme"]) || evaluationTarget.program || program;
    if (opened !== program) {
      throw new Error(`unbound: ${where} — this score belongs to ${program}, but the request was opened for "${opened}"`);
    }
    const proposal =
      seededId(given(input, ["proposal", "proposalId", "proposalIdentifier"]), "proposals") || evaluationTarget.proposal;
    if (!proposal) nothing(`${where} — no proposal was opened or named to score`);
    await send(where, "PUT", `${baseURL}/api/proposals/${program}/${encodeURIComponent(proposal)}`, {
      tag,
      value: scoreGiven(input),
    });
  }

  const proposalEvaluationRequest: PageOf<"proposalEvaluationRequest"> = {
    open: async (params?: { program?: string; proposalId?: string }) => {
      evaluationTarget = {
        program: String(params?.program ?? ""),
        proposal: seededId(params?.proposalId, "proposals"),
      };
    },
    scoreTeamScenarioByRequest: (input?: unknown) =>
      sendStageScore("score_team_scenario_by_request", "sprint-with-us", "scoreTeamScenario", input),
    scoreCodeChallengeByRequest: (input?: unknown) =>
      sendStageScore("score_code_challenge_by_request", "sprint-with-us", "scoreCodeChallenge", input),
    scoreChallengeByRequest: (input?: unknown) =>
      sendStageScore("score_challenge_by_request", "team-with-us", "scoreChallenge", input),
    requestAccepted: async () => accepted(`${EVALUATION_REQUEST}.request_accepted`),
    proposalStatus: async () => createdField(`${EVALUATION_REQUEST}.proposal_status`, "status"),
    refusalMessages: async () =>
      (lastRefusal(`${EVALUATION_REQUEST}.refusal_messages`) ?? []).map((entry) => entry.message).join("\n"),
    refusalStatus: async () => {
      const got = answer(`${EVALUATION_REQUEST}.refusal_status`);
      return got.status >= 400 ? String(got.status) : "";
    },
  };

  // An account record, asked afresh each time it is read so it shows what the service holds
  // now, and kept apart from the answers the other request surfaces read. GET
  // /api/sessions/current answers { ..., user: { id, notificationsOn, ... } } for somebody
  // signed in and "null" for nobody; GET /api/users/:id answers the account itself to the
  // person and to an administrator, and 401 ["You do not have permission to perform this
  // action."] to anybody else, signed out included (all seen on this target).
  async function accountAnswer(where: string, target: string): Promise<{ status: number; body: string; json: unknown }> {
    const response = await page.request.get(target).catch((error: unknown) => {
      throw new Error(`unbound: ${where} — GET ${target} could not be made (${String(error)})`);
    });
    const body = await response.text().catch(() => "");
    let json: unknown = null;
    try {
      json = JSON.parse(body);
    } catch {
      json = null;
    }
    return { status: response.status(), body, json };
  }

  function accountField(json: unknown, key: string): string {
    if (!json || typeof json !== "object" || Array.isArray(json)) return "";
    const value = (json as Record<string, unknown>)[key];
    return value === undefined || value === null ? "" : String(value);
  }

  const SELF_REQUEST = "user-account-self-request";

  async function ownAccount(what: string): Promise<unknown> {
    const got = await accountAnswer(`${SELF_REQUEST}.${what}`, `${baseURL}/api/sessions/current`);
    if (got.status !== 200 || !got.json || typeof got.json !== "object") return null;
    return (got.json as Record<string, unknown>).user ?? null;
  }

  const userAccountSelfRequest: PageOf<"userAccountSelfRequest"> = {
    open: async () => {
      await ownAccount("open");
    },
    userIdentifier: async () => accountField(await ownAccount("user_identifier"), "id"),
    // "notificationsOn" holds the moment notices were turned on, and null while they are off.
    newOpportunityNoticesSince: async () =>
      accountField(await ownAccount("new_opportunity_notices_since"), "notificationsOn"),
  };

  const ACCOUNT_REQUEST = "user-account-request";
  let accountAsked = "";

  async function namedAccount(what: string): Promise<{ status: number; body: string; json: unknown }> {
    if (!accountAsked) nothing(`${ACCOUNT_REQUEST}.${what} — no account was opened to ask for`);
    return accountAnswer(`${ACCOUNT_REQUEST}.${what}`, `${baseURL}/api/users/${encodeURIComponent(accountAsked)}`);
  }

  const userAccountRequest: PageOf<"userAccountRequest"> = {
    open: async (params?: { userId?: string }) => {
      const named = String(params?.userId ?? "").replace(/^users\./, "");
      accountAsked = named ? userIdFor(named) || named : "";
      if (!accountAsked) nothing(`${ACCOUNT_REQUEST}.open — no account was named`);
      await namedAccount("open");
    },
    newOpportunityNoticesSince: async () => {
      const got = await namedAccount("new_opportunity_notices_since");
      return got.status === 200 ? accountField(got.json, "notificationsOn") : "";
    },
    refusedWhenNotPermitted: async () => {
      const got = await namedAccount("refused_when_not_permitted");
      return got.status === 401 || got.status === 403 ? `${got.status} ${got.body}` : "";
    },
    refusalStatus: async () => {
      const got = await namedAccount("refusal_status");
      return got.status >= 400 ? String(got.status) : "";
    },
  };

  // An opportunity's view count, asked afresh each time it is read so a test polling for a
  // change sees what the service holds now. Checked here on seed.opportunities
  // .publishedCodeWithUs: GET /api/counters?counters=opportunity.code-with-us.<id>.views
  // answered 200 {} as the administrator before the public page was opened, and 200
  // {"opportunity.code-with-us.<id>.views":1} once it had been; public sector staff read the
  // same; a vendor was answered 401 ["You do not have permission to perform this action."].
  const COUNTERS = "opportunity-counters";
  let counterName = "";

  async function counterAnswer(what: string): Promise<{ status: number; body: string; json: unknown }> {
    if (!counterName) nothing(`${COUNTERS}.${what} — no opportunity was opened to count`);
    return accountAnswer(`${COUNTERS}.${what}`, `${baseURL}/api/counters?counters=${encodeURIComponent(counterName)}`);
  }

  const opportunityCounters: PageOf<"opportunityCounters"> = {
    open: async (params?: { program?: string; opportunityId?: string }) => {
      const opportunity = seededId(params?.opportunityId ?? "", "opportunities");
      const fromSeed = Object.values(seed.opportunities as unknown as Record<string, { id?: unknown; program?: unknown }>).find(
        (each) => each && String(each.id) === opportunity,
      )?.program;
      const program = String(params?.program ?? "") || (typeof fromSeed === "string" ? fromSeed : "");
      if (!opportunity) nothing(`${COUNTERS}.open — no opportunity was named`);
      if (!program) nothing(`${COUNTERS}.open — no programme was named for opportunity ${opportunity}`);
      counterName = `opportunity.${program}.${opportunity}.views`;
      await counterAnswer("open");
    },
    // A counter never incremented is left out of the answer, which reads as 0. A refused
    // request has no count to read, and reads as nothing.
    viewCount: async () => {
      const got = await counterAnswer("view_count");
      if (got.status !== 200 || !got.json || typeof got.json !== "object" || Array.isArray(got.json)) return "";
      const count = (got.json as Record<string, unknown>)[counterName];
      return count === undefined || count === null ? "0" : String(count);
    },
    refusedWhenNotPermitted: async () => {
      const got = await counterAnswer("refused_when_not_permitted");
      return got.status === 401 || got.status === 403 ? `${got.status} ${got.body}` : "";
    },
  };

  // An opportunity read and changed through the service's own update operation, PUT
  // /api/opportunities/<program>/<id> with { tag, value }. Checked here on
  // seed.opportunities.cwuWithPrivateNote: GET answered the administrator, and a request with
  // no session, the opportunity with "history" (newest first, each { type: { tag, value },
  // note, createdBy: { name }, createdAt, attachments: [{ name, id }] }); a signed-in vendor
  // was answered the opportunity with no "history" key at all. { tag: "addNote", value: {
  // note, attachments: [ids] } } with a 1,001-character note was refused 400 { opportunity:
  // { tag: "addNote", value: { note: ["Status Note must be between 0 and 1000 characters
  // long."] } } }, with an unknown attachment 400 { ... attachments: [["Invalid identifier
  // provided."]] }, and from a vendor 401 { permissions: ["You do not have permission to
  // perform this action."] }. publish asked of the awarded and cancelled seeds was refused
  // 401 with that same permission message; a tag the program does not offer (start the code
  // challenge, asked of Code With Us) 400 { opportunity: { tag: "parseFailure" } }.
  type OpportunityAt = { program: string; id: string };

  function opportunityAt(where: string, params?: { program?: string; opportunityId?: string }): OpportunityAt {
    const id = seededId(params?.opportunityId ?? "", "opportunities");
    if (!id) nothing(`${where} — no opportunity was named`);
    const fromSeed = Object.values(seed.opportunities as unknown as Record<string, { id?: unknown; program?: unknown }>).find(
      (each) => each && String(each.id) === id,
    )?.program;
    const program = String(params?.program ?? "") || (typeof fromSeed === "string" ? fromSeed : "");
    if (!program) nothing(`${where} — no programme was named for opportunity ${id}`);
    return { program, id };
  }

  const opportunityAddress = (at: OpportunityAt): string =>
    `${baseURL}/api/opportunities/${encodeURIComponent(at.program)}/${encodeURIComponent(at.id)}`;

  // The opportunity as the service holds it now, read on the side so the answer to the
  // latest change stays the one the refusal readers read.
  // A reader the service refuses the opportunity to (401, 403, 404) has reached it and been
  // shown nothing, which reads as an empty record; any other failure is not having got there.
  async function opportunityNow(where: string, at: OpportunityAt | null): Promise<Record<string, unknown>> {
    if (!at) nothing(`${where} — no opportunity was opened`);
    const got = await accountAnswer(where, opportunityAddress(at));
    if ([401, 403, 404].includes(got.status)) return {};
    if (got.status !== 200 || !got.json || typeof got.json !== "object" || Array.isArray(got.json)) {
      nothing(`${where} — ${opportunityAddress(at)} answered ${got.status}`);
    }
    return got.json as Record<string, unknown>;
  }

  // A refusal's messages, in the order the service gives them; one that names only a tag
  // (the service could not read the request as any change it offers) reads as that tag.
  function refusalTexts(what: string): string {
    const entries = lastRefusal(what);
    if (!entries) return "";
    const texts = entries.map((entry) => entry.message).filter(Boolean);
    if (texts.length) return texts.join("\n");
    const tags: string[] = [];
    const walk = (value: unknown): void => {
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") {
        for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
          if (key === "tag" && typeof inner === "string" && !("value" in (value as Record<string, unknown>))) tags.push(inner);
          else walk(inner);
        }
      }
    };
    try {
      walk(JSON.parse(answer(what).body));
    } catch {
      // nothing more to read
    }
    return tags.join("\n");
  }

  function refusalCode(what: string): string {
    const got = answer(what);
    return got.status >= 400 ? String(got.status) : "";
  }

  const HISTORY_REQUEST = "opportunity-history-request";
  let historyAt: OpportunityAt | null = null;

  const opportunityHistoryRequest: PageOf<"opportunityHistoryRequest"> = {
    open: async (params?: { program?: string; opportunityId?: string }) => {
      historyAt = opportunityAt(`${HISTORY_REQUEST}.open`, params);
      lastAnswer = null;
      await opportunityNow(`${HISTORY_REQUEST}.open`, historyAt);
    },
    addNoteByRequest: async (input?: unknown) => {
      const where = `${HISTORY_REQUEST}.add_note_by_request`;
      if (!historyAt) nothing(`${where} — no opportunity was opened`);
      const note = given(input, ["note", "text", "body", "message"]);
      if (note === undefined && typeof input !== "string") {
        nothing(`${where} — the input names no note text (${JSON.stringify(input)})`);
      }
      const files = given(input, ["attachments", "files", "fileIds", "storedFiles", "attachment", "file"]);
      const list = files === undefined || files === null ? [] : Array.isArray(files) ? files : [files];
      const attachments = list.map((each) =>
        each && typeof each === "object" ? String((each as Record<string, unknown>).id ?? "") : fileIdFor(String(each)),
      );
      await send(where, "PUT", opportunityAddress(historyAt), {
        tag: "addNote",
        value: { note: String(typeof input === "string" ? input : note ?? ""), attachments },
      });
    },
    historyShown: async () =>
      String("history" in (await opportunityNow(`${HISTORY_REQUEST}.history_shown`, historyAt))),
    historyEntries: async () => {
      const found = (await opportunityNow(`${HISTORY_REQUEST}.history_entries`, historyAt)).history;
      if (!Array.isArray(found)) return "";
      return found
        .map((entry: Record<string, unknown>) => {
          const type = (entry.type ?? {}) as Record<string, unknown>;
          const by = (entry.createdBy ?? {}) as Record<string, unknown>;
          const files = Array.isArray(entry.attachments)
            ? (entry.attachments as Record<string, unknown>[]).map((file) => `${String(file.name ?? "")} (${String(file.id ?? "")})`)
            : [];
          return [
            String(type.value ?? ""),
            String(entry.note ?? ""),
            String(by.name ?? ""),
            String(entry.createdAt ?? ""),
            files.join(", "),
          ].join(" | ");
        })
        .join("\n");
    },
    requestAccepted: async () => accepted(`${HISTORY_REQUEST}.request_accepted`),
    refusalMessages: async () => refusalTexts(`${HISTORY_REQUEST}.refusal_messages`),
    refusalStatus: async () => refusalCode(`${HISTORY_REQUEST}.refusal_status`),
  };

  // The service has no "set status" operation; each status is reached by its own tag.
  const STATUS_TAGS: Record<string, string> = {
    UNDER_REVIEW: "submitForReview",
    PUBLISHED: "publish",
    CANCELED: "cancel",
    CANCELLED: "cancel",
    EVAL_CC: "startCodeChallenge",
    EVAL_SCENARIO: "startTeamScenario",
    EVAL_C: "startChallenge",
  };

  const STATUS_REQUEST = "opportunity-status-request";
  let statusAt: OpportunityAt | null = null;

  const opportunityStatusRequest: PageOf<"opportunityStatusRequest"> = {
    open: async (params?: { program?: string; opportunityId?: string }) => {
      statusAt = opportunityAt(`${STATUS_REQUEST}.open`, params);
      lastAnswer = null;
      await opportunityNow(`${STATUS_REQUEST}.open`, statusAt);
    },
    requestStatusChange: async (input?: unknown) => {
      const where = `${STATUS_REQUEST}.request_status_change`;
      if (!statusAt) nothing(`${where} — no opportunity was opened`);
      const status = String(typeof input === "string" ? input : given(input, ["status", "to"]) ?? "")
        .trim()
        .toUpperCase();
      const tag = STATUS_TAGS[status];
      if (!tag) nothing(`${where} — the service has no operation that leads to status "${status}"`);
      // A cancellation carries its reason; the other changes carry an (optional) note.
      const note = given(input, ["note", "reason"]);
      const value = note !== undefined ? String(note) : tag === "cancel" ? "Cancelled by request." : "";
      await send(where, "PUT", opportunityAddress(statusAt), { tag, value });
    },
    requestAccepted: async () => accepted(`${STATUS_REQUEST}.request_accepted`),
    refusalStatus: async () => refusalCode(`${STATUS_REQUEST}.refusal_status`),
    refusalMessages: async () => refusalTexts(`${STATUS_REQUEST}.refusal_messages`),
    storedStatus: async () =>
      String((await opportunityNow(`${STATUS_REQUEST}.stored_status`, statusAt)).status ?? ""),
  };

  // Bound first and returned after, so a page only the newer surface declares is not refused
  // as an unknown property when this compiles against an older one.
  const surface = {
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
    caughtMessage,
    caughtMessageList,
    mailDeliveryFault,
    mailDeliveryDelay,
    opportunityWatchRequest,
    organizationActingForList,
    affiliationInvitationRequest,
    affiliationApprovalRequest,
    affiliationRemovalRequest,
    userListRequest,
    contentRequest,
    evaluationIndividualRequestSwu,
    evaluationIndividualRequestTwu,
    evaluationConsensusRequestSwu,
    evaluationConsensusRequestTwu,
    evaluationPanelRequest,
    fileAttachByIdentifier,
    proposalCwuRequest,
    proposalTeamRequest,
    proposalEvaluationRequest,
    userAccountSelfRequest,
    userAccountRequest,
    opportunityCounters,
    opportunityHistoryRequest,
    opportunityStatusRequest,
    organizationRequest,
  };
  return surface;
}
