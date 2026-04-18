const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'attack-simulator',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
  await producer.connect();
  console.log("Attack Simulator Connected to Kafka.");

  const sendNginx = async (payload) => {
    await producer.send({
      topic: 'nginx-logs',
      messages: [{ value: JSON.stringify(payload) }]
    });
  };

  const sendZeek = async (payload) => {
    await producer.send({
      topic: 'zeek-logs',
      messages: [{ value: JSON.stringify(payload) }]
    });
  };

  const ATTACK_IP = "5.5.5.5";
  const TARGET_IP = "192.168.1.100";

  console.log("--- Commencing Brute Force Simulation ---");
  for (let i = 0; i < 12; i++) {
    await sendNginx({
      source: "nginx",
      ip: ATTACK_IP,
      url: "/login",
      status: 401,
      timestamp: Date.now()
    });
    await delay(100); 
  }
  
  await delay(2000);

  console.log("--- Commencing Port Scan Simulation ---");
  const ports = [22, 80, 443, 3306, 8080, 21, 23];
  for (let port of ports) {
    await sendZeek({
      source: "zeek",
      src_ip: ATTACK_IP,
      dest_ip: TARGET_IP,
      dest_port: port,
      proto: "TCP",
      timestamp: Date.now()
    });
    await delay(50);
  }

  await delay(2000);

  console.log("--- Commencing Web Attack Simulation (SQLi) ---");
  await sendNginx({
    source: "nginx",
    ip: ATTACK_IP,
    url: "/api/users?id=1' OR 1=1--",
    status: 200,
    timestamp: Date.now()
  });

  console.log("--- Commencing Web Attack Simulation (XSS) ---");
  await sendNginx({
    source: "nginx",
    ip: ATTACK_IP,
    url: "/search?q=<script>alert(1)</script>",
    status: 200,
    timestamp: Date.now()
  });

  console.log("Simulation payloads pushed completely.");
  await producer.disconnect();
};

run().catch(console.error);
