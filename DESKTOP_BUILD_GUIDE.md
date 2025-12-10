# Building the Desktop Application

This guide explains how to build the Fish Parasite Detection System as a standalone desktop application.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Git** - to clone the repository

## Setup Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install
```

### 2. Add Build Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

### 3. Install Additional Dev Dependencies

```bash
npm install --save-dev concurrently wait-on electron-squirrel-startup
```

### 4. Run in Development Mode

```bash
npm run electron:dev
```

This will:
- Start the Vite development server
- Launch Electron once the server is ready
- Enable hot-reload for development

### 5. Build for Production

**For Windows:**
```bash
npm run electron:build:win
```

**For macOS:**
```bash
npm run electron:build:mac
```

**For Linux:**
```bash
npm run electron:build:linux
```

The built application will be in the `release` folder.

## Output Files

After building, you'll find:

- **Windows**: `.exe` installer in `release/`
- **macOS**: `.dmg` file in `release/`
- **Linux**: `.AppImage` and `.deb` files in `release/`

## Distribution

Share the installer file with users. They can:
1. Download the installer
2. Run it to install the application
3. Launch from desktop shortcut or start menu

## Notes

- The app connects to the cloud database, so internet connection is required
- Camera access works the same as in the web version
- All features (upload, capture, gallery) work identically
