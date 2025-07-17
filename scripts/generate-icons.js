// PWA Icon Generation Script
// This script would typically use sharp or similar library to generate icons
// For now, we'll create the icon directory structure and placeholder SVGs

const fs = require("fs");
const path = require("path");

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const shortcutIconSizes = [96];

// Create icons directory
const iconsDir = path.join(__dirname, "../public/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Base SVG template for icons
const createIconSVG = (
  size,
) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#dc2626"/>
  <path d="M8 10c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H10c-1.1 0-2-.9-2-2V10z" fill="#ffffff"/>
  <circle cx="12" cy="14" r="1.5" fill="#dc2626"/>
  <circle cx="16" cy="14" r="1.5" fill="#dc2626"/>
  <circle cx="20" cy="14" r="1.5" fill="#dc2626"/>
  <circle cx="12" cy="18" r="1.5" fill="#dc2626"/>
  <circle cx="16" cy="18" r="1.5" fill="#dc2626"/>
  <circle cx="20" cy="18" r="1.5" fill="#dc2626"/>
  <path d="M14 10h4v2h-4z" fill="#dc2626"/>
</svg>`;

// Create shortcut icons
const createShortcutIcon = (name, size) => {
  let icon = "";
  switch (name) {
    case "suggest":
      icon = `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#dc2626"/>
        <path d="M16 8l4 8h-3v8h-2v-8h-3l4-8z" fill="#ffffff"/>
      </svg>`;
      break;
    case "watchlist":
      icon = `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#dc2626"/>
        <path d="M24 8v16l-8-4-8 4V8c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2z" fill="#ffffff"/>
      </svg>`;
      break;
    case "movie-night":
      icon = `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#dc2626"/>
        <path d="M20 8h4v2h-4V8zm-8 0h4v2h-4V8zM8 8h4v2H8V8zm2 4v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2 2V12H10z" fill="#ffffff"/>
        <circle cx="14" cy="16" r="1" fill="#dc2626"/>
        <circle cx="18" cy="16" r="1" fill="#dc2626"/>
        <circle cx="14" cy="20" r="1" fill="#dc2626"/>
        <circle cx="18" cy="20" r="1" fill="#dc2626"/>
      </svg>`;
      break;
    default:
      icon = createIconSVG(size);
  }
  return icon;
};

console.log("Generating PWA icons...");

// Generate main app icons
iconSizes.forEach((size) => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}x${size}.png`;
  const svgFilename = `icon-${size}x${size}.svg`;

  // Write SVG version (in real implementation, would convert to PNG)
  fs.writeFileSync(path.join(iconsDir, svgFilename), svg);
  console.log(`Generated ${svgFilename}`);
});

// Generate shortcut icons
const shortcuts = ["suggest", "watchlist", "movie-night"];
shortcuts.forEach((shortcut) => {
  shortcutIconSizes.forEach((size) => {
    const svg = createShortcutIcon(shortcut, size);
    const filename = `${shortcut}-${size}x${size}.svg`;

    fs.writeFileSync(path.join(iconsDir, filename), svg);
    console.log(`Generated ${filename}`);
  });
});

console.log("Icon generation complete!");
console.log(
  "Note: SVG files generated. In production, convert to PNG using sharp or similar tool.",
);
