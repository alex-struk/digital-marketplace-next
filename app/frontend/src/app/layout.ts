/**
 * The layout the catalogue uses, in one place: a single-column grid, `--layout-margin-large`
 * between regions and `--layout-margin-medium` inside a section, `--layout-padding-large`
 * around a page, and action rows that wrap instead of overflowing.
 *
 * Only tokens are named here. No colour, size or radius value is written anywhere in the app.
 */

export const page = {
  display: "grid",
  gap: "var(--layout-margin-large)",
  padding: "var(--layout-padding-large)",
} as const;

export const stack = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
} as const;

export const row = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "var(--layout-margin-medium)",
} as const;

export const facts = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  margin: "var(--layout-margin-none)",
} as const;

export const term = {
  fontWeight: "var(--typography-font-weights-bold)",
} as const;

export const definition = { margin: "var(--layout-margin-none)" } as const;

/** A key fact: its term above its detail (the opportunities domain's key facts list). */
export const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;

export const tight = { display: "grid", gap: "var(--layout-margin-small)" } as const;

/** The status badge: the state in words, inside a circular token border. */
export const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

/** A card section: one part of a long form, or one program on the chooser. */
export const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

/** A section navigation's list of links, wrapping. */
export const tabList = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

/** A list with no bullets, its items spaced. */
export const plainList = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
} as const;

export const statusRow = {
  display: "flex",
  alignItems: "center",
  gap: "var(--layout-margin-small)",
} as const;
