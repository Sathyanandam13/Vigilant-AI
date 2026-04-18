const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  timestamp: Date,
  src_ip: String,
  dest_ip: String,
  dest_port: Number,
  event_type: String,
  endpoint: String,
  status_code: Number,
  protocol: String,
  source: String,
  raw_log: Object // original unnormalized payload
});

module.exports = mongoose.model("Log", LogSchema);
