#!/bin/bash
set -e

echo "🔧 Preparing backend for packaging..."

cd backend

# Check if venv already exists
if [ -d "venv" ] && [ -f "venv/bin/python" ]; then
  echo "✅ Virtual environment already exists at: backend/venv"
  echo "   To force recreation, delete it first: rm -rf backend/venv"

  # Just upgrade packages if venv exists
  echo "📦 Updating Python dependencies..."
  source venv/bin/activate
  pip install --upgrade pip -q
  pip install -r requirements.txt -q
  echo "✅ Dependencies updated successfully!"
else
  # Remove incomplete venv if it exists
  if [ -d "venv" ]; then
    echo "Removing incomplete venv..."
    rm -rf venv
  fi

  # Create fresh virtual environment
  echo "Creating Python virtual environment..."
  python3 -m venv venv

  # Activate venv and install dependencies
  echo "Installing Python dependencies..."
  source venv/bin/activate
  pip install --upgrade pip
  pip install -r requirements.txt

  echo "✅ Backend prepared successfully!"
  echo "Virtual environment created at: backend/venv"
fi

