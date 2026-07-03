import React, { useState, useCallback } from "react";
import type { Patient, AuditEntry, UserRole, TimelineEvent, PatientNote, PatientDocument } from "./types";
import {
  fmtDate, getAvatarColor, getInitials, calcRiskScore, calcAge,
  calcVisitReadiness, calcNextBestAction, buildSmartSnapshot,
  createAuditEntry, getClinicalAlerts, getClinicalRecommendations,
} from "./utils";

import {
  StatusBadge, AlertChip, InsuranceBadge, BloodGroupBadge,
  RiskBadge, AvatarCircle, VerifiedDot, ConsentBadge,
} from "./Badges";
import { can, QUICK_ACTIONS, ALERT_SEVERITY, CONSENT_TYPES } from "./constants";

const DOCUMENT_TYPES = [
  "Lab Report", "Prescription", "Imaging", "Discharge Summary",
  "Consent Form", "Insurance Card", "ID Proof", "Referral Letter", "Other",
] as const;

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const PROFILE_TABS = [
  { id: "overview",      label: "Overview",      icon: "ti-layout-dashboard" },
  { id: "timeline",      label: "Timeline",      icon: "ti-timeline" },
  { id: "medical",       label: "Medical History", icon: "ti-heart-pulse" },
  { id: "clinical",      label: "Clinical Support", icon: "ti-brain" },
  { id: "documents",     label: "Documents",     icon: "ti-files" },
  { id: "notes",         label: "Notes",         icon: "ti-notes" },
  { id: "followup",      label: "Follow-Up",     icon: "ti-phone" },
  { id: "consents",      label: "Consents",      icon: "ti-writing" },
  { id: "audit",         label: "Audit Log",     icon: "ti-history" },
] as const;

type TabId = typeof PROFILE_TABS[number]["id"];

// ─── Props ────────────────────────────────────────────────────────────────────
interface PatientProfileProps {
  patient: Patient;
  auditEntries: AuditEntry[];
  onBack: () => void;
  onEditPatient: () => void;
  onUpdatePatient: (p: Patient, action?: string) => void;
  onDeletePatient: (id: string) => void;
  onPrint?: () => void;
  role: UserRole;
}

export default function PatientProfile({
  patient,
  auditEntries = [],
  onBack,
  onEditPatient,
  onUpdatePatient,
  onDeletePatient,
  onPrint,
  role,
}: PatientProfileProps) {
  const [tab,          setTab]          = useState<TabId>("overview");
  const [showEmergency,setShowEmergency] = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [quickAction,  setQuickAction]  = useState<string | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const nba  = calcNextBestAction(patient);
  const risk = calcRiskScore(patient);
  const readiness = calcVisitReadiness(patient);
  const snapshot  = buildSmartSnapshot(patient);
  const avatarBg  = getAvatarColor(patient.name);

  function handleVerificationToggle(key: string) {
    const updated = { ...patient, [key]: !patient[key as keyof Patient] };
    onUpdatePatient(updated as Patient, "verification updated");
  }

  function handleAddTimelineEvent(event: Omit<TimelineEvent, "id">) {
    const newEvent: TimelineEvent = {
      ...event,
      id: `tl-${Date.now()}`,
    };
    onUpdatePatient(
      { ...patient, timeline: [...(patient.timeline || []), newEvent] },
      "timeline event added",
    );
  }

  function handleDeleteTimelineEvent(id: string) {
    onUpdatePatient(
      { ...patient, timeline: (patient.timeline || []).filter((e) => e.id !== id) },
      "timeline event deleted",
    );
  }

  function handleAddNote(note: Omit<PatientNote, "id">) {
    const newNote: PatientNote = { ...note, id: `note-${Date.now()}` };
    onUpdatePatient(
      { ...patient, notes: [...(patient.notes || []), newNote] },
      "note added",
    );
  }

  function handleDeleteNote(id: string) {
    onUpdatePatient(
      { ...patient, notes: (patient.notes || []).filter((n) => n.id !== id) },
      "note deleted",
    );
  }

  function handleToggleNotePin(id: string) {
    onUpdatePatient({
      ...patient,
      notes: (patient.notes || []).map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n),
    }, "note pinned");
  }

  function handleAddDocument(doc: Omit<PatientDocument, "id">) {
    const newDoc: PatientDocument = { ...doc, id: `doc-${Date.now()}` };
    onUpdatePatient(
      { ...patient, documents: [...(patient.documents || []), newDoc] },
      "document added",
    );
  }

  function handleDeleteDocument(id: string) {
    onUpdatePatient(
      { ...patient, documents: (patient.documents || []).filter((d) => d.id !== id) },
      "document deleted",
    );
  }

  function handleToggleConsent(key: string) {
    const consents = { ...(patient.consents || {}), [key]: !(patient.consents || {})[key] };
    const allSigned = CONSENT_TYPES.every((c) => consents[c.key]);
    onUpdatePatient({ ...patient, consents, consentSigned: allSigned }, "consent updated");
  }

  function handleUpdateFollowUp(updates: Partial<Patient>) {
    onUpdatePatient({ ...patient, ...updates }, "follow-up updated");
  }

  function handleQuickAction(action: string) {
    const medicalActions = ["Start Consultation", "New Prescription"];
    if (medicalActions.includes(action) && !can(role, "editPatient")) {
      setQuickAction("Doctor/Admin only in this demo.");
      return;
    }
    switch (action) {
      case "Book Appointment":
        setShowAppointmentModal(true);
        break;
      case "Start Consultation":
        setShowConsultationModal(true);
        break;
      case "New Prescription":
        setShowPrescriptionModal(true);
        break;
      case "Upload Report":
        setTab("documents");
        break;
      case "Create Invoice":
        // Demo-only: no real billing system. Falls through to default demo modal.
        setQuickAction(action);
        break;
      case "Call Patient":
        handleUpdateFollowUp({
          callAttempts: (patient.callAttempts || 0) + 1,
          lastContacted: new Date().toISOString().split("T")[0],
        });
        handleAddTimelineEvent({
          type: "call",
          label: "Patient Called",
          icon: "ti-phone",
          color: "#3b82f6",
          date: new Date(),
          note: `Call attempt #${(patient.callAttempts || 0) + 1} logged.`,
          doctor: patient.doctor,
        } as Omit<TimelineEvent, "id">);
        break;
      case "Schedule Follow-Up":
        setShowFollowUpModal(true);
        break;
      case "Send Message":
        setShowMessageModal(true);
        break;
      default:
        setQuickAction(action);
    }
  }

  const tabCounts: Partial<Record<TabId, number>> = {
    timeline:  (patient.timeline  || []).length,
    documents: (patient.documents || []).length,
    notes:     (patient.notes     || []).length,
    audit:     auditEntries.length,
    followup:  patient.followUpDate ? 1 : 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* ── Header ── */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        {/* Critical alert banner */}
        {(patient.alerts || []).some((a) => ALERT_SEVERITY[a as keyof typeof ALERT_SEVERITY] === "critical") && (
          <div style={{
            background: "var(--red-bg)", borderBottom: "2px solid var(--red)",
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: "var(--red)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 12, color: "#fff" }} />
            </div>
            <span style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: "#991b1b", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Critical Medical Alert
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(patient.alerts || [])
                .filter((a) => ALERT_SEVERITY[a as keyof typeof ALERT_SEVERITY] === "critical")
                .map((a) => (
                  <span key={a} style={{
                    padding: "2px 8px", borderRadius: "var(--radius-full)", background: "var(--red)",
                    color: "#fff", fontSize: "var(--font-xs)", fontWeight: 700,
                  }}>{a}</span>
                ))}
            </div>
            <span style={{ marginLeft: "auto", fontSize: "var(--font-xs)", color: "#991b1b" }}>
              Review before proceeding
            </span>
          </div>
        )}

        {/* Identity row */}
        <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={onBack} style={{ padding: "12px", fontSize: "var(--font-sm)", flexShrink: 0, minHeight: 44 }}>
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} />
            <span className="desktop-only">Back</span>
          </button>

          {/* Avatar */}
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: avatarBg + "22", color: avatarBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800,
          }}>
            {getInitials(patient.name)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 800, color: "var(--text)", margin: 0 }}>
                {patient.name}
              </h2>
              <StatusBadge status={patient.status} />
              <RiskBadge patient={patient} />
              {patient.status === "VIP" && (
                <span className="badge" style={{ background: "#fff7ed", color: "#92400e", border: "1px solid #f97316" }}>
                  <i className="ti ti-crown" style={{ fontSize: 10 }} /> VIP
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
              {[
                { icon: "ti-calendar", label: calcAge(patient.dob) + " yrs" },
                { icon: "ti-phone", label: patient.phone },
                { icon: "ti-mail", label: patient.email },
                { icon: "ti-map-pin", label: patient.city },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-sm)", color: "var(--muted)" }}>
                  <i className={`ti ${item.icon}`} style={{ fontSize: 13 }} />
                  <span className="desktop-only">{item.label}</span>
                  <span className="mobile-only">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={() => setShowEmergency(true)} style={{ fontSize: "var(--font-sm)", padding: "12px", minHeight: 44 }}>
              <i className="ti ti-emergency-bed" style={{ fontSize: 14, color: "var(--red)" }} />
              <span className="desktop-only">Emergency</span>
            </button>
            {onPrint && (
              <button className="btn btn-ghost" onClick={() => onPrint()} style={{ fontSize: "var(--font-sm)", padding: "12px", minHeight: 44 }}>
                <i className="ti ti-printer" style={{ fontSize: 14 }} />
                <span className="desktop-only">Print</span>
              </button>
            )}
            {can(role, "editPatient") && (
              <button className="btn btn-primary" onClick={onEditPatient} style={{ fontSize: "var(--font-sm)", padding: "12px", minHeight: 44 }}>
                <i className="ti ti-edit" style={{ fontSize: 14 }} />
                <span className="desktop-only">Edit</span>
              </button>
            )}
            {can(role, "deletePatient") && (
              <button className="btn btn-danger" onClick={() => setShowDelete(true)} style={{ fontSize: "var(--font-sm)", padding: "12px", minHeight: 44 }}>
                <i className="ti ti-trash" style={{ fontSize: 14 }} />
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ padding: "0 16px", display: "flex", gap: 2, overflowX: "auto", scrollbarWidth: "none" }}>
          {PROFILE_TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "12px 14px", borderRadius: "var(--radius) var(--radius) 0 0",
                border: "1px solid transparent", borderBottom: "none",
                fontSize: "var(--font-sm)", fontWeight: tab === id ? 600 : 400,
                cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
                color:      tab === id ? "var(--accent)" : "var(--muted)",
                background: tab === id ? "var(--bg)" : "transparent",
                marginBottom: tab === id ? -1 : 0,
                borderColor: tab === id ? "var(--border)" : "transparent",
                minHeight: 44,
              }}
            >
              <i className={`ti ${icon}`} style={{ fontSize: 14 }} />
              <span className="desktop-only">{label}</span>
              <span className="mobile-only">{label.split(" ")[0]}</span>
              {tabCounts[id] !== undefined && tabCounts[id]! > 0 && (
                <span style={{
                  fontSize: "var(--font-2xs)", fontWeight: 700, padding: "1px 5px",
                  borderRadius: "var(--radius-full)",
                  background: tab === id ? "var(--accent-soft)" : "var(--surface3)",
                  color: tab === id ? "var(--accent)" : "var(--muted)",
                }}>
                  {tabCounts[id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ flex: 1, overflow: "auto", background: "var(--bg)" }}>
        <div className="fade-in" key={tab} style={{ padding: 16 }}>
          {tab === "overview"  && <OverviewTab patient={patient} role={role} onVerificationToggle={handleVerificationToggle} snapshot={snapshot} readiness={readiness} onQuickAction={handleQuickAction} />}
          {tab === "timeline"  && <TimelineTab patient={patient} role={role} onAddEvent={handleAddTimelineEvent} onDeleteEvent={handleDeleteTimelineEvent} />}
          {tab === "medical"   && <MedicalHistoryTab patient={patient} role={role} onUpdatePatient={onUpdatePatient} />}
          {tab === "clinical"  && <ClinicalSupportTab patient={patient} />}
          {tab === "documents" && <DocumentsTab patient={patient} role={role} onAddDoc={handleAddDocument} onDeleteDoc={handleDeleteDocument} />}
          {tab === "notes"     && <NotesTab patient={patient} role={role} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onTogglePin={handleToggleNotePin} />}
          {tab === "followup"  && <FollowUpTab patient={patient} onUpdate={handleUpdateFollowUp} />}
          {tab === "consents"  && <ConsentsTab patient={patient} onToggle={handleToggleConsent} />}
          {tab === "audit"     && <AuditTab entries={auditEntries} />}
        </div>
      </div>

      {/* ── Modals ── */}
      {showEmergency && <EmergencyModal patient={patient} onClose={() => setShowEmergency(false)} />}
      {showDelete && (
        <ConfirmDeleteModal
          patient={patient}
          onConfirm={() => {
            onDeletePatient(patient.id);
            setShowDelete(false);
          }}
          onClose={() => setShowDelete(false)}
        />
      )}
      {quickAction && (
        <QuickActionModal action={quickAction} patient={patient} onClose={() => setQuickAction(null)} />
      )}
      {showAppointmentModal && (
        <AppointmentModal patient={patient} onClose={() => setShowAppointmentModal(false)} onUpdatePatient={onUpdatePatient} onAddTimelineEvent={handleAddTimelineEvent} />
      )}
      {showConsultationModal && (
        <ConsultationModal patient={patient} onClose={() => setShowConsultationModal(false)} onAddTimelineEvent={handleAddTimelineEvent} />
      )}
      {showPrescriptionModal && (
        <PrescriptionModal patient={patient} onClose={() => setShowPrescriptionModal(false)} onUpdatePatient={onUpdatePatient} onAddTimelineEvent={handleAddTimelineEvent} />
      )}
      {showFollowUpModal && (
        <FollowUpModal patient={patient} onClose={() => setShowFollowUpModal(false)} onUpdatePatient={handleUpdateFollowUp} />
      )}
      {showMessageModal && (
        <MessageModal patient={patient} onClose={() => setShowMessageModal(false)} onAddNote={handleAddNote} />
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  patient, role, onVerificationToggle, snapshot, readiness, onQuickAction
}: {
  patient: Patient;
  role: UserRole;
  onVerificationToggle: (key: string) => void;
  snapshot: string;
  readiness: ReturnType<typeof calcVisitReadiness>;
  onQuickAction: (a: string) => void;
}) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }} className="desktop-only">
        {/* Main col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Snapshot */}
        <div className="card card-padded" style={{
          background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 100%)",
          border: "1px solid var(--accent)30",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <i className="ti ti-sparkles" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                AI Snapshot
              </div>
              <div style={{ fontSize: "var(--font-sm)", color: "var(--text)", lineHeight: 1.6 }}>
                {snapshot}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <InfoCard title="Quick Actions" icon="ti-bolt" iconBg="var(--purple-bg)" iconColor="var(--purple)">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} onClick={() => onQuickAction(a.label)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "12px 8px", borderRadius: "var(--radius)", border: "1px solid var(--border)",
                background: "var(--surface2)", cursor: "pointer", transition: "all 0.15s",
              }}>
                <i className={`ti ${a.icon}`} style={{ fontSize: 18, color: a.color }} />
                <span style={{ fontSize: "var(--font-xs)", fontWeight: 600, color: "var(--text)" }}>{a.label}</span>
              </button>
            ))}
          </div>
        </InfoCard>

        {/* Visit Readiness */}
        <InfoCard title="Visit Readiness" icon="ti-checklist" iconBg="var(--green-bg)" iconColor="var(--green)">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {readiness.items.map((item) => (
              <button key={item.key} onClick={() => onVerificationToggle(item.key)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                borderRadius: "var(--radius-sm)", border: `1px solid ${item.done ? "var(--green-border)" : "var(--red-border)"}`,
                background: item.done ? "var(--green-bg)" : "transparent",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                <i className={`ti ${item.done ? "ti-check" : "ti-circle"}`} style={{ fontSize: 12, color: item.done ? "var(--green)" : "var(--red)" }} />
                <span style={{ fontSize: "var(--font-sm)", color: "var(--text)" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </InfoCard>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <InfoCard title="Patient Info" icon="ti-user" iconBg="var(--blue-bg)" iconColor="var(--blue)">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "ID", value: patient.id },
              { label: "Age", value: `${patient.age} yrs` },
              { label: "Gender", value: patient.gender },
              { label: "Blood Group", value: patient.bloodGroup },
              { label: "Phone", value: patient.phone },
              { label: "Email", value: patient.email },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
                <span style={{ color: "var(--muted)" }}>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="Insurance" icon="ti-shield" iconBg="var(--amber-bg)" iconColor="var(--amber)">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
              <span style={{ color: "var(--muted)" }}>Provider</span>
              <span style={{ fontWeight: 600 }}>{patient.insurer || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
              <span style={{ color: "var(--muted)" }}>Policy</span>
              <span style={{ fontWeight: 600 }}>{patient.policyNumber || "—"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
              <span style={{ color: "var(--muted)" }}>Status</span>
              <InsuranceBadge status={patient.insuranceStatus} />
            </div>
            {patient.insuranceExpiry && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
                <span style={{ color: "var(--muted)" }}>Expiry</span>
                <span style={{ fontWeight: 600 }}>{fmtDate(patient.insuranceExpiry)}</span>
              </div>
            )}
          </div>
        </InfoCard>
      </div>
    </div>

    {/* Mobile version - single column */}
    <div className="mobile-only" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Snapshot */}
      <div className="card card-padded" style={{
        background: "linear-gradient(135deg, var(--accent-soft) 0%, var(--surface) 100%)",
        border: "1px solid var(--accent)30",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <i className="ti ti-sparkles" style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
              AI Snapshot
            </div>
            <p style={{ fontSize: "var(--font-sm)", color: "var(--text)", lineHeight: 1.6 }}>
              {snapshot}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <InfoCard title="Quick Actions" icon="ti-bolt" iconBg="var(--purple-bg)" iconColor="var(--purple)">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} onClick={() => onQuickAction(a.label)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              padding: "12px 8px", borderRadius: "var(--radius)", border: "1px solid var(--border)",
              background: "var(--surface2)", cursor: "pointer", transition: "all 0.15s",
            }}>
              <i className={`ti ${a.icon}`} style={{ fontSize: 18, color: a.color }} />
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 600, color: "var(--text)" }}>{a.label}</span>
            </button>
          ))}
        </div>
      </InfoCard>

      {/* Visit Readiness */}
      <InfoCard title="Visit Readiness" icon="ti-checklist" iconBg="var(--green-bg)" iconColor="var(--green)">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {readiness.items.map((item) => (
            <button key={item.key} onClick={() => onVerificationToggle(item.key)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
              borderRadius: "var(--radius-sm)", border: `1px solid ${item.done ? "var(--green-border)" : "var(--red-border)"}`,
              background: item.done ? "var(--green-bg)" : "transparent",
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <i className={`ti ${item.done ? "ti-check" : "ti-circle"}`} style={{ fontSize: 12, color: item.done ? "var(--green)" : "var(--red)" }} />
              <span style={{ fontSize: "var(--font-sm)", color: "var(--text)" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </InfoCard>

      {/* Patient Info */}
      <InfoCard title="Patient Info" icon="ti-user" iconBg="var(--blue-bg)" iconColor="var(--blue)">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "ID", value: patient.id },
            { label: "Age", value: `${patient.age} yrs` },
            { label: "Gender", value: patient.gender },
            { label: "Blood Group", value: patient.bloodGroup },
            { label: "Phone", value: patient.phone },
            { label: "Email", value: patient.email },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
              <span style={{ color: "var(--muted)" }}>{item.label}</span>
              <span style={{ fontWeight: 600 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </InfoCard>

      {/* Insurance */}
      <InfoCard title="Insurance" icon="ti-shield" iconBg="var(--amber-bg)" iconColor="var(--amber)">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
            <span style={{ color: "var(--muted)" }}>Provider</span>
            <span style={{ fontWeight: 600 }}>{patient.insurer || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
            <span style={{ color: "var(--muted)" }}>Policy</span>
            <span style={{ fontWeight: 600 }}>{patient.policyNumber || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
            <span style={{ color: "var(--muted)" }}>Status</span>
            <InsuranceBadge status={patient.insuranceStatus} />
          </div>
          {patient.insuranceExpiry && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-sm)" }}>
              <span style={{ color: "var(--muted)" }}>Expiry</span>
              <span style={{ fontWeight: 600 }}>{fmtDate(patient.insuranceExpiry)}</span>
            </div>
          )}
        </div>
      </InfoCard>
    </div>
    </>
  );
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────
function TimelineTab({
  patient, role, onAddEvent, onDeleteEvent,
}: {
  patient: Patient;
  role: UserRole;
  onAddEvent: (e: Omit<TimelineEvent, "id">) => void;
  onDeleteEvent: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "", description: "", date: "" });

  function submit() {
    if (!form.type || !form.description || !form.date) return;
    onAddEvent({ ...form, date: form.date });
    setForm({ type: "", description: "", date: "" });
    setShowForm(false);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Clinical Timeline</span>
        {can(role, "editPatient") && (
          <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowForm(true)}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
            Add Event
          </button>
        )}
      </div>

      {showForm && (
        <div className="card card-padded" style={{ marginBottom: 16, border: "1px solid var(--accent)40" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input
              type="text"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              placeholder="Event type"
              style={{ fontSize: "var(--font-sm)" }}
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              style={{ fontSize: "var(--font-sm)" }}
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={{ fontSize: "var(--font-sm)" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={submit}>Add Event</button>
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {(patient.timeline || []).length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-timeline empty-state-icon" />
            <div className="empty-state-sub">No timeline events</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Date</th><th>Type</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(patient.timeline || []).map((ev) => (
                <tr key={ev.id} className="tbl-row">
                  <td style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>
                    {fmtDate(ev.date)}
                  </td>
                  <td style={{ fontSize: "var(--font-sm)" }}>{ev.type}</td>
                  <td style={{ fontSize: "var(--font-sm)" }}>{ev.description}</td>
                  <td>
                    {can(role, "editPatient") && (
                      <button className="btn-icon" style={{ padding: 4 }} onClick={() => onDeleteEvent(ev.id)}>
                        <i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────
function DocumentsTab({
  patient, role, onAddDoc, onDeleteDoc,
}: {
  patient: Patient;
  role: UserRole;
  onAddDoc: (doc: Omit<PatientDocument, "id">) => void;
  onDeleteDoc: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "", name: "", date: "" });

  function submit() {
    if (!form.type || !form.name || !form.date) return;
    onAddDoc({ ...form, date: form.date, verified: false });
    setForm({ type: "", name: "", date: "" });
    setShowForm(false);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Documents</span>
        {can(role, "editPatient") && (
          <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowForm(true)}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add Document
          </button>
        )}
      </div>

      {showForm && (
        <div className="card card-padded" style={{ marginBottom: 16, border: "1px solid var(--accent)40" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ fontSize: "var(--font-sm)" }}>
              <option value="">Select type...</option>
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Document name" style={{ fontSize: "var(--font-sm)" }} />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ fontSize: "var(--font-sm)" }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={() => { onAddDoc(form); setShowForm(false); }}>
              Add
            </button>
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        {(patient.documents || []).length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-files empty-state-icon" />
            <div className="empty-state-sub">No documents</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr><th>Type</th><th>Name</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(patient.documents || []).map((doc) => (
                <tr key={doc.id} className="tbl-row">
                  <td style={{ fontSize: "var(--font-sm)" }}>{doc.type}</td>
                  <td style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{doc.name}</td>
                  <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(doc.date)}</td>
                  <td>
                    <span className="tag" style={{ background: doc.verified ? "var(--green-bg)" : "var(--amber-bg)", color: doc.verified ? "var(--green)" : "var(--amber)" }}>
                      {doc.verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td>
                    {can(role, "deleteDocument") && (
                      <button className="btn-icon" style={{ padding: 3, marginLeft: "auto" }} onClick={() => onDeleteDoc(doc.id)}>
                        <i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────
function NotesTab({
  patient, role, onAddNote, onDeleteNote, onTogglePin,
}: {
  patient: Patient;
  role: UserRole;
  onAddNote: (n: Omit<PatientNote, "id">) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("general");
  const [text, setText] = useState("");

  const CATEGORIES = [
    { id: "general", label: "General", color: "var(--blue)" },
    { id: "clinical", label: "Clinical", color: "var(--green)" },
    { id: "medication", label: "Medication", color: "var(--purple)" },
    { id: "followup", label: "Follow-up", color: "var(--amber)" },
  ];

  function submit() {
    if (!text.trim()) return;
    onAddNote({ text, category, pinned: false, date: new Date().toISOString().split("T")[0] });
    setText("");
    setShowForm(false);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Notes</span>
        {can(role, "editPatient") && (
          <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowForm(true)}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add Note
          </button>
        )}
      </div>

      {showForm && (
        <div className="card card-padded" style={{ marginBottom: 16, border: "1px solid var(--accent)40" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{
                padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "var(--font-xs)", fontWeight: 600,
                border: `1px solid ${category === c.id ? c.color : "var(--border)"}`,
                background: category === c.id ? c.color + "15" : "transparent",
                color: category === c.id ? c.color : "var(--muted)",
              }}>
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a note..."
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={submit}>Save Note</button>
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(patient.notes || []).length === 0 ? (
          <div className="card card-padded">
            <div className="empty-state">
              <i className="ti ti-notes empty-state-icon" />
              <div className="empty-state-sub">No notes yet</div>
            </div>
          </div>
        ) : (
          (patient.notes || [])
            .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((n) => (
              <div key={n.id} className="card card-padded" style={{ borderLeft: `3px solid ${CATEGORIES.find((c) => c.id === n.category)?.color || "var(--border)"}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontSize: "var(--font-sm)", color: "var(--text)", lineHeight: 1.6, flex: 1 }}>{n.text}</p>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button className="btn-icon" style={{ padding: 4 }} onClick={() => onTogglePin(n.id)}>
                      <i className={`ti ${n.pinned ? "ti-pin-filled" : "ti-pin"}`} style={{ fontSize: 12, color: n.pinned ? "var(--amber)" : "var(--muted)" }} />
                    </button>
                    {can(role, "editPatient") && (
                      <button className="btn-icon" style={{ padding: 4 }} onClick={() => onDeleteNote(n.id)}>
                        <i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: "var(--font-xs)", color: "var(--muted)" }}>
                  <span className="tag" style={{ background: CATEGORIES.find((c) => c.id === n.category)?.color + "15", color: CATEGORIES.find((c) => c.id === n.category)?.color }}>
                    {CATEGORIES.find((c) => c.id === n.category)?.label}
                  </span>
                  <span>{fmtDate(n.date)}</span>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ─── Follow-Up Tab ─────────────────────────────────────────────────────────────
function FollowUpTab({ patient, onUpdate }: { patient: Patient; onUpdate: (u: Partial<Patient>) => void }) {
  const [notes,   setNotes]   = useState(patient.followUpNotes || "");
  const [status,  setStatus]  = useState(patient.followUpStatus || "Pending");
  const [saved,   setSaved]   = useState(false);

  function save() {
    onUpdate({
      followUpStatus:   status as any,
      followUpNotes:    notes,
      lastContacted:    new Date().toISOString().split("T")[0],
      callAttempts:     (patient.callAttempts || 0) + 1,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function logCall() {
    onUpdate({
      callAttempts:  (patient.callAttempts || 0) + 1,
      lastContacted: new Date().toISOString().split("T")[0],
      followUpStatus: "Called" as any,
    });
  }

  if (!patient.followUpDate) {
    return (
      <div className="empty-state">
        <i className="ti ti-phone empty-state-icon" />
        <div className="empty-state-text">No follow-up scheduled</div>
        <div className="empty-state-sub">Follow-up information will appear here when scheduled</div>
      </div>
    );
  }

  const STATUS_OPTIONS = [
    { id: "Pending",   label: "Pending",   color: "#d97706" },
    { id: "Called",    label: "Called",    color: "#2563eb" },
    { id: "No Answer", label: "No Answer", color: "#dc2626" },
    { id: "Completed", label: "Completed", color: "#16a34a" },
  ];
  const current = STATUS_OPTIONS.find((s) => s.id === status) || STATUS_OPTIONS[0];

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-calendar" style={{ fontSize: 11, marginRight: 4 }} />Follow-Up Date</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{fmtDate(patient.followUpDate)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-phone" style={{ fontSize: 11, marginRight: 4 }} />Call Attempts</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{patient.callAttempts || 0}</div>
        </div>
        {patient.followUpReason && (
          <div className="stat-card" style={{ gridColumn: "1 / -1" }}>
            <div className="stat-label">Reason</div>
            <div style={{ fontSize: "var(--font-sm)", marginTop: 4 }}>{patient.followUpReason}</div>
          </div>
        )}
      </div>

      <div className="card card-padded">
        <div className="section-label">Status</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {STATUS_OPTIONS.map((s) => (
            <button key={s.id} onClick={() => setStatus(s.id)} style={{
              flex: 1, padding: "8px 12px", borderRadius: "var(--radius)",
              border: `2px solid ${status === s.id ? s.color : "var(--border)"}`,
              background: status === s.id ? s.color + "12" : "transparent",
              color: status === s.id ? s.color : "var(--muted)",
              fontWeight: status === s.id ? 700 : 500, fontSize: "var(--font-sm)", cursor: "pointer",
            }}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="field-group" style={{ marginBottom: 12 }}>
          <label className="field-label">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Add follow-up notes…" rows={4}
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>

        {patient.lastContacted && (
          <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginBottom: 12 }}>
            Last contacted: {fmtDate(patient.lastContacted)}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={save}>
            <i className="ti ti-device-floppy" style={{ fontSize: 13 }} />
            {saved ? "Saved!" : "Save"}
          </button>
          <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)" }} onClick={logCall}>
            <i className="ti ti-phone" style={{ fontSize: 13 }} />
            Log Call
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Medical History Tab ─────────────────────────────────────────────────────────
function MedicalHistoryTab({ patient, role, onUpdatePatient }: { patient: Patient; role: UserRole; onUpdatePatient: (p: Patient) => void }) {
  const [activeSection, setActiveSection] = useState<"conditions" | "surgeries" | "hospitalizations" | "vaccinations" | "labresults" | "imaging" | "medications" | "vitals">("conditions");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const medicalConditions = patient.medicalConditions || [];
  const surgeries = patient.surgeries || [];
  const hospitalizations = patient.hospitalizations || [];
  const vaccinations = patient.vaccinations || [];
  const labResults = patient.labResults || [];
  const imagingRecords = patient.imagingRecords || [];
  const medications = patient.medications || [];
  const vitalSigns = patient.vitalSigns || [];

  function handleAdd() {
    const updatedPatient = { ...patient };
    if (activeSection === "conditions") {
      updatedPatient.medicalConditions = [...medicalConditions, { ...formData, id: Date.now().toString() }];
    } else if (activeSection === "surgeries") {
      updatedPatient.surgeries = [...surgeries, { ...formData, id: Date.now().toString() }];
    } else if (activeSection === "hospitalizations") {
      updatedPatient.hospitalizations = [...hospitalizations, { ...formData, id: Date.now().toString() }];
    } else if (activeSection === "vaccinations") {
      updatedPatient.vaccinations = [...vaccinations, { ...formData, id: Date.now().toString() }];
    } else if (activeSection === "labresults") {
      updatedPatient.labResults = [...labResults, { ...formData, id: Date.now().toString() }];
    } else if (activeSection === "imaging") {
      updatedPatient.imagingRecords = [...imagingRecords, { ...formData, id: Date.now().toString() }];
    } else if (activeSection === "medications") {
      updatedPatient.medications = [...medications, { ...formData, id: Date.now().toString() }];
    } else if (activeSection === "vitals") {
      updatedPatient.vitalSigns = [...vitalSigns, { ...formData, id: Date.now().toString() }];
    }
    onUpdatePatient(updatedPatient);
    setShowAddForm(false);
    setFormData({});
  }

  function handleDelete(id: string) {
    const updatedPatient = { ...patient };
    if (activeSection === "conditions") {
      updatedPatient.medicalConditions = medicalConditions.filter((c: any) => c.id !== id);
    } else if (activeSection === "surgeries") {
      updatedPatient.surgeries = surgeries.filter((s: any) => s.id !== id);
    } else if (activeSection === "hospitalizations") {
      updatedPatient.hospitalizations = hospitalizations.filter((h: any) => h.id !== id);
    } else if (activeSection === "vaccinations") {
      updatedPatient.vaccinations = vaccinations.filter((v: any) => v.id !== id);
    } else if (activeSection === "labresults") {
      updatedPatient.labResults = labResults.filter((l: any) => l.id !== id);
    } else if (activeSection === "imaging") {
      updatedPatient.imagingRecords = imagingRecords.filter((i: any) => i.id !== id);
    } else if (activeSection === "medications") {
      updatedPatient.medications = medications.filter((m: any) => m.id !== id);
    } else if (activeSection === "vitals") {
      updatedPatient.vitalSigns = vitalSigns.filter((v: any) => v.id !== id);
    }
    onUpdatePatient(updatedPatient);
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Medical History</span>
        {can(role, "editPatient") && (
          <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowAddForm(true)}>
            <i className="ti ti-plus" style={{ fontSize: 13 }} /> Add Record
          </button>
        )}
      </div>

      {/* Section Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {[
          { id: "conditions", label: "Conditions", count: medicalConditions.length },
          { id: "surgeries", label: "Surgeries", count: surgeries.length },
          { id: "hospitalizations", label: "Hospitalizations", count: hospitalizations.length },
          { id: "vaccinations", label: "Vaccinations", count: vaccinations.length },
          { id: "labresults", label: "Lab Results", count: labResults.length },
          { id: "imaging", label: "Imaging", count: imagingRecords.length },
          { id: "medications", label: "Medications", count: medications.length },
          { id: "vitals", label: "Vital Signs", count: vitalSigns.length },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => { setActiveSection(section.id as any); setShowAddForm(false); }}
            style={{
              padding: "8px 16px",
              borderBottom: `2px solid ${activeSection === section.id ? "var(--accent)" : "transparent"}`,
              color: activeSection === section.id ? "var(--accent)" : "var(--muted)",
              fontWeight: activeSection === section.id ? 600 : 400,
              fontSize: "var(--font-sm)",
              whiteSpace: "nowrap",
            }}
          >
            {section.label} ({section.count})
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card card-padded" style={{ marginBottom: 16, border: "1px solid var(--accent)40" }}>
          <div className="section-label">Add {activeSection === "conditions" ? "Condition" : activeSection === "surgeries" ? "Surgery" : activeSection === "hospitalizations" ? "Hospitalization" : activeSection === "vaccinations" ? "Vaccination" : activeSection === "labresults" ? "Lab Result" : "Imaging Record"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {activeSection === "conditions" && (
              <>
                <div className="field-group">
                  <label className="field-label">Condition Name *</label>
                  <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Diabetes Type 2" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Diagnosis Date</label>
                  <input type="date" value={formData.diagnosisDate || ""} onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Severity</label>
                  <select value={formData.severity || "Moderate"} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} style={{ width: "100%" }}>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select value={formData.status || "Active"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: "100%" }}>
                    <option value="Active">Active</option>
                    <option value="Chronic">Chronic</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </>
            )}
            {activeSection === "surgeries" && (
              <>
                <div className="field-group">
                  <label className="field-label">Surgery Name *</label>
                  <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Appendectomy" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Date</label>
                  <input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Hospital</label>
                  <input type="text" value={formData.hospital || ""} onChange={(e) => setFormData({ ...formData, hospital: e.target.value })} placeholder="Hospital name" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Surgeon</label>
                  <input type="text" value={formData.surgeon || ""} onChange={(e) => setFormData({ ...formData, surgeon: e.target.value })} placeholder="Surgeon name" style={{ width: "100%" }} />
                </div>
              </>
            )}
            {activeSection === "hospitalizations" && (
              <>
                <div className="field-group">
                  <label className="field-label">Reason *</label>
                  <input type="text" value={formData.reason || ""} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Pneumonia" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Admission Date</label>
                  <input type="date" value={formData.admissionDate || ""} onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Discharge Date</label>
                  <input type="date" value={formData.dischargeDate || ""} onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Hospital</label>
                  <input type="text" value={formData.hospital || ""} onChange={(e) => setFormData({ ...formData, hospital: e.target.value })} placeholder="Hospital name" style={{ width: "100%" }} />
                </div>
              </>
            )}
            {activeSection === "vaccinations" && (
              <>
                <div className="field-group">
                  <label className="field-label">Vaccine Name *</label>
                  <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., COVID-19 Vaccine" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Date</label>
                  <input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Dose</label>
                  <input type="text" value={formData.dose || ""} onChange={(e) => setFormData({ ...formData, dose: e.target.value })} placeholder="e.g., 1st dose" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Next Due</label>
                  <input type="date" value={formData.nextDue || ""} onChange={(e) => setFormData({ ...formData, nextDue: e.target.value })} style={{ width: "100%" }} />
                </div>
              </>
            )}
            {activeSection === "labresults" && (
              <>
                <div className="field-group">
                  <label className="field-label">Test Name *</label>
                  <input type="text" value={formData.testName || ""} onChange={(e) => setFormData({ ...formData, testName: e.target.value })} placeholder="e.g., Complete Blood Count" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Test Date</label>
                  <input type="date" value={formData.testDate || ""} onChange={(e) => setFormData({ ...formData, testDate: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Result *</label>
                  <input type="text" value={formData.result || ""} onChange={(e) => setFormData({ ...formData, result: e.target.value })} placeholder="e.g., 12.5 g/dL" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Unit</label>
                  <input type="text" value={formData.unit || ""} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g., g/dL" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Reference Range</label>
                  <input type="text" value={formData.referenceRange || ""} onChange={(e) => setFormData({ ...formData, referenceRange: e.target.value })} placeholder="e.g., 12.0-16.0" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select value={formData.status || "Pending"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: "100%" }}>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Abnormal">Abnormal</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </>
            )}
            {activeSection === "imaging" && (
              <>
                <div className="field-group">
                  <label className="field-label">Imaging Type *</label>
                  <select value={formData.type || "X-Ray"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: "100%" }}>
                    <option value="X-Ray">X-Ray</option>
                    <option value="CT">CT Scan</option>
                    <option value="MRI">MRI</option>
                    <option value="Ultrasound">Ultrasound</option>
                    <option value="PET">PET Scan</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Body Part *</label>
                  <input type="text" value={formData.bodyPart || ""} onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })} placeholder="e.g., Chest" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Date</label>
                  <input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Radiologist</label>
                  <input type="text" value={formData.radiologist || ""} onChange={(e) => setFormData({ ...formData, radiologist: e.target.value })} placeholder="Radiologist name" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select value={formData.status || "Pending"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: "100%" }}>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Reviewed">Reviewed</option>
                  </select>
                </div>
              </>
            )}
            {activeSection === "medications" && (
              <>
                <div className="field-group">
                  <label className="field-label">Drug Name *</label>
                  <input type="text" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Paracetamol" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Dosage *</label>
                  <input type="text" value={formData.dosage || ""} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} placeholder="e.g., 500mg" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Frequency *</label>
                  <input type="text" value={formData.frequency || ""} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} placeholder="e.g., Twice daily" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Route</label>
                  <select value={formData.route || "Oral"} onChange={(e) => setFormData({ ...formData, route: e.target.value })} style={{ width: "100%" }}>
                    <option value="Oral">Oral</option>
                    <option value="Injection">Injection</option>
                    <option value="Topical">Topical</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="IV">IV</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="field-group">
                    <label className="field-label">Start Date</label>
                    <input type="date" value={formData.startDate || ""} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} style={{ width: "100%" }} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">End Date</label>
                    <input type="date" value={formData.endDate || ""} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Status</label>
                  <select value={formData.status || "Active"} onChange={(e) => setFormData({ ...formData, status: e.target.value })} style={{ width: "100%" }}>
                    <option value="Active">Active</option>
                    <option value="Discontinued">Discontinued</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </>
            )}
            {activeSection === "vitals" && (
              <>
                <div className="field-group">
                  <label className="field-label">Vital Type *</label>
                  <select value={formData.type || "Blood Pressure"} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={{ width: "100%" }}>
                    <option value="Blood Pressure">Blood Pressure</option>
                    <option value="Heart Rate">Heart Rate</option>
                    <option value="Temperature">Temperature</option>
                    <option value="Respiratory Rate">Respiratory Rate</option>
                    <option value="Oxygen Saturation">Oxygen Saturation</option>
                    <option value="Weight">Weight</option>
                    <option value="Height">Height</option>
                    <option value="BMI">BMI</option>
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Value *</label>
                  <input type="text" value={formData.value || ""} onChange={(e) => setFormData({ ...formData, value: e.target.value })} placeholder="e.g., 120/80 mmHg" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Unit</label>
                  <input type="text" value={formData.unit || ""} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="e.g., mmHg, bpm, °C" style={{ width: "100%" }} />
                </div>
                <div className="field-group">
                  <label className="field-label">Date</label>
                  <input type="date" value={formData.date || ""} onChange={(e) => setFormData({ ...formData, date: e.target.value })} style={{ width: "100%" }} />
                </div>
              </>
            )}
          </div>
          <div className="field-group" style={{ marginTop: 10 }}>
            <label className="field-label">Notes</label>
            <textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." rows={2} style={{ width: "100%", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" style={{ fontSize: "var(--font-sm)" }} onClick={handleAdd}>Save</button>
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)" }} onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeSection === "conditions" && (
        medicalConditions.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-heart-pulse empty-state-icon" />
            <div className="empty-state-text">No conditions recorded</div>
            <div className="empty-state-sub">Add medical conditions to track patient health</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Condition</th><th>Diagnosed</th><th>Severity</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {medicalConditions.map((c: any) => (
                  <tr key={c.id} className="tbl-row">
                    <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{c.name}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(c.diagnosisDate)}</td>
                    <td><span className="tag" style={{ background: c.severity === "Critical" ? "var(--red-bg)" : c.severity === "Severe" ? "var(--amber-bg)" : "var(--green-bg)", color: c.severity === "Critical" ? "var(--red)" : c.severity === "Severe" ? "var(--amber)" : "var(--green)" }}>{c.severity}</span></td>
                    <td><span className="tag" style={{ background: c.status === "Active" ? "var(--blue-bg)" : c.status === "Chronic" ? "var(--purple-bg)" : "var(--green-bg)", color: c.status === "Active" ? "var(--blue)" : c.status === "Chronic" ? "var(--purple)" : "var(--green)" }}>{c.status}</span></td>
                    <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(c.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeSection === "surgeries" && (
        surgeries.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-surgery empty-state-icon" />
            <div className="empty-state-text">No surgeries recorded</div>
            <div className="empty-state-sub">Add surgical history for comprehensive care</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Surgery</th><th>Date</th><th>Hospital</th><th>Surgeon</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {surgeries.map((s: any) => (
                  <tr key={s.id} className="tbl-row">
                    <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{s.name}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(s.date)}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{s.hospital}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{s.surgeon}</td>
                    <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(s.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeSection === "hospitalizations" && (
        hospitalizations.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-building-hospital empty-state-icon" />
            <div className="empty-state-text">No hospitalizations recorded</div>
            <div className="empty-state-sub">Add hospitalization history for complete records</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Reason</th><th>Admission</th><th>Discharge</th><th>Hospital</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {hospitalizations.map((h: any) => (
                  <tr key={h.id} className="tbl-row">
                    <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{h.reason}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(h.admissionDate)}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{h.dischargeDate ? fmtDate(h.dischargeDate) : "—"}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{h.hospital}</td>
                    <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(h.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeSection === "vaccinations" && (
        vaccinations.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-vaccine empty-state-icon" />
            <div className="empty-state-text">No vaccinations recorded</div>
            <div className="empty-state-sub">Track vaccination history for preventive care</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Vaccine</th><th>Date</th><th>Dose</th><th>Next Due</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vaccinations.map((v: any) => (
                  <tr key={v.id} className="tbl-row">
                    <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{v.name}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(v.date)}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{v.dose}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{v.nextDue ? fmtDate(v.nextDue) : "—"}</td>
                    <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(v.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeSection === "labresults" && (
        labResults.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-test-tubes empty-state-icon" />
            <div className="empty-state-text">No lab results recorded</div>
            <div className="empty-state-sub">Add lab results to track patient diagnostics</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Test Name</th><th>Date</th><th>Result</th><th>Reference</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {labResults.map((l: any) => (
                  <tr key={l.id} className="tbl-row">
                    <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{l.testName}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(l.testDate)}</td>
                    <td style={{ fontSize: "var(--font-sm)" }}>{l.result} {l.unit}</td>
                    <td style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{l.referenceRange}</td>
                    <td><span className="tag" style={{ background: l.status === "Critical" ? "var(--red-bg)" : l.status === "Abnormal" ? "var(--amber-bg)" : l.status === "Completed" ? "var(--green-bg)" : "var(--surface3)", color: l.status === "Critical" ? "var(--red)" : l.status === "Abnormal" ? "var(--amber)" : l.status === "Completed" ? "var(--green)" : "var(--muted)" }}>{l.status}</span></td>
                    <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(l.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeSection === "imaging" && (
        imagingRecords.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-scan empty-state-icon" />
            <div className="empty-state-text">No imaging records</div>
            <div className="empty-state-sub">Add imaging records for radiology history</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Type</th><th>Body Part</th><th>Date</th><th>Radiologist</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {imagingRecords.map((i: any) => (
                  <tr key={i.id} className="tbl-row">
                    <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{i.type}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{i.bodyPart}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(i.date)}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{i.radiologist}</td>
                    <td><span className="tag" style={{ background: i.status === "Reviewed" ? "var(--green-bg)" : i.status === "Completed" ? "var(--blue-bg)" : "var(--surface3)", color: i.status === "Reviewed" ? "var(--green)" : i.status === "Completed" ? "var(--blue)" : "var(--muted)" }}>{i.status}</span></td>
                    <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(i.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeSection === "medications" && (
        medications.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-pills empty-state-icon" />
            <div className="empty-state-text">No medications prescribed</div>
            <div className="empty-state-sub">Add medications to track prescriptions</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Drug</th><th>Dosage</th><th>Frequency</th><th>Route</th><th>Period</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {medications.map((m: any) => (
                  <tr key={m.id} className="tbl-row">
                    <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{m.name}</td>
                    <td style={{ fontSize: "var(--font-sm)" }}>{m.dosage}</td>
                    <td style={{ fontSize: "var(--font-sm)" }}>{m.frequency}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{m.route}</td>
                    <td style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{m.startDate ? `${fmtDate(m.startDate)} - ${m.endDate ? fmtDate(m.endDate) : 'Ongoing'}` : "—"}</td>
                    <td><span className="tag" style={{ background: m.status === "Active" ? "var(--green-bg)" : m.status === "Discontinued" ? "var(--red-bg)" : "var(--blue-bg)", color: m.status === "Active" ? "var(--green)" : m.status === "Discontinued" ? "var(--red)" : "var(--blue)" }}>{m.status}</span></td>
                    <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(m.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeSection === "vitals" && (
        vitalSigns.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-heartbeat empty-state-icon" />
            <div className="empty-state-text">No vital signs recorded</div>
            <div className="empty-state-sub">Add vital signs to track patient health trends</div>
          </div>
        ) : (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Type</th><th>Value</th><th>Unit</th><th>Date</th><th>Trend</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {vitalSigns.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((v: any, index: number) => {
                  // Simple trend calculation based on previous entry of same type
                  const sameTypeVitals = vitalSigns.filter((vs: any) => vs.type === v.type).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  const currentIndex = sameTypeVitals.findIndex((sv: any) => sv.id === v.id);
                  const prevVital = currentIndex > 0 ? sameTypeVitals[currentIndex - 1] : null;
                  let trend = "—";
                  let trendColor = "var(--muted)";
                  
                  if (prevVital && v.value && prevVital.value) {
                    const currentVal = parseFloat(v.value);
                    const prevVal = parseFloat(prevVital.value);
                    if (!isNaN(currentVal) && !isNaN(prevVal)) {
                      if (currentVal > prevVal) {
                        trend = "↑ Increasing";
                        trendColor = "var(--red)";
                      } else if (currentVal < prevVal) {
                        trend = "↓ Decreasing";
                        trendColor = "var(--green)";
                      } else {
                        trend = "→ Stable";
                        trendColor = "var(--blue)";
                      }
                    }
                  }
                  
                  return (
                    <tr key={v.id} className="tbl-row">
                      <td style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{v.type}</td>
                      <td style={{ fontSize: "var(--font-sm)" }}>{v.value}</td>
                      <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{v.unit}</td>
                      <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{fmtDate(v.date)}</td>
                      <td style={{ fontSize: "var(--font-xs)", color: trendColor, fontWeight: 600 }}>{trend}</td>
                      <td>{can(role, "editPatient") && <button className="btn-icon" style={{ padding: 4 }} onClick={() => handleDelete(v.id)}><i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} /></button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ─── Clinical Support Helper Functions ─────────────────────────────────────────────
function analyzeDrugInteractions(medications: string[]) {
  const interactions: { drug1: string; drug2: string; severity: "severe" | "moderate" | "mild"; description: string }[] = [];
  
  // Common drug interactions database (simplified)
  const knownInteractions: { [key: string]: { severity: "severe" | "moderate" | "mild"; description: string } } = {
    "warfarin-aspirin": { severity: "severe", description: "Increased risk of bleeding" },
    "warfarin-ibuprofen": { severity: "severe", description: "Increased risk of bleeding" },
    "ace-inhibitors-potassium": { severity: "moderate", description: "Risk of hyperkalemia" },
    "ssris-maois": { severity: "severe", description: "Serotonin syndrome risk" },
    "digoxin-verapamil": { severity: "moderate", description: "Increased digoxin levels" },
    "metformin-contrast": { severity: "severe", description: "Lactic acidosis risk" },
  };

  // Check for interactions (simplified logic)
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const key = `${medications[i].toLowerCase()}-${medications[j].toLowerCase()}`;
      const reverseKey = `${medications[j].toLowerCase()}-${medications[i].toLowerCase()}`;
      
      if (knownInteractions[key]) {
        interactions.push({
          drug1: medications[i],
          drug2: medications[j],
          ...knownInteractions[key]
        });
      } else if (knownInteractions[reverseKey]) {
        interactions.push({
          drug1: medications[j],
          drug2: medications[i],
          ...knownInteractions[reverseKey]
        });
      }
    }
  }

  return interactions;
}

function analyzeLabResults(labResults: any[]) {
  return labResults.map(lab => ({
    testName: lab.testName,
    result: lab.result,
    unit: lab.unit,
    referenceRange: lab.referenceRange,
    status: lab.status === "Critical" ? "Critical" : lab.status === "Abnormal" ? "Abnormal" : "Normal"
  }));
}

// ─── Clinical Support Tab ────────────────────────────────────────────────────────
function ClinicalSupportTab({ patient }: { patient: Patient }) {
  const clinicalAlerts = getClinicalAlerts(patient.vitalSigns || []);
  const recommendations = getClinicalRecommendations(patient);
  const riskScore = calcRiskScore(patient);

  // Drug interaction analysis
  const drugInteractions = analyzeDrugInteractions(patient.medications || []);
  
  // Lab result analysis
  const labAnalysis = analyzeLabResults(patient.labResults || []);

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Clinical Decision Support</span>
        <div style={{ fontSize: "var(--font-sm)", color: "var(--muted)", marginTop: 4 }}>
          Demo clinical alerts, drug interactions, and treatment suggestions based on sample data
        </div>
      </div>

      <div className="card card-padded" style={{
        marginBottom: 16, background: "var(--amber-bg)", border: "1px solid var(--amber-border, var(--border))",
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <i className="ti ti-alert-triangle" style={{ fontSize: 16, color: "var(--amber)", flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: "var(--font-sm)", color: "var(--text)" }}>
          <strong>Demo clinical support only.</strong> This is sample output for demonstration purposes and is not real medical advice. Do not use for actual patient care decisions.
        </div>
      </div>

      {/* Risk Assessment Dashboard */}
      <div className="card card-padded" style={{ marginBottom: 24, background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)" }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          <i className="ti ti-shield-check" style={{ marginRight: 6 }} /> Risk Assessment
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 16, borderRadius: "var(--radius)", background: "var(--surface3)", textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: riskScore.color }}>{riskScore.score}</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginTop: 4 }}>Risk Score</div>
          </div>
          <div style={{ padding: 16, borderRadius: "var(--radius)", background: "var(--surface3)", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: riskScore.color }}>{riskScore.level}</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginTop: 4 }}>Risk Level</div>
          </div>
          <div style={{ padding: 16, borderRadius: "var(--radius)", background: "var(--surface3)", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{(patient.alerts || []).length}</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginTop: 4 }}>Active Alerts</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {patient.alerts?.map((alert, index) => (
            <span key={index} className="tag" style={{ 
              background: alert === "Critical" ? "var(--red-bg)" : alert === "High Risk" ? "var(--amber-bg)" : "var(--blue-bg)",
              color: alert === "Critical" ? "var(--red)" : alert === "High Risk" ? "var(--amber)" : "var(--blue)"
            }}>{alert}</span>
          ))}
        </div>
      </div>

      {/* Clinical Alerts */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} /> Clinical Alerts
        </div>
        {clinicalAlerts.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: "var(--font-sm)" }}>
            No critical alerts based on current vital signs
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clinicalAlerts.map((alert, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius)",
                  background: alert.severity === "critical" ? "var(--red-bg)" : alert.severity === "high" ? "var(--amber-bg)" : "var(--blue-bg)",
                  borderLeft: `3px solid ${alert.severity === "critical" ? "var(--red)" : alert.severity === "high" ? "var(--amber)" : "var(--blue)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: "var(--font-sm)", color: alert.severity === "critical" ? "var(--red)" : alert.severity === "high" ? "var(--amber)" : "var(--blue)" }}>
                    {alert.severity === "critical" && "⚠️ CRITICAL"}
                    {alert.severity === "high" && "⚠️ HIGH PRIORITY"}
                    {alert.severity === "medium" && "ℹ️ INFO"}
                  </span>
                  <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{fmtDate(alert.date)}</span>
                </div>
                <div style={{ fontSize: "var(--font-sm)", marginTop: 4 }}>{alert.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drug Interaction Warnings */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          <i className="ti ti-pills" style={{ marginRight: 6 }} /> Drug Interaction Analysis
        </div>
        {drugInteractions.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: "var(--font-sm)" }}>
            No drug interactions detected
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {drugInteractions.map((interaction, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius)",
                  background: interaction.severity === "severe" ? "var(--red-bg)" : interaction.severity === "moderate" ? "var(--amber-bg)" : "var(--blue-bg)",
                  border: `1px solid ${interaction.severity === "severe" ? "var(--red-border)" : interaction.severity === "moderate" ? "var(--amber-border)" : "var(--blue-border)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: "var(--font-sm)", color: interaction.severity === "severe" ? "var(--red)" : interaction.severity === "moderate" ? "var(--amber)" : "var(--blue)" }}>
                    {interaction.severity.toUpperCase()}: {interaction.drug1} + {interaction.drug2}
                  </span>
                </div>
                <div style={{ fontSize: "var(--font-sm)", marginTop: 4 }}>{interaction.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lab Results Analysis */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          <i className="ti ti-test-tubes" style={{ marginRight: 6 }} /> Lab Results Analysis
        </div>
        {labAnalysis.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: "var(--font-sm)" }}>
            No lab results available for analysis
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {labAnalysis.map((lab, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius)",
                  background: lab.status === "Critical" ? "var(--red-bg)" : lab.status === "Abnormal" ? "var(--amber-bg)" : "var(--green-bg)",
                  border: `1px solid ${lab.status === "Critical" ? "var(--red-border)" : lab.status === "Abnormal" ? "var(--amber-border)" : "var(--green-border)"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{lab.testName}</span>
                  <span style={{ fontSize: "var(--font-xs)", color: lab.status === "Critical" ? "var(--red)" : lab.status === "Abnormal" ? "var(--amber)" : "var(--green)" }}>
                    {lab.status}
                  </span>
                </div>
                <div style={{ fontSize: "var(--font-sm)", marginTop: 4 }}>{lab.result} {lab.unit} (Ref: {lab.referenceRange})</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Treatment Recommendations */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          <i className="ti ti-clipboard-list" style={{ marginRight: 6 }} /> Treatment Recommendations
        </div>
        {recommendations.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: "var(--font-sm)" }}>
            No specific recommendations at this time
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  borderRadius: "var(--radius)",
                  background: "var(--surface3)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "var(--font-sm)", lineHeight: 1.5 }}>{rec}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="card card-padded">
        <div className="section-label" style={{ marginBottom: 12 }}>
          <i className="ti ti-book" style={{ marginRight: 6 }} /> Quick Reference
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: "var(--radius)", background: "var(--surface3)" }}>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginBottom: 4 }}>Active Conditions</div>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{(patient.medicalConditions || []).length}</div>
          </div>
          <div style={{ padding: 12, borderRadius: "var(--radius)", background: "var(--surface3)" }}>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginBottom: 4 }}>Active Medications</div>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{(patient.medications || []).length}</div>
          </div>
          <div style={{ padding: 12, borderRadius: "var(--radius)", background: "var(--surface3)" }}>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginBottom: 4 }}>Recent Vitals</div>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{(patient.vitalSigns || []).length}</div>
          </div>
          <div style={{ padding: 12, borderRadius: "var(--radius)", background: "var(--surface3)" }}>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginBottom: 4 }}>Risk Score</div>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{calcRiskScore(patient).score}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Consents Tab ─────────────────────────────────────────────────────────────
function ConsentsTab({ patient, onToggle }: { patient: Patient; onToggle: (key: string) => void }) {
  const consents = patient.consents || {};
  const total  = CONSENT_TYPES.length;
  const signed = CONSENT_TYPES.filter((c) => consents[c.key]).length;
  const allOK  = signed === total;

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="stat-card" style={{ flex: 1 }}>
          <div className="stat-label">Signed</div>
          <div className="stat-value" style={{ color: allOK ? "var(--green)" : "var(--amber)" }}>{signed}/{total}</div>
        </div>
        <div style={{ flex: 2 }}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(signed / total) * 100}%`, background: allOK ? "var(--green)" : "var(--amber)" }} />
          </div>
          <p style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginTop: 6 }}>
            {allOK ? "All consents collected — patient ready to proceed" : `${total - signed} consent${total - signed > 1 ? "s" : ""} still required`}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CONSENT_TYPES.map((c) => {
          const done = !!consents[c.key];
          return (
            <button key={c.key} onClick={() => onToggle(c.key)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
              borderRadius: "var(--radius)", border: `1px solid ${done ? "var(--green-border)" : "var(--border)"}`,
              background: done ? "var(--green-bg)" : "var(--surface)", cursor: "pointer",
              transition: "all 0.15s", textAlign: "left",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "var(--radius)", flexShrink: 0,
                background: done ? "#16a34a" : "var(--surface3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <i className={`ti ${done ? "ti-check" : c.icon}`} style={{ fontSize: 16, color: done ? "#fff" : "var(--muted)" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "var(--font-sm)", fontWeight: 600, color: done ? "#15803d" : "var(--text)" }}>
                  {c.label}
                </div>
                <div style={{ fontSize: "var(--font-xs)", color: done ? "#16a34a" : "var(--muted)", marginTop: 2 }}>
                  {done ? "Signed & collected" : "Click to mark as signed"}
                </div>
              </div>
              <i className={`ti ${done ? "ti-circle-check-filled" : "ti-circle-dashed"}`} style={{ fontSize: 20, color: done ? "#16a34a" : "var(--border)" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────
function AuditTab({ entries }: { entries: AuditEntry[] }) {
  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const AUDIT_ICONS: Record<string, string> = {
    created: "ti-user-plus", edited: "ti-edit", deleted: "ti-trash",
    merged: "ti-merge", import: "ti-file-import", archived: "ti-archive",
    verification: "ti-shield-check", "timeline event added": "ti-timeline",
    "document added": "ti-file", "note added": "ti-notes", default: "ti-history",
  };
  const AUDIT_COLORS: Record<string, string> = {
    created: "#2563eb", edited: "#7c3aed", deleted: "#dc2626",
    merged: "#d97706", import: "#16a34a", archived: "#64748b", default: "var(--muted)",
  };

  return (
    <div style={{ maxWidth: 700 }}>
      {sorted.length === 0 ? (
        <div className="empty-state">
          <i className="ti ti-history empty-state-icon" />
          <div className="empty-state-text">No audit entries yet</div>
          <div className="empty-state-sub">All changes will be recorded here</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {sorted.map((entry, i) => {
            const icon  = AUDIT_ICONS[entry.type] || AUDIT_ICONS.default;
            const color = AUDIT_COLORS[entry.type] || AUDIT_COLORS.default;
            return (
              <div key={entry.id} style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "10px 14px", background: i % 2 === 0 ? "var(--surface)" : "var(--surface2)",
                borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "var(--radius-sm)", flexShrink: 0,
                  background: color + "15", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 13, color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--font-sm)", color: "var(--text)" }}>{entry.message}</div>
                  <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginTop: 2, display: "flex", gap: 8 }}>
                    <span><i className="ti ti-user" style={{ fontSize: 10, marginRight: 3 }} />{entry.user}</span>
                    <span className="mono">
                      {new Date(entry.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Emergency Modal ──────────────────────────────────────────────────────────
function EmergencyModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div style={{
        background: "#0c0f1a", border: "2px solid #dc2626", borderRadius: "var(--radius-xl)",
        width: "100%", maxWidth: 560, overflow: "hidden",
        boxShadow: "0 0 60px rgba(220,38,38,0.35)", animation: "scaleIn 0.2s ease",
      }}>
        <div style={{ background: "#dc2626", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-emergency-bed" style={{ fontSize: 20, color: "#fff" }} />
            <div>
              <div style={{ fontSize: "var(--font-md)", fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>
                EMERGENCY VIEW
              </div>
              <div style={{ fontSize: "var(--font-xs)", color: "#fecaca" }}>
                {patient.name} · {patient.id}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "var(--radius)", padding: "6px 10px", cursor: "pointer", color: "#fff", fontSize: "var(--font-sm)" }}>
            <i className="ti ti-x" style={{ fontSize: 14 }} /> Close
          </button>
        </div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Blood Group",       value: patient.bloodGroup || "Unknown", icon: "ti-droplet",          color: "#ef4444", large: true },
            { label: "Primary Doctor",    value: patient.doctor || "—",           icon: "ti-stethoscope",      color: "#60a5fa" },
            { label: "Allergies",         value: patient.allergies || "None known",icon: "ti-alert-triangle",  color: "#f59e0b", warn: !!patient.allergies },
            { label: "Medications",       value: (patient.medications||[]).join(", ") || "None", icon: "ti-pill", color: "#a78bfa" },
            { label: "Conditions",        value: (patient.conditions||[]).join(", ") || "None", icon: "ti-heart-rate-monitor", color: "#f97316", warn: (patient.conditions||[]).length > 0 },
            { label: "Emergency Contact", value: patient.emergencyName || "—",   icon: "ti-phone-call",        color: "#34d399", sub: `${patient.emergencyRelation} · ${patient.emergencyPhone}` },
          ].map(({ label, value, icon, color, large, warn, sub }) => (
            <div key={label} style={{
              background: warn ? "#1c1008" : "#131726",
              border: `1px solid ${warn ? "#f59e0b30" : "rgba(255,255,255,0.07)"}`,
              borderRadius: "var(--radius)", padding: "10px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <i className={`ti ${icon}`} style={{ fontSize: 12, color }} />
                <span style={{ fontSize: "var(--font-2xs)", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              </div>
              <div style={{ fontSize: large ? 26 : 13, fontWeight: large ? 800 : 600, color: large ? color : warn ? "#fcd34d" : "#f9fafb", lineHeight: 1.3 }}>{value}</div>
              {sub && <div style={{ fontSize: "var(--font-xs)", color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ patient, onConfirm, onClose }: { patient: Patient; onConfirm: () => void; onClose: () => void }) {
  const [confirm, setConfirm] = useState("");
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius)", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-trash" style={{ fontSize: 18, color: "var(--red)" }} />
          </div>
          <div>
            <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Delete Patient Record</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>This action cannot be undone</div>
          </div>
        </div>
        <p style={{ fontSize: "var(--font-sm)", color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
          You are about to permanently delete <strong style={{ color: "var(--text)" }}>{patient.name}</strong> ({patient.id}). Type the patient ID to confirm.
        </p>
        <input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder={patient.id} style={{ width: "100%", marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} disabled={confirm !== patient.id} onClick={onConfirm}>
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Quick Action Modal ───────────────────────────────────────────────────────
function QuickActionModal({ action, patient, onClose }: { action: string; patient: Patient; onClose: () => void }) {
  const isDenied = action === "Doctor/Admin only in this demo.";
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>{isDenied ? "Action Restricted" : action}</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <p style={{ fontSize: "var(--font-sm)", color: "var(--muted)", lineHeight: 1.6 }}>
          {isDenied ? (
            action
          ) : (
            <>Demo action for <strong>{patient.name}</strong>. This is a local demo
            confirmation — no real invoice, billing, or external system is affected.</>
          )}
        </p>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          {!isDenied && (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
              <i className="ti ti-check" style={{ fontSize: 13 }} /> Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Modal ────────────────────────────────────────────────────────
function AppointmentModal({ patient, onClose, onUpdatePatient, onAddTimelineEvent }: { patient: Patient; onClose: () => void; onUpdatePatient: (p: Patient, action?: string) => void; onAddTimelineEvent: (e: Omit<TimelineEvent, "id">) => void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("General Checkup");
  const [notes, setNotes] = useState("");

  function handleBook() {
    if (!date) return;
    const updated = {
      ...patient,
      nextAppointment: date,
      status: "Active" as const,
    };
    onUpdatePatient(updated, "appointment booked");

    onAddTimelineEvent({
      type: "appointment",
      label: "Appointment Booked",
      icon: "ti-calendar",
      color: "#7c4fff",
      date: new Date(date),
      note: notes || `${type} at ${time}`,
      doctor: patient.doctor,
    } as Omit<TimelineEvent, "id">);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Book Appointment</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Patient</label>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.name}</div>
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Appointment Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Appointment Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%" }}>
              <option>General Checkup</option>
              <option>Follow-up Visit</option>
              <option>Consultation</option>
              <option>Emergency Visit</option>
              <option>Lab Test Review</option>
            </select>
          </div>
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label className="field-label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={3} style={{ width: "100%", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBook} disabled={!date}>
              <i className="ti ti-calendar" style={{ fontSize: 13 }} /> Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Consultation Modal ────────────────────────────────────────────────────────
function ConsultationModal({ patient, onClose, onAddTimelineEvent }: { patient: Patient; onClose: () => void; onAddTimelineEvent: (e: Omit<TimelineEvent, "id">) => void }) {
  const [notes, setNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [vitals, setVitals] = useState({ bp: "", pulse: "", temp: "", weight: "" });

  function handleSubmit() {
    onAddTimelineEvent({
      type: "consultation",
      label: "Consultation Completed",
      icon: "ti-stethoscope",
      color: "#00b4a0",
      date: new Date(),
      note: `Diagnosis: ${diagnosis}. Vitals: BP ${vitals.bp}, Pulse ${vitals.pulse}, Temp ${vitals.temp}°C. Notes: ${notes}`,
      doctor: patient.doctor,
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Start Consultation</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Patient</label>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.name}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div className="field-group">
              <label className="field-label">Blood Pressure</label>
              <input type="text" value={vitals.bp} onChange={(e) => setVitals({ ...vitals, bp: e.target.value })} placeholder="120/80" style={{ width: "100%" }} />
            </div>
            <div className="field-group">
              <label className="field-label">Pulse (bpm)</label>
              <input type="text" value={vitals.pulse} onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })} placeholder="72" style={{ width: "100%" }} />
            </div>
            <div className="field-group">
              <label className="field-label">Temperature (°C)</label>
              <input type="text" value={vitals.temp} onChange={(e) => setVitals({ ...vitals, temp: e.target.value })} placeholder="36.5" style={{ width: "100%" }} />
            </div>
            <div className="field-group">
              <label className="field-label">Weight (kg)</label>
              <input type="text" value={vitals.weight} onChange={(e) => setVitals({ ...vitals, weight: e.target.value })} placeholder="70" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Diagnosis</label>
            <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Primary diagnosis..." style={{ width: "100%" }} />
          </div>
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label className="field-label">Consultation Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detailed consultation notes..." rows={4} style={{ width: "100%", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              <i className="ti ti-stethoscope" style={{ fontSize: 13 }} /> Save Consultation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Prescription Modal ────────────────────────────────────────────────────────
function PrescriptionModal({ patient, onClose, onUpdatePatient, onAddTimelineEvent }: { patient: Patient; onClose: () => void; onUpdatePatient: (p: Patient, action?: string) => void; onAddTimelineEvent: (e: Omit<TimelineEvent, "id">) => void }) {
  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [duration, setDuration] = useState("");

  function handleAdd() {
    if (!medication) return;
    const newMed = `${medication} ${dosage} - ${frequency} for ${duration}`;
    const updated = {
      ...patient,
      medications: [...(patient.medications || []), newMed],
    };
    onUpdatePatient(updated, "prescription added");

    onAddTimelineEvent({
      type: "prescription",
      label: "Prescription Added",
      icon: "ti-pill",
      color: "#00b4a0",
      date: new Date(),
      note: newMed,
      doctor: patient.doctor,
    } as Omit<TimelineEvent, "id">);
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>New Prescription</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Patient</label>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.name}</div>
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Medication *</label>
            <input type="text" value={medication} onChange={(e) => setMedication(e.target.value)} placeholder="e.g. Metformin" style={{ width: "100%" }} />
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Dosage</label>
            <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500mg" style={{ width: "100%" }} />
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={{ width: "100%" }}>
              <option>Once daily</option>
              <option>Twice daily</option>
              <option>Three times daily</option>
              <option>Four times daily</option>
              <option>As needed</option>
              <option>Before meals</option>
              <option>After meals</option>
            </select>
          </div>
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label className="field-label">Duration</label>
            <input type="text" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 7 days, 2 weeks" style={{ width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={!medication}>
              <i className="ti ti-pill" style={{ fontSize: 13 }} /> Add Prescription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Follow-Up Modal ────────────────────────────────────────────────────────────
function FollowUpModal({ patient, onClose, onUpdatePatient }: { patient: Patient; onClose: () => void; onUpdatePatient: (u: Partial<Patient>) => void }) {
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");

  function handleSchedule() {
    if (!date) return;
    onUpdatePatient({
      followUpDate: date,
      followUpReason: reason || "Scheduled follow-up",
      followUpPriority: priority,
      followUpStatus: "Pending",
      status: "Follow-Up Due" as const,
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Schedule Follow-Up</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Patient</label>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.name}</div>
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Follow-Up Date *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} min={new Date().toISOString().split("T")[0]} />
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Reason</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Lab results review" style={{ width: "100%" }} />
          </div>
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label className="field-label">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)} style={{ width: "100%" }}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSchedule} disabled={!date}>
              <i className="ti ti-clock" style={{ fontSize: 13 }} /> Schedule Follow-Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Modal ──────────────────────────────────────────────────────────────
function MessageModal({ patient, onClose, onAddNote }: { patient: Patient; onClose: () => void; onAddNote: (n: Omit<PatientNote, "id">) => void }) {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");

  function handleSend() {
    if (!message.trim()) return;
    onAddNote({
      text: message.trim(),
      pinned: false,
      date: new Date().toISOString().split("T")[0],
      category: category as any,
      author: "System",
    });
    onClose();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Send Message</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Patient</label>
            <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.name}</div>
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }}>
              <option value="general">General</option>
              <option value="clinical">Clinical</option>
              <option value="billing">Billing</option>
              <option value="followup">Follow-Up</option>
            </select>
          </div>
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label className="field-label">Message *</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." rows={4} style={{ width: "100%", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSend} disabled={!message.trim()}>
              <i className="ti ti-send" style={{ fontSize: 13 }} /> Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function InfoCard({ title, icon, iconBg, iconColor, children }: {
  title: string; icon: string; iconBg: string; iconColor: string; children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="panel-head">
        <div className="panel-icon" style={{ background: iconBg }}>
          <i className={`ti ${icon}`} style={{ fontSize: 16, color: iconColor }} />
        </div>
        <div className="panel-title">{title}</div>
      </div>
      <div style={{ padding: "12px 16px" }}>{children}</div>
    </div>
  );
}

function InfoGrid({ rows, cols = 2 }: { rows: [string, string | number | undefined | null][]; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px 16px" }}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <div style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ fontSize: "var(--font-sm)", color: "var(--text)", fontWeight: 500 }}>
            {value || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
