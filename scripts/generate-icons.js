#!/usr/bin/env node

/**
 * MovieNight PWA Icon Generator
 * Uses Sharp to convert SVG to PNG and resize for different devices
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconDir = path.join(process.cwd(), 'public', 'icons');
const sourceFile = path.join(iconDir, 'pwa-icon-512.svg');

// Define all icons to generate
const iconsToGenerate = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'maskable-icon-192.png', size: 192 },
  { name: 'maskable-icon-512.png', size: 512 },
  { name: 'favicon.ico', size: 32 },
];

async function generateIcons() {
  console.log('🎬 Generating MovieNight PWA Icons...\n');

  try {
    for (const icon of iconsToGenerate) {
      const outputPath = path.join(iconDir, icon.name);
      
      process.stdout.write(`📝 Generating ${icon.name} (${icon.size}x${icon.size})... `);

      await sharp(sourceFile)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 10, g: 10, b: 20, alpha: 0 }
        })
        .toFile(outputPath);

      const fileSize = fs.statSync(outputPath).size / 1024;
      console.log(`✅ (${fileSize.toFixed(1)}KB)`);
    }

    console.log('\n✅ Icon generation complete!\n');
    console.log('Generated files:');
    for (const icon of iconsToGenerate) {
      console.log(`  ✓ public/icons/${icon.name}`);
    }
    console.log();

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

generateIcons();
