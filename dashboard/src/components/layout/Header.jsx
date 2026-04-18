import { Bell, User, Search as SearchIcon } from "lucide-react";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.searchBar}>
        <SearchIcon className={styles.searchIcon} size={16} />
        <input 
          type="text" 
          placeholder="Global search (e.g. source_ip:1...)" 
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton}>
          <Bell size={18} />
          <span className={styles.badge}>3</span>
        </button>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            <User size={16} />
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>SOC Analyst L1</span>
            <span className={styles.userRole}>Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
