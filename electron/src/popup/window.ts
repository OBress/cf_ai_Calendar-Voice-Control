import path from "node:path";
import { BrowserWindow } from "electron";
import { logger } from "../logging/logger";
import { AIResponsePayload, PopupVisibilityPayload, WakeWordPayload } from "../types/events";

interface PopupWindowConfig {
  preloadPath: string;
  uiUrl: string;
}

export class PopupWindow {
  private window: BrowserWindow | null = null;
  private hideTimer: NodeJS.Timeout | null = null;

  constructor(private readonly config: PopupWindowConfig) {}

  createIfNeeded() {
    if (this.window) return this.window;

    this.window = new BrowserWindow({
      width: 420,
      height: 520,
      frame: false,
      transparent: true,
      show: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      backgroundColor: "#00000000",
      webPreferences: {
        preload: this.config.preloadPath,
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.window.setMenuBarVisibility(false);

    this.window.loadURL(this.config.uiUrl).catch((error) => {
      logger.error("Failed to load renderer UI", error);
    });

    this.window.on("closed", () => {
      this.window = null;
    });

    return this.window;
  }

  private sendVisibility(payload: PopupVisibilityPayload) {
    this.window?.webContents.send("popup:visibility", payload);
  }

  show(reason: PopupVisibilityPayload["reason"]) {
    this.createIfNeeded();
    if (!this.window) return;
    this.window.showInactive();
    this.window.focus();
    this.sendVisibility({ visible: true, reason });
  }

  hide(reason: PopupVisibilityPayload["reason"]) {
    if (!this.window) return;
    this.window.hide();
    this.sendVisibility({ visible: false, reason });
  }

  hideAfter(reason: PopupVisibilityPayload["reason"], delayMs: number) {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.hide(reason);
    }, delayMs);
  }

  sendWakeWord(payload: WakeWordPayload) {
    this.window?.webContents.send("wake-word", payload);
  }

  sendAIResponse(payload: AIResponsePayload) {
    this.window?.webContents.send("ai:response", payload);
  }
}

