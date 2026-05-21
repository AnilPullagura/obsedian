import { Router } from 'express';
import { getUsers, deleteUser, updateUserPermission } from '../controllers/userController';
import { authenticateJWT, isAdmin } from '../middlewares/authMiddleware';

const router = Router();


router.use(authenticateJWT as any);
router.use(isAdmin as any);


router.get('/', getUsers as any);
router.delete('/:id', deleteUser as any);
router.put('/:id/permission', updateUserPermission as any);

export default router;
