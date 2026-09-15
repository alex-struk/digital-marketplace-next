import type { StorybookConfig } from "@storybook/react-vite";

// Every story in the catalogue, and nothing else: the catalogue is named from
// `design/screens.yaml` (`<page>.<state>.stories.tsx`) and a build that picked up files
// from anywhere else would render screens no declaration answers for.
const config: StorybookConfig = {
  stories: ["../catalogue/*.stories.tsx"],
  addons: ["@storybook/addon-a11y"],
  framework: { name: "@storybook/react-vite", options: {} },
  // Nothing about a government service's screens leaves the machine that built them.
  core: { disableTelemetry: true },
  typescript: { check: false },
};

export default config;
