import { readFileSync, writeFileSync, unlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function serveDevHtml(): Plugin {
  return {
    name: "serve-dev-html",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) {
          next();
          return;
        }
        const [path, query] = req.url.split("?");
        if (path.startsWith("/public/")) {
          req.url = `${path.slice("/public".length)}${query ? `?${query}` : ""}`;
          next();
          return;
        }
        if (path === "/" || path === "/index.html") {
          req.url = `/dev.html${query ? `?${query}` : ""}`;
        }
        next();
      });
    },
  };
}

function writeRootStandalone(): Plugin {
  return {
    name: "write-root-standalone",
    apply: "build",
    closeBundle() {
      const dist = join(import.meta.dirname, "dist");
      const builtPath = join(dist, "dev.html");
      let html = readFileSync(builtPath, "utf8");
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
      html = html.replace(/<link rel="modulepreload"[^>]*>/g, "");
      html = html.replace(
        /href="[^"]*class_warrior\.jpg"/,
        'href="./public/icons/class_warrior.jpg"',
      );
      html = html.replace(
        "<head>",
        "<head>\n    <!-- Version autonome : double-cliquez ce fichier. Pas de serveur. -->",
      );
      writeFileSync(join(import.meta.dirname, "index.html"), html);
      rmSync(join(dist, "assets"), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  plugins: [serveDevHtml(), react(), writeRootStandalone()],
  base: "./",
  appType: "spa",
  build: {
    outDir: "dist",
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: join(import.meta.dirname, "dev.html"),
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
