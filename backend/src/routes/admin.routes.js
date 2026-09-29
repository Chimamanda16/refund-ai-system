import { Router } from 'express';
import * as controller from '../controllers/adminController.js';
import { validate } from '../middleware/validate.js';
import { refundIdParams } from '../validators/common.js';
import { adminRefundListQuery, verificationMessageBody, decisionReasonBody } from '../validators/refund.validators.js';

// No authentication in Phase 1 (by design). Add an auth middleware here later.
const router = Router();
router.get('/dashboard', controller.getDashboard);
router.get('/refunds', validate({ query: adminRefundListQuery }), controller.listRefunds);
router.get('/refunds/:refundId', validate({ params: refundIdParams }), controller.getRefund);
router.post('/refunds/:refundId/verification', validate({ params: refundIdParams, body: verificationMessageBody }), controller.requestVerification);
router.post('/refunds/:refundId/messages', validate({ params: refundIdParams, body: verificationMessageBody }), controller.sendMessage);
router.patch('/refunds/:refundId/approve', validate({ params: refundIdParams, body: decisionReasonBody }), controller.approveRefund);
router.patch('/refunds/:refundId/reject', validate({ params: refundIdParams, body: decisionReasonBody }), controller.rejectRefund);

export default router;
