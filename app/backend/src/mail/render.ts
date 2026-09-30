import { Block, Inline, Message } from "./message";
import { MailSettings, TEST_SUBJECT_PREFIX } from "./settings";

/**
 * Turning a message into the two forms every message is sent in (R-6.5), and marking it when
 * it comes from a test environment (R-6.3). The marking is applied here, by the sending
 * machinery, so no individual message has to ask for it.
 */

export interface RenderedMessage {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

type Look = Pick<MailSettings, "serviceOrigin" | "testEnvironment">;

/** The subject as sent: marked as a test when the environment is one (R-6.3). */
export function subjectOf(message: Message, look: Look): string {
  return look.testEnvironment
    ? `${TEST_SUBJECT_PREFIX}${message.subject}`
    : message.subject;
}

/** The address of the logo at the top of the formatted form; the test variant in a test environment (R-6.3). */
export function logoAddressOf(look: Look): string {
  return `${look.serviceOrigin}/images/${look.testEnvironment ? "logo_test.png" : "logo.png"}`;
}

export function render(message: Message, look: Look): RenderedMessage {
  return {
    subject: subjectOf(message, look),
    html: renderHtml(message, look),
    text: renderText(message),
  };
}

// ------------------------------------------------------------------------ formatted

const escapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => escapes[character] ?? character);
}

const FONT = "font-family: 'BC Sans', 'Noto Sans', Verdana, Arial, sans-serif;";
const LINK = "color: #255a90; text-decoration: underline;";

function inlineHtml(content: readonly Inline[]): string {
  return content
    .map((part) =>
      typeof part === "string"
        ? escapeHtml(part)
        : `<a href="${escapeHtml(part.href)}" style="${LINK}">${escapeHtml(part.text)}</a>`,
    )
    .join("");
}

function blockHtml(block: Block): string {
  switch (block.kind) {
    case "paragraph":
      return `<p style="${FONT} font-size: 16px; line-height: 1.5; margin: 0 0 16px;">${inlineHtml(block.content)}</p>`;
    case "action":
      return (
        `<p style="${FONT} margin: 24px 0;">` +
        `<a href="${escapeHtml(block.href)}" style="${FONT} display: inline-block; padding: 10px 20px; ` +
        `background-color: #013366; color: #ffffff; border-radius: 4px; text-decoration: none; font-weight: bold;">` +
        `${escapeHtml(block.label)}</a></p>`
      );
  }
}

export function renderHtml(message: Message, look: Look): string {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(message.subject)}</title>`,
    "</head>",
    `<body style="margin: 0; padding: 24px; background-color: #ffffff; color: #2d2d2d; ${FONT}">`,
    `<div style="max-width: 600px; margin: 0 auto;">`,
    `<img src="${escapeHtml(logoAddressOf(look))}" alt="Digital Marketplace" width="200" style="display: block; margin: 0 0 24px;">`,
    `<h1 style="${FONT} font-size: 24px; line-height: 1.3; margin: 0 0 16px;">${escapeHtml(message.title)}</h1>`,
    ...message.body.map(blockHtml),
    "</div>",
    "</body>",
    "</html>",
  ].join("\n");
}

// ------------------------------------------------------------------------ plain text

function inlineText(content: readonly Inline[]): string {
  return content
    .map((part) =>
      typeof part === "string" ? part : `${part.text} (${part.href})`,
    )
    .join("");
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "paragraph":
      return inlineText(block.content);
    case "action":
      return `${block.label}: ${block.href}`;
  }
}

/**
 * The plain-text form: the same heading, words and links as the formatted form, in the same
 * order, each link written out beside its label so a reader whose mail program shows plain
 * text can still follow it.
 */
export function renderText(message: Message): string {
  return [message.title, ...message.body.map(blockText)].join("\n\n") + "\n";
}
