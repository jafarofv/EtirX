import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

// Top-level safety net: a render error anywhere in the tree shows this fallback
// instead of a blank white screen. Styled inline so it works even if CSS fails.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          padding: 24,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 22, marginBottom: 12 }}>Nəsə səhv getdi</h1>
          <p style={{ color: "#a1a1aa", marginBottom: 20, lineHeight: 1.5 }}>
            Səhifəni yeniləyin. Problem davam edərsə, bir az sonra yenidən cəhd edin.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 12,
              padding: "10px 20px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Yenilə
          </button>
        </div>
      </div>
    );
  }
}
