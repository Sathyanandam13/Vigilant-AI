import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { liveAPI } from '../services/api';
import { socketService } from '../services/socket';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import styles from './IpDrilldownPage.module.css';

export default function IpDrilldownPage() {
  const { ip } = useParams();
  const [data, setData] = useState({ alerts: [], logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    liveAPI.getIpInfo(ip).then(res => {
      setData(res);
      setLoading(false);
    });

    socketService.subscribeToAlerts(a => {
      if (a.sourceIp === ip) {
        setData(prev => ({ ...prev, alerts: [a, ...prev.alerts].slice(0, 50) }));
      }
    });

    socketService.subscribeToLogs(l => {
      if (l.src_ip === ip) {
        setData(prev => ({ ...prev, logs: [l, ...prev.logs].slice(0, 100) }));
      }
    });
  }, [ip]);

  if (loading) return <div className={styles.container}><p>Loading context for {ip}...</p></div>;

  // Group logs by hour for the chart
  const trafficDataMap = data.logs.reduce((acc, log) => {
    const date = new Date(log.timestamp);
    // Format: YYYY-MM-DD HH:00
    const hourKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
    acc[hourKey] = (acc[hourKey] || 0) + 1;
    return acc;
  }, {});

  // Sort chronologically
  const chartData = Object.keys(trafficDataMap).sort().map(key => ({
    time: key.split(' ')[1], // Just show HH:00
    requests: trafficDataMap[key]
  }));

  const criticalCount = data.alerts.filter(a => a.severity === 'CRITICAL').length;
  const highCount = data.alerts.filter(a => a.severity === 'HIGH').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>IP Intelligence: {ip}</h1>
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Total Alerts</span>
            <span className={styles.statValue}>{data.alerts.length}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Critical</span>
            <span className={`${styles.statValue} ${styles.textRed}`}>{criticalCount}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>High</span>
            <span className={`${styles.statValue} ${styles.textOrange}`}>{highCount}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Logged Events</span>
            <span className={styles.statValue}>{data.logs.length}</span>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <section className={styles.chartSection}>
          <h2>Traffic Volume Over Time</h2>
          <div className={styles.chartContainer}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                    itemStyle={{ color: '#c4b5fd' }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReq)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.emptyState}>No traffic data available for the selected timeframe.</div>
            )}
          </div>
        </section>

        <section className={styles.alertsSection}>
          <h2>Recent Alerts Associated with IP</h2>
          <div className={styles.alertsList}>
            {data.alerts.length > 0 ? (
              data.alerts.slice(0, 10).map(a => (
                <div key={a._id} className={styles.alertCard}>
                  <div className={styles.alertHeader}>
                    <span className={`${styles.severityBadge} ${styles[a.severity.toLowerCase()]}`}>{a.severity}</span>
                    <span className={styles.alertTime}>{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <h3 className={styles.alertType}>{a.type}</h3>
                  <div className={styles.alertMeta}>
                    <span>Confidence: {Math.round(a.confidence * 100)}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No alerts found for this IP.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
