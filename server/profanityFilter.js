import { Filter } from 'bad-words';

const filter = new Filter({ placeHolder: '*' });

// Custom regex patterns to catch obfuscated profanity
const customPatterns = [
  /f[\*@#!$%^&()_\-+=\[\]{}|\\:;"'<>,.?/~`]{0,2}ck/gi,     // f*ck, f@ck, fuck, f#ck, etc.
  /sh[\*@#!$%^&()_\-+=\[\]{}|\\:;"'<>,.?/~`]{0,2}t/gi,      // sh*t, sh@t, shit, sh#t, etc.
  /d[\*@#!$%^&()_\-+=\[\]{}|\\:;"'<>,.?/~`]{0,2}mn/gi,      // d*mn, d@mn, damn, d#mn, etc.
  /a[s$][\*@#!$%^&()_\-+=\[\]{}|\\:;"'<>,.?/~`]{0,2}h[\*@#!$%^&()_\-+=\[\]{}|\\:;"'<>,.?/~`]{0,2}le/gi, // a**hole
  /b[\*@#!$%^&()_\-+=\[\]{}|\\:;"'<>,.?/~`]{0,2}tch/gi,     // b*tch, b@tch, bitch, etc.
  /h[\*@#!$%^&()_\-+=\[\]{}|\\:;"'<>,.?/~`]{0,2}ll/gi,      // h*ll, h@ll, hell, etc.
  /[nN].{0,5}[eEaA3][rR]/gi,   // n[anything]er - catches n-word variations
];

/**
 * Filter profanity from text (both standard and obfuscated)
 * @param {string} text - The text to filter
 * @returns {string} - Filtered text with profanity replaced by asterisks
 */
export function filterText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // First, use bad-words filter for standard profanity
  let filtered = filter.clean(text);
  
  // Then apply custom regex patterns for obfuscated variations
  customPatterns.forEach(pattern => {
    filtered = filtered.replace(pattern, match => '*'.repeat(match.length));
  });
  
  return filtered;
}

/**
 * Check if text contains profanity
 * @param {string} text - The text to check
 * @returns {boolean} - True if text contains profanity
 */
export function hasProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  
  if (filter.isProfane(text)) return true;
  
  // Check obfuscated variations
  return customPatterns.some(pattern => pattern.test(text));
}
