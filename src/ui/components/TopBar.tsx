import React, { useState } from "react";
import type { UserRole } from "../types";

const NAV_TABS = [
  { id: "patients",      label: "Patients",      icon: "ti-users" },
  { id: "appointments",  label: "Appointments",  icon: "ti-calendar" },
  { id: "billing",       label: "Billing",       icon: "ti-receipt" },
  { id: "reports",       label: "Reports",       icon: "ti-chart-bar" },
  { id: "settings",      label: "Settings",      icon: "ti-settings" },
] as const;

export type NavTab = typeof NAV_TABS[number]["id"];

const ROLE_DISPLAY: Record<UserRole, { name: string; initials: string }> = {
  receptionist: { name: "Front Desk",  initials: "FD" },
  doctor:       { name: "Dr. Sharma",  initials: "DS" },
  admin:        { name: "Admin",       initials: "AD" },
};

interface TopBarProps {
  dark: boolean;
  setDark: (d: boolean) => void;
  activeTab: NavTab;
  setActiveTab: (t: NavTab) => void;
  userRole: UserRole;
  setUserRole: (r: UserRole) => void;
  stats: {
    total: number;
    active: number;
    followUpDue: number;
    newPatients: number;
    insExpiring: number;
    criticalAlerts: number;
  };
}

export default function TopBar({
  dark, setDark, activeTab, setActiveTab, userRole, setUserRole, stats,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUser = ROLE_DISPLAY[userRole] ?? { name: "Staff", initials: "ST" };

  const urgentCount   = stats.followUpDue + stats.insExpiring;
  const criticalCount = stats.criticalAlerts;

  return (
    <>
      <div style={{
        background: dark ? "#0c0f1a" : "#fff",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center",
        padding: "0 16px", height: 54, flexShrink: 0,
        gap: 12, position: "relative", zIndex: 100,
      }}>
        {/* Logo */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
          role="banner"
          aria-label="ClinicOS - Clinic Management System"
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

        {/* Spacer — nav lives in sidebar on desktop */}
        <div style={{ flex: 1 }} />

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Critical alerts badge — higher priority than urgent */}
          {criticalCount > 0 && (
            <div className="desktop-only" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: "var(--radius-full)",
              background: "var(--red-bg)", border: "1px solid var(--red-border)",
              fontSize: "var(--font-xs)", fontWeight: 700, color: "var(--red)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
              {criticalCount} critical
            </div>
          )}

          {/* Urgent badge */}
          {urgentCount > 0 && (
            <div className="desktop-only" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: "var(--radius-full)",
              background: "var(--amber-bg)", border: "1px solid var(--amber-border)",
              fontSize: "var(--font-xs)", fontWeight: 700, color: "var(--amber)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
              {urgentCount} urgent
            </div>
          )}

          {/* Role selector */}
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as UserRole)}
            className="desktop-only"
            aria-label="Select user role"
            style={{ fontSize: "var(--font-xs)", padding: "5px 8px", borderRadius: "var(--radius)" }}
          >
            <option value="receptionist">Receptionist</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>

          {/* Dark toggle */}
          <button
            className="btn-icon"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} style={{ fontSize: 15 }} aria-hidden="true" />
          </button>

          {/* Avatar — reflects current role */}
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--accent-soft)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, cursor: "default",
            border: "2px solid var(--accent)30",
            flexShrink: 0,
          }} title={currentUser.name} aria-label={`Current user: ${currentUser.name}`}>
            {currentUser.initials}
          </div>

          {/* Mobile hamburger */}
          <button
            className="btn-icon mobile-only"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle mobile menu"
            aria-expanded={menuOpen}
          >
            <i className={`ti ${menuOpen ? "ti-x" : "ti-menu-2"}`} style={{ fontSize: 16 }} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile overlay — backdrop closes menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 199,
              background: "rgba(0,0,0,0.3)",
            }}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className="mobile-only"
            style={{
              position: "fixed", top: 54, left: 0, right: 0, bottom: 0,
              background: dark ? "rgba(12,15,26,0.98)" : "rgba(255,255,255,0.98)",
              backdropFilter: "blur(10px)",
              zIndex: 200,
              padding: "16px",
              overflow: "auto",
              animation: "slideDown 0.15s ease",
            }}
            role="menu"
            aria-label="Mobile navigation menu"
          >
            {/* Current user */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 16px", marginBottom: 12,
              background: "var(--surface2)", borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent-soft)", color: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, flexShrink: 0,
              }}>
                {currentUser.initials}
              </div>
              <div>
                <div style={{ fontSize: "var(--font-sm)", fontWeight: 700 }}>{currentUser.name}</div>
                <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", textTransform: "capitalize" }}>{userRole}</div>
              </div>
            </div>

            {/* Nav items */}
            <div style={{ marginBottom: 16 }}>
              {NAV_TABS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMenuOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "14px 16px", borderRadius: "var(--radius)", marginBottom: 6,
                    fontSize: "var(--font-base)", fontWeight: activeTab === id ? 600 : 400,
                    color: activeTab === id ? "var(--accent)" : "var(--text)",
                    background: activeTab === id ? "var(--accent-soft)" : "transparent",
                    border: `1px solid ${activeTab === id ? "var(--accent)30" : "var(--border)"}`,
                    cursor: "pointer", minHeight: 48,
                  }}
                  role="menuitem"
                >
                  <i className={`ti ${icon}`} style={{ fontSize: 18 }} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* Role + dark mode */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label
                  style={{ fontSize: "var(--font-xs)", color: "var(--muted)", display: "block", marginBottom: 6 }}
                  htmlFor="mobile-role-select"
                >
                  Role
                </label>
                <select
                  id="mobile-role-select"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  style={{ width: "100%", fontSize: "var(--font-base)", padding: "12px", minHeight: 48 }}
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={() => { setDark(!dark); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "14px 16px", borderRadius: "var(--radius)",
                  border: "1px solid var(--border)", background: "transparent",
                  fontSize: "var(--font-base)", cursor: "pointer", minHeight: 48,
                  color: "var(--text)", fontWeight: 500,
                }}
              >
                <i className={`ti ${dark ? "ti-sun" : "ti-moon"}`} style={{ fontSize: 18 }} />
                {dark ? "Switch to light mode" : "Switch to dark mode"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
