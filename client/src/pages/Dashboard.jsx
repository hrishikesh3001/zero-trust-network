import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuestSession = searchParams.get("guestSession") === "true";
  const expiresAt = parseInt(searchParams.get("expires") || "0");
  const [timeLeft, setTimeLeft] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  );
  const [showExpired, setShowExpired] = useState(false);

  // Guest session countdown — redirect back to login when done
  useEffect(() => {
    if (!isGuestSession) return;
    if (timeLeft <= 0) {
      setShowExpired(true);
      setTimeout(() => navigate("/"), 3000);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isGuestSession, timeLeft, navigate]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-20px);} to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* Session expired popup */}
      {showExpired && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#0a0e27",
              border: "1px solid rgba(248,113,113,0.4)",
              borderRadius: "16px",
              padding: "40px",
              textAlign: "center",
              animation: "slideIn 0.4s ease-out",
              fontFamily: "'Segoe UI', sans-serif",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏱</div>
            <h2
              style={{
                color: "#f87171",
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              Session Expired
            </h2>
            <p style={{ color: "rgba(224,231,255,0.5)", fontSize: "13px" }}>
              Guest session has ended. Returning to login...
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          minHeight: "100vh",
          background: "#050818",
          fontFamily: "'Segoe UI', sans-serif",
          color: "#e0e7ff",
          animation: "fadeIn 0.6s ease-out",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 32px",
            background: "rgba(5,8,24,0.85)",
            borderBottom: "1px solid rgba(99,102,241,0.2)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span
            style={{
              color: "rgba(74,222,128,0.7)",
              fontSize: "10px",
              letterSpacing: "2px",
            }}
          >
            ZERO TRUST — DASHBOARD
          </span>
          {isGuestSession && (
            <span
              style={{
                color: timeLeft < 60 ? "#f87171" : "#fbbf24",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
            >
              ⚠ Guest session expires in {fmt(timeLeft)}
            </span>
          )}
          <button
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "1px solid rgba(248,113,113,0.4)",
              color: "rgba(248,113,113,0.8)",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            Exit
          </button>
        </div>

        {/* Placeholder content — full dashboard UI coming next */}
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "48px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "calc(100vh - 60px)",
            gap: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 800,
              letterSpacing: "4px",
              background: "linear-gradient(135deg, #e0e7ff, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Security Dashboard
          </h1>
          <p style={{ color: "rgba(224,231,255,0.4)", fontSize: "14px" }}>
            Full dashboard UI coming in Phase 6
          </p>
        </div>
      </div>
    </>
  );
}
