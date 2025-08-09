export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
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
}

export class AuthService {
  private static readonly TOKEN_KEY = 'chess-coach-token';
  private static readonly USER_KEY = 'chess-coach-user';
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = this.determineBaseUrl();
  }

  private determineBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      return `${envUrl}/api/auth`;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080/api/auth';
    }

    console.error('VITE_API_BASE_URL is not set for production build!');
    return 'about:blank';
  }
  
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


  // Authentication actions
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/login`, {
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
    
    // Set user as online
    try {
      await this.setUserOnline(authResponse.user.id);
    } catch (error) {
      console.warn('Failed to set user online:', error);
    }
    
    return authResponse;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/register`, {
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
    
    // Set user as online
    try {
      await this.setUserOnline(authResponse.user.id);
    } catch (error) {
      console.warn('Failed to set user online:', error);
    }
    
    return authResponse;
  }

  logout(): void {
    const currentUser = this.getCurrentUser();
    
    // Set user as offline
    if (currentUser) {
      try {
        this.setUserOffline(currentUser.id);
      } catch (error) {
        console.warn('Failed to set user offline:', error);
      }
    }
    
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
    const token = this.getToken();
    const headers = this.getAuthHeaders();
    
    console.log('🔐 AuthenticatedFetch Debug:', {
      url,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
      headers: Object.keys(headers),
      hasAuthHeader: !!headers.Authorization
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    console.log('📡 Response:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
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

  // Presence methods
  private async setUserOnline(userId: number): Promise<void> {
    const sessionId = Date.now().toString();
    await this.authenticatedFetch(`${this.determineApiBaseUrl()}/api/presence/online`, {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId }),
    });
  }

  private async setUserOffline(userId: number): Promise<void> {
    await this.authenticatedFetch(`${this.determineApiBaseUrl()}/api/presence/offline`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  private determineApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl) {
      return envUrl;
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080';
    }

    console.error('VITE_API_BASE_URL is not set for production build!');
    return 'about:blank';
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