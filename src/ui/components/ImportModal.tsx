import React, { useState } from "react";
import type { Patient } from "../types";

interface ImportModalProps {
  onImport: (rows: Partial<Patient>[]) => void;
  onClose: () => void;
}

export default function ImportModal({ onImport, onClose }: ImportModalProps) {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Partial<Patient>[]>([]);
  const [parsed, setParsed] = useState(false);

  function parseCsv() {
    const lines = csv.trim().split("\n").filter((l) => l.trim());
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return {
        firstName:     obj.firstname || obj["first name"] || obj.name?.split(" ")[0] || "",
        lastName:      obj.lastname  || obj["last name"]  || obj.name?.split(" ").slice(1).join(" ") || "",
        name:          obj.name || `${obj.firstname || ""} ${obj.lastname || ""}`.trim(),
        phone:         obj.phone || "",
        email:         obj.email || "",
        dob:           obj.dob || obj["date of birth"] || "",
        gender:        obj.gender || "Other",
        bloodGroup:    obj.bloodgroup || obj["blood group"] || "O+",
        doctor:        obj.doctor || "Dr. Sharma",
        insurer:       obj.insurer || obj.insurance || "None",
        address:       obj.address || "",
      } as Partial<Patient>;
    });
    setPreview(rows);
    setParsed(true);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ width: "100%", maxWidth: 620 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--font-md)" }}>Import Patients</div>
            <div style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>Paste CSV data below</div>
          </div>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" style={{ fontSize: 16 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          {!parsed ? (
            <>
              <div style={{
                padding: "12px", borderRadius: "var(--radius)", background: "var(--surface2)",
                border: "1px solid var(--border)", marginBottom: 12,
                fontSize: "var(--font-xs)", color: "var(--muted)", lineHeight: 1.7,
              }}>
                <strong>Expected columns:</strong> name, phone, email, dob, gender, bloodGroup, doctor, insurer, address
                <br />
                <strong>Example:</strong> name,phone,dob,gender<br />Arjun Sharma,+91 9876543210,1985-04-12,Male
              </div>
              <textarea
                value={csv}
                onChange={(e) => setCsv(e.target.value)}
                placeholder="Paste CSV data here…"
                rows={8}
                style={{ width: "100%", resize: "vertical", fontFamily: "monospace", fontSize: "var(--font-xs)" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={parseCsv} disabled={!csv.trim()}>
                  <i className="ti ti-eye" style={{ fontSize: 13 }} /> Preview
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12, fontSize: "var(--font-sm)", color: "var(--muted)" }}>
                Found <strong>{preview.length}</strong> records to import.
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
                <table className="tbl">
                  <thead>
                    <tr><th>Name</th><th>Phone</th><th>DOB</th><th>Doctor</th></tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: "var(--font-sm)" }}>{r.name}</td>
                        <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{r.phone}</td>
                        <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{r.dob}</td>
                        <td style={{ fontSize: "var(--font-sm)", color: "var(--muted)" }}>{r.doctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn btn-ghost" onClick={() => setParsed(false)}>Back</button>
                <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" onClick={() => onImport(preview)}>
                  <i className="ti ti-file-import" style={{ fontSize: 13 }} />
                  Import {preview.length} Patients
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
