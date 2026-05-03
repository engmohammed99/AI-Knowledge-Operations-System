import { db } from '../db/index.js';
import { insights } from '../db/schema.js';
import { desc } from 'drizzle-orm';

export const createInsightsBatch = async (data: any[]) => {
  if (data.length === 0) return;
  await db.insert(insights).values(data);
};

export const getLatestInsights = async () => {
  return await db.query.insights.findMany({
    orderBy: [desc(insights.createdAt)],
    limit: 10,
  });
};
