import React, { useState, useMemo, useEffect } from "react";
import type { Patient, UserRole, AlertType } from "./types";
import { DOCTORS, INSURERS, GENDERS, BLOOD_GROUPS, STATUSES, ALERT_TYPES } from "./constants";
import { calcAge, detectDuplicates } from "./utils";

interface PatientFormProps {
  mode: "create" | "edit";
  patient?: Patient | null;
  onSave: (p: Partial<Patient>) => void;
  onClose: () => void;
  role: UserRole;
  existingPatients?: Patient[];
}

const EMPTY: Partial<Patient> = {
  firstName: "", lastName: "", dob: "", gender: "Male", bloodGroup: "O+",
  phone: "", email: "", address: "", nationality: "Indian",
  emergencyName: "", emergencyRelation: "Spouse", emergencyPhone: "",
  insurer: "None", policyNumber: null, insuranceExpiry: null,
  allergies: "", conditions: [], medications: [], alerts: [],
  status: "New", doctor: "Dr. Sharma",
  phoneVerified: false, insuranceVerified: false, idVerified: false,
  consentSigned: false, documentsComplete: false,
};

export default function PatientForm({ mode, patient, onSave, onClose, role, existingPatients = [] }: PatientFormProps) {
  const initial = patient ? {
    ...patient,
  } : EMPTY;

  const [form, setForm] = useState<Partial<Patient>>(initial);
  const [section, setSection] = useState<"personal" | "medical" | "insurance" | "status">("personal");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Duplicate detection
  const duplicates = useMemo(() => {
    if (mode === "edit" || !form.phone || !form.name) return [];
    const tempPatient = { ...form, id: "temp", name: `${form.firstName || ""} ${form.lastName || ""}`.trim() } as Patient;
    return detectDuplicates([...existingPatients, tempPatient]).filter(
      d => d.patients.some(p => p.id !== patient?.id)
    );
  }, [form, existingPatients, mode, patient]);

  // Real-time validation
  useEffect(() => {
    const newWarnings: string[] = [];
    
    if (duplicates.length > 0) {
      duplicates.forEach(d => {
        if (d.type === "phone") {
          newWarnings.push(`Phone number ${d.value} already exists for ${d.patients.find(p => p.id !== "temp")?.name}`);
        }
        if (d.type === "name_dob") {
          newWarnings.push(`Patient with same name and DOB already exists`);
        }
      });
    }

    if (form.age && form.age > 120) {
      newWarnings.push("Age appears to be invalid (over 120 years)");
    }

    if (form.phone && !/^\+?[0-9\s\-\(\)]{10,}$/.test(form.phone)) {
      newWarnings.push("Phone number format may be invalid");
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newWarnings.push("Email format appears invalid");
    }

    setWarnings(newWarnings);
  }, [form, duplicates]);

  function update<K extends keyof Patient>(key: K, value: Patient[K]) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // Auto-compute name and age
      if (key === "firstName" || key === "lastName") {
        updated.name = `${updated.firstName || ""} ${updated.lastName || ""}`.trim();
      }
      if (key === "dob" && value) {
        updated.age = calcAge(value as string);
      }
      // Auto-set insurance status
      if (key === "insuranceExpiry" || key === "insurer") {
        const insurer = updated.insurer || "None";
        const expiry = updated.insuranceExpiry;
        if (!insurer || insurer === "None") {
          updated.insuranceStatus = "None";
        } else if (!expiry) {
          updated.insuranceStatus = "None";
        } else {
          const expDate = new Date(expiry);
          const now = new Date();
          const thirtyDays = 30 * 24 * 60 * 60 * 1000;
          if (expDate < now) {
            updated.insuranceStatus = "Expired";
          } else if (expDate < new Date(now.getTime() + thirtyDays)) {
            updated.insuranceStatus = "Expiring";
          } else {
            updated.insuranceStatus = "Active";
          }
        }
      }
      return updated;
    });
    setTouched((t) => ({ ...t, [key as string]: true }));
    setErrors((e) => { const ne = { ...e }; delete ne[key as string]; return ne; });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.firstName?.trim()) errs.firstName = "First name is required";
    if (!form.phone?.trim())     errs.phone     = "Phone number is required";
    if (!form.dob)               errs.dob       = "Date of birth is required";
    if (form.phone && form.phone.length < 10) errs.phone = "Phone number too short";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format";
    if (form.insurer && form.insurer !== "None" && !form.policyNumber) {
      errs.policyNumber = "Policy number required when insurance is selected";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setIsSubmitting(true);
    
    // Simulate async operation for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data: Partial<Patient> = {
      ...form,
      name: `${form.firstName || ""} ${form.lastName || ""}`.trim(),
      age:  form.dob ? calcAge(form.dob) : 0,
      insuranceStatus: !form.insurer || form.insurer === "None" ? "None"
        : !form.insuranceExpiry ? "None"
        : new Date(form.insuranceExpiry) < new Date() ? "Expired"
        : new Date(form.insuranceExpiry) < new Date(Date.now() + 30 * 86400000) ? "Expiring"
        : "Active",
      timeline:  form.timeline || [],
      documents: form.documents || [],
      notes:     form.notes || [],
      family:    form.family || [],
      consents:  form.consents || {},
    };
    onSave(data);
    setIsSubmitting(false);
  }

  function toggleAlert(alert: AlertType) {
    const current = form.alerts || [];
    if (current.includes(alert)) {
      update("alerts", current.filter((a) => a !== alert) as AlertType[]);
    } else {
      update("alerts", [...current, alert] as AlertType[]);
    }
  }

  const SECTIONS = [
    { id: "personal",      label: "Personal",      icon: "ti-user" },
    { id: "medical",       label: "Medical",       icon: "ti-heart-rate-monitor" },
    { id: "history",       label: "History",       icon: "ti-history" },
    { id: "medications",   label: "Medications",   icon: "ti-pills" },
    { id: "insurance",     label: "Insurance",     icon: "ti-shield" },
    { id: "status",        label: "Status",        icon: "ti-stethoscope" },
  ] as const;

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 760 }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "var(--radius)",
            background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className={`ti ${mode === "create" ? "ti-user-plus" : "ti-edit"}`}
               style={{ fontSize: 18, color: "var(--accent)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>
              {mode === "create" ? "Register New Patient" : `Edit Patient: ${patient?.name}`}
            </div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>
              {mode === "create" ? "Fill in patient details below" : "Update the patient's information"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {duplicates.length > 0 && (
              <span className="badge" style={{ background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)" }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 10 }} />
                {duplicates.length} Duplicate{duplicates.length > 1 ? "s" : ""}
              </span>
            )}
            <button className="btn-icon" onClick={onClose}>
              <i className="ti ti-x" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>

        {/* Warnings banner */}
        {warnings.length > 0 && (
          <div style={{
            padding: "12px 20px", background: "var(--amber-bg)",
            borderBottom: "1px solid var(--amber-border)", display: "flex", flexDirection: "column", gap: 6,
          }}>
            {warnings.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--font-xs)", color: "#92400e" }}>
                <i className="ti ti-alert-triangle" style={{ fontSize: 12 }} />
                {w}
              </div>
            ))}
          </div>
        )}

        {/* Sections */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
          {SECTIONS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setSection(id as any)} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 14px", borderBottom: `2px solid ${section === id ? "var(--accent)" : "transparent"}`,
              color: section === id ? "var(--accent)" : "var(--muted)",
              fontWeight: section === id ? 600 : 400, fontSize: "var(--font-sm)",
              background: "none", border: "none", borderBottom: `2px solid ${section === id ? "var(--accent)" : "transparent"}`,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              <i className={`ti ${icon}`} style={{ fontSize: 13 }} />
              {label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div style={{ padding: "20px", maxHeight: "calc(80vh - 160px)", overflowY: "auto" }}>
          {section === "personal" && (
            <FormSection>
              <FormRow>
                <Field label="First Name *" error={errors.firstName}>
                  <input type="text" value={form.firstName || ""} onChange={(e) => update("firstName", e.target.value)} placeholder="First name" style={{ width: "100%", borderColor: errors.firstName ? "var(--red)" : undefined }} />
                </Field>
                <Field label="Last Name">
                  <input type="text" value={form.lastName || ""} onChange={(e) => update("lastName", e.target.value)} placeholder="Last name" style={{ width: "100%" }} />
                </Field>
              </FormRow>
              <FormRow>
                <Field label="Date of Birth *" error={errors.dob}>
                  <input 
                    type="date" 
                    value={form.dob || ""} 
                    onChange={(e) => update("dob", e.target.value)} 
                    style={{ width: "100%", borderColor: errors.dob ? "var(--red)" : undefined }} 
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {form.dob && (
                    <span style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", marginTop: 2 }}>
                      Age: {form.age} years
                    </span>
                  )}
                </Field>
                <Field label="Gender">
                  <select value={form.gender || "Male"} onChange={(e) => update("gender", e.target.value as any)} style={{ width: "100%" }}>
                    {GENDERS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Blood Group">
                  <select value={form.bloodGroup || "O+"} onChange={(e) => update("bloodGroup", e.target.value as any)} style={{ width: "100%" }}>
                    {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </Field>
              </FormRow>
              <FormRow>
                <Field label="Phone *" error={errors.phone}>
                  <input 
                    type="tel" 
                    value={form.phone || ""} 
                    onChange={(e) => update("phone", e.target.value)} 
                    placeholder="+91 XXXXX XXXXX" 
                    style={{ width: "100%", borderColor: errors.phone ? "var(--red)" : undefined }} 
                  />
                  {touched.phone && form.phone && form.phone.length >= 10 && (
                    <span style={{ fontSize: "var(--font-2xs)", color: "var(--green)", marginTop: 2 }}>
                      <i className="ti ti-check" style={{ fontSize: 8 }} /> Valid format
                    </span>
                  )}
                </Field>
                <Field label="Email" error={errors.email}>
                  <input 
                    type="email" 
                    value={form.email || ""} 
                    onChange={(e) => update("email", e.target.value)} 
                    placeholder="email@example.com" 
                    style={{ width: "100%", borderColor: errors.email ? "var(--red)" : undefined }} 
                  />
                </Field>
              </FormRow>
              <Field label="Address">
                <input type="text" value={form.address || ""} onChange={(e) => update("address", e.target.value)} placeholder="Full address" style={{ width: "100%" }} />
              </Field>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 4 }}>
                <div className="section-label">Emergency Contact</div>
                <FormRow>
                  <Field label="Contact Name">
                    <input type="text" value={form.emergencyName || ""} onChange={(e) => update("emergencyName", e.target.value)} placeholder="Name" style={{ width: "100%" }} />
                  </Field>
                  <Field label="Relation">
                    <input type="text" value={form.emergencyRelation || ""} onChange={(e) => update("emergencyRelation", e.target.value)} placeholder="e.g. Spouse" style={{ width: "100%" }} />
                  </Field>
                  <Field label="Phone">
                    <input type="tel" value={form.emergencyPhone || ""} onChange={(e) => update("emergencyPhone", e.target.value)} placeholder="+91 XXXXX XXXXX" style={{ width: "100%" }} />
                  </Field>
                </FormRow>
              </div>
            </FormSection>
          )}

          {section === "medical" && (
            <FormSection>
              <div className="section-label" style={{ marginBottom: 12 }}>Clinical Assessment</div>
              <Field label="Known Allergies">
                <input type="text" value={form.allergies || ""} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g. Penicillin, Aspirin, Sulfa drugs" style={{ width: "100%" }} />
              </Field>
              <div>
                <label className="field-label">Medical Alerts</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  {ALERT_TYPES.map((alert) => {
                    const active = (form.alerts || []).includes(alert);
                    const colors: Record<string, string> = {
                      "Allergy": "#dc2626", "Diabetic": "#d97706", "Hypertension": "#9d174d",
                      "Heart Condition": "#7f1d1d", "Pregnancy": "#6b21a8", "High Risk": "#dc2626",
                    };
                    const c = colors[alert] || "#64748b";
                    return (
                      <button key={alert} onClick={() => toggleAlert(alert)} style={{
                        padding: "6px 12px", borderRadius: "var(--radius-full)",
                        border: `2px solid ${active ? c : "var(--border)"}`,
                        background: active ? c + "12" : "transparent",
                        color: active ? c : "var(--muted)",
                        fontSize: "var(--font-sm)", fontWeight: active ? 700 : 500,
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                        {active && <i className="ti ti-check" style={{ fontSize: 11, marginRight: 4 }} />}
                        {alert}
                      </button>
                    );
                  })}
                </div>
              </div>
              <FormRow>
                <Field label="Blood Pressure">
                  <input type="text" value={(form.flags?.bloodPressure as string) || ""} onChange={(e) => update("flags", { ...form.flags, bloodPressure: e.target.value })} placeholder="120/80 mmHg" style={{ width: "100%" }} />
                </Field>
                <Field label="Heart Rate">
                  <input type="text" value={(form.flags?.heartRate as string) || ""} onChange={(e) => update("flags", { ...form.flags, heartRate: e.target.value })} placeholder="72 bpm" style={{ width: "100%" }} />
                </Field>
                <Field label="BMI">
                  <input type="text" value={(form.flags?.bmi as string) || ""} onChange={(e) => update("flags", { ...form.flags, bmi: e.target.value })} placeholder="24.5 kg/m²" style={{ width: "100%" }} />
                </Field>
              </FormRow>
              <Field label="Chief Complaint">
                <textarea
                  value={(form.flags?.chiefComplaint as string) || ""}
                  onChange={(e) => update("flags", { ...form.flags, chiefComplaint: e.target.value })}
                  placeholder="Primary reason for visit"
                  rows={2} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
            </FormSection>
          )}

          {section === "history" && (
            <FormSection>
              <div className="section-label" style={{ marginBottom: 12 }}>Medical History</div>
              <Field label="Past Medical History">
                <textarea
                  value={(form.flags?.pastMedicalHistory as string) || ""}
                  onChange={(e) => update("flags", { ...form.flags, pastMedicalHistory: e.target.value })}
                  placeholder="Previous diagnoses, chronic conditions, surgeries"
                  rows={3} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
              <Field label="Family History">
                <textarea
                  value={(form.flags?.familyHistory as string) || ""}
                  onChange={(e) => update("flags", { ...form.flags, familyHistory: e.target.value })}
                  placeholder="Family medical history (diabetes, hypertension, heart disease, cancer)"
                  rows={2} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
              <FormRow>
                <Field label="Smoking Status">
                  <select value={(form.flags?.smokingStatus as string) || "Never"} onChange={(e) => update("flags", { ...form.flags, smokingStatus: e.target.value })} style={{ width: "100%" }}>
                    <option value="Never">Never</option>
                    <option value="Former">Former</option>
                    <option value="Current">Current</option>
                  </select>
                </Field>
                <Field label="Alcohol Use">
                  <select value={(form.flags?.alcoholUse as string) || "None"} onChange={(e) => update("flags", { ...form.flags, alcoholUse: e.target.value })} style={{ width: "100%" }}>
                    <option value="None">None</option>
                    <option value="Social">Social</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Heavy">Heavy</option>
                  </select>
                </Field>
              </FormRow>
              <Field label="Surgical History">
                <textarea
                  value={(form.flags?.surgicalHistory as string) || ""}
                  onChange={(e) => update("flags", { ...form.flags, surgicalHistory: e.target.value })}
                  placeholder="Previous surgeries with dates"
                  rows={2} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
              <Field label="Current Conditions">
                <textarea
                  value={(form.conditions || []).join(", ")}
                  onChange={(e) => update("conditions", e.target.value ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : [])}
                  placeholder="Type 2 Diabetes, Hypertension, Asthma…"
                  rows={2} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
            </FormSection>
          )}

          {section === "medications" && (
            <FormSection>
              <div className="section-label" style={{ marginBottom: 12 }}>Medication Management</div>
              <Field label="Current Medications">
                <textarea
                  value={(form.medications || []).join(", ")}
                  onChange={(e) => update("medications", e.target.value ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : [])}
                  placeholder="Metformin 500mg twice daily, Amlodipine 5mg once daily, Lisinopril 10mg once daily…"
                  rows={3} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
              <Field label="Medication Allergies">
                <input type="text" value={(form.flags?.medicationAllergies as string) || ""} onChange={(e) => update("flags", { ...form.flags, medicationAllergies: e.target.value })} placeholder="Drug allergies with reactions (e.g., Penicillin - Anaphylaxis)" style={{ width: "100%" }} />
              </Field>
              <Field label="Previous Adverse Reactions">
                <textarea
                  value={(form.flags?.adverseReactions as string) || ""}
                  onChange={(e) => update("flags", { ...form.flags, adverseReactions: e.target.value })}
                  placeholder="Previous adverse drug reactions with details"
                  rows={2} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
              <Field label="Vaccination History">
                <textarea
                  value={(form.flags?.vaccinationHistory as string) || ""}
                  onChange={(e) => update("flags", { ...form.flags, vaccinationHistory: e.target.value })}
                  placeholder="COVID-19, Influenza, Tetanus, Hepatitis B, etc. with dates"
                  rows={2} style={{ width: "100%", resize: "vertical" }}
                />
              </Field>
              
              {/* Drug Interaction Warning */}
              <div style={{ padding: 12, borderRadius: "var(--radius)", background: "var(--amber-bg)", border: "1px solid var(--amber-border)", marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <i className="ti ti-alert-triangle" style={{ fontSize: 14, color: "var(--amber)" }} />
                  <div style={{ fontSize: "var(--font-sm)", fontWeight: 600, color: "var(--amber)" }}>Drug Interaction Check</div>
                </div>
                <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>
                  System will automatically check for drug-drug interactions, drug-allergy interactions, and drug-condition interactions when medications are prescribed.
                </div>
              </div>
            </FormSection>
          )}

          {section === "insurance" && (
            <FormSection>
              <FormRow>
                <Field label="Insurance Provider">
                  <select value={form.insurer || "None"} onChange={(e) => update("insurer", e.target.value)} style={{ width: "100%" }}>
                    {INSURERS.map((i) => <option key={i}>{i}</option>)}
                  </select>
                </Field>
                {form.insurer !== "None" && (
                  <>
                    <Field label="Policy Number">
                      <input type="text" value={form.policyNumber || ""} onChange={(e) => update("policyNumber", e.target.value || null)} placeholder="POL-XXXXXX" style={{ width: "100%" }} />
                    </Field>
                    <Field label="Expiry Date">
                      <input type="date" value={form.insuranceExpiry || ""} onChange={(e) => update("insuranceExpiry", e.target.value || null)} style={{ width: "100%" }} />
                    </Field>
                  </>
                )}
              </FormRow>
            </FormSection>
          )}

          {section === "status" && (
            <FormSection>
              <FormRow>
                <Field label="Status">
                  <select value={form.status || "New"} onChange={(e) => update("status", e.target.value as any)} style={{ width: "100%" }}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Assigned Doctor">
                  <select value={form.doctor || "Dr. Sharma"} onChange={(e) => update("doctor", e.target.value)} style={{ width: "100%" }}>
                    {DOCTORS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
              </FormRow>
              <FormRow>
                <Field label="Last Visit">
                  <input type="date" value={form.lastVisit || ""} onChange={(e) => update("lastVisit", e.target.value || null)} style={{ width: "100%" }} />
                </Field>
                <Field label="Next Appointment">
                  <input type="date" value={form.nextAppointment || ""} onChange={(e) => update("nextAppointment", e.target.value || null)} style={{ width: "100%" }} />
                </Field>
              </FormRow>
            </FormSection>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--surface2)",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {SECTIONS.map(({ id, label }) => (
              <button key={id} onClick={() => setSection(id as any)} style={{
                padding: "4px 10px", borderRadius: "var(--radius-full)",
                fontSize: "var(--font-xs)", cursor: "pointer",
                background: section === id ? "var(--accent)" : "transparent",
                color: section === id ? "#fff" : "var(--muted)",
                border: `1px solid ${section === id ? "var(--accent)" : "var(--border)"}`,
                fontWeight: section === id ? 600 : 400,
              }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ flex: 1, fontSize: "var(--font-xs)", color: "var(--muted)", textAlign: "right" }}>
              {duplicates.length > 0 && "⚠️ Potential duplicate detected"}
            </div>
            <button className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              <i className={`ti ${isSubmitting ? "ti-loader" : mode === "create" ? "ti-user-plus" : "ti-device-floppy"}`} style={{ fontSize: 14 }} />
              {isSubmitting ? "Saving..." : mode === "create" ? "Register Patient" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormSection({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>;
}

function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: `repeat(${React.Children.count(children)}, 1fr)`, 
      gap: 12 
    }} className="form-row">
      {children}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {children}
      {error && <span style={{ fontSize: "var(--font-xs)", color: "var(--red)", marginTop: 3 }}>{error}</span>}
    </div>
  );
}
