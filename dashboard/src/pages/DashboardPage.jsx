import React, { useState, useEffect } from 'react';
import { socketService } from "../services/socket";
import { liveAPI } from "../services/api";
import { Activity, AlertTriangle, ShieldAlert, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import styles from './DashboardPage.module.css';
export default function DashboardPage() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    liveAPI.getAlerts().then(setAlerts);

    // Real-time updates
    socketService.subscribeToAlerts((newAlert) => {
      setAlerts((prev) => [newAlert, ...prev].slice(0, 50));
    });

    return () => {
      // Unsubscribe logic if needed
    };
  }, []);


  const total = alerts.length;
  const critical = alerts.filter(a => a.severity === "CRITICAL").length;
  const high = alerts.filter(a => a.severity === "HIGH").length;
  const open = alerts.filter(a => a.status === "Open").length;

  // Mock chart data loosely based on length over 7 days setup
  const chartData = [
    { name: "Mon", alerts: Math.floor(total * 0.1) },
    { name: "Tue", alerts: Math.floor(total * 0.15) },
    { name: "Wed", alerts: Math.floor(total * 0.2) },
    { name: "Thu", alerts: Math.floor(total * 0.1) },
    { name: "Fri", alerts: Math.floor(total * 0.3) },
    { name: "Sat", alerts: Math.floor(total * 0.05) },
    { name: "Sun", alerts: Math.floor(total * 0.1) }
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>SOC Overview</h1>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>Total Alerts</h3>
            <Activity className={styles.iconBlue} />
          </div>
          <p className={styles.statValue}>{total}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>Critical</h3>
            <AlertTriangle className={styles.iconRed} />
          </div>
          <p className={styles.statValue}>{critical}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>High Severity</h3>
            <ShieldAlert className={styles.iconOrange} />
          </div>
          <p className={styles.statValue}>{high}</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <h3>Open Investigations</h3>
            <CheckCircle className={styles.iconGreen} />
          </div>
          <p className={styles.statValue}>{open}</p>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartPanel}>
          <h3>Alert Volume (7 Days)</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="alerts" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAlerts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartPanel}>
          <h3>Recent Activity Stream</h3>
          <div className={styles.activityFeed}>
            {alerts.slice(0, 5).map(alert => (
              <div key={alert._id || alert.id} className={styles.feedItem}>
                <div className={`${styles.severityDot} ${styles[alert.severity?.toLowerCase() || 'low']}`}></div>
                <div className={styles.feedContent}>
                  <strong>{alert.type}</strong>
                  <span>{alert.sourceIp || 'Unknown'} &rarr; {(alert.data && alert.data.dest_ip) || 'Unknown'}</span>
                </div>
                <span className={styles.feedTime}>Just now</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
