import { Router } from 'express';
import * as controller from '../controllers/refundController.js';
import { validate } from '../middleware/validate.js';
import { refundIdParams } from '../validators/common.js';
import { createRefundBody } from '../validators/refund.validators.js';

const router = Router();
router.post('/', validate({ body: createRefundBody }), controller.createRefund);
router.get('/:refundId', validate({ params: refundIdParams }), controller.getRefund);
export default router;
