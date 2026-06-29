import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = "1em", className = "", style = {} }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        background: "var(--surface3)",
        borderRadius: "var(--radius-sm)",
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonRow() {
  return (
    <tr>
      <td style={{ paddingLeft: 16 }}><Skeleton width={20} height={20} /></td>
      <td><Skeleton width={80} /></td>
      <td><Skeleton width={120} /></td>
      <td><Skeleton width={40} /></td>
      <td><Skeleton width={100} /></td>
      <td><Skeleton width={80} /></td>
      <td><Skeleton width={80} /></td>
      <td><Skeleton width={80} /></td>
      <td><Skeleton width={100} /></td>
      <td><Skeleton width={60} /></td>
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="card card-padded">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Skeleton width={40} height={40} style={{ borderRadius: "50%" }} />
        <div style={{ flex: 1 }}>
          <Skeleton width={150} height={20} style={{ marginBottom: 8 }} />
          <Skeleton width={100} height={16} />
        </div>
      </div>
      <Skeleton width="100%" height={100} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <table className="tbl" style={{ minWidth: 900 }}>
      <thead>
        <tr>
          <th style={{ width: 44, paddingLeft: 16 }}></th>
          <th style={{ width: 100 }}>ID</th>
          <th style={{ width: 180 }}>Patient</th>
          <th style={{ width: 60 }}>Age</th>
          <th style={{ width: 130 }}>Doctor</th>
          <th style={{ width: 130 }}>Status</th>
          <th style={{ width: 100 }}>Insurance</th>
          <th style={{ width: 100 }}>Last Visit</th>
          <th>Alerts</th>
          <th style={{ width: 90 }}>Risk</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </tbody>
    </table>
  );
}
