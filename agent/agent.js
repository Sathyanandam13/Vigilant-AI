const fs = require("fs");
const { Kafka } = require("kafkajs");

const LOG_FILE = "/var/log/nginx/access.log";

const kafka = new Kafka({
  clientId: "nginx-agent",
  brokers: ["localhost:9092"]
});

const producer = kafka.producer();

let fileSize = 0;

function parseLog(line) {
  const regex = /^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3})/;
  const match = line.match(regex);

  if (!match) return null;

  return {
    source: "nginx",
    timestamp: new Date().toISOString(),
    data: {
      ip: match[1],
      method: match[3],
      endpoint: match[4],
      status: parseInt(match[5])
    }
  };
}

async function start() {
  await producer.connect();
  console.log("Agent started (tail mode)...");

  setInterval(() => {
    const stats = fs.statSync(LOG_FILE);

    if (stats.size > fileSize) {
      const stream = fs.createReadStream(LOG_FILE, {
        start: fileSize,
        end: stats.size,
        encoding: "utf8"
      });

      let buffer = "";

      stream.on("data", async (chunk) => {
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const parsed = parseLog(line);
          if (!parsed) continue;

          await producer.send({
            topic: "nginx-logs",
            messages: [{ value: JSON.stringify(parsed) }]
          });

          console.log("Sent:", parsed.data.ip);
        }
      });

      fileSize = stats.size;
    }
  }, 1000);
}

start();