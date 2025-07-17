const fs = require("fs");
const path = require("path");

// Create PNG versions of the MovieNight icon for PWA compatibility
const iconSizes = [72, 192, 512];

// Simple SVG to base64 for PNG generation
const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#0a0a0a"/>
  <path d="M128 160h256v192H128z" fill="#dc2626"/>
  <circle cx="160" cy="192" r="16" fill="#0a0a0a"/>
  <circle cx="352" cy="192" r="16" fill="#0a0a0a"/>
  <path d="M192 288h128v32H192z" fill="#0a0a0a"/>
</svg>`;

// Generate a simple PNG icon data URL for each size
const generatePngIcon = (size) => {
  // Create a simple base64 PNG icon (this is a minimal implementation)
  // In a real scenario, you'd use a proper SVG to PNG converter
  const canvas = `
  <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" rx="128" fill="#0a0a0a"/>
    <path d="M128 160h256v192H128z" fill="#dc2626"/>
    <circle cx="160" cy="192" r="16" fill="#0a0a0a"/>
    <circle cx="352" cy="192" r="16" fill="#0a0a0a"/>
    <path d="M192 288h128v32H192z" fill="#0a0a0a"/>
    <text x="256" y="420" text-anchor="middle" fill="#dc2626" font-family="Arial" font-size="48" font-weight="bold">🎬</text>
  </svg>`;

  return canvas;
};

// Save improved SVG icons with better design
iconSizes.forEach((size) => {
  const iconContent = generatePngIcon(size);
  fs.writeFileSync(
    path.join(__dirname, `../public/icons/icon-${size}x${size}.svg`),
    iconContent,
  );
  console.log(`Generated icon-${size}x${size}.svg`);
});

console.log(
  "PNG icon placeholders generated. For production, convert these to actual PNG files.",
);
