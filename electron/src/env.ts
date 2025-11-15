import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { logger } from "./logging/logger";

const potentialEnvPaths = [
  path.resolve(__dirname, "..", "..", ".env"),
  path.resolve(process.cwd(), ".env")
];

for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    logger.info(`Loaded environment variables from ${envPath}`);
    break;
  }
}

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optionalNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return defaultValue;
  return parsed;
};

export const auroraEnv = {
  workerUrl: requireEnv("AURORA_WORKER_URL"),
  workerAuthToken: process.env.AURORA_WORKER_TOKEN,
  porcupineAccessKey: requireEnv("PORCUPINE_ACCESS_KEY"),
  porcupineKeywordPath: requireEnv("PORCUPINE_KEYWORD_PATH"),
  porcupineModelPath: process.env.PORCUPINE_MODEL_PATH ?? "",
  wakewordSensitivity: optionalNumber("PORCUPINE_SENSITIVITY", 0.6),
  recorderSilenceMs: optionalNumber("RECORDER_SILENCE_MS", 1200),
  recorderMaxMs: optionalNumber("RECORDER_MAX_MS", 10000),
  recorderThreshold: optionalNumber("RECORDER_THRESHOLD", 1300),
  audioDevice: process.env.AUDIO_INPUT_DEVICE,
  uiUrl: process.env.AURORA_UI_URL ?? "http://localhost:5173"
};

