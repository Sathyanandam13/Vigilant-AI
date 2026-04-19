const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
  name: String,
  status: { type: String, enum: ["OPEN", "INVESTIGATING", "RESOLVED"], default: "OPEN" },
  severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
  description: String,
  alertsCount: { type: Number, default: 0 },
  relatedAlerts: [String],
  notes: [{
    text: String,
    author: String,
    timestamp: { type: Date, default: Date.now }
  }],
  ip: String,
  timestamp: Date,
  updatedAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model("Incident", IncidentSchema);
