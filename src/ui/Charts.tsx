import React, { useMemo } from "react";
import type { Patient } from "./types";
import { calcRiskScore } from "./utils";

interface BarItem {
  label: string;
  value: number;
  color: string;
}

interface BarRowProps {
  item: BarItem;
  maxValue: number;
  dark: boolean;
}

function BarRow({ item, maxValue, dark }: BarRowProps) {
  return (
    <div>
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
  );
}

interface DistributionChartProps {
  title: string;
  data: BarItem[];
  dark: boolean;
}

function DistributionChart({ title, data, dark }: DistributionChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="card card-padded" style={{ minHeight: 180 }}>
      <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 700, marginBottom: 16 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.map((item) => (
          <BarRow key={item.label} item={item} maxValue={maxValue} dark={dark} />
        ))}
      </div>
    </div>
  );
}

interface ChartProps {
  patients: Patient[];
  dark: boolean;
}

export function PatientStatusChart({ patients, dark }: ChartProps) {
  const data: BarItem[] = useMemo(() => [
    { label: "New",            value: patients.filter(p => p.status === "New").length,              color: "#7c3aed" },
    { label: "Active",         value: patients.filter(p => p.status === "Active").length,           color: "#2563eb" },
    { label: "Follow-Up Due",  value: patients.filter(p => p.status === "Follow-Up Due").length,   color: "#d97706" },
    { label: "Under Treatment",value: patients.filter(p => p.status === "Under Treatment").length,  color: "#059669" },
    { label: "Inactive",       value: patients.filter(p => p.status === "Inactive").length,         color: "#64748b" },
  ], [patients]);
  return <DistributionChart title="Patient Status Distribution" data={data} dark={dark} />;
}

export function RiskDistributionChart({ patients, dark }: ChartProps) {
  const data: BarItem[] = useMemo(() => {
    const riskLevels = patients.map((p) => calcRiskScore(p).level);
    return [
      { label: "Low", value: riskLevels.filter((r) => r === "Low").length, color: "#059669" },
      { label: "Medium", value: riskLevels.filter((r) => r === "Medium").length, color: "#d97706" },
      { label: "High", value: riskLevels.filter((r) => r === "High").length, color: "#dc2626" },
      { label: "Critical", value: riskLevels.filter((r) => r === "Critical").length, color: "#7f1d1d" },
    ];
  }, [patients]);
  return <DistributionChart title="Risk Distribution" data={data} dark={dark} />;
}

export function GenderDistributionChart({ patients, dark }: ChartProps) {
  const data: BarItem[] = useMemo(() => [
    { label: "Male", value: patients.filter((p) => p.gender === "Male").length, color: "#2563eb" },
    { label: "Female", value: patients.filter((p) => p.gender === "Female").length, color: "#ec4899" },
    { label: "Other", value: patients.filter((p) => p.gender === "Other").length, color: "#8b5cf6" },
  ], [patients]);
  return <DistributionChart title="Gender Distribution" data={data} dark={dark} />;
}

export function InsuranceStatusChart({ patients, dark }: ChartProps) {
  const data: BarItem[] = useMemo(() => [
    { label: "Active", value: patients.filter((p) => p.insuranceStatus === "Active").length, color: "#059669" },
    { label: "Expiring", value: patients.filter((p) => p.insuranceStatus === "Expiring").length, color: "#d97706" },
    { label: "Expired", value: patients.filter((p) => p.insuranceStatus === "Expired").length, color: "#dc2626" },
    { label: "None", value: patients.filter((p) => p.insuranceStatus === "None").length, color: "#64748b" },
  ], [patients]);
  return <DistributionChart title="Insurance Status" data={data} dark={dark} />;
}

export function AgeDistributionChart({ patients, dark }: ChartProps) {
  const data: BarItem[] = useMemo(() => {
    const ageGroups = [
      { label: "0-18", min: 0, max: 18, color: "#8b5cf6" },
      { label: "19-30", min: 19, max: 30, color: "#2563eb" },
      { label: "31-45", min: 31, max: 45, color: "#059669" },
      { label: "46-60", min: 46, max: 60, color: "#d97706" },
      { label: "60+", min: 60, max: Infinity, color: "#dc2626" }, // fix: was min:61, skipped age 60
    ];
    return ageGroups.map(({ label, min, max, color }) => ({
      label,
      color,
      value: patients.filter((p) => p.age >= min && p.age <= max).length,
    }));
  }, [patients]);
  return <DistributionChart title="Age Distribution" data={data} dark={dark} />;
}
