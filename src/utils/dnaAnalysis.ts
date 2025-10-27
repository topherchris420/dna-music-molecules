/**
 * Calculate DNA sequence complexity based on entropy and pattern variance
 */
export const calculateComplexity = (sequence: string): number => {
  if (!sequence || sequence.length === 0) return 0;

  // Calculate Shannon entropy
  const bases = ['A', 'T', 'C', 'G'];
  const frequencies = bases.map(base => {
    const count = (sequence.match(new RegExp(base, 'g')) || []).length;
    return count / sequence.length;
  });

  const entropy = -frequencies.reduce((sum, freq) => {
    if (freq === 0) return sum;
    return sum + freq * Math.log2(freq);
  }, 0);

  // Normalize to 0-100 scale (max entropy for 4 bases is 2)
  return Math.round((entropy / 2) * 100);
};

/**
 * Generate mini waveform data points from DNA sequence
 */
export const generateWaveform = (sequence: string): number[] => {
  const baseValues: Record<string, number> = {
    'A': 0.25,
    'T': 0.5,
    'C': 0.75,
    'G': 1.0
  };

  return sequence.split('').map(base => baseValues[base] || 0.5);
};

/**
 * Get organism category
 */
export const getOrganismCategory = (name: string): string => {
  const categories: Record<string, string[]> = {
    'Animals': ['Human', 'Tardigrade'],
    'Plants': ['Redwood'],
    'Fungi': ['Mycelium'],
    'Microbes': ['E. coli'],
    'Marine': ['Coral']
  };

  for (const [category, organisms] of Object.entries(categories)) {
    if (organisms.includes(name)) return category;
  }
  return 'Other';
};
