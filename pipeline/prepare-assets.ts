// 全動画で共通の素材を事前に1回だけ作る（案内役キャラ、オープニング映像、効果音）。
// 使い方: npm run prepare-assets [character] [opening] [sfx]（省略時はすべて）
// できたファイルは assets/ に保存される。見た目を確かめてからコミットする
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import "./lib/env";
import { pixflux } from "./lib/pixellab";
import { generateOpeningVideo } from "./lib/runway";
import { soundEffect } from "./lib/elevenlabs";

const PUBLIC_DIR = "assets";

function save(fileName: string, data: Buffer): void {
  const path = join(PUBLIC_DIR, fileName);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`  ${path}（${Math.round(data.length / 1024)} KB）`);
}

const tasks: Record<string, () => Promise<void>> = {
  async character() {
    // 候補を3体作り、気に入ったものを character.png にする
    for (const seed of [11, 22, 33]) {
      const png = await pixflux(
        "cute friendly small robot mascot, office guide, waving one hand, round head with antenna, blue and white body, smiling face, full body, front view",
        { width: 128, height: 128, seed },
      );
      save(`candidates/character-${seed}.png`, png);
    }
  },
  async opening() {
    const { image, video } = await generateOpeningVideo();
    save("opening-key.png", image);
    save("opening.mp4", video);
  },
  async sfx() {
    save("sfx/opening.mp3", await soundEffect("bright short cinematic whoosh transition with soft sparkle chime", 2));
    save("sfx/success.mp3", await soundEffect("short pleasant success chime, two rising notes, clean UI sound", 1));
  },
};

const only = process.argv.slice(2);
for (const [name, task] of Object.entries(tasks)) {
  if (only.length > 0 && !only.includes(name)) continue;
  console.log(`▶ ${name}`);
  await task();
}
