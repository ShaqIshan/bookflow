// One-off: regenerate PNG app icons from the brand SVG.
// Usage: node scripts/generate-icons.mjs
import sharp from "sharp";

const svg = "public/icons/app-icon.svg";
const jobs = [
  [192, "public/icons/icon-192.png"],
  [512, "public/icons/icon-512.png"],
  [180, "public/icons/apple-touch-icon.png"],
];
for (const [size, out] of jobs) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(out);
  console.log("wrote", out);
}
