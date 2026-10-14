// 全動画で共通の素材を事前に1回だけ作る（案内役キャラとその動き、オープニング映像、効果音）。
// 使い方: npm run prepare-assets [character] [animate] [opening] [sfx]（省略時はすべて）
//   character: キャラの候補を3体作る → 選んだものを assets/character.png に置く
//   animate  : assets/character.png に PixelLab で動きを付け、assets/character/ にコマを並べる
// できたファイルは assets/ に保存される。見た目を確かめてからコミットする
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { unzipSync } from "fflate";
import "./lib/env";
import { animateCharacter, createCharacter, downloadCharacterZip, pixflux, type AnimationSpec } from "./lib/pixellab";
import type { CharacterAnimation, CharacterSprites } from "../video/src/types";
import { generateOpeningVideo } from "./lib/runway";
import { soundEffect } from "./lib/elevenlabs";

const PUBLIC_DIR = "assets";
const CHARACTER_DIR = "character";
const CHARACTER_JSON = join(PUBLIC_DIR, CHARACTER_DIR, "animations.json");
const CHARACTER_DESCRIPTION = "cute friendly small robot mascot, round head with antenna, blue and white body";

/** 案内役キャラの動き。シーンとの対応は video/src/scenes/Character.tsx */
const ANIMATIONS: (AnimationSpec & { name: CharacterAnimation })[] = [
  { name: "walk", action: "walking", direction: "west", frames: 8 },
  { name: "wave", action: "waving one hand hello, friendly", direction: "south", frames: 8 },
  { name: "talk", action: "talking and explaining, gesturing with one hand", direction: "south", frames: 8 },
  { name: "point", action: "pointing forward with one arm extended", direction: "west", frames: 8 },
  { name: "celebrate", action: "jumping with joy, both arms raised", direction: "south", frames: 8 },
];

function save(fileName: string, data: Buffer): void {
  const path = join(PUBLIC_DIR, fileName);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`  ${path}（${Math.round(data.length / 1024)} KB）`);
}

/** PixelLab の ZIP からアニメーションのコマを取り出し、assets/character/ に並べる */
function extractCharacter(zip: Buffer, characterId: string): CharacterSprites {
  const files = unzipSync(new Uint8Array(zip));
  const names = Object.keys(files);
  console.log(`  ZIP の中身: ${names.filter((n) => !n.endsWith("/")).length} ファイル`);
  rmSync(join(PUBLIC_DIR, CHARACTER_DIR), { recursive: true, force: true });

  const animations: CharacterSprites["animations"] = {};
  for (const spec of ANIMATIONS) {
    const pattern = new RegExp(`animations/([^/]+)/${spec.direction}/(frame_\\d+\\.png)$`);
    const frames = names
      .map((n) => ({ n, m: n.match(pattern) }))
      .filter((x) => x.m && x.m[1].toLowerCase().includes(spec.name))
      .sort((a, b) => a.n.localeCompare(b.n));
    if (frames.length === 0) {
      console.warn(`  ${spec.name} のコマが見つかりません。ZIP 内のアニメーション: ${[...new Set(names.map((n) => n.split("/")[1]))].join(", ")}`);
      continue;
    }
    animations[spec.name] = frames.map(({ n, m }) => {
      const fileName = `${CHARACTER_DIR}/${spec.name}/${m![2]}`;
      save(fileName, Buffer.from(files[n]));
      return fileName;
    });
  }
  const sprites: CharacterSprites = { characterId, fps: 8, animations };
  writeFileSync(CHARACTER_JSON, JSON.stringify(sprites, null, 2) + "\n");
  return sprites;
}

const tasks: Record<string, () => Promise<void>> = {
  /** 案内役キャラに動きを付ける（assets/character.png を元に PixelLab のキャラクターを作る） */
  async animate() {
    const existing = existsSync(CHARACTER_JSON) ? (JSON.parse(readFileSync(CHARACTER_JSON, "utf8")) as CharacterSprites) : undefined;
    let characterId = process.env.PIXELLAB_CHARACTER_ID || existing?.characterId;
    if (!characterId) {
      console.log("  キャラクターを作成中…");
      characterId = await createCharacter(readFileSync(join(PUBLIC_DIR, "character.png")), CHARACTER_DESCRIPTION);
    }
    console.log(`  キャラクター ID: ${characterId}`);
    for (const spec of ANIMATIONS) {
      if (existing?.animations[spec.name]) continue;
      console.log(`  アニメーション ${spec.name} を生成中…`);
      await animateCharacter(characterId, spec);
    }
    const zip = await downloadCharacterZip(characterId);
    save("candidates/character.zip", zip);
    const sprites = extractCharacter(zip, characterId);
    console.log(`  ${Object.entries(sprites.animations).map(([k, v]) => `${k}=${v.length}コマ`).join("、")}`);
  },
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
