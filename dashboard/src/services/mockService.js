import { v4 as uuidv4 } from "uuid";

// Mock Data Seed
const generateMockAlerts = (num = 50) => {
  const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  const statuses = ["Open", "In Progress", "Resolved", "False Positive"];
  const types = ["Brute Force", "Malware Detected", "Privilege Escalation", "Suspicious Login", "Data Exfiltration"];
  const IPs = ["192.168.1.10", "10.0.0.5", "172.16.0.42", "8.8.8.8", "1.1.1.1"];
  
  return Array.from({ length: num }).map(() => {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: uuidv4(),
      type: types[Math.floor(Math.random() * types.length)],
      severity,
      status,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
      sourceIp: IPs[Math.floor(Math.random() * IPs.length)],
      destIp: IPs[Math.floor(Math.random() * IPs.length)],
      assignee: status === "Open" ? null : (Math.random() > 0.5 ? "Alice SOC" : "Bob Admin"),
      notes: [],
      rawLog: "[timestamp] src_ip=" + IPs[0] + " action=block protocol=tcp",
    };
  });
};

const generateIncidents = () => {
  return [
    {
      id: uuidv4(),
      name: "Ransomware Activity in Segment D",
      status: "Active",
      severity: "CRITICAL",
      description: "Multiple hosts showing encryption anomalies and lateral movement.",
      alertsCount: 14,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: uuidv4(),
      name: "Suspicious Login Campaign",
      status: "Investigating",
      severity: "MEDIUM",
      description: "Failed SSH logins across 5 different instances.",
      alertsCount: 8,
      timestamp: new Date(Date.now() - 14400000).toISOString()
    }
  ];
};

const MOCK_DB = {
  alerts: generateMockAlerts(),
  incidents: generateIncidents()
};

// Initial state load
if (!localStorage.getItem("soc_mock_db")) {
  localStorage.setItem("soc_mock_db", JSON.stringify(MOCK_DB));
}

// Helper to get fresh data
const getDB = () => JSON.parse(localStorage.getItem("soc_mock_db"));
const saveDB = (data) => localStorage.setItem("soc_mock_db", JSON.stringify(data));

class MockService {
  async getAlerts() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getDB().alerts), 300);
    });
  }

  async getAlertById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const db = getDB();
        const alert = db.alerts.find(a => a.id === id);
        alert ? resolve(alert) : reject(new Error("Alert not found"));
      }, 200);
    });
  }

  async getIncidents() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(getDB().incidents), 300);
    });
  }

  async updateAlertStatus(id, newStatus) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getDB();
        const alert = db.alerts.find(a => a.id === id);
        if (alert) {
          alert.status = newStatus;
          saveDB(db);
        }
        resolve(alert);
      }, 200);
    });
  }

  async assignAlert(id, assignee) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getDB();
        const alert = db.alerts.find(a => a.id === id);
        if (alert) {
          alert.assignee = assignee;
          saveDB(db);
        }
        resolve(alert);
      }, 200);
    });
  }

  async addNote(id, note) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getDB();
        const alert = db.alerts.find(a => a.id === id);
        if (alert) {
          alert.notes.push({
            id: uuidv4(),
            text: note,
            author: "Current User",
            timestamp: new Date().toISOString()
          });
          saveDB(db);
        }
        resolve(alert);
      }, 200);
    });
  }

  // Poll simulator
  subscribeToAlerts(callback) {
    const interval = setInterval(() => {
      const db = getDB();
      // 20% chance to generate new alert
      if (Math.random() > 0.8) {
        const newAlert = generateMockAlerts(1)[0];
        newAlert.status = "Open";
        newAlert.timestamp = new Date().toISOString();
        db.alerts.unshift(newAlert);
        saveDB(db);
        callback(db.alerts);
      }
    }, 5000);
    return () => clearInterval(interval);
  }
}

export const mockAPI = new MockService();
