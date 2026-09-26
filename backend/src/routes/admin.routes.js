import { Router } from 'express';
import * as controller from '../controllers/adminController.js';
import { validate } from '../middleware/validate.js';
import { refundIdParams } from '../validators/common.js';
import { adminRefundListQuery } from '../validators/refund.validators.js';

// No authentication in Phase 1 (by design). Add an auth middleware here later.
const router = Router();
router.get('/dashboard', controller.getDashboard);
router.get('/refunds', validate({ query: adminRefundListQuery }), controller.listRefunds);
router.get('/refunds/:refundId', validate({ params: refundIdParams }), controller.getRefund);
export default router;
