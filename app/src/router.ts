import { useEffect, useState } from "react";

export type Route =
  | { page: "form" }
  | { page: "admin-list" }
  | { page: "admin-detail"; id: string };

/** URL の # 以降で画面を切り替える（#/ お問い合わせ、#/admin 一覧、#/admin/inquiries/:id 詳細） */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, "") || "/";
  const detail = path.match(/^\/admin\/inquiries\/([^/]+)$/);
  if (detail) return { page: "admin-detail", id: detail[1] };
  if (path === "/admin") return { page: "admin-list" };
  return { page: "form" };
}

export function useRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return parseRoute(hash);
}
