import React, { useState } from "react";
import type { Patient } from "../types";
import {
  PatientStatusChart,
  RiskDistributionChart,
  GenderDistributionChart,
  InsuranceStatusChart,
  AgeDistributionChart,
} from "./components/Charts";

interface StatsBarProps {
  stats: {
    total: number;
    active: number;
    followUpDue: number;
    newPatients: number;
    insExpiring: number;
    criticalAlerts: number;
  };
  onFilter: (q: string) => void;
  patients: Patient[];
  dark: boolean;
}

export default function StatsBar({ stats, onFilter, patients, dark }: StatsBarProps) {
  const [showCharts, setShowCharts] = useState(false);

  const items = [
    { label: "Total",           value: stats.total,          color: "var(--accent)", icon: "ti-users",              query: "" },
    { label: "Active",          value: stats.active,         color: "var(--green)",  icon: "ti-activity",           query: "active" },
    { label: "Follow-Up Due",   value: stats.followUpDue,    color: "var(--amber)",  icon: "ti-clock",              query: "follow-up overdue" },
    { label: "New",             value: stats.newPatients,    color: "#7c3aed",       icon: "ti-user-plus",          query: "new patient" },
    { label: "Ins. Expiring",   value: stats.insExpiring,    color: "var(--red)",    icon: "ti-shield-exclamation", query: "insurance expiring" },
    { label: "Critical Alerts", value: stats.criticalAlerts, color: "var(--red)",    icon: "ti-alert-triangle",     query: "critical" },
  ];

  return (
    <>
      <style>{`
        .stats-bar {
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          display: grid;
          grid-template-columns: repeat(${items.length + 1}, 1fr);
          flex-shrink: 0;
        }
        @media (max-width: 768px) {
          .stats-bar { grid-template-columns: repeat(3, 1fr); }
          .stats-bar-toggle { display: none !important; }
          .stats-bar-item { padding: 8px 10px !important; }
          .stats-bar-item .stat-num { font-size: 18px !important; }
          .stats-bar-item .stat-lbl { font-size: 9px !important; }
        }
        .stats-bar-item { transition: background 0.15s; }
        .stats-bar-item:hover { background: var(--surface2) !important; }
        .stats-bar-toggle { transition: background 0.15s; }
        .stats-bar-toggle:hover { background: var(--surface2) !important; }
      `}</style>
      <div className="stats-bar">
        {items.map((s) => (
          <button
            key={s.label}
            onClick={() => s.query && onFilter(s.query)}
            className="stats-bar-item"
            style={{
              padding: "10px 14px",
              borderRight: "1px solid var(--border)",
              background: "none",
              border: "none",
              borderRight: "1px solid var(--border)",
              cursor: s.query ? "pointer" : "default",
              textAlign: "left",
            }}
            title={s.query ? `Filter by ${s.label}` : undefined}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 11, color: s.color }} />
              <span className="stat-lbl" style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </span>
            </div>
            <div className="stat-num" style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
          </button>
        ))}
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="stats-bar-toggle"
          style={{
            padding: "10px 14px",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            color: showCharts ? "var(--accent)" : "var(--muted)",
          }}
          title={showCharts ? "Hide charts" : "Show charts"}
        >
          <i className={`ti ${showCharts ? "ti-chart-pie-filled" : "ti-chart-pie"}`} style={{ fontSize: 18 }} />
          <span style={{ fontSize: "var(--font-2xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {showCharts ? "Hide" : "Charts"}
          </span>
        </button>
      </div>

      {showCharts && (
        <div style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          animation: "slideDown 0.2s ease",
        }}>
          <PatientStatusChart patients={patients} dark={dark} />
          <RiskDistributionChart patients={patients} dark={dark} />
          <GenderDistributionChart patients={patients} dark={dark} />
          <InsuranceStatusChart patients={patients} dark={dark} />
          <AgeDistributionChart patients={patients} dark={dark} />
        </div>
      )}
    </>
  );
}
