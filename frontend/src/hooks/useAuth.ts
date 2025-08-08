import { useState, useEffect, useRef } from 'react';
import { AuthService, User } from '../services/auth-service';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isRegistering: boolean;
  loginEmail: string;
  loginPassword: string;
  loginError: string;
  registerEmail: string;
  registerPassword: string;
  registerFirstName: string;
  registerLastName: string;
  registerError: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    currentUser: null,
    isAuthenticated: false,
    isRegistering: false,
    loginEmail: '',
    loginPassword: '',
    loginError: '',
    registerEmail: '',
    registerPassword: '',
    registerFirstName: '',
    registerLastName: '',
    registerError: ''
  });

  const authServiceRef = useRef(new AuthService());

  useEffect(() => {
    const authService = authServiceRef.current;
    
    // Check authentication state on app load
    const currentUser = authService.getCurrentUser();
    const isAuthenticated = authService.isAuthenticated();
    
    if (currentUser && isAuthenticated) {
      setAuthState(prev => ({
        ...prev,
        currentUser,
        isAuthenticated
      }));
    }

    // Initialize test users
    initializeTestUsers();
  }, []);

  const initializeTestUsers = async () => {
    // Check if already initialized to prevent duplicate calls
    const storageKey = 'chess-coach-test-users-initialized';
    if ((window as any).testUsersInitialized || localStorage.getItem(storageKey)) {
      return;
    }
    (window as any).testUsersInitialized = true;
    localStorage.setItem(storageKey, 'true');

    try {
      // Try to create test users (will fail silently if they already exist)
      const testUsers = [
        { id: 4, email: 'user1@test.com', firstName: 'User', lastName: 'One' },
        { id: 5, email: 'user2@test.com', firstName: 'User', lastName: 'Two' }
      ];

      for (const user of testUsers) {
        try {
          const response = await fetch(`http://localhost:8080/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              password: 'password123',
              firstName: user.firstName,
              lastName: user.lastName
            })
          });
          
          if (response.ok) {
            console.log(`✅ Created test user: ${user.email}`);
          } else if (response.status === 400) {
            // User already exists, which is fine - suppress repetitive logging
          } else {
            console.warn(`⚠️ Unexpected response for ${user.email}:`, response.status);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to check/create test user ${user.email}:`, error);
        }
      }

      // Check if user is already authenticated
      const currentUser = authServiceRef.current.getCurrentUser();
      const isAuthenticated = authServiceRef.current.isAuthenticated();
      
      setAuthState(prev => ({
        ...prev,
        currentUser,
        isAuthenticated
      }));
    } catch (error) {
      console.error('Failed to initialize test users:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, loginError: '' }));

    try {
      const authResponse = await authServiceRef.current.login({
        email: authState.loginEmail,
        password: authState.loginPassword
      });

      setAuthState(prev => ({
        ...prev,
        currentUser: authResponse.user,
        isAuthenticated: true,
        loginEmail: '',
        loginPassword: '',
        loginError: ''
      }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loginError: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthState(prev => ({ ...prev, registerError: '' }));

    try {
      const authResponse = await authServiceRef.current.register({
        email: authState.registerEmail,
        password: authState.registerPassword,
        firstName: authState.registerFirstName,
        lastName: authState.registerLastName
      });

      setAuthState(prev => ({
        ...prev,
        currentUser: authResponse.user,
        isAuthenticated: true,
        registerEmail: '',
        registerPassword: '',
        registerFirstName: '',
        registerLastName: '',
        registerError: '',
        isRegistering: false
      }));
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        registerError: error instanceof Error ? error.message : 'Registration failed'
      }));
    }
  };

  const toggleRegistration = () => {
    setAuthState(prev => ({
      ...prev,
      isRegistering: !prev.isRegistering,
      loginError: '',
      registerError: '',
      loginEmail: '',
      loginPassword: '',
      registerEmail: '',
      registerPassword: '',
      registerFirstName: '',
      registerLastName: ''
    }));
  };

  const logout = () => {
    authServiceRef.current.logout();
    setAuthState(prev => ({
      ...prev,
      currentUser: null,
      isAuthenticated: false
    }));
    window.location.reload();
  };

  const updateAuthField = (field: keyof AuthState, value: string | boolean) => {
    setAuthState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    authState,
    authService: authServiceRef.current,
    handleLogin,
    handleRegister,
    toggleRegistration,
    logout,
    updateAuthField
  };
};