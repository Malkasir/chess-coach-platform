/**
 * Training Session Constants
 * Single source of truth for training session room code validation
 */

/**
 * Training session room code pattern: TRAIN-XXX
 * Where XXX are three uppercase letters (A-Z)
 * Example: TRAIN-ABC
 */
export const TRAINING_ROOM_CODE_REGEX = /^TRAIN-[A-Z]{3}$/;

/**
 * Expected length of training session room codes
 */
export const TRAINING_ROOM_CODE_LENGTH = 9;

/**
 * Placeholder text for training session room code input
 */
export const TRAINING_ROOM_CODE_PLACEHOLDER = 'TRAIN-ABC';

/**
 * Validates a training session room code
 * @param code - The room code to validate
 * @returns true if valid, false otherwise
 */
export function isValidTrainingRoomCode(code: string): boolean {
  return TRAINING_ROOM_CODE_REGEX.test(code);
}
