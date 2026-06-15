import { defineConfig } from "vitest/config";
import { readFileSync } from "fs";
import { resolve } from "path";

const ratchetPath = resolve(__dirname, ".ratchet.json");
const ratchet = JSON.parse(readFileSync(ratchetPath, "utf-8"));

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "app/**/*.ts"],
      exclude: ["src/**/*.test.ts", "app/**/*.test.ts", "src/data/**", "src/i18n/**"],
      thresholds: {
        lines: ratchet.lines,
        branches: ratchet.branches,
        functions: ratchet.functions,
        statements: ratchet.statements,
      },
    },
  },
});
