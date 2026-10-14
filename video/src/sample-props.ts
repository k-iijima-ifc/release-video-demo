import type { ReleaseVideoProps } from "./types";

// Remotion Studio で確認するための見本。本番はパイプラインが out/props.json を作る
export const sampleProps: ReleaseVideoProps = {
  script: {
    issueKey: "AISTUDYDEMO-1",
    title: "問い合わせフォームに入力チェックを追加しました",
    audience: "利用部門",
    scenes: [
      { id: "opening", heading: "今週のリリース", narration: "今週のリリースのお知らせです。" },
      {
        id: "summary",
        heading: "何が変わったか",
        narration: "問い合わせフォームで、入力漏れやメールアドレスの誤りをその場でお知らせするようになりました。",
        points: ["入力漏れをその場でお知らせ", "メールアドレスの形式をチェック", "送信前に誤りに気づける"],
        icon: "shield with check mark",
      },
      {
        id: "before_after",
        heading: "変更前と変更後",
        narration: "これまでは送信後にエラーになっていましたが、今後は入力中に赤字で表示されます。",
      },
      {
        id: "tests",
        heading: "確認したこと",
        narration: "空欄や不正なメールアドレスなど、5つのパターンを確認済みです。",
        results: [
          { case: "必須項目が空欄", pass: true },
          { case: "メールアドレスの形式誤り", pass: true },
          { case: "正しい入力で送信", pass: true },
        ],
      },
      { id: "closing", heading: "詳しくはBacklogへ", narration: "詳しくはBacklogの課題、エーアイ スタディ デモ イチをご覧ください。" },
    ],
  },
  assets: { scenes: {} },
};
