import { fetch } from "undici";
import { logger } from "../logging/logger";

export interface VoiceApiClientOptions {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
}

export interface VoiceApiResult {
  message: string;
  data?: unknown;
}

export class VoiceApiClient {
  constructor(private readonly options: VoiceApiClientOptions) {}

  async sendAudio(wavBuffer: Buffer): Promise<VoiceApiResult> {
    const url = this.normalizeUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 20000);

    try {
      const response = await fetch(`${url}/api/voice`, {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav",
          ...(this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {})
        },
        body: wavBuffer,
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Worker responded with ${response.status}: ${errorText}`);
      }

      const payload = (await response.json()) as VoiceApiResult;
      logger.info("Received AI response");
      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeUrl() {
    return this.options.baseUrl.replace(/\/$/, "");
  }
}

