import { powerSaveBlocker } from "electron";
import { AudioRecorder } from "./audio/recorder";
import { logger } from "./logging/logger";
import { PopupWindow } from "./popup/window";
import { AIResponsePayload, WakeWordPayload } from "./types/events";
import { VoiceApiClient } from "./voiceApi/client";
import { WakeWordEngine } from "./wakeword/engine";

interface VoiceOrchestratorDeps {
  wakeWord: WakeWordEngine;
  recorder: AudioRecorder;
  popup: PopupWindow;
  apiClient: VoiceApiClient;
}

export class VoiceOrchestrator {
  private busy = false;
  private blockerId: number | null = null;

  constructor(private readonly deps: VoiceOrchestratorDeps) {}

  initialize() {
    this.deps.wakeWord.on("wakeword", () => this.handleWakeWord());
    this.deps.wakeWord.on("error", (error) => {
      logger.error("Wake-word engine error", error);
      this.deps.popup.sendAIResponse({ message: "", error: error.message });
    });
  }

  async start() {
    await this.deps.wakeWord.start();
  }

  async shutdown() {
    this.deps.wakeWord.shutdown();
    this.deps.recorder.cancel();
    if (this.blockerId !== null) {
      powerSaveBlocker.stop(this.blockerId);
      this.blockerId = null;
    }
  }

  private async handleWakeWord() {
    if (this.busy) {
      logger.warn("Wake-word detected while busy");
      return;
    }

    this.busy = true;

    const wakePayload: WakeWordPayload = {
      keyword: "Hey Aurora",
      detectedAt: Date.now()
    };

    this.deps.popup.show("wakeword");
    this.deps.popup.sendWakeWord(wakePayload);

    this.deps.wakeWord.pause();
    this.startBlocker();

    try {
      const wavBuffer = await this.recordInteraction();
      const aiResponse = await this.deps.apiClient.sendAudio(wavBuffer);
      const payload: AIResponsePayload = { message: aiResponse.message, raw: aiResponse.data };
      this.deps.popup.sendAIResponse(payload);
      this.deps.popup.hideAfter("response", 4000);
    } catch (error) {
      logger.error("Voice session failed", error);
      const payload: AIResponsePayload = {
        message: "",
        error: error instanceof Error ? error.message : "Unknown error"
      };
      this.deps.popup.sendAIResponse(payload);
      this.deps.popup.hideAfter("error", 4000);
    } finally {
      this.stopBlocker();
      this.busy = false;
    }
  }

  private startBlocker() {
    if (this.blockerId !== null) return;
    this.blockerId = powerSaveBlocker.start("prevent-display-sleep");
  }

  private stopBlocker() {
    if (this.blockerId === null) return;
    powerSaveBlocker.stop(this.blockerId);
    this.blockerId = null;
  }

  private async recordInteraction() {
    try {
      return await this.deps.recorder.capture();
    } finally {
      await this.deps.wakeWord.resume();
    }
  }
}

