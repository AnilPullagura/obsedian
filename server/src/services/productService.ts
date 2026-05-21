import { ProductModel, Product } from '../models/productModel';

export class ProductService {
  // Fetch all products
  static async getAllProducts(): Promise<Product[]> {
    return await ProductModel.getAll();
  }

  // Fetch product by ID (guarantees finding or throws error)
  static async getProductById(id: number): Promise<Product> {
    const product = await ProductModel.findById(id);
    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  // Create standard product listing
  static async createProduct(productData: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    return await ProductModel.create(productData);
  }

  // Update product details
  static async updateProduct(id: number, productData: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<Product> {
    // 1. Double check product exists
    const existing = await ProductModel.findById(id);
    if (!existing) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await ProductModel.update(id, productData);
    if (!updated) {
      const error: any = new Error('Product could not be updated');
      error.statusCode = 500;
      throw error;
    }

    return updated;
  }

  // Delete product entry
  static async deleteProduct(id: number): Promise<void> {
    const deleted = await ProductModel.delete(id);
    if (!deleted) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
  }
}
