import { Router } from 'express';
import * as controller from '../controllers/orderController.js';
import { validate } from '../middleware/validate.js';
import { orderIdParams } from '../validators/common.js';

const router = Router();
router.get('/:orderId', validate({ params: orderIdParams }), controller.getOrder);
export default router;
