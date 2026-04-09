"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional inline fallback instead of the full-page error screen */
  fallback?: ReactNode;
}
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return { hasError: true, message };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", padding: "32px 24px",
        textAlign: "center", gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div style={{ fontWeight: 600, fontSize: 17 }}>Something went wrong</div>
        <div style={{ fontSize: 14, color: "var(--c-sub)", maxWidth: 320 }}>
          {this.state.message}
        </div>
        <button
          onClick={() => { this.setState({ hasError: false, message: "" }); window.location.reload(); }}
          style={{
            marginTop: 8, padding: "10px 20px", borderRadius: 8,
            background: "#eb1700", color: "#fff", border: "none",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}