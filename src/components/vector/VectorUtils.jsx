// Simple vector utilities without external dependencies

/**
 * Generate a simple embedding vector from text using TF-IDF-like approach
 * This is a basic implementation that doesn't require API keys
 */
export function generateSimpleEmbedding(text, dimensions = 128) {
  const normalized = text.toLowerCase();
  const words = normalized.match(/\b\w+\b/g) || [];
  
  // Create a deterministic vector based on word hashes
  const vector = new Array(dimensions).fill(0);
  
  words.forEach((word, idx) => {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Distribute across vector dimensions
    const position = Math.abs(hash) % dimensions;
    vector[position] += 1 / Math.sqrt(words.length);
    
    // Add secondary positions for better distribution
    const position2 = Math.abs(hash * 31) % dimensions;
    vector[position2] += 0.5 / Math.sqrt(words.length);
  });
  
  // Normalize the vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find most similar documents to a query
 */
export function findSimilarDocuments(queryVector, documents, topK = 5) {
  const scored = documents.map(doc => ({
    ...doc,
    similarity_score: cosineSimilarity(queryVector, doc.vector)
  }));
  
  return scored
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, topK);
}

/**
 * Chunk text into smaller pieces for better vector search
 */
export function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim()) {
      chunks.push(chunk);
    }
  }
  
  return chunks;
}

/**
 * Calculate vector statistics
 */
export function getVectorStats(vectors) {
  if (!vectors || vectors.length === 0) {
    return { count: 0, avgDimensions: 0, totalSize: 0 };
  }
  
  const count = vectors.length;
  const avgDimensions = vectors.reduce((sum, v) => sum + v.length, 0) / count;
  const totalSize = vectors.reduce((sum, v) => sum + v.length, 0);
  
  return { count, avgDimensions, totalSize };
}