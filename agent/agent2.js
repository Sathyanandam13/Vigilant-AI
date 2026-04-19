const fs = require("fs");
const { Kafka } = require("kafkajs");

const LOG_FILE = "/home/sathyanandam/conn.log";

const kafka = new Kafka({
  clientId: "zeek-agent",
  brokers: ["localhost:9092"]
});

const producer = kafka.producer();

let fieldMap = {};
let lastSize = 0;

// ✅ Validate IP (IPv4 + IPv6)
function isValidIP(ip) {
  return typeof ip === "string" && (ip.includes(".") || ip.includes(":"));
}

// ✅ Parse Zeek log safely
function parseZeekLog(line) {
  const parts = line.split("\t");

  const src_ip = parts[fieldMap["id.orig_h"]];
  const dest_ip = parts[fieldMap["id.resp_h"]];
  const dest_port_raw = parts[fieldMap["id.resp_p"]];

  if (!src_ip || !dest_ip) return null;
  if (!isValidIP(dest_ip)) return null;

  return {
    source: "zeek",
    type: "conn_log",
    timestamp: new Date().toISOString(),
    data: {
      src_ip,
      dest_ip,
      dest_port: parseInt(dest_port_raw) || null
    }
  };
}

// ✅ Process new data only (real-time style)
async function processFile() {
  try {
    const stats = fs.statSync(LOG_FILE);
    const currentSize = stats.size;

    // No new data
    if (currentSize <= lastSize) return;

    const stream = fs.createReadStream(LOG_FILE, {
      start: lastSize,
      end: currentSize,
      encoding: "utf8"
    });

    let data = "";

    stream.on("data", chunk => {
      data += chunk;
    });

    stream.on("end", async () => {
      const lines = data.split("\n").filter(line => line);

      for (const line of lines) {

        // ✅ Handle schema definition
        if (line.startsWith("#fields")) {
          const fields = line.split("\t").slice(1);

          fieldMap = {};
          fields.forEach((field, index) => {
            fieldMap[field] = index;
          });

          console.log("FIELD MAP:", fieldMap);
          continue; // 🔥 FIXED (not return)
        }

        // Skip comments
        if (line.startsWith("#")) continue;

        // Wait until schema is ready
        if (!fieldMap["id.orig_h"] || !fieldMap["id.resp_h"]) continue;

        const parsed = parseZeekLog(line);
        if (!parsed) continue;

        try {
          await producer.send({
            topic: "zeek-logs",
            messages: [{ value: JSON.stringify(parsed) }]
          });

          console.log("Sent:", parsed.data.src_ip);
        } catch (err) {
          console.error("Kafka error:", err.message);
        }
      }
    });

    lastSize = currentSize;

  } catch (err) {
    console.error("File error:", err.message);
  }
}

// ✅ Start agent
async function start() {
  await producer.connect();
  console.log("Zeek agent started (real-time)...");

  // Run every 2 seconds
  setInterval(processFile, 2000);
}

start().catch(console.error);