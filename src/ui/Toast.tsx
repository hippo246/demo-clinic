import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  useMemo,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType     = "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-left" | "top-center" | "top-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export interface ToastOptions {
  type?:     ToastType;
  duration?: number;
  /** Optional CTA rendered as a small button inside the toast. */
  action?: {
    label:   string;
    onClick: () => void;
  };
}

export interface ToastItem extends Required<Omit<ToastOptions, "action">> {
  id:      string;
  message: string;
  action?: ToastOptions["action"];
}

export interface ToastUpdate {
  message?: string;
  type?:    ToastType;
  duration?: number;
  action?:  ToastOptions["action"];
}

interface ToastContextValue {
  /**
   * Show a toast. Returns the id so you can update or dismiss it later.
   * @example toast("Saved!", { type: "success", action: { label: "Undo", onClick: handleUndo } })
   */
  toast:       (message: string, options?: ToastOptions) => string;
  /** Mutate a live toast (e.g. "Saving…" → "Saved ✓"). */
  updateToast: (id: string, update: ToastUpdate) => void;
  /** Programmatically dismiss one toast. */
  removeToast: (id: string) => void;
  /** Dismiss every visible toast. */
  clearToasts: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const ToastContext = createContext<ToastContextValue>({
  toast:       () => "",
  updateToast: () => {},
  removeToast: () => {},
  clearToasts: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider props ───────────────────────────────────────────────────────────

export interface ToastProviderProps {
  children:    React.ReactNode;
  position?:   ToastPosition;
  maxToasts?:  number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DURATION = 3000;
const DEFAULT_MAX      = 5;

const ICONS: Record<ToastType, string> = {
  success: "ti-circle-check",
  error:   "ti-alert-circle",
  warning: "ti-alert-triangle",
  info:    "ti-info-circle",
};

const COLORS: Record<ToastType, {
  bg: string; border: string; icon: string; progress: string;
}> = {
  success: { bg: "var(--green-bg)",  border: "var(--green-border)",  icon: "var(--green)",  progress: "var(--green)"  },
  error:   { bg: "var(--red-bg)",    border: "var(--red-border)",    icon: "var(--red)",    progress: "var(--red)"    },
  warning: { bg: "var(--amber-bg)",  border: "var(--amber-border)",  icon: "var(--amber)",  progress: "var(--amber)"  },
  info:    { bg: "var(--blue-bg)",   border: "var(--blue-border)",   icon: "var(--blue)",   progress: "var(--blue)"   },
};

// Positioning: [vertical edge, horizontal placement, flex-align]
const POSITION_STYLES: Record<ToastPosition, React.CSSProperties> = {
  "top-left":      { top: 24, left: 24,  alignItems: "flex-start" },
  "top-center":    { top: 24, left: "50%", transform: "translateX(-50%)", alignItems: "center" },
  "top-right":     { top: 24, right: 24, alignItems: "flex-end" },
  "bottom-left":   { bottom: 24, left: 24,  alignItems: "flex-start" },
  "bottom-center": { bottom: 24, left: "50%", transform: "translateX(-50%)", alignItems: "center" },
  "bottom-right":  { bottom: 24, right: 24, alignItems: "flex-end" },
};

const isTop = (p: ToastPosition) => p.startsWith("top");

// ─── Style injection (once) ───────────────────────────────────────────────────

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;
  const el = document.createElement("style");
  el.dataset.toastStyles = "1";
  el.textContent = TOAST_CSS;
  document.head.appendChild(el);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({
  children,
  position  = "bottom-right",
  maxToasts = DEFAULT_MAX,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(injectStyles, []);

  // Track which ids are currently exiting so we don't double-trigger
  const exitingIds = useRef<Set<string>>(new Set());

  const removeToast = useCallback((id: string) => {
    exitingIds.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
    exitingIds.current.clear();
  }, []);

  const updateToast = useCallback((id: string, update: ToastUpdate) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...update } : t))
    );
  }, []);

  const toast = useCallback(
    (message: string, options: ToastOptions = {}): string => {
      const { type = "success", duration = DEFAULT_DURATION, action } = options;
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => {
        // Deduplicate: if an identical message+type is already visible, bump it
        const dup = prev.find((t) => t.message === message && t.type === type);
        if (dup) {
          // Signal the existing card to restart its timer via a new duration ref
          return prev.map((t) =>
            t.id === dup.id ? { ...t, duration, action } : t
          );
        }
        const next = [...prev, { id, message, type, duration, action }];
        return next.length > maxToasts ? next.slice(next.length - maxToasts) : next;
      });

      return id;
    },
    [maxToasts]
  );

  const ctx = useMemo(
    () => ({ toast, updateToast, removeToast, clearToasts }),
    [toast, updateToast, removeToast, clearToasts]
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={position}
        onDismiss={removeToast}
      />
    </ToastContext.Provider>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  position,
  onDismiss,
}: {
  toasts:    ToastItem[];
  position:  ToastPosition;
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const posStyle = POSITION_STYLES[position];
  const stackDir = isTop(position) ? "column" : "column-reverse";

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        zIndex: 9999,
        display: "flex",
        flexDirection: stackDir,
        gap: 8,
        pointerEvents: "none",
        ...posStyle,
      }}
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ToastCard({
  item,
  onDismiss,
}: {
  item:      ToastItem;
  onDismiss: (id: string) => void;
}) {
  const { id, message, type, duration, action } = item;
  const c = COLORS[type];

  const [exiting,  setExiting]  = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const remaining  = useRef(duration);
  const startedAt  = useRef(Date.now());
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track the item ref so the timer callback always sees the latest dismiss fn
  const dismissRef = useRef<() => void>(() => {});

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
  }, [exiting]);

  dismissRef.current = dismiss;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    startedAt.current = Date.now();
    timerRef.current  = setTimeout(() => dismissRef.current(), remaining.current);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt.current));
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    setIsPaused(false);
    startTimer();
  }, [startTimer]);

  // Start timer on mount; restart if duration changes (dedup bump)
  useEffect(() => {
    remaining.current = duration;
    startTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration, startTimer]);

  // Keyboard: Escape dismisses the focused toast
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => { if (e.key === "Escape") dismiss(); },
    [dismiss]
  );

  const handleAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (e.animationName === "toastSlideOut") onDismiss(id);
    },
    [id, onDismiss]
  );

  return (
    <div
      role="alert"
      aria-live="assertive"
      tabIndex={0}
      className={`toast-card ${exiting ? "toast-exit" : "toast-enter"}`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      onKeyDown={handleKeyDown}
      onAnimationEnd={handleAnimationEnd}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "var(--radius-lg)",
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: "var(--shadow-lg)",
        minWidth: 280,
        maxWidth: 400,
        overflow: "hidden",
        pointerEvents: "all",
        position: "relative",
        outline: "none",
      }}
    >
      {/* Content row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px 12px 16px" }}>
        <i
          className={`ti ${ICONS[type]}`}
          style={{ fontSize: 17, color: c.icon, flexShrink: 0, marginTop: 1 }}
          aria-hidden="true"
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontSize: "var(--font-sm)",
              fontWeight: 500,
              color: "var(--text)",
              lineHeight: 1.45,
            }}
          >
            {message}
          </span>

          {action && (
            <button
              onClick={() => { action.onClick(); dismiss(); }}
              className="toast-action"
              style={{
                alignSelf: "flex-start",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontSize: "var(--font-xs, 11px)",
                fontWeight: 600,
                color: c.icon,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {action.label}
            </button>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="toast-close"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            padding: "2px 2px 2px 6px",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            borderRadius: "var(--radius-sm, 4px)",
          }}
        >
          <i className="ti ti-x" style={{ fontSize: 13 }} aria-hidden="true" />
        </button>
      </div>

      {/* Progress bar */}
      {!exiting && (
        <div
          key={duration} // re-mount when duration changes (dedup bump resets bar)
          className="toast-progress"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 2,
            background: c.progress,
            opacity: 0.45,
            animationDuration: `${duration}ms`,
            animationPlayState: isPaused ? "paused" : "running",
          }}
        />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const TOAST_CSS = `
@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(16px) scale(0.97); }
  to   { opacity: 1; transform: translateX(0)    scale(1);    }
}

@keyframes toastSlideOut {
  from { opacity: 1; transform: translateX(0)    scale(1);    max-height: 120px; margin-bottom: 0;  }
  to   { opacity: 0; transform: translateX(16px) scale(0.97); max-height: 0;     margin-bottom: -8px; }
}

@keyframes toastProgress {
  from { width: 100%; }
  to   { width: 0%; }
}

.toast-card {
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}
.toast-card:hover,
.toast-card:focus-visible {
  box-shadow: var(--shadow-xl, 0 8px 30px rgba(0,0,0,.18)) !important;
  transform: translateY(-1px);
}
.toast-card:focus-visible {
  outline: 2px solid var(--blue, #3b82f6);
  outline-offset: 2px;
}

.toast-enter {
  animation: toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.toast-exit {
  animation: toastSlideOut 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
  pointer-events: none;
}

.toast-progress {
  animation: toastProgress linear forwards;
}

.toast-close:hover  { opacity: 0.75; }
.toast-close:focus-visible {
  outline: 2px solid var(--blue, #3b82f6);
  outline-offset: 1px;
}

.toast-action:hover { opacity: 0.75; text-decoration: underline; }
.toast-action:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter, .toast-exit { animation: none !important; }
  .toast-progress            { animation: none !important; width: 0 !important; }
  .toast-card                { transition: none !important; }
}
`;
