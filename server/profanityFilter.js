import { Filter } from 'bad-words';

const filter = new Filter({ placeHolder: '*' });

/**
 * Filter profanity from text
 * @param {string} text - The text to filter
 * @returns {string} - Filtered text with profanity replaced by asterisks
 */
export function filterText(text) {
  if (!text || typeof text !== 'string') return text;
  return filter.clean(text);
}

/**
 * Check if text contains profanity
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains profanity
 */
export function hasProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  return filter.isProfane(text);
}
