import { useEffect, useState } from "react";
import { categoryLabels, listInquiries, statuses, type InquiryRecord, type InquiryStatus } from "../api";
import { formatDateTime } from "../format";

/** 対応状況ごとのラベルの色（未対応＝赤、対応中＝黄、完了＝緑） */
const statusClassNames: Record<InquiryStatus, string> = {
  未対応: "status-open",
  対応中: "status-in-progress",
  完了: "status-done",
};

function StatusLabel({ status }: { status: InquiryStatus }) {
  return <span className={`status-label ${statusClassNames[status]}`}>{status}</span>;
}

export function AdminListPage() {
  const [records, setRecords] = useState<InquiryRecord[]>();

  useEffect(() => {
    listInquiries().then(setRecords);
  }, []);

  return (
    <main className="container wide">
      <h1>問い合わせ一覧</h1>
      {!records ? (
        <p>読み込み中…</p>
      ) : (
        <>
          <ul className="status-summary" aria-label="件数のまとめ">
            {statuses.map((status) => (
              <li key={status} data-testid={`status-count-${status}`}>
                <StatusLabel status={status} />
                {records.filter((r) => r.status === status).length}件
              </li>
            ))}
          </ul>
          <table className="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>受付日時</th>
                <th>お名前</th>
                <th>種別</th>
                <th>内容</th>
                <th>対応状況</th>
                <th>担当者</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                // 担当者が決まっていない未対応の問い合わせは目立たせる
                <tr key={r.id} className={r.status === "未対応" && !r.assignee ? "needs-attention" : undefined}>
                  <td>{r.id}</td>
                  <td>{formatDateTime(r.receivedAt)}</td>
                  <td>{r.name}</td>
                  <td>{categoryLabels[r.category] ?? r.category}</td>
                  <td>
                    <a href={`#/admin/inquiries/${r.id}`}>{r.message.length > 20 ? `${r.message.slice(0, 20)}…` : r.message}</a>
                  </td>
                  <td>
                    <StatusLabel status={r.status} />
                  </td>
                  <td>{r.assignee || "未割当"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
