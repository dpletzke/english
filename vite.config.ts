import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";
import type { InlineConfig } from "vitest/node";

const coverageExclude = [
  ...(configDefaults.coverage?.exclude ?? []),
  "src/test/**/*",
];

type ViteWithVitestConfig = import("vite").UserConfig & {
  test?: InlineConfig;
};

const config: ViteWithVitestConfig = {
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: coverageExclude,
    },
  },
};

// https://vite.dev/config/
export default defineConfig(config);
