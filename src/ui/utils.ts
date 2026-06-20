import type { Patient, AuditEntry, RiskResult, NextBestAction, VisitReadiness, PatientStats, DrugInteraction } from "./types";
import { AVATAR_COLORS, ALERT_SEVERITY } from "./constants";

// ─── Date / Format ─────────────────────────────────────────────────────────────
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function fmtDateShort(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function calcAge(dob: Date | string): number {
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// ─── Random helpers (for mock data generation) ────────────────────────────────
export function randomFrom<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
export function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

// ─── Risk Score ────────────────────────────────────────────────────────────────
const CRITICAL_ALERTS = ["Allergy", "Heart Condition", "Pregnancy", "High Risk"];
const CHRONIC_ALERTS  = ["Diabetic", "Hypertension"];

export function calcRiskScore(patient: Partial<Patient>): RiskResult {
  if (!patient || typeof patient !== "object") return { score: 0, level: "Low" };
  let score = 0;

  const criticals = (patient.alerts || []).filter((a) => CRITICAL_ALERTS.includes(a));
  score += criticals.length * 30;

  const chronics = (patient.alerts || []).filter((a) => CHRONIC_ALERTS.includes(a));
  score += chronics.length * 15;

  const age = patient.age || 0;
  if (age >= 75) score += 35;
  else if (age >= 65) score += 20;

  if (patient.status === "Follow-Up Due") score += 20;

  const unverified = [
    patient.phoneVerified, patient.insuranceVerified,
    patient.idVerified, patient.consentSigned, patient.documentsComplete,
  ].filter((v) => !v).length;
  score += unverified * 2;

  if (patient.insuranceStatus === "Expired")  score += 15;
  if (patient.insuranceStatus === "Expiring") score += 8;
  if (!patient.consentSigned) score += 10;

  let level: "Low" | "Medium" | "High" | "Critical";
  if      (score >= 80) level = "Critical";
  else if (score >= 50) level = "High";
  else if (score >= 25) level = "Medium";
  else                  level = "Low";

  return { score, level };
}

// ─── Next Best Action ──────────────────────────────────────────────────────────
export function calcNextBestAction(patient: Partial<Patient>): NextBestAction {
  const now = new Date();

  const hasCritical = (patient.alerts || []).some((a) =>
    ["Allergy", "Heart Condition", "Pregnancy", "High Risk"].includes(a)
  );
  if (hasCritical && !patient.alertsReviewed) {
    return { label: "Review Medical Alert", detail: "Critical alert requires acknowledgement",
      icon: "ti-alert-triangle", color: "#ef4444", bg: "#fee2e2", urgency: "critical" };
  }
  if (patient.insuranceStatus === "Expired") {
    return { label: "Verify Insurance", detail: "Insurance has expired — update before next visit",
      icon: "ti-shield-exclamation", color: "#ef4444", bg: "#fee2e2", urgency: "critical" };
  }
  if (patient.status === "Follow-Up Due" ||
      (patient.followUpDate && new Date(patient.followUpDate) < now)) {
    return { label: "Call for Follow-Up", detail: patient.followUpReason || "Scheduled follow-up is overdue",
      icon: "ti-phone", color: "#f59e0b", bg: "#fef3c7", urgency: "high" };
  }
  if (!patient.consentSigned) {
    return { label: "Collect Consent", detail: "Patient consent form has not been collected",
      icon: "ti-writing", color: "#f97316", bg: "#fff7ed", urgency: "high" };
  }
  if (patient.insuranceStatus === "Expiring") {
    return { label: "Verify Insurance", detail: "Insurance expiring soon — confirm renewal",
      icon: "ti-shield", color: "#f59e0b", bg: "#fef3c7", urgency: "medium" };
  }
  if (!patient.emergencyName || !patient.emergencyPhone) {
    return { label: "Add Emergency Contact", detail: "No emergency contact on file",
      icon: "ti-phone-call", color: "#7c4fff", bg: "#ede9fe", urgency: "medium" };
  }
  if (patient.lastVisit) {
    const days = Math.floor((now.getTime() - new Date(patient.lastVisit).getTime()) / 86400000);
    if (days >= 90) {
      return { label: "Schedule Review Visit", detail: `No visit in ${days} days`,
        icon: "ti-calendar-plus", color: "#4f7cff", bg: "#eff6ff", urgency: "medium" };
    }
  }
  if (!patient.idVerified || !patient.documentsComplete) {
    return { label: "Complete Verification", detail: "ID or documents require verification",
      icon: "ti-shield-check", color: "#64748b", bg: "#f1f5f9", urgency: "low" };
  }
  if (!patient.nextAppointment) {
    return { label: "Book Next Appointment", detail: "No upcoming appointment scheduled",
      icon: "ti-calendar", color: "#4f7cff", bg: "#eff6ff", urgency: "low" };
  }
  return { label: "Patient Up To Date", detail: "No immediate actions required",
    icon: "ti-circle-check", color: "#22c55e", bg: "#dcfce7", urgency: "none" };
}

// ─── Visit Readiness ───────────────────────────────────────────────────────────
export function calcVisitReadiness(patient: Partial<Patient>): VisitReadiness {
  const items = [
    { key: "phoneVerified",     label: "Phone Verified",          done: !!patient.phoneVerified     },
    { key: "idVerified",        label: "ID Verified",             done: !!patient.idVerified        },
    { key: "consentSigned",     label: "Consent Signed",          done: !!patient.consentSigned     },
    { key: "insuranceVerified", label: "Insurance Valid",         done: !!patient.insuranceVerified },
    { key: "emergencyContact",  label: "Emergency Contact Added", done: !!(patient.emergencyName && patient.emergencyPhone) },
    { key: "documentsComplete", label: "Documents Complete",      done: !!patient.documentsComplete },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, ready: done === items.length };
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
export function getPatientStats(patients: Patient[]): PatientStats {
  return {
    total:         patients.length,
    active:        patients.filter((p) => p.status === "Active").length,
    followUpDue:   patients.filter((p) => p.status === "Follow-Up Due").length,
    newPatients:   patients.filter((p) => p.status === "New").length,
    insExpiring:   patients.filter((p) => p.insuranceStatus === "Expiring").length,
    criticalAlerts: patients.filter((p) =>
      (p.alerts || []).some((a) => ["Allergy","Heart Condition","Pregnancy","High Risk"].includes(a))
    ).length,
  };
}

// ─── Search / Filter ───────────────────────────────────────────────────────────
const SMART_PHRASES: Array<{ match: string[]; fn: (p: Patient) => boolean }> = [
  { match: ["diabetic","diabetes"],           fn: (p) => p.alerts.includes("Diabetic") },
  { match: ["hypertension","hypertensive"],   fn: (p) => p.alerts.includes("Hypertension") },
  { match: ["heart","cardiac"],               fn: (p) => p.alerts.includes("Heart Condition") },
  { match: ["pregnant","pregnancy"],          fn: (p) => p.alerts.includes("Pregnancy") },
  { match: ["allerg"],                        fn: (p) => p.alerts.includes("Allergy") },
  { match: ["high risk"],                     fn: (p) => p.alerts.includes("High Risk") },
  { match: ["vip"],                           fn: (p) => p.status === "VIP" },
  { match: ["follow-up overdue","overdue"],   fn: (p) => p.status === "Follow-Up Due" || !!(p.followUpDate && new Date(p.followUpDate) < new Date()) },
  { match: ["follow-up","followup"],          fn: (p) => p.status === "Follow-Up Due" || !!p.followUpDate },
  { match: ["expired insurance"],             fn: (p) => p.insuranceStatus === "Expired" },
  { match: ["insurance expir"],               fn: (p) => p.insuranceStatus === "Expiring" || p.insuranceStatus === "Expired" },
  { match: ["no insurance","uninsured"],      fn: (p) => p.insurer === "None" || !p.insurer },
  { match: ["missing consent","no consent"],  fn: (p) => !p.consentSigned },
  { match: ["90 days","inactive","no visit"], fn: (p) => !!(p.lastVisit && Math.floor((Date.now() - new Date(p.lastVisit).getTime()) / 86400000) >= 90) },
  { match: ["new patient"],                   fn: (p) => p.status === "New" },
  { match: ["active"],                        fn: (p) => p.status === "Active" },
  { match: ["critical"],                      fn: (p) => calcRiskScore(p).level === "Critical" },
  { match: ["missing emergency"],             fn: (p) => !p.emergencyName || !p.emergencyPhone },
];

export function applySmartSearch(patients: Patient[], query: string): Patient[] {
  const q = query.trim().toLowerCase();
  if (!q) return patients;

  for (const phrase of SMART_PHRASES) {
    if (phrase.match.some((m) => q.includes(m))) {
      return patients.filter(phrase.fn);
    }
  }

  return patients.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.phone?.includes(q) ||
    p.id.toLowerCase().includes(q) ||
    p.doctor?.toLowerCase().includes(q) ||
    (p.policyNumber && p.policyNumber.toLowerCase().includes(q)) ||
    p.email?.toLowerCase().includes(q) ||
    p.bloodGroup?.toLowerCase().includes(q)
  );
}

export function sortPatients(
  list: Patient[],
  key: keyof Patient,
  dir: "asc" | "desc",
): Patient[] {
  return [...list].sort((a, b) => {
    const av = (a[key] ?? "") as string | number;
    const bv = (b[key] ?? "") as string | number;
    if (typeof av === "number" && typeof bv === "number") {
      return dir === "asc" ? av - bv : bv - av;
    }
    return dir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
}

// ─── Audit ─────────────────────────────────────────────────────────────────────
export function createAuditEntry(opts: {
  patientId: string;
  message: string;
  type?: string;
  user?: string;
}): AuditEntry {
  return {
    id:        `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId: opts.patientId,
    message:   opts.message,
    type:      opts.type || "general",
    user:      opts.user || "System",
    timestamp: new Date().toISOString(),
  };
}

export function addAuditEntry(
  auditMap: Record<string, AuditEntry[]>,
  patientId: string,
  entry: AuditEntry,
): Record<string, AuditEntry[]> {
  return {
    ...auditMap,
    [patientId]: [...(auditMap[patientId] || []), entry],
  };
}

// ─── Smart Snapshot ─────────────────────────────────────────────────────────────
export function buildSmartSnapshot(patient: Partial<Patient>): string {
  const parts: string[] = [];
  const now = new Date();

  if (patient.lastVisit) {
    const days = Math.floor((now.getTime() - new Date(patient.lastVisit).getTime()) / 86400000);
    parts.push(`Last seen ${days} day${days !== 1 ? "s" : ""} ago${patient.doctor ? ` by ${patient.doctor}` : ""}.`);
  }
  if (patient.status === "Follow-Up Due") parts.push("Follow-up overdue.");
  if (patient.insuranceExpiry) {
    const daysLeft = Math.floor((new Date(patient.insuranceExpiry).getTime() - now.getTime()) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 30) parts.push(`Insurance expires in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}.`);
    if (daysLeft < 0) parts.push("Insurance has expired.");
  }
  if (patient.allergies) parts.push(`Critical allergy: ${patient.allergies}.`);
  const criticals = (patient.alerts || []).filter((a) =>
    ["Allergy","Heart Condition","Pregnancy","High Risk"].includes(a)
  );
  if (criticals.length > 0) parts.push(`Alert: ${criticals.join(", ")}.`);
  if (!patient.consentSigned) parts.push("Consent not yet signed.");

  return parts.length > 0 ? parts.join(" ") : "No urgent flags for this patient.";
}

// ─── Duplicate Detection ───────────────────────────────────────────────────────
export interface DuplicateGroup {
  type: string;
  patients: [Patient, Patient];
  field: string;
  value: string;
}

export function detectDuplicates(patients: Patient[]): DuplicateGroup[] {
  const duplicates: DuplicateGroup[] = [];
  const phoneMap = new Map<string, Patient>();
  const nameMap  = new Map<string, Patient>();

  patients.forEach((p) => {
    if (p.phone) {
      const norm = p.phone.replace(/\D/g, "").slice(-10);
      if (phoneMap.has(norm)) {
        duplicates.push({ type: "phone", patients: [phoneMap.get(norm)!, p], field: "phone", value: p.phone });
      } else {
        phoneMap.set(norm, p);
      }
    }
    const key = `${p.name.toLowerCase()}-${p.dob || ""}`;
    if (nameMap.has(key)) {
      duplicates.push({ type: "name_dob", patients: [nameMap.get(key)!, p], field: "name", value: p.name });
    } else {
      nameMap.set(key, p);
    }
  });

  return duplicates;
}

// ─── localStorage persistence ──────────────────────────────────────────────────
const STORAGE_KEY = "clinic_crm_patients_v1";
const AUDIT_KEY   = "clinic_crm_audit_v1";

export function savePatients(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch { /* storage full — silently ignore */ }
}

export function loadPatients(): Patient[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Patient[];
  } catch {
    return null;
  }
}

export function saveAuditMap(map: Record<string, AuditEntry[]>): void {
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(map));
  } catch { /* ignore */ }
}

export function loadAuditMap(): Record<string, AuditEntry[]> {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AuditEntry[]>;
  } catch {
    return {};
  }
}

// ─── Drug Interaction Database ──────────────────────────────────────────────────
const DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    id: "di-1",
    drug1: "Aspirin",
    drug2: "Warfarin",
    severity: "Major",
    description: "Increased risk of bleeding when aspirin is taken with warfarin",
    recommendation: "Consider alternative antiplatelet therapy or monitor INR closely"
  },
  {
    id: "di-2",
    drug1: "ACE Inhibitors",
    drug2: "Potassium Supplements",
    severity: "Major",
    description: "May cause hyperkalemia (high potassium levels)",
    recommendation: "Monitor potassium levels regularly"
  },
  {
    id: "di-3",
    drug1: "Statins",
    drug2: "Macrolide Antibiotics",
    severity: "Major",
    description: "Increased risk of myopathy and rhabdomyolysis",
    recommendation: "Consider alternative antibiotic or temporary statin discontinuation"
  },
  {
    id: "di-4",
    drug1: "SSRIs",
    drug2: "MAOIs",
    severity: "Contraindicated",
    description: "Serotonin syndrome risk - potentially life-threatening",
    recommendation: "Do not combine these medications"
  },
  {
    id: "di-5",
    drug1: "Metformin",
    drug2: "IV Contrast",
    severity: "Major",
    description: "Increased risk of lactic acidosis",
    recommendation: "Hold metformin before and after contrast administration"
  },
  {
    id: "di-6",
    drug1: "Beta Blockers",
    drug2: "Calcium Channel Blockers",
    severity: "Moderate",
    description: "May cause excessive bradycardia or heart block",
    recommendation: "Monitor heart rate and blood pressure"
  },
  {
    id: "di-7",
    drug1: "NSAIDs",
    drug2: "Corticosteroids",
    severity: "Moderate",
    description: "Increased risk of gastrointestinal bleeding",
    recommendation: "Consider gastroprotective therapy"
  },
  {
    id: "di-8",
    drug1: "Diuretics",
    drug2: "Lithium",
    severity: "Major",
    description: "May increase lithium levels to toxic range",
    recommendation: "Monitor lithium levels closely"
  },
];

export function checkDrugInteractions(medications: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  const normalizedMeds = medications.map(m => m.toLowerCase());

  for (const interaction of DRUG_INTERACTIONS) {
    const drug1Match = normalizedMeds.some(m => m.includes(interaction.drug1.toLowerCase()));
    const drug2Match = normalizedMeds.some(m => m.includes(interaction.drug2.toLowerCase()));

    if (drug1Match && drug2Match) {
      interactions.push(interaction);
    }
  }

  return interactions;
}

export function getInteractionSeverityColor(severity: string): string {
  switch (severity) {
    case "Contraindicated": return "var(--red)";
    case "Major": return "var(--red)";
    case "Moderate": return "var(--amber)";
    case "Minor": return "var(--blue)";
    default: return "var(--muted)";
  }
}

export function getInteractionSeverityBg(severity: string): string {
  switch (severity) {
    case "Contraindicated": return "var(--red-bg)";
    case "Major": return "var(--red-bg)";
    case "Moderate": return "var(--amber-bg)";
    case "Minor": return "var(--blue-bg)";
    default: return "var(--surface3)";
  }
}

// ─── Drug Database ────────────────────────────────────────────────────────────────
const DRUG_DATABASE = [
  { id: "drug-1", name: "Paracetamol", genericName: "Acetaminophen", category: "Analgesic", dosageForms: ["Tablet", "Syrup", "Injection"], commonDosages: ["500mg", "650mg", "1000mg"] },
  { id: "drug-2", name: "Ibuprofen", genericName: "Ibuprofen", category: "NSAID", dosageForms: ["Tablet", "Capsule", "Gel"], commonDosages: ["200mg", "400mg", "600mg", "800mg"] },
  { id: "drug-3", name: "Amoxicillin", genericName: "Amoxicillin", category: "Antibiotic", dosageForms: ["Capsule", "Suspension"], commonDosages: ["250mg", "500mg"] },
  { id: "drug-4", name: "Metformin", genericName: "Metformin", category: "Antidiabetic", dosageForms: ["Tablet", "SR Tablet"], commonDosages: ["500mg", "850mg", "1000mg"] },
  { id: "drug-5", name: "Amlodipine", genericName: "Amlodipine", category: "Antihypertensive", dosageForms: ["Tablet"], commonDosages: ["2.5mg", "5mg", "10mg"] },
  { id: "drug-6", name: "Omeprazole", genericName: "Omeprazole", category: "PPI", dosageForms: ["Capsule", "Tablet"], commonDosages: ["10mg", "20mg", "40mg"] },
  { id: "drug-7", name: "Atorvastatin", genericName: "Atorvastatin", category: "Statin", dosageForms: ["Tablet"], commonDosages: ["10mg", "20mg", "40mg", "80mg"] },
  { id: "drug-8", name: "Losartan", genericName: "Losartan", category: "ARB", dosageForms: ["Tablet"], commonDosages: ["25mg", "50mg", "100mg"] },
  { id: "drug-9", name: "Cetirizine", genericName: "Cetirizine", category: "Antihistamine", dosageForms: ["Tablet", "Syrup"], commonDosages: ["5mg", "10mg"] },
  { id: "drug-10", name: "Montelukast", genericName: "Montelukast", category: "Leukotriene Receptor Antagonist", dosageForms: ["Tablet", "Chewable Tablet"], commonDosages: ["4mg", "5mg", "10mg"] },
  { id: "drug-11", name: "Aspirin", genericName: "Acetylsalicylic Acid", category: "Antiplatelet", dosageForms: ["Tablet", "Enteric Coated Tablet"], commonDosages: ["75mg", "100mg", "325mg"] },
  { id: "drug-12", name: "Warfarin", genericName: "Warfarin Sodium", category: "Anticoagulant", dosageForms: ["Tablet"], commonDosages: ["1mg", "2mg", "5mg"] },
  { id: "drug-13", name: "Pantoprazole", genericName: "Pantoprazole", category: "PPI", dosageForms: ["Tablet", "Injection"], commonDosages: ["20mg", "40mg"] },
  { id: "drug-14", name: "Azithromycin", genericName: "Azithromycin", category: "Antibiotic", dosageForms: ["Tablet", "Suspension"], commonDosages: ["250mg", "500mg"] },
  { id: "drug-15", name: "Ciprofloxacin", genericName: "Ciprofloxacin", category: "Antibiotic", dosageForms: ["Tablet", "Injection"], commonDosages: ["250mg", "500mg", "750mg"] },
];

export function searchDrugs(query: string) {
  if (!query) return DRUG_DATABASE;
  const lowerQuery = query.toLowerCase();
  return DRUG_DATABASE.filter((drug) =>
    drug.name.toLowerCase().includes(lowerQuery) ||
    drug.genericName.toLowerCase().includes(lowerQuery) ||
    drug.category.toLowerCase().includes(lowerQuery)
  );
}

export function getDrugById(id: string) {
  return DRUG_DATABASE.find((drug) => drug.id === id);
}

// ─── Clinical Decision Support ─────────────────────────────────────────────────────
const TREATMENT_PROTOCOLS = [
  {
    condition: "Diabetes Type 2",
    protocol: "Metformin 500mg twice daily + Lifestyle modifications (diet, exercise)",
    monitoring: ["HbA1c every 3 months", "Fasting blood glucose", "Kidney function"],
    redFlags: ["HbA1c > 9%", "Fasting glucose > 180 mg/dL", "Symptoms of hyperglycemia"],
  },
  {
    condition: "Hypertension",
    protocol: "ACE inhibitor or ARB + Lifestyle modifications (low sodium diet, exercise)",
    monitoring: ["Blood pressure weekly", "Kidney function", "Electrolytes"],
    redFlags: ["BP > 160/100 mmHg", "Chest pain", "Severe headache"],
  },
  {
    condition: "Asthma",
    protocol: "Inhaled corticosteroids + Short-acting beta-agonists as needed",
    monitoring: ["Peak flow monitoring", "Symptom diary", "Inhaler technique"],
    redFlags: ["Peak flow < 50% personal best", "Frequent night symptoms", "Rescue inhaler use > 2x/week"],
  },
  {
    condition: "Heart Failure",
    protocol: "ACE inhibitor + Beta-blocker + Diuretics as needed",
    monitoring: ["Daily weight", "Blood pressure", "Kidney function", "BNP levels"],
    redFlags: ["Weight gain > 2kg in 3 days", "Increasing shortness of breath", "Swelling in legs"],
  },
  {
    condition: "COPD",
    protocol: "Bronchodilators + Smoking cessation + Pulmonary rehabilitation",
    monitoring: ["Spirometry annually", "Oxygen saturation", "Symptom assessment"],
    redFlags: ["Oxygen saturation < 88%", "Increased sputum production", "Fever"],
  },
];

const CLINICAL_ALERTS = [
  {
    trigger: "high_blood_pressure",
    message: "Blood pressure reading is elevated. Consider immediate intervention.",
    severity: "high",
  },
  {
    trigger: "high_blood_sugar",
    message: "Blood glucose level is critically high. Immediate medical attention may be required.",
    severity: "critical",
  },
  {
    trigger: "low_oxygen_saturation",
    message: "Oxygen saturation is below normal range. Assess respiratory status.",
    severity: "high",
  },
  {
    trigger: "high_temperature",
    message: "Temperature indicates fever. Consider infection screening.",
    severity: "medium",
  },
];

export function getTreatmentProtocol(condition: string) {
  return TREATMENT_PROTOCOLS.find((p) => p.condition.toLowerCase() === condition.toLowerCase());
}

export function getClinicalAlerts(vitalSigns: any[]) {
  const alerts: any[] = [];
  if (!vitalSigns) return alerts;

  vitalSigns.forEach((v: any) => {
    if (v.type === "Blood Pressure" && v.value) {
      const systolic = parseInt(v.value.split("/")[0]);
      if (systolic > 160) {
        alerts.push({ type: "high_blood_pressure", message: `BP ${v.value} is critically elevated`, severity: "high", date: v.date });
      }
    }
    if (v.type === "Blood Glucose" && v.value) {
      const glucose = parseInt(v.value);
      if (glucose > 300) {
        alerts.push({ type: "high_blood_sugar", message: `Glucose ${v.value} mg/dL is critically high`, severity: "critical", date: v.date });
      }
    }
    if (v.type === "Oxygen Saturation" && v.value) {
      const saturation = parseInt(v.value);
      if (saturation < 88) {
        alerts.push({ type: "low_oxygen_saturation", message: `O2 saturation ${v.value}% is below normal`, severity: "high", date: v.date });
      }
    }
    if (v.type === "Temperature" && v.value) {
      const temp = parseFloat(v.value);
      if (temp > 38.5) {
        alerts.push({ type: "high_temperature", message: `Temperature ${v.value}°C indicates fever`, severity: "medium", date: v.date });
      }
    }
  });

  return alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getClinicalRecommendations(patient: any) {
  const recommendations: string[] = [];
  
  // Check for active conditions
  if (patient.medicalConditions) {
    patient.medicalConditions.forEach((condition: any) => {
      const protocol = getTreatmentProtocol(condition.name);
      if (protocol) {
        recommendations.push(`For ${condition.name}: ${protocol.protocol}`);
      }
    });
  }

  // Check for medication interactions
  if (patient.medications && patient.medications.length > 1) {
    const interactions = checkDrugInteractions(patient.medications.map((m: any) => m.name));
    if (interactions.length > 0) {
      interactions.forEach((i) => {
        if (i.severity === "Contraindicated" || i.severity === "Major") {
          recommendations.push(`⚠️ ${i.drug1} + ${i.drug2}: ${i.severity} interaction - ${i.description}`);
        }
      });
    }
  }

  return recommendations;
}
