// Post-build: generates index.html + _redirects for Cloudflare Pages SPA deployment
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";

let cssFiles = [];
let jsEntries = [];

// Try manifest first (available when vite build.manifest = true)
const manifestPath = "dist/client/.vite/manifest.json";
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  cssFiles = Object.values(manifest)
    .filter((f) => f.file?.endsWith(".css"))
    .map((f) => `/` + f.file);
  jsEntries = Object.values(manifest)
    .filter((f) => f.isEntry && f.file?.endsWith(".js"))
    .map((f) => `/` + f.file);
  console.log("Using manifest.json");
} else {
  // Fallback: glob assets directory
  console.log("manifest.json not found — globbing assets/");
  const assets = readdirSync("dist/client/assets");
  cssFiles = assets.filter((f) => f.endsWith(".css")).map((f) => `/assets/${f}`);
  // Load all JS as modules — browser deduplicates ES module imports
  jsEntries = assets.filter((f) => f.endsWith(".js")).map((f) => `/assets/${f}`);
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Safety Hub — Predictive Accident AI</title>
  <meta name="description" content="Real-time road safety AI — live detections, risk scores and predictive heatmaps." />
${cssFiles.map((f) => `  <link rel="stylesheet" href="${f}" />`).join("\n")}
</head>
<body>
  <div id="root"></div>
${jsEntries.map((f) => `  <script type="module" src="${f}"></script>`).join("\n")}
</body>
</html>`;

writeFileSync("dist/client/index.html", html);
writeFileSync("dist/client/_redirects", "/*  /index.html  200\n");
console.log("✓ Generated dist/client/index.html");
console.log("✓ Generated dist/client/_redirects");
