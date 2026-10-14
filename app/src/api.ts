// デモ用の疑似サーバー。データはブラウザの localStorage に保存する（最初はサンプルの問い合わせが入っている）
import { seedInquiries } from "./seed";

export type Inquiry = {
  name: string;
  email: string;
  category: string;
  message: string;
};

export type InquiryStatus = "未対応" | "対応中" | "完了";

/** 管理画面で扱う問い合わせ */
export type InquiryRecord = Inquiry & {
  id: string;
  /** 受付日時（ISO 8601） */
  receivedAt: string;
  status: InquiryStatus;
  /** 担当者（未割当は空文字） */
  assignee: string;
  memo: string;
};

export const categoryLabels: Record<string, string> = {
  product: "製品について",
  estimate: "お見積もり",
  other: "その他",
};

export const statuses: InquiryStatus[] = ["未対応", "対応中", "完了"];
export const assignees = ["佐藤", "鈴木", "高橋"];

const STORAGE_KEY = "inquiries";
const wait = () => new Promise((resolve) => setTimeout(resolve, 400));

function load(): InquiryRecord[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? (JSON.parse(saved) as InquiryRecord[]) : seedInquiries;
}

function save(records: InquiryRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// 送信して初めて入力の誤りがわかる（＝改善要望の対象）
export async function submitInquiry(inquiry: Inquiry): Promise<{ ok: boolean }> {
  await wait();
  const filled = Object.values(inquiry).every((v) => v.trim() !== "");
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email);
  if (!filled || !emailLooksValid) return { ok: false };

  const records = load();
  const nextId = String(Math.max(...records.map((r) => Number(r.id))) + 1);
  save([...records, { ...inquiry, id: nextId, receivedAt: new Date().toISOString(), status: "未対応", assignee: "", memo: "" }]);
  return { ok: true };
}

/** 受付日時の新しい順 */
export async function listInquiries(): Promise<InquiryRecord[]> {
  return [...load()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export async function getInquiry(id: string): Promise<InquiryRecord | undefined> {
  return load().find((r) => r.id === id);
}

export async function updateInquiry(id: string, changes: Pick<InquiryRecord, "status" | "assignee" | "memo">): Promise<void> {
  await wait();
  save(load().map((r) => (r.id === id ? { ...r, ...changes } : r)));
}
