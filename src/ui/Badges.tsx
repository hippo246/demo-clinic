import React, { memo } from "react";
import type { Patient, PatientStatus, InsuranceStatus, AlertType } from "./types";
import { STATUS_CONFIG, ALERT_CONFIG, INS_CONFIG, RISK_CONFIG } from "./constants";
import { getInitials, getAvatarColor, calcRiskScore } from "./utils";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const INSURANCE_ICONS: Record<string, string> = {
  Active:   "ti-shield-check",
  Expiring: "ti-shield-exclamation",
  Expired:  "ti-shield-x",
  None:     "ti-shield-off",
};

const PRIORITY_CONFIG = {
  High:   { bg: "var(--red-bg)",   color: "var(--red)"   },
  Medium: { bg: "var(--amber-bg)", color: "var(--amber)" },
  Low:    { bg: "var(--green-bg)", color: "var(--green)" },
} as const;

type Priority = keyof typeof PRIORITY_CONFIG;

// ─── Status Badge ──────────────────────────────────────────────────────────────

export const StatusBadge = memo(function StatusBadge({
  status,
}: {
  status: PatientStatus | string;
}) {
  const c = STATUS_CONFIG[status] ?? STATUS_CONFIG["Inactive"];
  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      <span className="badge-dot" style={{ background: c.dot }} />
      {status}
    </span>
  );
});

// ─── Alert Chip ────────────────────────────────────────────────────────────────

export const AlertChip = memo(function AlertChip({
  alert,
}: {
  alert: AlertType | string;
}) {
  const c          = ALERT_CONFIG[alert as AlertType] ?? { bg: "#f1f5f9", color: "#475569", severity: "low" };
  const isCritical = c.severity === "critical";
  return (
    <span
      className="badge"
      style={{
        background: c.bg,
        color:      c.color,
        border:     `1px solid ${c.color}30`,
        fontWeight: isCritical ? 700 : 600,
      }}
    >
      {isCritical && (
        <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} aria-hidden="true" />
      )}
      {alert}
    </span>
  );
});

// ─── Insurance Badge ───────────────────────────────────────────────────────────

export const InsuranceBadge = memo(function InsuranceBadge({
  status,
}: {
  status: InsuranceStatus | string;
}) {
  const c    = INS_CONFIG[status as InsuranceStatus] ?? INS_CONFIG["None"];
  const icon = INSURANCE_ICONS[status] ?? "ti-shield";
  return (
    <span className="tag" style={{ background: c.bg, color: c.color }}>
      <i className={`ti ${icon}`} style={{ fontSize: 10 }} aria-hidden="true" />
      {status}
    </span>
  );
});

// ─── Risk Badge ────────────────────────────────────────────────────────────────

export const RiskBadge = memo(function RiskBadge({
  patient,
  showScore = false,
}: {
  patient:    Partial<Patient> | null;
  showScore?: boolean;
}) {
  const { score, level } = calcRiskScore(patient ?? {});
  const c = RISK_CONFIG[level] ?? RISK_CONFIG.Low;
  return (
    <span
      className="badge"
      style={{
        background: c.bg,
        color:      c.color,
        border:     `1px solid ${c.dot}40`,
      }}
    >
      <span className="badge-dot" style={{ background: c.dot }} />
      {level} Risk
      {showScore && (
        <span style={{ opacity: 0.6, fontSize: 10 }} aria-label={`score ${score}`}>
          · {score}
        </span>
      )}
    </span>
  );
});

// ─── Blood Group Badge ─────────────────────────────────────────────────────────

export const BloodGroupBadge = memo(function BloodGroupBadge({
  group,
}: {
  group: string;
}) {
  if (!group) return null;
  return (
    <span className="badge" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
      <i className="ti ti-droplet" style={{ fontSize: 10 }} aria-hidden="true" />
      {group}
    </span>
  );
});

// ─── Avatar Circle ─────────────────────────────────────────────────────────────

const AVATAR_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "avatar",
  md: "avatar-lg",
  lg: "avatar-xl",
};

export const AvatarCircle = memo(function AvatarCircle({
  name = "Unknown",
  size = "sm",
}: {
  name?: string;
  size?: "sm" | "md" | "lg";
}) {
  const bg  = getAvatarColor(name);
  const cls = AVATAR_CLASS[size];
  return (
    <div
      className={cls}
      style={{ background: `${bg}22`, color: bg }}
      aria-label={name}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
});

// ─── Verification Dot ──────────────────────────────────────────────────────────

export const VerifiedDot = memo(function VerifiedDot({ done }: { done: boolean }) {
  const label = done ? "Verified" : "Not verified";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        justifyContent:  "center",
        width:           18,
        height:          18,
        borderRadius:    "50%",
        background:      done ? "var(--green-bg)" : "var(--red-bg)",
        color:           done ? "var(--green)"    : "var(--red)",
        fontSize:        10,
        flexShrink:      0,
      }}
    >
      <i className={`ti ${done ? "ti-check" : "ti-x"}`} aria-hidden="true" />
    </span>
  );
});

// ─── Priority Tag ──────────────────────────────────────────────────────────────

export const PriorityTag = memo(function PriorityTag({
  priority,
}: {
  priority: Priority | null | undefined;
}) {
  if (!priority || !(priority in PRIORITY_CONFIG)) return null;
  const c = PRIORITY_CONFIG[priority];
  return (
    <span className="tag" style={{ background: c.bg, color: c.color }}>
      {priority}
    </span>
  );
});

// ─── Consent Badge ─────────────────────────────────────────────────────────────

export const ConsentBadge = memo(function ConsentBadge({
  consentSigned,
}: {
  consentSigned: boolean;
}) {
  return (
    <span
      className="badge"
      style={{
        background: consentSigned ? "var(--green-bg)"     : "var(--red-bg)",
        color:      consentSigned ? "var(--green)"        : "var(--red)",
        border:     `1px solid var(${consentSigned ? "--green-border" : "--red-border"})`,
      }}
    >
      <i
        className={`ti ${consentSigned ? "ti-writing" : "ti-alert-triangle"}`}
        style={{ fontSize: 10 }}
        aria-hidden="true"
      />
      {consentSigned ? "Consent OK" : "Consent Missing"}
    </span>
  );
});
