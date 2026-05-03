import { Router } from 'express';
import { getDocs, getDocById, getInsights } from '../controllers/document.controller.js';

const router = Router();

router.get('/', getDocs);
router.get('/insights', getInsights);
router.get('/:id', getDocById);

export default router;
