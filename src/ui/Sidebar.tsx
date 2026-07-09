import React, { useState } from "react";
import type { NavTab } from "./TopBar";

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
  /** Optional controlled collapse; omit to use internal state */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  dark,
  collapsed: collapsedProp,
  onCollapsedChange,
}: SidebarProps) {
  const [collapsedInternal, setCollapsedInternal] = useState(false);

  const isControlled = collapsedProp !== undefined;
  const collapsed = isControlled ? collapsedProp : collapsedInternal;

  const toggleCollapsed = () => {
    const next = !collapsed;
    if (isControlled) {
      onCollapsedChange?.(next);
    } else {
      setCollapsedInternal(next);
    }
  };

  return (
    <aside
      className="desktop-only"
      role="navigation"
      aria-label={collapsed ? "Navigation (collapsed)" : "Sidebar navigation"}
      style={{
        width: collapsed ? 56 : 200,
        flexShrink: 0,
        background: dark ? "#0c0f1a" : "#fff",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "12px 8px",
        gap: 2,
        overflowY: "auto",
        overflowX: "hidden",
        transition: "width 0.2s ease",
      }}
    >
      {!collapsed && (
        <div style={{
          fontSize: "var(--font-2xs)", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--muted)",
          padding: "4px 12px 8px",
          whiteSpace: "nowrap",
        }}>
          Navigation
        </div>
      )}

      {NAV_TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          aria-current={activeTab === id ? "page" : undefined}
          title={collapsed ? label : undefined}
          className={`sidebar-nav-item${activeTab === id ? " active" : ""}`}
        >
          <i className={`ti ${icon} nav-icon`} aria-hidden="true" />
          {!collapsed && label}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0", opacity: 0.5 }} />

      <button
        onClick={toggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className="sidebar-nav-item"
      >
        <i
          className={`ti ${collapsed ? "ti-layout-sidebar-right-expand" : "ti-layout-sidebar-right-collapse"} nav-icon`}
          aria-hidden="true"
        />
        {!collapsed && "Collapse"}
      </button>
    </aside>
  );
}
