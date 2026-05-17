import type { TimedAudioSegment } from "@/lib/audio/types";

/** MPEG1 Layer III bitrates (kbps) indexed by header nibble. */
const MPEG1_L3_BITRATE_KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];

const MPEG1_L3_SAMPLE_RATE_HZ = [44100, 48000, 32000, 0];

const MPEG2_L3_BITRATE_KBPS = [
  0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0,
];

const MPEG2_L3_SAMPLE_RATE_HZ = [22050, 24000, 16000, 0];

/**
 * Estimates MP3 duration by scanning sync frames (CBR/VBR-ish; good enough for TTS output).
 */
export function getMp3DurationSeconds(buffer: Buffer): number {
  if (!buffer.length) {
    return 0;
  }

  let offset = 0;
  let totalSeconds = 0;
  const maxScan = buffer.length;

  while (offset + 4 < maxScan) {
    if (buffer[offset] !== 0xff || (buffer[offset + 1]! & 0xe0) !== 0xe0) {
      offset++;
      continue;
    }

    const versionBits = (buffer[offset + 1]! >> 3) & 0x03;
    const layerBits = (buffer[offset + 1]! >> 1) & 0x03;
    const bitrateIndex = (buffer[offset + 2]! >> 4) & 0x0f;
    const sampleRateIndex = (buffer[offset + 2]! >> 2) & 0x03;
    const paddingBit = (buffer[offset + 2]! >> 1) & 0x01;

    if (layerBits !== 0x01 || bitrateIndex === 0 || bitrateIndex === 0x0f || sampleRateIndex === 0x03) {
      offset++;
      continue;
    }

    const isMpeg1 = versionBits === 0x03;
    const bitrateKbps = isMpeg1
      ? MPEG1_L3_BITRATE_KBPS[bitrateIndex]!
      : MPEG2_L3_BITRATE_KBPS[bitrateIndex]!;
    const sampleRateHz = isMpeg1
      ? MPEG1_L3_SAMPLE_RATE_HZ[sampleRateIndex]!
      : MPEG2_L3_SAMPLE_RATE_HZ[sampleRateIndex]!;

    if (!bitrateKbps || !sampleRateHz) {
      offset++;
      continue;
    }

    const samplesPerFrame = isMpeg1 ? 1152 : 576;
    const frameSize =
      Math.floor((samplesPerFrame / 8) * (bitrateKbps * 1000) / sampleRateHz) + (paddingBit ? 1 : 0);

    if (frameSize < 4) {
      offset++;
      continue;
    }

    totalSeconds += samplesPerFrame / sampleRateHz;
    offset += frameSize;
  }

  if (totalSeconds > 0) {
    return Math.max(1, Math.round(totalSeconds * 10) / 10);
  }

  return Math.max(0.5, Math.round(((buffer.length * 8) / 128_000) * 10) / 10);
}

export function measureMp3Buffer(buffer: Buffer): TimedAudioSegment {
  return {
    buffer,
    durationSeconds: getMp3DurationSeconds(buffer),
  };
}
