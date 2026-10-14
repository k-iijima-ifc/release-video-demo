# release-video-demo

Backlogの課題が完了したら、リリース紹介動画が自動でできるデモ。

## 構成

- `app/`：デモ対象の問い合わせフォーム（Vite + React）。テストは `app/tests/`（Playwright）
- `video/`：Remotion の動画テンプレート。`video/src/types.ts` が台本（script.json）の型
- `pipeline/`：動画生成のスクリプト。`npm run pipeline -- <課題キー> [ステップ名...]`
- `assets/`：Remotion の public ディレクトリ。事前に作った素材と `generated/<課題キー>/`

## 課題を対応するときのルール

- 課題は Backlog MCP（`backlog`）で読む。課題キーの形式は `AISTUDYDEMO-1`
- ブランチ名は `feature/<課題キー>`（例：`feature/AISTUDYDEMO-1`）。main に直接コミットしない
- コミットメッセージとPRタイトルの先頭に `[<課題キー>]` を付ける
- PR本文には次の3つを書く：課題へのリンク（`https://<BACKLOG_DOMAIN>/view/<課題キー>`）、変更内容（利用者から見た変化）、確認したテストケース
- PRを作る前に `npm run typecheck` と `npm test` を通す。テストケースは課題の受け入れ条件ごとに追加する
- 課題の対象が `app/` のときは `pipeline/`、`video/`、`.github/` を変更しない
- 判断に迷う仕様は勝手に決めず、PR本文の「確認したいこと」に書く

## 台本（script.json）を作るときのルール

- 読み手は利用部門。技術用語（バリデーション、コンポーネント等）は使わず、利用者から見た変化で書く
- 一文は40文字程度まで。ナレーション全体で300〜400文字
- 材料はPR差分、PR本文、課題、テスト結果だけ。書かれていないことは書かない
- 不合格のテストがあれば隠さずに含める
- 英字の略語や課題キーは読み方をかなで書く（例：`AISTUDYDEMO-1` →「エーアイ スタディ デモ イチ」）

## シークレット

- キーは `.env`（ローカル）と GitHub Secrets にだけ置く。`.env` を読んだり、キーの値を出力・コミットしたりしない
- 名前の一覧は `.env.example`
