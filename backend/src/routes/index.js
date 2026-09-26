import { Router } from 'express';
import healthRoutes from './health.routes.js';
import customerRoutes from './customer.routes.js';
import orderRoutes from './order.routes.js';
import refundRoutes from './refund.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();
router.use('/health', healthRoutes);
router.use('/customers', customerRoutes);
router.use('/orders', orderRoutes);
router.use('/refunds', refundRoutes);
router.use('/admin', adminRoutes);
export default router;
