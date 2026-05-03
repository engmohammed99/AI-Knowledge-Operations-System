import { Router } from 'express';
import { askQuestion } from '../controllers/ai.controller.js';

const router = Router();

// Expects a JSON body: { "question": "What is the transaction fee?" }
router.post('/query', askQuestion);

export default router;
