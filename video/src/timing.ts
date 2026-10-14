import type { SceneId } from "./types";

export const FPS = 30;
export const DEFAULT_SCENE_SECONDS = 4;
/** ナレーションの後に残す余白（秒） */
export const SCENE_PADDING_SECONDS = 0.6;
/** オープニング映像を見せる最低の長さ（秒） */
export const OPENING_MIN_SECONDS = 4;
/** オープニングでナレーションを始めるまでの間（効果音を先に聞かせる） */
export const OPENING_NARRATION_DELAY = Math.round(FPS * 0.8);

/** シーンの頭からナレーションが始まるまでのコマ数 */
export const narrationDelay = (id: SceneId): number => (id === "opening" ? OPENING_NARRATION_DELAY : 0);
