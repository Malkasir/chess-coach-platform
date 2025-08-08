import React from 'react';
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
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Chess Coach Platform</h1>
      </header>
      <div className={styles.loginContainer}>
        {!isRegistering ? (
          <form onSubmit={onLoginSubmit} className={styles.loginForm}>
            <h2>Login</h2>
            {loginError && (
              <div className={styles.errorMessage}>{loginError}</div>
            )}
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => onLoginEmailChange(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => onLoginPasswordChange(e.target.value)}
              className={styles.input}
              required
            />
            <button type="submit" className={styles.primaryButton}>
              Login
            </button>
            <div className={styles.formToggle}>
              <span>Don't have an account? </span>
              <button 
                type="button" 
                onClick={onToggleRegistration}
                className={styles.linkButton}
              >
                Sign up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={onRegisterSubmit} className={styles.loginForm}>
            <h2>Create Account</h2>
            {registerError && (
              <div className={styles.errorMessage}>{registerError}</div>
            )}
            <input
              type="text"
              placeholder="First Name"
              value={registerFirstName}
              onChange={(e) => onRegisterFirstNameChange(e.target.value)}
              className={styles.input}
              required
              minLength={2}
              maxLength={50}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={registerLastName}
              onChange={(e) => onRegisterLastNameChange(e.target.value)}
              className={styles.input}
              required
              minLength={2}
              maxLength={50}
            />
            <input
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => onRegisterEmailChange(e.target.value)}
              className={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 characters)"
              value={registerPassword}
              onChange={(e) => onRegisterPasswordChange(e.target.value)}
              className={styles.input}
              required
              minLength={8}
            />
            <button type="submit" className={styles.primaryButton}>
              Create Account
            </button>
            <div className={styles.formToggle}>
              <span>Already have an account? </span>
              <button 
                type="button" 
                onClick={onToggleRegistration}
                className={styles.linkButton}
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

