# release-video-demo

Backlogの課題が完了したら、リリース紹介動画が自動でできるデモ。社内勉強会「今どきツール最前線」用。

```
Backlog 課題 → Claude Code が実装して PR → マージ
  → GitHub Actions：Claude Code が台本 → ElevenLabs（声）／PixelLab（ドット絵）／Runway（映像）
  → Remotion で動画に → Backlog に添付して完了
```

## セットアップ

```sh
npm ci
npx playwright install chromium
cp .env.example .env   # 値を入れる
npm run check:env      # 各APIに疎通できるか確認（クレジットは消費しない）
```

GitHub 側は Settings → Secrets and variables → Actions に、`.env.example` と同じ名前で登録する。
登録後、Actions の **check-env** を手動実行して確認する。

## よく使うコマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 問い合わせフォームを起動（http://localhost:5173） |
| `npm test` | Playwright のテスト |
| `npm run video:studio` | Remotion Studio で動画テンプレートを確認 |
| `npm run pipeline -- AISTUDYDEMO-1` | 動画生成パイプラインを手元で実行 |
| `npm run pipeline -- AISTUDYDEMO-1 script voice` | 一部のステップだけ実行 |

Claude Code では `/fix-issue AISTUDYDEMO-1`（課題を実装してPR作成）と `/release-video AISTUDYDEMO-1`（手元で動画生成）が使える。

## ワークフロー

| 名前 | きっかけ | 内容 |
|---|---|---|
| ci | PR、main への push | 型チェックとテスト |
| check-env | 手動 | Secrets / Variables の疎通確認 |
| create-demo-issue | 手動（パターンを選ぶ） | デモ用の改善要望をBacklogに起票（リハーサルのたびに使える） |
| fix-issue | 手動（課題キーを指定） | Claude Code が課題を読んで実装し、PRを作る（/fix-issue のクラウド版） |
| release-video | `feature/<課題キー>` のPRのマージ、または手動 | 動画生成。自動実行は Variables の `RELEASE_VIDEO_ENABLED=true` のときだけ |

## デモの改善要望パターン

`pipeline/demo-issues.ts` に定義。どれも改善前のアプリ（タグ `demo-baseline`）に対して独立に対応できる。
アプリには、お客様向けのお問い合わせフォーム（`#/`）と、社内向けの問い合わせ一覧（`#/admin`）・詳細（`#/admin/inquiries/:id`）がある。

| パターン | 課題の件名 | 動画で見える変化 |
|---|---|---|
| input-check | 問い合わせフォームに入力チェックを追加 | 誤りが各項目の下に赤字で出る |
| confirm | 問い合わせフォームに送信前の確認画面を追加 | 送信前に入力内容の確認画面が出る |
| counter | お問い合わせ内容の欄に残り文字数を表示 | 残り文字数が出て、超えると赤字になる |
| receipt | 送信完了画面に受付番号と送信内容の控えを表示 | 完了画面に受付番号と控えが出る |
| admin-search | 問い合わせ一覧に検索と対応状況の絞り込みを追加 | 一覧をキーワードと対応状況で絞り込める |
| admin-status | 問い合わせ一覧で対応状況をひと目でわかるようにする | 色付きラベルと件数、未対応・未割当の行が目立つ |

変更前と変更後の画面写真を撮る操作は、台本と一緒に Claude が変更内容から考える（`script.json` の `capture`）。

別のパターンを試す前に、アプリを改善前に戻す（`git checkout demo-baseline -- app` をPRにしてマージする）。

## ライセンス上の注意

Remotion は一定規模以上の会社での利用に会社ライセンスが必要。利用前に https://www.remotion.dev/license を確認すること。
