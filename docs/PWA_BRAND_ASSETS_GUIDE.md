# 🎬 MovieNight - PWA & Brand Assets Setup Guide

This guide covers how to generate and deploy the remaining PWA assets for the MovieNight application.

## Status

✅ **Completed:**

- Professional SVG logo component (`components/ui/brand-logo.tsx`)
- Updated metadata in `app/layout.tsx`
- Updated `public/manifest.json` with icon references
- Logo integrated in auth pages and app layout

⏳ **TODO:**

- Generate raster icon files (PNG at multiple sizes)
- Generate favicon

## Required Files

All files should be placed in `public/icons/`:

| Filename                | Size     | Format | Purpose                   |
| ----------------------- | -------- | ------ | ------------------------- |
| `icon.svg`              | Scalable | SVG    | Modern browsers, scalable |
| `favicon.ico`           | 32x32    | ICO    | Browser tab (legacy)      |
| `icon-192x192.png`      | 192x192  | PNG    | Android/PWA install       |
| `icon-512x512.png`      | 512x512  | PNG    | PWA splash screen         |
| `maskable-icon-192.png` | 192x192  | PNG    | Android adaptive icon     |
| `maskable-icon-512.png` | 512x512  | PNG    | Android adaptive icon     |
| `apple-touch-icon.png`  | 180x180  | PNG    | iOS home screen           |

## Option 1: Use Figma (Recommended)

### Step 1: Create the Design

1. Go to [Figma](https://figma.com) and create a new file
2. Create a 512x512 artboard
3. Copy the SVG code from `components/ui/brand-logo.tsx` and paste it into Figma
   - Use Figma's import SVG feature (Right-click → "Use as" → "Paste as" → paste SVG code)
4. Customize if needed (adjust colors to match #3b82f6 for primary blue)
5. Export as SVG: Right-click → Export → Select SVG format

### Step 2: Generate PNG Versions

1. For each size (192, 512):
   - Select the artboard
   - Right-click → Export
   - Set size to desired dimension (192x192 or 512x512)
   - Export as PNG

2. For iOS icon (180x180):
   - Create a new 180x180 artboard
   - Copy your logo design
   - Export as `apple-touch-icon.png`

### Step 3: Generate Maskable Icons

Maskable icons are required for Android adaptive icons. The safe zone is the center 66% of the icon.

1. Create a 512x512 artboard with a solid background (match your theme)
2. Place your logo in the center
3. Export as `maskable-icon-512.png`
4. Resize/export as `maskable-icon-192.png`

## Option 2: Use an Online Tool

### Using [PWA Asset Generator](https://github.com/GoogleChromeLabs/pwacompat)

```bash
# Install globally
npm install -g pwacompat

# Generate from your SVG
pwacompat --source public/icons/icon.svg --output public/icons/ --type png
```

### Using [Favicon Generator](https://favicon-generator.org/)

1. Visit https://favicon-generator.org/
2. Upload your SVG logo (or use the brand colors)
3. Generate favicon for "Web"
4. Download all files
5. Place in `public/icons/`

### Using [IconKitchen](https://www.iconkitchen.com/)

1. Visit https://www.iconkitchen.com/
2. Create a new icon
3. Set size to 512x512
4. Upload or design your MovieNight logo
5. Export as PNG at multiple sizes

## Option 3: Use Python Script

Create `scripts/generate-icons.py`:

```python
#!/usr/bin/env python3
from PIL import Image, ImageDraw
import os

# Create output directory
os.makedirs("public/icons", exist_ok=True)

# Movie reel inspired design
def create_logo_image(size):
    img = Image.new("RGBA", (size, size), (10, 10, 10, 0))
    draw = ImageDraw.Draw(img)

    # Draw circle outline (film reel)
    margin = int(size * 0.1)
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        outline=(59, 130, 246, 255),
        width=int(size * 0.06)
    )

    # Draw play button (triangle)
    center = size // 2
    triangle_size = int(size * 0.2)
    points = [
        (center - triangle_size, center - triangle_size),
        (center - triangle_size, center + triangle_size),
        (center + triangle_size, center),
    ]
    draw.polygon(points, fill=(59, 130, 246, 255))

    return img

# Generate all sizes
for size in [192, 512]:
    img = create_logo_image(size)
    img.save(f"public/icons/icon-{size}x{size}.png")

# Apple icon (rounded square)
img_180 = create_logo_image(180)
img_180.save("public/icons/apple-touch-icon.png")

# Maskable icon (with safe zone)
img_512 = create_logo_image(512)
img_512.save("public/icons/maskable-icon-512.png")

img_192 = create_logo_image(192)
img_192.save("public/icons/maskable-icon-192.png")

print("✅ Icon generation complete!")
```

Run it:

```bash
python scripts/generate-icons.py
```

## Option 4: Manual Creation with Image Editor

If you're comfortable with Photoshop, GIMP, or similar:

1. Create a 512x512 canvas
2. Set background to transparent or #0a0a0a
3. Draw the MovieNight logo using:
   - Primary color: #3b82f6 (blue)
   - Use circles and a play button shape
   - Keep it simple and scalable
4. Export as PNG at each required size
5. Save to `public/icons/`

## Creating favicon.ico

The favicon is the 32x32 icon in browser tabs.

### Option A: Convert PNG to ICO

```bash
# Using ImageMagick
convert public/icons/icon-192x192.png -define icon:auto-resize=32 public/icons/favicon.ico

# Using online tool: https://icoconvert.com/
# Upload icon-192x192.png, convert to .ico
```

### Option B: Direct generation from SVG

Some tools like [Favicon Generator](https://favicon-generator.org/) can create ICO files directly.

## Verification Checklist

After generating all assets:

- [ ] All files exist in `public/icons/`:
  - [ ] icon.svg
  - [ ] favicon.ico
  - [ ] icon-192x192.png
  - [ ] icon-512x512.png
  - [ ] apple-touch-icon.png
  - [ ] maskable-icon-192.png
  - [ ] maskable-icon-512.png

- [ ] Run Lighthouse audit to verify PWA score:

  ```bash
  npm run build
  npm run start
  # Then run Chrome DevTools → Lighthouse → PWA
  ```

- [ ] Check manifest.json references correct paths:

  ```bash
  curl http://localhost:3000/manifest.json
  ```

- [ ] Verify icons in browser:
  - Right-click page → "Inspect" → head → look for icon links
  - Test on iOS: Add to Home Screen (should show custom icon)
  - Test on Android: Install PWA (should show custom icon)

## SVG Export Tips

When exporting the logo SVG from `components/ui/brand-logo.tsx`:

1. The component is already optimized for web
2. Use currentColor to inherit text color
3. Ensure viewBox="0 0 512 512" is present
4. Remove unnecessary attributes when optimizing

## Troubleshooting

### Icons not showing on PWA install

- [ ] Verify `manifest.json` has correct icon paths
- [ ] Ensure icons are in `public/icons/`
- [ ] Check that `app/layout.tsx` references correct manifest path
- [ ] Clear browser cache and rebuild

### Android shows default icon instead of custom

- [ ] Ensure maskable icons are present and properly formatted
- [ ] Check that safe zone (center 66%) contains the logo
- [ ] Verify icon colors have enough contrast (white logo on dark bg)

### iOS shows generic icon on home screen

- [ ] Verify `apple-touch-icon.png` is exactly 180x180
- [ ] Check file is in `public/icons/`
- [ ] Clear browser cache on iOS device
- [ ] May require force refresh (Settings → General → iPhone Storage → MovieNight → Offload → Reinstall)

## Next Steps

1. Generate the PNG assets using one of the options above
2. Verify all files are in `public/icons/`
3. Run Lighthouse audit to confirm PWA is installable
4. Test on real devices (iOS and Android)
5. Monitor analytics for PWA install rates

## Resources

- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Web.dev: Installable PWA](https://web.dev/install-criteria/)
- [Favicon Best Practices](https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-matter)
- [Android Adaptive Icons](https://developer.android.com/guide/topics/ui/look-and-feel/icon_design_adaptive)
