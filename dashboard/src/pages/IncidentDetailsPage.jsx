import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { liveAPI } from '../services/api';
import { socketService } from '../services/socket';
import styles from './IncidentDetailsPage.module.css';

export default function IncidentDetailsPage() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    liveAPI.getIncident(id).then(setIncident);
    socketService.subscribeToIncidents((updated) => {
      if (updated._id === id) setIncident(updated);
    });
  }, [id]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    await liveAPI.patchIncident(id, { note: newNote });
    setNewNote('');
  };

  const changeStatus = async (status) => {
    await liveAPI.patchIncident(id, { status });
  };

  if (!incident) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>{incident.name}</h1>
      <p className={styles.description}>{incident.description}</p>
      
      <div className={styles.badges}>
        <span className={`${styles.badge} ${styles[incident.severity.toLowerCase()]}`}>{incident.severity}</span>
        <span className={`${styles.badge} ${styles[incident.status.toLowerCase()]}`}>{incident.status}</span>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.leftColumn}>
          <h2>Timeline of Alerts</h2>
          <div className={styles.timeline}>
            {incident.relatedAlerts && incident.relatedAlerts.map(a => (
              <div key={a._id} className={styles.timelineItem}>
                <div className={styles.timelineIcon}></div>
                <div className={styles.timelineContent}>
                  <strong>{a.type}</strong>
                  <span>{new Date(a.timestamp).toLocaleString()}</span>
                  <p>Severity: {a.severity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <h2>Analyst Notes</h2>
          <ul className={styles.notesList}>
            {incident.notes.map((n, i) => (
              <li key={i} className={styles.noteItem}>
                <strong>{n.author}</strong> <span className={styles.noteTime}>({new Date(n.timestamp).toLocaleString()})</span>
                <p>{n.text}</p>
              </li>
            ))}
          </ul>
          
          <div className={styles.addNote}>
            <textarea 
              value={newNote} 
              onChange={e => setNewNote(e.target.value)} 
              placeholder="Add your investigation notes here..." 
            />
            <button className={styles.btnPrimary} onClick={addNote}>Add Note</button>
          </div>

          <div className={styles.statusControls}>
            <h2>Update Status</h2>
            <div className={styles.actionButtons}>
              {['OPEN', 'INVESTIGATING', 'RESOLVED'].map(s => (
                <button 
                  key={s}
                  className={`${styles.btnAction} ${incident.status === s ? styles.active : ''}`}
                  disabled={incident.status === s}
                  onClick={() => changeStatus(s)}
                >
                  Mark as {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
