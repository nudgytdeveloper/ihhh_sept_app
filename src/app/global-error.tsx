"use client";

import { useEffect } from "react";

/**
 * Root error boundary (Phase 6). Catches failures in the root layout itself, so
 * it renders its own <html>/<body> and can't rely on the app's fonts/CSS — hence
 * inline styles. This is the last-resort fallback; the per-route `error.tsx`
 * handles the common case.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "linear-gradient(160deg, #eef2fb, #ffffff)",
          color: "#0f172a",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
          The app hit a snag
        </h1>
        <p style={{ maxWidth: "24rem", fontSize: "0.9rem", color: "#475569", margin: 0 }}>
          Something went wrong loading the Event Navigator. Please reload — if it
          persists, reopen the app.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            border: 0,
            borderRadius: "9999px",
            padding: "0.65rem 1.4rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "#ffffff",
            background: "linear-gradient(120deg, #2f6df6, #14b8a6)",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
