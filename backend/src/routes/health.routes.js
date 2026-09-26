import { Router } from 'express';
import * as controller from '../controllers/healthController.js';

const router = Router();
router.get('/', controller.getHealth);
export default router;
