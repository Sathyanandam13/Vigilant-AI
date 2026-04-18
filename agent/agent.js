const fs = require("fs");
const { Kafka } = require("kafkajs");

const LOG_FILE = "/var/log/nginx/access.log";

let lastSize = 0;

// Kafka setup
const kafka = new Kafka({
  clientId: "nginx-agent",
  brokers: ["localhost:9092"]
});

const producer = kafka.producer();

// Parse nginx log
function parseLog(line) {
  const regex = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3})/;

  const match = line.match(regex);

  if (!match) {
    console.error("Failed to parse:", line);
    return null;
  }

  return {
    source: "nginx",
    type: "access_log",
    timestamp: new Date().toISOString(),
    data: {
      ip: match[1],
      method: match[3],
      endpoint: match[4],
      status: parseInt(match[5])
    }
  };
}

// Send to Kafka
async function sendToKafka(log) {
  await producer.send({
    topic: "nginx-logs",
    messages: [{ value: JSON.stringify(log) }]
  });
}

// Process new logs
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
        const lines = data.split("\n").filter(line => line);

        for (const line of lines) {
          const parsed = parseLog(line);
          await sendToKafka(parsed);
          console.log("Sent log:", parsed.data.ip);
        }
      });

      lastSize = currentSize;
    }

  } catch (err) {
    console.error("Error reading log file:", err.message);
  }
}

// Start agent
async function start() {
  await producer.connect();
  console.log("Agent started (polling)...");

  setInterval(processLogs, 3000); // every 3 seconds
}

start();