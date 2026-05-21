import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();


router.use(authenticateJWT as any);

router.get('/', getCart as any);
router.post('/', addToCart as any);
router.put('/:productId', updateCartQuantity as any);
router.delete('/:productId', removeFromCart as any);
router.delete('/', clearCart as any);

export default router;
