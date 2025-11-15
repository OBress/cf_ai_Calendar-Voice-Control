import path from "node:path";
import { app } from "electron";
import { AudioRecorder } from "./audio/recorder";
import { auroraEnv } from "./env";
import { logger } from "./logging/logger";
import { VoiceOrchestrator } from "./orchestrator";
import { PopupWindow } from "./popup/window";
import { VoiceApiClient } from "./voiceApi/client";
import { WakeWordEngine } from "./wakeword/engine";

let orchestrator: VoiceOrchestrator | null = null;
let popupWindow: PopupWindow | null = null;

const resolveRelativePath = (maybeRelative?: string) => {
  if (!maybeRelative) return undefined;
  if (path.isAbsolute(maybeRelative)) return maybeRelative;
  return path.resolve(__dirname, "..", maybeRelative);
};

const bootstrap = async () => {
  const preloadPath = path.join(__dirname, "preload.js");
  popupWindow = new PopupWindow({
    preloadPath,
    uiUrl: auroraEnv.uiUrl
  });
  popupWindow.createIfNeeded();

  const keywordPath = resolveRelativePath(auroraEnv.porcupineKeywordPath) ?? auroraEnv.porcupineKeywordPath;
  const modelPath = resolveRelativePath(auroraEnv.porcupineModelPath);

  const wakeWord = new WakeWordEngine({
    accessKey: auroraEnv.porcupineAccessKey,
    keywordPath,
    sensitivity: auroraEnv.wakewordSensitivity,
    modelPath,
    device: auroraEnv.audioDevice
  });

  const recorder = new AudioRecorder({
    sampleRate: wakeWord.sampleRate,
    silenceDurationMs: auroraEnv.recorderSilenceMs,
    maxDurationMs: auroraEnv.recorderMaxMs,
    amplitudeThreshold: auroraEnv.recorderThreshold,
    device: auroraEnv.audioDevice
  });

  const apiClient = new VoiceApiClient({
    baseUrl: auroraEnv.workerUrl,
    token: auroraEnv.workerAuthToken
  });

  orchestrator = new VoiceOrchestrator({
    wakeWord,
    recorder,
    popup: popupWindow,
    apiClient
  });
  orchestrator.initialize();
  await orchestrator.start();
};

const handleAppEvents = () => {
  app.on("window-all-closed", () => {
    // keep background listener alive
  });

  app.on("before-quit", async () => {
    await orchestrator?.shutdown();
  });

  app.on("activate", () => {
    popupWindow?.createIfNeeded();
  });
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(async () => {
    try {
      app.setAppUserModelId("com.aurora.assistant");
      app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
      handleAppEvents();
      await bootstrap();
      logger.info("Aurora desktop ready");
    } catch (error) {
      logger.error("Failed to bootstrap Aurora", error);
      app.quit();
    }
  });
}

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", reason);
});

