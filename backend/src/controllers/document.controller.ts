import { Request, Response } from 'express';
import { getAllDocuments, getDocumentById } from '../repositories/document.repo.js';
import { getLatestInsights } from '../repositories/insight.repo.js';

export const getDocs = async (req: Request, res: Response): Promise<any> => {
  try {
    const docs = await getAllDocuments();
    return res.status(200).json({ data: docs });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve documents." });
  }
};

export const getDocById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const doc = await getDocumentById(id);

    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }

    return res.status(200).json({ data: doc });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve document." });
  }
};

export const getInsights = async (req: Request, res: Response): Promise<any> => {
  try {
    const insights = await getLatestInsights();
    return res.status(200).json({ data: insights });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve insights." });
  }
};
