/**
 * The one layout every message the service sends is written in: the logo, a title, the
 * body, and at most one call to action. A message says what it says through a
 * `MessageContent`; the layout, the logo and the test marking are this file's, so no
 * individual message can get them wrong (R-6.3).
 */

export interface MessageContent {
  readonly subject: string;
  /** The heading at the top of the body. */
  readonly title: string;
  /** Paragraphs of plain words; each is escaped, never read as markup. */
  readonly paragraphs: readonly string[];
  readonly callToAction?: { readonly text: string; readonly url: string };
}

export interface LayoutOptions {
  /** The service's own origin, where the logo is served from. */
  readonly publicOrigin: string;
  /** A test environment's messages carry the test variant of the logo (R-6.3). */
  readonly markAsTest: boolean;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function logoAddress(options: LayoutOptions): string {
  const file = options.markAsTest ? "logo_test.png" : "logo.png";
  return `${options.publicOrigin}/images/${file}`;
}

/** The formatted form of a message. The plain-text form is rendered from this (R-6.5). */
export function renderMessage(content: MessageContent, options: LayoutOptions): string {
  const paragraphs = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px 0;font-size:16px;line-height:24px;">${escapeHtml(paragraph)}</p>`,
    )
    .join("\n");
  const action = content.callToAction
    ? `<p style="margin:24px 0;"><a href="${escapeHtml(content.callToAction.url)}" style="display:inline-block;padding:12px 24px;background:#013366;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:bold;">${escapeHtml(content.callToAction.text)}</a></p>`
    : "";
  const logoAlt = options.markAsTest
    ? "Digital Marketplace (test environment)"
    : "Digital Marketplace";
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${escapeHtml(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#faf9f8;font-family:'BC Sans','Noto Sans',Verdana,Arial,sans-serif;color:#2d2d2d;">
<div style="max-width:600px;margin:0 auto;padding:24px;background:#ffffff;">
<div style="padding:0 0 24px 0;border-bottom:4px solid #fcba19;"><img src="${escapeHtml(logoAddress(options))}" alt="${escapeHtml(logoAlt)}" width="200" height="50"></div>
<h1 style="margin:24px 0 16px 0;font-size:24px;line-height:32px;">${escapeHtml(content.title)}</h1>
${paragraphs}
${action}
</div>
</body>
</html>`;
}
