import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { vaultAPI, authAPI } from "../services/api";

export default function Vault() {
  const navigate = useNavigate();
  const [vaultData, setVaultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await vaultAPI.getVaultData();
        setVaultData(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        } else {
          setError("Failed to load vault data.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authAPI.logout();
    } catch {
      // even if logout call fails, clear local token
    }
    localStorage.removeItem("token");
    setTimeout(() => navigate("/"), 800);
  };

  const fmt = (d) => d.toLocaleTimeString("en-GB", { hour12: false });
  const fmtDate = (d) =>
    d.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) return <LoadingScreen />;

  return (
    <>
      <style>{CSS}</style>
      <div className="v-root">
        <Particles />

        {/* Top bar */}
        <div className="v-topbar">
          <div className="v-topbar-left">
            <div className="v-status-dot" />
            <span className="v-status-txt">
              ZERO TRUST NETWORK — SECURE CONNECTION ACTIVE
            </span>
          </div>
          <div className="v-topbar-right">
            <span className="v-clock">{fmt(time)}</span>
            <button
              className={`v-logout-btn${loggingOut ? " leaving" : ""}`}
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="v-content">
          {error && <div className="v-error">{error}</div>}

          {vaultData && (
            <>
              {/* Welcome header */}
              <div className="v-hero">
                <div className="v-hero-badge">
                  CLEARANCE LEVEL {vaultData.data?.clearanceLevel || "ALPHA-7"}
                </div>
                <h1 className="v-hero-title">Secret Vault</h1>
                <p className="v-hero-sub">
                  Welcome back,{" "}
                  <span className="v-username">{vaultData.user}</span>
                </p>
                <p className="v-hero-date">{fmtDate(time)}</p>
              </div>

              {/* Stats row */}
              <div className="v-stats-row">
                <StatCard
                  label="Network Integrity"
                  value={vaultData.data?.networkIntegrity || "100%"}
                  icon="◈"
                  color="#4ade80"
                />
                <StatCard
                  label="System Status"
                  value="SECURE"
                  icon="◉"
                  color="#4ade80"
                />
                <StatCard
                  label="Clearance Level"
                  value={vaultData.data?.clearanceLevel || "ALPHA-7"}
                  icon="◆"
                  color="#818cf8"
                />
                <StatCard
                  label="Access Time"
                  value={fmt(time)}
                  icon="◷"
                  color="#38bdf8"
                />
              </div>

              {/* Vault confirmation banner */}
              <div className="v-banner">
                <div className="v-banner-icon">🔐</div>
                <div>
                  <p className="v-banner-title">
                    You are inside the Zero Trust Network
                  </p>
                  <p className="v-banner-sub">
                    Every request you make is authenticated and logged. Your JWT
                    expires in 15 minutes from login — re-authentication
                    required after expiry.
                  </p>
                </div>
              </div>

              {/* System info */}
              <div className="v-section-title">SYSTEM INTELLIGENCE</div>
              <div className="v-intel-grid">
                <IntelCard
                  title="Authentication Method"
                  lines={[
                    "Username + Password (bcrypt)",
                    "TOTP via Google Authenticator",
                    "JWT token — 15 min expiry",
                    "Token blacklist on logout",
                  ]}
                />
                <IntelCard
                  title="Security Measures"
                  lines={[
                    "Rate limiting — 5 attempts max",
                    "Input sanitization (XSS/SQL)",
                    "Helmet.js security headers",
                    "CORS policy enforced",
                  ]}
                />
                <IntelCard
                  title="Network Architecture"
                  lines={[
                    "Nginx identity-aware proxy",
                    "Docker container isolation",
                    "Non-root container users",
                    "Internal network only",
                  ]}
                />
              </div>

              {/* Access log */}
              <div className="v-section-title" style={{ marginTop: "32px" }}>
                ACCESS LOG
              </div>
              <div className="v-log">
                <LogEntry
                  time={fmt(time)}
                  user={vaultData.user}
                  action="Vault access granted"
                  status="ALLOWED"
                />
                <LogEntry
                  time="—"
                  user={vaultData.user}
                  action="TOTP verification passed"
                  status="ALLOWED"
                />
                <LogEntry
                  time="—"
                  user={vaultData.user}
                  action="JWT issued"
                  status="ISSUED"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <>
      <style>{CSS}</style>
      <div
        style={{
          minHeight: "100vh",
          background: "#050818",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <div className="v-spinner" />
        <p
          style={{
            color: "rgba(129,140,248,0.7)",
            fontSize: "12px",
            letterSpacing: "3px",
          }}
        >
          VERIFYING CREDENTIALS...
        </p>
      </div>
    </>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="v-stat-card">
      <span className="v-stat-icon" style={{ color }}>{icon}</span>
      <span className="v-stat-value" style={{ color }}>{value}</span>
      <span className="v-stat-label">{label}</span>
    </div>
  );
}

function IntelCard({ title, lines }) {
  return (
    <div className="v-intel-card">
      <p className="v-intel-title">{title}</p>
      <ul className="v-intel-list">
        {lines.map((l, i) => (
          <li key={i} className="v-intel-item">
            <span className="v-intel-bullet">▸</span>
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LogEntry({ time, user, action, status }) {
  const col =
    status === "ALLOWED"
      ? "#4ade80"
      : status === "ISSUED"
        ? "#818cf8"
        : "#f87171";
  return (
    <div className="v-log-row">
      <span className="v-log-time">{time}</span>
      <span className="v-log-user">{user}</span>
      <span className="v-log-action">{action}</span>
      <span className="v-log-status" style={{ color: col }}>{status}</span>
    </div>
  );
}

function Particles() {
  const dots = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() < 0.3 ? 3 : 1.5,
    dur: `${4 + Math.random() * 8}s`,
    del: `${Math.random() * 6}s`,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {dots.map((d) => (
        <div
          key={d.id}
          style={{
            position: "absolute",
            left: d.left,
            top: d.top,
            width: `${d.size}px`,
            height: `${d.size}px`,
            borderRadius: "50%",
            background: "rgba(129,140,248,0.4)",
            animation: `vpulse ${d.dur} ${d.del} ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes vpulse { 0%,100%{opacity:0.1;} 50%{opacity:0.5;} }
@keyframes vspin  { to{transform:rotate(360deg);} }
@keyframes vfadein{ from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

.v-root {
  min-height: 100vh;
  background: #050818;
  background-image:
    radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(56,189,248,0.05) 0%, transparent 50%);
  font-family: 'Segoe UI', sans-serif;
  color: #e0e7ff;
  position: relative;
  overflow-x: hidden;
}

.v-topbar {
  position: sticky; top: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 32px;
  background: rgba(5,8,24,0.85);
  border-bottom: 1px solid rgba(99,102,241,0.2);
  backdrop-filter: blur(12px);
}
.v-topbar-left { display:flex; align-items:center; gap:10px; }
.v-status-dot {
  width:8px; height:8px; border-radius:50%;
  background:#4ade80;
  box-shadow: 0 0 8px #4ade80;
  animation: vpulse 2s ease-in-out infinite;
}
.v-status-txt { color:rgba(74,222,128,0.7); font-size:10px; letter-spacing:2px; }
.v-topbar-right { display:flex; align-items:center; gap:20px; }
.v-clock { color:rgba(129,140,248,0.7); font-size:13px; font-family:monospace; letter-spacing:1px; }
.v-logout-btn {
  padding: 7px 18px;
  background: transparent;
  border: 1px solid rgba(248,113,113,0.4);
  color: rgba(248,113,113,0.8);
  border-radius: 6px; font-size:12px; letter-spacing:1px;
  cursor: pointer; transition: all 0.2s;
}
.v-logout-btn:hover { background:rgba(248,113,113,0.08); border-color:rgba(248,113,113,0.7); color:#f87171; }
.v-logout-btn.leaving { opacity:0.4; cursor:not-allowed; }

.v-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  position: relative; z-index: 1;
  animation: vfadein 0.6s ease-out;
}

.v-error {
  background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);
  border-radius:10px; padding:16px; color:#f87171;
  font-size:13px; text-align:center; margin-bottom:24px;
}

.v-hero { text-align:center; margin-bottom:48px; }
.v-hero-badge {
  display:inline-block;
  background:rgba(99,102,241,0.12);
  border:1px solid rgba(99,102,241,0.3);
  color:#818cf8; font-size:10px; letter-spacing:3px;
  padding:6px 18px; border-radius:20px; margin-bottom:20px;
}
.v-hero-title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800; letter-spacing: 4px;
  background: linear-gradient(135deg, #e0e7ff 0%, #818cf8 50%, #38bdf8 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; margin-bottom: 12px;
}
.v-hero-sub { color:rgba(224,231,255,0.6); font-size:16px; margin-bottom:6px; }
.v-username { color:#818cf8; font-weight:600; }
.v-hero-date { color:rgba(224,231,255,0.3); font-size:12px; letter-spacing:1px; }

.v-stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px; margin-bottom: 32px;
}
.v-stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 20px 16px;
  display: flex; flex-direction:column; align-items:center; gap:8px;
  transition: border-color 0.2s;
}
.v-stat-card:hover { border-color:rgba(129,140,248,0.25); }
.v-stat-icon { font-size:20px; }
.v-stat-value { font-size:18px; font-weight:700; letter-spacing:1px; }
.v-stat-label { color:rgba(224,231,255,0.4); font-size:10px; letter-spacing:1.5px; text-align:center; }

.v-banner {
  display:flex; align-items:flex-start; gap:18px;
  background:rgba(56,189,248,0.06);
  border:1px solid rgba(56,189,248,0.2);
  border-radius:14px; padding:22px 24px; margin-bottom:40px;
}
.v-banner-icon { font-size:28px; flex-shrink:0; }
.v-banner-title { color:#38bdf8; font-size:14px; font-weight:600; letter-spacing:1px; margin-bottom:6px; }
.v-banner-sub { color:rgba(224,231,255,0.5); font-size:13px; line-height:1.6; }

.v-section-title {
  color:rgba(129,140,248,0.6); font-size:10px;
  letter-spacing:3px; margin-bottom:16px;
  padding-bottom:8px;
  border-bottom:1px solid rgba(99,102,241,0.15);
}

.v-intel-grid {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap:16px;
}
.v-intel-card {
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.07);
  border-radius:12px; padding:20px;
}
.v-intel-title { color:rgba(129,140,248,0.8); font-size:12px; font-weight:600; letter-spacing:1px; margin-bottom:14px; }
.v-intel-list { list-style:none; display:flex; flex-direction:column; gap:8px; }
.v-intel-item { color:rgba(224,231,255,0.5); font-size:12px; display:flex; align-items:center; gap:8px; }
.v-intel-bullet { color:rgba(99,102,241,0.6); font-size:10px; flex-shrink:0; }

.v-log {
  background:rgba(0,0,0,0.3);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:12px; overflow:hidden;
}
.v-log-row {
  display:grid;
  grid-template-columns: 80px 80px 1fr 80px;
  gap:16px; padding:12px 20px;
  border-bottom:1px solid rgba(255,255,255,0.04);
  font-size:11px; font-family:monospace;
  align-items:center;
}
.v-log-row:last-child { border-bottom:none; }
.v-log-time   { color:rgba(224,231,255,0.3); }
.v-log-user   { color:rgba(129,140,248,0.7); }
.v-log-action { color:rgba(224,231,255,0.55); }
.v-log-status { font-weight:700; letter-spacing:1px; text-align:right; }

.v-spinner {
  width:36px; height:36px;
  border:2px solid rgba(99,102,241,0.2);
  border-top-color:#818cf8;
  border-radius:50%;
  animation:vspin 0.8s linear infinite;
}

@media(max-width:600px){
  .v-topbar { padding:10px 16px; }
  .v-status-txt { display:none; }
  .v-content { padding:32px 16px 60px; }
  .v-hero-title { font-size:36px; }
  .v-log-row { grid-template-columns:70px 1fr 60px; }
  .v-log-user { display:none; }
}
`;