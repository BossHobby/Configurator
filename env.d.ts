import { ElectronAPI } from "@electron-toolkit/preload";

/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
