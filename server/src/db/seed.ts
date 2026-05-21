import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { pool } from '../config/db';
import { UserModel } from '../models/userModel';
import { ProductModel } from '../models/productModel';

const runSeed = async () => {
  console.log('🌱 Starting Database Seeding Engine (Obsidian Luxe)...');

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log(`📄 Reading database schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('扫 Dropping existing tables and rebuilding database schema...');
    await pool.query(schemaSql);
    console.log('✅ Schema rebuilt successfully.');

    console.log('👤 Seeding Administrator Account...');
    const adminPasswordRaw = 'admin123';
    const adminPasswordHash = await bcrypt.hash(adminPasswordRaw, 10);
    
    const admin = await UserModel.create(
      'anil',
      'pageadmin@gmail.com',
      adminPasswordHash,
      'admin',
      true
    );
    console.log(`✅ Admin Seeded: ${admin.email} (Password: ${adminPasswordRaw})`);

    console.log('👥 Seeding Fake User Accounts...');
    const userCount = 10;
    const defaultPasswordRaw = 'user123!';
    const defaultPasswordHash = await bcrypt.hash(defaultPasswordRaw, 10);

    for (let i = 0; i < userCount; i++) {
      const name = faker.person.fullName();
      const email = faker.internet.email().toLowerCase();
      const permissionToCrud = i === 0;

      await UserModel.create(
        name,
        email,
        defaultPasswordHash,
        'user',
        permissionToCrud
      );
    }
    console.log(`✅ Seeded ${userCount} dummy user accounts (Default Password: ${defaultPasswordRaw}).`);

    console.log('🛍️ Seeding Fake E-commerce Product Inventory...');
    
    const ecommerceProducts = [
      {
        name: 'Onyx Wireless Headphones',
        description: 'Custom-engineered active noise cancelling over-ear headphones with signature graphene drivers, solid carbon fiber earcups, and 45-hour battery life. Renders breathtaking sonic purity against a silent background.',
        price: 399.00,
        img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
        ratings: 4.8
      },
      {
        name: 'Aether Ceramic Chronograph',
        description: 'Automatic mechanical timepiece featuring an open-heart dial, scratch-resistant obsidian ceramic bezel, and a premium fluorocarbon strap. Precision-engineered for modern horology enthusiasts.',
        price: 1250.00,
        img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        ratings: 4.9
      },
      {
        name: 'Aero Titanium Keyboard',
        description: 'A compact 75% hot-swappable mechanical keyboard featuring a solid CNC-machined titanium top shell, frosted glass base, custom linear switches, and sleek minimalist keycaps.',
        price: 320.00,
        img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
        ratings: 4.7
      },
      {
        name: 'Apex ANC Earbuds',
        description: 'True wireless audiophile in-ear monitors with adaptive active noise cancellation, custom ceramic enclosures, and a milled aluminum charging case. IPX7 waterproof rating.',
        price: 199.00,
        img: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
        ratings: 4.6
      },
      {
        name: 'Nebula Smart Projector',
        description: 'Ultra-portable 4K laser projector with built-in streaming apps, 360-degree virtual surround sound, automatic keystone correction, and 1200 ANSI lumens brightness.',
        price: 899.00,
        img: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&auto=format&fit=crop&q=80',
        ratings: 4.5
      },
      {
        name: 'Carbon Flight Backpack',
        description: 'A sleek, weather-resistant travel backpack made from genuine carbon fiber weave and waterproof ballistic nylon. Features a dedicated magnetic laptop sleeve and smart organizational pockets.',
        price: 249.00,
        img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
        ratings: 4.8
      },
      {
        name: 'Luxe Leather Cardholder',
        description: 'Minimalist cardholder wallet made from premium full-grain vegetable-tanned Italian leather. Features integrated RFID-blocking shields and a quick-ejection trigger mechanism.',
        price: 85.00,
        img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
        ratings: 4.9
      },
      {
        name: 'Eclipse MagSafe Charger',
        description: 'Solid brass and obsidian stone wireless charging dock with an integrated ambient LED ring. Provides high-speed 15W MagSafe charging with a luxurious, weighted architectural presence.',
        price: 110.00,
        img: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?w=600&auto=format&fit=crop&q=80',
        ratings: 4.7
      },
      {
        name: 'Lumina Aluminum Desk Lamp',
        description: 'Precision-milled anodized aluminum LED desk lamp. Features touch-capacitive dimming, 5 adjustable color temperatures, and a sandblasted heavy steel anti-topple base.',
        price: 160.00,
        img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80',
        ratings: 4.4
      },
      {
        name: 'Vortex Mechanical Mouse',
        description: 'Ergonomic wireless gaming and productivity mouse. Features a custom 26K DPI optical sensor, honeycomb magnesium alloy skeleton, and silent optical click switches.',
        price: 145.00,
        img: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
        ratings: 4.6
      }
    ];

    for (const item of ecommerceProducts) {
      const stock = faker.number.int({ min: 5, max: 50 });
      await ProductModel.create({
        name: item.name,
        description: item.description,
        img: item.img,
        price: item.price,
        stock: stock,
        ratings: item.ratings,
        availability: stock > 0
      });
    }

    const extraTechImages = [
      'https://images.unsplash.com/photo-1496181130204-755241544e35?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80'
    ];

    for (let i = ecommerceProducts.length; i < 20; i++) {
      const name = faker.commerce.productName();
      const description = `The premium ${name.toLowerCase()} designed by Obsidian Luxe. Engineered for superior performance and longevity, utilizing ${faker.commerce.productMaterial().toLowerCase()} with clean finishes and high quality control.`;
      const price = parseFloat(faker.commerce.price({ min: 45, max: 999, dec: 2 }));
      const stock = faker.number.int({ min: 0, max: 35 });
      const ratings = parseFloat(faker.number.float({ min: 3.8, max: 5.0, fractionDigits: 1 }).toFixed(1));
      const img = extraTechImages[i - ecommerceProducts.length] || extraTechImages[0];

      await ProductModel.create({
        name,
        description,
        img,
        price,
        stock,
        ratings,
        availability: stock > 0
      });
    }

    console.log(`✅ Seeded 20 high-quality premium e-commerce products.`);
    console.log('🌿 Database Seeding Completed successfully!');
    
  } catch (error) {
    console.error('❌ Error executing seeding script:', error);
  } finally {
    await pool.end();
    console.log('🔌 Database connection pool closed.');
  }
};

runSeed();
