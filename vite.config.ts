import { readFileSync, writeFileSync, unlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

function inlineForFileProtocol(): Plugin {
  return {
    name: "inline-for-file-protocol",
    apply: "build",
    closeBundle() {
      const dist = join(import.meta.dirname, "app");
      const htmlPath = join(dist, "index.html");
      let html = readFileSync(htmlPath, "utf8");
      html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_match, href: string) => {
        const cssPath = join(dist, href.replace(/^\.\//, ""));
        const css = readFileSync(cssPath, "utf8");
        try {
          unlinkSync(cssPath);
        } catch {
          /* already removed */
        }
        return `<style>${css}</style>`;
      });
      html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_match, src: string) => {
        const jsPath = join(dist, src.replace(/^\.\//, ""));
        let js = readFileSync(jsPath, "utf8");
        js = js.replace(/<\/script/gi, "<\\/script");
        try {
          unlinkSync(jsPath);
        } catch {
          /* already removed */
        }
        return `<script type="module">${js}</script>`;
      });
      html = html.replace(/<script id="file-protocol-redirect">[\s\S]*?<\/script>/, "");
      html = html.replace(/<link rel="modulepreload"[^>]*>/g, "");
      writeFileSync(htmlPath, html);
      rmSync(join(dist, "assets"), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  plugins: [react(), inlineForFileProtocol()],
  base: "./",
  appType: "spa",
  build: {
    outDir: "app",
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: "assets/app.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  test: {
    environment: "node",
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
});
