import { Router } from 'express';
import multer from 'multer';
import { uploadFiles, ingestSource } from '../controllers/ingest.controller.js';

const router = Router();

// Store file in memory as a buffer rather than saving to disk
const upload = multer({ storage: multer.memoryStorage() });

// Expect an array of files under the form-data key "documents"
router.post('/files', upload.array('documents'), uploadFiles);

// Expects JSON: { "sourceName": "Zendesk API", "content": "..." }
router.post('/source', ingestSource);

export default router;
