const fs = require("fs");
const { Kafka } = require("kafkajs");

const LOG_FILE = "/home/sathyanandam/conn.log";

let lastSize = 0;
let fieldMap = {}; // stores column positions

// Kafka setup
const kafka = new Kafka({
  clientId: "zeek-agent",
  brokers: ["localhost:9092"]
});

const producer = kafka.producer();

// Parse Zeek log using dynamic field map
function parseZeekLog(line) {
  const parts = line.split("\t");

  return {
    source: "zeek",
    type: "conn_log",
    timestamp: new Date().toISOString(),
    data: {
      src_ip: parts[fieldMap["id.orig_h"]],
      dest_ip: parts[fieldMap["id.resp_h"]],
      dest_port: parseInt(parts[fieldMap["id.resp_p"]])
    }
  };
}

// Send to Kafka
async function sendToKafka(log) {
  await producer.send({
    topic: "zeek-logs",
    messages: [{ value: JSON.stringify(log) }]
  });
}

// Process logs
async function processLogs() {
  try {
    const stats = fs.statSync(LOG_FILE);
    const currentSize = stats.size;

    if (currentSize > lastSize) {
      const stream = fs.createReadStream(LOG_FILE, {
        start: lastSize,
        end: currentSize
      });

      let data = "";

      stream.on("data", chunk => {
        data += chunk.toString();
      });

      stream.on("end", async () => {
        const lines = data.split("\n").filter(l => l);

        for (const line of lines) {

          // Handle schema definition
          if (line.startsWith("#fields")) {
            const fields = line.split("\t").slice(1);

            fieldMap = {}; // reset mapping

            fields.forEach((field, index) => {
              fieldMap[field] = index;
            });

            console.log("Field map updated:", fieldMap);
            continue;
          }

          // Skip comments
          if (line.startsWith("#")) continue;

          // Skip if schema not ready
          if (!fieldMap["id.orig_h"]) continue;

          try {
            const parsed = parseZeekLog(line);
            await sendToKafka(parsed);

            console.log("Zeek sent:", parsed.data.src_ip);
          } catch (err) {
            console.error("Parsing error:", err.message);
          }
        }
      });

      lastSize = currentSize;
    }

  } catch (err) {
    console.error("File error:", err.message);
  }
}

// Start agent
async function start() {
  await producer.connect();
  console.log("Zeek agent started...");

  setInterval(processLogs, 3000);
}

start();