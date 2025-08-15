/**
 * Chess AI Personalities
 * 
 * Collection of chess AI personalities with distinct playing styles
 * inspired by the classic ChessMaster personality system.
 */

import { ChessPersonality } from '../types/personality.types';

export const CHESS_PERSONALITIES: ChessPersonality[] = [
  {
    id: 'aggressive-alex',
    name: 'Aggressive Alex',
    description: 'Loves tactical combinations and attacking play. Never backs down from a fight!',
    avatar: '🔥',
    skillLevel: 8,
    targetElo: 1200,
    color: '#ff6b35',
    playingStyle: {
      aggression: 85,
      tacticalPreference: 80,
      riskTolerance: 75,
      developmentSpeed: 70
    },
    adaptiveSettings: {
      enabled: true,
      adaptationRate: 60,
      minSkillLevel: 6,
      maxSkillLevel: 12
    },
    quotes: [
      "Attack is the best defense!",
      "I smell a sacrifice coming...",
      "Let's make this position explode!",
      "Time to turn up the heat!"
    ]
  },
  
  {
    id: 'strategic-sophia',
    name: 'Strategic Sophia',
    description: 'Patient and positional. Builds pressure slowly and converts small advantages.',
    avatar: '🏛️',
    skillLevel: 10,
    targetElo: 1400,
    color: '#4ecdc4',
    playingStyle: {
      aggression: -20,
      tacticalPreference: 25,
      riskTolerance: 15,
      developmentSpeed: 30
    },
    adaptiveSettings: {
      enabled: true,
      adaptationRate: 40,
      minSkillLevel: 8,
      maxSkillLevel: 14
    },
    quotes: [
      "Patience is the key to victory.",
      "Every move must have a purpose.",
      "Small advantages accumulate.",
      "The position speaks for itself."
    ]
  },
  
  {
    id: 'tactical-tim',
    name: 'Tactical Tim',
    description: 'Sharp calculator who loves puzzles and combinations. Finds tactics everywhere!',
    avatar: '⚡',
    skillLevel: 12,
    targetElo: 1600,
    color: '#ffe66d',
    playingStyle: {
      aggression: 45,
      tacticalPreference: 95,
      riskTolerance: 60,
      developmentSpeed: 80
    },
    adaptiveSettings: {
      enabled: true,
      adaptationRate: 70,
      minSkillLevel: 10,
      maxSkillLevel: 16
    },
    quotes: [
      "I see a tactic brewing...",
      "Every position has a solution!",
      "Let me calculate this...",
      "Ah, a beautiful combination!"
    ]
  },
  
  {
    id: 'steady-sam',
    name: 'Steady Sam',
    description: 'Rock-solid defender who never makes mistakes. Hard to crack but patient.',
    avatar: '🐌',
    skillLevel: 6,
    targetElo: 1000,
    color: '#95a5a6',
    playingStyle: {
      aggression: -50,
      tacticalPreference: 10,
      riskTolerance: 5,
      developmentSpeed: 20
    },
    adaptiveSettings: {
      enabled: true,
      adaptationRate: 30,
      minSkillLevel: 4,
      maxSkillLevel: 10
    },
    quotes: [
      "Slow and steady wins the race.",
      "Safety first!",
      "No rush, no mistakes.",
      "Defense is an art form."
    ]
  },
  
  {
    id: 'balanced-beth',
    name: 'Balanced Beth',
    description: 'Well-rounded player who adapts to any position. The perfect sparring partner.',
    avatar: '👑',
    skillLevel: 9,
    targetElo: 1300,
    color: '#a8e6cf',
    playingStyle: {
      aggression: 10,
      tacticalPreference: 50,
      riskTolerance: 40,
      developmentSpeed: 50
    },
    adaptiveSettings: {
      enabled: true,
      adaptationRate: 50,
      minSkillLevel: 7,
      maxSkillLevel: 13
    },
    quotes: [
      "Adapting to every position.",
      "Balance is the key.",
      "Let's see what this position offers.",
      "Every game teaches something new."
    ]
  }
];

/**
 * Get a personality by ID
 */
export function getPersonalityById(id: string): ChessPersonality | undefined {
  return CHESS_PERSONALITIES.find(p => p.id === id);
}

/**
 * Get personalities sorted by skill level
 */
export function getPersonalitiesBySkill(): ChessPersonality[] {
  return [...CHESS_PERSONALITIES].sort((a, b) => a.skillLevel - b.skillLevel);
}

/**
 * Get a random personality quote
 */
export function getRandomQuote(personality: ChessPersonality): string {
  const quotes = personality.quotes;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

/**
 * Default personality for new games
 */
export const DEFAULT_PERSONALITY = CHESS_PERSONALITIES[4]; // Balanced Beth