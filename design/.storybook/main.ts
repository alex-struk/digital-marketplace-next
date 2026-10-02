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
  // The dev server pre-bundles only the packages it finds by crawling the stories, and a story
  // never names React itself: JSX reaches it through the automatic runtime and the one
  // Storybook import is type-only. Unlisted, React is served as its raw CommonJS file and
  // Storybook's own renderer fails to import it, so `npm start` shows no story at all. The
  // static build bundles everything and is unaffected.
  viteFinal: async (vite) => ({
    ...vite,
    optimizeDeps: {
      ...vite.optimizeDeps,
      include: [...(vite.optimizeDeps?.include ?? []), "react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
  }),
};

export default config;
