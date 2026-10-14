import { useRoute } from "./router";
import { InquiryFormPage } from "./pages/InquiryFormPage";
import { AdminListPage } from "./pages/AdminListPage";
import { AdminDetailPage } from "./pages/AdminDetailPage";

export function App() {
  const route = useRoute();
  return (
    <>
      <header className="site-header">
        <span className="site-name">サンプル株式会社</span>
        <nav>
          <a href="#/" aria-current={route.page === "form" ? "page" : undefined}>
            お問い合わせ
          </a>
          <a href="#/admin" aria-current={route.page !== "form" ? "page" : undefined}>
            問い合わせ管理
          </a>
        </nav>
      </header>
      {route.page === "form" && <InquiryFormPage />}
      {route.page === "admin-list" && <AdminListPage />}
      {route.page === "admin-detail" && <AdminDetailPage id={route.id} />}
    </>
  );
}
