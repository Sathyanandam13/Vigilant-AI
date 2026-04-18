import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShieldAlert, AlertTriangle, FileText, Search } from "lucide-react";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const routes = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/alerts", label: "Alerts", icon: ShieldAlert },
    { path: "/incidents", label: "Incidents", icon: AlertTriangle },
    { path: "/logs", label: "Logs Explorer", icon: FileText },
    { path: "/search", label: "Search", icon: Search },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <h2>Vigilant AI</h2>
        <span className={styles.socBadge}>SOC</span>
      </div>

      <nav className={styles.nav}>
        {routes.map((r) => (
          <NavLink
            key={r.path}
            to={r.path}
            className={({ isActive }) =>
              isActive ? `${styles.navItem} ${styles.navItemActive}` : styles.navItem
            }
          >
            <r.icon className={styles.icon} size={20} />
            {r.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
