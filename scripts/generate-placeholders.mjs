#!/usr/bin/env node
/**
 * Generates placeholder SVG product images from data/products-source.json.
 * Run after editing the JSON:  npm run products:generate
 *
 * Existing files are overwritten only if the JSON references them, so you can
 * safely drop real photos in /public/products with the same file names later
 * (just change the extension in the JSON and regenerate — or edit the JSON
 * directly and skip generation).
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(
  readFileSync(join(root, "data", "products-source.json"), "utf8"),
);
const outDir = join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

const ACCENT = "#10b981";
const BG = "#131316";

function esc(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapText(name, maxChars = 22) {
  const words = name.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = word;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function svgFor(product, variant) {
  const lines = wrapText(product.name);
  const startY = 470 - (lines.length - 1) * 24;
  const label = esc(product.category.toUpperCase());
  const text = lines
    .map(
      (l, i) =>
        `<text x="400" y="${startY + i * 48}" text-anchor="middle" fill="#fafafa" font-family="ui-sans-serif, system-ui, sans-serif" font-size="36" font-weight="600">${esc(l)}</text>`,
    )
    .join("\n  ");
  const idTag = esc(product.id.slice(-4));
  const alt = variant === 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${esc(product.name)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BG}"/>
      <stop offset="100%" stop-color="#0b0b0e"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="${alt ? "0.28" : "0.18"}"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <circle cx="${alt ? 640 : 160}" cy="${alt ? 140 : 660}" r="320" fill="url(#glow)"/>
  <rect x="40" y="40" width="720" height="720" rx="28" fill="none" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="2"/>
  <g transform="translate(400 260)">
    <rect x="-70" y="-120" width="140" height="240" rx="24" fill="#1c1c21" stroke="${ACCENT}" stroke-width="4"/>
    <rect x="-48" y="-96" width="96" height="168" rx="10" fill="#0b0b0e"/>
    <circle cx="0" cy="96" r="12" fill="${ACCENT}"/>
  </g>
  <text x="400" y="430" text-anchor="middle" fill="${ACCENT}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="6">${label}</text>
  ${text}
  <text x="400" y="600" text-anchor="middle" fill="#71717a" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22">Placeholder image${alt ? " · view 2" : ""}</text>
  <text x="400" y="700" text-anchor="middle" fill="#52525b" font-family="ui-monospace, monospace" font-size="18">DPC Gadget Hub · #${idTag}</text>
</svg>
`;
}

let count = 0;
for (const product of data.products) {
  product.images.forEach((imgPath, index) => {
    if (!imgPath.endsWith(".svg")) return; // user replaced it with a real photo
    const file = join(root, "public", imgPath.replace(/^\//, ""));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, svgFor(product, index + 1), "utf8");
    count += 1;
  });
}

console.log(`Generated ${count} placeholder images in public/products/`);