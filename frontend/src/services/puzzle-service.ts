/**
 * Chess Puzzle Service
 * 
 * Service for interacting with puzzle endpoints
 */

import { apiClient } from './api-client';

export interface Puzzle {
  id: number;
  fen: string;
  solution: string;
  difficulty: number;
  description: string;
  theme: string;
  source: string;
  moveCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PuzzleStats {
  totalPuzzles: number;
  difficultyCount: Record<number, number>;
  themeCount: Record<string, number>;
}

export class PuzzleService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/puzzles`;
  }

  /**
   * Get all puzzles
   */
  async getAllPuzzles(): Promise<Puzzle[]> {
    const response = await apiClient.get(`${this.baseUrl}`);
    return response;
  }

  /**
   * Get puzzle by ID
   */
  async getPuzzleById(id: number): Promise<Puzzle> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response;
  }

  /**
   * Get a random puzzle
   */
  async getRandomPuzzle(): Promise<Puzzle> {
    const response = await apiClient.get(`${this.baseUrl}/random`);
    return response;
  }

  /**
   * Get puzzles by difficulty level
   */
  async getPuzzlesByDifficulty(difficulty: number): Promise<Puzzle[]> {
    const response = await apiClient.get(`${this.baseUrl}/difficulty/${difficulty}`);
    return response;
  }

  /**
   * Get a random puzzle by difficulty
   */
  async getRandomPuzzleByDifficulty(difficulty: number): Promise<Puzzle> {
    const response = await apiClient.get(`${this.baseUrl}/difficulty/${difficulty}/random`);
    return response;
  }

  /**
   * Get puzzles by theme
   */
  async getPuzzlesByTheme(theme: string): Promise<Puzzle[]> {
    const response = await apiClient.get(`${this.baseUrl}/theme/${encodeURIComponent(theme)}`);
    return response;
  }

  /**
   * Get a random puzzle by theme
   */
  async getRandomPuzzleByTheme(theme: string): Promise<Puzzle> {
    const response = await apiClient.get(`${this.baseUrl}/theme/${encodeURIComponent(theme)}/random`);
    return response;
  }

  /**
   * Get puzzles within a difficulty range
   */
  async getPuzzlesByDifficultyRange(min: number, max: number): Promise<Puzzle[]> {
    const response = await apiClient.get(`${this.baseUrl}/difficulty-range?min=${min}&max=${max}`);
    return response;
  }

  /**
   * Get all available themes
   */
  async getAllThemes(): Promise<string[]> {
    const response = await apiClient.get(`${this.baseUrl}/themes`);
    return response;
  }

  /**
   * Get puzzle statistics
   */
  async getPuzzleStats(): Promise<PuzzleStats> {
    const response = await apiClient.get(`${this.baseUrl}/stats`);
    return response;
  }

  /**
   * Search puzzles by multiple criteria
   */
  async searchPuzzles(filters: {
    difficulty?: number;
    theme?: string;
  }): Promise<Puzzle[]> {
    const params = new URLSearchParams();
    
    if (filters.difficulty !== undefined) {
      params.append('difficulty', filters.difficulty.toString());
    }
    
    if (filters.theme) {
      params.append('theme', filters.theme);
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/search?${queryString}` : `${this.baseUrl}/search`;
    
    const response = await apiClient.get(url);
    return response;
  }

  /**
   * Create a new puzzle
   */
  async createPuzzle(puzzleData: {
    fen: string;
    solution: string;
    description: string;
    theme: string;
    difficulty: number;
    moveCount: number;
  }): Promise<Puzzle> {
    const response = await apiClient.post(this.baseUrl, puzzleData);
    return response;
  }

  /**
   * Get puzzles created by the current user
   */
  async getMyPuzzles(): Promise<Puzzle[]> {
    const response = await apiClient.get(`${this.baseUrl}/my-puzzles`);
    return response;
  }

  /**
   * Get puzzles created by a specific user
   */
  async getPuzzlesByUser(userId: number): Promise<Puzzle[]> {
    const response = await apiClient.get(`${this.baseUrl}/by-user/${userId}`);
    return response;
  }

  /**
   * Update an existing puzzle
   */
  async updatePuzzle(id: number, puzzleData: {
    fen: string;
    solution: string;
    description: string;
    theme: string;
    difficulty: number;
    moveCount: number;
  }): Promise<Puzzle> {
    const response = await apiClient.put(`${this.baseUrl}/${id}`, puzzleData);
    return response;
  }

  /**
   * Delete a puzzle
   */
  async deletePuzzle(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

// Singleton instance
let puzzleServiceInstance: PuzzleService | null = null;

export function getPuzzleService(): PuzzleService {
  if (!puzzleServiceInstance) {
    puzzleServiceInstance = new PuzzleService();
  }
  return puzzleServiceInstance;
}