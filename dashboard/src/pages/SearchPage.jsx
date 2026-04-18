import { useState } from "react";
import { Search } from "lucide-react";
import styles from "./SearchPage.module.css";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Simulate search logic
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <Search size={48} className={styles.heroIcon} />
        <h1>Global Search</h1>
        <p>Query across alerts, incidents, users, and raw telemetry data using advanced operators.</p>
        
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input 
            type="text" 
            placeholder="e.g., severity:critical AND (source_ip:192.168.1.0/24 OR type:malware)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.massiveInput}
          />
          <button type="submit" className={styles.searchBtn}>Run Query</button>
        </form>

        <div className={styles.suggestions}>
          <span>Try:</span>
          <button type="button">status:open</button>
          <button type="button">type:bruteforce</button>
          <button type="button">user:"Alice SOC"</button>
        </div>
      </div>
    </div>
  );
}
