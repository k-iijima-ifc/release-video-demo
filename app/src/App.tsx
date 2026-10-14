import { useState, type FormEvent } from "react";
import { submitInquiry, type Inquiry } from "./api";

const emptyInquiry: Inquiry = { name: "", email: "", category: "", message: "" };

export function App() {
  const [form, setForm] = useState<Inquiry>(emptyInquiry);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const update = (key: keyof Inquiry) => (value: string) => setForm({ ...form, [key]: value });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const result = await submitInquiry(form);
    setStatus(result.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <main className="container">
        <h1>お問い合わせ</h1>
        <p className="notice success" data-testid="done-message">
          お問い合わせを受け付けました。担当者からの連絡をお待ちください。
        </p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>お問い合わせ</h1>
      {status === "error" && (
        <p className="notice error" data-testid="error-message">
          送信に失敗しました。入力内容をご確認ください。
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <label>
          お名前
          <input name="name" value={form.name} onChange={(e) => update("name")(e.target.value)} />
        </label>
        <label>
          メールアドレス
          <input name="email" value={form.email} onChange={(e) => update("email")(e.target.value)} />
        </label>
        <label>
          お問い合わせ種別
          <select name="category" value={form.category} onChange={(e) => update("category")(e.target.value)}>
            <option value="">選択してください</option>
            <option value="product">製品について</option>
            <option value="estimate">お見積もり</option>
            <option value="other">その他</option>
          </select>
        </label>
        <label>
          お問い合わせ内容
          <textarea name="message" rows={5} value={form.message} onChange={(e) => update("message")(e.target.value)} />
        </label>
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "送信中…" : "送信する"}
        </button>
      </form>
    </main>
  );
}
