import { useState, useEffect } from "react";
import { liveAPI } from "../services/api";
import { Calendar, Link } from "lucide-react";
import styles from "./IncidentsPage.module.css";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    liveAPI.getIncidents().then(setIncidents);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Incident Management</h1>
      <p className={styles.subtitle}>Groups of related alerts correlated by the SIEM engine.</p>

      <div className={styles.grid}>
        {incidents.map(inc => (
          <div key={inc._id || inc.id} className={styles.incidentCard}>
            <div className={styles.cardHeader}>
              <span className={`${styles.severityBadge} ${styles[inc.severity.toLowerCase()]}`}>
                {inc.severity}
              </span>
              <span className={`${styles.statusBadge} ${inc.status === 'Active' ? styles.active : styles.investigating}`}>
                {inc.status}
              </span>
            </div>
            
            <h3 className={styles.cardTitle}>{inc.name}</h3>
            <p className={styles.cardDesc}>{inc.description}</p>

            <div className={styles.cardFooter}>
              <div className={styles.footerItem}>
                <Link size={14} />
                <span>{inc.alertsCount} Alerts</span>
              </div>
              <div className={styles.footerItem}>
                <Calendar size={14} />
                <span>{new Date(inc.timestamp).toLocaleDateString()}</span>
              </div>
              <button className={styles.btnAction}>Investigate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 