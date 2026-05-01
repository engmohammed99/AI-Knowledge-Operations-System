import { pgTable, text, timestamp, uuid, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. DOCUMENTS TABLE
// ==========================================
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: varchar("filename", { length: 255 }).notNull(),
  sourceType: varchar("source_type", { length: 50 }).notNull(), // 'pdf', 'txt', 'md'
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  contentHash: varchar("content_hash", { length: 255 }), // For deduplication
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==========================================
// 2. DOCUMENT CHUNKS TABLE
// ==========================================
export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .references(() => documents.id, { onDelete: 'cascade' })
    .notNull(),
  content: text("content").notNull(),
  vectorId: varchar("vector_id", { length: 255 }).notNull(), // Links to Pinecone/Chroma
  chunkIndex: varchar("chunk_index", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 3. INSIGHTS TABLE
// ==========================================
export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  sourceDocumentIds: jsonb("source_document_ids"), // Array of document UUIDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// 4. RELATIONS (Advanced Drizzle Feature)
// ==========================================

// This tells Drizzle: "One document has many chunks"
export const documentsRelations = relations(documents, ({ many }) => ({
  chunks: many(documentChunks),
}));

// This tells Drizzle: "Each chunk belongs to exactly one document"
export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));