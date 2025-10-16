import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { configDefaults } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setupTests.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: [...configDefaults.coverage.exclude, "src/test/**/*"],
    },
  },
});
