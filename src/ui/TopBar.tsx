import React, { useState, useRef, useEffect, useCallback } from "react";
import type { UserRole } from "../types";

const NAV_TABS = [
  { id: "patients",     label: "Patients",     icon: "ti-users" },
  { id: "appointments", label: "Appointments", icon: "ti-calendar" },
  { id: "billing",      label: "Billing",      icon: "ti-receipt" },
  { id: "reports",      label: "Reports",      icon: "ti-chart-bar" },
  { id: "settings",     label: "Settings",     icon: "ti-settings" },
] as const;

export type NavTab = typeof NAV_TABS[number]["id"];

const ROLE_DISPLAY: Record<UserRole, { name: string; initials: string; color: string }> = {
  receptionist: { name: "Front Desk",  initials: "FD", color: "#7c3aed" },
  doctor:       { name: "Dr. Sharma",  initials: "DS", color: "#2563eb" },
  admin:        { name: "Admin",       initials: "AD", color: "#0891b2" },
};

export interface NotificationItem {
  id: string;
  type: "critical" | "urgent";
  message: string;
  detail?: string;
  timestamp: string;
}

interface TopBarProps {
  dark: boolean;
  setDark: (d: boolean) => void;
  activeTab: NavTab;
  setActiveTab: (t: NavTab) => void;
  userRole: UserRole;
  setUserRole: (r: UserRole) => void;
  onSearch?: (query: string) => void;
  stats: {
    total: number;
    active: number;
    followUpDue: number;
    newPatients: number;
    insExpiring: number;
    criticalAlerts: number;
  };
  notifications?: NotificationItem[];
  onDismissNotification?: (id: string) => void;
}

// ─── Focus trap for dialogs ───────────────────────────────────────────────────
function useFocusTrap(active: boolean, ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener("keydown", trap);
    return () => el.removeEventListener("keydown", trap);
  }, [active, ref]);
}

// ─── Close on outside click ───────────────────────────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement>, cb: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, cb, active]);
}

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Badge({
  count, variant, label,
}: { count: number; variant: "critical" | "urgent"; label: string }) {
  const isCrit = variant === "critical";
  return (
    <span
      aria-live="polite"
      aria-label={`${count} ${label}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 9px", borderRadius: 99,
        fontSize: 11, fontWeight: 700, letterSpacing: "0.02em",
        background: isCrit ? "var(--red-bg)"   : "var(--amber-bg)",
        border:     `1px solid ${isCrit ? "var(--red-border)" : "var(--amber-border)"}`,
        color:      isCrit ? "var(--red)"       : "var(--amber)",
        lineHeight: 1.4,
      }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
        background: isCrit ? "var(--red)" : "var(--amber)",
      }} aria-hidden="true" />
      {count} {label}
    </span>
  );
}

// ─── Notification dropdown ────────────────────────────────────────────────────
function NotificationDropdown({
  items,
  onDismiss,
  onClose,
  dark,
}: {
  items: NotificationItem[];
  onDismiss: (id: string) => void;
  onClose: () => void;
  dark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(true, ref as React.RefObject<HTMLElement>);
  useClickOutside(ref as React.RefObject<HTMLElement>, onClose, true);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const criticals = items.filter(n => n.type === "critical");
  const urgents   = items.filter(n => n.type === "urgent");

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      aria-modal="true"
      style={{
        position: "absolute", top: "calc(100% + 8px)", right: 0,
        width: 340, maxHeight: 480, overflowY: "auto",
        background: dark ? "#111827" : "#fff",
        border: "1px solid var(--border)",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
        zIndex: 300,
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 10px",
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0,
        background: dark ? "#111827" : "#fff",
        backdropFilter: "blur(8px)",
      }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
        {items.length > 0 && (
          <button
            onClick={() => items.forEach(n => onDismiss(n.id))}
            style={{
              fontSize: 11, fontWeight: 600, color: "var(--accent)",
              background: "none", border: "none", cursor: "pointer", padding: "2px 4px",
              borderRadius: 4,
            }}
          >
            Dismiss all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: "32px 16px", textAlign: "center",
          color: "var(--muted)", fontSize: 13,
        }}>
          <i className="ti ti-bell-off" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
          All clear — no pending alerts
        </div>
      ) : (
        <div style={{ padding: "8px 0" }}>
          {criticals.length > 0 && (
            <GroupLabel label="Critical" count={criticals.length} color="var(--red)" />
          )}
          {criticals.map(n => (
            <NotifRow key={n.id} item={n} onDismiss={onDismiss} dark={dark} />
          ))}
          {urgents.length > 0 && (
            <GroupLabel label="Urgent" count={urgents.length} color="var(--amber)" />
          )}
          {urgents.map(n => (
            <NotifRow key={n.id} item={n} onDismiss={onDismiss} dark={dark} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupLabel({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{
      padding: "6px 16px 4px",
      fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
      textTransform: "uppercase", color,
      display: "flex", alignItems: "center", gap: 6,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} aria-hidden="true" />
      {label} · {count}
    </div>
  );
}

function NotifRow({
  item, onDismiss, dark,
}: { item: NotificationItem; onDismiss: (id: string) => void; dark: boolean }) {
  const isCrit = item.type === "critical";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 16px",
      borderLeft: `3px solid ${isCrit ? "var(--red)" : "var(--amber)"}`,
      marginLeft: 0,
      transition: "background 0.12s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = dark ? "#1e2533" : "#f8f9fb")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{item.message}</div>
        {item.detail && (
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{item.detail}</div>
        )}
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{item.timestamp}</div>
      </div>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label={`Dismiss: ${item.message}`}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--muted)", padding: 2, borderRadius: 4, flexShrink: 0,
          fontSize: 13, lineHeight: 1,
          transition: "color 0.12s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
      >
        <i className="ti ti-x" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ onSearch, dark }: { onSearch: (q: string) => void; dark: boolean }) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <label
      htmlFor="topbar-search"
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "0 10px", height: 32, borderRadius: 8,
        border: "1px solid var(--border)",
        background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        transition: "border-color 0.15s, box-shadow 0.15s",
        cursor: "text", width: 220,
      }}
      onFocusWithin={(e: any) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent)22";
      }}
      onBlur={(e: any) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      <i className="ti ti-search" style={{ fontSize: 13, color: "var(--muted)", flexShrink: 0 }} aria-hidden="true" />
      <input
        id="topbar-search"
        ref={inputRef}
        type="search"
        placeholder="Search patients, visits…"
        value={value}
        onChange={e => { setValue(e.target.value); onSearch(e.target.value); }}
        style={{
          flex: 1, border: "none", background: "transparent",
          fontSize: 12, outline: "none", color: "var(--text)",
          minWidth: 0,
        }}
        aria-label="Search patients and visits"
      />
      {/* Keyboard shortcut hint */}
      <kbd style={{
        fontSize: 10, padding: "1px 5px",
        borderRadius: 4, flexShrink: 0,
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        border: "1px solid var(--border)",
        color: "var(--muted)", fontFamily: "inherit",
        lineHeight: 1.6, letterSpacing: "0.02em",
      }}>⌘K</kbd>
    </label>
  );
}

// ─── Breadcrumb/page title ────────────────────────────────────────────────────
function PageTitle({ tab }: { tab: NavTab }) {
  const info = NAV_TABS.find(t => t.id === tab)!;
  return (
    <nav aria-label="Current section" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {/* Root */}
      <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>ClinicOS</span>
      <i className="ti ti-chevron-right" style={{ fontSize: 11, color: "var(--muted)" }} aria-hidden="true" />
      {/* Active page */}
      <span
        aria-current="page"
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}
      >
        <i className={`ti ${info.icon}`} style={{ fontSize: 14, color: "var(--accent)" }} aria-hidden="true" />
        {info.label}
      </span>
    </nav>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user }: { user: { name: string; initials: string; color: string } }) {
  return (
    <div
      title={user.name}
      aria-label={`Logged in as ${user.name}`}
      role="img"
      style={{
        width: 30, height: 30, borderRadius: "50%",
        background: `${user.color}18`,
        color: user.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, flexShrink: 0,
        border: `1.5px solid ${user.color}40`,
        letterSpacing: "0.03em",
        cursor: "default",
      }}
    >
      {user.initials}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TopBar({
  dark, setDark,
  activeTab, setActiveTab,
  userRole, setUserRole,
  onSearch,
  stats,
  notifications = [],
  onDismissNotification = () => {},
}: TopBarProps) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const currentUser   = ROLE_DISPLAY[userRole] ?? { name: "Staff", initials: "ST", color: "#64748b" };
  const urgentCount   = stats.followUpDue + stats.insExpiring;
  const criticalCount = stats.criticalAlerts;
  const totalNotifs   = notifications.length;

  const closeNotif = useCallback(() => setNotifOpen(false), []);
  useClickOutside(notifRef as React.RefObject<HTMLElement>, closeNotif, notifOpen);

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: dark ? "#0c0f1a" : "#fff",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center",
        padding: "0 16px", height: 54, flexShrink: 0,
        gap: 12, position: "relative", zIndex: 100,
      }}>

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
          role="banner"
          aria-label="ClinicOS"
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }} aria-hidden="true">
            <i className="ti ti-heart-rate-monitor" style={{ color: "#fff", fontSize: 15 }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>
            ClinicOS
          </span>
        </div>

        {/* ── Breadcrumb (desktop) ──────────────────────────────────────────── */}
        <div className="desktop-only" style={{ marginLeft: 4 }}>
          <PageTitle tab={activeTab} />
        </div>

        <div style={{ flex: 1 }} />

        {/* ── Right side ───────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Search (desktop) */}
          <div className="desktop-only">
            <SearchBar onSearch={onSearch ?? (() => {})} dark={dark} />
          </div>

          {/* Status pills (desktop) */}
          {criticalCount > 0 && (
            <div className="desktop-only">
              <Badge count={criticalCount} variant="critical" label="critical" />
            </div>
          )}
          {urgentCount > 0 && (
            <div className="desktop-only">
              <Badge count={urgentCount} variant="urgent" label="urgent" />
            </div>
          )}

          {/* Role selector (desktop) */}
          <select
            value={userRole}
            onChange={e => setUserRole(e.target.value as UserRole)}
            className="desktop-only"
            aria-label="Select user role"
            style={{ fontSize: 12, padding: "5px 8px", borderRadius: "var(--radius)" }}
          >
            <option value="receptionist">Receptionist</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>

          {/* Notification bell */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              className="btn-icon"
              onClick={() => setNotifOpen(o => !o)}
              aria-label={totalNotifs > 0 ? `${totalNotifs} notifications` : "No notifications"}
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
              style={{ position: "relative" }}
            >
              <i className="ti ti-bell" style={{ fontSize: 16 }} aria-hidden="true" />
              {totalNotifs > 0 && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute", top: 2, right: 2,
                    width: 16, height: 16, borderRadius: "50%",
                    background: criticalCount > 0 ? "var(--red)" : "var(--amber)",
                    color: "#fff", fontSize: 9, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `2px solid ${dark ? "#0c0f1a" : "#fff"}`,
                    lineHeight: 1,
                  }}
                >
                  {totalNotifs > 9 ? "9+" : totalNotifs}
                </span>
              )}
            </button>

            {notifOpen && (
              <NotificationDropdown
                items={notifications}
                onDismiss={onDismissNotification}
                onClose={closeNotif}
                dark={dark}
              />
            )}
          </div>

          {/* Dark toggle */}
          <button
            className="btn-icon"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark  ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} style={{ fontSize: 15 }} aria-hidden="true" />
          </button>

          {/* Avatar */}
          <Avatar user={currentUser} />

          {/* Mobile hamburger */}
          <button
            className="btn-icon mobile-only"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <i className={`ti ${menuOpen ? "ti-x" : "ti-menu-2"}`} style={{ fontSize: 16 }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────────────────────── */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 199,
              background: "rgba(0,0,0,0.3)",
            }}
            aria-hidden="true"
          />
          <div
            className="mobile-only"
            style={{
              position: "fixed", top: 54, left: 0, right: 0, bottom: 0,
              background: dark ? "rgba(12,15,26,0.98)" : "rgba(255,255,255,0.98)",
              backdropFilter: "blur(10px)",
              zIndex: 200, padding: 16, overflow: "auto",
              animation: "slideDown 0.15s ease",
            }}
            role="menu"
            aria-label="Navigation menu"
          >
            {/* Search */}
            <div style={{ marginBottom: 14 }}>
              <SearchBar onSearch={onSearch ?? (() => {})} dark={dark} />
            </div>

            {/* User card */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", marginBottom: 12,
              background: "var(--surface2)", borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
            }}>
              <Avatar user={currentUser} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>{userRole}</div>
              </div>
              {/* Alert pills in mobile user card */}
              <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                {criticalCount > 0 && <Badge count={criticalCount} variant="critical" label="critical" />}
                {urgentCount   > 0 && <Badge count={urgentCount}   variant="urgent"   label="urgent"  />}
              </div>
            </div>

            {/* Nav */}
            <div style={{ marginBottom: 16 }}>
              {NAV_TABS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "14px 16px", borderRadius: "var(--radius)", marginBottom: 6,
                    fontSize: 14, fontWeight: activeTab === id ? 600 : 400,
                    color:      activeTab === id ? "var(--accent)" : "var(--text)",
                    background: activeTab === id ? "var(--accent-soft)" : "transparent",
                    border: `1px solid ${activeTab === id ? "var(--accent)30" : "var(--border)"}`,
                    cursor: "pointer", minHeight: 48,
                  }}
                  role="menuitem"
                  aria-current={activeTab === id ? "page" : undefined}
                >
                  <i className={`ti ${icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* Role + dark mode */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label htmlFor="mobile-role-select" style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                  Role
                </label>
                <select
                  id="mobile-role-select"
                  value={userRole}
                  onChange={e => setUserRole(e.target.value as UserRole)}
                  style={{ width: "100%", fontSize: 14, padding: 12, minHeight: 48 }}
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={() => setDark(!dark)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "14px 16px", borderRadius: "var(--radius)",
                  border: "1px solid var(--border)", background: "transparent",
                  fontSize: 14, cursor: "pointer", minHeight: 48,
                  color: "var(--text)", fontWeight: 500,
                }}
              >
                <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} style={{ fontSize: 18 }} aria-hidden="true" />
                {dark ? "Switch to light mode" : "Switch to dark mode"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
