import React from "react";
import type { Patient } from "./types";
import { calcRiskScore } from "./utils";

// ─── Shared Helpers ───────────────────────────────────────────────────────────
export function PrintWrapper({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) {
  // Use an effect to listen for afterprint
  React.useEffect(() => {
    const handleAfterPrint = () => {
      if (onClose) onClose();
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [onClose]);

  return (
    <div style={{ 
      position: "fixed", inset: 0, zIndex: 99999, 
      background: "#fff", color: "#000", overflowY: "auto",
      padding: "40px 0"
    }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, .crm-root { background: #fff !important; }
        }
      `}</style>
      <div className="no-print" style={{ position: "fixed", top: 20, right: 20, zIndex: 100000 }}>
        {onClose && (
          <button onClick={onClose} style={{ 
            background: "#1e3a5f", color: "#fff", border: "none", 
            padding: "8px 16px", borderRadius: "4px", cursor: "pointer",
            fontWeight: 600, fontSize: "14px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>
            Close Preview
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const PRINT_STYLES: React.CSSProperties = {
  background: "#fff",
  minHeight: "100vh",
  fontFamily: "'Segoe UI', Arial, sans-serif",
  fontSize: "11pt",
  color: "#111",
  lineHeight: 1.5,
  printColorAdjust: "exact" as any,
  WebkitPrintColorAdjust: "exact" as any,
};

// ─── PrintHeader ─────────────────────────────────────────────────────────────
interface PrintHeaderProps { title: string; subtitle?: string; showLogo?: boolean; }

export function PrintHeader({ title, subtitle, showLogo = true }: PrintHeaderProps) {
  return (
    <div style={{ borderBottom: "3px solid #1e3a5f", paddingBottom: 16, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {showLogo && (
            <div style={{ fontSize: "20pt", fontWeight: 900, color: "#1e3a5f", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 32, height: 32, background: "#1e3a5f", borderRadius: "50%", textAlign: "center", lineHeight: "32px", fontSize: "14pt", color: "#fff" }}>✚</span>
              ClinicOS
            </div>
          )}
          <div style={{ fontSize: "13pt", fontWeight: 700, color: "#1e3a5f", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{title}</div>
          {subtitle && <div style={{ fontSize: "9pt", color: "#666", marginTop: 3 }}>{subtitle}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "9pt", color: "#555", lineHeight: 1.7 }}>
          <div style={{ fontWeight: 700, fontSize: "10pt", color: "#1e3a5f" }}>ClinicOS Medical Centre</div>
          <div>Demo Unit — Not Connected to Backend</div>
          <div>contact@clinicos.demo</div>
          <div style={{ marginTop: 6, fontSize: "8pt", color: "#999" }}>Printed: {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
        </div>
      </div>
    </div>
  );
}

// ─── PrintFooter ─────────────────────────────────────────────────────────────
interface PrintFooterProps { pageNumber?: number; totalPages?: number; }

export function PrintFooter({ pageNumber, totalPages }: PrintFooterProps) {
  return (
    <div style={{ borderTop: "2px solid #1e3a5f", marginTop: 32, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "8.5pt", color: "#666" }}>
      <div><strong>CONFIDENTIAL</strong> — This document is intended solely for the named individual and authorised clinical personnel.</div>
      {pageNumber && totalPages && <div style={{ fontWeight: 600 }}>Page {pageNumber} of {totalPages}</div>}
    </div>
  );
}

// ─── Section Components ───────────────────────────────────────────────────────
function Section({ title, children, alert }: { title: string; children: React.ReactNode; alert?: boolean }) {
  return (
    <div style={{ marginBottom: 20, breakInside: "avoid" as any }}>
      <div style={{ background: alert ? "#7f1d1d" : "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: "9.5pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: "3px 3px 0 0" }}>
        {title}
      </div>
      <div style={{ border: `1px solid ${alert ? "#b91c1c" : "#c5d5e8"}`, borderTop: "none", borderRadius: "0 0 3px 3px", padding: 12, background: alert ? "#fff7f7" : "#fff" }}>
        {children}
      </div>
    </div>
  );
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px 24px" }}>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div style={{ borderBottom: "1px dotted #ddd", paddingBottom: 4, marginBottom: 4 }}>
      <div style={{ fontSize: "8.5pt", color: "#777", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: "10.5pt", fontWeight: 600, color: "#111" }}>{value || "—"}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "#dcfce7", New: "#dbeafe", Inactive: "#fee2e2", Expired: "#fee2e2",
    Expiring: "#fef9c3", Verified: "#dcfce7", Pending: "#fef9c3", Signed: "#dcfce7",
  };
  return (
    <span style={{ background: map[status] || "#f3f4f6", padding: "2px 8px", borderRadius: 3, fontSize: "9pt", fontWeight: 700, color: "#333" }}>
      {status}
    </span>
  );
}

// ─── PatientProfilePrint ──────────────────────────────────────────────────────

interface PatientProfilePrintProps { patient: Patient; onClose?: () => void; }
export function PatientProfilePrint({ patient, onClose }: PatientProfilePrintProps) {
  const risk = calcRiskScore(patient);
  const criticalAlerts = (patient.alerts || []).filter((a: string) => ["Heart Condition", "Severe Allergy", "Kidney Disease"].includes(a));

  return (
    <PrintWrapper onClose={onClose}>
      <div style={{ ...PRINT_STYLES, padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>
      <PrintHeader title="Patient Medical Record" subtitle={`Patient ID: ${patient.id} · Generated: ${new Date().toLocaleDateString("en-IN")}`} />

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div style={{ background: "#7f1d1d", color: "#fff", padding: "10px 16px", borderRadius: 4, marginBottom: 20, display: "flex", alignItems: "center", gap: 10, printColorAdjust: "exact" as any }}>
          <span style={{ fontSize: "16pt", flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "10pt", textTransform: "uppercase", letterSpacing: "0.05em" }}>Critical Medical Alerts</div>
            <div style={{ fontSize: "10pt", marginTop: 2 }}>{criticalAlerts.join(" · ")}</div>
          </div>
        </div>
      )}

      <Section title="Patient Demographics">
        <Grid cols={3}>
          <Field label="Full Name" value={patient.name} />
          <Field label="Patient ID" value={patient.id} />
          <Field label="Date of Birth" value={patient.dob} />
          <Field label="Age" value={`${patient.age} years`} />
          <Field label="Gender" value={patient.gender} />
          <Field label="Blood Group" value={patient.bloodGroup} />
          <Field label="Nationality" value={patient.nationality} />
          <Field label="Phone" value={patient.phone} />
          <Field label="Email" value={patient.email} />
        </Grid>
        {patient.address && (
          <div style={{ marginTop: 8, borderTop: "1px dotted #ddd", paddingTop: 8 }}>
            <Field label="Address" value={patient.address} />
          </div>
        )}
      </Section>

      <Grid cols={2}>
        <div>
          <Section title="Emergency Contact">
            <Field label="Name" value={patient.emergencyName} />
            <Field label="Relationship" value={patient.emergencyRelation} />
            <Field label="Phone" value={patient.emergencyPhone} />
          </Section>
        </div>
        <div>
          <Section title="Visit Summary">
            <Field label="Attending Physician" value={patient.doctor} />
            <Field label="Last Visit" value={fmtDate(patient.lastVisit)} />
            <Field label="Next Appointment" value={patient.nextAppointment ? fmtDate(patient.nextAppointment) : "Not scheduled"} />
            <Field label="Patient Status" value={patient.status} />
          </Section>
        </div>
      </Grid>

      <Grid cols={2}>
        <div>
          <Section title="Insurance" alert={patient.insuranceStatus === "Expired"}>
            <Field label="Provider" value={patient.insuranceProvider} />
            <Field label="Policy Number" value={patient.policyNumber} />
            <Field label="Status" value={patient.insuranceStatus} />
            <Field label="Expiry" value={patient.insuranceExpiry ? fmtDate(patient.insuranceExpiry) : undefined} />
          </Section>
        </div>
        <div>
          <Section title="Risk Assessment">
            <Field label="Risk Level" value={`${risk.level} (Score: ${risk.score})`} />
            <Field label="VIP Patient" value={patient.vip ? "Yes" : "No"} />
            <div style={{ marginTop: 8 }}>
              {risk.factors && risk.factors.length > 0 && (
                <div>
                  <div style={{ fontSize: "8.5pt", color: "#777", textTransform: "uppercase", marginBottom: 4 }}>Risk Factors</div>
                  {risk.factors.slice(0, 4).map((f: string, i: number) => <div key={i} style={{ fontSize: "9.5pt", color: "#444", marginBottom: 2 }}>• {f}</div>)}
                </div>
              )}
            </div>
          </Section>
        </div>
      </Grid>

      {/* Allergies */}
      {patient.allergies && (
        <Section title="⚠ Allergies — Must Review Before Treatment" alert>
          <div style={{ fontSize: "13pt", fontWeight: 700, color: "#991b1b" }}>{patient.allergies}</div>
        </Section>
      )}

      {/* Medical Conditions */}
      {patient.conditions && patient.conditions.length > 0 && (
        <Section title="Active Medical Conditions">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {patient.conditions.map((c: string, i: number) => (
              <span key={i} style={{ background: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: 3, fontSize: "9.5pt", fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        </Section>
      )}

      {/* Medications */}
      {patient.medications && patient.medications.length > 0 && (
        <Section title="Active Medications">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700, borderBottom: "1px solid #cbd5e1" }}>Medication</th>
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700, borderBottom: "1px solid #cbd5e1" }}>Dosage</th>
                <th style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700, borderBottom: "1px solid #cbd5e1" }}>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {(patient.medications as any[]).map((med: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600 }}>{typeof med === "string" ? med : med.name}</td>
                  <td style={{ padding: "6px 10px", color: "#555" }}>{typeof med === "object" ? med.dosage || "—" : "—"}</td>
                  <td style={{ padding: "6px 10px", color: "#555" }}>{typeof med === "object" ? med.frequency || "—" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Vital Signs */}
      {patient.vitalSigns && patient.vitalSigns.length > 0 && (
        <Section title="Recent Vital Signs">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Type", "Value", "Date", "Notes"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", fontWeight: 700, borderBottom: "1px solid #cbd5e1" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patient.vitalSigns.slice(0, 8).map((v, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "6px 10px", fontWeight: 600 }}>{v.type}</td>
                  <td style={{ padding: "6px 10px" }}>{v.value}</td>
                  <td style={{ padding: "6px 10px", color: "#555" }}>{fmtDate(v.date)}</td>
                  <td style={{ padding: "6px 10px", color: "#777" }}>{v.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Verification */}
      <Section title="Verification Status">
        <Grid cols={4}>
          <Field label="Phone" value={patient.phoneVerified ? "✓ Verified" : "Pending"} />
          <Field label="Insurance" value={patient.insuranceVerified ? "✓ Verified" : "Pending"} />
          <Field label="ID" value={patient.idVerified ? "✓ Verified" : "Pending"} />
          <Field label="Consent" value={patient.consentSigned ? "✓ Signed" : "Pending"} />
        </Grid>
      </Section>

      {/* Signature Block */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, gap: 40 }}>
        {["Attending Physician Signature", "Patient / Guardian Signature", "Date"].map((label) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ borderBottom: "1.5px solid #333", marginBottom: 6 }}>&nbsp;</div>
            <div style={{ fontSize: "8.5pt", color: "#555" }}>{label}</div>
          </div>
        ))}
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
      </div>
    </PrintWrapper>
  );
}

// ─── PrescriptionPrint ────────────────────────────────────────────────────────

export function PrescriptionPrint({ patient, medications, doctorName, onClose }: PrescriptionPrintProps) {
  return (
    <PrintWrapper onClose={onClose}>
      <div style={{ ...PRINT_STYLES, padding: "24px 28px", maxWidth: 750, margin: "0 auto" }}>
      {/* Letterhead */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "4px solid #1e3a5f", paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: "22pt", fontWeight: 900, color: "#1e3a5f" }}>ClinicOS</div>
          <div style={{ fontSize: "9.5pt", color: "#555", marginTop: 2 }}>Medical Prescription — Demo Centre</div>
        </div>
        <div style={{ fontSize: "48pt", fontWeight: 900, color: "#1e3a5f", lineHeight: 1 }}>℞</div>
      </div>

      <Grid cols={2}>
        <div>
          <Section title="Patient">
            <Field label="Name" value={patient.name} />
            <Field label="ID" value={patient.id} />
            <Field label="Age / Gender" value={`${patient.age} yrs / ${patient.gender}`} />
            {patient.allergies && (
              <div style={{ marginTop: 8, background: "#fff3cd", border: "1px solid #ffc107", padding: "4px 8px", borderRadius: 3, fontSize: "9pt", fontWeight: 600, color: "#664d03" }}>
                ⚠ Allergy: {patient.allergies}
              </div>
            )}
          </Section>
        </div>
        <div>
          <Section title="Prescribing Physician">
            <Field label="Doctor" value={doctorName || patient.doctor} />
            <Field label="Date Issued" value={new Date().toLocaleDateString("en-IN")} />
          </Section>
        </div>
      </Grid>

      <Section title="Prescribed Medications">
        {medications.map((med, i) => (
          <div key={i} style={{ borderBottom: i < medications.length - 1 ? "1px solid #e2e8f0" : "none", paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: "13pt", fontWeight: 700, color: "#1e3a5f", marginBottom: 4 }}>{i + 1}. {med.name}</div>
            <Grid cols={3}>
              <Field label="Dosage" value={med.dosage} />
              <Field label="Frequency" value={med.frequency} />
              <Field label="Quantity" value={`${med.quantity}${med.refills != null ? ` (Refills: ${med.refills})` : ""}`} />
            </Grid>
            {med.instructions && (
              <div style={{ marginTop: 6, fontSize: "9.5pt", color: "#555", fontStyle: "italic" }}>Instructions: {med.instructions}</div>
            )}
          </div>
        ))}
      </Section>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, gap: 40 }}>
        {["Physician Signature & Stamp", "Date"].map((label) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ borderBottom: "1.5px solid #333", marginBottom: 6, marginTop: 40 }}>&nbsp;</div>
            <div style={{ fontSize: "8.5pt", color: "#555" }}>{label}</div>
          </div>
        ))}
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
      </div>
    </PrintWrapper>
  );
}

// ─── MedicalReportPrint ───────────────────────────────────────────────────────

export function MedicalReportPrint({ patient, reportType, reportData, onClose }: MedicalReportPrintProps) {
  const titles = { lab: "Laboratory Report", radiology: "Radiology Report", pathology: "Pathology Report", general: "Medical Report" };

  return (
    <PrintWrapper onClose={onClose}>
      <div style={{ ...PRINT_STYLES, padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>
      <PrintHeader title={reportData?.title || titles[reportType]} subtitle={`Patient ID: ${patient.id} · Report Date: ${new Date().toLocaleDateString("en-IN")}`} />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <span style={{ background: "#fee2e2", color: "#991b1b", padding: "4px 12px", borderRadius: 3, fontSize: "9pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>CONFIDENTIAL</span>
      </div>

      <Section title="Patient Information">
        <Grid cols={4}>
          <Field label="Patient Name" value={patient.name} />
          <Field label="Patient ID" value={patient.id} />
          <Field label="Age / Gender" value={`${patient.age} yrs / ${patient.gender}`} />
          <Field label="Ordered By" value={reportData?.orderedBy || patient.doctor} />
        </Grid>
      </Section>

      {reportData?.results && reportData.results.length > 0 && (
        <Section title="Test Results">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
            <thead>
              <tr style={{ background: "#1e3a5f" }}>
                {["Test", "Result", "Unit", "Reference Range", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 10px", fontWeight: 700, color: "#fff", fontSize: "9pt" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.results.map((r, i) => (
                <tr key={i} style={{ background: r.status === "abnormal" ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "7px 10px", fontWeight: 600 }}>{r.test}</td>
                  <td style={{ padding: "7px 10px", fontWeight: 700, color: r.status === "abnormal" ? "#dc2626" : "#16a34a" }}>{r.value}</td>
                  <td style={{ padding: "7px 10px", color: "#555" }}>{r.unit}</td>
                  <td style={{ padding: "7px 10px", color: "#555" }}>{r.reference}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ background: r.status === "normal" ? "#dcfce7" : "#fee2e2", color: r.status === "normal" ? "#166534" : "#991b1b", padding: "2px 8px", borderRadius: 3, fontSize: "8.5pt", fontWeight: 700, textTransform: "uppercase" }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {reportData?.findings && (
        <Section title="Findings">
          <div style={{ lineHeight: 1.7, color: "#222", whiteSpace: "pre-wrap" }}>{reportData.findings}</div>
        </Section>
      )}

      {reportData?.impression && (
        <Section title="Impression">
          <div style={{ lineHeight: 1.7, color: "#222", whiteSpace: "pre-wrap" }}>{reportData.impression}</div>
        </Section>
      )}

      {reportData?.recommendations && (
        <Section title="Recommendations">
          <div style={{ lineHeight: 1.7, color: "#222", whiteSpace: "pre-wrap" }}>{reportData.recommendations}</div>
        </Section>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, gap: 40 }}>
        {["Reporting Physician Signature", "Date"].map((label) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ borderBottom: "1.5px solid #333", marginBottom: 6, marginTop: 40 }}>&nbsp;</div>
            <div style={{ fontSize: "8.5pt", color: "#555" }}>{label}</div>
          </div>
        ))}
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
      </div>
    </PrintWrapper>
  );
}

// ─── BillingStatementPrint ────────────────────────────────────────────────────

export function BillingStatementPrint({ patient, invoiceNumber, invoiceDate, dueDate, items, subtotal, tax, total, paidAmount, onClose }: BillingStatementPrintProps) {
  const balanceDue = paidAmount != null ? total - paidAmount : total;

  return (
    <PrintWrapper onClose={onClose}>
      <div style={{ ...PRINT_STYLES, padding: "24px 28px", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #1e3a5f", paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: "20pt", fontWeight: 900, color: "#1e3a5f" }}>ClinicOS</div>
          <div style={{ fontSize: "9pt", color: "#777" }}>Demo Medical Centre</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "16pt", fontWeight: 800, color: "#1e3a5f" }}>INVOICE</div>
          <div style={{ fontSize: "11pt", fontWeight: 600, color: "#555" }}>#{invoiceNumber}</div>
        </div>
      </div>

      {/* Billing info row */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, gap: 32 }}>
        <div>
          <div style={{ fontSize: "9pt", color: "#777", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Bill To</div>
          <div style={{ fontSize: "12pt", fontWeight: 700 }}>{patient.name}</div>
          <div style={{ fontSize: "10pt", color: "#555" }}>{patient.address || "Address not provided"}</div>
          <div style={{ fontSize: "10pt", color: "#555" }}>{patient.phone}</div>
          <div style={{ fontSize: "10pt", color: "#555" }}>Patient ID: {patient.id}</div>
        </div>
        <div>
          <div style={{ fontSize: "9pt", color: "#777", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>Invoice Details</div>
          <Field label="Invoice Date" value={invoiceDate} />
          <Field label="Due Date" value={dueDate} />
          <Field label="Insurance" value={patient.insuranceStatus} />
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginBottom: 20 }}>
        <thead>
          <tr style={{ background: "#1e3a5f" }}>
            <th style={{ textAlign: "left", padding: "8px 12px", color: "#fff", fontSize: "9pt", fontWeight: 700 }}>Description</th>
            <th style={{ textAlign: "left", padding: "8px 12px", color: "#fff", fontSize: "9pt", fontWeight: 700 }}>Date</th>
            <th style={{ textAlign: "right", padding: "8px 12px", color: "#fff", fontSize: "9pt", fontWeight: 700 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
              <td style={{ padding: "8px 12px" }}>{item.description}</td>
              <td style={{ padding: "8px 12px", color: "#555" }}>{item.date}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>₹{item.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ minWidth: 260 }}>
          {[
            { label: "Subtotal", value: `₹${subtotal.toFixed(2)}` },
            { label: "Tax / GST", value: `₹${tax.toFixed(2)}` },
            ...(paidAmount != null ? [{ label: "Amount Paid", value: `-₹${paidAmount.toFixed(2)}` }] : []),
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px dotted #ddd", fontSize: "10pt", color: "#555" }}>
              <span>{label}</span><span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "8px 12px", background: "#1e3a5f", color: "#fff", borderRadius: 3 }}>
            <span style={{ fontWeight: 700, fontSize: "11pt" }}>BALANCE DUE</span>
            <span style={{ fontWeight: 800, fontSize: "13pt" }}>₹{balanceDue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: "9pt", color: "#555" }}>
        <strong>Payment Terms:</strong> Payment is due within 30 days of invoice date. For queries, contact billing@clinicos.demo.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, gap: 40 }}>
        {["Authorised Signatory", "Date"].map((label) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ borderBottom: "1.5px solid #333", marginBottom: 6, marginTop: 32 }}>&nbsp;</div>
            <div style={{ fontSize: "8.5pt", color: "#555" }}>{label}</div>
          </div>
        ))}
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
      </div>
    </PrintWrapper>
  );
}
