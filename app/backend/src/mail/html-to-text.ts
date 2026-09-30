/**
 * The plain-text form of a message, rendered from its formatted form (R-6.5).
 *
 * Nothing in the service writes plain-text copy of its own: every message is composed once,
 * as formatted text, and this turns that into the words and links a plain-text reader sees.
 * A link keeps its label and gains its address after it, so a reader whose mail program
 * shows no formatting can still follow it.
 *
 * It reads the small, well-formed set of elements the service's own layout writes
 * (`templates.ts`); it is not a general-purpose converter for markup from elsewhere.
 */
export function htmlToText(html: string): string {
  let text = html;

  // What is never read: the head, styles, scripts and comments.
  text = text.replace(/<head[\s\S]*?<\/head>/gi, "");
  text = text.replace(/<(style|script)[\s\S]*?<\/\1>/gi, "");
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // An image is its description.
  text = text.replace(/<img\b[^>]*>/gi, (tag) => {
    const alt = attribute(tag, "alt");
    return alt ? ` ${alt} ` : "";
  });

  // A link is its label followed by where it leads.
  text = text.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (_whole, attributes: string, label: string) => {
      const href = attribute(`<a ${attributes}>`, "href");
      const words = collapse(stripTags(label));
      if (!href) return words;
      const address = decodeEntities(href);
      if (!words || words === address) return address;
      return `${words} (${address})`;
    },
  );

  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<li\b[^>]*>/gi, "\n- ");
  text = text.replace(/<\/(p|div|h[1-6]|ul|ol|table|tr|section|header|footer)>/gi, "\n\n");
  text = text.replace(/<(p|div|h[1-6]|ul|ol|table|tr|section|header|footer)\b[^>]*>/gi, "\n\n");
  text = text.replace(/<\/(td|th)>/gi, " ");

  text = decodeEntities(stripTags(text));

  return text
    .split("\n")
    .map((line) => collapse(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

function collapse(value: string): string {
  return value.replace(/[ \t\r\f\v]+/g, " ").trim();
}

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag);
  if (!match) return null;
  return match[2] ?? match[3] ?? null;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    const known = ENTITIES[name.toLowerCase()];
    if (known !== undefined) return known;
    if (name.startsWith("#x") || name.startsWith("#X")) {
      return String.fromCodePoint(parseInt(name.slice(2), 16));
    }
    if (name.startsWith("#")) return String.fromCodePoint(parseInt(name.slice(1), 10));
    return whole;
  });
}
