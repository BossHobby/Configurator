# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the QUICKSILVER Configurator - a web-based and desktop application for configuring QUICKSILVER flight controller firmware. It provides a GUI interface to configure drone flight controllers and is deployed at config.bosshobby.com.

## Development Commands

### Development

- `npm run serve` - Start web development server (http://localhost:5173)
- `npm run dev` - Start Electron development environment
- `npm run pwa` - Build and preview PWA locally with service worker

### Building

- `npm run build` - Build web version for production
- `npm run build:gh-pages` - Build for GitHub Pages deployment (sets base URL)
- `npm run build:linux` - Build Linux desktop app (.AppImage, .deb)
- `npm run build:windows` - Build Windows desktop app (.exe)
- `npm run build:mac` - Build macOS desktop app (.dmg)

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier

## Architecture

### Technology Stack

- **Frontend**: Vue 3 + TypeScript + Vite
- **Desktop**: Electron with electron-vite
- **State Management**: Pinia stores in `/src/store/`
- **UI**: Bulma CSS framework
- **Serial Communication**: WebSerial API (web) / node-serialport (Electron)
- **Data Format**: CBOR for binary communication with flight controller

### Key Directories

- `/src/panel/` - Feature panels (PID, Rates, Motors, OSD, etc.)
- `/src/store/` - Pinia stores for global state
- `/src/components/` - Reusable Vue components
- `/electron/` - Electron-specific code (main process, preload scripts)

### Important Stores

- `ConnectionStore` - Manages serial connection state and device communication
- `ProfileStore` - Handles flight controller profiles and settings
- `TemplateStore` - Configuration templates management
- `WorkflowStore` - GitHub workflow runs for firmware updates

### Serial Communication Pattern

All serial communication follows this pattern:

1. Commands are sent via `ConnectionStore.send()`
2. Binary data is encoded/decoded using CBOR
3. Responses are handled by specific message handlers
4. Use `ConnectionStore.connection.passthrough` for ESC passthrough mode

### Adding New Settings Panel

1. Create new panel component in `/src/panel/`
2. Add route in `/src/router.ts`
3. Add navigation item in `/src/components/SideBar.vue`
4. Use `ProfileMixin` for standard profile operations
5. Follow existing panel patterns (e.g., PidPanel.vue, RatesPanel.vue)

## Important Notes

- Always check `ProfileStore.version` when adding new features that modify profile structure
- Serial connection timeout is 5 seconds (recently increased from default)
- ESC passthrough support was recently added - use with caution
- The app supports both web deployment and desktop builds from the same codebase
- PWA functionality requires service worker - test with `npm run pwa`
- When working with 3D visualizations, models are in `/public/*.glb`
- GitHub workflow runs are filtered to only show "build" workflow artifacts (not "test" workflow)
