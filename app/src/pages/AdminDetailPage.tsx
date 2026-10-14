import { useEffect, useState, type FormEvent } from "react";
import { assignees, categoryLabels, getInquiry, statuses, updateInquiry, type InquiryRecord, type InquiryStatus } from "../api";
import { formatDateTime } from "../format";

export function AdminDetailPage({ id }: { id: string }) {
  const [record, setRecord] = useState<InquiryRecord | null>();
  const [status, setStatus] = useState<InquiryStatus>("未対応");
  const [assignee, setAssignee] = useState("");
  const [memo, setMemo] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    getInquiry(id).then((r) => {
      setRecord(r ?? null);
      if (r) {
        setStatus(r.status);
        setAssignee(r.assignee);
        setMemo(r.memo);
      }
    });
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    await updateInquiry(id, { status, assignee, memo });
    setSaveState("saved");
  }

  if (record === undefined) return <main className="container wide">読み込み中…</main>;
  if (record === null) {
    return (
      <main className="container wide">
        <h1>問い合わせが見つかりません</h1>
        <a href="#/admin">一覧に戻る</a>
      </main>
    );
  }

  return (
    <main className="container wide">
      <a href="#/admin">← 一覧に戻る</a>
      <h1>問い合わせ No.{record.id}</h1>
      <dl className="detail-list">
        <dt>受付日時</dt>
        <dd>{formatDateTime(record.receivedAt)}</dd>
        <dt>お名前</dt>
        <dd>{record.name}</dd>
        <dt>メールアドレス</dt>
        <dd>{record.email}</dd>
        <dt>お問い合わせ種別</dt>
        <dd>{categoryLabels[record.category] ?? record.category}</dd>
        <dt>お問い合わせ内容</dt>
        <dd className="message">{record.message}</dd>
      </dl>

      <h2>対応</h2>
      <form onSubmit={handleSave}>
        <label>
          対応状況
          <select value={status} onChange={(e) => setStatus(e.target.value as InquiryStatus)}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          担当者
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">未割当</option>
            {assignees.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          対応メモ
          <textarea rows={4} value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
        <button type="submit" disabled={saveState === "saving"}>
          {saveState === "saving" ? "保存中…" : "保存する"}
        </button>
        {saveState === "saved" && (
          <p className="notice success" data-testid="saved-message">
            保存しました。
          </p>
        )}
      </form>
    </main>
  );
}
