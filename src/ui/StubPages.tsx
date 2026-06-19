import React from "react";
import type { Patient } from "./types";
import { getPatientStats, fmtDate } from "./utils";

// ─── Appointments ─────────────────────────────────────────────────────────────
export function AppointmentsPage({ patients, onSelectPatient }: { patients: Patient[]; onSelectPatient?: (p: Patient) => void }) {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [showBooking, setShowBooking] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filterDoctor, setFilterDoctor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const upcoming = patients
    .filter((p) => p.nextAppointment)
    .filter((p) => filterDoctor === "All" || p.doctor === filterDoctor)
    .filter((p) => filterStatus === "All" || p.status === filterStatus)
    .sort((a, b) => new Date(a.nextAppointment!).getTime() - new Date(b.nextAppointment!).getTime())
    .slice(0, 50);

  const overdue = patients.filter(
    (p) => p.status === "Follow-Up Due" || (p.followUpDate && new Date(p.followUpDate) < new Date())
  );

  const today = patients.filter((p) => {
    if (!p.nextAppointment) return false;
    const apptDate = new Date(p.nextAppointment).toDateString();
    return apptDate === new Date().toDateString();
  });

  const thisWeek = patients.filter((p) => {
    if (!p.nextAppointment) return false;
    const apptDate = new Date(p.nextAppointment);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return apptDate >= now && apptDate <= weekFromNow;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: 0 }}>Appointments</h2>
        <button className="btn btn-primary" onClick={() => setShowBooking(true)}>
          <i className="ti ti-calendar-plus" style={{ fontSize: 14 }} /> New Appointment
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-calendar" style={{ fontSize: 11, marginRight: 4 }} />Upcoming</div>
          <div className="stat-value" style={{ color: "var(--blue)" }}>{upcoming.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-calendar-check" style={{ fontSize: 11, marginRight: 4 }} />Today</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{today.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-calendar-week" style={{ fontSize: 11, marginRight: 4 }} />This Week</div>
          <div className="stat-value" style={{ color: "var(--purple)" }}>{thisWeek.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label"><i className="ti ti-clock-exclamation" style={{ fontSize: 11, marginRight: 4 }} />Overdue</div>
          <div className="stat-value" style={{ color: "var(--amber)" }}>{overdue.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>View:</span>
            <button 
              onClick={() => setView("list")}
              style={{ padding: "6px 12px", borderRadius: "var(--radius)", fontSize: "var(--font-sm)", border: "1px solid var(--border)", background: view === "list" ? "var(--accent-soft)" : "transparent", color: view === "list" ? "var(--accent)" : "var(--muted)", cursor: "pointer" }}
            >
              List
            </button>
            <button 
              onClick={() => setView("calendar")}
              style={{ padding: "6px 12px", borderRadius: "var(--radius)", fontSize: "var(--font-sm)", border: "1px solid var(--border)", background: view === "calendar" ? "var(--accent-soft)" : "transparent", color: view === "calendar" ? "var(--accent)" : "var(--muted)", cursor: "pointer" }}
            >
              Calendar
            </button>
          </div>
          <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} style={{ fontSize: "var(--font-sm)", padding: "6px 10px", borderRadius: "var(--radius)" }}>
            <option value="All">All Doctors</option>
            {["Dr. Sharma", "Dr. Patel", "Dr. Mehta", "Dr. Iyer", "Dr. Nair"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ fontSize: "var(--font-sm)", padding: "6px 10px", borderRadius: "var(--radius)" }}>
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="New">New</option>
            <option value="Follow-Up Due">Follow-Up Due</option>
          </select>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ fontSize: "var(--font-sm)", padding: "6px 10px" }} />
            <span style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>to</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ fontSize: "var(--font-sm)", padding: "6px 10px" }} />
          </div>
          {(filterDoctor !== "All" || filterStatus !== "All" || dateRange.start || dateRange.end) && (
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "6px 12px" }} onClick={() => { setFilterDoctor("All"); setFilterStatus("All"); setDateRange({ start: "", end: "" }); }}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {overdue.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 10, color: "var(--amber)" }}>
            <i className="ti ti-alert-circle" style={{ marginRight: 4 }} />
            Follow-Up Overdue ({overdue.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {overdue.slice(0, 10).map((p) => (
              <div key={p.id} className="card card-padded" style={{
                display: "flex", alignItems: "center", gap: 12,
                border: "1px solid var(--amber-border)", background: "var(--amber-bg)", cursor: "pointer",
              }} onClick={() => onSelectPatient?.(p)}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f59e0b20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="ti ti-phone" style={{ fontSize: 16, color: "var(--amber)" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--font-sm)", fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>
                    {p.followUpReason || "Follow-up required"} · {p.doctor}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: "var(--amber)" }}>
                    Due {fmtDate(p.followUpDate)}
                  </span>
                  <button className="btn btn-ghost" style={{ fontSize: "var(--font-xs)", padding: "4px 8px" }} onClick={(e) => { e.stopPropagation(); /* Call patient */ }}>
                    <i className="ti ti-phone" style={{ fontSize: 12 }} /> Call
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>
          <i className="ti ti-calendar-check" style={{ marginRight: 4 }} />
          Upcoming Appointments
        </div>
        <div className="card" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><i className="ti ti-calendar-off empty-state-icon" /><div className="empty-state-sub">No upcoming appointments</div></div></td></tr>
              ) : upcoming.map((p) => (
                <tr key={p.id} className="tbl-row" onClick={() => onSelectPatient?.(p)}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{p.name}</div>
                    <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{p.id}</div>
                  </td>
                  <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{p.doctor}</td>
                  <td>
                    <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{fmtDate(p.nextAppointment)}</div>
                    <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{new Date(p.nextAppointment!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>
                  <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>General Checkup</td>
                  <td>
                    <span className="badge" style={{ background: "var(--blue-bg)", color: "var(--blue)", border: "1px solid var(--blue-border)" }}>
                      Scheduled
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn-icon" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); /* Reschedule */ }} title="Reschedule">
                        <i className="ti ti-calendar-clock" style={{ fontSize: 12 }} />
                      </button>
                      <button className="btn-icon" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); /* Cancel */ }} title="Cancel">
                        <i className="ti ti-calendar-x" style={{ fontSize: 12, color: "var(--red)" }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <AppointmentBookingModal 
          patients={patients} 
          onClose={() => setShowBooking(false)} 
          onBook={(patientId, date, time, type) => {
            // Handle booking - would update patient record
            setShowBooking(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Appointment Booking Modal ────────────────────────────────────────────────────
function AppointmentBookingModal({ 
  patients, 
  onClose, 
  onBook 
}: { 
  patients: Patient[]; 
  onClose: () => void; 
  onBook: (patientId: string, date: string, time: string, type: string) => void;
}) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("General Checkup");
  const [notes, setNotes] = useState("");
  const [doctor, setDoctor] = useState("Dr. Sharma");

  const availableSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30",
  ];

  function handleBook() {
    if (!selectedPatient || !date || !time) return;
    onBook(selectedPatient, date, time, type);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Book New Appointment</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Select Patient *</label>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} style={{ width: "100%" }}>
              <option value="">Choose a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div className="field-group">
              <label className="field-label">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="field-group">
              <label className="field-label">Time *</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} style={{ width: "100%" }}>
                <option value="">Select time...</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div className="field-group">
              <label className="field-label">Appointment Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%" }}>
                <option>General Checkup</option>
                <option>Follow-up Visit</option>
                <option>Consultation</option>
                <option>Emergency Visit</option>
                <option>Lab Test Review</option>
                <option>Vaccination</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Doctor</label>
              <select value={doctor} onChange={(e) => setDoctor(e.target.value)} style={{ width: "100%" }}>
                <option>Dr. Sharma</option>
                <option>Dr. Patel</option>
                <option>Dr. Mehta</option>
                <option>Dr. Iyer</option>
                <option>Dr. Nair</option>
              </select>
            </div>
          </div>
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label className="field-label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes or special instructions..." rows={3} style={{ width: "100%", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleBook} disabled={!selectedPatient || !date || !time}>
              <i className="ti ti-calendar-plus" style={{ fontSize: 13 }} /> Book Appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export function BillingPage({ patients, onSelectPatient }: { patients: Patient[]; onSelectPatient?: (p: Patient) => void }) {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterInsurer, setFilterInsurer] = useState("All");
  
  const expired  = patients.filter((p) => p.insuranceStatus === "Expired");
  const expiring = patients.filter((p) => p.insuranceStatus === "Expiring");
  const insured  = patients.filter((p) => p.insuranceStatus === "Active");
  const none     = patients.filter((p) => p.insuranceStatus === "None");

  const INSURERS = ["Star Health","HDFC ERGO","ICICI Lombard","Bajaj Allianz"];
  const insStats = INSURERS.map((name) => ({
    name,
    count: patients.filter((p) => p.insurer === name).length,
  }));

  const filteredPatients = patients.filter((p) => {
    return filterInsurer === "All" || p.insurer === filterInsurer;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: 0 }}>Billing & Insurance</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={() => setShowInvoiceModal(true)}>
            <i className="ti ti-receipt" style={{ fontSize: 14 }} /> Create Invoice
          </button>
          <button className="btn btn-ghost" onClick={() => setShowPaymentModal(true)}>
            <i className="ti ti-credit-card" style={{ fontSize: 14 }} /> Record Payment
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Active Insurance" value={insured.length} color="var(--green)" icon="ti-shield-check" bg="var(--green-bg)" />
        <StatCard label="Expiring Soon"    value={expiring.length} color="var(--amber)" icon="ti-shield-exclamation" bg="var(--amber-bg)" />
        <StatCard label="Expired"          value={expired.length}  color="var(--red)"   icon="ti-shield-x" bg="var(--red-bg)" />
        <StatCard label="No Insurance"     value={none.length}     color="var(--muted)" icon="ti-shield-off" bg="var(--surface3)" />
      </div>

      {/* Filters */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select value={filterInsurer} onChange={(e) => setFilterInsurer(e.target.value)} style={{ fontSize: "var(--font-sm)", padding: "6px 10px", borderRadius: "var(--radius)" }}>
            <option value="All">All Insurers</option>
            {INSURERS.map((i) => <option key={i}>{i}</option>)}
          </select>
          {filterInsurer !== "All" && (
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "6px 12px" }} onClick={() => setFilterInsurer("All")}>
              Clear
            </button>
          )}
        </div>
      </div>

      {expired.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label" style={{ color: "var(--red)", marginBottom: 10 }}>
            <i className="ti ti-shield-x" style={{ marginRight: 4 }} />
            Expired Insurance — Action Required ({expired.length})
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="tbl">
              <thead>
                <tr><th>Patient</th><th>Provider</th><th>Policy Number</th><th>Expired</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {expired.slice(0, 15).map((p) => (
                  <tr key={p.id} className="tbl-row" onClick={() => onSelectPatient?.(p)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: "var(--font-sm)" }}>{p.name}</div>
                      <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{p.id}</div>
                    </td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{p.insurer}</td>
                    <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{p.policyNumber || "—"}</td>
                    <td style={{ fontSize: "var(--font-sm)", fontWeight: 700, color: "var(--red)" }}>{fmtDate(p.insuranceExpiry)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn-icon" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); /* Send reminder */ }} title="Send Renewal Reminder">
                          <i className="ti ti-bell" style={{ fontSize: 12 }} />
                        </button>
                        <button className="btn-icon" style={{ padding: 4 }} onClick={(e) => { e.stopPropagation(); onSelectPatient?.(p); }} title="Update Insurance">
                          <i className="ti ti-edit" style={{ fontSize: 12 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <div className="section-label" style={{ marginBottom: 10 }}>Insurance Distribution</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {insStats.map(({ name, count }) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: "var(--font-sm)", width: 140, flexShrink: 0 }}>{name}</span>
              <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--accent)", borderRadius: 4, width: `${(count / patients.length) * 100}%`, transition: "width 0.5s ease" }} />
              </div>
              <span style={{ fontSize: "var(--font-sm)", color: "var(--muted)", width: 40, textAlign: "right" }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal 
          patients={patients} 
          onClose={() => setShowInvoiceModal(false)} 
          onCreate={(invoiceData) => {
            setShowInvoiceModal(false);
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          patients={patients} 
          onClose={() => setShowPaymentModal(false)} 
          onRecord={(paymentData) => {
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Invoice Modal ────────────────────────────────────────────────────────────────
function InvoiceModal({ 
  patients, 
  onClose, 
  onCreate 
}: { 
  patients: Patient[]; 
  onClose: () => void; 
  onCreate: (data: any) => void;
}) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [items, setItems] = useState([{ description: "", amount: "" }]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  function addItem() {
    setItems([...items, { description: "", amount: "" }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, value: string) {
    const newItems = [...items];
    newItems[index][field as keyof typeof newItems[0]] = value;
    setItems(newItems);
  }

  const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  function handleCreate() {
    if (!selectedPatient || items.every((i) => !i.description || !i.amount)) return;
    onCreate({ patientId: selectedPatient, items, dueDate, notes, total });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Create Invoice</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Select Patient *</label>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} style={{ width: "100%" }}>
              <option value="">Choose a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Invoice Items *</label>
            {items.map((item, index) => (
              <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input 
                  type="text" 
                  value={item.description} 
                  onChange={(e) => updateItem(index, "description", e.target.value)} 
                  placeholder="Description" 
                  style={{ flex: 2, fontSize: "var(--font-sm)" }} 
                />
                <input 
                  type="number" 
                  value={item.amount} 
                  onChange={(e) => updateItem(index, "amount", e.target.value)} 
                  placeholder="Amount" 
                  style={{ flex: 1, fontSize: "var(--font-sm)" }} 
                />
                {items.length > 1 && (
                  <button className="btn-icon" onClick={() => removeItem(index)} style={{ padding: 4 }}>
                    <i className="ti ti-trash" style={{ fontSize: 12, color: "var(--red)" }} />
                  </button>
                )}
              </div>
            ))}
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "4px 8px" }} onClick={addItem}>
              <i className="ti ti-plus" style={{ fontSize: 12 }} /> Add Item
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div className="field-group">
              <label className="field-label">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="field-group">
              <label className="field-label">Total</label>
              <div style={{ fontSize: "var(--font-lg)", fontWeight: 700, color: "var(--accent)" }}>₹{total.toFixed(2)}</div>
            </div>
          </div>
          <div className="field-group" style={{ marginBottom: 16 }}>
            <label className="field-label">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} style={{ width: "100%", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!selectedPatient || items.every((i) => !i.description || !i.amount)}>
              <i className="ti ti-receipt" style={{ fontSize: 13 }} /> Create Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────────
function PaymentModal({ 
  patients, 
  onClose, 
  onRecord 
}: { 
  patients: Patient[]; 
  onClose: () => void; 
  onRecord: (data: any) => void;
}) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");

  function handleRecord() {
    if (!selectedPatient || !amount) return;
    onRecord({ patientId: selectedPatient, amount, method, date, reference });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Record Payment</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="field-group" style={{ marginBottom: 12 }}>
            <label className="field-label">Select Patient *</label>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} style={{ width: "100%" }}>
              <option value="">Choose a patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div className="field-group">
              <label className="field-label">Amount (₹) *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ width: "100%" }} />
            </div>
            <div className="field-group">
              <label className="field-label">Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: "100%" }}>
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
                <option>Insurance</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div className="field-group">
              <label className="field-label">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="field-group">
              <label className="field-label">Reference Number</label>
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN-12345" style={{ width: "100%" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRecord} disabled={!selectedPatient || !amount}>
              <i className="ti ti-credit-card" style={{ fontSize: 13 }} /> Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function ReportsPage({ patients, onSelectPatient }: { patients: Patient[]; onSelectPatient?: (p: Patient) => void }) {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [filterDoctor, setFilterDoctor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");

  const filteredPatients = patients.filter((p) => {
    const doctorMatch = filterDoctor === "All" || p.doctor === filterDoctor;
    const statusMatch = filterStatus === "All" || p.status === filterStatus;
    let dateMatch = true;
    if (dateRange.start) {
      dateMatch = dateMatch && new Date(p.createdAt || "") >= new Date(dateRange.start);
    }
    if (dateRange.end) {
      dateMatch = dateMatch && new Date(p.createdAt || "") <= new Date(dateRange.end);
    }
    return doctorMatch && statusMatch && dateMatch;
  });

  const stats = getPatientStats(filteredPatients);

  const statusDistribution = [
    { label: "New",             count: filteredPatients.filter((p) => p.status === "New").length,             color: "#0ea5e9" },
    { label: "Active",          count: filteredPatients.filter((p) => p.status === "Active").length,          color: "#22c55e" },
    { label: "Follow-Up Due",   count: filteredPatients.filter((p) => p.status === "Follow-Up Due").length,   color: "#f59e0b" },
    { label: "Under Treatment", count: filteredPatients.filter((p) => p.status === "Under Treatment").length, color: "#8b5cf6" },
    { label: "Observation",     count: filteredPatients.filter((p) => p.status === "Observation").length,     color: "#ec4899" },
    { label: "Inactive",        count: filteredPatients.filter((p) => p.status === "Inactive").length,        color: "#94a3b8" },
    { label: "VIP",             count: filteredPatients.filter((p) => p.status === "VIP").length,             color: "#f97316" },
  ];

  const alertDistribution = [
    { label: "Diabetic",        count: filteredPatients.filter((p) => p.alerts.includes("Diabetic")).length,        color: "#f59e0b" },
    { label: "Hypertension",    count: filteredPatients.filter((p) => p.alerts.includes("Hypertension")).length,    color: "#ec4899" },
    { label: "Allergy",         count: filteredPatients.filter((p) => p.alerts.includes("Allergy")).length,         color: "#ef4444" },
    { label: "Heart Condition", count: filteredPatients.filter((p) => p.alerts.includes("Heart Condition")).length, color: "#dc2626" },
    { label: "Pregnancy",       count: filteredPatients.filter((p) => p.alerts.includes("Pregnancy")).length,       color: "#a855f7" },
    { label: "High Risk",       count: filteredPatients.filter((p) => p.alerts.includes("High Risk")).length,       color: "#ef4444" },
  ];

  const docDistribution = [
    { label: "Dr. Sharma", count: filteredPatients.filter((p) => p.doctor === "Dr. Sharma").length },
    { label: "Dr. Patel",  count: filteredPatients.filter((p) => p.doctor === "Dr. Patel").length  },
    { label: "Dr. Mehta",  count: filteredPatients.filter((p) => p.doctor === "Dr. Mehta").length  },
    { label: "Dr. Iyer",   count: filteredPatients.filter((p) => p.doctor === "Dr. Iyer").length   },
    { label: "Dr. Nair",   count: filteredPatients.filter((p) => p.doctor === "Dr. Nair").length   },
  ];

  function handleExport() {
    if (exportFormat === "csv") {
      const headers = ["ID", "Name", "Status", "Doctor", "Phone", "Age", "Insurance Status", "Last Visit"];
      const rows = filteredPatients.map((p) => [
        p.id, p.name, p.status, p.doctor, p.phone, p.age, p.insuranceStatus, p.lastVisit,
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinic-report-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(filteredPatients, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinic-report-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: 0 }}>Reports & Analytics</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as any)} style={{ fontSize: "var(--font-sm)", padding: "6px 10px", borderRadius: "var(--radius)" }}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button className="btn btn-primary" onClick={handleExport}>
            <i className="ti ti-download" style={{ fontSize: 14 }} /> Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card card-padded" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} style={{ fontSize: "var(--font-sm)", padding: "6px 10px", borderRadius: "var(--radius)" }}>
            <option value="All">All Doctors</option>
            {["Dr. Sharma", "Dr. Patel", "Dr. Mehta", "Dr. Iyer", "Dr. Nair"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ fontSize: "var(--font-sm)", padding: "6px 10px", borderRadius: "var(--radius)" }}>
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Active">Active</option>
            <option value="Follow-Up Due">Follow-Up Due</option>
            <option value="Under Treatment">Under Treatment</option>
          </select>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} style={{ fontSize: "var(--font-sm)", padding: "6px 10px" }} />
            <span style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>to</span>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} style={{ fontSize: "var(--font-sm)", padding: "6px 10px" }} />
          </div>
          {(filterDoctor !== "All" || filterStatus !== "All" || dateRange.start || dateRange.end) && (
            <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "6px 12px" }} onClick={() => { setFilterDoctor("All"); setFilterStatus("All"); setDateRange({ start: "", end: "" }); }}>
              Clear Filters
            </button>
          )}
          <div style={{ marginLeft: "auto", fontSize: "var(--font-sm)", color: "var(--muted)" }}>
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Patients"       value={stats.total}          color="var(--accent)" icon="ti-users"              bg="var(--accent-soft)" />
        <StatCard label="Active Patients"      value={stats.active}         color="var(--green)"  icon="ti-activity"           bg="var(--green-bg)" />
        <StatCard label="Critical Alerts"      value={stats.criticalAlerts} color="var(--red)"    icon="ti-alert-triangle"     bg="var(--red-bg)" />
        <StatCard label="Follow-Up Due"        value={stats.followUpDue}    color="var(--amber)"  icon="ti-clock"              bg="var(--amber-bg)" />
        <StatCard label="Insurance Expiring"   value={stats.insExpiring}    color="var(--amber)"  icon="ti-shield-exclamation" bg="var(--amber-bg)" />
        <StatCard label="New Patients"         value={stats.newPatients}    color="var(--blue)"   icon="ti-user-plus"          bg="var(--blue-bg)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card card-padded">
          <div className="section-label" style={{ marginBottom: 12 }}>Patient Status Distribution</div>
          <BarChart data={statusDistribution} total={patients.length} />
        </div>

        <div className="card card-padded">
          <div className="section-label" style={{ marginBottom: 12 }}>Medical Alert Distribution</div>
          <BarChart data={alertDistribution} total={patients.length} />
        </div>

        <div className="card card-padded">
          <div className="section-label" style={{ marginBottom: 12 }}>Patients per Doctor</div>
          <BarChart data={docDistribution.map((d) => ({ ...d, color: "var(--accent)" }))} total={patients.length} />
        </div>

        <div className="card card-padded">
          <div className="section-label" style={{ marginBottom: 12 }}>Data Quality</div>
          <QualityReport patients={patients} />
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, total }: { data: { label: string; count: number; color?: string }[]; total: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.map(({ label, count, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "var(--font-xs)", width: 130, flexShrink: 0, color: "var(--muted)" }}>{label}</span>
          <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              width: `${(count / max) * 100}%`,
              background: color || "var(--accent)",
              transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)", width: 30, textAlign: "right" }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function QualityReport({ patients }: { patients: Patient[] }) {
  const items = [
    { label: "Phone verified",    count: patients.filter((p) => p.phoneVerified).length     },
    { label: "ID verified",       count: patients.filter((p) => p.idVerified).length        },
    { label: "Consent signed",    count: patients.filter((p) => p.consentSigned).length     },
    { label: "Insurance verified",count: patients.filter((p) => p.insuranceVerified).length },
    { label: "Docs complete",     count: patients.filter((p) => p.documentsComplete).length },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(({ label, count }) => {
        const pct = Math.round((count / patients.length) * 100);
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "var(--font-xs)", width: 130, flexShrink: 0, color: "var(--muted)" }}>{label}</span>
            <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 4, width: `${pct}%`, background: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)", transition: "width 0.5s" }} />
            </div>
            <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)", width: 36, textAlign: "right" }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export function SettingsPage({
  dark, setDark, role, setRole,
}: {
  dark: boolean;
  setDark: (d: boolean) => void;
  role: string;
  setRole: (r: any) => void;
}) {
  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h2 style={{ fontSize: "var(--font-xl)", fontWeight: 800, marginBottom: 20 }}>Settings</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SettingRow
          icon="ti-moon"
          label="Dark Mode"
          description="Switch between light and dark theme"
        >
          <ToggleSwitch on={dark} onToggle={() => setDark(!dark)} />
        </SettingRow>

        <SettingRow
          icon="ti-user-shield"
          label="Current Role"
          description="Simulates role-based access control"
        >
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ fontSize: "var(--font-sm)" }}>
            <option value="receptionist">Receptionist</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
          </select>
        </SettingRow>

        <div className="card card-padded">
          <div className="section-label" style={{ marginBottom: 10 }}>Role Permissions</div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Permission</th>
                <th>Receptionist</th>
                <th>Doctor</th>
                <th>Admin</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["View Medical Info",    false, true,  true],
                ["View Billing",         true,  false, true],
                ["Edit Patient",         true,  true,  true],
                ["Delete Document",      false, false, true],
                ["Edit Medical Alerts",  false, true,  true],
                ["View Audit Log",       false, false, true],
                ["Delete Patient",       false, false, true],
              ].map(([perm, rec, doc, adm]) => (
                <tr key={perm as string}>
                  <td style={{ fontSize: "var(--font-sm)" }}>{perm as string}</td>
                  <td><PermDot on={rec as boolean} /></td>
                  <td><PermDot on={doc as boolean} /></td>
                  <td><PermDot on={adm as boolean} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SettingRow
          icon="ti-database"
          label="Data Persistence"
          description="Patient data is saved to localStorage and survives page refresh"
        >
          <span className="badge" style={{ background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" }}>
            <i className="ti ti-circle-check" style={{ fontSize: 10 }} /> Active
          </span>
        </SettingRow>

        <SettingRow
          icon="ti-shield-lock"
          label="Security Note"
          description="This is a frontend demo. In production, all data would be encrypted at rest (AES-256) and in transit (TLS 1.3), with full HIPAA audit logging."
        >
          <span className="badge" style={{ background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)" }}>
            Demo Mode
          </span>
        </SettingRow>
      </div>
    </div>
  );
}

function SettingRow({ icon, label, description, children }: {
  icon: string; label: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="card card-padded" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: "var(--radius)", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 17, color: "var(--accent)" }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{description}</div>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 44, height: 24, borderRadius: 12,
      background: on ? "var(--accent)" : "var(--border)",
      border: "none", cursor: "pointer", position: "relative",
      transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: on ? 23 : 3,
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function PermDot({ on }: { on: boolean }) {
  return (
    <span style={{ color: on ? "var(--green)" : "var(--border)", fontSize: 16 }}>
      <i className={`ti ${on ? "ti-circle-check-filled" : "ti-circle-x"}`} />
    </span>
  );
}

function StatCard({ label, value, color, icon, bg }: {
  label: string; value: number; color: string; icon: string; bg: string;
}) {
  return (
    <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: "var(--radius)", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className={`ti ${icon}`} style={{ fontSize: 18, color }} />
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Print Summary Modal ────────────────────────────────────────────────────────
export function PrintSummaryModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 600 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "var(--font-md)", fontWeight: 700 }}>Patient Summary</div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 14 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>
              {patient.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <div style={{ fontSize: "var(--font-lg)", fontWeight: 700 }}>{patient.name}</div>
              <div style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{patient.id} · {patient.gender} · {patient.age} years</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Phone</div>
              <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Blood Group</div>
              <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.bloodGroup}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Doctor</div>
              <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.doctor}</div>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
              <div style={{ fontSize: "var(--font-sm)", fontWeight: 600 }}>{patient.status}</div>
            </div>
          </div>
          {(patient.allergies || patient.conditions?.length || patient.medications?.length) && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>Medical Information</div>
              {patient.allergies && (
                <div style={{ marginBottom: 4 }}><strong>Allergies:</strong> {patient.allergies}</div>
              )}
              {patient.conditions?.length > 0 && (
                <div style={{ marginBottom: 4 }}><strong>Conditions:</strong> {patient.conditions.join(", ")}</div>
              )}
              {patient.medications?.length > 0 && (
                <div><strong>Medications:</strong> {patient.medications.join(", ")}</div>
              )}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={() => window.print()}>
              <i className="ti ti-printer" style={{ fontSize: 13 }} /> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
