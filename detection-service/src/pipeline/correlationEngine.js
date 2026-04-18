class CorrelationEngine {
  calculateScore(ruleViolations, log, state) {
    let score = 0;
    
    // Base rule scoring
    for (const v of ruleViolations) {
      if (v.rule_id.startsWith("BRUTE_FORCE")) score += 50;
      if (v.rule_id.startsWith("PORT_SCAN")) score += 30;
      if (v.rule_id.startsWith("WEB_ATTACK")) score += 40;
      if (v.rule_id.startsWith("ADMIN")) score += 20;
    }

    // Cross-source correlation
    const hasNginx = state.requests.length > 0 || state.failed_logins.length > 0;
    const hasZeek = state.ports.size > 0;
    
    if (hasNginx && hasZeek && score > 0) {
      score += 40; // Escalate if crossing boundaries
    }

    // High frequency penalty
    if (state.requests.length > 100) {
      score += 20;
    }

    return score;
  }

  getSeverityLabel(score) {
    if (score < 30) return "LOW";
    if (score < 60) return "MEDIUM";
    if (score < 90) return "HIGH";
    return "CRITICAL";
  }

  getConfidence(score) {
    return Math.min(score / 150, 1.0).toFixed(2);
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
