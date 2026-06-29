import React, {
  Component,
  ErrorInfo,
  ReactNode,
  createContext,
  useContext,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children:   ReactNode;
  /**
   * Render a custom fallback instead of the default full-page error screen.
   * Receives the caught error and a reset callback.
   */
  fallback?:  (error: Error, reset: () => void) => ReactNode;
  /**
   * Called whenever an error is caught — use for Sentry / logging services.
   */
  onError?:   (error: Error, info: ErrorInfo) => void;
  /**
   * When true the boundary shows a compact inline error strip rather than
   * a full-page takeover. Useful for widget-level boundaries.
   */
  inline?:    boolean;
}

interface ErrorBoundaryState {
  error:     Error | null;
  errorInfo: ErrorInfo | null;
}

// ─── Context (lets deep children trigger a reset) ──────────────────────────────

interface ErrorBoundaryContextValue {
  resetError: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue>({
  resetError: () => {},
});

export function useErrorBoundary() {
  return useContext(ErrorBoundaryContext);
}

// ─── Boundary ─────────────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state  = { error: null, errorInfo: null };
    this.reset  = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  reset() {
    this.setState({ error: null, errorInfo: null });
  }

  render() {
    const { error, errorInfo } = this.state;
    const { children, fallback, inline } = this.props;

    if (!error) {
      return (
        <ErrorBoundaryContext.Provider value={{ resetError: this.reset }}>
          {children}
        </ErrorBoundaryContext.Provider>
      );
    }

    // Custom fallback
    if (fallback) {
      return fallback(error, this.reset);
    }

    // Inline strip (for widget-level boundaries)
    if (inline) {
      return (
        <div
          role="alert"
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            padding:      "10px 14px",
            borderRadius: "var(--radius)",
            background:   "var(--red-bg)",
            border:       "1px solid var(--red-border)",
            color:        "var(--red)",
            fontSize:     "var(--font-sm)",
          }}
        >
          <i className="ti ti-alert-triangle" style={{ fontSize: 15, flexShrink: 0 }} aria-hidden="true" />
          <span style={{ flex: 1 }}>
            {error.message || "Something went wrong."}
          </span>
          <button
            onClick={this.reset}
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              color:      "inherit",
              fontWeight: 600,
              fontSize:   "var(--font-sm)",
              padding:    0,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    // Default: full-page fallback
    return (
      <div
        role="alert"
        style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          minHeight:      "100vh",
          padding:        "20px",
          background:     "var(--surface)",
          color:          "var(--text)",
          textAlign:      "center",
        }}
      >
        {/* Icon */}
        <div style={{
          width:          72,
          height:         72,
          borderRadius:   "50%",
          background:     "var(--red-bg)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          marginBottom:   20,
        }}>
          <i className="ti ti-alert-triangle" style={{ fontSize: 36, color: "var(--red)" }} aria-hidden="true" />
        </div>

        <h2 style={{
          fontSize:     "var(--font-xl)",
          fontWeight:   800,
          margin:       "0 0 8px",
          color:        "var(--text)",
        }}>
          Something went wrong
        </h2>

        <p style={{
          fontSize:  "var(--font-sm)",
          color:     "var(--muted)",
          maxWidth:  380,
          margin:    "0 0 24px",
          lineHeight: 1.6,
        }}>
          An unexpected error occurred. You can try again or reload the page if
          the problem persists.
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={this.reset}
            style={{
              padding:      "10px 20px",
              borderRadius: "var(--radius)",
              background:   "var(--accent)",
              color:        "#fff",
              border:       "none",
              fontSize:     "var(--font-sm)",
              fontWeight:   600,
              cursor:       "pointer",
            }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding:      "10px 20px",
              borderRadius: "var(--radius)",
              background:   "var(--surface2, #f1f5f9)",
              color:        "var(--text)",
              border:       "1px solid var(--border)",
              fontSize:     "var(--font-sm)",
              fontWeight:   600,
              cursor:       "pointer",
            }}
          >
            Reload page
          </button>
        </div>

        {/* Dev-only stack trace */}
        {process.env.NODE_ENV !== "production" && (
          <details style={{ marginTop: 28, maxWidth: 640, width: "100%", textAlign: "left" }}>
            <summary style={{
              cursor:   "pointer",
              fontSize: "var(--font-sm)",
              color:    "var(--muted)",
              userSelect: "none",
            }}>
              Error details (dev only)
            </summary>
            <pre style={{
              marginTop:    10,
              padding:      12,
              background:   "var(--surface3, #0f172a)",
              color:        "#e2e8f0",
              borderRadius: "var(--radius)",
              fontSize:     "var(--font-xs, 11px)",
              overflow:     "auto",
              maxHeight:    240,
              lineHeight:   1.6,
              whiteSpace:   "pre-wrap",
              wordBreak:    "break-word",
            }}>
              <strong>{error.toString()}</strong>
              {"\n\n"}
              {error.stack}
              {errorInfo?.componentStack && (
                <>
                  {"\n\nComponent stack:"}
                  {errorInfo.componentStack}
                </>
              )}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
