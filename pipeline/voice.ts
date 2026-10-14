// ElevenLabs でシーンごとのナレーション（文字ごとのタイムスタンプ付き）を作る
import { textToSpeech } from "./lib/elevenlabs";
import { measureAudio, normalizeGain } from "./lib/audio";
import { paths, readJson, saveAsset, updateManifest, writeJson, type PipelineContext } from "./lib/context";
import type { ReleaseScript } from "../video/src/types";
import { join } from "node:path";

export async function generateVoice(ctx: PipelineContext): Promise<void> {
  const script = readJson<ReleaseScript>(paths(ctx).script);
  for (const scene of script.scenes) {
    const speech = await textToSpeech(scene.speech ?? scene.narration);
    const narration = saveAsset(ctx, `narration-${scene.id}.mp3`, speech.audio);
    const level = measureAudio(join(ctx.publicDir, narration));
    const narrationVolume = normalizeGain(level);
    // 字幕の表示タイミングに使う（フェーズ3）
    writeJson(join(ctx.assetsDir, `narration-${scene.id}.alignment.json`), speech.alignment);
    updateManifest(ctx, (m) => {
      m.scenes[scene.id] = { ...m.scenes[scene.id], narration, narrationSeconds: speech.seconds, narrationVolume };
    });
    console.log(`  ${scene.id}: ${speech.seconds.toFixed(1)}秒（${speech.modelId}、ピーク ${level.peak}、音量 ×${narrationVolume}）`);
  }
}
