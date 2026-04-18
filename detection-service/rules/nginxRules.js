function detectNginx(log) {
  const status = log.data.status;

  // Failed login attempt
  if ([401, 403].includes(status)) {
    return {
      type: "FAILED_LOGIN",
      source: "nginx",
      severity: "MEDIUM",
      timestamp: new Date(),
      data: log.data
    };
  }

  return null;
}

module.exports = detectNginx;