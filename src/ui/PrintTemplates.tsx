import React from "react";
import type { Patient } from "./types";


interface PrintHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}

export function PrintHeader({ title, subtitle, showLogo = true }: PrintHeaderProps) {
  return (
    <div className="print-header">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {showLogo && (
            <div style={{ fontSize: "18pt", fontWeight: 800, color: "#000", marginBottom: "5px" }}>
              <i className="ti ti-heart-rate-monitor" style={{ marginRight: "8px" }} />
              ClinicOS
            </div>
          )}
          <div style={{ fontSize: "12pt", fontWeight: 700, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: "10pt", color: "#666", marginTop: "3px" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: "9pt", color: "#666" }}>
          <div style={{ fontWeight: 600 }}>ClinicOS Medical Center</div>
          <div>123 Healthcare Avenue</div>
          <div>Medical District, MD 12345</div>
          <div>Phone: (555) 123-4567</div>
          <div>Email: info@clinicos.com</div>
        </div>
      </div>
    </div>
  );
}

interface PrintFooterProps {
  pageNumber?: number;
  totalPages?: number;
}

export function PrintFooter({ pageNumber, totalPages }: PrintFooterProps) {
  return (
    <div className="print-footer">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>ClinicOS Medical Center</strong> - Providing Quality Healthcare Since 2020
        </div>
        {pageNumber && totalPages && (
          <div>
            Page {pageNumber} of {totalPages}
          </div>
        )}
      </div>
      <div style={{ marginTop: "8px", fontSize: "8pt" }}>
        This document is confidential and intended solely for the use of the individual or entity to whom it is addressed.
      </div>
    </div>
  );
}

interface PatientProfilePrintProps {
  patient: Patient;
}

export function PatientProfilePrint({ patient }: PatientProfilePrintProps) {


  return (
    <div className="print-container" style={{ padding: "20px" }}>
      <PrintHeader 
        title="Patient Medical Record" 
        subtitle={`Patient ID: ${patient.id}`}
      />
      
      {/* Patient Information */}
      <div className="print-section no-break">
        <div className="print-section-title">Patient Information</div>
        <div className="print-grid">
          <div className="print-grid-item">
            <div className="print-label">Full Name</div>
            <div className="print-value">{patient.name}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Patient ID</div>
            <div className="print-value">{patient.id}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Date of Birth</div>
            <div className="print-value">{patient.dob}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Age</div>
            <div className="print-value">{patient.age} years</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Gender</div>
            <div className="print-value">{patient.gender}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Blood Group</div>
            <div className="print-value">{patient.bloodGroup}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Phone</div>
            <div className="print-value">{patient.phone}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Email</div>
            <div className="print-value">{patient.email || "N/A"}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Nationality</div>
            <div className="print-value">{patient.nationality}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Status</div>
            <div className="print-value">
              <span className={`print-badge ${
                patient.status === "Active" ? "print-badge-success" :
                patient.status === "New" ? "print-badge-info" :
                patient.status === "Inactive" ? "print-badge-danger" :
                "print-badge-warning"
              }`}>
                {patient.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="print-section no-break">
        <div className="print-section-title">Contact Information</div>
        <div className="print-grid">
          <div className="print-grid-item">
            <div className="print-label">Emergency Contact</div>
            <div className="print-value">{patient.emergencyName || "N/A"}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Relationship</div>
            <div className="print-value">{patient.emergencyRelation || "N/A"}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Emergency Phone</div>
            <div className="print-value">{patient.emergencyPhone || "N/A"}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Address</div>
            <div className="print-value">{patient.address || "N/A"}</div>
          </div>
        </div>
      </div>

      {/* Medical Information */}
      <div className="print-section no-break">
        <div className="print-section-title">Medical Information</div>
        <div className="print-grid">
          <div className="print-grid-item">
            <div className="print-label">Attending Physician</div>
            <div className="print-value">{patient.doctor}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Risk Level</div>
            <div className="print-value">
              <span className={`print-badge ${
                risk.level === "Low" ? "print-badge-success" :
                risk.level === "Medium" ? "print-badge-warning" :
                risk.level === "High" ? "print-badge-danger" :
                "print-badge-danger"
              }`}>
                {risk.level} (Score: {risk.score})
              </span>
            </div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Insurance Status</div>
            <div className="print-value">
              <span className={`print-badge ${
                patient.insuranceStatus === "Active" ? "print-badge-success" :
                patient.insuranceStatus === "Expiring" ? "print-badge-warning" :
                patient.insuranceStatus === "Expired" ? "print-badge-danger" :
                "print-badge-info"
              }`}>
                {patient.insuranceStatus}
              </span>
            </div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Policy Number</div>
            <div className="print-value">{patient.policyNumber || "N/A"}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Insurance Expiry</div>
            <div className="print-value">{patient.insuranceExpiry ? fmtDate(patient.insuranceExpiry) : "N/A"}</div>
          </div>
        </div>
      </div>

      {/* Allergies */}
      {patient.allergies && (
        <div className="print-section no-break">
          <div className="print-section-title">Allergies</div>
          <div style={{ padding: "10px", background: "#fff3e0", border: "1px solid #ffe0b2", borderRadius: "4px" }}>
            <div style={{ fontSize: "11pt", fontWeight: 600, color: "#ef6c00" }}>
              ⚠️ {patient.allergies}
            </div>
          </div>
        </div>
      )}

      {/* Medical Conditions */}
      {patient.conditions && patient.conditions.length > 0 && (
        <div className="print-section no-break">
          <div className="print-section-title">Medical Conditions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", padding: "8px 0" }}>
            {patient.conditions.map((condition, index) => (
              <span key={index} className="print-badge print-badge-info" style={{ fontSize: "10pt" }}>
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Medications */}
      {patient.medications && patient.medications.length > 0 && (
        <div className="print-section no-break">
          <div className="print-section-title">Active Medications</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {patient.medications.map((med, index) => (
                <tr key={index}>
                  <td colSpan={3}>{med}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Vital Signs */}
      {patient.vitalSigns && patient.vitalSigns.length > 0 && (
        <div className="print-section no-break">
          <div className="print-section-title">Recent Vital Signs</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {patient.vitalSigns.slice(0, 10).map((vital, index) => (
                <tr key={index}>
                  <td>{vital.type}</td>
                  <td>{vital.value}</td>
                  <td>{fmtDate(vital.date)}</td>
                  <td>{vital.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Visit History */}
      {patient.lastVisit && (
        <div className="print-section no-break">
          <div className="print-section-title">Visit Information</div>
          <div className="print-grid">
            <div className="print-grid-item">
              <div className="print-label">Last Visit</div>
              <div className="print-value">{fmtDate(patient.lastVisit)}</div>
            </div>
            <div className="print-grid-item">
              <div className="print-label">Next Appointment</div>
              <div className="print-value">{patient.nextAppointment ? fmtDate(patient.nextAppointment) : "Not scheduled"}</div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Status */}
      <div className="print-section no-break">
        <div className="print-section-title">Verification Status</div>
        <div className="print-grid">
          <div className="print-grid-item">
            <div className="print-label">Phone Verified</div>
            <div className="print-value">
              <span className={`print-badge ${patient.phoneVerified ? "print-badge-success" : "print-badge-warning"}`}>
                {patient.phoneVerified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Insurance Verified</div>
            <div className="print-value">
              <span className={`print-badge ${patient.insuranceVerified ? "print-badge-success" : "print-badge-warning"}`}>
                {patient.insuranceVerified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">ID Verified</div>
            <div className="print-value">
              <span className={`print-badge ${patient.idVerified ? "print-badge-success" : "print-badge-warning"}`}>
                {patient.idVerified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Consent Signed</div>
            <div className="print-value">
              <span className={`print-badge ${patient.consentSigned ? "print-badge-success" : "print-badge-warning"}`}>
                {patient.consentSigned ? "Signed" : "Pending"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="print-signature no-break">
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>
              Attending Physician Signature
            </div>
          </div>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>
              Date
            </div>
          </div>
        </div>
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
    </div>
  );
}

interface PrescriptionPrintProps {
  patient: Patient;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    instructions: string;
    quantity: string;
    refills?: number;
  }>;
  doctorName?: string;
}

export function PrescriptionPrint({ patient, medications, doctorName }: PrescriptionPrintProps) {
  return (
    <div className="print-container" style={{ padding: "20px" }}>
      <div className="print-watermark">PRESCRIPTION</div>
      
      <div className="prescription-header">
        <div className="prescription-logo">
          <i className="ti ti-heart-rate-monitor" /> ClinicOS
        </div>
        <div className="prescription-subtitle">Medical Prescription</div>
      </div>

      <div className="print-section no-break">
        <div className="print-section-title">Patient Information</div>
        <div className="print-grid">
          <div className="print-grid-item">
            <div className="print-label">Patient Name</div>
            <div className="print-value">{patient.name}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Patient ID</div>
            <div className="print-value">{patient.id}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Date Prescribed</div>
            <div className="print-value">{new Date().toLocaleDateString()}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Physician</div>
            <div className="print-value">{doctorName || patient.doctor}</div>
          </div>
        </div>
      </div>

      <div className="prescription-symbol">℞</div>

      <div className="print-section no-break">
        <div className="print-section-title">Prescribed Medications</div>
        {medications.map((med, index) => (
          <div key={index} className="prescription-item no-break">
            <div className="prescription-drug">{index + 1}. {med.name}</div>
            <div className="prescription-dosage">
              Dosage: {med.dosage} | Freq: {med.frequency} | Qty: {med.quantity}{med.refills != null ? ` | Refills: ${med.refills}` : ""}
            </div>
            <div className="prescription-instructions">{med.instructions}</div>
          </div>
        ))}
      </div>

      <div className="print-signature no-break">
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>Physician Signature</div>
          </div>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>Date</div>
          </div>
        </div>
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
    </div>
  );
}

interface MedicalReportPrintProps {
  patient: Patient;
  reportType: "lab" | "radiology" | "pathology" | "general";
  reportData?: {
    title?: string;
    findings?: string;
    impression?: string;
    recommendations?: string;
    orderedBy?: string;
    results?: Array<{ test: string; value: string; unit: string; reference: string; status: "normal" | "abnormal" }>;
  };
}

export function MedicalReportPrint({ patient, reportType, reportData }: MedicalReportPrintProps) {
  const reportTitles = {
    lab: "Laboratory Report",
    radiology: "Radiology Report",
    pathology: "Pathology Report",
    general: "Medical Report"
  };

  return (
    <div className="print-container" style={{ padding: "20px" }}>
      <PrintHeader 
        title={reportData?.title || reportTitles[reportType]}
        subtitle={`Patient ID: ${patient.id}`}
      />

      <div className="medical-report-header no-break">
        <div>
          <div className="medical-report-title">{reportTitles[reportType]}</div>
          <div className="medical-report-date">Report Date: {new Date().toLocaleDateString()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10pt", fontWeight: 600 }}>Confidential</div>
        </div>
      </div>

      <div className="print-section no-break">
        <div className="print-section-title">Patient Information</div>
        <div className="print-grid">
          <div className="print-grid-item">
            <div className="print-label">Patient Name</div>
            <div className="print-value">{patient.name}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Patient ID</div>
            <div className="print-value">{patient.id}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Age/Gender</div>
            <div className="print-value">{patient.age} yrs / {patient.gender}</div>
          </div>
          <div className="print-grid-item">
            <div className="print-label">Ordered By</div>
            <div className="print-value">{reportData?.orderedBy || patient.doctor}</div>
          </div>
        </div>
      </div>

      {reportData?.results && reportData.results.length > 0 && (
        <div className="print-section no-break">
          <div className="print-section-title">Test Results</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportData.results.map((result, index) => (
                <tr key={index}>
                  <td>{result.test}</td>
                  <td style={{ fontWeight: 600 }}>{result.value}</td>
                  <td>{result.unit}</td>
                  <td>{result.reference}</td>
                  <td>
                    <span className={`print-badge ${result.status === "normal" ? "print-badge-success" : "print-badge-danger"}`}>
                      {result.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportData?.findings && (
        <div className="print-section no-break">
          <div className="print-section-title">Findings</div>
          <div style={{ fontSize: "11pt", lineHeight: "1.6", padding: "10px", background: "#fafafa", border: "1px solid #e0e0e0" }}>
            {reportData.findings}
          </div>
        </div>
      )}

      {reportData?.impression && (
        <div className="print-section no-break">
          <div className="print-section-title">Impression</div>
          <div style={{ fontSize: "11pt", lineHeight: "1.6", padding: "10px", background: "#fafafa", border: "1px solid #e0e0e0" }}>
            {reportData.impression}
          </div>
        </div>
      )}

      <div className="print-signature no-break">
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>Physician Signature</div>
          </div>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>Date</div>
          </div>
        </div>
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
    </div>
  );
}

interface BillingStatementPrintProps {
  patient: Patient;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    date: string;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paidAmount?: number;
}

export function BillingStatementPrint({ patient, invoiceNumber, invoiceDate, dueDate, items, subtotal, tax, total, paidAmount }: BillingStatementPrintProps) {
  const balanceDue = paidAmount ? total - paidAmount : total;

  return (
    <div className="print-container" style={{ padding: "20px" }}>
      <div className="billing-statement-header">
        <div className="billing-statement-title">Invoice / Billing Statement</div>
        <div className="billing-statement-number">Invoice #{invoiceNumber}</div>
      </div>

      <div className="print-section no-break">
        <div className="print-section-title">Billing Information</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "48%" }}>
            <div style={{ fontSize: "10pt", fontWeight: 600, marginBottom: "8px" }}>Bill To:</div>
            <div style={{ fontSize: "11pt" }}>{patient.name}</div>
            <div style={{ fontSize: "10pt", color: "#666" }}>{patient.address || "Address not provided"}</div>
            <div style={{ fontSize: "10pt", color: "#666" }}>{patient.phone}</div>
          </div>
          <div style={{ width: "48%" }}>
            <div className="print-grid">
              <div className="print-grid-item">
                <div className="print-label">Invoice Date</div>
                <div className="print-value">{invoiceDate}</div>
              </div>
              <div className="print-grid-item">
                <div className="print-label">Due Date</div>
                <div className="print-value">{dueDate}</div>
              </div>
              <div className="print-grid-item">
                <div className="print-label">Patient ID</div>
                <div className="print-value">{patient.id}</div>
              </div>
              <div className="print-grid-item">
                <div className="print-label">Insurance</div>
                <div className="print-value">{patient.insuranceStatus}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="print-section no-break">
        <div className="print-section-title">Invoice Details</div>
        <table className="print-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.date}</td>
                <td style={{ textAlign: "right" }}>${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="billing-summary no-break">
        <div>
          <div style={{ fontSize: "10pt", color: "#666" }}>Subtotal:</div>
          <div style={{ fontSize: "10pt", color: "#666" }}>Tax:</div>
          {paidAmount != null && <div style={{ fontSize: "10pt", color: "#666" }}>Paid:</div>}
          <div className="billing-total">Balance Due:</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "10pt" }}>${subtotal.toFixed(2)}</div>
          <div style={{ fontSize: "10pt" }}>${tax.toFixed(2)}</div>
          {paidAmount != null && <div style={{ fontSize: "10pt", color: "#2e7d32" }}>-${paidAmount.toFixed(2)}</div>}
          <div className="billing-total">${balanceDue.toFixed(2)}</div>
        </div>
      </div>

      <div className="print-signature no-break">
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }}>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>Billing Department</div>
          </div>
          <div style={{ width: "45%" }}>
            <div className="print-signature-line"></div>
            <div style={{ fontSize: "9pt", color: "#666", marginTop: "5px" }}>Date</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc", fontSize: "9pt" }}>
        <strong>Payment Terms:</strong> Payment is due within 30 days. Late payments may incur additional charges. 
        For questions regarding this invoice, please contact our billing department at (555) 123-4567.
      </div>

      <PrintFooter pageNumber={1} totalPages={1} />
    </div>
  );
}
