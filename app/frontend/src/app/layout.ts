/**
 * What the catalogue draws that is not spacing: a card's border, the status badge, a term's
 * weight. Spacing is the page container's and the stack's alone (`./page-layout`), so nothing
 * here sets a gap, a width or an outer margin.
 *
 * Only tokens are named here. No colour, size or radius value is written anywhere in the app.
 */

/**
 * A card: a bordered box with its own inner padding, as the stories draw a card, a placeholder
 * frame or a bordered section. Its content is laid out by a `Stack` inside it.
 */
export const card = {
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

/** The term of a key fact or a definition list. */
export const term = {
  fontWeight: "var(--typography-font-weights-bold)",
} as const;

/** The status badge: the state in words, inside a circular token border. */
export const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
