import { pool } from '../config/db';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  img: string | null;
  price: number;
  stock: number;
  ratings: number;
  availability: boolean;
  created_at: Date;
}

export class ProductModel {
  
  static async create(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const query = `
      INSERT INTO products (name, description, img, price, stock, ratings, availability)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [
      product.name,
      product.description,
      product.img,
      product.price,
      product.stock,
      product.ratings,
      product.availability,
    ]);

    
    return {
      ...rows[0],
      price: parseFloat(rows[0].price),
      ratings: parseFloat(rows[0].ratings),
    };
  }

  
  static async getAll(onlyAvailable = false): Promise<Product[]> {
    let query = 'SELECT * FROM products';
    const params: any[] = [];

    if (onlyAvailable) {
      query += ' WHERE availability = TRUE';
    }

    query += ' ORDER BY id DESC';

    const { rows } = await pool.query(query, params);
    return rows.map((row) => ({
      ...row,
      price: parseFloat(row.price),
      ratings: parseFloat(row.ratings),
    }));
  }

  
  static async findById(id: number): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE id = $1';
    const { rows } = await pool.query(query, [id]);

    if (!rows[0]) return null;

    return {
      ...rows[0],
      price: parseFloat(rows[0].price),
      ratings: parseFloat(rows[0].ratings),
    };
  }

  
  static async update(
    id: number,
    product: Partial<Omit<Product, 'id' | 'created_at'>>
  ): Promise<Product | null> {
    
    const fields = Object.keys(product);
    if (fields.length === 0) return await this.findById(id);

    const setClauses = fields.map((field, idx) => `"${field}" = $${idx + 2}`).join(', ');
    const query = `
      UPDATE products
      SET ${setClauses}
      WHERE id = $1
      RETURNING *
    `;

    const values = [id, ...Object.values(product)];
    const { rows } = await pool.query(query, values);

    if (!rows[0]) return null;

    return {
      ...rows[0],
      price: parseFloat(rows[0].price),
      ratings: parseFloat(rows[0].ratings),
    };
  }

  
  static async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1';
    const { rowCount } = await pool.query(query, [id]);
    return rowCount ? rowCount > 0 : false;
  }
}
