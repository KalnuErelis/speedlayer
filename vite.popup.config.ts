import { defineConfig } from "vite";
import path from "node:path";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig(async () => {
  const { svelte, vitePreprocess } = await import("@sveltejs/vite-plugin-svelte");

  return {
    plugins: [
      svelte({
        preprocess: vitePreprocess({ script: true }),
        compilerOptions: {
          dev: !isProduction,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    define: {
      IS_DEV_MODE: JSON.stringify(!isProduction),
      "BUILD_DEFINITIONS.BROWSER": JSON.stringify("chromium"),
      "BUILD_DEFINITIONS.BROWSER_MAY_HAVE_AUDIO_DESYNC_BUG": JSON.stringify(true),
      "BUILD_DEFINITIONS.BROWSER_MAY_HAVE_EQUAL_OLD_AND_NEW_VALUE_IN_STORAGE_CHANGE_OBJECT": JSON.stringify(false),
      "BUILD_DEFINITIONS.CONTACT_EMAIL": JSON.stringify(""),
    },
    build: {
      outDir: "dist-chromium",
      emptyOutDir: false,
      sourcemap: !isProduction ? "inline" : false,
      lib: {
        entry: "src/entry-points/popup/main.ts",
        formats: ["es"],
        fileName: () => "main.js",
        cssFileName: "popup",
      },
      rollupOptions: {
        output: {
          entryFileNames: "popup/main.js",
          chunkFileNames: "popup/chunks/popup-[name]-[hash].js",
          assetFileNames: "popup/[name][extname]",
        },
      },
    },
  };
});
