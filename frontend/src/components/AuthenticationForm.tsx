import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../services/auth-service';
import styles from '../styles/shared.module.css';

interface AuthenticationFormProps {
  isRegistering: boolean;
  loginEmail: string;
  loginPassword: string;
  loginError: string;
  registerEmail: string;
  registerPassword: string;
  registerFirstName: string;
  registerLastName: string;
  registerError: string;
  onLoginSubmit: (e: React.FormEvent) => void;
  onRegisterSubmit: (e: React.FormEvent) => void;
  onToggleRegistration: () => void;
  onLoginEmailChange: (email: string) => void;
  onLoginPasswordChange: (password: string) => void;
  onRegisterEmailChange: (email: string) => void;
  onRegisterPasswordChange: (password: string) => void;
  onRegisterFirstNameChange: (firstName: string) => void;
  onRegisterLastNameChange: (lastName: string) => void;
}

export const AuthenticationForm: React.FC<AuthenticationFormProps> = ({
  isRegistering,
  loginEmail,
  loginPassword,
  loginError,
  registerEmail,
  registerPassword,
  registerFirstName,
  registerLastName,
  registerError,
  onLoginSubmit,
  onRegisterSubmit,
  onToggleRegistration,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRegisterEmailChange,
  onRegisterPasswordChange,
  onRegisterFirstNameChange,
  onRegisterLastNameChange,
}) => {
  const { t } = useTranslation(['common', 'auth']);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>{t('common:app_title')}</h1>
      </header>
      <div className={styles.loginContainer}>
        {!isRegistering ? (
          <form onSubmit={onLoginSubmit} className={styles.loginForm}>
            <h2>{t('auth:login.title')}</h2>
            {loginError && (
              <div className={styles.errorMessage}>{loginError}</div>
            )}
            <label htmlFor="login-email" className="sr-only">
              {t('auth:labels.email')}
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder={t('auth:login.email_placeholder')}
              value={loginEmail}
              onChange={(e) => onLoginEmailChange(e.target.value)}
              className={styles.input}
              required
              autoComplete="email"
            />
            <label htmlFor="login-password" className="sr-only">
              {t('auth:labels.password')}
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder={t('auth:login.password_placeholder')}
              value={loginPassword}
              onChange={(e) => onLoginPasswordChange(e.target.value)}
              className={styles.input}
              required
              autoComplete="current-password"
            />
            <button type="submit" className={styles.primaryButton}>
              {t('auth:login.submit_button')}
            </button>
            <div className={styles.formToggle}>
              <span>{t('auth:login.no_account')} </span>
              <button
                type="button"
                onClick={onToggleRegistration}
                className={styles.linkButton}
              >
                {t('auth:login.signup_link')}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit} className={styles.loginForm}>
            <h2>{t('auth:register.title')}</h2>
            {registerError && (
              <div className={styles.errorMessage}>{registerError}</div>
            )}
            <label htmlFor="register-first-name" className="sr-only">
              {t('auth:labels.first_name')}
            </label>
            <input
              id="register-first-name"
              name="firstName"
              type="text"
              placeholder={t('auth:register.first_name_placeholder')}
              value={registerFirstName}
              onChange={(e) => onRegisterFirstNameChange(e.target.value)}
              className={styles.input}
              required
              minLength={2}
              maxLength={50}
              autoComplete="given-name"
            />
            <label htmlFor="register-last-name" className="sr-only">
              {t('auth:labels.last_name')}
            </label>
            <input
              id="register-last-name"
              name="lastName"
              type="text"
              placeholder={t('auth:register.last_name_placeholder')}
              value={registerLastName}
              onChange={(e) => onRegisterLastNameChange(e.target.value)}
              className={styles.input}
              required
              minLength={2}
              maxLength={50}
              autoComplete="family-name"
            />
            <label htmlFor="register-email" className="sr-only">
              {t('auth:labels.email')}
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              placeholder={t('auth:register.email_placeholder')}
              value={registerEmail}
              onChange={(e) => onRegisterEmailChange(e.target.value)}
              className={styles.input}
              required
              autoComplete="email"
            />
            <label htmlFor="register-password" className="sr-only">
              {t('auth:labels.password')}
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              placeholder={t('auth:register.password_placeholder')}
              value={registerPassword}
              onChange={(e) => onRegisterPasswordChange(e.target.value)}
              className={styles.input}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button type="submit" className={styles.primaryButton}>
              {t('auth:register.submit_button')}
            </button>
            <div className={styles.formToggle}>
              <span>{t('auth:register.have_account')} </span>
              <button
                type="button"
                onClick={onToggleRegistration}
                className={styles.linkButton}
              >
                {t('auth:register.signin_link')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

