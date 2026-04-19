const redisStateTracker = require("./RedisStateTracker");

/**
 * Legacy wrapper for the new Redis-based state tracker.
 */
module.exports = {
  update: (log) => redisStateTracker.update(log),
  getIpState: (ip) => redisStateTracker.getIpState(ip),
  cleanup: () => { } // Managed by Redis TTL
};

