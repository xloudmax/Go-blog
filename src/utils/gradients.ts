
export const HERO_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', // Blue - Cyan
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', // Violet - Pink
  'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', // Emerald - Blue
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', // Amber - Red
  'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Indigo - Purple
  'linear-gradient(135deg, #f43f5e 0%, #fe18d3 100%)', // Rose - Magenta
];

/**
 * Returns a deterministic random gradient based on the input string (hash).
 */
export const getGradientByString = (str: string): string => {
  if (!str) return HERO_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return HERO_GRADIENTS[Math.abs(hash) % HERO_GRADIENTS.length];
};
