import codspeedPlugin from "@codspeed/vitest-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [codspeedPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
  benchmark: {
    include: ["benches/**/*.bench.ts"],
  },
});
