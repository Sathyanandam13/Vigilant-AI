const Incident = require("../../models/Incident");

class IncidentEngine {
  constructor() {
    this.memory = new Map(); // Simple cache to avoid querying mongodb for every alert
  }

  async processAlert(alertDocument) {
    const ip = alertDocument.sourceIp;
    if (!ip) return;

    // Check if there is already an active incident for this IP
    let incident = null;

    if (this.memory.has(ip)) {
      incident = this.memory.get(ip);
    } else {
      incident = await Incident.findOne({ ip, status: { $in: ["Active", "Investigating"] } });
    }

    if (incident) {
      // Update existing incident
      incident.alertsCount += 1;
      incident.relatedAlerts.push(alertDocument._id.toString());
      incident.updatedAt = new Date();
      
      // Escalate Severity if alert is higher
      const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      const currentIdx = severities.indexOf(incident.severity);
      const newIdx = severities.indexOf(alertDocument.severity);
      if (newIdx > currentIdx) {
        incident.severity = alertDocument.severity;
      }

      await incident.save();
      this.memory.set(ip, incident);
      console.log(`[Incident Engine] Escalated Incident: ${incident.name} for IP ${ip}`);

    } else {
      // If we see HIGH or CRITICAL alerts, create new Incident automatically
      if (["HIGH", "CRITICAL"].includes(alertDocument.severity)) {
        const newInc = await Incident.create({
          name: `Correlated Attacks from ${ip}`,
          severity: alertDocument.severity,
          description: `Automatically created incident due to severe alerts triggering from IP.`,
          alertsCount: 1,
          relatedAlerts: [alertDocument._id.toString()],
          ip: ip,
          timestamp: alertDocument.timestamp,
          updatedAt: alertDocument.timestamp
        });
        
        this.memory.set(ip, newInc);
        console.log(`[Incident Engine] Created new Incident: ${newInc.name}`);
      }
    }
  }
}

module.exports = new IncidentEngine();
