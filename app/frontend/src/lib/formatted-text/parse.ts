/**
 * Reading a page's body as formatted text.
 *
 * A body is stored as the marked-up text an administrator typed. This turns it into a tree
 * of headings, paragraphs, lists, links and images and nothing else: there is no node for
 * raw markup, so markup embedded in a body can only come out as text (R-7.17). The same
 * tree is rendered on a page's own address and wherever another screen embeds the body, so
 * the two never disagree.
 *
 * The parser is deliberately small. It reads the marks the body editor writes — headings,
 * bold, italic, code, lists, rules, links and images — and treats everything else as the
 * words it is.
 */

export type Inline =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "strong"; readonly children: readonly Inline[] }
  | { readonly kind: "emphasis"; readonly children: readonly Inline[] }
  | { readonly kind: "code"; readonly text: string }
  | {
      readonly kind: "link";
      readonly href: string;
      readonly children: readonly Inline[];
    }
  | { readonly kind: "image"; readonly src: string; readonly alt: string };

export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

export type Block =
  | {
      readonly kind: "heading";
      readonly level: HeadingLevel;
      readonly children: readonly Inline[];
    }
  | { readonly kind: "paragraph"; readonly children: readonly Inline[] }
  | {
      readonly kind: "list";
      readonly ordered: boolean;
      readonly items: readonly (readonly Inline[])[];
    }
  | { readonly kind: "code"; readonly text: string }
  | { readonly kind: "rule" };

const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^\s*```/;

/**
 * Where a link may lead.
 *
 * Anything with a scheme the service does not offer — `javascript:` above all — is not a
 * link at all: its text is shown and nothing is linked. Http, https and mailto addresses
 * and addresses within the service are kept as they are written.
 */
export function readHref(raw: string): string | null {
  const value = raw.trim();
  if (value === "") return null;
  if (/^(https?:|mailto:)/i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  if (value.startsWith("//")) return null;
  return value;
}

const INLINE =
  /!\[([^\]]*)\]\(([^)\s]*)\)|\[([^\]]+)\]\(([^)\s]*)\)|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|\*([\s\S]+?)\*|_([\s\S]+?)_|`([^`]+)`/;

export function parseInline(source: string): Inline[] {
  const nodes: Inline[] = [];
  let rest = source;

  while (rest.length > 0) {
    const match = INLINE.exec(rest);
    if (!match || match.index === undefined) {
      nodes.push({ kind: "text", text: rest });
      break;
    }
    if (match.index > 0) {
      nodes.push({ kind: "text", text: rest.slice(0, match.index) });
    }
    const [
      whole,
      imageAlt,
      imageSrc,
      linkText,
      linkHref,
      strongStars,
      strongUnderscores,
      emphasisStar,
      emphasisUnderscore,
      code,
    ] = match;

    if (imageSrc !== undefined) {
      const src = readHref(imageSrc);
      if (src) {
        nodes.push({ kind: "image", src, alt: imageAlt ?? "" });
      } else {
        nodes.push({ kind: "text", text: whole });
      }
    } else if (linkText !== undefined) {
      const href = readHref(linkHref ?? "");
      if (href) {
        nodes.push({ kind: "link", href, children: parseInline(linkText) });
      } else {
        // Not a link the service will follow, so it is only its words.
        nodes.push({ kind: "text", text: linkText });
      }
    } else if (strongStars !== undefined || strongUnderscores !== undefined) {
      nodes.push({
        kind: "strong",
        children: parseInline((strongStars ?? strongUnderscores) as string),
      });
    } else if (
      emphasisStar !== undefined ||
      emphasisUnderscore !== undefined
    ) {
      nodes.push({
        kind: "emphasis",
        children: parseInline(
          (emphasisStar ?? emphasisUnderscore) as string,
        ),
      });
    } else if (code !== undefined) {
      nodes.push({ kind: "code", text: code });
    }

    rest = rest.slice(match.index + whole.length);
  }

  return nodes;
}

/**
 * A body's own headings start at H2, under the page's H1, and go down one level at a time.
 *
 * The shallowest heading the body uses becomes H2, whether its author wrote `#` or `##`,
 * and everything below it keeps its distance from that one. An outline with no gaps in it is
 * what a screen reader's list of headings is read from.
 */
function withHeadingsUnderTheTitle(blocks: Block[]): Block[] {
  const levels = blocks
    .filter((block) => block.kind === "heading")
    .map((block) => (block as { level: number }).level);
  if (levels.length === 0) return blocks;
  const shallowest = Math.min(...levels);
  return blocks.map((block) =>
    block.kind === "heading"
      ? {
          ...block,
          level: Math.min(2 + (block.level - shallowest), 6) as HeadingLevel,
        }
      : block,
  );
}

export function parseFormattedText(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");

  let index = 0;
  let paragraph: string[] = [];

  const closeParagraph = (): void => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", children: parseInline(paragraph.join(" ")) });
    paragraph = [];
  };

  while (index < lines.length) {
    const line = lines[index] as string;

    if (line.trim() === "") {
      closeParagraph();
      index += 1;
      continue;
    }

    if (FENCE.test(line)) {
      closeParagraph();
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !FENCE.test(lines[index] as string)) {
        body.push(lines[index] as string);
        index += 1;
      }
      index += 1; // the closing fence, or the end of the body
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }

    if (RULE.test(line)) {
      closeParagraph();
      blocks.push({ kind: "rule" });
      index += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      closeParagraph();
      blocks.push({
        // Read as written here; the outline is settled once the whole body is read.
        kind: "heading",
        level: (heading[1] as string).length as HeadingLevel,
        children: parseInline((heading[2] ?? "").trim()),
      });
      index += 1;
      continue;
    }

    const isBullet = BULLET.test(line);
    const isNumbered = !isBullet && NUMBERED.test(line);
    if (isBullet || isNumbered) {
      closeParagraph();
      const pattern = isBullet ? BULLET : NUMBERED;
      const items: Inline[][] = [];
      while (index < lines.length) {
        const item = pattern.exec(lines[index] as string);
        if (!item) break;
        items.push(parseInline((item[1] ?? "").trim()));
        index += 1;
      }
      blocks.push({ kind: "list", ordered: isNumbered, items });
      continue;
    }

    paragraph.push(line.trim());
    index += 1;
  }

  closeParagraph();
  return withHeadingsUnderTheTitle(blocks);
}
