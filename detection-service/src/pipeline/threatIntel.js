/**
 * ThreatIntelligence Module
 * Simulates a real-time feed of known malicious IPs.
 */
class ThreatIntelligence {
    constructor() {
        // In production, this would be a cached set from an external API (AlienVault, VirusTotal, etc.)
        this.blacklist = new Set([
            "1.2.3.4",
            "8.8.8.8", // Example: suspicious actor
            "5.5.5.5"  // Used in our simulation
        ]);
    }

    isMalicious(ip) {
        return this.blacklist.has(ip);
    }

    getReputation(ip) {
        if (this.isMalicious(ip)) {
            return { status: "MALICIOUS", score: 100, source: "DHS_BLACKLIST" };
        }
        return { status: "CLEAN", score: 0 };
    }
}

module.exports = new ThreatIntelligence();
