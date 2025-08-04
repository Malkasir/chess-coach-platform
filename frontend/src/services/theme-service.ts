export interface PieceTheme {
  id: string;
  name: string;
  description: string;
  path: string;
}

export interface BoardTheme {
  id: string;
  name: string;
  description: string;
  lightSquareColor: string;
  darkSquareColor: string;
  borderColor?: string;
}

export interface AnimationTheme {
  id: string;
  name: string;
  description: string;
  duration: number;
  easing: string;
}

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  glassBackground: string;
  glassBackdrop: string;
}

export interface ThemeConfiguration {
  pieceTheme: string;
  boardTheme: string;
  animationTheme: string;
  appTheme: string;
}

export class ThemeService {
  private static readonly STORAGE_KEY = 'chess-coach-theme-config';
  
  // Default piece themes
  static readonly PIECE_THEMES: PieceTheme[] = [
    {
      id: 'cburnett',
      name: 'Classic',
      description: 'Traditional chess pieces with clean lines',
      path: '/pieces/cburnett'
    },
    {
      id: 'alpha',
      name: 'Alpha',
      description: 'Bold and geometric piece design',
      path: '/pieces/alpha'
    },
    {
      id: 'merida',
      name: 'Merida',
      description: 'Elegant traditional style',
      path: '/pieces/merida'
    },
    {
      id: 'pixel',
      name: 'Pixel',
      description: 'Retro 8-bit gaming style',
      path: '/pieces/pixel'
    }
  ];

  // Board themes
  static readonly BOARD_THEMES: BoardTheme[] = [
    {
      id: 'classic-wood',
      name: 'Classic Wood',
      description: 'Traditional wooden chess board',
      lightSquareColor: '#f0d9b5',
      darkSquareColor: '#b58863',
      borderColor: '#8b4513'
    },
    {
      id: 'tournament-green',
      name: 'Tournament Green',
      description: 'Professional tournament colors',
      lightSquareColor: '#ffffdd',
      darkSquareColor: '#86a666',
      borderColor: '#5d7544'
    },
    {
      id: 'modern-blue',
      name: 'Modern Blue',
      description: 'Clean blue and white theme',
      lightSquareColor: '#dee3e6',
      darkSquareColor: '#8ca2ad',
      borderColor: '#4a6741'
    },
    {
      id: 'dark-mode',
      name: 'Dark Mode',
      description: 'Dark theme for low-light environments',
      lightSquareColor: '#3c3c3c',
      darkSquareColor: '#1e1e1e',
      borderColor: '#666666'
    },
    {
      id: 'marble',
      name: 'Marble',
      description: 'Elegant marble appearance',
      lightSquareColor: '#f8f8f8',
      darkSquareColor: '#d0d0d0',
      borderColor: '#a0a0a0'
    }
  ];

  // Animation themes
  static readonly ANIMATION_THEMES: AnimationTheme[] = [
    {
      id: 'smooth',
      name: 'Smooth',
      description: 'Smooth and elegant transitions',
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    {
      id: 'quick',
      name: 'Quick',
      description: 'Fast and responsive movement',
      duration: 150,
      easing: 'linear'
    },
    {
      id: 'bouncy',
      name: 'Bouncy',
      description: 'Fun spring-like animations',
      duration: 400,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    {
      id: 'none',
      name: 'None',
      description: 'Instant movement, no animations',
      duration: 0,
      easing: 'linear'
    }
  ];

  // App themes
  static readonly APP_THEMES: AppTheme[] = [
    {
      id: 'gradient-purple',
      name: 'Cosmic Purple',
      description: 'Current purple gradient theme',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      glassBackground: 'rgba(255,255,255,0.1)',
      glassBackdrop: 'blur(10px)'
    },
    {
      id: 'dark-theme',
      name: 'Dark Pro',
      description: 'Professional dark theme',
      primaryColor: '#1a1a1a',
      secondaryColor: '#2d2d2d',
      backgroundColor: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      textColor: '#e0e0e0',
      glassBackground: 'rgba(255,255,255,0.05)',
      glassBackdrop: 'blur(10px)'
    },
    {
      id: 'light-theme',
      name: 'Clean Light',
      description: 'Bright and clean interface',
      primaryColor: '#f5f5f5',
      secondaryColor: '#ffffff',
      backgroundColor: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
      textColor: '#333333',
      glassBackground: 'rgba(0,0,0,0.05)',
      glassBackdrop: 'blur(10px)'
    },
    {
      id: 'ocean-blue',
      name: 'Ocean Blue',
      description: 'Calming blue ocean theme',
      primaryColor: '#4facfe',
      secondaryColor: '#00f2fe',
      backgroundColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      textColor: '#ffffff',
      glassBackground: 'rgba(255,255,255,0.1)',
      glassBackdrop: 'blur(10px)'
    }
  ];

  private static readonly DEFAULT_CONFIG: ThemeConfiguration = {
    pieceTheme: 'cburnett',
    boardTheme: 'classic-wood',
    animationTheme: 'smooth',
    appTheme: 'gradient-purple'
  };

  private currentConfig: ThemeConfiguration;
  private listeners: ((config: ThemeConfiguration) => void)[] = [];

  constructor() {
    this.currentConfig = this.loadConfiguration();
  }

  // Configuration management
  getConfiguration(): ThemeConfiguration {
    return { ...this.currentConfig };
  }

  updateConfiguration(updates: Partial<ThemeConfiguration>): void {
    this.currentConfig = { ...this.currentConfig, ...updates };
    this.saveConfiguration();
    this.notifyListeners();
  }

  resetToDefaults(): void {
    this.currentConfig = { ...ThemeService.DEFAULT_CONFIG };
    this.saveConfiguration();
    this.notifyListeners();
  }

  // Getters for current themes
  getCurrentPieceTheme(): PieceTheme {
    return ThemeService.PIECE_THEMES.find(t => t.id === this.currentConfig.pieceTheme) 
           || ThemeService.PIECE_THEMES[0];
  }

  getCurrentBoardTheme(): BoardTheme {
    return ThemeService.BOARD_THEMES.find(t => t.id === this.currentConfig.boardTheme) 
           || ThemeService.BOARD_THEMES[0];
  }

  getCurrentAnimationTheme(): AnimationTheme {
    return ThemeService.ANIMATION_THEMES.find(t => t.id === this.currentConfig.animationTheme) 
           || ThemeService.ANIMATION_THEMES[0];
  }

  getCurrentAppTheme(): AppTheme {
    return ThemeService.APP_THEMES.find(t => t.id === this.currentConfig.appTheme) 
           || ThemeService.APP_THEMES[0];
  }

  // Piece theme function for chessboard-element
  getPieceThemeFunction(): (piece: string) => string {
    const theme = this.getCurrentPieceTheme();
    return (piece: string) => `${theme.path}/${piece}.svg`;
  }

  // CSS generation for board theme
  generateBoardCSS(): string {
    const boardTheme = this.getCurrentBoardTheme();
    const animationTheme = this.getCurrentAnimationTheme();
    
    return `
      chess-board .square-55d63 {
        transition: all ${animationTheme.duration}ms ${animationTheme.easing} !important;
      }
      
      chess-board .white-1e1d7 {
        background-color: ${boardTheme.lightSquareColor} !important;
      }
      
      chess-board .black-3c85d {
        background-color: ${boardTheme.darkSquareColor} !important;
      }
      
      chess-board {
        border-color: ${boardTheme.borderColor || boardTheme.darkSquareColor} !important;
      }
      
      chess-board .piece-417db {
        transition: transform ${animationTheme.duration}ms ${animationTheme.easing} !important;
      }
      
      chess-board .square-55d63.highlight1-32417,
      chess-board .square-55d63.highlight2-9c5d2 {
        box-shadow: inset 0 0 3px 3px rgba(255, 255, 0, 0.5) !important;
      }
    `;
  }

  // CSS generation for app theme
  generateAppCSS(): string {
    const appTheme = this.getCurrentAppTheme();
    
    return `
      :root {
        --primary-color: ${appTheme.primaryColor};
        --secondary-color: ${appTheme.secondaryColor};
        --text-color: ${appTheme.textColor};
        --glass-background: ${appTheme.glassBackground};
        --glass-backdrop: ${appTheme.glassBackdrop};
      }
      
      chess-coach-app {
        background: ${appTheme.backgroundColor} !important;
        color: ${appTheme.textColor} !important;
      }
      
      chess-coach-app .controls-panel,
      chess-coach-app .video-panel,
      chess-coach-app .chess-panel {
        background: ${appTheme.glassBackground} !important;
        backdrop-filter: ${appTheme.glassBackdrop} !important;
        border-color: ${appTheme.textColor.replace(')', ', 0.2)')} !important;
      }
    `;
  }

  // Event handling
  addThemeChangeListener(listener: (config: ThemeConfiguration) => void): void {
    this.listeners.push(listener);
  }

  removeThemeChangeListener(listener: (config: ThemeConfiguration) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Private methods
  private loadConfiguration(): ThemeConfiguration {
    try {
      const stored = localStorage.getItem(ThemeService.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate that all required fields exist
        if (parsed.pieceTheme && parsed.boardTheme && parsed.animationTheme && parsed.appTheme) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load theme configuration:', error);
    }
    return { ...ThemeService.DEFAULT_CONFIG };
  }

  private saveConfiguration(): void {
    try {
      localStorage.setItem(ThemeService.STORAGE_KEY, JSON.stringify(this.currentConfig));
    } catch (error) {
      console.warn('Failed to save theme configuration:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getConfiguration());
      } catch (error) {
        console.warn('Theme listener error:', error);
      }
    });
  }
}