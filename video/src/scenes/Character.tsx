import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { CharacterSprites, Scene } from "../types";

type AnimationName = keyof CharacterSprites["animations"];

/** オープニングで画面の外から歩いてくる時間（秒） */
const WALK_IN_SECONDS = 1.5;
/** 表示サイズ。ドット絵がにじまないよう、元のコマ（160px）のちょうど2倍にする */
const SIZE = 320;
/** 字幕の右側にキャラを置くため、字幕の右に空ける幅（SceneView が使う） */
export const CHARACTER_SPACE = SIZE + 40;

/** シーンごとの動き。テストに不合格があれば喜ばずに説明を続ける */
function animationFor(scene: Scene, walking: boolean): AnimationName {
  switch (scene.id) {
    case "opening":
      return walking ? "walk" : "wave";
    case "summary":
      return "talk";
    case "before_after":
      return "point";
    case "tests":
      return scene.results?.every((r) => r.pass) ? "celebrate" : "talk";
    case "closing":
      return "wave";
  }
}

/** 案内役キャラ。PixelLab で作ったコマを順に表示して動かす */
export const Character = ({ sprites, scene }: { sprites: CharacterSprites; scene: Scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const walkFrames = Math.round(WALK_IN_SECONDS * fps);
  const walking = scene.id === "opening" && frame < walkFrames;

  const name = animationFor(scene, walking);
  const frames = sprites.animations[name] ?? sprites.animations.talk ?? Object.values(sprites.animations)[0];
  if (!frames?.length) return null;
  const index = Math.floor((frame * sprites.fps) / fps) % frames.length;

  // オープニングでは右の画面外から定位置まで歩いてくる
  const offsetX = scene.id === "opening" ? interpolate(frame, [0, walkFrames], [SIZE + 120, 0], { extrapolateRight: "clamp" }) : 0;

  return (
    <Img
      src={staticFile(frames[index])}
      style={{
        position: "absolute",
        right: 40,
        bottom: 24,
        width: SIZE,
        height: SIZE,
        objectFit: "contain",
        imageRendering: "pixelated",
        transform: `translateX(${offsetX}px)`,
      }}
    />
  );
};
