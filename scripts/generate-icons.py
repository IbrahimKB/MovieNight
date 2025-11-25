#!/usr/bin/env python3
"""
MovieNight PWA Icon Generator
Generates PNG icons from the brand logo for PWA support
"""

import os
import sys
from pathlib import Path

# Check if PIL/Pillow is installed
try:
    from PIL import Image, ImageDraw
except ImportError:
    print("❌ Error: Pillow not installed")
    print("Install with: pip install pillow")
    sys.exit(1)


def create_brand_logo(size: int, background_color=None, foreground_color=(59, 130, 246, 255)):
    """
    Create MovieNight brand logo image
    
    Args:
        size: Image size (square)
        background_color: RGBA tuple or None for transparent
        foreground_color: RGBA tuple for logo color (default: primary blue)
    """
    if background_color is None:
        img = Image.new("RGBA", (size, size), (10, 10, 10, 0))
    else:
        img = Image.new("RGBA", (size, size), background_color)
    
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    margin = int(size * 0.15)
    circle_radius = (size - margin * 2) // 2
    center_x = size // 2
    center_y = size // 2
    
    # Draw outer reel circle (thicker line for visibility at small sizes)
    line_width = max(2, int(size * 0.06))
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        outline=foreground_color,
        width=line_width
    )
    
    # Draw film reel perforations (4 squares around the circle)
    perf_size = int(size * 0.08)
    perf_offset = int(circle_radius * 0.7)
    
    perforations = [
        (center_x - perf_size // 2, center_y - perf_offset - perf_size // 2),  # top
        (center_x + perf_offset - perf_size // 2, center_y - perf_size // 2),   # right
        (center_x - perf_size // 2, center_y + perf_offset - perf_size // 2),   # bottom
        (center_x - perf_offset - perf_size // 2, center_y - perf_size // 2),   # left
    ]
    
    for x, y in perforations:
        draw.rectangle([x, y, x + perf_size, y + perf_size], fill=foreground_color)
    
    # Draw play button (triangle in center)
    triangle_size = int(size * 0.15)
    play_button = [
        (center_x - triangle_size, center_y - triangle_size),
        (center_x - triangle_size, center_y + triangle_size),
        (center_x + triangle_size * 0.7, center_y),
    ]
    draw.polygon(play_button, fill=foreground_color)
    
    # Draw connection nodes (4 small circles at corners)
    node_radius = int(size * 0.04)
    node_offset = int(circle_radius * 0.55)
    
    nodes = [
        (center_x - node_offset, center_y - node_offset),  # top-left
        (center_x + node_offset, center_y - node_offset),  # top-right
        (center_x + node_offset, center_y + node_offset),  # bottom-right
        (center_x - node_offset, center_y + node_offset),  # bottom-left
    ]
    
    for node_x, node_y in nodes:
        draw.ellipse(
            [
                node_x - node_radius,
                node_y - node_radius,
                node_x + node_radius,
                node_y + node_radius,
            ],
            fill=tuple(list(foreground_color[:3]) + [150]),  # Semi-transparent
        )
    
    return img


def generate_icons():
    """Generate all required PWA icons"""
    
    icons_dir = Path("public/icons")
    icons_dir.mkdir(parents=True, exist_ok=True)
    
    print("�� Generating MovieNight PWA Icons...")
    print()
    
    # Define all required icons
    icons_to_generate = [
        # (filename, size, bg_color, description)
        ("icon-192x192.png", 192, None, "Android/PWA standard"),
        ("icon-512x512.png", 512, None, "PWA splash screen"),
        ("apple-touch-icon.png", 180, None, "iOS home screen"),
        ("maskable-icon-192.png", 192, (10, 10, 20, 255), "Android adaptive (192)"),
        ("maskable-icon-512.png", 512, (10, 10, 20, 255), "Android adaptive (512)"),
    ]
    
    generated_files = []
    
    for filename, size, bg_color, description in icons_to_generate:
        try:
            print(f"📝 Generating {filename} ({size}x{size}) - {description}...", end=" ")
            
            img = create_brand_logo(size, background_color=bg_color)
            output_path = icons_dir / filename
            img.save(output_path, "PNG", quality=95)
            
            file_size = output_path.stat().st_size / 1024  # KB
            print(f"✅ ({file_size:.1f}KB)")
            generated_files.append(filename)
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    print()
    print("=" * 60)
    print("✅ Icon generation complete!")
    print("=" * 60)
    print()
    print("Generated files:")
    for f in generated_files:
        print(f"  ✓ public/icons/{f}")
    print()
    
    # Generate favicon.ico
    print("📝 Generating favicon.ico...", end=" ")
    try:
        favicon_img = create_brand_logo(32)
        favicon_path = icons_dir / "favicon.ico"
        favicon_img.save(favicon_path, "ICO", quality=95)
        print(f"✅")
        print(f"  ✓ public/icons/favicon.ico")
    except Exception as e:
        print(f"⚠️  Note: {e}")
        print("  You can generate favicon.ico from icon-192x192.png using:")
        print("  - Online: https://icoconvert.com/")
        print("  - ImageMagick: convert public/icons/icon-192x192.png -define icon:auto-resize=32 public/icons/favicon.ico")
    
    print()
    print("📋 Next steps:")
    print("  1. Verify all files are in public/icons/")
    print("  2. Run: npm run build && npm run start")
    print("  3. Test PWA installation on mobile devices")
    print("  4. Run Lighthouse audit to verify PWA score")
    print()
    
    return True


def main():
    print()
    print("🎬 MovieNight - PWA Icon Generator")
    print("-" * 60)
    print()
    
    # Check if icons directory exists
    if not Path("public").exists():
        print("❌ Error: public/ directory not found")
        print("   Run this script from the project root")
        sys.exit(1)
    
    # Generate icons
    success = generate_icons()
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
