const { Kafka } = require("kafkajs");
const mongoose = require("mongoose");

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/socdb")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// Schema
const LogSchema = new mongoose.Schema({
  source: String,
  type: String,
  timestamp: Date,
  data: Object
});

const Log = mongoose.model("Log", LogSchema);

// Kafka setup
const kafka = new Kafka({
  clientId: "test-consumer",
  brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({ groupId: "test-group" });

const run = async () => {
  try {
    await consumer.connect();
    console.log("Consumer connected");

    await consumer.subscribe({ topic: "nginx-logs" });
await consumer.subscribe({ topic: "zeek-logs" });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const log = JSON.parse(message.value.toString());

          await Log.create(log);

          console.log("Stored in Mongo:", log.source);
        } catch (err) {
          console.error("Error processing message:", err);
        }
      }
    });

  } catch (err) {
    console.error("Consumer error:", err);
  }
};

run();