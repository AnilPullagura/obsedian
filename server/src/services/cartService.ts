import { CartModel, CartItem, CartItemWithProduct } from '../models/cartModel';
import { ProductModel } from '../models/productModel';

export interface CartSummary {
  items: CartItemWithProduct[];
  totalItemsCount: number;
  totalCost: number;
}

export class CartService {
  // Fetch cart lists and sum aggregates
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

  // Add a product to the user's cart (verifying stock limits)
  static async addToCart(userId: number, productId: number, quantity: number): Promise<CartItem> {
    // 1. Verify product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify stock availability
    if (product.stock < quantity) {
      const error: any = new Error(`Insufficient stock. Only ${product.stock} items available.`);
      error.statusCode = 400;
      throw error;
    }

    // 3. Add to cart
    return await CartModel.addToCart(userId, productId, quantity);
  }

  // Update item quantity (verifying stock limits)
  static async updateCartQuantity(userId: number, productId: number, quantity: number): Promise<CartItem> {
    // 1. Verify product exists
    const product = await ProductModel.findById(productId);
    if (!product) {
      const error: any = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify stock availability
    if (product.stock < quantity) {
      const error: any = new Error(`Insufficient stock. Only ${product.stock} items available.`);
      error.statusCode = 400;
      throw error;
    }

    // 3. Execute update
    const updatedItem = await CartModel.updateQuantity(userId, productId, quantity);
    if (!updatedItem) {
      const error: any = new Error('Item not found in your cart');
      error.statusCode = 404;
      throw error;
    }

    return updatedItem;
  }

  // Remove individual product from cart
  static async removeFromCart(userId: number, productId: number): Promise<void> {
    const removed = await CartModel.removeFromCart(userId, productId);
    if (!removed) {
      const error: any = new Error('Item not found in your cart');
      error.statusCode = 404;
      throw error;
    }
  }

  // Clear entire cart
  static async clearCart(userId: number): Promise<void> {
    await CartModel.clearCart(userId);
  }
}
