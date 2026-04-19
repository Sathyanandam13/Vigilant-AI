const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "test-producer",
  brokers: ["localhost:9092"]
});

const producer = kafka.producer();

const run = async () => {
  try {
    await producer.connect();
    console.log("Producer connected");

    const log = {
      source: "test",
      type: "demo",
      timestamp: new Date().toISOString(),
      data: {
        message: "Hello SOC",
        ip: "192.168.1.10"
      }
    };

    await producer.send({
      topic: "test-topic",
      messages: [
        { value: JSON.stringify(log) }
      ]
    });

    console.log("Message sent to Kafka");

    await producer.disconnect();
  } catch (err) {
    console.error("Producer error:", err);
  }
};

run();