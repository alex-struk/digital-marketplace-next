import type { Preview } from "@storybook/react-vite";
import "@bcgov/bc-sans/css/BC_Sans.css";
import "@bcgov/design-tokens/css/variables.css";

// The tokens are loaded here and nowhere else, which is what lets the catalogue name a
// token and never a value. A story that reaches for a token the design system does not
// define renders with nothing behind it, and the scan sees the result rather than the name.
const preview: Preview = {
  parameters: { layout: "fullscreen" },
};

export default preview;
