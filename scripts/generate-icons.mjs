// Script to generate PNG icons using Sharp
// Run: node scripts/generate-icons.mjs

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];

// Netflix-inspired subtitle icon SVG
const createSvg = (size) => {
  const strokeWidth = Math.max(1, size * 0.08);
  const padding = size * 0.15;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#E50914"/>
          <stop offset="100%" style="stop-color:#B20710"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
      
      <!-- Film strip / CC icon -->
      <rect 
        x="${padding}" 
        y="${padding}" 
        width="${size - padding * 2}" 
        height="${size - padding * 2}" 
        rx="${size * 0.08}"
        fill="none" 
        stroke="white" 
        stroke-width="${strokeWidth}"
      />
      
      <!-- Subtitle lines -->
      <line 
        x1="${padding * 1.5}" 
        y1="${size * 0.45}" 
        x2="${size - padding * 1.5}" 
        y2="${size * 0.45}" 
        stroke="white" 
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
      />
      <line 
        x1="${padding * 1.5}" 
        y1="${size * 0.6}" 
        x2="${size * 0.7}" 
        y2="${size * 0.6}" 
        stroke="white" 
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
      />
    </svg>
  `;
};

async function generateIcons() {
  const iconsDir = path.join(__dirname, "..", "public", "icons");

  // Create icons directory if it doesn't exist
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    const svg = createSvg(size);
    const outputPath = path.join(iconsDir, `icon${size}.png`);

    await sharp(Buffer.from(svg)).png().toFile(outputPath);

    console.log(`Generated ${outputPath}`);
  }

  console.log("All icons generated!");
}

generateIcons().catch(console.error);
