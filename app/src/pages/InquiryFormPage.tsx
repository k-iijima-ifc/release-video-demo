import { useState, type FormEvent } from "react";
import { categoryLabels, submitInquiry, type Inquiry } from "../api";

const emptyInquiry: Inquiry = { name: "", email: "", category: "", message: "" };

export function InquiryFormPage() {
  const [form, setForm] = useState<Inquiry>(emptyInquiry);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const update = (key: keyof Inquiry) => (value: string) => setForm({ ...form, [key]: value });

  function handleConfirm(e: FormEvent) {
    e.preventDefault();
    setStep("confirm");
  }

  async function handleSubmit() {
    setStatus("sending");
    const result = await submitInquiry(form);
    setStatus(result.ok ? "done" : "error");
    // 入力に誤りがあれば、直せるように入力画面に戻す
    if (!result.ok) setStep("input");
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

  if (step === "confirm") {
    return (
      <main className="container">
        <h1>お問い合わせ内容の確認</h1>
        <p>以下の内容で送信します。よろしければ「送信する」を押してください。</p>
        <dl className="detail-list" data-testid="confirm-list">
          <dt>お名前</dt>
          <dd>{form.name}</dd>
          <dt>メールアドレス</dt>
          <dd>{form.email}</dd>
          <dt>お問い合わせ種別</dt>
          <dd>{categoryLabels[form.category] ?? form.category}</dd>
          <dt>お問い合わせ内容</dt>
          <dd className="message">{form.message}</dd>
        </dl>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => setStep("input")} disabled={status === "sending"}>
            修正する
          </button>
          <button type="button" onClick={handleSubmit} disabled={status === "sending"}>
            {status === "sending" ? "送信中…" : "送信する"}
          </button>
        </div>
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
      <form onSubmit={handleConfirm} noValidate>
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
        <button type="submit">入力内容を確認する</button>
      </form>
    </main>
  );
}
