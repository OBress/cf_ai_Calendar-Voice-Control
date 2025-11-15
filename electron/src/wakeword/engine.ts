import { EventEmitter } from "node:events";
import mic from "mic";
import { Porcupine } from "@picovoice/porcupine-node";
import { logger } from "../logging/logger";

export interface WakeWordOptions {
  accessKey: string;
  keywordPath: string;
  sensitivity: number;
  modelPath?: string;
  device?: string;
}

export declare interface WakeWordEngine {
  on(event: "wakeword", listener: () => void): this;
  on(event: "error", listener: (error: Error) => void): this;
}

export class WakeWordEngine extends EventEmitter {
  private porcupine: Porcupine | null = null;
  private micInstance: ReturnType<typeof mic> | null = null;
  private active = false;
  private sampleBuffer: number[] = [];

  constructor(private readonly options: WakeWordOptions) {
    super();
  }

  get sampleRate() {
    return this.porcupine?.sampleRate ?? 16000;
  }

  async start() {
    if (this.active) return;
    await this.initPorcupine();
    this.startMic();
    this.active = true;
    logger.info("Wake-word engine started");
  }

  pause() {
    if (!this.active) return;
    this.stopMic();
    this.active = false;
  }

  async resume() {
    if (this.active) return;
    if (!this.porcupine) {
      await this.initPorcupine();
    }
    this.startMic();
    this.active = true;
  }

  shutdown() {
    this.stopMic();
    if (this.porcupine) {
      this.porcupine.release();
      this.porcupine = null;
    }
    this.sampleBuffer = [];
    this.active = false;
    logger.info("Wake-word engine stopped");
  }

  private async initPorcupine() {
    if (this.porcupine) return;

    try {
      this.porcupine = new Porcupine(
        this.options.accessKey,
        [this.options.keywordPath],
        [this.options.sensitivity],
        this.options.modelPath
      );
    } catch (error) {
      logger.error("Failed to initialize Porcupine", error);
      throw error;
    }

    logger.info(`Porcupine version ${this.porcupine.version} ready`);
  }

  private startMic() {
    if (!this.porcupine) {
      throw new Error("Porcupine is not initialized");
    }

    const micInstance = mic({
      rate: this.porcupine.sampleRate.toString(),
      channels: "1",
      bitwidth: "16",
      device: this.options.device,
      fileType: "raw"
    });

    this.micInstance = micInstance;
    const audioStream = micInstance.getAudioStream();

    audioStream.on("data", (chunk: Buffer) => this.handleChunk(chunk));

    audioStream.on("error", (error) => {
      logger.error("Wake-word microphone error", error);
      this.emit("error", error);
    });

    micInstance.start();
  }

  private stopMic() {
    if (!this.micInstance) return;
    this.micInstance.stop();
    this.micInstance = null;
    this.sampleBuffer = [];
  }

  private handleChunk(chunk: Buffer) {
    if (!this.porcupine) return;

    for (let offset = 0; offset < chunk.length; offset += 2) {
      this.sampleBuffer.push(chunk.readInt16LE(offset));
    }

    const frameLength = this.porcupine.frameLength;

    while (this.sampleBuffer.length >= frameLength) {
      const frame = Int16Array.from(this.sampleBuffer.slice(0, frameLength));
      this.sampleBuffer = this.sampleBuffer.slice(frameLength);
      const keywordIndex = this.porcupine.process(frame);
      if (keywordIndex >= 0) {
        logger.info("Wake-word detected");
        this.emit("wakeword");
      }
    }
  }
}

