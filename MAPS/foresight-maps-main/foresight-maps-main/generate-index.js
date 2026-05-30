// Post-build script: generates index.html + _redirects for Cloudflare Pages SPA deployment
import { readFileSync, writeFileSync } from "fs";

const manifest = JSON.parse(
  readFileSync("dist/client/.vite/manifest.json", "utf8")
);

const css = Object.values(manifest)
  .filter((f) => f.file?.endsWith(".css"))
  .map((f) => `  <link rel="stylesheet" href="/${f.file}" />`)
  .join("\n");

const js = Object.values(manifest)
  .filter((f) => f.isEntry && f.file?.endsWith(".js"))
  .map((f) => `  <script type="module" src="/${f.file}"></script>`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Safety Hub — Predictive Accident AI</title>
  <meta name="description" content="Real-time road safety AI — live detections, risk scores and predictive heatmaps." />
${css}
</head>
<body>
  <div id="root"></div>
${js}
</body>
</html>`;

writeFileSync("dist/client/index.html", html);
writeFileSync("dist/client/_redirects", "/*  /index.html  200\n");

console.log("✓ Generated dist/client/index.html");
console.log("✓ Generated dist/client/_redirects");
