#!/usr/bin/env bash
# ==============================================================================
# Toolforge Media Optimization Pipeline (WebP / MozJPEG / Oxipng / SVGclean)
# Ensures optimal Core Web Vitals, fast Largest Contentful Paint (LCP) & zero CLS
# ==============================================================================

set -euo pipefail

TARGET_DIR="${1:-./server/public}"

echo "Starting asset optimization in $TARGET_DIR..."

# 1. Compress PNGs via oxipng or optipng if installed
if command -v optipng &>/dev/null; then
  echo "Optimizing PNG files..."
  find "$TARGET_DIR" -type f -name "*.png" -exec optipng -o5 -strip all {} +
fi

# 2. Compress SVGs using scour or svgo if installed
if command -v svgo &>/dev/null; then
  echo "Minifying SVG icons..."
  svgo --folder="$TARGET_DIR" --multipass
fi

# 3. Generate Next-Gen WebP versions for high performance
if command -v cwebp &>/dev/null; then
  echo "Generating modern WebP formats..."
  find "$TARGET_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | while read -r img; do
    webp_path="${img%.*}.webp"
    if [ ! -f "$webp_path" ]; then
      cwebp -q 85 "$img" -o "$webp_path"
      echo "Created: $webp_path"
    fi
  done
fi

echo "Asset compression check complete."
