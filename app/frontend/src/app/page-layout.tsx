import type { ElementType, HTMLAttributes, ReactNode } from "react";

/**
 * The page container and the stack: the two pieces every screen is laid out with, as
 * `design/catalogue/layout.tsx` defines them and in no other place in the app. The container
 * wraps every screen once, in the root layout; a screen never sets its own width, outer padding
 * or gaps, only which stack holds what (design/DESIGN.md, "Page container" and "Stack").
 */

// The design system's `Text` and `Heading` bring margins of their own. Inside a stack the gap is
// the only spacing, so those margins are removed from each item, and from a heading, paragraph or
// definition that is the sole content of an item's wrapper. The class is repeated so the rule
// outranks the design system's own selectors without `!important`.
const css = `
.layout-stack.layout-stack.layout-stack > *,
.layout-stack.layout-stack.layout-stack > * > :is(h1, h2, h3, h4, h5, h6, p, dt, dd) {
  margin: var(--layout-margin-none);
}
.layout-stack:is(ul, ol) {
  list-style: none;
  padding: var(--layout-padding-none);
}
`;

// One column the width of the design system's Header and Footer content, centred. 1100px is the
// value those containers use and no token carries it, so it is written here and nowhere else.
const container = {
  boxSizing: "border-box",
  width: "100%",
  maxWidth: "calc(1100px + 2 * var(--layout-padding-medium))",
  marginInline: "auto",
  paddingInline: "var(--layout-padding-medium)",
  paddingBlock: "var(--layout-padding-large)",
} as const;

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div style={container}>
      <style>{css}</style>
      {children}
    </div>
  );
}

/**
 * The rhythm: `large` between the regions of a page, `medium` between the items of a region,
 * `small` between a label and what it labels (and between the controls of a tight cluster).
 */
export type Gap = "small" | "medium" | "large";

// No `style` or `className`: a stack's spacing is its gap and nothing else.
type StackProps = Omit<HTMLAttributes<HTMLElement>, "style" | "className"> & {
  // A `ul` or `ol` stack is a list of rows: no markers and no indent, spaced by the gap alone.
  as?: "div" | "section" | "article" | "dl" | "ul" | "ol" | "form" | "nav";
  gap?: Gap;
  // A row lays its items side by side and always wraps, so nothing is pushed off a narrow screen.
  direction?: "column" | "row";
  align?: "start" | "center" | "baseline" | "end";
  justify?: "start" | "space-between";
  children?: ReactNode;
};

export function Stack({ as = "div", gap = "medium", direction = "column", align, justify, children, ...rest }: StackProps) {
  const Element = as as ElementType;
  return (
    <Element
      {...rest}
      className="layout-stack"
      style={{
        display: "flex",
        flexDirection: direction,
        flexWrap: direction === "row" ? "wrap" : "nowrap",
        alignItems: align,
        justifyContent: justify,
        gap: `var(--layout-margin-${gap})`,
        margin: "var(--layout-margin-none)",
      }}
    >
      {children}
    </Element>
  );
}
