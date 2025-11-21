# Debugging the Packaged App

## Rebuild After Changes

```bash
# Clean and rebuild
rm -rf release dist
npm run build:mac
```

## Test the App with Console Output

Instead of double-clicking the app, run it from Terminal to see all logs:

```bash
# Run the packaged app from Terminal
/Applications/PGAI.app/Contents/MacOS/PGAI
```

Or if it's still in the release directory:

```bash
./release/mac/PGAI.app/Contents/MacOS/PGAI
```

This will show you:
- Python installation check
- Backend startup logs
- Flask server status
- Any error messages

## Common Issues and Fixes

### Issue 1: "Flask server failed to start"

**Cause**: Python not found or dependencies missing

**Fix**:
```bash
# Check Python is installed
python3 --version

# If not installed, install via Homebrew
brew install python@3.11
```

### Issue 2: "Backend directory not found"

**Cause**: Backend files not packaged correctly

**Fix**: Check `package.json` build config includes backend:
```json
"files": [
  "dist/**/*",
  "electron/**/*",
  "backend/**/*"
]
```

### Issue 3: Dependencies not installed

**Fix**: The app will auto-install on first run, but you can pre-install:
```bash
pip3 install --user flask flask-cors psycopg2-binary openai cryptography python-dotenv sqlparse openpyxl
```

### Issue 4: Port 5001 already in use

**Fix**: Kill the process using port 5001:
```bash
lsof -ti:5001 | xargs kill -9
```

## Check App Contents

Inspect what's actually packaged:

```bash
# List backend files in the app
ls -la /Applications/PGAI.app/Contents/Resources/app.asar.unpacked/backend/

# Check if Python files are there
ls -la /Applications/PGAI.app/Contents/Resources/app.asar.unpacked/backend/*.py
```

## View Console Logs (macOS)

1. Open **Console.app**
2. Select your Mac in the sidebar
3. Search for "PGAI" or "Flask"
4. Run the app and watch for errors

## Development vs Production

Test in development mode first:
```bash
# Development (works every time)
npm start

# If dev works, the issue is in packaging
npm run build:mac
```

## Manual Backend Test

Test if Flask can run independently:

```bash
cd /Applications/PGAI.app/Contents/Resources/app.asar.unpacked/backend
python3 app.py
```

If this works, the issue is in how Electron launches it.

## Emergency Fix: Use Development Python Environment

If the packaged app can't find dependencies, you can point it to a virtual environment:

1. Create a venv in the backend directory before packaging:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Rebuild:
```bash
npm run build:mac
```

The venv will be excluded by default, so the app will use system Python.

## Success Indicators

When working correctly, you should see:
```
Flask:  * Running on http://127.0.0.1:5001
Flask:  * Debug mode: off
Flask server is ready on port 5001
```

## Still Not Working?

Try running the built app with debug output:

```bash
DEBUG=* /Applications/PGAI.app/Contents/MacOS/PGAI
```

This shows all Electron debug information.

