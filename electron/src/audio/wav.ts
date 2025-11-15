const RIFF_HEADER_SIZE = 44;

export const toWavBuffer = (pcmBuffer: Buffer, sampleRate: number) => {
  const byteRate = sampleRate * 2;
  const blockAlign = 2;
  const wavBuffer = Buffer.alloc(RIFF_HEADER_SIZE);

  wavBuffer.write("RIFF", 0);
  wavBuffer.writeUInt32LE(pcmBuffer.length + 36, 4);
  wavBuffer.write("WAVE", 8);
  wavBuffer.write("fmt ", 12);
  wavBuffer.writeUInt32LE(16, 16); // PCM chunk size
  wavBuffer.writeUInt16LE(1, 20); // PCM format
  wavBuffer.writeUInt16LE(1, 22); // mono
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(16, 34); // bits per sample
  wavBuffer.write("data", 36);
  wavBuffer.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavBuffer, pcmBuffer]);
};

