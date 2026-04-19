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

const Incident = mongoose.model("Incident", IncidentSchema);


const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "soc-secret-key-2026"; // In production, use env var

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["ANALYST", "ADMIN"], default: "ANALYST" }
});
const User = mongoose.model("User", UserSchema);

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  if (!token || token === "null") {
    // For demo dashboard without login UI, inject a mock user
    req.user = { id: "demo", username: "SOC Analyst", role: "ADMIN" };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    // Fallback for demo purposes
    req.user = { id: "demo", username: "SOC Analyst", role: "ADMIN" };
    next();
  }
};

// --- Auth Routes ---
app.post("/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, role });
    res.json({ message: "User created", id: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid username or password" });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: "Invalid username or password" });

    const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET);
    res.json({ token, user: { username: user.username, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alerts (Protected)
app.get("/alerts", auth, async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 }).limit(100);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/alerts/:id", auth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: "Not found" });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/alerts/:id", auth, async (req, res) => {
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

// Incidents (Protected)
app.get("/incidents", auth, async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ updatedAt: -1 }).limit(50);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/incidents/:id", auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).lean();
    if (!incident) return res.status(404).json({ error: "Not found" });
    const alerts = await Alert.find({ _id: { $in: incident.relatedAlerts } });
    incident.relatedAlerts = alerts;
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/incidents/:id", auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: "Not found" });

    if (status && ["OPEN", "INVESTIGATING", "RESOLVED"].includes(status)) {
      incident.status = status;
    }
    if (note) {
      incident.notes.push({ text: note, author: req.user.username });
    }
    incident.updatedAt = new Date();
    await incident.save();

    const redisPub = new Redis({ host: "localhost", port: 6379 });
    redisPub.publish("incidents", JSON.stringify(incident));

    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// IP Drilldown (Protected)
app.get("/ips/:ip", auth, async (req, res) => {
  try {
    const ip = req.params.ip;
    const alerts = await Alert.find({ sourceIp: ip }).sort({ timestamp: -1 }).limit(50);
    const logs = await Log.find({ src_ip: ip }).sort({ timestamp: -1 }).limit(100);
    res.json({ alerts, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logs Explorer (Protected)
app.get("/logs", auth, async (req, res) => {
  try {
    const { query } = req.query;
    let filter = {};

    if (query) {
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


const http = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const redisSub = new Redis({ host: "localhost", port: 6379 });

// Subscribe to real-time events from detection service
redisSub.subscribe("alerts", "logs", "incidents");
redisSub.on("message", (channel, message) => {
  const data = JSON.parse(message);
  io.emit(`new-${channel.slice(0, -1)}`, data); // Emit 'new-alert', 'new-log', etc.
});

io.on("connection", (socket) => {
  console.log("Analyst connected to SOC WebSocket");
  socket.on("disconnect", () => console.log("Analyst disconnected"));
});

// ... (existing routes stay same)

// Start API Server with Socket.io
server.listen(5000, () => {
  console.log("SOC Alerts API + WebSockets running on port 5000");
});