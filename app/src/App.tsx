import { useState, type FormEvent, type ReactNode } from "react";
import { submitInquiry, type Inquiry } from "./api";

const emptyInquiry: Inquiry = { name: "", email: "", category: "", message: "" };

type Errors = Partial<Record<keyof Inquiry, string>>;
type Touched = Partial<Record<keyof Inquiry, boolean>>;

const requiredMessages: Record<keyof Inquiry, string> = {
  name: "お名前を入力してください。",
  email: "メールアドレスを入力してください。",
  category: "お問い合わせ種別を選択してください。",
  message: "お問い合わせ内容を入力してください。",
};

const allTouched: Touched = { name: true, email: true, category: true, message: true };

// api.ts の疑似サーバーと同じ基準でチェックする
function validateField(key: keyof Inquiry, value: string): string | undefined {
  if (value.trim() === "") return requiredMessages[key];
  if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "メールアドレスの形式が正しくありません（例：taro@example.com）。";
  }
  return undefined;
}

function validate(form: Inquiry): Errors {
  const errors: Errors = {};
  for (const key of Object.keys(requiredMessages) as (keyof Inquiry)[]) {
    const error = validateField(key, form[key]);
    if (error) errors[key] = error;
  }
  return errors;
}

type FieldProps = { name: keyof Inquiry; label: string; error?: string; children: ReactNode };

function Field({ name, label, error, children }: FieldProps) {
  return (
    <div className="field">
      <label>
        {label}
        {children}
      </label>
      {error && (
        <p className="field-error" id={`${name}-error`} data-testid={`${name}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export function App() {
  const [form, setForm] = useState<Inquiry>(emptyInquiry);
  const [touched, setTouched] = useState<Touched>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const errors = validate(form);
  const visibleError = (key: keyof Inquiry) => (touched[key] ? errors[key] : undefined);

  const update = (key: keyof Inquiry) => (value: string) => setForm({ ...form, [key]: value });
  // 入力を終えて次の項目に移ったときにメッセージを出す
  const fieldProps = (key: keyof Inquiry) => ({
    name: key,
    value: form[key],
    onBlur: () => setTouched((t) => ({ ...t, [key]: true })),
    "aria-invalid": visibleError(key) ? true : undefined,
    "aria-describedby": visibleError(key) ? `${key}-error` : undefined,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      setTouched(allTouched);
      return;
    }
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
        <Field name="name" label="お名前" error={visibleError("name")}>
          <input {...fieldProps("name")} onChange={(e) => update("name")(e.target.value)} />
        </Field>
        <Field name="email" label="メールアドレス" error={visibleError("email")}>
          <input {...fieldProps("email")} onChange={(e) => update("email")(e.target.value)} />
        </Field>
        <Field name="category" label="お問い合わせ種別" error={visibleError("category")}>
          <select {...fieldProps("category")} onChange={(e) => update("category")(e.target.value)}>
            <option value="">選択してください</option>
            <option value="product">製品について</option>
            <option value="estimate">お見積もり</option>
            <option value="other">その他</option>
          </select>
        </Field>
        <Field name="message" label="お問い合わせ内容" error={visibleError("message")}>
          <textarea rows={5} {...fieldProps("message")} onChange={(e) => update("message")(e.target.value)} />
        </Field>
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "送信中…" : "送信する"}
        </button>
      </form>
    </main>
  );
}
