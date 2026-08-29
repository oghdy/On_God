import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/require-admin";

import { signOut } from "../login/actions";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", ready: true },
  { href: "/songs/new", label: "곡 등록", ready: true },
  { href: "#", label: "검수 큐 (준비중)", ready: false },
  { href: "#", label: "예약 발행 (준비중)", ready: false },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, borderRight: "1px solid #e5e5e5", padding: 16 }}>
        <p style={{ fontWeight: 600 }}>OnGod Admin</p>
        <nav style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          {NAV_ITEMS.map((item) =>
            item.ready ? (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ) : (
              <span key={item.label} style={{ color: "#999" }}>
                {item.label}
              </span>
            ),
          )}
        </nav>
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 12, color: "#666", wordBreak: "break-all" }}>{user.email}</p>
          <form action={signOut}>
            <button type="submit">로그아웃</button>
          </form>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
