import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createDocument, createDocumentChunks, updateDocumentStatus } from '../repositories/document.repo.js';
import { upsertVectors } from '../repositories/vector.repo.js';
import { generateEmbeddingsBatch } from './ai.service.js';
import { generateChunks } from '../utils/chunker.js';
import { extractText } from '../utils/pdf-parser.js';

export const processFiles = async (files: Express.Multer.File[]) => {
  const ingestedDocs = [];

  for (const file of files) {
    const extension = file.originalname.split('.').pop()?.toLowerCase() || 'unknown';
    let extractedText = "";

    // 1. Extract Text
    if (extension === 'txt' || extension === 'md') {
      extractedText = file.buffer.toString('utf-8');
    } else if (extension === 'pdf') {
      extractedText = await extractText(file.buffer); 
    } else {
      throw new Error(`Unsupported file type: ${extension}`);
    }

    // 2. Hash & Initial DB Record
    const contentHash = crypto.createHash('sha256').update(extractedText).digest('hex');
    const docRecord = await createDocument({
      filename: file.originalname,
      sourceType: extension,
      contentHash,
      status: 'pending'
    });
    
    ingestedDocs.push(docRecord);

    // 3. Fire-and-Forget Background Processing (Don't await this so the HTTP request finishes!)
    runEmbeddingPipeline(docRecord.id, extractedText).catch(console.error);
  }

  return ingestedDocs;
};

/**
 * The core RAG pipeline. This runs asynchronously in the background.
 */
export const runEmbeddingPipeline = async (documentId: string, text: string) => {
  try {
    // 1. Chunk the text
    const chunks = generateChunks(text);
    if (chunks.length === 0) return;

    // 2. Generate Embeddings (Batch)
    const embeddings = await generateEmbeddingsBatch(chunks);

    // 3. Prepare data for both databases
    const pineconeVectors = [];
    const postgresChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      const vectorId = uuidv4(); // Generate a single ID to link both DBs
      
      pineconeVectors.push({
        id: vectorId,
        values: embeddings[i],
        metadata: { documentId, chunkIndex: i.toString() }
      });

      postgresChunks.push({
        documentId: documentId,
        content: chunks[i],
        vectorId: vectorId,
        chunkIndex: i.toString()
      });
    }

    // 4. Save to Pinecone (Vector DB) first
    await upsertVectors(pineconeVectors);

    // 5. Save chunks to Postgres (Relational DB)
    await createDocumentChunks(postgresChunks);

    // 6. Mark document as completely processed
    await updateDocumentStatus(documentId, 'processed');
    console.log(`[Ingest Pipeline] Document ${documentId} processed successfully.`);

  } catch (error) {
    console.error(`[Ingest Pipeline] Failed processing doc ${documentId}:`, error);
    await updateDocumentStatus(documentId, 'failed');
  }
};

export const processExternalSource = async (sourceName: string, content: string) => {
  // 1. Hash the content for deduplication
  const contentHash = crypto.createHash('sha256').update(content).digest('hex');
  
  // 2. Create the initial database record
  const docRecord = await createDocument({
    filename: sourceName,
    sourceType: 'external_api',
    contentHash: contentHash,
    status: 'pending'
  });

  // 3. Fire-and-Forget the exact same RAG pipeline we use for files!
  runEmbeddingPipeline(docRecord.id, content).catch(console.error);

  return docRecord;
};
