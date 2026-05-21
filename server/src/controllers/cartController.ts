import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { CartService } from '../services/cartService';

// Retrieve all items in the user's cart alongside calculation sums
export const getCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const summary = await CartService.getCartSummary(req.user.id);
    return res.status(200).json({ cart: summary });
  } catch (error) {
    next(error);
  }
};

// Add a product to the user's cart
export const addToCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { product_id, quantity } = req.body;

  if (product_id === undefined) {
    return res.status(400).json({ message: 'product_id is required' });
  }

  const parsedProductId = parseInt(product_id as string, 10);
  const parsedQuantity = quantity !== undefined ? parseInt(quantity as string, 10) : 1;

  if (isNaN(parsedProductId) || parsedQuantity <= 0) {
    return res.status(400).json({ message: 'Invalid product_id or quantity' });
  }

  try {
    const newItem = await CartService.addToCart(req.user.id, parsedProductId, parsedQuantity);
    return res.status(200).json({
      message: 'Product added to cart successfully',
      item: newItem,
    });
  } catch (error) {
    next(error);
  }
};

// Update specific cart item quantity
export const updateCartQuantity = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const productId = parseInt(req.params.productId as string, 10);
  const { quantity } = req.body;

  if (isNaN(productId) || quantity === undefined) {
    return res.status(400).json({ message: 'Invalid product ID or missing quantity' });
  }

  const parsedQuantity = parseInt(quantity as string, 10);
  if (parsedQuantity <= 0) {
    return res.status(400).json({ message: 'Quantity must be greater than zero' });
  }

  try {
    const updatedItem = await CartService.updateCartQuantity(req.user.id, productId, parsedQuantity);
    return res.status(200).json({
      message: 'Cart quantity updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    next(error);
  }
};

// Remove a specific product from the cart
export const removeFromCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const productId = parseInt(req.params.productId as string, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    await CartService.removeFromCart(req.user.id, productId);
    return res.status(200).json({ message: 'Product removed from cart successfully' });
  } catch (error) {
    next(error);
  }
};

// Clear all items in the user's cart
export const clearCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await CartService.clearCart(req.user.id);
    return res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};
