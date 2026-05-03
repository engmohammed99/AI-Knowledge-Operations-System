import { Request, Response } from 'express';
import { processFiles, processExternalSource } from '../services/ingest.service.js';

export const uploadFiles = async (req: Request, res: Response): Promise<any> => {
  try {
    // Cast the files from multer
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided." });
    }

    // Hand the raw files over to the Service layer
    const ingestedDocs = await processFiles(files);

    // 202 Accepted: The request has been accepted for processing
    return res.status(202).json({
      message: "Files queued for processing.",
      data: ingestedDocs,
    });

  } catch (error) {
    console.error("[IngestController] Error:", error);
    return res.status(500).json({ error: "Failed to ingest files." });
  }
};

export const ingestSource = async (req: Request, res: Response): Promise<any> => {
  try {
    const { sourceName, content } = req.body;

    if (!sourceName || !content) {
      return res.status(400).json({ error: "Both 'sourceName' and 'content' are required." });
    }

    const documentRecord = await processExternalSource(sourceName, content);

    // Return 202 Accepted because the AI is processing in the background
    return res.status(202).json({
      message: "External source queued for processing.",
      data: documentRecord,
    });
  } catch (error) {
    console.error("[IngestController] Error ingesting source:", error);
    return res.status(500).json({ error: "Failed to ingest external source." });
  }
};
