import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'prop_excel_super_secure_cto_level_jwt_secret_key_123!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthResult {
  token: string;
  user: Omit<User, 'password'>;
}

export class AuthService {
  // Signup business logic
  static async signup(name: string, email: string, passwordRaw: string): Promise<AuthResult> {
    // 1. Double check duplicate user (business logic checks database constraint beforehand)
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      const error: any = new Error('User with this email already exists');
      error.statusCode = 409;
      throw error;
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordRaw, salt);

    // 3. Create database row
    const newUser = await UserModel.create(name, email, hashedPassword);

    // 4. Sign token
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        permission_to_crud: newUser.permission_to_crud,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return { token, user: newUser };
  }

  // Login business logic
  static async login(email: string, passwordRaw: string): Promise<AuthResult> {
    const user = await UserModel.findByEmail(email);
    if (!user || !user.password) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Compare credentials
    const isPasswordMatch = await bcrypt.compare(passwordRaw, user.password);
    if (!isPasswordMatch) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const { password: _, ...safeUser } = user;

    // Generate JWT session token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permission_to_crud: user.permission_to_crud,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return { token, user: safeUser };
  }
}
