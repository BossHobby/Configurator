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

## Interaction with QUICKSILVER Firmware

### Communication Protocol

The Configurator communicates with QUICKSILVER firmware through a CBOR-based binary protocol over serial connection:

1. **Connection Flow**:

   - Detect serial devices via WebSerial API (web) or node-serialport (Electron)
   - Establish connection at 420000 baud
   - Send handshake to verify QUICKSILVER firmware
   - Receive device info including version, target, and capabilities

2. **Message Format**:

   - All messages are CBOR-encoded for efficiency
   - Request/response pattern with message IDs
   - Automatic retry on timeout (5 second timeout)
   - Binary data for profiles, blackbox logs, etc.

3. **Key Message Types**:
   - `GET_INFO` - Retrieve firmware version, target, features
   - `GET_PROFILE`/`SET_PROFILE` - Read/write flight controller settings
   - `MOTOR_TEST` - Control individual motors for testing
   - `BLACKBOX` - Download flight logs
   - `PASSTHROUGH` - ESC configuration mode
   - `REBOOT` - Restart flight controller

### Profile Management

The Configurator manages QUICKSILVER profiles which contain all flight controller settings:

- **Profile Structure**: Defined in `/src/store/ProfileStore.ts`
- **Version Compatibility**: Profile version must match firmware expectations
- **Binary Format**: Profiles are serialized as CBOR for compact storage
- **Multiple Profiles**: Support for switching between different configurations

### Firmware Updates

The Configurator integrates with QUICKSILVER's GitHub releases:

1. **Workflow Integration**:

   - Fetches available builds from GitHub Actions artifacts
   - Filters for "build" workflow runs only
   - Downloads appropriate `.bin` or `.hex` files

2. **Flashing Process**:
   - Uses STM32 DFU protocol for firmware updates
   - Supports both USB-DFU and serial bootloader
   - Progress tracking during flash operations

## Interaction with Targets Repository

### Target Definitions

The Configurator understands target configurations that originate from the Targets repository:

1. **Target Information**:

   - Retrieved from connected firmware via `GET_INFO`
   - Includes MCU type, board name, manufacturer
   - Determines available features and UI options

2. **Hardware Constraints**:

   - Motor output availability based on target
   - Serial port configurations
   - Available sensors (gyro, baro, mag, GPS)
   - DMA-capable features

3. **Dynamic UI Adaptation**:
   - Panels show/hide based on target capabilities
   - Motor mixer adapts to available outputs
   - Serial port options match hardware

### Target-Specific Features

The Configurator adapts its interface based on target capabilities:

- **Motor Outputs**: Number of motors (4-8) depends on target
- **Serial Ports**: Available UART/SoftSerial varies by target
- **Sensors**: GPS, Barometer panels only show if hardware supports
- **OSD**: Video system options based on target's OSD capability

## Data Flow

### Configuration Flow

```
User Input (Configurator) → CBOR Encoding → Serial → QUICKSILVER Firmware
                                                            ↓
                                                    Flash Storage
```

### Telemetry Flow

```
QUICKSILVER Sensors → Firmware Processing → CBOR → Serial → Configurator UI
                                                                ↓
                                                        Real-time Display
```

### Firmware Update Flow

```
GitHub Actions → Build Artifacts → Configurator Download → DFU/Serial → Bootloader
                                                                            ↓
                                                                    New Firmware
```

## Integration Best Practices

1. **Protocol Changes**: Always maintain backward compatibility
2. **Version Checking**: Verify firmware version before operations
3. **Error Handling**: Graceful degradation for unsupported features
4. **Target Awareness**: Check target capabilities before showing options
5. **Binary Safety**: Validate all CBOR data before processing
