const serverStartTime = Date.now();

const stats = {
  totalLoginAttempts: 0,
  successfulLogins: 0,
  failedLogins: 0,
  activeLogouts: 0,
  lockedOutIPs: new Set(),
  recentEvents: [],
};

const addEvent = (type, details) => {
  stats.recentEvents.unshift({
    type,
    details,
    timestamp: new Date().toISOString(),
  });
  if (stats.recentEvents.length > 20) {
    stats.recentEvents.pop();
  }
};

const recordLoginAttempt = (success, username, ip) => {
  stats.totalLoginAttempts++;
  if (success) {
    stats.successfulLogins++;
    addEvent("LOGIN_SUCCESS", { username, ip });
  } else {
    stats.failedLogins++;
    addEvent("LOGIN_FAIL", { username, ip });
  }
};

const recordLogout = (username) => {
  stats.activeLogouts++;
  addEvent("LOGOUT", { username });
};

const recordLockout = (ip) => {
  stats.lockedOutIPs.add(ip);
  addEvent("LOCKOUT", { ip });
};

const getStats = () => ({
  totalLoginAttempts: stats.totalLoginAttempts,
  successfulLogins: stats.successfulLogins,
  failedLogins: stats.failedLogins,
  activeLogouts: stats.activeLogouts,
  currentlyLockedIPs: stats.lockedOutIPs.size,
  recentEvents: stats.recentEvents,
  serverStartTime,
  uptime: Math.floor((Date.now() - serverStartTime) / 1000),
});

module.exports = {
  recordLoginAttempt,
  recordLogout,
  recordLockout,
  getStats,
};
