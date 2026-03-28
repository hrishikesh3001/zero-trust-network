import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { authAPI } from "../services/api";

export default function GuestVault() {
  const [searchParams] = useSearchParams();
  const tokenId = searchParams.get("tokenId");

  const [employeeId, setEmployeeId] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [phase, setPhase] = useState("form"); // 'form' | 'granted' | 'expired'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!employeeId || !totpToken) {
      setError("Please fill in all fields");
      return;
    }
    if (!tokenId) {
      setError("Invalid QR code — please scan again");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authAPI.phoneVerify(employeeId, totpToken, tokenId);
      if (res.data.success) {
        setPhase("granted");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError(err.response.data.message || "Invalid credentials");
      } else {
        setPhase("expired");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.4);} 50%{box-shadow:0 0 0 20px rgba(74,222,128,0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        input:focus { outline:none; border-color:#6366f1 !important; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#050818",
          backgroundImage:
            "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.06) 0%, transparent 60%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Segoe UI', sans-serif",
          padding: "24px",
        }}
      >
        {/* Access Granted screen */}
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
              Identity verified — PC is loading vault
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

        {/* Expired screen */}
        {phase === "expired" && (
          <div
            style={{ textAlign: "center", animation: "fadeIn 0.6s ease-out" }}
          >
            <div style={{ fontSize: "48px", marginBottom: "24px" }}>⛔</div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#f87171",
                marginBottom: "12px",
              }}
            >
              Access Expired
            </h1>
            <p style={{ color: "rgba(224,231,255,0.4)", fontSize: "13px" }}>
              This QR code is no longer valid.
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

        {/* Login form */}
        {phase === "form" && (
          <div
            style={{
              width: "100%",
              maxWidth: "380px",
              background: "rgba(10,14,39,0.85)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(99,102,241,0.35)",
              borderRadius: "20px",
              padding: "36px 28px",
              boxShadow: "0 8px 48px rgba(0,0,0,0.55)",
              animation: "fadeIn 0.5s ease-out",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔐</div>
              <h1
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  color: "#e0e7ff",
                  textTransform: "uppercase",
                }}
              >
                Zero Trust
              </h1>
              <p
                style={{
                  fontSize: "10px",
                  letterSpacing: "2px",
                  color: "#6366f1",
                  textTransform: "uppercase",
                  marginTop: "6px",
                }}
              >
                Mobile Verification
              </p>
            </div>

            {/* Error */}
            {error && (
              <p
                style={{
                  color: "#f87171",
                  fontSize: "12px",
                  textAlign: "center",
                  marginBottom: "16px",
                }}
              >
                {error}
              </p>
            )}

            {/* Employee ID */}
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  color: "rgba(224,231,255,0.4)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                EMPLOYEE ID
              </label>
              <input
                type="text"
                placeholder="EMP-XXXX-XXXX"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(99,102,241,0.3)",
                  borderRadius: "10px",
                  color: "#e0e7ff",
                  fontSize: "15px",
                  fontFamily: "monospace",
                  letterSpacing: "2px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* TOTP */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  color: "rgba(224,231,255,0.4)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                AUTHENTICATOR CODE
              </label>
              <input
                type="text"
                placeholder="000000"
                value={totpToken}
                onChange={(e) =>
                  setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.4)",
                  borderRadius: "10px",
                  color: "#e0e7ff",
                  fontSize: "24px",
                  fontFamily: "monospace",
                  letterSpacing: "8px",
                  textAlign: "center",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleVerify}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                border: "1px solid rgba(99,102,241,0.6)",
                borderRadius: "10px",
                color: "#e0e7ff",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Verifying..." : "Verify Identity"}
            </button>

            <p
              style={{
                color: "rgba(224,231,255,0.2)",
                fontSize: "10px",
                textAlign: "center",
                marginTop: "16px",
                letterSpacing: "1px",
              }}
            >
              Open Google Authenticator for your 6-digit code
            </p>
          </div>
        )}
      </div>
    </>
  );
}
