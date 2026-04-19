const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");

const Alert = require("./models/Alert");
const Log = require("./models/Log");
const normalizer = require("./src/pipeline/normalizer");
const stateTracker = require("./src/pipeline/stateTracker");
const rulesEngine = require("./src/pipeline/rulesEngine");
const correlationEngine = require("./src/pipeline/correlationEngine");
const incidentEngine = require("./src/pipeline/incidentEngine");
const threatIntel = require("./src/pipeline/threatIntel");


// MongoDB
mongoose.connect("mongodb://localhost:27017/socdb")
  .then(() => console.log("MongoDB Connected for Detection Service"))
  .catch(err => console.error(err));

// Redis Pub/Sub for real-time dashboard updates
const Redis = require("ioredis");
const redisPub = new Redis({ host: "localhost", port: 6379 });


// Kafka
const kafka = new Kafka({
  clientId: "detection-service",
  brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({ groupId: "detection-group" });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "nginx-logs" });
  await consumer.subscribe({ topic: "zeek-logs" });

  console.log("Distributed Detection Service running...");

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        //const rawLog = JSON.parse(message.value.toString());
        const raw = message.value.toString();
        console.log("RAW MESSAGE:", raw); // 👈 ADD THIS

        const rawLog = JSON.parse(raw);

        console.log("PARSED LOG:", rawLog); // 👈 ADD THIS

        const normalized = normalizer.process(rawLog);
        console.log("NORMALIZED:", normalized);

        await Log.create(normalized);
        console.log("LOG SAVED TO DB");
        redisPub.publish("logs", JSON.stringify(normalized));

        // 2. Track State (Persistent Redis)
        await stateTracker.update(normalized);

        // 3. Rules Engine (Async for Redis lookup)
        const ruleViolations = await rulesEngine.run(normalized);

        // 4. Correlation & Severity (Requires state for cross-source context)
        const state = await stateTracker.getIpState(normalized.src_ip);
        const alertData = correlationEngine.correlate(ruleViolations, normalized, state);

        // 5. Threat Intel Integration
        if (alertData && threatIntel.isMalicious(normalized.src_ip)) {
          alertData.severity = "CRITICAL";
          alertData.confidence = 1.0;
          alertData.type += " | MATCHED_THREAT_INTEL";
        }

        // 6. Generate Alert
        if (alertData) {
          const alertDoc = await Alert.create(alertData);
          console.log(`🚨 ALERT RAISED: [${alertData.severity}] ${alertData.type} - Confidence: ${alertData.confidence}`);
          redisPub.publish("alerts", JSON.stringify(alertDoc));

          // 6. Push to Incident Engine
          await incidentEngine.processAlert(alertDoc);
        }



      } catch (e) {
        console.error("Error processing message:", e);
      }
    }
  });
};

run().catch(console.error);