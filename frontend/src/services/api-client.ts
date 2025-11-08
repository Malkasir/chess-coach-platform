const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

class APIClient {
  private getAuthToken(): string | null {
    return localStorage.getItem('chess-coach-token');
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { requireAuth = true, ...fetchOptions } = options;
    
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (requireAuth) {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let userMessage = 'An unexpected error occurred';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
        userMessage = errorData.userMessage || this.getUserFriendlyMessage(response.status);
      } catch {
        userMessage = this.getUserFriendlyMessage(response.status);
      }
      
      const error = new Error(errorMessage) as Error & { userMessage?: string };
      error.userMessage = userMessage;
      throw error;
    }

    return response.json();
  }

  private getUserFriendlyMessage(status: number): string {
    switch (status) {
      case 401:
        return 'Please log in to continue';
      case 403:
        return 'You don\'t have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 429:
        return 'Too many requests. Please try again later';
      case 500:
        return 'Server error. Please try again later';
      case 503:
        return 'Service temporarily unavailable';
      default:
        return 'An unexpected error occurred';
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      requireAuth: false,
    });
  }

  async register(userData: { firstName: string; lastName: string; email: string; password: string }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      requireAuth: false,
    });
  }

  // Player presence endpoints
  async getOnlinePlayers(): Promise<any[]> {
    return this.request('/api/presence/online');
  }

  async searchPlayers(query: string): Promise<any[]> {
    return this.request(`/api/presence/search?q=${encodeURIComponent(query)}`);
  }

  async setUserOnline(userId: number, sessionId: string = Date.now().toString()) {
    return this.request('/api/presence/online', {
      method: 'POST',
      body: JSON.stringify({ userId, sessionId }),
    });
  }

  async setUserOffline(userId: number) {
    return this.request('/api/presence/offline', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Game invitation endpoints
  async sendInvitation(invitationData: {
    senderId: number;
    recipientId: number;
    type: string;
    message: string;
    colorPreference: string;
    gameMode?: string;
    baseTimeSeconds?: number | null;
    incrementSeconds?: number;
  }) {
    return this.request('/api/invitations/send', {
      method: 'POST',
      body: JSON.stringify(invitationData),
    });
  }
}

export const apiClient = new APIClient();