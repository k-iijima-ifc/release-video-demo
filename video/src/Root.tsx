import { Composition, type CalculateMetadataFunction } from "remotion";
import { ReleaseVideo, sceneDurationInFrames } from "./ReleaseVideo";
import { FPS } from "./timing";
import { sampleProps } from "./sample-props";
import type { ReleaseVideoProps } from "./types";

const calculateMetadata: CalculateMetadataFunction<ReleaseVideoProps> = ({ props }) => ({
  durationInFrames: props.script.scenes.reduce((sum, scene) => sum + sceneDurationInFrames(scene, props), 0),
});

export const RemotionRoot = () => (
  <Composition
    id="ReleaseVideo"
    component={ReleaseVideo}
    width={1920}
    height={1080}
    fps={FPS}
    durationInFrames={FPS * 30}
    defaultProps={sampleProps}
    calculateMetadata={calculateMetadata}
  />
);
