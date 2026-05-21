import { UserModel, User } from '../models/userModel';

export class UserService {
  // Fetch all registered users
  static async getAllUsers(): Promise<User[]> {
    return await UserModel.getAll();
  }

  // Delete an account (guarding against self-deletion)
  static async deleteUser(adminId: number, targetUserId: number): Promise<void> {
    if (adminId === targetUserId) {
      const error: any = new Error('Admin cannot delete themselves');
      error.statusCode = 400;
      throw error;
    }

    const deleted = await UserModel.delete(targetUserId);
    if (!deleted) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
  }

  // Manage product CRUD permissions for users
  static async updateUserPermission(userId: number, permissionToCrud: boolean): Promise<User> {
    const updatedUser = await UserModel.updatePermission(userId, permissionToCrud);
    if (!updatedUser) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return updatedUser;
  }
}
