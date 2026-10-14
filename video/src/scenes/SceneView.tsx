import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption, ReleaseVideoProps, Scene } from "../types";
import { narrationDelay } from "../timing";
import { CHARACTER_SPACE } from "./Character";

/** オープニングのタイトルが1行に収まる文字の大きさ（右側はキャラの場所として空ける） */
const titleFontSize = (title: string, width: number) => Math.min(80, Math.floor(width / Math.max(title.length, 1)));

/** 読み上げ中の1文を返す（字幕の時刻がなければナレーション全体） */
function currentCaption(scene: Scene, captions: Caption[] | undefined, seconds: number): string {
  if (!captions?.length) return scene.narration;
  return [...captions].reverse().find((c) => c.start <= seconds)?.text ?? captions[0].text;
}

// フェーズ3で各シーンを作り込む。いまは素材の有無に応じて最低限の表示を行う
export const SceneView = ({ scene, props }: { scene: Scene; props: ReleaseVideoProps }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const { fps } = useVideoConfig();
  const assets = props.assets.scenes[scene.id] ?? {};
  const caption = currentCaption(scene, assets.captions, (frame - narrationDelay(scene.id)) / fps);

  if (scene.id === "opening" && props.assets.openingVideo) {
    return (
      <AbsoluteFill>
        <OffthreadVideo src={staticFile(props.assets.openingVideo)} muted style={{ objectFit: "cover" }} />
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: 96, background: "linear-gradient(transparent 50%, rgb(0 0 0 / 0.7))" }}>
          <div style={{ fontSize: 36, color: "#cbd5e1", opacity }}>{scene.heading}</div>
          <h1
            style={{
              fontSize: titleFontSize(props.script.title, 1920 - 192 - (props.assets.character ? CHARACTER_SPACE : 0)),
              margin: "8px 0 0",
              whiteSpace: "nowrap",
              opacity,
            }}
          >
            {props.script.title}
          </h1>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ padding: 96, opacity, justifyContent: "space-between" }}>
      <div style={{ fontSize: 32, color: "#94a3b8" }}>
        {props.script.issueKey}｜{props.script.title}
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "center", flex: 1 }}>
        <div style={{ flex: 1 }}>
          {scene.heading && <h1 style={{ fontSize: 72, margin: "0 0 32px" }}>{scene.heading}</h1>}
          {scene.points && (
            <ul style={{ fontSize: 44, lineHeight: 1.6 }}>
              {scene.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {scene.results && (
            <table style={{ fontSize: 40, borderSpacing: "32px 12px" }}>
              <tbody>
                {scene.results.map((r) => (
                  <tr key={r.case}>
                    <td>{r.case}</td>
                    <td style={{ color: r.pass ? "#4ade80" : "#f87171", fontWeight: 700 }}>{r.pass ? "合格" : "不合格"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {assets.beforeImage && assets.afterImage && (
            <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
              {[
                { label: "変更前", src: assets.beforeImage, color: "#94a3b8" },
                { label: "変更後", src: assets.afterImage, color: "#4ade80" },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: s.color, marginBottom: 12 }}>{s.label}</div>
                  <Img src={staticFile(s.src)} style={{ width: "100%", maxHeight: 440, objectFit: "contain", objectPosition: "top", borderRadius: 12 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 40, lineHeight: 1.5, marginRight: props.assets.character ? CHARACTER_SPACE - 96 : 0, background: "rgb(0 0 0 / 0.45)", padding: "16px 24px", borderRadius: 12 }}>
        {caption}
      </div>
    </AbsoluteFill>
  );
};
