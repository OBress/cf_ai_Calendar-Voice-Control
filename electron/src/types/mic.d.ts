declare module "mic" {
  import { Readable } from "node:stream";

  interface MicOptions {
    rate?: string;
    bitwidth?: string;
    channels?: string;
    device?: string;
    fileType?: string;
    exitOnSilence?: number;
  }

  interface MicInstance {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    getAudioStream(): Readable;
  }

  export default function mic(options?: MicOptions): MicInstance;
}

