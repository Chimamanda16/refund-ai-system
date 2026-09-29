import { Router } from 'express';
import * as controller from '../controllers/refundController.js';
import { validate } from '../middleware/validate.js';
import { customerIdQuery, refundIdParams } from '../validators/common.js';
import { createRefundBody, customerMessageBody } from '../validators/refund.validators.js';

const router = Router();
router.post('/', validate({ body: createRefundBody }), controller.createRefund);
router.get('/:refundId', validate({ params: refundIdParams, query: customerIdQuery }), controller.getRefund);
router.post('/:refundId/messages', validate({ params: refundIdParams, body: customerMessageBody }), controller.replyToVerification);
export default router;
