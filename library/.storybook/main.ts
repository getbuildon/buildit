import type { StorybookConfig } from "@storybook/react-vite"
import tailwindcss from "@tailwindcss/vite"

const config: StorybookConfig = {
  stories: ["../foundations/**/*.stories.tsx", "../atoms/**/*.stories.tsx", "../molecules/**/*.stories.tsx", "../organisms/**/*.stories.tsx", "../layouts/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  // Las fuentes de Recoleta viven en public/fonts de la app.
  staticDirs: [
    { from: "../../public/fonts", to: "/fonts" },
    { from: "../../public/login", to: "/login" },
  ],
  async viteFinal(viteConfig) {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()]
    return viteConfig
  },
}

export default config
