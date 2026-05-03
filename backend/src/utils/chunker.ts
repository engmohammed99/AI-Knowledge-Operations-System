/**
 * Splits text into overlapping chunks. 
 * As a pure function, it takes inputs and returns an array without mutating state.
 */
export const generateChunks = (text: string, chunkSize: number = 1000, overlap: number = 200): string[] => {
  if (!text) return [];
  
  const chunks: string[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    chunks.push(text.slice(currentIndex, currentIndex + chunkSize));
    currentIndex += (chunkSize - overlap);
  }

  return chunks;
};
