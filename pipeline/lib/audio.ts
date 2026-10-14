import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./exec";

/** ナレーションの目標の音量（RMS、16bit の振幅）。約 -21 dBFS */
const TARGET_RMS = 3000;
/** 音割れを防ぐため、ピークをここまでに抑える（約 -1 dBFS） */
const MAX_PEAK = 0.9 * 32767;

/** 音声ファイルの音量（ピークとRMS）を測る。Remotion 同梱の ffmpeg で WAV に変換して読む */
export function measureAudio(path: string): { peak: number; rms: number } {
  const dir = mkdtempSync(join(tmpdir(), "audio-"));
  const wav = join(dir, "audio.wav");
  try {
    run("npx", ["remotion", "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y", "-i", path, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const buf = readFileSync(wav);
    const dataAt = buf.indexOf("data") + 8;
    let peak = 0;
    let sum = 0;
    const count = (buf.length - dataAt) >> 1;
    for (let i = 0; i < count; i++) {
      const v = buf.readInt16LE(dataAt + i * 2);
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
    }
    return { peak, rms: Math.sqrt(sum / Math.max(count, 1)) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** 目標の音量にそろえるための倍率（Remotion の volume に渡す） */
export function normalizeGain({ peak, rms }: { peak: number; rms: number }): number {
  if (peak === 0 || rms === 0) return 1;
  const gain = Math.min(TARGET_RMS / rms, MAX_PEAK / peak);
  return Math.round(gain * 100) / 100;
}
