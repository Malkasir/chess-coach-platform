import React, { useState } from 'react';
import { User } from '../services/auth-service';
import { ThemeSelector } from './ThemeSelector';
import styles from '../styles/shared.module.css';

interface AppHeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  onLogout
}) => {
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>
            <span style={{ marginRight: '0.5rem' }}>♚</span>
            Chess Coach Platform
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <div className={styles.userGreeting}>
              Welcome, {currentUser.firstName}
            </div>
            <div className={styles.userEmail}>
              {currentUser.email}
            </div>
          </div>
          
          {/* Theme Selector Button */}
          <button 
            onClick={() => setShowThemeSelector(true)}
            className={styles.secondaryButton}
            style={{ 
              padding: '0.5rem 1rem',
              fontSize: 'var(--text-sm)',
              borderRadius: '16px'
            }}
            title="Change theme"
          >
            🎨 Themes
          </button>
          
          <button onClick={onLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <ThemeSelector 
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </>
  );
};

export default AppHeader;