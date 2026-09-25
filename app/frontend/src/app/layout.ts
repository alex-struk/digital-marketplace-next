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

export const statusRow = {
  display: "flex",
  alignItems: "center",
  gap: "var(--layout-margin-small)",
} as const;
