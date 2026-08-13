"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/lib/AppDataContext";

const SUBMENU_ITEMS = [
  { href: "/leads", label: "NuSpa Aday Üye" },
  { href: "/calendar", label: "Takvim" },
  { href: "/lost-leads", label: "Üzerimden Giden Leadler" },
];

const SYSADMIN_ITEMS = [
  { href: "/admin/sources", label: "Kaynaklar" },
  { href: "/admin/reject-reasons", label: "Ret Tanımları" },
  { href: "/admin/task-types", label: "Görevler" },
  { href: "/admin/closure-reasons", label: "Neden Kodları" },
  { href: "/admin/locations", label: "Lokasyon & Tier Yönetimi" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reps, currentRepId, setCurrentRepId, ready, error } = useAppData();
  const [sysadminOpen, setSysadminOpen] = useState(true);

  const currentRep = reps.find((r) => r.id === currentRepId);
  const isNuspaScreen = pathname.startsWith("/leads") || pathname.startsWith("/calendar") || pathname.startsWith("/lost-leads") || pathname.startsWith("/admin");

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="logo">
          MAC<span className="plus">+</span>
        </div>
        <nav>
          <div className="menu-item">
            <span className="icon">👥</span>
            <span className="label">Aday Üye</span>
            <span className="chevron">›</span>
          </div>
          <div className="menu-item">
            <span className="icon">👤</span>
            <span className="label">Ön Aday Üye</span>
          </div>

          <div className="module-block">
            <div className={`menu-item${isNuspaScreen ? " active-parent" : ""}`}>
              <span className="icon">🧖</span>
              <span className="label">NuSpa</span>
              <span className="chevron">▾</span>
            </div>
            <div className="submenu">
              {SUBMENU_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={`submenu-item${pathname === item.href ? " active" : ""}`}>
                  {item.label}
                </Link>
              ))}
              <div className="submenu-item" onClick={() => setSysadminOpen((v) => !v)}>
                Sistem Yönetimi <span className="chevron">{sysadminOpen ? "⌄" : "›"}</span>
              </div>
            </div>
            {sysadminOpen && (
              <div className="subsubmenu">
                {SYSADMIN_ITEMS.map((item) => (
                  <Link key={item.href} href={item.href} className={`subsubmenu-item${pathname === item.href ? " active" : ""}`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="menu-item">
            <span className="icon">👤</span>
            <span className="label">Üyelik İşlemleri</span>
            <span className="chevron">›</span>
          </div>
          <div className="menu-item">
            <span className="icon">🎁</span>
            <span className="label">Kampanya İşlemleri</span>
            <span className="chevron">›</span>
          </div>
          <div className="menu-item">
            <span className="icon">💳</span>
            <span className="label">Borçlu Üye Tahsilatı</span>
          </div>
          <div className="menu-item">
            <span className="icon">✅</span>
            <span className="label">Üye Bilgisi Güncelleme</span>
          </div>
          <div className="menu-item">
            <span className="icon">🔒</span>
            <span className="label">Yetkilendirme</span>
            <span className="chevron">›</span>
          </div>
        </nav>
      </aside>

      <main className="content-area">
        <div className="topbar">
          <button className="hamburger">☰</button>
          <div className="user-chip">
            <div className="avatar">👤</div>
            <div>
              <strong>{currentRep ? currentRep.name : "Yükleniyor..."}</strong>
              <small>{currentRep ? currentRep.role : ""}</small>
            </div>
            <select
              value={currentRepId ?? ""}
              onChange={(e) => setCurrentRepId(Number(e.target.value))}
            >
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="content">
          {!ready && !error && <div className="empty-state">Yükleniyor...</div>}
          {error && (
            <div className="empty-state">
              Uygulama başlatılamadı: {error}
              <br />
              Sunucunun çalıştığından emin olun (npm run dev).
            </div>
          )}
          {ready && children}
        </div>
      </main>
    </div>
  );
}
