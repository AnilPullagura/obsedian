import request from 'supertest';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import app from '../src/app';
import { pool } from '../src/config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'obsidian_luxe_super_secure_cto_level_jwt_secret_key_123!';

describe('⚡ Obsidian Luxe E2E API Integration Test Suite', () => {
  let adminToken: string;
  let normalUserToken: string;
  let authorizedUserToken: string;
  let testProductId: number;
  let normalUserId: number;
  let authorizedUserId: number;

  const testUserEmail = `testuser_${Date.now()}@example.com`;
  const testAuthUserEmail = `authuser_${Date.now()}@example.com`;

  // Before running tests, rebuild the schema and seed the default Admin
  beforeAll(async () => {
    // Override NODE_ENV to test to silence logger
    process.env.NODE_ENV = 'test';

    const schemaPath = path.join(__dirname, '../src/db/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Reset and build tables
    await pool.query(schemaSql);

    // Seed test Admin
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role, permission_to_crud) 
       VALUES ($1, $2, $3, $4, $5)`,
      ['anil', 'pageadmin@gmail.com', adminPasswordHash, 'admin', true]
    );

    // Retrieve Admin Token by logging in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pageadmin@gmail.com', password: 'admin123' });

    adminToken = loginRes.body.token;
  });

  // After all tests complete, terminate database pool connections
  afterAll(async () => {
    await pool.end();
  });

  /* ==========================================================================
     1. AUTHENTICATION FLOW TESTS
     ========================================================================== */
  describe('🔐 Authentication Endpoints (/api/auth)', () => {
    it('should successfully register a new normal user', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Jane Doe',
          email: testUserEmail,
          password: 'userpassword123',
        });

      expect(signupRes.statusCode).toBe(201);
      expect(signupRes.body).toHaveProperty('token');
      expect(signupRes.body.user).toHaveProperty('id');
      expect(signupRes.body.user.role).toBe('user');
      expect(signupRes.body.user.permission_to_crud).toBe(false);

      normalUserToken = signupRes.body.token;
      normalUserId = signupRes.body.user.id;
    });

    it('should fail to register a user with an already existing email', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Jane Duplicate',
          email: testUserEmail,
          password: 'anotherpassword',
        });

      expect(signupRes.statusCode).toBe(409);
      expect(signupRes.body.message).toMatch(/already exists/i);
    });

    it('should successfully login an existing user and return a JWT', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'userpassword123',
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body.user.email).toBe(testUserEmail);
    });

    it('should fail login when using an incorrect password', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'wrongpassword',
        });

      expect(loginRes.statusCode).toBe(401);
      expect(loginRes.body.message).toMatch(/invalid email or password/i);
    });
  });

  /* ==========================================================================
     2. ADMIN USER DASHBOARD TESTS
     ========================================================================== */
  describe('👮 Admin Dashboard Endpoints (/api/users)', () => {
    it('should prevent non-admin from listing users', async () => {
      const usersRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(usersRes.statusCode).toBe(403);
    });

    it('should allow admin to list all registered users', async () => {
      const usersRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usersRes.statusCode).toBe(200);
      expect(usersRes.body).toHaveProperty('users');
      expect(Array.isArray(usersRes.body.users)).toBe(true);
      expect(usersRes.body.users.length).toBeGreaterThanOrEqual(2); // Admin + Jane Doe
    });

    it('should allow admin to grant CRUD permissions to a normal user', async () => {
      // 1. Create another user who will be granted product CRUD permissions
      const authUserRes = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Bob Builder',
          email: testAuthUserEmail,
          password: 'builderpassword',
        });
      
      authorizedUserId = authUserRes.body.user.id;
      authorizedUserToken = authUserRes.body.token;

      // 2. Admin updates Bob Builder's permission
      const updatePermRes = await request(app)
        .put(`/api/users/${authorizedUserId}/permission`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permission_to_crud: true });

      expect(updatePermRes.statusCode).toBe(200);
      expect(updatePermRes.body.user.permission_to_crud).toBe(true);

      // 3. Re-login as Bob to receive updated token with embedded crud permission
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testAuthUserEmail, password: 'builderpassword' });
      
      authorizedUserToken = loginRes.body.token;
    });
  });

  /* ==========================================================================
     3. PRODUCT CRUD FLOW TESTS
     ========================================================================== */
  describe('🛍️ Product CRUD Endpoints (/api/products)', () => {
    it('should prevent normal user (no permissions) from creating a product', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          name: 'Standard Headphones',
          price: 99.00,
          stock: 3,
        });

      expect(createRes.statusCode).toBe(403);
    });

    it('should allow authorized user (CRUD permission === true) to create a product', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authorizedUserToken}`)
        .send({
          name: 'Premium Wireless Headphones',
          description: 'Custom-engineered noise cancelling headphones with graphene drivers and 45h battery life.',
          img: 'https://example.com/headphones.jpg',
          price: 399.00,
          stock: 2,
          ratings: 4.8,
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.product).toHaveProperty('id');
      expect(createRes.body.product.name).toBe('Premium Wireless Headphones');
      expect(createRes.body.product.price).toBe(399.00);
      expect(createRes.body.product.stock).toBe(2);

      testProductId = createRes.body.product.id;
    });

    it('should allow any authenticated user to view the list of products', async () => {
      const productsRes = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(productsRes.statusCode).toBe(200);
      expect(productsRes.body).toHaveProperty('products');
      expect(productsRes.body.products.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow authorized user to update product attributes', async () => {
      const updateRes = await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authorizedUserToken}`)
        .send({
          price: 349.00, // Discounted!
          stock: 1,
        });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.product.price).toBe(349.00);
      expect(updateRes.body.product.stock).toBe(1);
    });
  });

  /* ==========================================================================
     4. SHOPPING CART FLOW TESTS
     ========================================================================== */
  describe('🛒 Shopping Cart Endpoints (/api/cart)', () => {
    it('should successfully add a product to the user cart', async () => {
      const addRes = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          product_id: testProductId,
          quantity: 1,
        });

      expect(addRes.statusCode).toBe(200);
      expect(addRes.body.item.product_id).toBe(testProductId);
      expect(addRes.body.item.quantity).toBe(1);
    });

    it('should fail to add a quantity that exceeds active stock', async () => {
      const addRes = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${normalUserToken}`)
        .send({
          product_id: testProductId,
          quantity: 10, // Stock is currently 1!
        });

      expect(addRes.statusCode).toBe(400);
      expect(addRes.body.message).toMatch(/insufficient stock/i);
    });

    it('should retrieve cart list and return accurate financial sums', async () => {
      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(cartRes.statusCode).toBe(200);
      expect(cartRes.body).toHaveProperty('cart');
      expect(cartRes.body.cart.items.length).toBe(1);
      expect(cartRes.body.cart.totalCost).toBe(349.00);
      expect(cartRes.body.cart.totalItemsCount).toBe(1);
    });

    it('should allow user to empty their shopping cart', async () => {
      const clearRes = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(clearRes.statusCode).toBe(200);

      const cartRes = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${normalUserToken}`);

      expect(cartRes.body.cart.items.length).toBe(0);
      expect(cartRes.body.cart.totalCost).toBe(0);
    });
  });

  /* ==========================================================================
     5. ADMIN DELETE USER SCRIPTS
     ========================================================================== */
  describe('🧹 Admin Cleanup and Delete User', () => {
    it('should allow admin to delete user accounts', async () => {
      const deleteUserRes = await request(app)
        .delete(`/api/users/${normalUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteUserRes.statusCode).toBe(200);
      expect(deleteUserRes.body.message).toMatch(/deleted successfully/i);
    });
  });
});
