const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/socdb")
  .then(() => console.log("MongoDB Connected for Alerts API"))
  .catch(err => console.error(err));

// --- Schemas ---
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
  raw_log: Object
});
const Log = mongoose.model("Log", LogSchema);

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
const Alert = mongoose.model("Alert", AlertSchema);

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
const Incident = mongoose.model("Incident", IncidentSchema);


// --- Routes ---

// Alerts
app.get("/alerts", async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(100);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/alerts/:id", async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Not found" });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/alerts/:id", async (req, res) => {
  try {
    const { status, assignee } = req.body;
    let updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (assignee !== undefined) updateFields.assignee = assignee;

    const alert = await Alert.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Incidents
app.get("/incidents", async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ updatedAt: -1 }).limit(50);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logs Explorer
app.get("/logs", async (req, res) => {
  try {
    const { query } = req.query;
    let filter = {};
    
    if (query) {
      // Basic free-text search simulation across IP and event types
      filter = {
        $or: [
          { src_ip: new RegExp(query, 'i') },
          { event_type: new RegExp(query, 'i') },
          { endpoint: new RegExp(query, 'i') }
        ]
      };
    }

    const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(200);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start API Server
app.listen(5000, () => {
  console.log("SOC Alerts API running on port 5000");
});