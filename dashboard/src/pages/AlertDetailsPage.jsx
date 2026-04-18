import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { liveAPI } from "../services/api";
import { ArrowLeft, Clock, ShieldAlert, FileText, UserCircle } from "lucide-react";
import styles from "./AlertDetailsPage.module.css";

export default function AlertDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    liveAPI.getAlertById(id).then(setAlert).catch(() => navigate("/alerts"));
  }, [id, navigate]);

  const handleStatusChange = async (e) => {
    const updated = await liveAPI.updateAlertStatus(id, e.target.value);
    setAlert(updated);
  };

  const handleAssign = async (e) => {
    const updated = await liveAPI.assignAlert(id, e.target.value);
    setAlert(updated);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const updated = await liveAPI.addNote(id, newNote);
    setAlert(updated);
    setNewNote("");
  };

  if (!alert) return <div className={styles.loading}>Loading alert details...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => navigate("/alerts")} className={styles.backBtn}>
          <ArrowLeft size={16} /> Back to Alerts
        </button>
      </div>

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <span className={`${styles.severityBadge} ${styles[alert.severity.toLowerCase()]}`}>
            {alert.severity}
          </span>
          <h1>{alert.type}</h1>
        </div>
        <div className={styles.controls}>
          <select value={alert.status} onChange={handleStatusChange} className={styles.selectBox}>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="False Positive">False Positive</option>
          </select>
          <select value={alert.assignee || ""} onChange={handleAssign} className={styles.selectBox}>
            <option value="">Unassigned</option>
            <option value="Alice SOC">Alice SOC</option>
            <option value="Bob Admin">Bob Admin</option>
          </select>
        </div>
      </div>

      <div className={styles.gridContainer}>
        {/* LEFT COLUMN */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h3><ShieldAlert size={16}/> Metadata</h3>
            <div className={styles.metaGrid}>
              <div className={styles.metaRow}><span>Event ID</span><strong>{alert._id || alert.id}</strong></div>
              <div className={styles.metaRow}><span>Source IP</span><strong className={styles.mono}>{alert.sourceIp}</strong></div>
              <div className={styles.metaRow}><span>Dest IP</span><strong className={styles.mono}>{alert.data?.dest_ip || "-"}</strong></div>
              <div className={styles.metaRow}><span>Timestamp</span><strong>{new Date(alert.timestamp).toLocaleString()}</strong></div>
            </div>
          </div>

          <div className={styles.card}>
            <h3><FileText size={16}/> Raw Log Substring</h3>
            <pre className={styles.logViewer}>{JSON.stringify(alert.data || alert.rawLog, null, 2)}</pre>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <h3><Clock size={16}/> Investigation Notes</h3>
            <div className={styles.notesContainer}>
              {(alert.notes || []).length === 0 && <p className={styles.empty}>No notes added yet.</p>}
              {(alert.notes || []).map(n => (
                <div key={n.id} className={styles.noteBox}>
                  <div className={styles.noteHeader}>
                    <span><UserCircle size={14}/> {n.author}</span>
                    <small>{new Date(n.timestamp).toLocaleTimeString()}</small>
                  </div>
                  <p>{n.text}</p>
                </div>
              ))}
            </div>
            
            <div className={styles.addNoteBox}>
              <textarea 
                value={newNote} 
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add investigation details..."
                className={styles.textarea}
              />
              <button onClick={handleAddNote} className={styles.btnPrimary}>Add Note</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
