import { CartModel, CartItem, CartItemWithProduct } from '../models/cartModel';
import { ProductModel } from '../models/productModel';

export interface CartSummary {
  items: CartItemWithProduct[];
  totalItemsCount: number;
  totalCost: number;
}

export class CartService {
  
  static async getCartSummary(userId: number): Promise<CartSummary> {
    const items = await CartModel.getCart(userId);
    const totalCost = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItemsCount = items.reduce((count, item) => count + item.quantity, 0);

    return {
      items,
      totalItemsCount,
      totalCost: parseFloat(totalCost.toFixed(2)),
    };
  }

  
  static async addToCart(userId: number, productId: number, quantity: number): Promise<CartItem> {
    
    const product = await ProductModel.findById(productId);
    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    
    if (product.stock < quantity) {
      const error: any = new Error(`Insufficient stock. Only ${product.stock} items available.`);
      error.statusCode = 400;
      throw error;
    }

    
    return await CartModel.addToCart(userId, productId, quantity);
  }

  
  static async updateCartQuantity(userId: number, productId: number, quantity: number): Promise<CartItem> {
    
    const product = await ProductModel.findById(productId);
    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    
    if (product.stock < quantity) {
      const error: any = new Error(`Insufficient stock. Only ${product.stock} items available.`);
      error.statusCode = 400;
      throw error;
    }

    
    const updatedItem = await CartModel.updateQuantity(userId, productId, quantity);
    if (!updatedItem) {
      const error: any = new Error('Item not found in your cart');
      error.statusCode = 404;
      throw error;
    }

    return updatedItem;
  }

  
  static async removeFromCart(userId: number, productId: number): Promise<void> {
    const removed = await CartModel.removeFromCart(userId, productId);
    if (!removed) {
      const error: any = new Error('Item not found in your cart');
      error.statusCode = 404;
      throw error;
    }
  }

  
  static async clearCart(userId: number): Promise<void> {
    await CartModel.clearCart(userId);
  }
}
