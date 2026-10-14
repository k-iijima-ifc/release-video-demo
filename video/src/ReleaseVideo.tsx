import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";
import type { ReleaseVideoProps, Scene } from "./types";
import { SceneView } from "./scenes/SceneView";

export const FPS = 30;
const DEFAULT_SCENE_SECONDS = 4;
/** ナレーションの後に残す余白（秒） */
const SCENE_PADDING_SECONDS = 0.6;

const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["japanese", "latin"] });

export function sceneDurationInFrames(scene: Scene, props: ReleaseVideoProps): number {
  const seconds = props.assets.scenes[scene.id]?.narrationSeconds;
  return Math.ceil(FPS * (seconds ? seconds + SCENE_PADDING_SECONDS : DEFAULT_SCENE_SECONDS));
}

export const ReleaseVideo = (props: ReleaseVideoProps) => (
  <AbsoluteFill style={{ fontFamily, backgroundColor: "#0f172a", color: "#f8fafc" }}>
    {props.assets.bgm && <Audio src={staticFile(props.assets.bgm)} volume={0.15} />}
    <Series>
      {props.script.scenes.map((scene) => {
        const narration = props.assets.scenes[scene.id]?.narration;
        return (
          <Series.Sequence key={scene.id} durationInFrames={sceneDurationInFrames(scene, props)}>
            <SceneView scene={scene} props={props} />
            {narration && <Audio src={staticFile(narration)} />}
          </Series.Sequence>
        );
      })}
    </Series>
  </AbsoluteFill>
);
