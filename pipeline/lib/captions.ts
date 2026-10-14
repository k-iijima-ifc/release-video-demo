import type { Caption } from "../../video/src/types";
import type { Alignment } from "./elevenlabs";

/** 句点などで文に分ける */
function sentences(text: string): string[] {
  return (text.match(/[^。！？!?]+[。！？!?]?/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
}

/**
 * 字幕を1文ずつに分け、それぞれの表示開始時刻を読み上げのタイムスタンプから決める。
 * 表示用（display）と読み上げ用（speech）は読み方以外同じ文の並びなので、文の番号で対応させる
 */
export function buildCaptions(display: string, speech: string, alignment: Alignment): Caption[] {
  const shown = sentences(display);
  const spoken = sentences(speech);
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const total = ends[ends.length - 1] ?? 0;

  if (shown.length === spoken.length) {
    // 読み上げ文の先頭が、読み上げテキストの何文字目にあるかから開始時刻を引く
    const spokenText = alignment.characters.join("");
    let from = 0;
    return shown.map((text, i) => {
      const at = spokenText.indexOf(spoken[i], from);
      const index = at >= 0 ? at : from;
      from = index + spoken[i].length;
      return { text, start: starts[Math.min(index, starts.length - 1)] ?? 0 };
    });
  }

  // 文の数が合わないときは、文字数の割合で振り分ける
  const totalChars = shown.reduce((n, s) => n + s.length, 0);
  let before = 0;
  return shown.map((text) => {
    const start = (before / totalChars) * total;
    before += text.length;
    return { text, start };
  });
}
