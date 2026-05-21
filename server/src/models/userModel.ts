import { pool } from '../config/db';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  permission_to_crud: boolean;
  role: 'admin' | 'user';
  created_at: Date;
}

export class UserModel {
  // Find a user by email
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0] || null;
  }

  // Find a user by ID
  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT id, name, email, permission_to_crud, role, created_at FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // Create a new user
  static async create(
    name: string,
    email: string,
    passwordHash: string,
    role: 'admin' | 'user' = 'user',
    permissionToCrud = false
  ): Promise<User> {
    const query = `
      INSERT INTO users (name, email, password, role, permission_to_crud)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, permission_to_crud, created_at
    `;
    const { rows } = await pool.query(query, [
      name,
      email,
      passwordHash,
      role,
      permissionToCrud,
    ]);
    return rows[0];
  }

  // Get all users (excluding passwords)
  static async getAll(): Promise<User[]> {
    const query = 'SELECT id, name, email, role, permission_to_crud, created_at FROM users ORDER BY id ASC';
    const { rows } = await pool.query(query);
    return rows;
  }

  // Delete a user
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const { rowCount } = await pool.query(query, [id]);
    return rowCount ? rowCount > 0 : false;
  }

  // Update a user's CRUD permissions
  static async updatePermission(id: number, permissionToCrud: boolean): Promise<User | null> {
    const query = `
      UPDATE users
      SET permission_to_crud = $1
      WHERE id = $2
      RETURNING id, name, email, role, permission_to_crud, created_at
    `;
    const { rows } = await pool.query(query, [permissionToCrud, id]);
    return rows[0] || null;
  }
}
