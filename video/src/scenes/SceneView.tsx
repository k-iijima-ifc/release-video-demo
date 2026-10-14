import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { ReleaseVideoProps, Scene } from "../types";

// フェーズ3で各シーンを作り込む。いまは素材の有無に応じて最低限の表示を行う
export const SceneView = ({ scene, props }: { scene: Scene; props: ReleaseVideoProps }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const assets = props.assets.scenes[scene.id] ?? {};

  if (scene.id === "opening" && props.assets.openingVideo) {
    return <OffthreadVideo src={staticFile(props.assets.openingVideo)} muted />;
  }

  return (
    <AbsoluteFill style={{ padding: 96, opacity, justifyContent: "space-between" }}>
      <div style={{ fontSize: 32, color: "#94a3b8" }}>
        {props.script.issueKey}｜{props.script.title}
      </div>

      <div style={{ display: "flex", gap: 48, alignItems: "center", flex: 1 }}>
        {assets.icon && <Img src={staticFile(assets.icon)} style={{ width: 240, imageRendering: "pixelated" }} />}
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
            <div style={{ display: "flex", gap: 32 }}>
              <Img src={staticFile(assets.beforeImage)} style={{ width: "50%" }} />
              <Img src={staticFile(assets.afterImage)} style={{ width: "50%" }} />
            </div>
          )}
        </div>
        {props.assets.character && (
          <Img src={staticFile(props.assets.character)} style={{ width: 200, imageRendering: "pixelated" }} />
        )}
      </div>

      <div style={{ fontSize: 40, lineHeight: 1.5, background: "rgb(0 0 0 / 0.45)", padding: "16px 24px", borderRadius: 12 }}>
        {scene.narration}
      </div>
    </AbsoluteFill>
  );
};
