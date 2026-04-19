class CorrelationEngine {
  calculateScore(ruleViolations, log, state) {
    let score = 0;

    const WEIGHTS = {
      "BRUTE_FORCE": 40,
      "PORT_SCAN": 30,
      "WEB_ATTACK": 50,
      "ADMIN": 30,
      "TRAFFIC_SPIKE": 20,
      "ANOMALOUS": 25
    };

    // Base rule scoring
    for (const v of ruleViolations) {
      const category = Object.keys(WEIGHTS).find(c => v.rule_id.includes(c));
      if (category) {
        score += WEIGHTS[category];
      }
    }

    // Cross-source correlation (Web + Network) escalation
    const hasNetworkScan = ruleViolations.some(v => v.rule_id.includes("PORT_SCAN"));
    const hasWebAttack = ruleViolations.some(v => v.rule_id.includes("WEB_ATTACK"));
    const hasBruteForce = ruleViolations.some(v => v.rule_id.includes("BRUTE_FORCE"));

    if (hasNetworkScan && (hasWebAttack || hasBruteForce)) {
      score *= 1.5; // 50% escalation for specific hybrid attacks
    } else {
      const hasWeb = log.source === "nginx" || (state.endpoints && state.endpoints.size > 0);
      const hasNetwork = log.source === "zeek" || (state.ports && state.ports.size > 0);
      if (hasWeb && hasNetwork && score > 0) {
        score *= 1.2; // 20% escalation for generic hybrid activity
      }
    }

    // Velocity penalty
    if (state.req_count > 200) {
      score += 20;
    }

    return Math.min(score, 120); // Cap at 120
  }

  getSeverityLabel(score) {
    if (score < 40) return "LOW";
    if (score < 70) return "MEDIUM";
    if (score < 100) return "HIGH";
    return "CRITICAL";
  }

  getConfidence(score) {
    return Math.min(score / 100, 1.0).toFixed(2);
  }


  correlate(ruleViolations, log, state) {
    if (ruleViolations.length === 0) return null;

    const score = this.calculateScore(ruleViolations, log, state);
    const severity = this.getSeverityLabel(score);
    const confidence = this.getConfidence(score);

    // Merge evidence
    let combinedEvidence = {};
    ruleViolations.forEach(v => {
      combinedEvidence[v.rule_id] = v.evidence;
    });

    return {
      type: ruleViolations.map(v => v.rule_id).join(" | "),
      source: log.source,
      severity,
      confidence: parseFloat(confidence),
      sourceIp: log.src_ip,
      evidence: combinedEvidence,
      timestamp: log.timestamp,
      data: log.raw_log
    };
  }
}

module.exports = new CorrelationEngine();
