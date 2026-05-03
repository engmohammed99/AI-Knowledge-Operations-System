import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });
const index = pc.index(process.env.PINECONE_INDEX as string);

export const upsertVectors = async (vectors: { id: string; values: number[]; metadata?: any }[]) => {
  try {
    await index.upsert({ records: vectors });
  } catch (error) {
    console.error("[VectorRepo] Failed to upsert to Pinecone:", error);
    throw error;
  }
};

/**
 * Searches Pinecone for the most semantically similar vectors.
 * @param embedding The vectorized user question
 * @param topK How many chunks to return (default 5)
 */
export const queryPinecone = async (embedding: number[], topK: number = 5) => {
  try {
    const queryResponse = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true, // Grabs the documentId we stored earlier
    });

    // We only need the ID and the similarity score for our pipeline
    return queryResponse.matches.map(match => ({
      vectorId: match.id,
      score: match.score || 0,
      documentId: match.metadata?.documentId as string,
    }));
  } catch (error) {
    console.error("[VectorRepo] Failed to query Pinecone:", error);
    throw error;
  }
};
