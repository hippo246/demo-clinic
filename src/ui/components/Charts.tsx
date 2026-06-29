import React from "react";
import type { Patient } from "../types";
import { getPatientStats, calcRiskScore } from "../utils";

interface ChartProps {
  patients: Patient[];
  dark: boolean;
}

export function PatientStatusChart({ patients, dark }: ChartProps) {
  const stats = getPatientStats(patients);
  const statusData = [
    { label: "New", value: stats.newPatients, color: "#7c3aed" },
    { label: "Active", value: stats.active, color: "#2563eb" },
    { label: "Follow-Up Due", value: stats.followUpDue, color: "#d97706" },
    { label: "Under Treatment", value: stats.underTreatment, color: "#059669" },
    { label: "Inactive", value: stats.inactive, color: "#64748b" },
  ];

  const maxValue = Math.max(...statusData.map((d) => d.value), 1);

  return (
    <div className="card card-padded" style={{ minHeight: 180 }}>
      <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 700, marginBottom: 16 }}>Patient Status Distribution</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {statusData.map((item) => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{item.value}</span>
            </div>
            <div style={{
              height: 8, background: dark ? "#1e293b" : "#e2e8f0",
              borderRadius: "var(--radius-sm)", overflow: "hidden",
            }}>
              <div
                style={{
                  height: "100%", width: `${(item.value / maxValue) * 100}%`,
                  background: item.color, borderRadius: "var(--radius-sm)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RiskDistributionChart({ patients, dark }: ChartProps) {
  const riskLevels = patients.map((p) => calcRiskScore(p).level);
  const riskData = [
    { label: "Low", value: riskLevels.filter((r) => r === "Low").length, color: "#059669" },
    { label: "Medium", value: riskLevels.filter((r) => r === "Medium").length, color: "#d97706" },
    { label: "High", value: riskLevels.filter((r) => r === "High").length, color: "#dc2626" },
    { label: "Critical", value: riskLevels.filter((r) => r === "Critical").length, color: "#7f1d1d" },
  ];

  const maxValue = Math.max(...riskData.map((d) => d.value), 1);

  return (
    <div className="card card-padded" style={{ minHeight: 180 }}>
      <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 700, marginBottom: 16 }}>Risk Distribution</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {riskData.map((item) => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{item.value}</span>
            </div>
            <div style={{
              height: 8, background: dark ? "#1e293b" : "#e2e8f0",
              borderRadius: "var(--radius-sm)", overflow: "hidden",
            }}>
              <div
                style={{
                  height: "100%", width: `${(item.value / maxValue) * 100}%`,
                  background: item.color, borderRadius: "var(--radius-sm)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GenderDistributionChart({ patients, dark }: ChartProps) {
  const genderData = [
    { label: "Male", value: patients.filter((p) => p.gender === "Male").length, color: "#2563eb" },
    { label: "Female", value: patients.filter((p) => p.gender === "Female").length, color: "#ec4899" },
    { label: "Other", value: patients.filter((p) => p.gender === "Other").length, color: "#8b5cf6" },
  ];

  const maxValue = Math.max(...genderData.map((d) => d.value), 1);

  return (
    <div className="card card-padded" style={{ minHeight: 180 }}>
      <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 700, marginBottom: 16 }}>Gender Distribution</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {genderData.map((item) => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{item.value}</span>
            </div>
            <div style={{
              height: 8, background: dark ? "#1e293b" : "#e2e8f0",
              borderRadius: "var(--radius-sm)", overflow: "hidden",
            }}>
              <div
                style={{
                  height: "100%", width: `${(item.value / maxValue) * 100}%`,
                  background: item.color, borderRadius: "var(--radius-sm)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsuranceStatusChart({ patients, dark }: ChartProps) {
  const insuranceData = [
    { label: "Active", value: patients.filter((p) => p.insuranceStatus === "Active").length, color: "#059669" },
    { label: "Expiring", value: patients.filter((p) => p.insuranceStatus === "Expiring").length, color: "#d97706" },
    { label: "Expired", value: patients.filter((p) => p.insuranceStatus === "Expired").length, color: "#dc2626" },
    { label: "None", value: patients.filter((p) => p.insuranceStatus === "None").length, color: "#64748b" },
  ];

  const maxValue = Math.max(...insuranceData.map((d) => d.value), 1);

  return (
    <div className="card card-padded" style={{ minHeight: 180 }}>
      <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 700, marginBottom: 16 }}>Insurance Status</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {insuranceData.map((item) => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{item.value}</span>
            </div>
            <div style={{
              height: 8, background: dark ? "#1e293b" : "#e2e8f0",
              borderRadius: "var(--radius-sm)", overflow: "hidden",
            }}>
              <div
                style={{
                  height: "100%", width: `${(item.value / maxValue) * 100}%`,
                  background: item.color, borderRadius: "var(--radius-sm)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgeDistributionChart({ patients, dark }: ChartProps) {
  const ageGroups = [
    { label: "0-18", min: 0, max: 18, color: "#8b5cf6" },
    { label: "19-30", min: 19, max: 30, color: "#2563eb" },
    { label: "31-45", min: 31, max: 45, color: "#059669" },
    { label: "46-60", min: 46, max: 60, color: "#d97706" },
    { label: "60+", min: 61, max: 200, color: "#dc2626" },
  ];

  const ageData = ageGroups.map((group) => ({
    ...group,
    value: patients.filter((p) => p.age >= group.min && p.age <= group.max).length,
  }));

  const maxValue = Math.max(...ageData.map((d) => d.value), 1);

  return (
    <div className="card card-padded" style={{ minHeight: 180 }}>
      <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 700, marginBottom: 16 }}>Age Distribution</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {ageData.map((item) => (
          <div key={item.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontSize: "var(--font-xs)", color: "var(--muted)" }}>{item.value}</span>
            </div>
            <div style={{
              height: 8, background: dark ? "#1e293b" : "#e2e8f0",
              borderRadius: "var(--radius-sm)", overflow: "hidden",
            }}>
              <div
                style={{
                  height: "100%", width: `${(item.value / maxValue) * 100}%`,
                  background: item.color, borderRadius: "var(--radius-sm)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
