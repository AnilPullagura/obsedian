import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticateJWT, canCRUDProducts } from '../middlewares/authMiddleware';

const router = Router();


router.get('/', authenticateJWT as any, getProducts as any);
router.get('/:id', authenticateJWT as any, getProductById as any);


router.post('/', authenticateJWT as any, canCRUDProducts as any, createProduct as any);
router.put('/:id', authenticateJWT as any, canCRUDProducts as any, updateProduct as any);
router.delete('/:id', authenticateJWT as any, canCRUDProducts as any, deleteProduct as any);

export default router;
