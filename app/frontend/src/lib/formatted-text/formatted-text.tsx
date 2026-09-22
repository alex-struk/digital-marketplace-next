import { Fragment, ReactNode, createElement } from "react";
import { Link } from "@bcgov/design-system-react-components";
import { Block, Inline, parseFormattedText } from "./parse";

/**
 * The project's own formatted-text renderer. It is not a design-system component: the design
 * system renders no document content.
 *
 * It is the only renderer in the application. A page's body renders the same way on the
 * page's own address and wherever another screen embeds it, and markup inside a body is
 * shown as the text it is and never executed (R-7.17). Nothing here writes HTML from a
 * string, so there is no path by which a body could become markup.
 */

const stack = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
} as const;

const codeBlock = {
  overflowX: "auto",
  padding: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

const image = { maxWidth: "100%", height: "auto" } as const;

function renderInline(nodes: readonly Inline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, position) => {
    const key = `${keyPrefix}-${position}`;
    switch (node.kind) {
      case "text":
        return <Fragment key={key}>{node.text}</Fragment>;
      case "strong":
        return <strong key={key}>{renderInline(node.children, key)}</strong>;
      case "emphasis":
        return <em key={key}>{renderInline(node.children, key)}</em>;
      case "code":
        return <code key={key}>{node.text}</code>;
      case "link":
        return (
          <Link key={key} href={node.href} data-testid="content-body-link">
            {renderInline(node.children, key)}
          </Link>
        );
      case "image":
        // A body written without alternative text gets an empty one, so a reader is not
        // read a file name (the formatting guidance asks authors to describe their images).
        return <img key={key} src={node.src} alt={node.alt} style={image} />;
    }
  });
}

function renderBlock(block: Block, key: string): ReactNode {
  switch (block.kind) {
    case "heading":
      return createElement(
        `h${block.level}`,
        { key },
        renderInline(block.children, key),
      );
    case "paragraph":
      return <p key={key}>{renderInline(block.children, key)}</p>;
    case "list":
      return block.ordered ? (
        <ol key={key}>
          {block.items.map((item, position) => (
            <li key={`${key}-${position}`}>
              {renderInline(item, `${key}-${position}`)}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={key}>
          {block.items.map((item, position) => (
            <li key={`${key}-${position}`}>
              {renderInline(item, `${key}-${position}`)}
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre key={key} style={codeBlock}>
          <code>{block.text}</code>
        </pre>
      );
    case "rule":
      return <hr key={key} />;
  }
}

export interface FormattedTextProps {
  readonly markup: string;
  readonly testId?: string;
}

export function FormattedText({ markup, testId }: FormattedTextProps) {
  const blocks = parseFormattedText(markup);
  return (
    <div style={stack} data-testid={testId}>
      {blocks.map((block, position) => renderBlock(block, `block-${position}`))}
    </div>
  );
}
