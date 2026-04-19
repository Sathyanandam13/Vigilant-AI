const Incident = require("../../models/Incident");
const Redis = require("ioredis");
const redisPub = new Redis({ host: "localhost", port: 6379 });

class IncidentEngine {
  constructor() {
    this.memory = new Map();
  }

  async processAlert(alertDocument) {
    const ip = alertDocument.sourceIp;
    if (!ip) return;

    let incident = await Incident.findOne({ ip, status: { $in: ["OPEN", "INVESTIGATING"] } });

    if (incident) {
      // Update existing incident
      incident.alertsCount += 1;
      incident.relatedAlerts.push(alertDocument._id.toString());
      incident.updatedAt = new Date();

      // Escalate Severity
      const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      if (severities.indexOf(alertDocument.severity) > severities.indexOf(incident.severity)) {
        incident.severity = alertDocument.severity;
      }

      await incident.save();
      redisPub.publish("incidents", JSON.stringify(incident));
      console.log(`[Incident Engine] Escalated Incident for IP ${ip}`);

    } else {
      // Create new Incident for HIGH/CRITICAL alerts
      if (["HIGH", "CRITICAL"].includes(alertDocument.severity)) {
        const newInc = await Incident.create({
          name: `Correlated Attacks from ${ip}`,
          status: "OPEN",
          severity: alertDocument.severity,
          description: `Automated incident discovery via high-confidence security alerts.`,
          alertsCount: 1,
          relatedAlerts: [alertDocument._id.toString()],
          ip: ip,
          timestamp: alertDocument.timestamp,
          updatedAt: alertDocument.timestamp,
          notes: [{ text: "Incident automatically created by SOC Detection Engine.", author: "SYSTEM" }]
        });

        redisPub.publish("incidents", JSON.stringify(newInc));
        console.log(`[Incident Engine] Created new Incident: ${newInc.name}`);
      }
    }
  }
}

module.exports = new IncidentEngine();

