import React from "react";

interface GlobalStylesProps {
  dark: boolean;
}

export default function GlobalStyles({ dark }: GlobalStylesProps) {
  const bg       = dark ? "#0c0f1a" : "#f0f4f8";
  const surface  = dark ? "#131726" : "#ffffff";
  const surface2 = dark ? "#1c2136" : "#f8fafc";
  const surface3 = dark ? "#222840" : "#eef2f7";
  const border   = dark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)";
  const text      = dark ? "#e2e8f4" : "#0f172a";
  const muted     = dark ? "#7a8499" : "#64748b";
  const accent    = "#2563eb";
  const accentSoft = dark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)";

  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

      .crm-root {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: ${bg};
        color: ${text};
        min-height: 100vh;

        --bg: ${bg};
        --surface: ${surface};
        --surface2: ${surface2};
        --surface3: ${surface3};
        --border: ${border};
        --text: ${text};
        --muted: ${muted};
        --accent: ${accent};
        --accent-soft: ${accentSoft};
        --accent-hover: #1d4ed8;

        --red: #dc2626;
        --red-bg: #fef2f2;
        --red-border: #fecaca;
        --amber: #d97706;
        --amber-bg: #fffbeb;
        --amber-border: #fde68a;
        --green: #16a34a;
        --green-bg: #f0fdf4;
        --green-border: #bbf7d0;
        --purple: #7c3aed;
        --purple-bg: #f5f3ff;
        --purple-border: #ddd6fe;
        --blue: #2563eb;
        --blue-bg: #eff6ff;
        --blue-border: #bfdbfe;

        --radius-sm: 6px;
        --radius: 10px;
        --radius-lg: 14px;
        --radius-xl: 18px;
        --radius-full: 9999px;

        --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
        --shadow:    0 2px 8px rgba(0,0,0,0.08);
        --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
        --shadow-xl: 0 20px 60px rgba(0,0,0,0.2);

        --font-2xs: 10px;
        --font-xs:  11px;
        --font-sm:  12px;
        --font-base: 13px;
        --font-md:  14px;
        --font-lg:  16px;
        --font-xl:  20px;
        --font-2xl: 24px;

        transition: background 0.2s, color 0.2s;
      }

      .crm-root *, input, select, textarea, button {
        font-family: 'Inter', -apple-system, sans-serif;
      }

      /* ── Scrollbar ── */
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${muted}30; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${muted}50; }

      /* ── Buttons ── */
      .btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 14px; border-radius: var(--radius); font-size: var(--font-sm);
        font-weight: 500; cursor: pointer; border: none; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap; line-height: 1.4; position: relative; overflow: hidden;
        min-height: 44px; min-width: 44px; /* Touch-friendly minimum size */
      }
      .btn::before {
        content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
        opacity: 0; transition: opacity 0.2s;
      }
      .btn:hover::before { opacity: 1; }
      .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      .btn:active { transform: scale(0.98); }
      .btn-primary {
        background: linear-gradient(135deg, var(--accent) 0%, #1d4ed8 100%); color: #fff;
        box-shadow: 0 2px 8px rgba(37,99,235,0.3);
      }
      .btn-primary:hover { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); box-shadow: 0 4px 12px rgba(37,99,235,0.4); transform: translateY(-1px); }
      .btn-primary:active { transform: translateY(0) scale(0.98); }
      .btn-ghost {
        background: transparent; color: var(--muted);
        border: 1px solid var(--border);
      }
      .btn-ghost:hover { background: var(--surface2); color: var(--text); transform: translateY(-1px); }
      .btn-ghost:active { transform: scale(0.98); }
      .btn-danger { background: linear-gradient(135deg, var(--red) 0%, #b91c1c 100%); color: #fff; }
      .btn-danger:hover { background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%); transform: translateY(-1px); }
      .btn-danger:active { transform: scale(0.98); }
      .btn-success { background: linear-gradient(135deg, var(--green) 0%, #15803d 100%); color: #fff; }
      .btn-success:hover { background: linear-gradient(135deg, #15803d 0%, #166534 100%); transform: translateY(-1px); }
      .btn-success:active { transform: scale(0.98); }
      .btn-icon {
        padding: 7px; border-radius: var(--radius);
        background: transparent; border: 1px solid var(--border);
        color: var(--muted); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 44px; min-height: 44px; /* Touch-friendly */
      }
      .btn-icon:hover { background: var(--surface2); color: var(--text); transform: scale(1.05); }
      .btn-icon:active { transform: scale(0.95); }

      /* ── Inputs ── */
      input[type=text], input[type=search], input[type=email],
      input[type=tel], input[type=number], input[type=date],
      input[type=password], select, textarea {
        background: var(--surface); border: 1px solid var(--border);
        color: var(--text); border-radius: var(--radius);
        padding: 10px 12px; font-size: var(--font-base);
        outline: none; transition: all 0.15s ease;
        box-shadow: var(--shadow-sm);
        min-height: 44px; /* Touch-friendly minimum height */
      }
      input:focus, select:focus, textarea:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 3px var(--accent-soft), var(--shadow-sm);
      }
      input::placeholder { color: var(--muted); opacity: 0.7; }
      
      /* Mobile-specific input enhancements */
      @media (max-width: 768px) {
        input[type=text], input[type=search], input[type=email],
        input[type=tel], input[type=number], input[type=date],
        input[type=password], select, textarea {
          padding: 12px 14px;
          font-size: 16px; /* Prevents iOS zoom on focus */
          min-height: 48px;
        }
        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
        }
      }

      /* ── Form label ── */
      .field-label {
        font-size: var(--font-xs); font-weight: 600; color: var(--muted);
        text-transform: uppercase; letter-spacing: 0.06em; display: block;
        margin-bottom: 5px;
      }
      .field-group { display: flex; flex-direction: column; gap: 0; }

      /* ── Cards ── */
      .card {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
        overflow: hidden; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }
      .card-padded { padding: 16px; }
      .glass {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .glass-dark {
        background: rgba(19, 23, 38, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .panel-head {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 16px; border-bottom: 1px solid var(--border);
      }
      .panel-title {
        font-size: var(--font-md); font-weight: 700; color: var(--text);
      }
      .panel-subtitle {
        font-size: var(--font-xs); color: var(--muted); margin-top: 1px;
      }
      .panel-icon {
        width: 32px; height: 32px; border-radius: var(--radius);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
      }

      /* ── Badges / Chips ── */
      .badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 9px; border-radius: var(--radius-full);
        font-size: var(--font-xs); font-weight: 600; white-space: nowrap;
      }
      .badge-dot {
        width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
      }
      .tag {
        display: inline-flex; align-items: center; gap: 3px;
        padding: 2px 7px; border-radius: var(--radius-sm);
        font-size: var(--font-xs); font-weight: 500;
      }

      /* ── Avatar ── */
      .avatar {
        width: 34px; height: 34px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 700; flex-shrink: 0;
      }
      .avatar-lg {
        width: 48px; height: 48px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px; font-weight: 800; flex-shrink: 0;
      }
      .avatar-xl {
        width: 56px; height: 56px; border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        font-size: 20px; font-weight: 800; flex-shrink: 0;
      }

      /* ── Layout helpers ── */
      .row { display: flex; align-items: center; }
      .col { display: flex; flex-direction: column; }
      .between { justify-content: space-between; }
      .wrap { flex-wrap: wrap; }
      .gap-2  { gap: 2px; }  .gap-4  { gap: 4px; }
      .gap-6  { gap: 6px; }  .gap-8  { gap: 8px; }
      .gap-10 { gap: 10px; } .gap-12 { gap: 12px; }
      .gap-16 { gap: 16px; } .gap-20 { gap: 20px; }

      /* ── Section label ── */
      .section-label {
        font-size: var(--font-2xs); font-weight: 700; letter-spacing: 0.08em;
        text-transform: uppercase; color: var(--muted); margin-bottom: 8px;
      }

      /* ── Table ── */
      .tbl { width: 100%; border-collapse: collapse; }
      .tbl th {
        padding: 8px 12px; font-size: var(--font-xs); font-weight: 700;
        color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border); text-align: left;
        white-space: nowrap; background: var(--surface2);
      }
      .tbl td {
        padding: 10px 12px; font-size: var(--font-sm); border-bottom: 1px solid var(--border);
        vertical-align: middle;
      }
      .tbl tr:last-child td { border-bottom: none; }
      .tbl-row { cursor: pointer; transition: background 0.1s; }
      .tbl-row:hover { background: var(--surface2); }
      .tbl-row.selected { background: var(--accent-soft); }

      /* Mobile-specific table enhancements */
      @media (max-width: 768px) {
        .tbl-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tbl-container::-webkit-scrollbar {
          display: none;
        }
        .tbl {
          min-width: 600px;
        }
        .tbl th, .tbl td {
          padding: 12px 10px;
          white-space: nowrap;
        }
        .tbl-row:active {
          background: var(--surface3);
        }
      }

      /* ── Progress bar ── */
      .progress-bar {
        height: 4px; border-radius: 4px; background: var(--border); overflow: hidden;
      }
      .progress-fill {
        height: 100%; border-radius: 4px; transition: width 0.3s ease;
      }

      /* ── Divider ── */
      .divider { border: none; border-top: 1px solid var(--border); }

      /* ── Animations ── */
      @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      @keyframes bounce  { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes shake   { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      @keyframes glow    { 0%,100% { box-shadow: 0 0 5px var(--accent); } 50% { box-shadow: 0 0 20px var(--accent), 0 0 30px var(--accent); } }
      @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

      .fade-in   { animation: fadeIn  0.2s ease; }
      .slide-up  { animation: slideUp 0.25s ease; }
      .slide-down { animation: slideDown 0.25s ease; }
      .slide-in  { animation: slideIn 0.25s ease; }
      .scale-in  { animation: scaleIn 0.2s ease; }
      .pulse     { animation: pulse 2s ease-in-out infinite; }
      .bounce    { animation: bounce 1s ease-in-out infinite; }
      .shake     { animation: shake 0.5s ease-in-out; }
      .glow      { animation: glow 2s ease-in-out infinite; }
      .spin      { animation: spin 1s linear infinite; }
      .float     { animation: float 3s ease-in-out infinite; }

      /* ── Modal backdrop ── */
      .modal-backdrop {
        position: fixed; inset: 0; z-index: 1000;
        background: rgba(0,0,0,0.55);
        display: flex; align-items: center; justify-content: center;
        padding: 16px; animation: fadeIn 0.15s ease;
      }
      .modal {
        background: var(--surface); border: 1px solid var(--border);
        border-radius: var(--radius-xl); box-shadow: var(--shadow-xl);
        max-height: calc(100vh - 32px); overflow-y: auto;
        animation: scaleIn 0.2s ease;
      }

      /* Mobile-specific modal enhancements */
      @media (max-width: 768px) {
        .modal-backdrop {
          padding: 12px;
          align-items: flex-end; /* Bottom sheet style on mobile */
        }
        .modal {
          width: 100%;
          max-height: 85vh;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          animation: slideUp 0.3s ease;
        }
        /* Add safe area padding for notched devices */
        .modal-backdrop::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: env(safe-area-inset-bottom);
          background: var(--surface);
        }
        /* Make form rows stack vertically on mobile */
        .form-row {
          grid-template-columns: 1fr !important;
        }
        /* Make toolbar filters stack vertically on mobile */
        .toolbar-mobile {
          flex-direction: column !important;
          align-items: stretch !important;
        }
        .toolbar-mobile > div {
          width: 100% !important;
          flex: 1 1 auto !important;
          min-width: auto !important;
        }
        .toolbar-mobile select {
          width: 100% !important;
          flex: 1 1 auto !important;
        }
        /* Make stat cards stack on mobile */
        .stat-card {
          grid-column: span 2 !important;
        }
        /* Make workflow indicators stack on mobile */
        .card-padded > div[style*="gridTemplateColumns"] {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        /* Improve touch targets on mobile */
        .btn {
          min-height: 48px;
          min-width: 48px;
          padding: 12px 16px;
          font-size: 14px;
        }
        .btn-icon {
          min-width: 48px;
          min-height: 48px;
          padding: 12px;
        }
        /* Make cards full width on mobile */
        .card {
          margin: 0 0 12px 0;
        }
        /* Improve spacing on mobile */
        .crm-root {
          padding-bottom: env(safe-area-inset-bottom);
        }
        /* Make dropdowns full width on mobile */
        .mobile-only[style*="position: absolute"] {
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
        }
      }

      /* ── Tabs ── */
      .tab-bar {
        display: flex; gap: 2px; overflow-x: auto; scrollbar-width: none;
        padding: 4px; background: var(--surface2); border-radius: var(--radius-lg);
      }
      .tab-bar::-webkit-scrollbar { display: none; }
      .tab-btn {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 14px; border-radius: var(--radius); font-size: var(--font-sm);
        font-weight: 500; cursor: pointer; border: none; transition: all 0.15s;
        background: transparent; color: var(--muted); white-space: nowrap;
      }
      .tab-btn:hover { background: var(--surface); color: var(--text); }
      .tab-btn.active {
        background: var(--surface); color: var(--accent);
        font-weight: 600; box-shadow: var(--shadow-sm);
      }

      /* ── Empty state ── */
      .empty-state {
        padding: 40px 20px; text-align: center; color: var(--muted);
      }
      .empty-state-icon {
        font-size: 32px; margin-bottom: 12px; opacity: 0.4;
        display: block;
      }
      .empty-state-text { font-size: var(--font-md); margin-bottom: 6px; }
      .empty-state-sub  { font-size: var(--font-sm); opacity: 0.7; }

      /* ── Stat card ── */
      .stat-card {
        padding: 14px 16px; border-radius: var(--radius-lg);
        border: 1px solid var(--border); background: var(--surface);
        box-shadow: var(--shadow-sm);
      }
      .stat-value { font-size: 24px; font-weight: 800; line-height: 1.1; }
      .stat-label { font-size: var(--font-xs); color: var(--muted); margin-top: 4px; font-weight: 500; }

      /* ── Alert banner ── */
      .alert-banner {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 16px; border-radius: var(--radius);
        border: 1px solid; font-size: var(--font-sm);
      }
      .alert-critical { background: var(--red-bg); border-color: var(--red-border); color: #991b1b; }
      .alert-warning  { background: var(--amber-bg); border-color: var(--amber-border); color: #92400e; }
      .alert-info     { background: var(--blue-bg); border-color: var(--blue-border); color: #1e40af; }
      .alert-success  { background: var(--green-bg); border-color: var(--green-border); color: #14532d; }

      /* ── Timeline ── */
      .timeline-line {
        position: absolute; left: 15px; top: 0; bottom: 0;
        width: 2px; background: var(--border);
      }
      .timeline-dot {
        width: 30px; height: 30px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; position: relative; z-index: 1;
      }

      /* ── Mono ── */
      .mono { font-family: 'JetBrains Mono', monospace; }

      /* ── Responsive ── */
      @media (max-width: 480px) {
        .xs-hide { display: none !important; }
        .xs-only { display: block !important; }
        .crm-root { --font-base: 14px; --font-sm: 13px; --font-xs: 12px; }
      }
      @media (min-width: 481px) and (max-width: 768px) {
        .sm-hide { display: none !important; }
        .sm-only { display: block !important; }
      }
      @media (max-width: 768px) {
        .desktop-only { display: none !important; }
        .mobile-only { display: flex !important; }
        .mobile-only-block { display: block !important; }
        .crm-root { --font-base: 14px; --font-sm: 13px; --font-xs: 12px; }
      }
      @media (min-width: 769px) and (max-width: 1024px) {
        .tablet-only { display: block !important; }
        .lg-hide { display: none !important; }
      }
      @media (min-width: 769px) {
        .mobile-only { display: none !important; }
        .mobile-only-block { display: none !important; }
        .desktop-only { display: flex !important; }
      }
      @media (min-width: 1025px) {
        .lg-only { display: block !important; }
        .lg-hide { display: none !important; }
      }
      @media (max-width: 1024px) {
        .lg-hide { display: none !important; }
      }

      /* ── Tooltip ── */
      [data-tip] { position: relative; cursor: help; }
      [data-tip]::after {
        content: attr(data-tip);
        position: absolute; bottom: calc(100% + 6px); left: 50%;
        transform: translateX(-50%);
        background: #1e293b; color: #f1f5f9;
        font-size: var(--font-xs); font-weight: 500;
        padding: 4px 8px; border-radius: 6px;
        white-space: nowrap; pointer-events: none;
        opacity: 0; transition: opacity 0.15s;
        z-index: 9999;
      }
      [data-tip]:hover::after { opacity: 1; }

      /* ── Sidebar nav ── */
      .sidebar-nav-item {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 12px; border-radius: var(--radius); font-size: var(--font-sm);
        font-weight: 500; cursor: pointer; transition: all 0.15s;
        color: var(--muted); border: none; background: transparent; width: 100%;
        text-align: left;
      }
      .sidebar-nav-item:hover { background: var(--surface2); color: var(--text); }
      .sidebar-nav-item.active {
        background: var(--accent-soft); color: var(--accent); font-weight: 600;
      }
      .sidebar-nav-item .nav-icon {
        font-size: 16px; width: 20px; text-align: center; flex-shrink: 0;
      }

      /* ── Print Styles ── */
      @media print {
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          background: white !important;
          color: black !important;
          font-size: 11pt;
          line-height: 1.4;
        }
        
        .crm-root {
          background: white !important;
          color: black !important;
        }
        
        /* Hide UI elements when printing */
        .modal-backdrop,
        .modal,
        .toolbar-mobile,
        .tab-bar,
        .btn,
        .btn-icon,
        button,
        .desktop-only,
        .mobile-only,
        .xs-hide,
        .xs-only,
        .sm-hide,
        .sm-only,
        .lg-hide,
        .lg-only,
        .tablet-only,
        .sidebar-nav-item,
        .quality-bar,
        .stats-bar,
        .search-input,
        .filter-select,
        .pagination,
        .bulk-actions,
        .toast-container,
        .tooltip,
        [data-tip] {
          display: none !important;
        }
        
        /* Print-specific layout */
        .print-header {
          display: block !important;
          page-break-after: avoid;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #000;
        }
        
        .print-footer {
          display: block !important;
          page-break-before: avoid;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #ccc;
          font-size: 9pt;
          color: #666;
        }
        
        .print-section {
          page-break-inside: avoid;
          margin-bottom: 15px;
        }
        
        .print-section-title {
          font-size: 12pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ccc;
          color: #000;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        .print-table th,
        .print-table td {
          border: 1px solid #ccc;
          padding: 8px 10px;
          text-align: left;
          font-size: 10pt;
        }
        
        .print-table th {
          background: #f5f5f5;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 9pt;
        }
        
        .print-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .print-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .print-grid-item {
          padding: 8px;
          border: 1px solid #e0e0e0;
          background: #fafafa;
        }
        
        .print-label {
          font-size: 9pt;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        
        .print-value {
          font-size: 11pt;
          font-weight: 500;
          color: #000;
        }
        
        .print-badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 9pt;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .print-badge-success {
          background: #e8f5e9;
          color: #2e7d32;
          border: 1px solid #c8e6c9;
        }
        
        .print-badge-warning {
          background: #fff3e0;
          color: #ef6c00;
          border: 1px solid #ffe0b2;
        }
        
        .print-badge-danger {
          background: #ffebee;
          color: #c62828;
          border: 1px solid #ffcdd2;
        }
        
        .print-badge-info {
          background: #e3f2fd;
          color: #1565c0;
          border: 1px solid #bbdefb;
        }
        
        .print-signature {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #000;
        }
        
        .print-signature-line {
          width: 200px;
          border-bottom: 1px solid #000;
          margin-bottom: 5px;
        }
        
        .print-watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72pt;
          color: rgba(0, 0, 0, 0.05);
          font-weight: 700;
          text-transform: uppercase;
          pointer-events: none;
          z-index: 0;
        }
        
        /* Prescription-specific styles */
        .prescription-header {
          text-align: center;
          margin-bottom: 20px;
        }
        
        .prescription-logo {
          font-size: 24pt;
          font-weight: 800;
          color: #000;
          margin-bottom: 5px;
        }
        
        .prescription-subtitle {
          font-size: 10pt;
          color: #666;
        }
        
        .prescription-symbol {
          font-size: 48pt;
          font-weight: 700;
          color: #000;
          text-align: center;
          margin: 20px 0;
        }
        
        .prescription-item {
          margin-bottom: 15px;
          padding: 10px;
          border: 1px solid #e0e0e0;
          background: #fafafa;
        }
        
        .prescription-drug {
          font-size: 11pt;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .prescription-dosage {
          font-size: 10pt;
          color: #666;
          margin-bottom: 3px;
        }
        
        .prescription-instructions {
          font-size: 10pt;
          font-style: italic;
          color: #333;
        }
        
        /* Medical report styles */
        .medical-report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #000;
        }
        
        .medical-report-title {
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .medical-report-date {
          font-size: 10pt;
          color: #666;
        }
        
        .vital-signs-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .vital-sign-item {
          text-align: center;
          padding: 10px;
          border: 1px solid #e0e0e0;
          background: #fafafa;
        }
        
        .vital-sign-value {
          font-size: 14pt;
          font-weight: 700;
          color: #000;
        }
        
        .vital-sign-label {
          font-size: 9pt;
          color: #666;
          text-transform: uppercase;
        }
        
        /* Billing statement styles */
        .billing-statement-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #000;
        }
        
        .billing-statement-title {
          font-size: 16pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .billing-statement-number {
          font-size: 11pt;
          color: #666;
          margin-top: 5px;
        }
        
        .billing-summary {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 2px solid #000;
        }
        
        .billing-total {
          font-size: 14pt;
          font-weight: 700;
        }
        
        /* Page breaks */
        .page-break {
          page-break-before: always;
        }
        
        .no-break {
          page-break-inside: avoid;
        }
      }
    `}</style>
  );
}
