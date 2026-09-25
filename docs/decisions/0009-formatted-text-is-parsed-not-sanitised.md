# 0009 · Formatted text is parsed into elements, not sanitised into markup

- Status: accepted for the build (slice 1)
- Date: 2026-09-20

## Decision

`app/frontend/src/lib/formatted-text/` is the application's one renderer of a page's body. It
reads the marked-up text an administrator typed and builds React elements from it directly:
headings, paragraphs, lists, links, images, code and rules. There is no node for raw markup,
and nothing anywhere writes HTML from a string.

So a body containing `<script>…</script>` or `<b>bold</b>` comes out as those words
(R-7.17), and the same body renders identically on the page's own address and wherever
another screen embeds it, because there is one renderer and it takes one input.

Three rules beyond the marks:

- A body's own headings start at H2, under the page's H1, so a page's outline holds however
  it is written.
- A link whose address carries a scheme the service does not offer — `javascript:`,
  `data:`, a protocol-relative `//host` — is not rendered as a link at all: its words are
  shown and nothing is linked. http, https, mailto and addresses within the service are kept
  as written.
- Every link the renderer makes carries `data-testid="content-body-link"`, and an image
  written without alternative text gets `alt=""`.

The plan proposed a Markdown library and an HTML sanitiser (`markdown-it` + `dompurify`,
listed for the tech lead under "For ruling" item 3). Neither is used.

## Why

- **The rule is about what cannot happen, and this makes it structural.** A sanitiser is a
  list of what to remove from markup that was going to be inserted as markup; it is right
  until its list is wrong. A parser that has no way to express raw markup cannot emit any,
  whatever the body says. R-7.17 replaced a defect where a page's body was rendered with no
  filtering at all, which made authoring a page an unusually powerful permission. This
  closes that by construction.
- It needs no ruling on two dependencies, and the renderer stays something a reader can hold
  in their head.
- It is the design's own instruction: "the renderer … turns a page's stored body into
  headings, paragraphs, lists, links and images. Raw markup in the body is escaped and shown
  as text, never executed" (`design/DESIGN.md`, "This project's own components").

## What this costs

The renderer reads the marks the body editor writes and no more: headings, bold, italic,
inline code, fenced code, bulleted and numbered lists, rules, links and images. Tables,
nested lists, block quotes, reference links and footnotes are shown as the text they are.

The plan asked the slice 1 builder to "match the old application's renderer, so pages keep
their meaning". That could not be done: the old application is not in this workspace. A page
whose body uses a mark this renderer does not know will read as its own source. Every page a
fresh installation carries says "Initial version", so nothing is affected today; an
installation with real pages behind it should be looked at before the rebuild serves it.

## What would reverse it

- The old application's renderer turning up and using marks this one does not, which would
  mean extending the parser — not replacing it with a sanitiser.
- A criterion asking for a mark this parser cannot express.
