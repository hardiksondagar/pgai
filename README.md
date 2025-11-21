# 🚀 PGAI - AI-Powered PostgreSQL Client

<div align="center">

![PGAI Banner](https://via.placeholder.com/1200x300/1a1a2e/16c79a?text=PGAI+-+AI-First+PostgreSQL+Client)

**Write SQL queries in natural language. Built for developers, powered by AI.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Made with Electron](https://img.shields.io/badge/Made%20with-Electron-47848f?logo=electron)](https://www.electronjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776ab?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Building](#-building) • [Contributing](#-contributing)

</div>

---

## 📖 About

PGAI is a modern, open-source PostgreSQL database client that puts AI at the center of your workflow. No more context switching between documentation and your database - just describe what you want in plain English and let AI generate the SQL for you.

### 🎯 Why PGAI?

- **🤖 AI-First Design**: Conversation-based query generation with full context awareness
- **⚡ Lightning Fast**: Schema caching, autocomplete, and optimized queries
- **🎨 Beautiful UI**: Dark mode, clean interface, and intuitive navigation
- **🔒 Private & Secure**: Your data stays local, bring your own OpenAI API key
- **🆓 100% Free**: Open source and free forever

---

## ✨ Features

### 🗄️ **Database Management**
- **Multiple Connections**: Manage and switch between multiple PostgreSQL databases
- **Visual Schema Explorer**: Tree view with expandable tables, columns, and constraints
- **Real-time Search**: Instantly filter tables as you type
- **Connection Profiles**: Save connections with custom names and colors

### 🤖 **AI-Powered Queries**
- **Natural Language to SQL**: Write queries in plain English
  - "Show me all users who signed up last week"
  - "Find products with low inventory"
  - "Calculate average order value by month"
- **Conversation Context**: AI remembers previous queries for follow-up questions
- **Schema-Aware**: AI knows your database structure for accurate queries
- **Multiple Models**: Support for GPT-5, GPT-4o, GPT-4o Mini, and more

### 📝 **Advanced SQL Editor**
- **Monaco Editor**: The same editor that powers VS Code
- **Syntax Highlighting**: Full PostgreSQL syntax support
- **Smart Autocomplete**: Table names, column names, and SQL keywords
- **Multi-Tab Interface**: Work on multiple queries simultaneously
- **Format SQL**: One-click query beautification
- **Keyboard Shortcuts**: Power-user friendly

### 📊 **Results & Data**
- **Interactive Results Grid**: Sortable, searchable, and copyable
- **JSON Viewer**: Pretty-printed JSON with click-to-copy
- **Large Dataset Support**: Pagination for millions of rows
- **Export Options**: CSV, JSON, or SQL INSERT statements
- **Execution Metrics**: Row counts and query timing

### 🔧 **Additional Features**
- **Query History**: Automatic tracking of all executed queries
- **Favorite Queries**: Save and organize frequently used queries with folders
- **Table Details**: View structure, indexes, foreign keys, and DDL
- **Dark Mode**: Easy on the eyes with true dark theme
- **Encrypted Storage**: Passwords and API keys stored securely

---

## 🖼️ Screenshots

<div align="center">

### Main Interface
![Main Interface](https://via.placeholder.com/1200x700/1a1a2e/ffffff?text=Main+Interface+Screenshot)

### AI Query Generation
![AI Query](https://via.placeholder.com/1200x700/1a1a2e/ffffff?text=AI+Query+Generation)

### Table Explorer
![Table Explorer](https://via.placeholder.com/1200x700/1a1a2e/ffffff?text=Table+Explorer)

</div>

---

## 🚀 Installation

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://www.python.org/))
- **PostgreSQL** database to connect to

### Quick Start

```bash
# Clone the repository
git clone https://github.com/hardiksondagar/pgai.git
cd pgai

# Run setup script (installs all dependencies)
./setup.sh

# Start the application
npm start
```

That's it! The app will open automatically.

### Manual Setup

```bash
# Install Node.js dependencies
npm install

# Setup Python virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Start the app
npm start
```

---

## 💡 Usage

### 1️⃣ **Add a Database Connection**

1. Click **"New Connection"** in the sidebar
2. Enter your PostgreSQL details:
   - Host (e.g., `localhost`)
   - Port (default: `5432`)
   - Database name
   - Username & Password
3. Click **"Test Connection"** → **"Save"**

### 2️⃣ **Configure AI**

1. Click the **Settings (⚙️)** icon
2. Enter your [OpenAI API Key](https://platform.openai.com/api-keys)
3. Select your preferred model
4. Click **"Save Settings"**

### 3️⃣ **Write Queries**

**Option A: Use AI** (Recommended)
1. Type a question in the AI panel: *"Show me users who registered today"*
2. Review the generated SQL
3. Click **"Insert SQL"** to add it to the editor
4. Click **"Run"** or press `Cmd+Enter`

**Option B: Write SQL Manually**
1. Type SQL in the editor
2. Press `Cmd+Enter` or click **"Run"**
3. View results below

### 4️⃣ **Explore Your Data**

- Click tables in the sidebar to expand columns
- Click the **ℹ️** icon to view table details
- Right-click cells to copy data
- Use autocomplete (`Ctrl+Space`) for fast editing

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Execute query |
| `Cmd/Ctrl + K` | Format SQL |
| `Cmd/Ctrl + S` | Save query to favorites |
| `Cmd/Ctrl + T` | New query tab |
| `Cmd/Ctrl + W` | Close current tab |
| `Cmd/Ctrl + ,` | Open settings |
| `Ctrl + Space` | Trigger autocomplete |

---

## 🏗️ Building

### Build for macOS

```bash
# Universal binary (Intel + Apple Silicon)
npm run build:mac
```

Output: `release/PGAI-0.1.0-universal.dmg`

### Build for Specific Architecture

```bash
# Intel Macs only
npm run build && electron-builder --mac --x64

# Apple Silicon only
npm run build && electron-builder --mac --arm64
```

See **[BUILD.md](BUILD.md)** for detailed build instructions and code signing.

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────┐
│           Electron (Desktop App)            │
├─────────────────────────────────────────────┤
│  Frontend (React + TypeScript + Tailwind)  │
│  - Monaco SQL Editor                        │
│  - Database Explorer                        │
│  - Results Grid                             │
│  - AI Chat Interface                        │
└─────────────────────────────────────────────┘
                    ⬍
┌─────────────────────────────────────────────┐
│       Backend (Python Flask REST API)       │
│  - PostgreSQL Client (psycopg2)            │
│  - OpenAI Integration                       │
│  - SQLite (Internal Storage)                │
│  - Query Execution & Formatting             │
└─────────────────────────────────────────────┘
                    ⬍
┌─────────────────────────────────────────────┐
│         Your PostgreSQL Database            │
└─────────────────────────────────────────────┘
```

### Tech Stack

**Frontend**
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 📝 Monaco Editor (VS Code editor)
- 🔄 Axios for API calls

**Backend**
- 🐍 Python 3.8+ with Flask
- 🐘 psycopg2 for PostgreSQL
- 🤖 OpenAI Python SDK
- 🗄️ SQLite for local storage
- 🔐 Cryptography for secure storage

**Desktop**
- ⚡ Electron 28
- 📦 electron-builder for packaging

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### 🐛 Report Bugs

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### 💡 Suggest Features

Open an issue with the `enhancement` label:
- Describe the feature
- Explain why it's useful
- Share mockups if you have them

### 🔧 Submit Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### 📝 Development Guidelines

```bash
# Start development server
npm start

# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm test
```

---

## 🗺️ Roadmap

- [ ] **Query Builder**: Visual query builder for complex queries
- [ ] **Data Visualization**: Charts and graphs from query results
- [ ] **SSH Tunneling**: Connect to remote databases securely
- [ ] **Query Sharing**: Export and share queries with team
- [ ] **Multiple AI Providers**: Support for Anthropic Claude, Gemini
- [ ] **Database Migrations**: Track and manage schema changes
- [ ] **Multi-Database Support**: MySQL, SQLite, SQL Server
- [ ] **Cloud Sync**: Sync connections and queries across devices
- [ ] **Collaborative Editing**: Real-time query collaboration
- [ ] **Extensions API**: Plugin system for custom features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for the amazing GPT models
- **Monaco Editor** team for the world-class editor
- **Electron** team for making cross-platform apps possible
- **PostgreSQL** community for the best database
- **Beekeeper Studio** for design inspiration

---

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/hardiksondagar/pgai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/hardiksondagar/pgai/discussions)
- 📧 **Email**: your.email@example.com

---

## ⭐ Star History

If you find PGAI useful, please consider giving it a star! It helps others discover the project.

[![Star History Chart](https://api.star-history.com/svg?repos=hardiksondagar/pgai&type=Date)](https://star-history.com/#hardiksondagar/pgai&Date)

---

<div align="center">

**Built with ❤️ by developers, for developers**

[⬆ Back to Top](#-pgai---ai-powered-postgresql-client)

</div>
