# Contributing to PGAI

First off, thank you for considering contributing to PGAI! It's people like you that make PGAI such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps to reproduce the problem**
* **Provide specific examples**
* **Describe the behavior you observed and what you expected**
* **Include screenshots if possible**
* **Include your environment details** (OS, Python version, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a detailed description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and the expected behavior**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Follow the code style guidelines
* Include screenshots and animated GIFs in your pull request whenever possible
* End all files with a newline
* Avoid platform-dependent code

## Development Process

### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/pgai.git
cd pgai

# Install dependencies
./setup.sh

# Start development server
npm start
```

### Making Changes

1. Create a branch from `main`:
```bash
git checkout -b feature/my-new-feature
```

2. Make your changes following our code style

3. Test your changes:
```bash
npm test
npm run build:mac  # Test build
```

4. Commit your changes:
```bash
git add .
git commit -m "Add some feature"
```

5. Push to your fork:
```bash
git push origin feature/my-new-feature
```

6. Open a Pull Request

### Code Style

**TypeScript/JavaScript**
- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable names
- Add comments for complex logic

**Python**
- Follow PEP 8
- Use type hints
- Write docstrings for functions
- Keep functions focused and small

**Commit Messages**
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests

### Testing

```bash
# Run frontend tests
npm test

# Run Python tests
cd backend
pytest

# Test the build
npm run build:mac
```

## Project Structure

```
pgai/
├── electron/          # Electron main process
├── backend/           # Python Flask backend
│   ├── app.py        # Main Flask app
│   ├── database.py   # SQLite operations
│   └── ai_service.py # OpenAI integration
├── src/              # React frontend
│   ├── components/   # React components
│   ├── services/     # API clients
│   └── types/        # TypeScript types
├── public/           # Static assets
└── assets/           # Build assets (icons)
```

## Need Help?

* Check the [Documentation](./README.md)
* Check the [Build Guide](./BUILD.md)
* Check the [Debug Guide](./DEBUG.md)
* Open a discussion on GitHub
* Ask in issues with the `question` label

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Special thanks in the app's About section

Thank you for contributing to PGAI! 🚀

