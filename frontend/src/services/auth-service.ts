export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'COACH' | 'STUDENT';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'COACH' | 'STUDENT';
}

export class AuthService {
  private static readonly TOKEN_KEY = 'chess-coach-token';
  private static readonly USER_KEY = 'chess-coach-user';
  private static readonly BASE_URL = 'http://localhost:8080/api/auth';
  
  private listeners: ((user: User | null) => void)[] = [];

  // Authentication state
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(AuthService.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    if (!token || !user) {
      return false;
    }

    // Check if token is expired (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  isCoach(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'COACH';
  }

  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'STUDENT';
  }

  // Authentication actions
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${AuthService.BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.setAuthData(authResponse.token, authResponse.user);
    this.notifyListeners(authResponse.user);
    
    return authResponse;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${AuthService.BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.setAuthData(authResponse.token, authResponse.user);
    this.notifyListeners(authResponse.user);
    
    return authResponse;
  }

  logout(): void {
    localStorage.removeItem(AuthService.TOKEN_KEY);
    localStorage.removeItem(AuthService.USER_KEY);
    this.notifyListeners(null);
  }

  // API helpers
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    // If unauthorized, logout and redirect
    if (response.status === 401) {
      this.logout();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  }

  // Event handling
  addAuthChangeListener(listener: (user: User | null) => void): void {
    this.listeners.push(listener);
  }

  removeAuthChangeListener(listener: (user: User | null) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Private methods
  private setAuthData(token: string, user: User): void {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.warn('Auth listener error:', error);
      }
    });
  }
}