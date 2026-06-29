import type {
  AlertType, PatientStatus, InsuranceStatus, RiskLevel,
} from "./types";

// ─── Static lookup tables ─────────────────────────────────────────────────────

export const DOCTORS    = ["Dr. Sharma", "Dr. Patel", "Dr. Mehta", "Dr. Iyer", "Dr. Nair"] as const;
export const INSURERS   = ["Star Health", "HDFC ERGO", "ICICI Lombard", "Bajaj Allianz", "None"] as const;
export const GENDERS    = ["Male", "Female", "Other"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export const RELATIONS  = ["Parent", "Child", "Spouse", "Sibling", "Guardian"] as const;

export const STATUSES: PatientStatus[] = [
  "New", "Active", "Follow-Up Due", "Under Treatment", "Observation", "Inactive", "VIP",
];

export const ALERT_TYPES: AlertType[] = [
  "Allergy", "Diabetic", "Hypertension", "Heart Condition", "Pregnancy", "High Risk",
];

export const DOC_TYPES = [
  "Insurance Card", "Passport", "National ID", "Consent Form", "Medical Report", "Referral Letter",
] as const;

// ─── Name pools ───────────────────────────────────────────────────────────────

export const FIRST_NAMES_M = [
  "Arjun","Rohan","Vikram","Karan","Aditya","Rahul","Nikhil","Sanjay","Deepak","Mohit",
  "Suresh","Rajesh","Amit","Ankit","Vivek",
] as const;

export const FIRST_NAMES_F = [
  "Priya","Sneha","Ananya","Kavya","Pooja","Divya","Meera","Sunita","Rekha","Neha",
  "Anjali","Shreya","Nisha","Ritu","Sonal",
] as const;

export const LAST_NAMES = [
  "Sharma","Patel","Mehta","Iyer","Nair","Gupta","Singh","Kumar","Verma","Joshi",
  "Shah","Rao","Reddy","Mishra","Dubey",
] as const;

// ─── Avatar colors ────────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  "#4f7cff","#7c4fff","#00b4a0","#f97316","#ec4899","#22c55e",
] as const;

// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<PatientStatus | string, { bg: string; color: string; dot: string }> = {
  "New":             { bg: "#e0f2fe", color: "#0369a1", dot: "#0ea5e9" },
  "Active":          { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Follow-Up Due":   { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
  "Under Treatment": { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6" },
  "Observation":     { bg: "#fce7f3", color: "#9d174d", dot: "#ec4899" },
  "Inactive":        { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  "VIP":             { bg: "#fff7ed", color: "#92400e", dot: "#f97316" },
  "Archived":        { bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
};

// ─── Alert config ─────────────────────────────────────────────────────────────

export const ALERT_CONFIG: Record<AlertType, { bg: string; color: string; severity: "critical" | "medium" | "low" }> = {
  "Allergy":         { bg: "#fee2e2", color: "#991b1b", severity: "critical" },
  "Diabetic":        { bg: "#fef3c7", color: "#92400e", severity: "medium"   },
  "Hypertension":    { bg: "#fce7f3", color: "#9d174d", severity: "medium"   },
  "Heart Condition": { bg: "#fee2e2", color: "#7f1d1d", severity: "critical" },
  "Pregnancy":       { bg: "#fdf4ff", color: "#6b21a8", severity: "critical" },
  "High Risk":       { bg: "#fee2e2", color: "#991b1b", severity: "critical" },
};

export const ALERT_SEVERITY: Record<AlertType, "critical" | "medium" | "low"> = Object.fromEntries(
  Object.entries(ALERT_CONFIG).map(([k, v]) => [k, v.severity])
) as Record<AlertType, "critical" | "medium" | "low">;

/**
 * Derived from ALERT_CONFIG — use this instead of the separate ALERT_SEVERITY map
 * to keep severity in one place.
 *
 * @example isCriticalAlert("Allergy") // true
 */
export function isCriticalAlert(alert: AlertType): boolean {
  return ALERT_CONFIG[alert]?.severity === "critical";
}

// ─── Insurance config ─────────────────────────────────────────────────────────

export const INS_CONFIG: Record<InsuranceStatus, { bg: string; color: string }> = {
  "Active":   { bg: "#dcfce7", color: "#15803d" },
  "Expiring": { bg: "#fef3c7", color: "#92400e" },
  "Expired":  { bg: "#fee2e2", color: "#991b1b" },
  "None":     { bg: "#f1f5f9", color: "#64748b" },
};

// ─── Risk config ──────────────────────────────────────────────────────────────

export const RISK_CONFIG: Record<RiskLevel, { bg: string; color: string; dot: string; icon: string }> = {
  Low:      { bg: "#dcfce7", color: "#15803d", dot: "#22c55e", icon: "ti-circle-check"   },
  Medium:   { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", icon: "ti-alert-circle"   },
  High:     { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", icon: "ti-alert-triangle" },
  Critical: { bg: "#7f1d1d", color: "#fca5a5", dot: "#ef4444", icon: "ti-urgent"         },
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

export const TIMELINE_TYPES = [
  { type: "created",      label: "Patient Created",        icon: "ti-user-plus",      color: "#4f7cff" },
  { type: "appointment",  label: "Appointment Booked",     icon: "ti-calendar",       color: "#7c4fff" },
  { type: "consultation", label: "Consultation Completed", icon: "ti-stethoscope",    color: "#00b4a0" },
  { type: "prescription", label: "Prescription Issued",    icon: "ti-pill",           color: "#ff7c4f" },
  { type: "invoice",      label: "Invoice Generated",      icon: "ti-receipt",        color: "#f0a500" },
  { type: "payment",      label: "Payment Received",       icon: "ti-cash",           color: "#22c55e" },
  { type: "report",       label: "Report Uploaded",        icon: "ti-file-analytics", color: "#4f7cff" },
  { type: "followup",     label: "Follow-Up Scheduled",    icon: "ti-clock",          color: "#f0a500" },
  { type: "note",         label: "Doctor Note Added",      icon: "ti-notes",          color: "#7c4fff" },
] as const;

export type TimelineType = typeof TIMELINE_TYPES[number]["type"];

// ─── Consent types ────────────────────────────────────────────────────────────

export const CONSENT_TYPES = [
  { key: "generalTreatment", label: "General Treatment", icon: "ti-stethoscope" },
  { key: "dataPrivacy",      label: "Data Privacy",      icon: "ti-lock"        },
  { key: "insuranceClaim",   label: "Insurance Consent", icon: "ti-shield"      },
  { key: "minorGuardian",    label: "Minor/Guardian",    icon: "ti-users"       },
  { key: "procedureConsent", label: "Procedure Consent", icon: "ti-writing"     },
] as const;

export type ConsentKey = typeof CONSENT_TYPES[number]["key"];

// ─── Quick actions ────────────────────────────────────────────────────────────

export const QUICK_ACTIONS = [
  { icon: "ti-calendar",       label: "Book Appointment",   color: "#4f7cff" },
  { icon: "ti-stethoscope",    label: "Start Consultation", color: "#7c4fff" },
  { icon: "ti-pill",           label: "New Prescription",   color: "#f97316" },
  { icon: "ti-file-analytics", label: "Upload Report",      color: "#00b4a0" },
  { icon: "ti-receipt",        label: "Create Invoice",     color: "#f59e0b" },
  { icon: "ti-phone",          label: "Call Patient",       color: "#22c55e" },
  { icon: "ti-clock",          label: "Schedule Follow-Up", color: "#ec4899" },
  { icon: "ti-message",        label: "Send Message",       color: "#4f7cff" },
] as const;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PAGE_SIZE = 20;

// ─── RBAC ─────────────────────────────────────────────────────────────────────

/**
 * All permission keys in one place. Adding a new permission here is the single
 * source of truth — no separate string literals elsewhere.
 */
export const PERMISSION_KEYS = [
  "viewMedical",
  "viewBilling",
  "deleteDocument",
  "editMedicalAlerts",
  "viewAudit",
  "editPatient",
  "deletePatient",
] as const;

export type Permission = typeof PERMISSION_KEYS[number];
export type Role = "admin" | "doctor" | "receptionist";

export const PERMISSIONS: Record<Permission, Role[]> = {
  viewMedical:       ["admin", "doctor"],
  viewBilling:       ["admin", "receptionist"],
  deleteDocument:    ["admin"],
  editMedicalAlerts: ["admin", "doctor"],
  viewAudit:         ["admin"],
  editPatient:       ["admin", "receptionist", "doctor"],
  deletePatient:     ["admin"],
};

/**
 * Returns true if the given role holds the given permission.
 *
 * @example can("doctor", "viewMedical") // true
 * @example can("receptionist", "deletePatient") // false
 */
export function can(role: Role | string, permission: Permission | string): boolean {
  const allowed = PERMISSIONS[permission as Permission];
  return allowed?.includes(role as Role) ?? false;
}

/**
 * Returns every permission the role holds.
 *
 * @example permissionsFor("admin") // all keys
 */
export function permissionsFor(role: Role | string): Permission[] {
  return PERMISSION_KEYS.filter((p) => can(role, p));
}
