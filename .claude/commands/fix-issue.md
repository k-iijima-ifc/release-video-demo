---
description: Backlogの課題を読んで実装し、PRを作る
argument-hint: <課題キー 例:DEMO-1>
---

Backlogの課題 $ARGUMENTS を対応してください。

1. Backlog MCP で課題 $ARGUMENTS の本文とコメントを読み、受け入れ条件を箇条書きで整理する
2. main から `feature/$ARGUMENTS` ブランチを作る
3. 実装し、受け入れ条件ごとに `app/tests/` へ Playwright のテストを追加する
4. `npm run typecheck` と `npm test` を通す
5. `[$ARGUMENTS]` を先頭に付けてコミットし、push して PR を作る（PR本文は CLAUDE.md のルールに従う）
6. 最後に、PRのURLと、確認したテストケースの一覧を報告する
