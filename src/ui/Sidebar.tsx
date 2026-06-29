import React from "react";
import type { NavTab } from "./components/TopBar";

const NAV_TABS: { id: NavTab; label: string; icon: string }[] = [
  { id: "patients",     label: "Patients",     icon: "ti-users" },
  { id: "appointments", label: "Appointments", icon: "ti-calendar" },
  { id: "billing",      label: "Billing",      icon: "ti-receipt" },
  { id: "reports",      label: "Reports",      icon: "ti-chart-bar" },
  { id: "settings",     label: "Settings",     icon: "ti-settings" },
];

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (t: NavTab) => void;
  dark: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, dark }: SidebarProps) {
  return (
    <aside
      className="desktop-only"
      role="navigation"
      aria-label="Sidebar navigation"
      style={{
        width: 200,
        flexShrink: 0,
        background: dark ? "#0c0f1a" : "#fff",
        borderRight: "1px solid var(--border)",
        flexDirection: "column",
        padding: "12px 8px",
        gap: 2,
        overflowY: "auto",
      }}
    >
      <div style={{
        fontSize: "var(--font-2xs)", fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase", color: "var(--muted)",
        padding: "4px 12px 8px",
      }}>
        Navigation
      </div>

      {NAV_TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          aria-current={activeTab === id ? "page" : undefined}
          className={`sidebar-nav-item${activeTab === id ? " active" : ""}`}
        >
          <i className={`ti ${icon} nav-icon`} aria-hidden="true" />
          {label}
        </button>
      ))}
    </aside>
  );
}
