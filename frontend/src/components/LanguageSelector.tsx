import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../i18n/config';
import styles from '../styles/shared.module.css';

interface LanguageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  isOpen,
  onClose
}) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
    // Save to localStorage (handled by i18next-browser-languagedetector)
    // TODO: In Phase 2, also update user preference on backend
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.modalOverlay}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
          style={{
            minWidth: '300px',
            maxWidth: '400px'
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary, #333)'
            }}
          >
            🌐 {i18n.t('common:language.selector_title')}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={currentLanguage === lang ? styles.primaryButton : styles.secondaryButton}
                style={{
                  padding: '1rem',
                  fontSize: '1.1rem',
                  backgroundColor:
                    currentLanguage === lang
                      ? 'var(--primary-color, #667eea)'
                      : 'white',
                  color:
                    currentLanguage === lang
                      ? 'white'
                      : '#1a1a1a',
                  border:
                    currentLanguage === lang
                      ? '2px solid var(--primary-color, #667eea)'
                      : '2px solid #495057',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontWeight: currentLanguage === lang ? 700 : 600,
                  transition: 'all 0.2s ease',
                  boxShadow: currentLanguage === lang
                    ? '0 2px 8px rgba(102, 126, 234, 0.3)'
                    : '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (currentLanguage !== lang) {
                    e.currentTarget.style.borderColor = 'var(--primary-color, #667eea)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLanguage !== lang) {
                    e.currentTarget.style.borderColor = '#495057';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                {SUPPORTED_LANGUAGES[lang]}
                {currentLanguage === lang && ' ✓'}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className={styles.secondaryButton}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: 'white',
              color: '#1a1a1a',
              border: '2px solid #495057',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            {i18n.t('common:button.close')}
          </button>
        </div>
      </div>
    </>
  );
};

export default LanguageSelector;
