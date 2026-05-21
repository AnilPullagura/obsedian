import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { ProductService } from '../services/productService';

// Retrieve all products
export const getProducts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const products = await ProductService.getAllProducts();
    return res.status(200).json({ products });
  } catch (error) {
    next(error);
  }
};

// Retrieve a specific product by ID
export const getProductById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const productId = parseInt(req.params.id as string, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const product = await ProductService.getProductById(productId);
    return res.status(200).json({ product });
  } catch (error) {
    next(error);
  }
};

// Create a new product (Protected)
export const createProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { name, description, img, price, stock, ratings, availability } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Name, price, and stock are required fields' });
  }

  try {
    const newProduct = await ProductService.createProduct({
      name,
      description: description || null,
      img: img || null,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      ratings: ratings !== undefined ? parseFloat(ratings) : 0,
      availability: availability !== undefined ? Boolean(availability) : true,
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing product (Protected)
export const updateProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const productId = parseInt(req.params.id as string, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    const updateData: any = { ...req.body };
    if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock, 10);
    if (updateData.ratings !== undefined) updateData.ratings = parseFloat(updateData.ratings);
    if (updateData.availability !== undefined) updateData.availability = Boolean(updateData.availability);

    const updatedProduct = await ProductService.updateProduct(productId, updateData);

    return res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a product (Protected)
export const deleteProduct = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const productId = parseInt(req.params.id as string, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ message: 'Invalid product ID format' });
  }

  try {
    await ProductService.deleteProduct(productId);
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
