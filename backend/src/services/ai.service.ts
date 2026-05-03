import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config();

// Add these types to the top of your file for strict safety
export interface ContextChunk {
  content: string;
  document: {
    filename: string;
    sourceType: string;
  } | null;
}

export interface AIResponsePayload {
  answer: string;
  sources: string[];
  confidence: number;
  reasoning: string;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateSingleEmbedding = async (text: string): Promise<number[]> => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });
  return response.data[0].embedding;
};

export const generateEmbeddingsBatch = async (texts: string[]): Promise<number[][]> => {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    // Extract the embedding arrays in the same order they were sent
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error("[AIService] Embedding batch generation failed:", error);
    throw error;
  }
};

/**
 * The core Reasoning Engine. Constructs a strict system prompt and forces
 * the LLM to return a highly structured JSON response.
 */
export const generateRAGResponse = async (question: string, chunks: ContextChunk[]): Promise<AIResponsePayload> => {
  try {
    // 1. Format the retrieved database chunks into a readable string for the LLM
    const formattedContext = chunks
      .map((chunk, index) => {
        const sourceName = chunk.document?.filename || "Unknown Source";
        return `[Source ${index + 1}: ${sourceName}]\n${chunk.content}\n`;
      })
      .join("\n---\n");

    // 2. The "Founding Engineer" System Prompt
    // Notice how we aggressively constrain the AI to prevent hallucinations.
    const systemPrompt = `
      You are an expert internal AI Knowledge Assistant for a FinTech company. 
      Your job is to answer user questions based STRICTLY on the provided context.
      
      RULES:
      1. If the answer is not contained in the context, you MUST say "I don't have enough information to answer that." Do not guess.
      2. You must extract and cite the exact source filenames used to formulate your answer.
      3. Evaluate your confidence in the answer from 0.0 to 1.0. (e.g., 0.95 means the context perfectly answers the question).
      4. Provide a brief reasoning explaining how you arrived at your answer.
      
      You MUST respond in valid JSON matching this exact schema:
      {
        "answer": "Your detailed answer here...",
        "sources": ["filename1.pdf", "filename2.txt"],
        "confidence": 0.95,
        "reasoning": "I found the pricing details in filename1.pdf and..."
      }
    `;

    // 3. Make the call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Extremely fast and cheap, perfect for RAG
      response_format: { type: "json_object" }, // Forces the AI to output valid JSON
      temperature: 0.1, // Low temperature = highly deterministic and factual
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `CONTEXT:\n${formattedContext}\n\nUSER QUESTION: ${question}` 
        }
      ],
    });

    // 4. Parse and return the validated JSON
    const rawContent = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(rawContent) as AIResponsePayload;
    
    return parsedResponse;

  } catch (error) {
    console.error("[AIService] Failed to generate RAG response:", error);
    throw new Error("AI Reasoning Engine failed.");
  }
};

export interface DocumentAnalysisInput {
  id: string;
  filename: string;
  content: string;
}

export const generateProactiveInsights = async (documents: DocumentAnalysisInput[]) => {
  try {
    const formattedDocs = documents.map(d => `[ID: ${d.id} | File: ${d.filename}]\n${d.content}`).join("\n\n---\n\n");

    const systemPrompt = `
      You are an elite Data Analyst AI for a FinTech company. 
      Analyze the provided documents and identify cross-document insights.
      
      Look specifically for:
      1. 'issue': Frequent problems, bottlenecks, or customer complaints.
      2. 'decision': Repeated or finalized business decisions.
      3. 'conflict': Contradictory information between different documents.

      Extract up to 3 major insights. You MUST return valid JSON matching this exact schema:
      {
        "insights": [
          {
            "category": "issue" | "decision" | "conflict",
            "title": "Short, punchy title (e.g., 'Conflicting Transaction Fees')",
            "description": "Detailed explanation of the insight.",
            "source_document_ids": ["uuid-from-context"]
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', 
      response_format: { type: "json_object" },
      temperature: 0.2, // Low temperature for analytical accuracy
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `DOCUMENTS TO ANALYZE:\n${formattedDocs}` }
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return parsed.insights || [];

  } catch (error) {
    console.error("[AIService] Failed to generate insights:", error);
    return [];
  }
};
