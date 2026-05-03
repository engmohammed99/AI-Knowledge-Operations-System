import cron from 'node-cron';
import { getAllDocuments } from '../repositories/document.repo.js';
import { db } from '../db/index.js';
import { documentChunks } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateProactiveInsights } from '../services/ai.service.js';
import { createInsightsBatch } from '../repositories/insight.repo.js';

// Reconstruct the documents from their chunks to feed the AI
const fetchRecentDocumentData = async () => {
  const docs = await getAllDocuments();
  // In a real app, you'd filter for docs created in the last 24h. 
  // For testing, we'll grab the latest 5 processed documents.
  const recentDocs = docs.filter(d => d.status === 'processed').slice(0, 5);

  const fullData = [];
  for (const doc of recentDocs) {
    const chunks = await db.query.documentChunks.findMany({
      where: eq(documentChunks.documentId, doc.id)
    });
    const combinedContent = chunks.map(c => c.content).join(" ");

    fullData.push({
      id: doc.id,
      filename: doc.filename,
      content: combinedContent.substring(0, 5000) // Truncate to save tokens if massive
    });
  }
  return fullData;
};

export const startInsightCron = () => {
  // Runs at 2:00 AM every day ('0 2 * * *')
  // For testing right now, change to '*/1 * * * *' to run every 1 minute
  cron.schedule('0 2 * * *', async () => {
    console.log("🔍 [Cron Job] Starting Proactive Insight Scan...");

    try {
      const documentsToAnalyze = await fetchRecentDocumentData();
      if (documentsToAnalyze.length === 0) {
        console.log("ℹ️ [Cron Job] No new documents to analyze.");
        return;
      }

      const newInsights = await generateProactiveInsights(documentsToAnalyze);

      if (newInsights.length > 0) {
        await createInsightsBatch(newInsights);
        console.log(`✅ [Cron Job] Successfully generated and saved ${newInsights.length} insights.`);
      }

    } catch (error) {
      console.error("❌ [Cron Job] Failed to process insights:", error);
    }
  });

  console.log("⏱️ Insight Cron Job scheduled.");
};
