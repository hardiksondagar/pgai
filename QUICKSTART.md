# Quick Start Guide

Get PGAI up and running in minutes!

## Prerequisites Check

Make sure you have:
- ✅ Node.js v18+ installed (`node --version`)
- ✅ Python 3.8+ installed (`python3 --version`)
- ✅ A PostgreSQL database to connect to

## Installation (2 minutes)

### 1. Automated Setup (Easiest!)

**On macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

**On Windows:**
```bash
setup.bat
```

This installs everything automatically:
- ✅ Node.js dependencies
- ✅ Python virtual environment
- ✅ Python dependencies

### 2. Run the Application

**Just one command:**
```bash
npm start
```

That's it! The app will:
- Start the Flask backend (in virtual environment)
- Start the React dev server
- Launch Electron automatically

---

### Manual Setup (if you prefer)

```bash
# Install Node.js dependencies
npm install

# Setup Python virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..

# Run the app
npm start
```

## First Steps

### 1. Create Your First Connection

When the app opens:
1. Click the "Select Connection" dropdown
2. Click "+ New Connection"
3. Fill in your PostgreSQL details:
   - **Name**: My Local DB (or any friendly name)
   - **Host**: localhost (or your server IP)
   - **Port**: 5432 (default)
   - **Database**: postgres (or your database name)
   - **Username**: your_username
   - **Password**: your_password
4. Click "Test Connection" to verify
5. Click "Save"

### 2. Set Up AI Features (Optional)

1. Get an OpenAI API key:
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy it

2. In PGAI:
   - Click the settings icon (⚙️) in top right
   - Paste your API key in "OpenAI API Key"
   - Select your preferred model (gpt-4o-mini is faster and cheaper)
   - Click "Save Settings"

### 3. Start Querying!

**Manual SQL:**
- Type SQL in the editor
- Press `Cmd+Enter` to run

**AI-Powered:**
- Open the AI Assistant panel on the right
- Type: "Show all tables and their row counts"
- Click "Generate SQL"
- Click "Insert into Editor"
- Press `Cmd+Enter` to run

## Keyboard Shortcuts

- `Cmd+Enter` - Execute query
- `Cmd+K` - Format SQL
- `Cmd+T` - New query tab
- `Cmd+W` - Close current tab
- `Cmd+,` - Settings

## Troubleshooting

### "Module not found" errors
Run the setup script again:
```bash
./setup.sh  # macOS/Linux
setup.bat   # Windows
```

### Flask won't start
Make sure the virtual environment is set up:
```bash
cd backend
# Check if venv folder exists
ls venv/  # macOS/Linux
dir venv\  # Windows

# If not, create it:
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
deactivate
cd ..

# Then start normally
npm start
```

### Can't connect to PostgreSQL
- Check PostgreSQL is running: `psql -U postgres -l`
- Verify credentials are correct
- Try with SSL disabled first
- Check firewall settings

### AI not working
- Verify API key is correct in Settings
- Check you have OpenAI credits: https://platform.openai.com/account/usage
- Ensure internet connection is working

## Example Queries to Try

Once connected, try these AI prompts:

1. "Show me the schema for all tables"
2. "Count rows in each table"
3. "Find the 10 most recent records in the users table"
4. "Show tables with more than 1000 rows"
5. "Get columns that are foreign keys"

## Building for Distribution

### macOS App

```bash
# Build the frontend
npm run build

# Package as .dmg
npm run package
```

The installer will be in the `dist` folder.

## Tips

1. **Multiple Tabs**: Use tabs to work on multiple queries simultaneously
2. **History**: All queries are automatically saved to history
3. **Favorites**: Save frequently used queries with names
4. **Table Details**: Click the ℹ️ icon next to tables to see structure, indexes, and DDL
5. **Export**: Export query results to CSV, JSON, or SQL INSERT statements

## Need Help?

Check the full README.md for detailed documentation.

Happy querying! 🚀

