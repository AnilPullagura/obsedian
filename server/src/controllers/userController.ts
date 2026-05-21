import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { UserService } from '../services/userService';

// Retrieve all user details (Admin only)
export const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.getAllUsers();
    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

// Delete user account by ID (Admin only)
export const deleteUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = parseInt(req.params.id as string, 10);

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  try {
    await UserService.deleteUser(req.user.id, userId);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Update user CRUD permission status (Admin only)
export const updateUserPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id as string, 10);
  const { permission_to_crud } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID format' });
  }

  if (typeof permission_to_crud !== 'boolean') {
    return res.status(400).json({ message: 'permission_to_crud must be a boolean' });
  }

  try {
    const updatedUser = await UserService.updateUserPermission(userId, permission_to_crud);
    return res.status(200).json({
      message: 'User permissions updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
