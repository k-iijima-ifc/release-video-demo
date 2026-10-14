// script.json の型。パイプライン（pipeline/）と動画（video/）で共有する

export type SceneId = "opening" | "summary" | "before_after" | "tests" | "closing";

export type TestResult = { case: string; pass: boolean };

export type Scene = {
  id: SceneId;
  /** ナレーションの文（字幕に表示する通常の表記） */
  narration: string;
  /** 読み上げ用の文。narration と同じ文の並びで、英字の略語や課題キーだけ読み方（カタカナ）にしたもの */
  speech?: string;
  /** 画面に出す見出し（省略時はナレーションのみ） */
  heading?: string;
  /** summary：要点（3つまで） */
  points?: string[];
  /** tests：表に出すテスト結果（不合格と、このPRで追加・変更したもの） */
  results?: TestResult[];
  /** tests：実行したテスト全体の件数（表に出さなかったものを「ほか◯件」として表示する） */
  testSummary?: { total: number; passed: number };
};

/**
 * 変更前と変更後の画面を撮るための操作（台本と一緒に Claude が考える。動画には出ない）。
 * 変更前の画面にない要素への操作は、撮影時にスキップされる
 */
export type CaptureStep =
  | { action: "goto"; path: string }
  | { action: "fill"; label: string; value: string; repeat?: number }
  | { action: "select"; label: string; value: string }
  | { action: "click"; text: string }
  | { action: "press"; key: string }
  | { action: "wait"; ms: number };

export type ReleaseScript = {
  issueKey: string;
  issueUrl?: string;
  title: string;
  audience: string;
  scenes: Scene[];
  capture?: CaptureStep[];
};

/** 字幕の1文と、ナレーションの頭からの表示開始時刻（秒） */
export type Caption = { text: string; start: number };

/** 生成した素材のパス（assets/ からの相対パス）。パイプラインが埋める */
export type SceneAssets = {
  narration?: string;
  /** ナレーションの長さ（秒）。尺の計算に使う */
  narrationSeconds?: number;
  /** ナレーションの音量の倍率。生成された音声の大きさがまちまちなのでパイプラインがそろえる */
  narrationVolume?: number;
  /** 読み上げに合わせて1文ずつ出す字幕（render が作る） */
  captions?: Caption[];
  beforeImage?: string;
  afterImage?: string;
};

export type CharacterAnimation = "walk" | "wave" | "talk" | "point" | "celebrate";

/** 案内役キャラのアニメーション（prepare-assets の animate で作る assets/character/animations.json） */
export type CharacterSprites = {
  characterId: string;
  /** 1秒あたりのコマ数 */
  fps: number;
  /** 動きの名前 → コマ画像のパス（public からの相対） */
  animations: Partial<Record<CharacterAnimation, string[]>>;
};

export type ReleaseVideoProps = {
  script: ReleaseScript;
  assets: {
    openingVideo?: string;
    character?: CharacterSprites;
    bgm?: string;
    /** 全動画で共通の効果音 */
    sfx?: { opening?: string; success?: string };
    scenes: Partial<Record<SceneId, SceneAssets>>;
  };
};
