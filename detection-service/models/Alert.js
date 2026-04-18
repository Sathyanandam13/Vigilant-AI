const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
  type: String,
  source: String,
  severity: String,
  confidence: Number,
  sourceIp: String,
  status: { type: String, default: "Open" },
  assignee: { type: String, default: null },
  evidence: Object,
  timestamp: Date,
  data: Object
});

module.exports = mongoose.model("Alert", AlertSchema);