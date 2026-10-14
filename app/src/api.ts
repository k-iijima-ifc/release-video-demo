export type Inquiry = {
  name: string;
  email: string;
  category: string;
  message: string;
};

// デモ用の疑似サーバー。送信して初めて入力の誤りがわかる（＝改善要望の対象）
export async function submitInquiry(inquiry: Inquiry): Promise<{ ok: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const filled = Object.values(inquiry).every((v) => v.trim() !== "");
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email);
  return { ok: filled && emailLooksValid };
}
