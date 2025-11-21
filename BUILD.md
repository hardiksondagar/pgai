# Building PGAI for macOS

This guide explains how to build PGAI as a native macOS application.

## Prerequisites

Before building, ensure you have:
- Node.js 18+ installed
- Python 3.8+ installed
- Xcode Command Line Tools installed
- All dependencies installed (`npm install`)

## Build Steps

### 1. Install Dependencies

```bash
npm install
./setup.sh
```

### 2. Prepare Python Backend (IMPORTANT!)

**You MUST run this before building** to bundle Python dependencies:

```bash
./scripts/prepare-backend.sh
```

This creates `backend/venv/` with all Python packages pre-installed. This virtual environment is bundled into the app, ensuring Flask and all dependencies work without requiring users to install Python.

If you skip this step, the packaged app will fail to start with "ModuleNotFoundError: No module named 'flask'".

### 3. Build the Application

#### Quick Build (Universal Binary)
```bash
npm run build:mac
```

This creates:
- **DMG installer**: `release/PGAI-0.1.0-universal.dmg`
- **ZIP archive**: `release/PGAI-0.1.0-mac.zip`

#### Build for Specific Architecture

For Intel Macs only:
```bash
npm run build && electron-builder --mac --x64
```

For Apple Silicon only:
```bash
npm run build && electron-builder --mac --arm64
```

### 3. Find Your Build

Built applications are in the `release/` directory:
```
release/
├── PGAI-0.1.0-universal.dmg      # DMG installer (recommended)
├── PGAI-0.1.0-mac.zip             # ZIP archive
└── mac/PGAI.app/                  # Unpackaged app
```

## Installation

### From DMG (Recommended)
1. Open `PGAI-0.1.0-universal.dmg`
2. Drag `PGAI.app` to your Applications folder
3. Launch from Applications or Spotlight

### From ZIP
1. Extract `PGAI-0.1.0-mac.zip`
2. Move `PGAI.app` to your Applications folder
3. Launch the app

## First Launch

On first launch, macOS may show a security warning because the app is not signed. To open:

1. **Option 1**: Right-click the app → Open → Click "Open"
2. **Option 2**: System Preferences → Security & Privacy → Click "Open Anyway"

## Included Components

The built app includes:
- ✅ React frontend (bundled)
- ✅ Python Flask backend
- ✅ All Python dependencies
- ✅ SQLite database for internal storage
- ✅ Monaco SQL editor

## Python Backend

The app automatically:
1. Checks for Python installation
2. Creates virtual environment on first run (if needed)
3. Installs Python dependencies
4. Starts Flask server on port 5001

## Troubleshooting

### Build Fails

**Issue**: `electron-builder` fails
```bash
# Clear cache and rebuild
rm -rf node_modules release dist
npm install
npm run build:mac
```

**Issue**: Python dependencies error
```bash
# Manually install Python dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### App Won't Start

**Issue**: "Flask server failed to start"
- Check if Python 3 is installed: `python3 --version`
- Check if port 5001 is available: `lsof -i :5001`
- View logs: Open app from Terminal to see error messages

**Issue**: "App is damaged and can't be opened"
```bash
# Remove quarantine attribute
xattr -cr /Applications/PGAI.app
```

## Code Signing (Optional)

For distribution, sign your app:

1. Get an Apple Developer account
2. Create a Developer ID certificate
3. Add to `package.json`:

```json
"build": {
  "mac": {
    "identity": "Developer ID Application: Your Name (TEAMID)",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist"
  }
}
```

4. Build with signing:
```bash
CSC_NAME="Developer ID Application: Your Name" npm run build:mac
```

## Notarization (For Distribution)

To distribute outside the App Store:

```bash
# Build and notarize
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAMID"
npm run build:mac
```

## App Structure

```
PGAI.app/
├── Contents/
│   ├── MacOS/PGAI              # Electron executable
│   ├── Resources/
│   │   ├── app.asar            # Frontend code
│   │   ├── app.asar.unpacked/  # Backend code (uncompressed)
│   │   │   └── backend/
│   │   │       ├── *.py
│   │   │       ├── requirements.txt
│   │   │       └── schema.sql
│   └── Info.plist
```

## Development vs Production

| Feature | Development (`npm start`) | Production (Built App) |
|---------|--------------------------|----------------------|
| Frontend | Webpack dev server | Bundled in app |
| Backend | Separate process | Bundled, auto-starts |
| Hot Reload | ✅ Yes | ❌ No |
| Dev Tools | ✅ Open by default | ❌ Closed (Cmd+Opt+I to open) |
| Port | 3000 (frontend), 5001 (backend) | 5001 (backend only) |

## CI/CD (GitHub Actions)

Create `.github/workflows/build-mac.yml`:

```yaml
name: Build macOS App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: npm install
      - run: ./setup.sh
      - run: npm run build:mac
      - uses: actions/upload-artifact@v3
        with:
          name: PGAI-macOS
          path: release/*.dmg
```

## Support

For issues or questions:
- Check the logs in Console.app
- Run from Terminal to see detailed output: `/Applications/PGAI.app/Contents/MacOS/PGAI`
- Report issues on GitHub

