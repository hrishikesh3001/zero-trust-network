import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { dashboardAPI } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuestSession = searchParams.get("guestSession") === "true";
  const expiresAt = parseInt(searchParams.get("expires") || "0");

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uptime, setUptime] = useState(0);
  const [time, setTime] = useState(new Date());
  const [showExpired, setShowExpired] = useState(false);
  const [guestTimeLeft, setGuestTimeLeft] = useState(
    Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  );
  const pollRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchStats();
    if (!isGuestSession) {
      pollRef.current = setInterval(fetchStats, 5000);
    }
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!stats) return;
    const base = stats.serverStartTime;
    const t = setInterval(() => {
      setUptime(Math.floor((Date.now() - base) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [stats?.serverStartTime]);

  useEffect(() => {
    if (!isGuestSession) return;
    if (guestTimeLeft <= 0) {
      setShowExpired(true);
      setTimeout(() => navigate("/"), 3000);
      return;
    }
    const t = setTimeout(() => setGuestTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isGuestSession, guestTimeLeft, navigate]);

  const fetchStats = async () => {
    if (isGuestSession) {
      setLoading(false);
      return;
    }
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.stats);
      setError("");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/");
      } else if (err.response?.status === 403) {
        navigate("/");
      } else {
        setError("Failed to load stats");
      }
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const fmtUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };
  const fmtTime = (d) => d.toLocaleTimeString("en-GB", { hour12: false });
  const fmtTs = (ts) =>
    new Date(ts).toLocaleTimeString("en-GB", { hour12: false });

  const eventColor = (type) => {
    if (type === "LOGIN_SUCCESS") return "#4ade80";
    if (type === "LOGIN_FAIL") return "#f87171";
    if (type === "LOCKOUT") return "#ef4444";
    if (type === "LOGOUT") return "#818cf8";
    return "#38bdf8";
  };

  const eventLabel = (type) => {
    if (type === "LOGIN_SUCCESS") return "Login success";
    if (type === "LOGIN_FAIL") return "Login failed";
    if (type === "LOCKOUT") return "IP locked out";
    if (type === "LOGOUT") return "Logout";
    if (type === "TOKEN_EXPIRED") return "Token expired";
    return type;
  };

  if (loading && !isGuestSession)
    return (
      <>
        <style>{CSS}</style>
        <div className="d-loading">
          <div className="d-spinner" />
          <p className="d-loading-txt">LOADING SECURITY DATA...</p>
        </div>
      </>
    );

  const total = stats?.totalLoginAttempts || 0;
  const success = stats?.successfulLogins || 0;
  const failed = stats?.failedLogins || 0;
  const successPct = total > 0 ? Math.round((success / total) * 100) : 0;
  const failPct = total > 0 ? Math.round((failed / total) * 100) : 0;

  return (
    <>
      <style>{CSS}</style>

      {showExpired && (
        <div className="d-expired-overlay">
          <div className="d-expired-box">
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⏱</div>
            <h2 className="d-expired-title">Session Expired</h2>
            <p className="d-expired-sub">
              Guest session has ended. Returning to login...
            </p>
          </div>
        </div>
      )}

      <div className="d-root">
        {/* Top bar */}
        <div className="d-topbar">
          <div className="d-topbar-left">
            <div className="d-status-dot" />
            <span className="d-status-txt">
              ZERO TRUST — SECURITY DASHBOARD
            </span>
          </div>
          <div className="d-topbar-right">
            <span className="d-clock">{fmtTime(time)}</span>
            {isGuestSession && (
              <span
                className="d-guest-timer"
                style={{
                  color: guestTimeLeft < 60 ? "#f87171" : "#fbbf24",
                }}
              >
                ⚠ Guest: {fmt(guestTimeLeft)}
              </span>
            )}
            {!isGuestSession && (
              <button
                className="d-vault-btn"
                onClick={() => navigate("/vault")}
              >
                ← Vault
              </button>
            )}
            <button className="d-exit-btn" onClick={() => navigate("/")}>
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="d-content">
          {error && <div className="d-error">{error}</div>}

          {/* Guest session view */}
          {isGuestSession && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "calc(100vh - 120px)",
                gap: "16px",
                fontFamily: "'Segoe UI', sans-serif",
              }}
            >
              <div style={{ fontSize: "48px" }}>✓</div>
              <h1
                style={{
                  fontSize: "clamp(24px, 4vw, 40px)",
                  fontWeight: 800,
                  letterSpacing: "3px",
                  background: "linear-gradient(135deg, #4ade80, #22d3ee)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Temporary Access Active
              </h1>
              <p
                style={{
                  color: "rgba(224,231,255,0.5)",
                  fontSize: "14px",
                  textAlign: "center",
                }}
              >
                Your session will expire automatically. Dashboard data is
                restricted to administrators.
              </p>
              <p
                style={{
                  color: guestTimeLeft < 60 ? "#f87171" : "#fbbf24",
                  fontSize: "24px",
                  fontFamily: "monospace",
                  fontWeight: 700,
                }}
              >
                {fmt(guestTimeLeft)}
              </p>
            </div>
          )}

          {/* Full dashboard — admin only */}
          {!isGuestSession && (
            <>
              <div className="d-hero">
                <h1 className="d-hero-title">Security Dashboard</h1>
                <p className="d-hero-sub">
                  Live monitoring — refreshes every 5 seconds
                </p>
              </div>

              <div className="d-stats-grid">
                <StatCard
                  label="Total Attempts"
                  value={total}
                  color="#38bdf8"
                  icon="◎"
                />
                <StatCard
                  label="Successful Logins"
                  value={success}
                  color="#4ade80"
                  icon="◉"
                />
                <StatCard
                  label="Failed Logins"
                  value={failed}
                  color="#f87171"
                  icon="✕"
                />
                <StatCard
                  label="Total Logouts"
                  value={stats?.activeLogouts || 0}
                  color="#818cf8"
                  icon="↩"
                />
                <StatCard
                  label="Locked IPs"
                  value={stats?.currentlyLockedIPs || 0}
                  color="#ef4444"
                  icon="⛔"
                />
                <StatCard
                  label="Server Uptime"
                  value={fmtUptime(uptime)}
                  color="#fbbf24"
                  icon="◷"
                  small
                />
              </div>

              <div className="d-section-title">LOGIN RATIO</div>
              <div className="d-ratio-card">
                <div className="d-ratio-labels">
                  <span style={{ color: "#4ade80" }}>
                    ✓ Success {successPct}%
                  </span>
                  <span
                    style={{
                      color: "rgba(224,231,255,0.4)",
                      fontSize: "11px",
                    }}
                  >
                    {total} total attempts
                  </span>
                  <span style={{ color: "#f87171" }}>
                    ✕ Failed {failPct}%
                  </span>
                </div>
                <div className="d-ratio-bar">
                  <div
                    className="d-ratio-success"
                    style={{ width: `${successPct}%` }}
                  />
                  <div
                    className="d-ratio-fail"
                    style={{ width: `${failPct}%` }}
                  />
                </div>
              </div>

              <div className="d-section-title" style={{ marginTop: "32px" }}>
                SERVICE HEALTH
              </div>
              <div className="d-services-grid">
                {Object.entries(stats?.services || {}).map(([name, svc]) => (
                  <div key={name} className="d-service-card">
                    <div
                      className="d-service-dot"
                      style={{
                        background:
                          svc.status === "ONLINE" ? "#4ade80" : "#f87171",
                        boxShadow:
                          svc.status === "ONLINE"
                            ? "0 0 8px #4ade80"
                            : "0 0 8px #f87171",
                      }}
                    />
                    <div>
                      <p className="d-service-name">{name.toUpperCase()}</p>
                      <p className="d-service-latency">{svc.latency}</p>
                    </div>
                    <span
                      className="d-service-status"
                      style={{
                        color:
                          svc.status === "ONLINE" ? "#4ade80" : "#f87171",
                        borderColor:
                          svc.status === "ONLINE"
                            ? "rgba(74,222,128,0.3)"
                            : "rgba(248,113,113,0.3)",
                      }}
                    >
                      {svc.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="d-section-title" style={{ marginTop: "32px" }}>
                LIVE SECURITY EVENTS
                <span className="d-live-badge">● LIVE</span>
              </div>
              <div className="d-log">
                {!stats?.recentEvents || stats.recentEvents.length === 0 ? (
                  <div className="d-log-empty">
                    No security events recorded yet
                  </div>
                ) : (
                  stats.recentEvents.map((ev, i) => (
                    <div key={i} className="d-log-row">
                      <span className="d-log-time">{fmtTs(ev.timestamp)}</span>
                      <span
                        className="d-log-type"
                        style={{ color: eventColor(ev.type) }}
                      >
                        {eventLabel(ev.type)}
                      </span>
                      <span className="d-log-detail">
                        {ev.details?.username &&
                          `user: ${ev.details.username}`}
                        {ev.details?.ip && ` · ip: ${ev.details.ip}`}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, color, icon, small }) {
  return (
    <div className="d-stat-card">
      <span className="d-stat-icon" style={{ color }}>
        {icon}
      </span>
      <span
        className="d-stat-value"
        style={{ color, fontSize: small ? "14px" : "24px" }}
      >
        {value}
      </span>
      <span className="d-stat-label">{label}</span>
    </div>
  );
}

const CSS = `
@keyframes dfadein { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
@keyframes dspin   { to{transform:rotate(360deg);} }
@keyframes dpulse  { 0%,100%{opacity:0.4;} 50%{opacity:1;} }

.d-root {
  min-height:100vh;
  background:#050818;
  background-image:
    radial-gradient(ellipse at 10% 40%, rgba(99,102,241,0.05) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 10%, rgba(56,189,248,0.04) 0%, transparent 45%);
  font-family:'Segoe UI',sans-serif;
  color:#e0e7ff;
  position:relative;
}

.d-loading {
  min-height:100vh; background:#050818;
  display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:20px;
}
.d-spinner {
  width:36px; height:36px;
  border:2px solid rgba(99,102,241,0.2);
  border-top-color:#818cf8; border-radius:50%;
  animation:dspin 0.8s linear infinite;
}
.d-loading-txt { color:rgba(129,140,248,0.7); font-size:11px; letter-spacing:3px; }

.d-topbar {
  position:sticky; top:0; z-index:100;
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 32px;
  background:rgba(5,8,24,0.88);
  border-bottom:1px solid rgba(99,102,241,0.18);
  backdrop-filter:blur(14px);
}
.d-topbar-left { display:flex; align-items:center; gap:10px; }
.d-status-dot {
  width:8px; height:8px; border-radius:50%;
  background:#4ade80; box-shadow:0 0 8px #4ade80;
  animation:dpulse 2s ease-in-out infinite;
}
.d-status-txt { color:rgba(74,222,128,0.7); font-size:10px; letter-spacing:2px; }
.d-topbar-right { display:flex; align-items:center; gap:14px; }
.d-clock { color:rgba(129,140,248,0.7); font-size:13px; font-family:monospace; letter-spacing:1px; }
.d-guest-timer { font-size:11px; font-family:monospace; letter-spacing:1px; }
.d-vault-btn {
  padding:6px 16px; background:transparent;
  border:1px solid rgba(129,140,248,0.35); color:rgba(129,140,248,0.8);
  border-radius:6px; font-size:11px; letter-spacing:1px; cursor:pointer; transition:all .2s;
}
.d-vault-btn:hover { background:rgba(129,140,248,0.08); color:#818cf8; }
.d-exit-btn {
  padding:6px 16px; background:transparent;
  border:1px solid rgba(248,113,113,0.35); color:rgba(248,113,113,0.8);
  border-radius:6px; font-size:11px; letter-spacing:1px; cursor:pointer; transition:all .2s;
}
.d-exit-btn:hover { background:rgba(248,113,113,0.08); color:#f87171; }

.d-content {
  max-width:1100px; margin:0 auto;
  padding:48px 24px 80px;
  animation:dfadein 0.6s ease-out;
}

.d-error {
  background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);
  border-radius:10px; padding:14px; color:#f87171;
  font-size:12px; text-align:center; margin-bottom:24px;
}

.d-hero { text-align:center; margin-bottom:48px; }
.d-hero-title {
  font-size:clamp(28px,5vw,52px); font-weight:800; letter-spacing:4px;
  background:linear-gradient(135deg,#e0e7ff 0%,#818cf8 50%,#38bdf8 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  background-clip:text; margin-bottom:10px;
}
.d-hero-sub { color:rgba(224,231,255,0.35); font-size:12px; letter-spacing:2px; }

.d-stats-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(160px,1fr));
  gap:14px; margin-bottom:32px;
}
.d-stat-card {
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.07);
  border-radius:12px; padding:20px 14px;
  display:flex; flex-direction:column; align-items:center; gap:8px;
  transition:border-color .2s;
}
.d-stat-card:hover { border-color:rgba(129,140,248,0.2); }
.d-stat-icon { font-size:18px; }
.d-stat-value { font-size:24px; font-weight:800; letter-spacing:1px; }
.d-stat-label { color:rgba(224,231,255,0.35); font-size:10px; letter-spacing:1.5px; text-align:center; }

.d-section-title {
  color:rgba(129,140,248,0.55); font-size:10px; letter-spacing:3px;
  margin-bottom:14px; padding-bottom:8px;
  border-bottom:1px solid rgba(99,102,241,0.12);
  display:flex; align-items:center; gap:10px;
}
.d-live-badge {
  color:#4ade80; font-size:9px; letter-spacing:2px;
  animation:dpulse 1.5s ease-in-out infinite;
}

.d-ratio-card {
  background:rgba(255,255,255,0.02);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:12px; padding:20px 24px;
}
.d-ratio-labels {
  display:flex; justify-content:space-between; margin-bottom:12px;
  font-size:12px; font-weight:600; letter-spacing:1px;
}
.d-ratio-bar {
  height:8px; background:rgba(255,255,255,0.06);
  border-radius:4px; overflow:hidden; display:flex;
}
.d-ratio-success {
  height:100%; background:linear-gradient(90deg,#4ade80,#22d3ee);
  border-radius:4px 0 0 4px; transition:width .6s ease;
}
.d-ratio-fail {
  height:100%; background:linear-gradient(90deg,#f87171,#ef4444);
  transition:width .6s ease;
}

.d-services-grid {
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:14px;
}
.d-service-card {
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.07);
  border-radius:12px; padding:18px 20px;
  display:flex; align-items:center; gap:14px;
}
.d-service-dot {
  width:10px; height:10px; border-radius:50%; flex-shrink:0;
  animation:dpulse 2s ease-in-out infinite;
}
.d-service-name { color:#e0e7ff; font-size:13px; font-weight:600; letter-spacing:1px; }
.d-service-latency { color:rgba(224,231,255,0.35); font-size:11px; margin-top:2px; }
.d-service-status {
  margin-left:auto; font-size:9px; letter-spacing:2px; font-weight:700;
  padding:3px 10px; border-radius:20px; border:1px solid;
}

.d-log {
  background:rgba(0,0,0,0.25);
  border:1px solid rgba(255,255,255,0.05);
  border-radius:12px; overflow:hidden;
}
.d-log-empty {
  padding:24px; text-align:center;
  color:rgba(224,231,255,0.25); font-size:12px; letter-spacing:1px;
}
.d-log-row {
  display:grid;
  grid-template-columns:70px 130px 1fr;
  gap:14px; padding:11px 20px;
  border-bottom:1px solid rgba(255,255,255,0.03);
  font-size:11px; font-family:monospace; align-items:center;
}
.d-log-row:last-child { border-bottom:none; }
.d-log-row:hover { background:rgba(255,255,255,0.02); }
.d-log-time   { color:rgba(224,231,255,0.25); }
.d-log-type   { font-weight:700; letter-spacing:.5px; }
.d-log-detail { color:rgba(224,231,255,0.4); }

.d-expired-overlay {
  position:fixed; inset:0; z-index:999;
  background:rgba(0,0,0,0.75);
  display:flex; align-items:center; justify-content:center;
}
.d-expired-box {
  background:#0a0e27;
  border:1px solid rgba(248,113,113,0.4);
  border-radius:16px; padding:40px; text-align:center;
  animation:dfadein 0.4s ease-out;
  font-family:'Segoe UI',sans-serif;
}
.d-expired-title { color:#f87171; font-size:20px; font-weight:700; margin-bottom:8px; }
.d-expired-sub { color:rgba(224,231,255,0.5); font-size:13px; }

@media(max-width:600px){
  .d-topbar { padding:10px 16px; }
  .d-status-txt { display:none; }
  .d-content { padding:28px 16px 60px; }
  .d-log-row { grid-template-columns:60px 1fr; }
  .d-log-detail { display:none; }
}
`;