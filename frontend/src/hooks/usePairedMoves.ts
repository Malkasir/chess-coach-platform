import { useMemo } from 'react';

interface MovePair {
  white: string | null;
  black: string | null;
}

/**
 * Pairs chess moves into white/black move pairs for display
 * @param moveHistory - Array of moves in SAN notation (e.g., ["e4", "e5", "Nf3", "Nc6"])
 * @returns Array of move pairs (e.g., [{white: "e4", black: "e5"}, {white: "Nf3", black: "Nc6"}])
 */
export const usePairedMoves = (moveHistory: string[]): MovePair[] => {
  return useMemo(() => {
    const pairs: MovePair[] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        white: moveHistory[i] || null,
        black: moveHistory[i + 1] || null
      });
    }
    return pairs;
  }, [moveHistory]);
};
