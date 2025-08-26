#!/bin/bash

# Image Migration and Backup Script for CMS Fix
# This script ensures all images are in the correct location and backed up to GitHub

echo "🔧 Starting image migration and backup process..."

# Create the correct directory structure
mkdir -p public/images/jewelry
mkdir -p client/public/images/jewelry

echo "📁 Created directory structure"

# Function to copy and backup images
copy_images() {
    local source_dir=$1
    local dest_dir=$2
    
    if [ -d "$source_dir" ]; then
        echo "📋 Copying images from $source_dir to $dest_dir"
        
        # Copy all image files
        find "$source_dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) -exec cp {} "$dest_dir/" \;
        
        # Count copied files
        local count=$(find "$dest_dir" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" -o -name "*.webp" \) | wc -l)
        echo "✅ Copied $count images to $dest_dir"
    else
        echo "⚠️ Source directory $source_dir not found"
    fi
}

# Copy images from various possible locations
echo "🔍 Searching for existing images..."

# Check common image locations
copy_images "client/public/images" "public/images/jewelry"
copy_images "public/images" "public/images/jewelry"
copy_images "client/src/assets/images" "public/images/jewelry"
copy_images "images" "public/images/jewelry"

# Also ensure client-side copy exists
copy_images "public/images/jewelry" "client/public/images/jewelry"

# Create a placeholder image if none exist
if [ ! -f "public/images/jewelry/placeholder.jpg" ]; then
    echo "🖼️ Creating placeholder image..."
    
    # Create a simple SVG placeholder and convert to JPG if possible
    cat > public/images/jewelry/placeholder.svg << 'EOF'
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f8f9fa"/>
  <rect x="50" y="180" width="300" height="40" fill="#e9ecef"/>
  <text x="200" y="205" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#6c757d">Jewelry Image Placeholder</text>
</svg>
EOF

    echo "✅ Created SVG placeholder"
    
    # Copy placeholder to both locations
    cp public/images/jewelry/placeholder.svg client/public/images/jewelry/placeholder.svg
fi

# Create .gitkeep files to ensure directories are committed
touch public/images/jewelry/.gitkeep
touch client/public/images/jewelry/.gitkeep

echo "📝 Created .gitkeep files"

# Check for broken image references in markdown files
echo "🔍 Checking for broken image references..."

if command -v grep &> /dev/null; then
    echo "Scanning content files for image references..."
    
    # Find all markdown files and check image references
    find content -name "*.md" -exec grep -l "image:" {} \; | while read file; do
        echo "📄 Checking: $file"
        
        # Extract image paths and check if they exist
        grep "image:" "$file" | while read line; do
            image_path=$(echo "$line" | sed 's/.*image: *//g' | sed 's/^["'"'"']//g' | sed 's/["'"'"']$//g')
            
            if [[ "$image_path" == /* ]]; then
                # Absolute path
                full_path="public$image_path"
            else
                # Relative path
                full_path="public/images/jewelry/$image_path"
            fi
            
            if [ ! -f "$full_path" ]; then
                echo "⚠️ Missing image: $image_path (expected at $full_path)"
            else
                echo "✅ Found image: $image_path"
            fi
        done
    done
fi

# List all images found
echo "📊 Image inventory:"
echo "In public/images/jewelry:"
ls -la public/images/jewelry/ 2>/dev/null || echo "  (directory empty or not found)"

echo "In client/public/images/jewelry:"
ls -la client/public/images/jewelry/ 2>/dev/null || echo "  (directory empty or not found)"

echo ""
echo "🎉 Image migration and backup process completed!"
echo ""
echo "📋 Next steps:"
echo "1. Commit these changes to GitHub"
echo "2. Update your CMS to use the correct image paths"
echo "3. Test image uploads through the CMS"
echo "4. Verify images persist after deployment"
echo ""
echo "🔧 To commit changes:"
echo "git add public/images/ client/public/images/"
echo "git commit -m 'fix: migrate images to correct directory structure for CMS persistence'"
echo "git push origin main"
