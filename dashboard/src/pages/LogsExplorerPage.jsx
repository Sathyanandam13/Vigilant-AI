import { useState, useEffect } from "react";
import { liveAPI } from "../services/api";
import { Search, Server, Clock, DownloadCloud } from "lucide-react";
import styles from "./LogsExplorerPage.module.css";

export default function LogsExplorerPage() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    liveAPI.getLogs().then(setLogs);
  }, []);

  const filteredLogs = logs.filter(log => {
    const raw = JSON.stringify(log.raw_log || "");
    const src = log.src_ip || "";
    return raw.toLowerCase().includes(query.toLowerCase()) || src.includes(query);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Log Explorer</h1>
          <p className={styles.subtitle}>Unified log query interface.</p>
        </div>
        <button className={styles.exportBtn}>
          <DownloadCloud size={16} /> Export CSV
        </button>
      </div>

      <div className={styles.queryBar}>
        <div className={styles.searchBox}>
          <Search className={styles.icon} size={18} />
          <input 
            type="text" 
            placeholder="Search raw logs or IPs (e.g., '192.168.1.10' or 'block')..." 
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className={styles.filtersWrapper}>
          <button className={styles.filterPill}><Clock size={14}/> Last 24 Hours</button>
          <button className={styles.filterPill}><Server size={14}/> All Sources</button>
        </div>
      </div>

      <div className={styles.logList}>
        {filteredLogs.map(log => (
          <div key={log._id || log.id} className={styles.logRow}>
            <div className={styles.logTime}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
            <div className={styles.logMeta}>
              <span className={styles.pill}>{log.event_type}</span>
              <span className={styles.pill}>{log.src_ip}</span>
            </div>
            <div className={styles.logContent}>
              <code>{JSON.stringify(log.raw_log)}</code>
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className={styles.emptyState}>No logs match your query.</div>
        )}
      </div>
    </div>
  );
}
