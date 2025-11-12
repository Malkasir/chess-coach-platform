import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../services/auth-service';
import { ThemeSelector } from './ThemeSelector';
import { LanguageSelector } from './LanguageSelector';
import styles from '../styles/shared.module.css';

interface AppHeaderProps {
  currentUser: User;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  onLogout
}) => {
  const { t } = useTranslation(['common']);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.headerTitle}>
            <span style={{ marginInlineEnd: '0.5rem' }}>♚</span>
            {t('app_title')}
          </h1>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <div className={styles.userGreeting}>
              {t('welcome', { name: currentUser.firstName })}
            </div>
            <div className={styles.userEmail}>
              {currentUser.email}
            </div>
          </div>

          {/* Language Selector Button */}
          <button
            onClick={() => setShowLanguageSelector(true)}
            className={styles.secondaryButton}
            style={{
              padding: '0.5rem 1rem',
              fontSize: 'var(--text-sm)',
              borderRadius: '16px'
            }}
            title={t('language.selector_title')}
          >
            🌐 {t('language.selector_title')}
          </button>

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
            🎨 {t('button.theme')}
          </button>

          <button onClick={onLogout} className={styles.logoutButton}>
            {t('button.logout')}
          </button>
        </div>
      </header>

      <LanguageSelector
        isOpen={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />

      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </>
  );
};

export default AppHeader;