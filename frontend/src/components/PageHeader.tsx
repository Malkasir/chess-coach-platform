import React from 'react';
import { User } from '../services/auth-service';
import styles from '../styles/shared.module.css';

interface PageHeaderProps {
  currentUser: User;
  onLogout: () => void;
  rightActions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  currentUser,
  onLogout,
  rightActions,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.headerTitle}>Chess Coach Platform</h1>
      </div>
      
      <div className={styles.headerRight}>
        {rightActions}
        <div className={styles.userInfo}>
          <span className={styles.userGreeting}>
            Welcome, {currentUser.firstName}
          </span>
          <span className={styles.userEmail}>
            {currentUser.email}
          </span>
          <button onClick={onLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};