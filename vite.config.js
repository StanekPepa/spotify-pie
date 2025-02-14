import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    host: true,
    port: 4173,
    strictPort: true,
    https: false,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    https: false,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    allowedHosts: ["spotify.stanekj.com", "localhost"],
  },
  base: "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    "process.env.VITE_SPOTIFY_CLIENT_ID": JSON.stringify(
      process.env.VITE_SPOTIFY_CLIENT_ID
    ),
    "process.env.VITE_REDIRECT_URI": JSON.stringify(
      process.env.VITE_REDIRECT_URI || "https://spotify.stanekj.com/callback"
    ),
  },
});
