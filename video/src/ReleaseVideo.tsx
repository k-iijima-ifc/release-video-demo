import { AbsoluteFill, Audio, Sequence, Series, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/NotoSansJP";
import type { ReleaseVideoProps, Scene } from "./types";
import { SceneView } from "./scenes/SceneView";
import { Character } from "./scenes/Character";

import { DEFAULT_SCENE_SECONDS, FPS, OPENING_MIN_SECONDS, SCENE_PADDING_SECONDS, narrationDelay } from "./timing";

const { fontFamily } = loadFont("normal", { weights: ["400", "700"], subsets: ["japanese", "latin"] });

export function sceneDurationInFrames(scene: Scene, props: ReleaseVideoProps): number {
  const seconds = props.assets.scenes[scene.id]?.narrationSeconds;
  const delay = narrationDelay(scene.id) / FPS;
  const base = seconds ? delay + seconds + SCENE_PADDING_SECONDS : DEFAULT_SCENE_SECONDS;
  const min = scene.id === "opening" && props.assets.openingVideo ? OPENING_MIN_SECONDS : 0;
  return Math.ceil(FPS * Math.max(base, min));
}

export const ReleaseVideo = (props: ReleaseVideoProps) => (
  <AbsoluteFill style={{ fontFamily, backgroundColor: "#0f172a", color: "#f8fafc" }}>
    {props.assets.bgm && <Audio src={staticFile(props.assets.bgm)} volume={0.15} />}
    <Series>
      {props.script.scenes.map((scene) => {
        const { narration, narrationVolume = 1 } = props.assets.scenes[scene.id] ?? {};
        const sfx = scene.id === "opening" ? props.assets.sfx?.opening : scene.id === "tests" ? props.assets.sfx?.success : undefined;
        return (
          <Series.Sequence key={scene.id} durationInFrames={sceneDurationInFrames(scene, props)}>
            <SceneView scene={scene} props={props} />
            {props.assets.character && <Character sprites={props.assets.character} scene={scene} />}
            {sfx && <Audio src={staticFile(sfx)} volume={0.5} />}
            {narration && (
              <Sequence from={narrationDelay(scene.id)}>
                <Audio src={staticFile(narration)} volume={narrationVolume} />
              </Sequence>
            )}
          </Series.Sequence>
        );
      })}
    </Series>
  </AbsoluteFill>
);
