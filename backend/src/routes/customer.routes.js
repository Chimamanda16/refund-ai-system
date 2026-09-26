import { Router } from 'express';
import * as controller from '../controllers/customerController.js';
import { validate } from '../middleware/validate.js';
import { customerIdParams } from '../validators/common.js';

const router = Router();
router.get('/', controller.listCustomers);
router.get('/:customerId/orders', validate({ params: customerIdParams }), controller.listCustomerOrders);
router.get('/:customerId/refunds', validate({ params: customerIdParams }), controller.listCustomerRefunds);
export default router;
