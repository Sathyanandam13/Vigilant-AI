class StateTracker {
  constructor() {
    this.memory = new Map();
    // Periodically cleanup old state to prevent memory leaks (e.g. every 5 min)
    setInterval(() => this.cleanup(), 300000); 
  }

  getIpState(ip) {
    if (!ip) return null;
    if (!this.memory.has(ip)) {
      this.memory.set(ip, {
        failed_logins: [],
        ports: new Set(),
        endpoints: new Set(),
        requests: []
      });
    }
    return this.memory.get(ip);
  }

  update(log) {
    const ip = log.src_ip;
    if (!ip) return;
    
    const state = this.getIpState(ip);
    const now = Date.now();

    if (log.event_type === "LOGIN_FAIL") {
      state.failed_logins.push(now);
    }
    
    if (log.dest_port) {
      state.ports.add(log.dest_port);
    }

    if (log.endpoint) {
      state.endpoints.add(log.endpoint);
    }

    state.requests.push(now);
  }

  cleanup() {
    const now = Date.now();
    const WINDOW = 3600000; // 1 hour tracking window
    
    for (const [ip, state] of this.memory.entries()) {
      state.failed_logins = state.failed_logins.filter(t => now - t < WINDOW);
      state.requests = state.requests.filter(t => now - t < WINDOW);
      // If IP is inactive, we can clear it completely to save memory
      if (state.requests.length === 0 && state.failed_logins.length === 0) {
        this.memory.delete(ip);
      }
    }
  }
}

module.exports = new StateTracker();
