import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function GuestVault() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [phase, setPhase] = useState("loading"); // 'loading' | 'granted' | 'expired'

  useEffect(() => {
    if (!token) {
      setPhase("expired");
      return;
    }
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const apiBase =
        import.meta.env.VITE_API_URL?.replace("/api", "") ||
        "http://localhost:3001";
      const res = await fetch(`${apiBase}/api/vault/guest`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPhase("granted");
      } else {
        setPhase("expired");
      }
    } catch {
      setPhase("expired");
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); } 50% { box-shadow: 0 0 0 20px rgba(74,222,128,0); } }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#050818",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          fontFamily: "'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        {phase === "loading" && (
          <>
            <div
              style={{
                width: "60px",
                height: "60px",
                border: "3px solid rgba(99,102,241,0.2)",
                borderTopColor: "#818cf8",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p
              style={{
                color: "rgba(224,231,255,0.5)",
                fontSize: "13px",
                letterSpacing: "2px",
              }}
            >
              VERIFYING TEMPORARY CREDENTIALS...
            </p>
          </>
        )}

        {phase === "granted" && (
          <div
            style={{ textAlign: "center", animation: "fadeIn 0.6s ease-out" }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(74,222,128,0.15)",
                border: "2px solid rgba(74,222,128,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              <span style={{ fontSize: "36px" }}>✓</span>
            </div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "3px",
                background: "linear-gradient(135deg, #4ade80, #22d3ee)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "12px",
              }}
            >
              Access Granted
            </h1>
            <p
              style={{
                color: "rgba(224,231,255,0.4)",
                fontSize: "13px",
                letterSpacing: "1px",
              }}
            >
              Identity verified successfully
            </p>
            <p
              style={{
                color: "rgba(224,231,255,0.25)",
                fontSize: "11px",
                marginTop: "8px",
              }}
            >
              You may close this tab
            </p>
          </div>
        )}

        {phase === "expired" && (
          <div
            style={{ textAlign: "center", animation: "fadeIn 0.6s ease-out" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>⛔</div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                letterSpacing: "3px",
                color: "#f87171",
                marginBottom: "12px",
              }}
            >
              Access Expired
            </h1>
            <p style={{ color: "rgba(224,231,255,0.4)", fontSize: "13px" }}>
              This temporary access link is no longer valid.
            </p>
            <p
              style={{
                color: "rgba(224,231,255,0.25)",
                fontSize: "11px",
                marginTop: "8px",
              }}
            >
              Please request a new QR code from the administrator.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
