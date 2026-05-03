import { Request, Response } from 'express';
import { generateSingleEmbedding, generateRAGResponse } from '../services/ai.service.js';
import { queryPinecone } from '../repositories/vector.repo.js';
import { getChunksByVectorIds } from '../repositories/document.repo.js';

export const askQuestion = async (req: Request, res: Response): Promise<any> => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: "A valid 'question' string is required." });
    }

    console.log(`[AI Controller] Processing question: "${question}"`);

    // Step 1: Embed the user's question
    const questionEmbedding = await generateSingleEmbedding(question);

    // Step 2: Search Pinecone for the Top 5 most relevant chunks
    const pineconeMatches = await queryPinecone(questionEmbedding, 5);
    
    if (pineconeMatches.length === 0) {
      return res.status(404).json({ error: "No relevant context found in the database." });
    }

    // Step 3: Hydrate the context from PostgreSQL
    const vectorIds = pineconeMatches.map(match => match.vectorId);
    const rawChunks = await getChunksByVectorIds(vectorIds);

    // Step 4: Synthesize the final answer using OpenAI
    const aiResponse = await generateRAGResponse(question, rawChunks);

    // 200 OK: Return the structured JSON to the frontend
    return res.status(200).json({
      data: aiResponse
    });

  } catch (error) {
    console.error("[AI Controller] Error processing query:", error);
    return res.status(500).json({ error: "Failed to generate AI response." });
  }
};
