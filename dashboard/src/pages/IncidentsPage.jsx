import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { liveAPI } from '../services/api';
import { socketService } from "../services/socket";
import { Link, Calendar } from 'lucide-react';
import styles from './IncidentsPage.module.css';
export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    liveAPI.getIncidents().then(setIncidents);

    socketService.subscribeToIncidents((newInc) => {
      setIncidents((prev) => {
        const index = prev.findIndex(i => i._id === newInc._id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = newInc;
          return updated;
        }
        return [newInc, ...prev];
      });
    });
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
              <span className={`${styles.statusBadge} ${styles[inc.status.toLowerCase()]}`}>
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
              <RouterLink to={`/incidents/${inc._id || inc.id}`} className={styles.btnAction}>
                Investigate
              </RouterLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
