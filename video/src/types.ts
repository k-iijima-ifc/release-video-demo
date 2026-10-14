// script.json の型。パイプライン（pipeline/）と動画（video/）で共有する

export type SceneId = "opening" | "summary" | "before_after" | "tests" | "closing";

export type TestResult = { case: string; pass: boolean };

export type Scene = {
  id: SceneId;
  narration: string;
  /** 画面に出す見出し（省略時はナレーションのみ） */
  heading?: string;
  /** summary：要点（3つまで） */
  points?: string[];
  /** summary：PixelLab に渡すアイコンの説明（英語） */
  icon?: string;
  /** tests：テスト結果 */
  results?: TestResult[];
};

export type ReleaseScript = {
  issueKey: string;
  issueUrl?: string;
  title: string;
  audience: string;
  scenes: Scene[];
};

/** 生成した素材のパス（assets/ からの相対パス）。パイプラインが埋める */
export type SceneAssets = {
  narration?: string;
  /** ナレーションの長さ（秒）。尺の計算に使う */
  narrationSeconds?: number;
  /** ナレーションの音量の倍率。生成された音声の大きさがまちまちなのでパイプラインがそろえる */
  narrationVolume?: number;
  icon?: string;
  beforeImage?: string;
  afterImage?: string;
};

export type ReleaseVideoProps = {
  script: ReleaseScript;
  assets: {
    openingVideo?: string;
    character?: string;
    bgm?: string;
    /** 全動画で共通の効果音 */
    sfx?: { opening?: string; success?: string };
    scenes: Partial<Record<SceneId, SceneAssets>>;
  };
};
