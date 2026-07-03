import React, { useState, useCallback, useEffect, useRef } from "react";
import type { Patient, AuditEntry, UserRole } from "./types";
import GlobalStyles from "./GlobalStyles";
import PatientList from "./PatientList";
import PatientProfile from "./PatientProfile";
import PatientForm from "./PatientForm";
import { AppointmentsPage, BillingPage, ReportsPage, SettingsPage, PrintSummaryModal } from "./StubPages";
import { ToastProvider, useToast } from "./Toast";
import ErrorBoundary from "./ErrorBoundary";
import { getInitialPatients } from "./mockData";
import {
  getPatientStats,
  createAuditEntry,
  addAuditEntry,
  savePatients,
  loadPatients,
  saveAuditMap,
  loadAuditMap,
  fmtDate,
  undoRedoManager,
  exportPatients,
} from "./utils";
import TopBar, { type NavTab } from "./components/TopBar";
import Sidebar from "./Sidebar";
import StatsBar from "./StatsBar";
import ImportModal from "./components/ImportModal";

// Global error handler for unhandled promise rejections
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    event.preventDefault();
  });

  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
  });
}

// ─── Load initial data ────────────────────────────────────────────────────────
function getPatients(): Patient[] {
  const saved = loadPatients();
  if (saved && saved.length > 0) return saved;
  return getInitialPatients();
}

// ─── Mobile bottom nav tabs ───────────────────────────────────────────────────
const NAV_TABS: { id: NavTab; label: string; icon: string }[] = [
  { id: "patients",     label: "Patients",     icon: "ti-users" },
  { id: "appointments", label: "Appointments", icon: "ti-calendar" },
  { id: "billing",      label: "Billing",      icon: "ti-receipt" },
  { id: "reports",      label: "Reports",      icon: "ti-chart-bar" },
  { id: "settings",     label: "Settings",     icon: "ti-settings" },
];

// ─── Root App ─────────────────────────────────────────────────────────────────
function AppContent() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const { toast } = useToast();
  const [dark,            setDark]            = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [activeTab,       setActiveTab]       = useState<NavTab>("patients");
  const [patients,        setPatients]        = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [formMode,        setFormMode]        = useState<"create" | "edit" | null>(null);
  const [auditMap,        setAuditMap]        = useState<Record<string, AuditEntry[]>>({});
  const [importOpen,      setImportOpen]      = useState(false);
  const [userRole,        setUserRole]        = useState<UserRole>("receptionist");
  const [listSearch,      setListSearch]      = useState("");  // lifted search for stat bar clicks
  const [printPatient,    setPrintPatient]    = useState<Patient | null>(null);
  const [isLoaded,        setIsLoaded]        = useState(false);
  const [canUndo,         setCanUndo]         = useState(false);
  const [canRedo,         setCanRedo]         = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Display name for the active role, used in audit log messages
  const ROLE_NAMES: Record<string, string> = {
    receptionist: "Front Desk",
    doctor: "Dr. Sharma",
    nurse: "Nurse Station",
    admin: "Admin",
  };
  const CURRENT_USER = { name: ROLE_NAMES[userRole] || "Staff", role: userRole };
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    try {
      const loadedPatients = getPatients();
      const loadedAuditMap = loadAuditMap();
      setPatients(loadedPatients);
      setAuditMap(loadedAuditMap);
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading initial data:", error);
      // Fallback to initial data if loading fails
      setPatients(getInitialPatients());
      setAuditMap({});
      setIsLoaded(true);
      toast("Failed to load saved data, using default data", "error");
    }
  }, [toast]);

  // Persist whenever patients or audit changes
  useEffect(() => {
    try {
      savePatients(patients);
      setLastSavedAt(new Date().toISOString());
    } catch (error) {
      console.error("Failed to save patients:", error);
      toast("Failed to save patient data locally", "error");
    }
  }, [patients, toast]);

  useEffect(() => {
    try {
      saveAuditMap(auditMap);
    } catch (error) {
      console.error("Failed to save audit map:", error);
      toast("Failed to save audit log", "error");
    }
  }, [auditMap, toast]);

  // Keep selectedPatient in sync with patients array
  useEffect(() => {
    if (selectedPatient) {
      const fresh = patients.find((p) => p.id === selectedPatient.id);
      if (fresh && fresh !== selectedPatient) {
        setSelectedPatient(fresh);
      } else if (!fresh) {
        // Patient no longer exists (deleted/undone) — close profile view
        setSelectedPatient(null);
      }
    }
  }, [patients]);

  // Update undo/redo button states
  useEffect(() => {
    setCanUndo(undoRedoManager.canUndo());
    setCanRedo(undoRedoManager.canRedo());
  }, [patients]);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ctrl+K / Cmd+K → focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setActiveTab("patients");
        setSelectedPatient(null);
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('input[type="search"]');
          input?.focus();
        }, 80);
      }
      // Ctrl+N / Cmd+N → new patient
      if ((e.ctrlKey || e.metaKey) && e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        setActiveTab("patients");
        setSelectedPatient(null);
        setFormMode("create");
      }
      // Ctrl+E / Cmd+E → export patients
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        exportPatients(patients, "csv");
        toast("Patients exported to CSV", "success");
      }
      // Escape → close modals/go back
      if (e.key === "Escape") {
        if (formMode) {
          setFormMode(null);
        } else if (selectedPatient) {
          setSelectedPatient(null);
        } else if (importOpen) {
          setImportOpen(false);
        } else if (printPatient) {
          setPrintPatient(null);
        }
      }
      // Ctrl+1-5 → switch tabs
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "5") {
        e.preventDefault();
        const tabs: NavTab[] = ["patients", "appointments", "billing", "reports", "settings"];
        setActiveTab(tabs[parseInt(e.key) - 1]);
      }
      // Ctrl+D / Cmd+D → toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setDark(!dark);
      }
      // Ctrl+F / Cmd+F → focus search (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setActiveTab("patients");
        setSelectedPatient(null);
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('input[type="search"]');
          input?.focus();
        }, 80);
      }
      // Ctrl+Z / Cmd+Z → undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z / Cmd+Shift+Z → redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }
      // Ctrl+Y / Cmd+Y → redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, selectedPatient, formMode, importOpen, printPatient, patients, dark, toast]);

  const stats = getPatientStats(patients);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSelect = useCallback((p: Patient) => {
    setSelectedPatient(p);
    setActiveTab("patients");
  }, []);

  const handleBack = useCallback(() => setSelectedPatient(null), []);

  const handleUndo = useCallback(() => {
    const action = undoRedoManager.undo();
    if (action) {
      let updatedPatients: Patient[] = patients;

      if (action.type === "create") {
        // Undo create: remove the patient
        updatedPatients = patients.filter((p) => p.id !== action.patientId);
      } else if (action.type === "update") {
        // Undo update: restore previous state
        updatedPatients = patients.map((p) =>
          p.id === action.patientId ? action.patientData : p
        );
      } else if (action.type === "delete") {
        // Undo delete: restore the patient
        updatedPatients = [...patients, action.patientData];
      }
      
      setPatients(updatedPatients);
      toast(`Undid: ${action.description}`, "info");
    }
  }, [patients, toast]);

  const handleRedo = useCallback(() => {
    const action = undoRedoManager.redo();
    if (action) {
      let updatedPatients: Patient[] = patients;

      if (action.type === "create") {
        // Redo create: add the patient back
        updatedPatients = [...patients, action.patientData];
      } else if (action.type === "update") {
        // Redo update: apply the update again
        updatedPatients = patients.map((p) =>
          p.id === action.patientId ? action.patientData : p
        );
      } else if (action.type === "delete") {
        // Redo delete: remove the patient again
        updatedPatients = patients.filter((p) => p.id !== action.patientId);
      }
      
      setPatients(updatedPatients);
      toast(`Redid: ${action.description}`, "info");
    }
  }, [patients, toast]);

  const handleUpdatePatient = useCallback((updated: Patient, action = "edited") => {
    const previousPatient = patients.find((p) => p.id === updated.id);
    
    setPatients((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    setSelectedPatient(updated);
    
    // Record undo action
    if (previousPatient) {
      undoRedoManager.addAction({
        type: "update",
        patientId: updated.id,
        patientData: previousPatient,
        timestamp: Date.now(),
        description: `Update to ${updated.name}`,
      });
    }
    
    const entry = createAuditEntry({
      patientId: updated.id,
      message:   `${CURRENT_USER.name} ${action}: ${updated.name}`,
      type:      action,
      user:      CURRENT_USER.name,
    });
    setAuditMap((prev) => addAuditEntry(prev, updated.id, entry));
    toast(`${updated.name} updated`, "success");
  }, [toast, userRole]);

  const handleDeletePatient = useCallback((id: string) => {
    const p = patients.find((x) => x.id === id);
    if (p) {
      // Record undo action before deletion
      undoRedoManager.addAction({
        type: "delete",
        patientId: id,
        patientData: p,
        timestamp: Date.now(),
        description: `Delete ${p.name}`,
      });
    }
    setPatients((prev) => prev.filter((x) => x.id !== id));
    setSelectedPatient(null);
    if (p) {
      const entry = createAuditEntry({ patientId: id, message: `${CURRENT_USER.name} deleted ${p.name}`, type: "deleted", user: CURRENT_USER.name });
      setAuditMap((prev) => addAuditEntry(prev, id, entry));
      toast(`${p.name} deleted`, "error");
    }
  }, [patients, toast, userRole]);

  const handleSave = useCallback((data: Partial<Patient>) => {
    if (formMode === "create") {
      const newId = `CLN-${String(patients.length + 1001).padStart(5, "0")}`;
      const newPatient: Patient = {
        ...(data as Patient),
        id:               newId,
        alerts:           data.alerts || [],
        conditions:       data.conditions || [],
        medications:      data.medications || [],
        timeline:         [],
        documents:        [],
        notes:            [],
        family:           [],
        consents:         {},
        callAttempts:     0,
        phoneVerified:    false,
        insuranceVerified: false,
        idVerified:       false,
        consentSigned:    false,
        documentsComplete: false,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
      };
      setPatients((prev) => [newPatient, ...prev]);
      setSelectedPatient(newPatient);
      
      // Record undo action for create
      undoRedoManager.addAction({
        type: "create",
        patientId: newId,
        patientData: newPatient,
        timestamp: Date.now(),
        description: `Create ${newPatient.name}`,
      });
      
      const entry = createAuditEntry({ patientId: newId, message: `${CURRENT_USER.name} registered ${newPatient.name}`, type: "created", user: CURRENT_USER.name });
      setAuditMap((prev) => addAuditEntry(prev, newId, entry));
      toast(`${newPatient.name} registered`, "success");
    } else if (formMode === "edit" && selectedPatient) {
      const updated = { ...selectedPatient, ...data, updatedAt: new Date().toISOString() };
      
      // Record undo action for edit
      undoRedoManager.addAction({
        type: "update",
        patientId: updated.id,
        patientData: selectedPatient,
        timestamp: Date.now(),
        description: `Edit ${updated.name}`,
      });
      
      setPatients((prev) => prev.map((p) => p.id === updated.id ? updated : p));
      setSelectedPatient(updated);
      const entry = createAuditEntry({ patientId: updated.id, message: `${CURRENT_USER.name} edited ${updated.name}`, type: "edited", user: CURRENT_USER.name });
      setAuditMap((prev) => addAuditEntry(prev, updated.id, entry));
      toast(`${updated.name} saved`, "success");
    }
    setFormMode(null);
  }, [formMode, patients, selectedPatient, toast, userRole]);

  const handleImport = useCallback((rows: Partial<Patient>[]) => {
    const startIdx = patients.length;
    const newPatients: Patient[] = rows.map((row, i) => ({
      ...(row as Patient),
      id:            `CLN-${String(startIdx + i + 1001).padStart(5, "0")}`,
      name:          row.name || `${row.firstName || ""} ${row.lastName || ""}`.trim(),
      firstName:     row.firstName || row.name?.split(" ")[0] || "",
      lastName:      row.lastName  || row.name?.split(" ").slice(1).join(" ") || "",
      age:           row.dob ? Math.floor((Date.now() - new Date(row.dob).getTime()) / 31557600000) : 0,
      nationality:   "Indian",
      emergencyName: "", emergencyRelation: "", emergencyPhone: "",
      policyNumber:  null, insuranceExpiry: null,
      insuranceStatus: "None" as const,
      allergies: "", conditions: [], medications: [], alerts: [],
      status: "New" as const,
      doctor: row.doctor || "Dr. Sharma",
      lastVisit: null, nextAppointment: null,
      followUpDate: null, followUpReason: null, followUpStaff: null,
      followUpPriority: null, followUpStatus: null,
      callAttempts: 0, lastContacted: null, followUpNotes: null,
      phoneVerified: false, insuranceVerified: false,
      idVerified: false, consentSigned: false, documentsComplete: false,
      timeline: [], documents: [], notes: [], family: [], consents: {},
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));
    setPatients((prev) => [...newPatients, ...prev]);
    const entry = createAuditEntry({ patientId: "system", message: `${CURRENT_USER.name} imported ${newPatients.length} patients`, type: "import", user: CURRENT_USER.name });
    setAuditMap((prev) => addAuditEntry(prev, "system", entry));
    setImportOpen(false);
    toast(`${newPatients.length} patients imported`, "success");
  }, [patients.length, toast, userRole]);

  // ── Demo data controls (local-only, no backend) ───────────────────────────────
  const resetDemoData = useCallback(() => {
    try {
      const fresh = getInitialPatients();
      setPatients(fresh);
      setAuditMap({});
      setSelectedPatient(null);
      toast("Demo data reset to defaults", "success");
    } catch (error) {
      console.error("Failed to reset demo data:", error);
      toast("Could not reset demo data", "error");
    }
  }, [toast]);

  const loadSampleDemoData = useCallback(() => {
    try {
      const sample = getInitialPatients();
      setPatients(sample);
      setSelectedPatient(null);
      const entry = createAuditEntry({ patientId: "system", message: `${CURRENT_USER.name} loaded sample clinic data`, type: "import", user: CURRENT_USER.name });
      setAuditMap((prev) => addAuditEntry(prev, "system", entry));
      toast("Sample clinic data loaded", "success");
    } catch (error) {
      console.error("Failed to load sample demo data:", error);
      toast("Could not load sample data", "error");
    }
  }, [toast, userRole]);

  const clearLocalDemoStorage = useCallback(() => {
    try {
      // Demo-only: clears this browser's local storage and reloads sample data.
      // No backend or production persistence is affected.
      window.localStorage.clear();
      const fresh = getInitialPatients();
      setPatients(fresh);
      setAuditMap({});
      setSelectedPatient(null);
      toast("Local storage cleared — sample data reloaded", "success");
    } catch (error) {
      console.error("Failed to clear local storage:", error);
      toast("Could not clear local storage", "error");
    }
  }, [toast]);

  const exportDemoJson = useCallback(() => {
    try {
      const payload = {
        patients,
        auditMap,
        generatedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinicos-demo-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Demo data exported as JSON", "success");
    } catch (error) {
      console.error("Failed to export demo data:", error);
      toast("Could not export demo data", "error");
    }
  }, [patients, auditMap, toast]);

  // ── Render ───────────────────────────────────────────────────────────────────
  // Show loading screen while data is loading
  if (!isLoaded) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--surface)",
        color: "var(--text)",
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "spin 1s linear infinite",
          marginBottom: 16,
        }} />
        <div style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>Loading ClinicOS...</div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="crm-root col" style={{ height: "100vh", minHeight: "-webkit-fill-available", overflow: "hidden" }}>
      <GlobalStyles dark={dark} />

      <TopBar
        dark={dark} setDark={setDark}
        activeTab={activeTab} setActiveTab={setActiveTab}
        userRole={userRole} setUserRole={setUserRole}
        stats={stats}
      />

      {/* Body: sidebar (desktop) + main column */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "row" }}>

        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} dark={dark} />

        {/* Main column */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Stats bar — only on patients tab, only when not in profile view */}
          {activeTab === "patients" && !selectedPatient && (
            <StatsBar
              stats={stats}
              onFilter={(q) => { setListSearch(q); }}
              patients={patients}
              dark={dark}
            />
          )}

          {/* Ctrl+K hint */}
          <style>{`
            @media (max-width: 768px) {
              .content-area { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important; }
            }
          `}</style>
          {activeTab === "patients" && !selectedPatient && (
            <div style={{
              position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
              zIndex: 50, pointerEvents: "none",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)", padding: "5px 14px",
              fontSize: "var(--font-xs)", color: "var(--muted)", boxShadow: "var(--shadow)",
              display: "flex", alignItems: "center", gap: 6,
              opacity: 0.7,
            }}>
              <kbd style={{ background: "var(--surface2)", padding: "1px 5px", borderRadius: 4, fontSize: "var(--font-2xs)", fontFamily: "monospace" }}>
                Ctrl+K
              </kbd>
              to focus search
            </div>
          )}

          {/* Page content */}
          <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", paddingBottom: "env(safe-area-inset-bottom, 0px)" }} className="content-area">
        {activeTab === "patients" && (
          selectedPatient ? (
            <PatientProfile
              patient={selectedPatient}
              auditEntries={auditMap[selectedPatient.id] || []}
              onBack={handleBack}
              onEditPatient={() => setFormMode("edit")}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={handleDeletePatient}
              onPrint={() => setPrintPatient(selectedPatient)}
              role={userRole}
            />
          ) : (
            <PatientList
              patients={patients}
              onSelect={handleSelect}
              selectedId={selectedPatient?.id}
              onNewPatient={() => setFormMode("create")}
              onImport={() => setImportOpen(true)}
              role={userRole}
              externalSearch={listSearch}
              onExternalSearchClear={() => setListSearch("")}
            />
          )
        )}
        {activeTab === "appointments" && (
          <div style={{ flex: 1, overflow: "auto", height: "100%" }}>
            <AppointmentsPage patients={patients} onSelectPatient={(p) => { handleSelect(p); setActiveTab("patients"); }} />
          </div>
        )}
        {activeTab === "billing" && (
          <div style={{ flex: 1, overflow: "auto", height: "100%" }}>
            <BillingPage patients={patients} onSelectPatient={(p) => { handleSelect(p); setActiveTab("patients"); }} />
          </div>
        )}
        {activeTab === "reports" && (
          <div style={{ flex: 1, overflow: "auto", height: "100%" }}>
            <ReportsPage patients={patients} onSelectPatient={(p) => { handleSelect(p); setActiveTab("patients"); }} />
          </div>
        )}
        {activeTab === "settings" && (
          <div style={{ flex: 1, overflow: "auto", height: "100%" }}>
            {/* Extra demo-control props are forwarded via spread so this compiles
                whether or not SettingsPage's prop type has been updated yet to
                accept them (see SettingsPage prompt for wiring the UI). */}
            <SettingsPage
              dark={dark} setDark={setDark} role={userRole} setRole={setUserRole}
              {...({
                onResetDemoData: resetDemoData,
                onLoadSampleData: loadSampleDemoData,
                onClearLocalStorage: clearLocalDemoStorage,
                onExportDemoJson: exportDemoJson,
                lastSavedAt,
              } as any)}
            />
          </div>
        )}
          </div>
        </div>{/* /main column */}
      </div>{/* /body row */}

      {/* Mobile Bottom Navigation */}
      <div className="mobile-only" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: dark ? "#0c0f1a" : "#fff",
        borderTop: "1px solid var(--border)",
        justifyContent: "space-around",
        padding: "8px 0", paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
        zIndex: 1000,
        boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
      }}>
        {NAV_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setSelectedPatient(null); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "8px 12px", borderRadius: "var(--radius)",
              fontSize: "var(--font-xs)", fontWeight: activeTab === id ? 600 : 400,
              cursor: "pointer", border: "none", transition: "all 0.2s",
              color: activeTab === id ? "var(--accent)" : "var(--muted)",
              background: activeTab === id ? "var(--accent-soft)" : "transparent",
              minWidth: 60,
            }}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
            <span style={{ fontSize: 10 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Demo Mode identity — small, non-intrusive. TopBar prompt may relocate this. */}
      <div style={{
        position: "fixed", top: 8, right: 12, zIndex: 1100,
        fontSize: "var(--font-2xs)", color: "var(--muted)",
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-full)", padding: "3px 10px",
        opacity: 0.75, pointerEvents: "none",
      }} className="desktop-only">
        Demo Mode · Local sample data · Not connected to backend
      </div>

      {/* Modals */}
      {formMode && (
        <PatientForm
          mode={formMode}
          patient={formMode === "edit" ? selectedPatient : null}
          onSave={handleSave}
          onClose={() => setFormMode(null)}
          role={userRole}
          existingPatients={patients}
        />
      )}
      {importOpen && (
        <ImportModal onImport={handleImport} onClose={() => setImportOpen(false)} />
      )}
      {printPatient && (
        <PrintSummaryModal patient={printPatient} onClose={() => setPrintPatient(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
