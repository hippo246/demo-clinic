import React, { useState, useMemo, useCallback, useEffect } from "react";
import type { Patient, UserRole } from "./types";
import { DOCTORS, STATUSES, PAGE_SIZE } from "./constants";
import { applySmartSearch, sortPatients, fmtDate, calcRiskScore, detectDuplicates, exportPatients } from "./utils";
import { StatusBadge, InsuranceBadge, AlertChip, AvatarCircle, RiskBadge } from "./Badges";
import { useToast } from "./Toast";
import { SkeletonTable } from "./Skeleton";

const SMART_SUGGESTIONS = [
  { label: "Diabetic patients",         query: "diabetic" },
  { label: "Follow-up overdue",         query: "follow-up overdue" },
  { label: "Insurance expiring",        query: "insurance expiring" },
  { label: "Missing consent",           query: "missing consent" },
  { label: "VIP patients",              query: "vip" },
  { label: "Critical risk",             query: "critical" },
  { label: "No visit in 90 days",       query: "90 days" },
  { label: "Missing emergency contact", query: "missing emergency" },
];

interface PatientListProps {
  patients: Patient[];
  onSelect: (p: Patient) => void;
  selectedId?: string;
  onNewPatient: () => void;
  onImport: () => void;
  role: UserRole;
  externalSearch?: string;
  onExternalSearchClear?: () => void;
}

function QualityBar({ patients, onSearch }: { patients: Patient[]; onSearch: (q: string) => void }) {
  const issues = useMemo(() => {
    const items = [
      { label: "Expired Insurance",    count: patients.filter((p) => p.insuranceStatus === "Expired").length,     color: "#dc2626", query: "expired insurance" },
      { label: "Missing Consent",      count: patients.filter((p) => !p.consentSigned).length,                    color: "#d97706", query: "missing consent" },
      { label: "Follow-Up Overdue",    count: patients.filter((p) => p.status === "Follow-Up Due").length,        color: "#d97706", query: "follow-up overdue" },
      { label: "Critical Alerts",      count: patients.filter((p) => (p.alerts||[]).some((a) => ["Allergy","Heart Condition","Pregnancy","High Risk"].includes(a))).length, color: "#dc2626", query: "critical" },
      { label: "No Emergency Contact", count: patients.filter((p) => !p.emergencyName || !p.emergencyPhone).length, color: "#7c3aed", query: "missing emergency" },
    ];
    return items.filter((i) => i.count > 0);
  }, [patients]);

  if (issues.length === 0) return null;

  return (
    <div style={{
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
    }}>
      <span style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>
        <i className="ti ti-checklist" style={{ fontSize: 11, marginRight: 4 }} />
        Data Issues
      </span>
      {issues.map((issue) => (
        <button key={issue.label} onClick={() => onSearch(issue.query)} style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: "var(--font-xs)", fontWeight: 600,
          background: issue.color + "12", border: `1px solid ${issue.color}35`, color: issue.color,
          cursor: "pointer",
        }}>
          <span style={{ fontWeight: 800 }}>{issue.count}</span>
          {issue.label}
        </button>
      ))}
    </div>
  );
}

export default function PatientList({
  patients,
  onSelect,
  selectedId,
  onNewPatient,
  onImport,
  role,
  externalSearch = "",
  onExternalSearchClear,
}: PatientListProps) {
  const { toast } = useToast();
  const [search,          setSearch]         = useState("");
  const [filterStatus,    setFilterStatus]   = useState("All");
  const [filterDoctor,    setFilterDoctor]   = useState("All");
  const [filterInsurance, setFilterIns]      = useState("All");
  const [filterRisk,      setFilterRisk]     = useState("All");
  const [filterGender,    setFilterGender]   = useState("All");
  const [filterBloodGroup,setFilterBloodGroup]= useState("All");
  const [filterAgeMin,    setFilterAgeMin]   = useState("");
  const [filterAgeMax,    setFilterAgeMax]   = useState("");
  const [filterDateFrom,  setFilterDateFrom] = useState("");
  const [filterDateTo,    setFilterDateTo]   = useState("");
  const [showAdvanced,    setShowAdvanced]   = useState(false);
  const [sortKey,         setSortKey]        = useState<keyof Patient>("lastVisit");
  const [sortDir,         setSortDir]        = useState<"asc"|"desc">("desc");
  const [page,            setPage]           = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);


  const filtered = useMemo(() => {
    let list = applySmartSearch(patients, search);
    if (filterStatus    !== "All") list = list.filter((p) => p.status          === filterStatus);
    if (filterDoctor    !== "All") list = list.filter((p) => p.doctor          === filterDoctor);
    if (filterInsurance !== "All") list = list.filter((p) => p.insuranceStatus === filterInsurance);
    if (filterRisk      !== "All") list = list.filter((p) => calcRiskScore(p).level === filterRisk);
    if (filterGender    !== "All") list = list.filter((p) => p.gender          === filterGender);
    if (filterBloodGroup!== "All") list = list.filter((p) => p.bloodGroup      === filterBloodGroup);
    if (filterAgeMin    !== "")     list = list.filter((p) => p.age            >= parseInt(filterAgeMin));
    if (filterAgeMax    !== "")     list = list.filter((p) => p.age            <= parseInt(filterAgeMax));
    if (filterDateFrom  !== "")     list = list.filter((p) => p.lastVisit       && new Date(p.lastVisit) >= new Date(filterDateFrom));
    if (filterDateTo    !== "")     list = list.filter((p) => p.lastVisit       && new Date(p.lastVisit) <= new Date(filterDateTo));
    return sortPatients(list, sortKey, sortDir);
  }, [patients, search, filterStatus, filterDoctor, filterInsurance, filterRisk, filterGender, filterBloodGroup, filterAgeMin, filterAgeMax, filterDateFrom, filterDateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Show bulk actions when patients are selected
  useEffect(() => {
    setShowBulkActions(selectedPatients.size > 0);
  }, [selectedPatients]);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clinic_search_history");
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  }, []);

  // Save search to history when user performs a search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (value.trim() && value.length > 2) {
      // Add to history if not already present
      setSearchHistory((prev) => {
        const filtered = prev.filter((h) => h !== value);
        const newHistory = [value, ...filtered].slice(0, 10); // Keep last 10 searches
        try {
          localStorage.setItem("clinic_search_history", JSON.stringify(newHistory));
        } catch (error) {
          console.error("Error saving search history:", error);
        }
        return newHistory;
      });
    }
  };

  const selectHistoryItem = (item: string) => {
    setSearch(item);
    resetPage();
  };

  function handleSort(key: keyof Patient) {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => d === "asc" ? "desc" : "asc"); return key; }
      setSortDir("asc");
      return key;
    });
    setPage(1);
  }

  function resetPage() { setPage(1); }

  function togglePatientSelection(id: string) {
    setSelectedPatients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function toggleAllPatients() {
    if (selectedPatients.size === paginated.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(paginated.map((p) => p.id)));
    }
  }

  function clearSelection() {
    setSelectedPatients(new Set());
    setShowBulkActions(false);
  }

  function handleBulkExport(format: "csv" | "json") {
    setIsLoading(true);
    const selected = patients.filter((p) => selectedPatients.has(p.id));
    
    // Simulate processing delay for better UX
    setTimeout(() => {
      exportPatients(selected, format);
      toast(`${selected.length} patients exported to ${format.toUpperCase()}`, "success");
      clearSelection();
      setIsLoading(false);
    }, 500);
  }

  function handleBulkStatusUpdate(newStatus: string) {
    // This would need to be passed up to parent component
    toast(`Status update for ${selectedPatients.size} patients would be implemented here`, "info");
    clearSelection();
  }

  function generatePatientReport(patients: Patient[], reportType: string) {
    const reportDate = new Date().toLocaleDateString();
    let reportContent = "";

    if (reportType === "summary") {
      reportContent = `
PATIENT SUMMARY REPORT
Generated: ${reportDate}
==========================================

TOTAL PATIENTS: ${patients.length}

DEMOGRAPHIC BREAKDOWN:
- Male: ${patients.filter(p => p.gender === "Male").length}
- Female: ${patients.filter(p => p.gender === "Female").length}
- Other: ${patients.filter(p => p.gender === "Other").length}

STATUS BREAKDOWN:
- New: ${patients.filter(p => p.status === "New").length}
- Active: ${patients.filter(p => p.status === "Active").length}
- Follow-Up Due: ${patients.filter(p => p.status === "Follow-Up Due").length}
- Under Treatment: ${patients.filter(p => p.status === "Under Treatment").length}
- Inactive: ${patients.filter(p => p.status === "Inactive").length}

INSURANCE STATUS:
- Active: ${patients.filter(p => p.insuranceStatus === "Active").length}
- Expiring: ${patients.filter(p => p.insuranceStatus === "Expiring").length}
- Expired: ${patients.filter(p => p.insuranceStatus === "Expired").length}
- None: ${patients.filter(p => p.insuranceStatus === "None").length}

CLINICAL ALERTS:
- Diabetic: ${patients.filter(p => p.alerts?.includes("Diabetic")).length}
- Hypertension: ${patients.filter(p => p.alerts?.includes("Hypertension")).length}
- Allergy: ${patients.filter(p => p.alerts?.includes("Allergy")).length}
- Heart Condition: ${patients.filter(p => p.alerts?.includes("Heart Condition")).length}
- Pregnancy: ${patients.filter(p => p.alerts?.includes("Pregnancy")).length}
- High Risk: ${patients.filter(p => p.alerts?.includes("High Risk")).length}

END OF REPORT
      `;
    }

    const blob = new Blob([reportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient-report-${reportType}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
  }

  const dupeCount = useMemo(() => detectDuplicates(patients).length, [patients]);

  const SortIcon = ({ col }: { col: keyof Patient }) => {
    if (sortKey !== col) return <i className="ti ti-selector" style={{ fontSize: 11, opacity: 0.3 }} />;
    return <i className={`ti ti-sort-${sortDir === "asc" ? "ascending" : "descending"}`} style={{ fontSize: 11, color: "var(--accent)" }} />;
  };

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Quality bar — desktop only */}
      <div className="desktop-only" style={{ flexShrink: 0 }}>
        <QualityBar patients={patients} onSearch={(q) => { setSearch(q); resetPage(); }} />
      </div>

      {/* Toolbar */}
      <div style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "10px 12px", flexShrink: 0,
      }}>
        {/* Search row — always visible */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 0 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <i className="ti ti-search" style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 16, color: "var(--muted)", pointerEvents: "none",
            }} />
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
              placeholder="Search patients…"
              style={{ width: "100%", paddingLeft: 40, paddingRight: search ? 40 : 12, minHeight: 44 }}
            />
            {search && (
              <button onClick={() => { setSearch(""); resetPage(); }} style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--muted)",
                display: "flex", alignItems: "center", padding: 8,
              }}>
                <i className="ti ti-x" style={{ fontSize: 16 }} />
              </button>
            )}
            {showSuggestions && !search && (
              <div style={{
                position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 200,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", overflow: "hidden",
              }}>
                {searchHistory.length > 0 && (
                  <>
                    <div style={{ padding: "8px 12px 4px", fontSize: "var(--font-2xs)", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Recent Searches
                    </div>
                    {searchHistory.map((item) => (
                      <button key={item} onMouseDown={() => selectHistoryItem(item)}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "var(--font-sm)", color: "var(--text)", textAlign: "left" }}
                        className="tbl-row"
                      >
                        <i className="ti ti-history" style={{ fontSize: 12, color: "var(--muted)" }} />
                        {item}
                      </button>
                    ))}
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                  </>
                )}
                <div style={{ padding: "8px 12px 4px", fontSize: "var(--font-2xs)", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Smart Search</div>
                {SMART_SUGGESTIONS.map((s) => (
                  <button key={s.query} onMouseDown={() => { setSearch(s.query); resetPage(); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: "var(--font-sm)", color: "var(--text)", textAlign: "left" }}
                    className="tbl-row"
                  >
                    <i className="ti ti-sparkles" style={{ fontSize: 12, color: "var(--accent)" }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mobile: filter toggle + new patient only */}
          <button className="btn btn-ghost mobile-only-block" style={{ padding: "12px", minHeight: 44, minWidth: 44, flexShrink: 0 }}
            onClick={() => setShowMobileFilters((v) => !v)}>
            <i className={`ti ${showMobileFilters ? "ti-filter-off" : "ti-filter"}`} style={{ fontSize: 16 }} />
          </button>
          <button className="btn btn-primary mobile-only-block" style={{ padding: "12px", minHeight: 44, minWidth: 44, flexShrink: 0 }} onClick={onNewPatient}>
            <i className="ti ti-user-plus" style={{ fontSize: 16 }} />
          </button>

          {/* Desktop: all action buttons */}
          <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}
              style={{ fontSize: "var(--font-sm)", minWidth: 120, minHeight: 44, padding: "0 12px" }}>
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filterDoctor} onChange={(e) => { setFilterDoctor(e.target.value); resetPage(); }}
              style={{ fontSize: "var(--font-sm)", minWidth: 130, minHeight: 44, padding: "0 12px" }}>
              <option value="All">All Doctors</option>
              {DOCTORS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={filterInsurance} onChange={(e) => { setFilterIns(e.target.value); resetPage(); }}
              style={{ fontSize: "var(--font-sm)", minWidth: 110, minHeight: 44, padding: "0 12px" }}>
              <option value="All">All Insurance</option>
              {["Active","Expiring","Expired","None"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filterRisk} onChange={(e) => { setFilterRisk(e.target.value); resetPage(); }}
              style={{ fontSize: "var(--font-sm)", minWidth: 100, minHeight: 44, padding: "0 12px" }}>
              <option value="All">All Risk</option>
              {["Low","Medium","High","Critical"].map((r) => <option key={r}>{r}</option>)}
            </select>
            <button className="btn btn-ghost" onClick={() => setShowAdvanced(!showAdvanced)} style={{ fontSize: "var(--font-sm)", padding: "12px", minHeight: 44 }}>
              <i className={`ti ${showAdvanced ? "ti-chevron-up" : "ti-chevron-down"}`} style={{ fontSize: 12 }} /> Advanced
            </button>
            {(filterStatus !== "All" || filterDoctor !== "All" || filterInsurance !== "All" || filterRisk !== "All" || filterGender !== "All" || filterBloodGroup !== "All" || filterAgeMin || filterAgeMax || filterDateFrom || filterDateTo) && (
              <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "12px", minHeight: 44, color: "var(--red)" }} onClick={() => { setFilterStatus("All"); setFilterDoctor("All"); setFilterIns("All"); setFilterRisk("All"); setFilterGender("All"); setFilterBloodGroup("All"); setFilterAgeMin(""); setFilterAgeMax(""); setFilterDateFrom(""); setFilterDateTo(""); resetPage(); }}>
                <i className="ti ti-filter-off" style={{ fontSize: 12 }} /> Clear All
              </button>
            )}
            {dupeCount > 0 && (
              <span className="badge" style={{ background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)" }}>
                <i className="ti ti-copy" style={{ fontSize: 10 }} /> {dupeCount} dupes
              </span>
            )}
            <button className="btn btn-ghost" style={{ padding: "12px", minHeight: 44 }} onClick={() => generatePatientReport(patients, "summary")} title="Report"><i className="ti ti-file-text" style={{ fontSize: 14 }} /></button>
            <button className="btn btn-ghost" style={{ padding: "12px", minHeight: 44 }} onClick={() => exportPatients(filtered, "csv")} title="Export CSV"><i className="ti ti-download" style={{ fontSize: 14 }} /></button>
            <button className="btn btn-ghost" style={{ padding: "12px", minHeight: 44 }} onClick={() => exportPatients(filtered, "json")} title="Export JSON"><i className="ti ti-file-code" style={{ fontSize: 14 }} /></button>
            <button className="btn btn-ghost" style={{ padding: "12px", minHeight: 44 }} onClick={onImport} title="Import"><i className="ti ti-file-import" style={{ fontSize: 14 }} /></button>
            <button className="btn btn-primary" style={{ padding: "12px 16px", minHeight: 44 }} onClick={onNewPatient}>
              <i className="ti ti-user-plus" style={{ fontSize: 14 }} /> New Patient
            </button>
          </div>
        </div>

        {/* Mobile filter panel */}
        {showMobileFilters && (
          <div className="mobile-only-block" style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }} style={{ fontSize: 14 }}>
              <option value="All">All Statuses</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filterDoctor} onChange={(e) => { setFilterDoctor(e.target.value); resetPage(); }} style={{ fontSize: 14 }}>
              <option value="All">All Doctors</option>
              {DOCTORS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select value={filterInsurance} onChange={(e) => { setFilterIns(e.target.value); resetPage(); }} style={{ fontSize: 14 }}>
              <option value="All">All Insurance</option>
              {["Active","Expiring","Expired","None"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select value={filterRisk} onChange={(e) => { setFilterRisk(e.target.value); resetPage(); }} style={{ fontSize: 14 }}>
              <option value="All">All Risk</option>
              {["Low","Medium","High","Critical"].map((r) => <option key={r}>{r}</option>)}
            </select>
            {(filterStatus !== "All" || filterDoctor !== "All" || filterInsurance !== "All" || filterRisk !== "All") && (
              <button className="btn btn-ghost" style={{ gridColumn: "span 2", color: "var(--red)", fontSize: 13 }}
                onClick={() => { setFilterStatus("All"); setFilterDoctor("All"); setFilterIns("All"); setFilterRisk("All"); resetPage(); }}>
                <i className="ti ti-filter-off" style={{ fontSize: 12 }} /> Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div style={{
          background: "var(--accent-soft)", borderBottom: "1px solid var(--accent)",
          padding: "8px 16px", display: "flex", alignItems: "center", gap: 12,
          animation: "slideDown 0.2s ease",
        }}>
          <span style={{ fontSize: "var(--font-sm)", fontWeight: 600, color: "var(--accent)" }}>
            {selectedPatients.size} patient{selectedPatients.size !== 1 ? "s" : ""} selected
          </span>
          <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "4px 10px" }} onClick={() => handleBulkExport("csv")}>
            <i className="ti ti-download" style={{ fontSize: 12 }} />
            Export CSV
          </button>
          <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "4px 10px" }} onClick={() => handleBulkExport("json")}>
            <i className="ti ti-file-code" style={{ fontSize: 12 }} />
            Export JSON
          </button>
          <button className="btn btn-ghost" style={{ fontSize: "var(--font-sm)", padding: "4px 10px", color: "var(--red)" }} onClick={clearSelection}>
            <i className="ti ti-x" style={{ fontSize: 12 }} />
            Clear Selection
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="card card-padded" style={{ margin: "10px 16px", animation: "slideDown 0.2s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {/* Gender Filter */}
            <div className="field-group">
              <label className="field-label">Gender</label>
              <select value={filterGender} onChange={(e) => { setFilterGender(e.target.value); resetPage(); }} style={{ width: "100%" }}>
                <option value="All">All</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Blood Group Filter */}
            <div className="field-group">
              <label className="field-label">Blood Group</label>
              <select value={filterBloodGroup} onChange={(e) => { setFilterBloodGroup(e.target.value); resetPage(); }} style={{ width: "100%" }}>
                <option value="All">All</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => <option key={bg}>{bg}</option>)}
              </select>
            </div>

            {/* Age Range Filter */}
            <div className="field-group">
              <label className="field-label">Age Range</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" value={filterAgeMin} onChange={(e) => { setFilterAgeMin(e.target.value); resetPage(); }} placeholder="Min" style={{ width: "60px", fontSize: "var(--font-sm)" }} min="0" max="120" />
                <span style={{ color: "var(--muted)" }}>-</span>
                <input type="number" value={filterAgeMax} onChange={(e) => { setFilterAgeMax(e.target.value); resetPage(); }} placeholder="Max" style={{ width: "60px", fontSize: "var(--font-sm)" }} min="0" max="120" />
              </div>
            </div>

            {/* Last Visit Date Range */}
            <div className="field-group">
              <label className="field-label">Last Visit Range</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); resetPage(); }} style={{ width: "100%", fontSize: "var(--font-sm)" }} />
                <span style={{ color: "var(--muted)" }}>-</span>
                <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); resetPage(); }} style={{ width: "100%", fontSize: "var(--font-sm)" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active search label */}
      {search && (
        <div style={{
          background: "var(--accent-soft)", borderBottom: "1px solid var(--border)",
          padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        }}>
          <i className="ti ti-sparkles" style={{ fontSize: 12, color: "var(--accent)" }} />
          <span style={{ fontSize: "var(--font-sm)", color: "var(--accent)", fontWeight: 600 }}>
            Smart search: "{search}" — {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
          <button onClick={() => { setSearch(""); resetPage(); }} style={{
            marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
            color: "var(--accent)", fontSize: "var(--font-sm)", fontWeight: 600,
          }}>
            Clear ×
          </button>
        </div>
      )}

      {/* Table — desktop / Cards — mobile */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {/* Desktop table */}
        <div className="desktop-only tbl-container">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : (
            <table className="tbl" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ width: 44, paddingLeft: 16 }}>
                    <input type="checkbox" checked={selectedPatients.size === paginated.length && paginated.length > 0} onChange={toggleAllPatients} aria-label="Select all patients" style={{ cursor: "pointer" }} />
                  </th>
                  {([
                    { key: "id",              label: "ID",         w: 100 },
                    { key: "name",            label: "Patient",    w: 180 },
                    { key: "age",             label: "Age",        w: 60  },
                    { key: "doctor",          label: "Doctor",     w: 130 },
                    { key: "status",          label: "Status",     w: 130 },
                    { key: "insuranceStatus", label: "Insurance",  w: 100 },
                    { key: "lastVisit",       label: "Last Visit", w: 100 },
                  ] as { key: keyof Patient; label: string; w: number }[]).map(({ key, label, w }) => (
                    <th key={key} style={{ width: w, cursor: "pointer" }} onClick={() => handleSort(key)}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {label} <SortIcon col={key} />
                      </span>
                    </th>
                  ))}
                  <th>Alerts</th>
                  <th style={{ width: 90 }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 0 }}>
                    <div className="empty-state">
                      <i className="ti ti-users empty-state-icon" />
                      <div className="empty-state-text">No patients found</div>
                      <div className="empty-state-sub">Try adjusting your search or filters</div>
                    </div>
                  </td></tr>
                ) : paginated.map((p) => (
                  <PatientRow key={p.id} patient={p} selected={p.id === selectedId} onSelect={onSelect} bulkSelected={selectedPatients.has(p.id)} onBulkToggle={togglePatientSelection} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile card list */}
        <div className="mobile-only-block" style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {paginated.length === 0 ? (
            <div className="empty-state">
              <i className="ti ti-users empty-state-icon" />
              <div className="empty-state-text">No patients found</div>
              <div className="empty-state-sub">Try adjusting your search or filters</div>
            </div>
          ) : paginated.map((p) => (
            <button key={p.id} onClick={() => onSelect(p)} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "12px",
              cursor: "pointer", textAlign: "left", width: "100%",
              boxShadow: "var(--shadow-sm)",
            }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: "var(--accent-soft)", color: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800,
              }}>
                {p.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {p.age}y · {p.gender} · {p.doctor}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  {p.id} · Last visit: {fmtDate(p.lastVisit)}
                </div>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--muted)", flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          background: "var(--surface)", borderTop: "1px solid var(--border)",
          padding: "8px 12px", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <span style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>
            {page}/{totalPages} · {filtered.length}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: "var(--font-sm)" }}
              disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <i className="ti ti-chevron-left" style={{ fontSize: 13 }} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p_num = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p_num = i + 1;
                else if (page >= totalPages - 2) p_num = totalPages - 4 + i;
                else p_num = page - 2 + i;
              }
              return (
                <button key={p_num} onClick={() => setPage(p_num)}
                  className="btn btn-ghost"
                  style={{
                    padding: "5px 10px", fontSize: "var(--font-sm)", minWidth: 32,
                    background: page === p_num ? "var(--accent-soft)" : undefined,
                    color:      page === p_num ? "var(--accent)" : undefined,
                    fontWeight: page === p_num ? 700 : undefined,
                  }}>
                  {p_num}
                </button>
              );
            })}
            <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: "var(--font-sm)" }}
              disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <i className="ti ti-chevron-right" style={{ fontSize: 13 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientRow({
  patient: p,
  selected,
  onSelect,
  bulkSelected,
  onBulkToggle,
}: {
  patient: Patient;
  selected: boolean;
  onSelect: (p: Patient) => void;
  bulkSelected: boolean;
  onBulkToggle: (id: string) => void;
}) {
  return (
    <tr
      className={`tbl-row${selected ? " selected" : ""}`}
      onClick={() => onSelect(p)}
    >
      <td style={{ paddingLeft: 16 }} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={bulkSelected}
          onChange={() => onBulkToggle(p.id)}
          aria-label={`Select ${p.name}`}
          style={{ cursor: "pointer" }}
        />
      </td>
      <td>
        <span style={{ fontSize: "var(--font-2xs)", color: "var(--muted)", display: "block" }}>{p.id}</span>
      </td>
      <td>
        <div>
          <span style={{ fontSize: "var(--font-sm)", fontWeight: 600, color: "var(--text)" }}>{p.name}</span>
          <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)", marginTop: 1 }}>
            {p.gender} · {p.bloodGroup}
          </div>
        </div>
      </td>
      <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>
        {p.age}y
      </td>
      <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{p.doctor}</td>
      <td><StatusBadge status={p.status} /></td>
      <td><InsuranceBadge status={p.insuranceStatus} /></td>
      <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>
        {fmtDate(p.lastVisit)}
      </td>
      <td>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(p.alerts || []).slice(0, 2).map((a) => (
            <AlertChip key={a} alert={a} />
          ))}
          {(p.alerts || []).length > 2 && (
            <span className="tag" style={{ background: "var(--surface3)", color: "var(--muted)" }}>
              +{p.alerts.length - 2}
            </span>
          )}
        </div>
      </td>
      <td><RiskBadge patient={p} /></td>
    </tr>
  );
}
