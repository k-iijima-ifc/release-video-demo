import { useEffect, useState } from "react";
import { categoryLabels, listInquiries, type InquiryRecord } from "../api";
import { formatDateTime } from "../format";

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
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{formatDateTime(r.receivedAt)}</td>
                <td>{r.name}</td>
                <td>{categoryLabels[r.category] ?? r.category}</td>
                <td>
                  <a href={`#/admin/inquiries/${r.id}`}>{r.message.length > 20 ? `${r.message.slice(0, 20)}…` : r.message}</a>
                </td>
                <td>{r.status}</td>
                <td>{r.assignee || "未割当"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
