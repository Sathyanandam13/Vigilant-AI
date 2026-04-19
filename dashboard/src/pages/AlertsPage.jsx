import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveAPI } from '../services/api';
import { socketService } from "../services/socket";
import { Search, Filter } from 'lucide-react';
import styles from './AlertsPage.module.css';
export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    liveAPI.getAlerts().then(setAlerts);

    // Real-time updates
    socketService.subscribeToAlerts((newAlert) => {
      setAlerts((prev) => [newAlert, ...prev].slice(0, 50)); // Keep last 50
    });

    return () => {
      // In production, we'd unsubscribe here to avoid memory leaks
    };
  }, []);


  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Alerts</h1>
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.icon} />
            <input type="text" placeholder="Search IP or rules..." className={styles.searchInput} />
          </div>
          <button className={styles.filterBtn}>
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Severity</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Source IP</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert._id || alert.id} onClick={() => navigate(`/alerts/${alert._id || alert.id}`)}>
                <td>
                  <span className={`${styles.severityBadge} ${styles[alert.severity.toLowerCase()]}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className={styles.alertType}>{alert.type}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[alert.status.replace(" ", "").toLowerCase()]}`}>
                    {alert.status}
                  </span>
                </td>
                <td className={styles.assignee}>{alert.assignee || "Unassigned"}</td>
                <td className={styles.ipFont}>{alert.sourceIp}</td>
                <td className={styles.timeFont}>{new Date(alert.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
