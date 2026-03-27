import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../services/api";

// ─── Cloud component ───────────────────────────────────────────────────────
// Each cloud is a simple SVG shape that drifts right-to-left across the page.
// `delay` staggers when it starts so clouds don't all move together.
// `top` sets its vertical position as a percentage of screen height.
// `duration` controls how fast it moves — higher = slower.
const Cloud = ({ top, duration, delay, scale = 1, opacity = 0.6 }) => (
  <div
    style={{
      position: "fixed",
      top: `${top}%`,
      left: 0,
      width: "100%",
      height: 0,
      zIndex: 5,
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        position: "absolute",
        right: "-220px",
        animation: `cloudMove ${duration}s linear ${delay}s infinite`,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <svg width="200" height="60" viewBox="0 0 200 60" fill="none">
        <ellipse
          cx="100"
          cy="40"
          rx="90"
          ry="22"
          fill="#1e3a5f"
          opacity="0.7"
        />
        <ellipse cx="70" cy="32" rx="50" ry="22" fill="#1e3a5f" opacity="0.8" />
        <ellipse
          cx="130"
          cy="35"
          rx="40"
          ry="18"
          fill="#1e3a5f"
          opacity="0.75"
        />
        <ellipse
          cx="100"
          cy="28"
          rx="38"
          ry="20"
          fill="#243b6e"
          opacity="0.9"
        />
      </svg>
    </div>
  </div>
);

// ─── Star component ─────────────────────────────────────────────────────────
// Small dots placed at random positions that blink on and off.
const Star = ({ top, left, size, delay }) => (
  <div
    style={{
      position: "fixed",
      top: `${top}%`,
      left: `${left}%`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      background: "white",
      opacity: 0.8,
      zIndex: 4,
      animation: `starBlink 3s ease-in-out ${delay}s infinite`,
      pointerEvents: "none",
    }}
  />
);

// ─── Fixed star positions (so they don't move on re-render) ─────────────────
const STARS = [
  { top: 5, left: 15, size: 2, delay: 0 },
  { top: 8, left: 30, size: 1.5, delay: 0.5 },
  { top: 12, left: 55, size: 2, delay: 1 },
  { top: 6, left: 70, size: 1, delay: 1.5 },
  { top: 15, left: 80, size: 2.5, delay: 0.3 },
  { top: 20, left: 45, size: 1.5, delay: 0.8 },
  { top: 10, left: 90, size: 1, delay: 1.2 },
  { top: 25, left: 20, size: 2, delay: 0.6 },
  { top: 3, left: 60, size: 1.5, delay: 1.8 },
  { top: 18, left: 35, size: 1, delay: 0.2 },
  { top: 7, left: 85, size: 2, delay: 1.4 },
  { top: 22, left: 65, size: 1.5, delay: 0.9 },
];

function QRPanel() {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900);
  const [scanned, setScanned] = useState(false);
  const navigate = useNavigate();

  const apiBase =
    //import.meta.env.VITE_API_URL?.replace("/api", "") ||
    "http://localhost:3001";

  const fetchQR = async () => {
    setLoading(true);
    setScanned(false);
    try {
      // THIS was the bug — it was calling check-scan instead of guest-token
      const res = await fetch(`${apiBase}/api/auth/guest-token`);
      const data = await res.json();
      if (data.success) {
        setQrData(data);
        setTimeLeft(900);
      }
    } catch {
      // server not reachable
    } finally {
      setLoading(false);
    }
  };

  // Fetch QR on mount
  useEffect(() => {
    fetchQR();
  }, []);

  // Auto refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(fetchQR, 900000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer — auto refresh when hits zero
  useEffect(() => {
    if (timeLeft <= 0) {
      fetchQR();
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // Poll server every 3 seconds to check if phone scanned
  useEffect(() => {
    if (!qrData?.tokenId || scanned) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch(
          `${apiBase}/api/auth/check-scan/${qrData.tokenId}`,
        );
        const data = await res.json();
        if (data.scanned) {
          clearInterval(poll);
          setScanned(true);
          console.log("SCANNED DETECTED - navigating to dashboard");
          window.location.href =
            "/dashboard?guestSession=true&expires=" + (Date.now() + 300000);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [qrData, scanned, navigate]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="qr-panel">
      <p
        style={{
          color: "#fbbf24",
          fontSize: "10px",
          letterSpacing: "3px",
          textTransform: "uppercase",
          fontFamily: "sans-serif",
        }}
      >
        Temporary Access
      </p>
      <p
        style={{
          color: "rgba(224,231,255,0.4)",
          fontSize: "11px",
          textAlign: "center",
          fontFamily: "sans-serif",
          lineHeight: 1.5,
        }}
      >
        Scan with your phone for 15-minute guest access
      </p>

      {loading ? (
        <div style={{ padding: "40px 0" }}>
          <div className="qr-spinner" />
        </div>
      ) : scanned ? (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>✓</div>
          <p
            style={{
              color: "#4ade80",
              fontSize: "12px",
              fontFamily: "sans-serif",
            }}
          >
            Scanned — redirecting...
          </p>
        </div>
      ) : qrData ? (
        <img
          src={qrData.qrCode}
          alt="Guest access QR code"
          width={180}
          height={180}
          className="qr-image"
          style={{ borderRadius: "8px" }}
        />
      ) : (
        <p
          style={{
            color: "#f87171",
            fontSize: "12px",
            fontFamily: "sans-serif",
          }}
        >
          Server offline — QR unavailable
        </p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: timeLeft < 60 ? "#f87171" : "rgba(224,231,255,0.4)",
          fontSize: "12px",
          fontFamily: "monospace",
        }}
      >
        <span>⏱</span>
        <span>Expires in {fmt(timeLeft)}</span>
      </div>
    </div>
  );
}

// ─── Main LoginPage component ───────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate();

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showTOTP, setShowTOTP] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Attempt / lockout state
  const [attempts, setAttempts] = useState(0); // attempts in current round
  const [lockoutRound, setLockoutRound] = useState(0); // how many lockout rounds done
  const [lockedOut, setLockedOut] = useState(false); // currently locked?
  const [permanentLock, setPermanentLock] = useState(false); // final permanent lock?
  const [lockTimer, setLockTimer] = useState(0); // seconds remaining

  // Shake the form when credentials are wrong
  const [shake, setShake] = useState(false);
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  // ── Lockout timer countdown ─────────────────────────────────────────────
  useEffect(() => {
    if (!lockedOut || permanentLock) return;
    if (lockTimer <= 0) {
      setLockedOut(false);
      setAttempts(0);
      return;
    }
    const t = setTimeout(() => setLockTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockedOut, lockTimer, permanentLock]);

  // ── Login handler ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (lockedOut || permanentLock) return;
    if (!username || !password) {
      triggerShake();
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!showTOTP) {
        // First call — just username + password
        const res = await authAPI.login(username, password, null, null);
        if (res.data.requireTOTP) {
          setShowTOTP(true);
          setLoading(false);
          return;
        }
      }

      // Second call — with TOTP
      const res = await authAPI.login(username, password, totpToken, null);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setError("");
        setTimeout(() => navigate("/vault"), 1200);
      }
    } catch {
      const next = attempts + 1;
      setAttempts(next);

      if (next >= 5) {
        const nextRound = lockoutRound + 1;
        setLockoutRound(nextRound);
        if (nextRound >= 3) {
          setPermanentLock(true);
        } else {
          setLockedOut(true);
          setLockTimer(60); // 60 second lockout per round (change to 600 for 10 min in production)
        }
        return;
      }

      triggerShake();
      setError(
        `Invalid credentials — ${5 - next} attempt${5 - next === 1 ? "" : "s"} remaining`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Derived display values ───────────────────────────────────────────────
  const buttonLabel = permanentLock
    ? "🔒 Account Locked"
    : lockedOut
      ? `Locked — ${lockTimer}s remaining`
      : loading
        ? "Verifying..."
        : "Verify Identity";

  return (
    <>
      {/* ── Global CSS ──────────────────────────────────────────────────── */}
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { overflow: hidden; min-height:100vh; }

        /* Cloud drifts from right side all the way to the left and loops */
        @keyframes cloudMove {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100vw - 220px)); }
        }

        /* Stars blink by fading in and out */
        @keyframes starBlink {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 1;   }
        }

        /* Form shakes left-right when credentials are wrong */
        @keyframes formShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-10px); }
          40%     { transform: translateX(10px); }
          60%     { transform: translateX(-8px); }
          80%     { transform: translateX(8px); }
        }
        .shake { animation: formShake 0.5s ease; }

        /* Input field glow on focus */
        input:focus { outline: none; border-color: #6366f1 !important; }

        /* ── RESPONSIVE ILLUSTRATION POSITIONS ──────────────────────────
           We use CSS custom properties set on the <svg> element, then
           override them at each breakpoint. This keeps all positioning
           in one place.                                                    */

        .scene-svg {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          object-fit: contain;
        }

        /* ── Form wrapper — always centered ─────────────────────────────*/
        .form-wrapper {
          position: fixed;
          inset: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          pointer-events: none;   /* let clicks fall through to background */
        }
        .form-card {
          pointer-events: all;    /* form itself is clickable */
          width: 100%;
          max-width: 420px;
          background: rgba(10, 14, 39, 0.82);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(99, 102, 241, 0.35);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 8px 48px rgba(0,0,0,0.55), 0 0 60px rgba(99,102,241,0.08);
        }

        /* ── Attempt dots ───────────────────────────────────────────────*/
        .attempt-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: background 0.3s;
        }
        .attempt-dot.used { background: #ef4444; }

        .qr-panel {
          width: 100%;
          max-width: 320px;
          background: rgba(10, 14, 39, 0.82);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(251,191,36,0.25);
          border-radius: 20px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 48px rgba(0,0,0,0.55);
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .qr-spinner {
          width: 32px; height: 32px;
          border: 2px solid rgba(251,191,36,0.2);
          border-top-color: #fbbf24;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes qrPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(251,191,36,0); }
        }
        .qr-image { animation: qrPulse 2s ease-in-out infinite; border-radius: 8px; }

        .ground-layer {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 2;
          pointer-events: none;   /* let clicks fall through to background */
        }
      `}</style>

      {/* ── Background colour ──────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0a0e27",
          zIndex: 0,
        }}
      />

      {/* ── Moon — fixed HTML element, always visible top-right ── */}
      <div
        style={{
          position: "fixed",
          top: "6%",
          right: "8%",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <svg width="110" height="110" viewBox="0 0 110 110">
          <circle cx="55" cy="55" r="52" fill="#1a2a6e" opacity="0.3" />
          <circle cx="55" cy="55" r="42" fill="#1e3480" opacity="0.25" />
          <circle cx="55" cy="55" r="34" fill="#c8b88a" />
          <circle cx="72" cy="44" r="30" fill="#0a0e27" />
        </svg>
      </div>

      {/* ── Stars ──────────────────────────────────────────────────────────── */}
      {STARS.map((s, i) => (
        <Star key={i} {...s} />
      ))}

      {/* ── Clouds ─────────────────────────────────────────────────────────── */}
      <Cloud top={8} duration={28} delay={0} scale={1.2} opacity={0.55} />
      <Cloud top={14} duration={22} delay={6} scale={0.9} opacity={0.5} />
      <Cloud top={5} duration={35} delay={12} scale={1.4} opacity={0.45} />
      <Cloud top={20} duration={25} delay={3} scale={0.8} opacity={0.6} />
      <Cloud top={10} duration={30} delay={18} scale={1.1} opacity={0.4} />
      <Cloud top={18} duration={20} delay={9} scale={0.7} opacity={0.55} />

      {/* ── SVG Scene (full-screen background illustration) ─────────────────
           viewBox="0 0 1000 700" — think of this as a 1000×700 canvas.
           The browser stretches it to fill the screen while keeping proportions.
           preserveAspectRatio="xMidYMax slice" means:
             - slice  = crop rather than letterbox (fills entire screen)
             - xMidYMax = anchor to the BOTTOM centre so the ground always
                          stays at the bottom even on tall/narrow screens       */}
      <svg
        className="scene-svg"
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Sky gradient */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050818" />
            <stop offset="60%" stopColor="#0a1540" />
            <stop offset="100%" stopColor="#0d1f55" />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f2044" />
            <stop offset="100%" stopColor="#080f28" />
          </linearGradient>
        </defs>

        {/* Sky fill */}
        <rect width="1000" height="700" fill="url(#skyGrad)" />

        {/* ── Tree — positioned LEFT of centre (x≈280) ─────────────────────
             On desktop the form is centred, tree is to the left of it.
             On phone the form is centred and tree moves to the right —
             we handle that purely with viewBox anchoring + the tree x position
             being at 28% of the 1000px canvas width.                          */}

        {/* Tree trunk */}
        <rect x="180" y="420" width="16" height="280" rx="8" fill="#0a1830" />
        {/* Trunk highlight */}
        <rect
          x="184"
          y="435"
          width="4"
          height="265"
          rx="2"
          fill="#0f2548"
          opacity="0.6"
        />

        {/* Foliage — moved left so moon is fully clear */}
        <circle cx="188" cy="430" r="72" fill="#0d1f44" />
        <circle cx="161" cy="408" r="56" fill="#0f2248" />
        <circle cx="216" cy="412" r="58" fill="#0f2248" />
        <circle cx="188" cy="392" r="60" fill="#112550" />
        <circle cx="158" cy="400" r="46" fill="#112550" />
        <circle cx="220" cy="403" r="48" fill="#112550" />
        <circle cx="188" cy="375" r="48" fill="#132858" />
        <circle cx="166" cy="382" r="36" fill="#132858" />
        <circle cx="212" cy="384" r="38" fill="#132858" />
        <circle cx="188" cy="360" r="36" fill="#172e62" />
      </svg>

      {/* ── Ground — pure CSS so it always fills 100% screen width ── */}
      <div className="ground-layer">
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", height: "160px", display: "block" }}
        >
          <path
            d="M0,100 Q360,75 720,88 Q1080,100 1440,78 L1440,160 L0,160 Z"
            fill="#0d1f44"
          />
          <path
            d="M0,115 Q360,95 720,105 Q1080,118 1440,95 L1440,160 L0,160 Z"
            fill="#0f2348"
          />
          <path
            d="M0,130 Q360,115 720,122 Q1080,132 1440,115 L1440,160 L0,160 Z"
            fill="#0a1830"
          />
          <path
            d="M0,132 Q360,117 720,124 Q1080,134 1440,117"
            fill="none"
            stroke="#1a3a7a"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* ── Login Form — always centred over the scene ──────────────────────── */}
      <div
        className="form-wrapper"
        style={{ flexDirection: "row", gap: "24px", flexWrap: "wrap" }}
      >
        <QRPanel />
        <div className={`form-card ${shake ? "shake" : ""}`}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "4px",
                color: "#e0e7ff",
                textTransform: "uppercase",
                fontFamily: "sans-serif",
              }}
            >
              Zero Trust
            </h1>
            <p
              style={{
                fontSize: "11px",
                letterSpacing: "3px",
                color: "#6366f1",
                textTransform: "uppercase",
                marginTop: "6px",
                fontFamily: "sans-serif",
              }}
            >
              Identity Verification
            </p>
          </div>

          {/* Error message */}
          {error && (
            <p
              style={{
                color: "#f87171",
                fontSize: "13px",
                textAlign: "center",
                marginBottom: "16px",
                fontFamily: "sans-serif",
              }}
            >
              {error}
            </p>
          )}

          {/* Permanent lockout message */}
          {permanentLock && (
            <div
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                borderRadius: "10px",
                padding: "16px",
                textAlign: "center",
                marginBottom: "16px",
                fontFamily: "sans-serif",
              }}
            >
              <p
                style={{ color: "#f87171", fontWeight: 700, fontSize: "15px" }}
              >
                ⛔ Account Locked
              </p>
              <p
                style={{ color: "#fca5a5", fontSize: "12px", marginTop: "6px" }}
              >
                Too many failed attempts. Please contact your administrator to
                restore access.
              </p>
            </div>
          )}

          {/* Lockout timer */}
          {lockedOut && !permanentLock && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                padding: "14px",
                textAlign: "center",
                marginBottom: "16px",
                fontFamily: "sans-serif",
              }}
            >
              <p style={{ color: "#fca5a5", fontSize: "13px" }}>
                Too many failed attempts — locked out
              </p>
              <p
                style={{
                  color: "#f87171",
                  fontWeight: 700,
                  fontSize: "22px",
                  margin: "6px 0",
                }}
              >
                {lockTimer}s
              </p>
              <p style={{ color: "#fca5a5", fontSize: "11px" }}>
                Round {lockoutRound}/2 — {2 - lockoutRound} lockout
                {2 - lockoutRound === 1 ? "" : "s"} before permanent lock
              </p>
            </div>
          )}

          {/* Username input */}
          <div style={{ marginBottom: "14px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={lockedOut || permanentLock}
              style={{
                width: "100%",
                padding: "13px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "10px",
                color: "#e0e7ff",
                fontSize: "15px",
                fontFamily: "sans-serif",
                transition: "border-color 0.2s",
                opacity: lockedOut || permanentLock ? 0.4 : 1,
              }}
            />
          </div>

          {/* Password input */}
          <div style={{ marginBottom: "14px", position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={lockedOut || permanentLock}
              style={{
                width: "100%",
                padding: "13px 44px 13px 16px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "10px",
                color: "#e0e7ff",
                fontSize: "15px",
                fontFamily: "sans-serif",
                transition: "border-color 0.2s",
                opacity: lockedOut || permanentLock ? 0.4 : 1,
              }}
            />
            {/* Eye toggle button */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={lockedOut || permanentLock}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6366f1",
                padding: "4px",
                opacity: lockedOut || permanentLock ? 0.3 : 1,
              }}
            >
              {showPassword ? (
                // Eye with slash (password visible — click to hide)
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                // Open eye (password hidden — click to reveal)
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* TOTP field — slides in after password is verified server-side */}
          {showTOTP && (
            <div
              style={{
                marginBottom: "14px",
                animation: "slideIn 0.4s ease",
              }}
            >
              <style>{`
                @keyframes slideIn {
                  from { opacity: 0; transform: translateY(-10px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              <input
                type="text"
                placeholder="6-digit authenticator code"
                value={totpToken}
                onChange={(e) =>
                  setTotpToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                maxLength={6}
                autoFocus
                disabled={lockedOut || permanentLock}
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.5)",
                  borderRadius: "10px",
                  color: "#e0e7ff",
                  fontSize: "20px",
                  fontFamily: "monospace",
                  letterSpacing: "8px",
                  textAlign: "center",
                  opacity: lockedOut || permanentLock ? 0.4 : 1,
                }}
              />
              <p
                style={{
                  color: "#6366f1",
                  fontSize: "11px",
                  textAlign: "center",
                  marginTop: "6px",
                  fontFamily: "sans-serif",
                }}
              >
                Open Google Authenticator on your phone
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleLogin}
            disabled={loading || lockedOut || permanentLock}
            style={{
              width: "100%",
              padding: "14px",
              background: permanentLock
                ? "rgba(239,68,68,0.2)"
                : lockedOut
                  ? "rgba(239,68,68,0.15)"
                  : "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: `1px solid ${permanentLock || lockedOut ? "rgba(239,68,68,0.4)" : "rgba(99,102,241,0.6)"}`,
              borderRadius: "10px",
              color: permanentLock || lockedOut ? "#fca5a5" : "#e0e7ff",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor:
                loading || lockedOut || permanentLock
                  ? "not-allowed"
                  : "pointer",
              fontFamily: "sans-serif",
              transition: "all 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {buttonLabel}
          </button>

          {/* Attempt indicator dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginTop: "18px",
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`attempt-dot ${i < attempts ? "used" : ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
