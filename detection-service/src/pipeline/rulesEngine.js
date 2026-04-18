const stateTracker = require("./stateTracker");

const RULES = [
  {
    id: "BRUTE_FORCE_001",
    description: "Multiple failed login attempts",
    match: (log) => log.event_type === "LOGIN_FAIL",
    evaluate: (log, state) => {
      // 10 failed logins within 60 seconds
      const recent = state.failed_logins.filter(t => Date.now() - t < 60000);
      if (recent.length >= 10) {
        return {
          matched: true,
          evidence: {
            failed_attempts: recent.length,
            time_window: "60s"
          }
        };
      }
      return { matched: false };
    }
  },
  {
    id: "PORT_SCAN_001",
    description: "Rapid scanning of multiple diverse ports",
    match: (log) => log.event_type === "NETWORK_CONN",
    evaluate: (log, state) => {
      // Accessing 5+ unique ports
      if (state.ports.size >= 5) {
        return {
          matched: true,
          evidence: {
            ports_scanned: state.ports.size,
            unique_ports: Array.from(state.ports)
          }
        };
      }
      return { matched: false };
    }
  },
  {
    id: "WEB_ATTACK_SQLI",
    description: "SQL Injection Patterns in URL",
    match: (log) => {
      if (!log.endpoint) return false;
      const url = log.endpoint.toLowerCase();
      const sqliPattern = /(\%27)|(\')|(\-\-)|(\%23)|(#)|(union select)|(or 1=1)/i;
      return sqliPattern.test(url);
    },
    evaluate: (log) => ({ matched: true, evidence: { endpoint: log.endpoint } })
  },
  {
    id: "WEB_ATTACK_XSS",
    description: "Cross-Site Scripting Patterns in URL",
    match: (log) => {
      if (!log.endpoint) return false;
      const url = log.endpoint.toLowerCase();
      const xssPattern = /(<script>)|(javascript:)|(onerror=)/i;
      return xssPattern.test(url);
    },
    evaluate: (log) => ({ matched: true, evidence: { endpoint: log.endpoint } })
  },
  {
    id: "ADMIN_PAGES_ABUSE",
    description: "Suspicious access to administrative endpoints",
    match: (log) => {
      if (!log.endpoint) return false;
      return log.endpoint.includes("/admin") || log.endpoint.includes("/root") || log.endpoint.includes("/config");
    },
    evaluate: (log) => ({ matched: true, evidence: { endpoint: log.endpoint } })
  }
];

class RulesEngine {
  run(log) {
    const alertsTriggered = [];
    const state = stateTracker.getIpState(log.src_ip);

    for (const rule of RULES) {
      if (rule.match(log)) {
        const result = rule.evaluate(log, state);
        if (result.matched) {
          alertsTriggered.push({
            rule_id: rule.id,
            description: rule.description,
            evidence: result.evidence
          });
        }
      }
    }
    return alertsTriggered;
  }
}

module.exports = new RulesEngine();
