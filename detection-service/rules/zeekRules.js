function detectZeek(log) {
  const port = log.data.dest_port;

  // Suspicious ports
  if ([22, 23, 3389].includes(port)) {
    return {
      type: "SUSPICIOUS_PORT",
      source: "zeek",
      severity: "HIGH",
      timestamp: new Date(),
      data: log.data
    };
  }

  return null;
}

module.exports = detectZeek;