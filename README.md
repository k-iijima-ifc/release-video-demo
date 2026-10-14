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
| create-demo-issue | 手動 | デモ用の改善要望をBacklogに起票（リハーサルのたびに使える） |
| release-video | `feature/<課題キー>` のPRのマージ、または手動 | 動画生成。自動実行は Variables の `RELEASE_VIDEO_ENABLED=true` のときだけ |

## ライセンス上の注意

Remotion は一定規模以上の会社での利用に会社ライセンスが必要。利用前に https://www.remotion.dev/license を確認すること。
