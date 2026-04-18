class Normalizer {
  process(rawLog) {
    // Normalizes different log schemas into a unified standard
    const source = rawLog.source;
    let normalized = {
      timestamp: new Date(),
      src_ip: null,
      dest_ip: null,
      dest_port: null,
      event_type: null,
      endpoint: null,
      status_code: null,
      protocol: null,
      source: source || "unknown",
      raw_log: rawLog
    };

    if (source === "nginx") {
      normalized.src_ip = rawLog.ip || rawLog.data?.ip;
      normalized.endpoint = rawLog.url || rawLog.data?.url;
      normalized.status_code = rawLog.status || rawLog.data?.status;
      normalized.protocol = "HTTP";
      
      // Basic event type inference
      if ([401, 403].includes(normalized.status_code)) {
        normalized.event_type = "LOGIN_FAIL";
      } else {
        normalized.event_type = "HTTP_REQUEST";
      }
    } else if (source === "zeek") {
      normalized.src_ip = rawLog.src_ip || rawLog.data?.src_ip || rawLog.data?.id?.orig_h;
      normalized.dest_ip = rawLog.dest_ip || rawLog.data?.dest_ip || rawLog.data?.id?.resp_h;
      normalized.dest_port = rawLog.dest_port || rawLog.data?.dest_port || rawLog.data?.id?.resp_p;
      normalized.protocol = rawLog.proto || rawLog.data?.proto || "TCP";
      normalized.event_type = "NETWORK_CONN";
    }

    // Default timestamp parsing
    if (rawLog.timestamp || rawLog.data?.ts) {
      normalized.timestamp = new Date(rawLog.timestamp || (rawLog.data?.ts * 1000));
    }

    return normalized;
  }
}

module.exports = new Normalizer();
