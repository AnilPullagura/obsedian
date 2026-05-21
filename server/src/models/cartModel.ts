import { pool } from '../config/db';

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: Date;
}

export interface CartItemWithProduct extends CartItem {
  product_name: string;
  price: number;
  img: string | null;
  stock: number;
}

export class CartModel {
  
  static async addToCart(userId: number, productId: number, quantity = 1): Promise<CartItem> {
    const query = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, productId, quantity]);
    return rows[0];
  }

  
  static async getCart(userId: number): Promise<CartItemWithProduct[]> {
    const query = `
      SELECT 
        c.id, c.user_id, c.product_id, c.quantity, c.created_at,
        p.name AS product_name, p.price, p.img, p.stock
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = $1
      ORDER BY c.created_at ASC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows.map((row) => ({
      ...row,
      price: parseFloat(row.price),
    }));
  }

  
  static async updateQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | null> {
    const query = `
      UPDATE cart_items
      SET quantity = $3
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, productId, quantity]);
    return rows[0] || null;
  }

  
  static async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const query = 'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2';
    const { rowCount } = await pool.query(query, [userId, productId]);
    return rowCount ? rowCount > 0 : false;
  }

  
  static async clearCart(userId: number): Promise<boolean> {
    const query = 'DELETE FROM cart_items WHERE user_id = $1';
    const { rowCount } = await pool.query(query, [userId]);
    return rowCount ? rowCount > 0 : false;
  }
}
