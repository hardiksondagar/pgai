# App Icon

This directory should contain the app icon.

## Required Icon Formats

For macOS builds, you need:
- `icon.icns` - macOS icon file (1024x1024px recommended)

## Creating an Icon

### Using iconutil (macOS)

1. Create a directory structure:
```bash
mkdir icon.iconset
```

2. Add PNG files at different sizes:
```
icon.iconset/
├── icon_16x16.png
├── icon_16x16@2x.png (32x32)
├── icon_32x32.png
├── icon_32x32@2x.png (64x64)
├── icon_128x128.png
├── icon_128x128@2x.png (256x256)
├── icon_256x256.png
├── icon_256x256@2x.png (512x512)
├── icon_512x512.png
└── icon_512x512@2x.png (1024x1024)
```

3. Convert to .icns:
```bash
iconutil -c icns icon.iconset -o icon.icns
```

### Online Tools

You can also use online tools like:
- https://cloudconvert.com/png-to-icns
- https://convertio.co/png-icns/
- https://www.img2icnsconverter.com/

Just upload a 1024x1024 PNG and download the .icns file.

## Temporary Solution

If you don't have an icon yet, electron-builder will use a default icon. The app will still build and run fine.

To add your icon later:
1. Place `icon.icns` in this `assets/` directory
2. Rebuild: `npm run build:mac`

