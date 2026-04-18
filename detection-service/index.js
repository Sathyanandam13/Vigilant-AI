const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");

const Alert = require("./models/Alert");
const Log = require("./models/Log");
const normalizer = require("./src/pipeline/normalizer");
const stateTracker = require("./src/pipeline/stateTracker");
const rulesEngine = require("./src/pipeline/rulesEngine");
const correlationEngine = require("./src/pipeline/correlationEngine");
const incidentEngine = require("./src/pipeline/incidentEngine");

// MongoDB
mongoose.connect("mongodb://localhost:27017/socdb")
  .then(() => console.log("MongoDB Connected for Detection Service"))
  .catch(err => console.error(err));

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
        const rawLog = JSON.parse(message.value.toString());
        
        // 1. Normalize
        const normalized = normalizer.process(rawLog);

        // ALWAYS Persist normalized log immediately to support "Logs Explorer"
        await Log.create(normalized);
        
        // 2. Track State
        stateTracker.update(normalized);

        const state = stateTracker.getIpState(normalized.src_ip);
        
        // 3. Rules Engine
        const ruleViolations = rulesEngine.run(normalized);
        
        // 4. Correlation & Severity
        const alertData = correlationEngine.correlate(ruleViolations, normalized, state);

        // 5. Generate Alert
        if (alertData) {
          const alertDoc = await Alert.create(alertData);
          console.log(`🚨 ALERT RAISED: [${alertData.severity}] ${alertData.type} - Confidence: ${alertData.confidence}`);

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