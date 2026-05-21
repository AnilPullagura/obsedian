import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import { errorHandler } from './middlewares/errorMiddleware';

const app = express();

// Standard Production-grade Middlewares
app.use(cors());
app.use(express.json());

// Log API requests during non-testing environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Obsidian Luxe Backend is running smoothly.' });
});

// Mounting Routing Modules
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

// Catch-all route (404 Not Found)
app.use((req, res) => {
  res.status(404).json({ message: `Route [${req.method}] ${req.url} not found` });
});

// Centralized Error-handling Middleware
app.use(errorHandler as any);

export default app;
