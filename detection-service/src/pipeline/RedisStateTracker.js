const Redis = require("ioredis");

class RedisStateTracker {
    constructor() {
        this.redis = new Redis({
            host: "localhost",
            port: 6379,
        });
        this.redis.on("error", (err) => console.error("Redis Connection Error:", err));
    }

    /**
     * Update state for a given IP based on event
     */
    async update(log) {
        const ip = log.src_ip;
        if (!ip) return;

        const pipeline = this.redis.pipeline();
        const now = Date.now();
        const hour = 3600; // TTL in seconds

        // 1. Track failed logins (List with TTL)
        if (log.event_type === "LOGIN_FAIL") {
            pipeline.lpush(`failed_logins:${ip}`, now);
            pipeline.ltrim(`failed_logins:${ip}`, 0, 99); // Keep last 100
            pipeline.expire(`failed_logins:${ip}`, hour);
        }

        // 2. Track unique ports (Set)
        if (log.dest_port) {
            pipeline.sadd(`ports:${ip}`, log.dest_port);
            pipeline.expire(`ports:${ip}`, hour * 12); // Keep port scan state longer
        }

        // 3. Track unique endpoints
        if (log.endpoint) {
            pipeline.sadd(`endpoints:${ip}`, log.endpoint);
            pipeline.expire(`endpoints:${ip}`, hour);
        }

        // 4. Request Counter
        pipeline.incr(`req_count:${ip}`);
        pipeline.expire(`req_count:${ip}`, hour);

        await pipeline.exec();
    }

    /**
     * Retrieve behavioral state for an IP
     */
    async getIpState(ip) {
        if (!ip) return null;

        const [failedLogins, ports, reqCount, endpoints] = await Promise.all([
            this.redis.lrange(`failed_logins:${ip}`, 0, -1),
            this.redis.smembers(`ports:${ip}`),
            this.redis.get(`req_count:${ip}`),
            this.redis.smembers(`endpoints:${ip}`)
        ]);

        return {
            failed_logins: failedLogins.map(Number),
            ports: new Set(ports.map(Number)),
            req_count: parseInt(reqCount) || 0,
            endpoints: new Set(endpoints)
        };
    }

    async cleanup() {
        // Redis handles cleanup via TTL!
    }
}

module.exports = new RedisStateTracker();
