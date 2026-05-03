import { db } from '../db/index.js';
import { documents, documentChunks } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

export const createDocument = async (data: any) => {
  const [newDoc] = await db.insert(documents).values(data).returning();
  return newDoc;
};

export const createDocumentChunks = async (data: any[]) => {
  await db.insert(documentChunks).values(data);
};

export const updateDocumentStatus = async (id: string, status: string) => {
  await db.update(documents).set({ status }).where(eq(documents.id, id));
};

/**
 * Takes an array of Vector IDs and fetches the raw text AND parent document details.
 */
export const getChunksByVectorIds = async (vectorIds: string[]) => {
  if (!vectorIds || vectorIds.length === 0) return [];

  try {
    // Drizzle's relational query fetches the chunks and the parent filename simultaneously
    const chunks = await db.query.documentChunks.findMany({
      where: inArray(documentChunks.vectorId, vectorIds),
      with: {
        document: {
          columns: {
            filename: true, // Crucial for citing sources!
            sourceType: true,
          }
        }
      }
    });

    return chunks;
  } catch (error) {
    console.error("[DocumentRepo] Failed to fetch chunks by Vector IDs:", error);
    throw error;
  }
};

/**
 * Fetches all documents, ordered by the most recent first.
 */
export const getAllDocuments = async () => {
  try {
    return await db.query.documents.findMany({
      orderBy: (docs, { desc }) => [desc(docs.createdAt)],
    });
  } catch (error) {
    console.error("[DocumentRepo] Failed to fetch all documents:", error);
    throw error;
  }
};

/**
 * Fetches a single document by its UUID.
 */
export const getDocumentById = async (id: string) => {
  try {
    return await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });
  } catch (error) {
    console.error(`[DocumentRepo] Failed to fetch document ${id}:`, error);
    throw error;
  }
};
