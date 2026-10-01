/**
 * What the body editor's formatting buttons do to the text: each wraps the selection in the
 * marks the renderer reads, or inserts them at the cursor (design/DESIGN.md, content, "Body
 * editor"; R-7.26). The body is stored exactly as the result reads.
 *
 * Plain functions over a value and a selection, so what each button writes can be checked
 * without a browser.
 */

export interface TextEdit {
  readonly value: string;
  /** Where the selection should be once the edit is made. */
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

export type Formatting = "bold" | "italic" | "heading" | "bulleted" | "numbered" | "link";

export const FORMATTING_LABELS: Readonly<Record<Formatting, string>> = {
  bold: "Bold",
  italic: "Italic",
  heading: "Heading",
  bulleted: "Bulleted list",
  numbered: "Numbered list",
  link: "Link",
};

/** What stands in for the words when nothing is selected, selected so typing replaces it. */
const PLACEHOLDERS: Readonly<Record<"bold" | "italic" | "link", string>> = {
  bold: "bold text",
  italic: "italic text",
  link: "link text",
};

function clamp(value: string, start: number, end: number): [number, number] {
  const from = Math.max(0, Math.min(start, value.length));
  const to = Math.max(from, Math.min(end, value.length));
  return [from, to];
}

/** Replaces the selection with `inserted`, selecting `inserted.slice(selectFrom, selectTo)`. */
export function replaceSelection(
  value: string,
  start: number,
  end: number,
  inserted: string,
  selectFrom = inserted.length,
  selectTo = inserted.length,
): TextEdit {
  const [from, to] = clamp(value, start, end);
  return {
    value: value.slice(0, from) + inserted + value.slice(to),
    selectionStart: from + selectFrom,
    selectionEnd: from + selectTo,
  };
}

function wrap(value: string, start: number, end: number, mark: string, placeholder: string): TextEdit {
  const [from, to] = clamp(value, start, end);
  const words = value.slice(from, to) || placeholder;
  return replaceSelection(value, from, to, `${mark}${words}${mark}`, mark.length, mark.length + words.length);
}

/** Puts `prefix(n)` at the start of every line the selection touches. */
function prefixLines(value: string, start: number, end: number, prefix: (line: number) => string): TextEdit {
  const [from, to] = clamp(value, start, end);
  const lineStart = value.lastIndexOf("\n", from - 1) + 1;
  const nextBreak = value.indexOf("\n", to);
  const lineEnd = nextBreak < 0 ? value.length : nextBreak;
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const prefixed = lines.map((line, position) => `${prefix(position)}${line}`).join("\n");
  return {
    value: value.slice(0, lineStart) + prefixed + value.slice(lineEnd),
    selectionStart: lineStart + prefixed.length,
    selectionEnd: lineStart + prefixed.length,
  };
}

export function applyFormatting(value: string, start: number, end: number, formatting: Formatting): TextEdit {
  switch (formatting) {
    case "bold":
      return wrap(value, start, end, "**", PLACEHOLDERS.bold);
    case "italic":
      return wrap(value, start, end, "_", PLACEHOLDERS.italic);
    case "heading":
      return prefixLines(value, start, end, () => "## ");
    case "bulleted":
      return prefixLines(value, start, end, () => "- ");
    case "numbered":
      return prefixLines(value, start, end, (line) => `${line + 1}. `);
    case "link": {
      const [from, to] = clamp(value, start, end);
      const words = value.slice(from, to) || PLACEHOLDERS.link;
      const address = "https://";
      // The address is selected, so the author types it straight over the placeholder.
      const inserted = `[${words}](${address})`;
      return replaceSelection(value, from, to, inserted, words.length + 3, words.length + 3 + address.length);
    }
  }
}

/**
 * An image's reference placed at the cursor, on a line of its own so it renders as its own
 * block, with its alternative text selected so the author can type a description over it
 * (R-7.26, R-8.29).
 */
export function insertImageReference(
  value: string,
  start: number,
  end: number,
  reference: string,
  altText: string,
): TextEdit {
  const [from, to] = clamp(value, start, end);
  const before = value.slice(0, from);
  const after = value.slice(to);
  const lead = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail = after === "" || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const inserted = `${lead}${reference}${trail}`;
  const altAt = inserted.indexOf(altText);
  return replaceSelection(value, from, to, inserted, altAt, altAt + altText.length);
}
