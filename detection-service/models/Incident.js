const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
  name: String,
  status: { type: String, default: "Active" },
  severity: String,
  description: String,
  alertsCount: Number,
  relatedAlerts: [String],
  ip: String,
  timestamp: Date,
  updatedAt: Date
});

module.exports = mongoose.model("Incident", IncidentSchema);
