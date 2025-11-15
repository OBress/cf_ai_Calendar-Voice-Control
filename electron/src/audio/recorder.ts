import { EventEmitter } from "node:events";
import mic from "mic";
import { logger } from "../logging/logger";
import { toWavBuffer } from "./wav";

export interface RecorderOptions {
  sampleRate: number;
  silenceDurationMs: number;
  maxDurationMs: number;
  amplitudeThreshold: number;
  device?: string;
}

export class AudioRecorder extends EventEmitter {
  private micInstance: ReturnType<typeof mic> | null = null;
  private stopTimer: NodeJS.Timeout | null = null;

  constructor(private readonly options: RecorderOptions) {
    super();
  }

  async capture(): Promise<Buffer> {
    if (this.micInstance) {
      throw new Error("Recorder busy");
    }

    return new Promise<Buffer>((resolve, reject) => {
      const micInstance = mic({
        rate: this.options.sampleRate.toString(),
        channels: "1",
        bitwidth: "16",
        device: this.options.device,
        fileType: "raw"
      });

      this.micInstance = micInstance;

      const audioStream = micInstance.getAudioStream();
      const buffers: Buffer[] = [];
      let lastSpeech = Date.now();
      let hasSpeech = false;

      const finalize = (reason: string) => {
        if (!this.micInstance) return;
        logger.info(`Recorder stopping (${reason})`);
        this.micInstance.stop();
        this.micInstance = null;
        audioStream.removeAllListeners();
        if (this.stopTimer) {
          clearTimeout(this.stopTimer);
          this.stopTimer = null;
        }
      };

      audioStream.on("data", (chunk: Buffer) => {
        buffers.push(chunk);
        if (this.containsSpeech(chunk)) {
          hasSpeech = true;
          lastSpeech = Date.now();
          return;
        }

        if (hasSpeech && Date.now() - lastSpeech > this.options.silenceDurationMs) {
          finalize("silence");
          resolve(this.buildWave(buffers));
        }
      });

      audioStream.on("error", (error) => {
        finalize("error");
        reject(error);
      });

      this.stopTimer = setTimeout(() => {
        finalize("timeout");
        if (buffers.length === 0) {
          reject(new Error("Recorder timeout before audio was captured"));
          return;
        }
        resolve(this.buildWave(buffers));
      }, this.options.maxDurationMs);

      micInstance.start();
      this.emit("started");
    });
  }

  cancel() {
    if (!this.micInstance) return;
    this.micInstance.stop();
    this.micInstance = null;
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    this.emit("cancelled");
  }

  private containsSpeech(chunk: Buffer) {
    for (let offset = 0; offset < chunk.length; offset += 2) {
      const sample = chunk.readInt16LE(offset);
      if (Math.abs(sample) >= this.options.amplitudeThreshold) {
        return true;
      }
    }
    return false;
  }

  private buildWave(buffers: Buffer[]) {
    const pcm = Buffer.concat(buffers);
    return toWavBuffer(pcm, this.options.sampleRate);
  }
}

