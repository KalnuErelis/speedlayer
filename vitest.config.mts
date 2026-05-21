import { defineConfig } from "vitest/config";
import codspeed from "@codspeed/vitest-plugin";
import path from "path";

export default defineConfig({
  plugins: [codspeed()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
