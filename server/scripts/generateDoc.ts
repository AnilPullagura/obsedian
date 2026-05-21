import fs from 'fs';
import path from 'path';
import app from '../src/app';

interface ExpressRoute {
  path: string;
  method: string;
  middlewares: string[];
}

const routeMetadata: { [key: string]: { description: string; body?: string; params?: string; response?: string } } = {
  'POST /api/auth/signup': {
    description: 'Registers a new user account, encrypts password using bcryptjs, and issues a cryptographically signed JWT session token. Default role is "user" with CRUD permissions set to false.',
    body: '{\n  "name": "string (Required)",\n  "email": "string (Required, Unique)",\n  "password": "string (Required)"\n}',
    response: '{\n  "message": "User registered successfully",\n  "token": "JWT_TOKEN_STRING",\n  "user": {\n    "id": 2,\n    "name": "Jane Doe",\n    "email": "jane@example.com",\n    "role": "user",\n    "permission_to_crud": false,\n    "created_at": "TIMESTAMP"\n  }\n}'
  },
  'POST /api/auth/login': {
    description: 'Validates user credentials and generates a new JWT session token.',
    body: '{\n  "email": "string (Required)",\n  "password": "string (Required)"\n}',
    response: '{\n  "message": "Login successful",\n  "token": "JWT_TOKEN_STRING",\n  "user": {\n    "id": 1,\n    "name": "anil",\n    "email": "pageadmin@gmail.com",\n    "role": "admin",\n    "permission_to_crud": true,\n    "created_at": "TIMESTAMP"\n  }\n}'
  },
  'GET /api/users': {
    description: 'Retrieve a list of all registered users. Excludes passwords from the response.',
    response: '{\n  "users": [\n    {\n      "id": 1,\n      "name": "anil",\n      "email": "pageadmin@gmail.com",\n      "role": "admin",\n      "permission_to_crud": true,\n      "created_at": "TIMESTAMP"\n    }\n  ]\n}'
  },
  'DELETE /api/users/:id': {
    description: 'Deletes a specific user by ID from the database. Prevents self-deletion of the active admin session.',
    params: 'id: integer (Required, Path Parameter)',
    response: '{\n  "message": "User deleted successfully"\n}'
  },
  'PUT /api/users/:id/permission': {
    description: 'Enables an administrator to grant or revoke e-commerce product CRUD authorization to a normal user.',
    params: 'id: integer (Required, Path Parameter)',
    body: '{\n  "permission_to_crud": "boolean (Required)"\n}',
    response: '{\n  "message": "User permissions updated successfully",\n  "user": {\n    "id": 2,\n    "name": "Jane Doe",\n    "email": "jane@example.com",\n    "role": "user",\n    "permission_to_crud": true,\n    "created_at": "TIMESTAMP"\n  }\n}'
  },
  'GET /api/products': {
    description: 'Retrieve a complete list of all premium luxury e-commerce products currently in the catalog.',
    response: '{\n  "products": [\n    {\n      "id": 1,\n      "name": "Onyx Wireless Headphones",\n      "description": "Custom-engineered active noise cancelling over-ear headphones with graphene drivers, solid carbon fiber earcups, and 45-hour battery life...",\n      "img": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",\n      "price": 399.00,\n      "stock": 15,\n      "ratings": 4.8,\n      "availability": true,\n      "created_at": "TIMESTAMP"\n    }\n  ]\n}'
  },
  'GET /api/products/:id': {
    description: 'Retrieve specific details of an e-commerce product listing by its unique ID.',
    params: 'id: integer (Required, Path Parameter)',
    response: '{\n  "product": {\n    "id": 1,\n    "name": "Onyx Wireless Headphones",\n    "description": "Custom-engineered active noise cancelling over-ear headphones with graphene drivers, solid carbon fiber earcups, and 45-hour battery life...",\n    "img": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",\n    "price": 399.00,\n    "stock": 15,\n    "ratings": 4.8,\n    "availability": true,\n    "created_at": "TIMESTAMP"\n  }\n}'
  },
  'POST /api/products': {
    description: 'Registers a new premium luxury tech product in the database. Protected: Requires Admin role or active user CRUD permission.',
    body: '{\n  "name": "string (Required)",\n  "description": "string (Optional)",\n  "img": "string (Optional)",\n  "price": "number (Required)",\n  "stock": "integer (Required)",\n  "ratings": "number (Optional, Default: 0)",\n  "availability": "boolean (Optional, Default: true)"\n}',
    response: '{\n  "message": "Product created successfully",\n  "product": {\n    "id": 21,\n    "name": "Apex Wireless Earbuds",\n    "description": "True wireless audiophile in-ear monitors with adaptive active noise cancellation...",\n    "img": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",\n    "price": 199.00,\n    "stock": 25,\n    "ratings": 0.00,\n    "availability": true,\n    "created_at": "TIMESTAMP"\n  }\n}'
  },
  'PUT /api/products/:id': {
    description: 'Updates attributes of an existing product listing. Protected: Requires Admin role or active user CRUD permission.',
    params: 'id: integer (Required, Path Parameter)',
    body: '{\n  "name": "string (Optional)",\n  "description": "string (Optional)",\n  "img": "string (Optional)",\n  "price": "number (Optional)",\n  "stock": "integer (Optional)",\n  "ratings": "number (Optional)",\n  "availability": "boolean (Optional)"\n}',
    response: '{\n  "message": "Product updated successfully",\n  "product": {\n    "id": 21,\n    "name": "Apex Wireless Earbuds",\n    "price": 189.00,\n    "stock": 20,\n    "availability": true\n  }\n}'
  },
  'DELETE /api/products/:id': {
    description: 'Deletes a product listing completely from the catalog. Protected: Requires Admin role or active user CRUD permission.',
    params: 'id: integer (Required, Path Parameter)',
    response: '{\n  "message": "Product deleted successfully"\n}'
  },
  'GET /api/cart': {
    description: 'Retrieves the authenticated user\'s shopping cart. Computes aggregate cost sums and item counts dynamically.',
    response: '{\n  "cart": {\n    "items": [\n      {\n        "id": 1,\n        "user_id": 2,\n        "product_id": 1,\n        "quantity": 2,\n        "product_name": "Onyx Wireless Headphones",\n        "price": 399.00,\n        "img": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",\n        "stock": 15\n      }\n    ],\n    "totalItemsCount": 2,\n    "totalCost": 798.00\n  }\n}'
  },
  'POST /api/cart': {
    description: 'Adds a product e-commerce item to the user\'s shopping cart. Validates available stock limit beforehand.',
    body: '{\n  "product_id": "integer (Required)",\n  "quantity": "integer (Optional, Default: 1)"\n}',
    response: '{\n  "message": "Product added to cart successfully",\n  "item": {\n    "id": 1,\n    "user_id": 2,\n    "product_id": 1,\n    "quantity": 1,\n    "created_at": "TIMESTAMP"\n  }\n}'
  },
  'PUT /api/cart/:productId': {
    description: 'Directly updates the quantity of an item in the user\'s cart. Enforces active e-commerce product stock limits.',
    params: 'productId: integer (Required, Path Parameter)',
    body: '{\n  "quantity": "integer (Required)"\n}',
    response: '{\n  "message": "Cart quantity updated successfully",\n  "item": {\n    "id": 1,\n    "user_id": 2,\n    "product_id": 1,\n    "quantity": 3\n  }\n}'
  },
  'DELETE /api/cart/:productId': {
    description: 'Removes a specific product from the user\'s cart.',
    params: 'productId: integer (Required, Path Parameter)',
    response: '{\n  "message": "Product removed from cart successfully"\n}'
  },
  'DELETE /api/cart': {
    description: 'Empties the user\'s shopping cart completely.',
    response: '{\n  "message": "Cart cleared successfully"\n}'
  }
};

const getPrefixesFromApp = (): string[] => {
  try {
    const appPath = path.join(__dirname, '../src/app.ts');
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      const regex = /app\.use\(\s*['"]([^'"]+)['"]/g;
      const prefixes: string[] = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[1] !== '/' && !prefixes.includes(match[1])) {
          prefixes.push(match[1]);
        }
      }
      return prefixes;
    }
  } catch (error) {
    console.error('Error parsing prefixes from app.ts:', error);
  }
  return ['/api/auth', '/api/users', '/api/products', '/api/cart']; // fallback
};

const scanExpressRouter = (expressApp: any): ExpressRoute[] => {
  const routes: ExpressRoute[] = [];
  const prefixes = getPrefixesFromApp();
  console.log(`📌 Extracted router mount prefixes: ${JSON.stringify(prefixes)}`);

  const traverse = (stack: any[], currentPrefix = '', parentRouterMiddlewares: string[] = []) => {
    console.log(`📂 Traversing stack with prefix: "${currentPrefix}", stack length: ${stack.length}`);
    const activeRouterMiddlewares = [...parentRouterMiddlewares];

    for (const layer of stack) {
      console.log(`  └─ Layer name: "${layer.name}", route: ${layer.route ? 'yes' : 'no'}`);
      
      if (layer.route) {
        // Direct route node
        let routePath = (currentPrefix + layer.route.path).replace(/\/+/g, '/');
        if (routePath.endsWith('/') && routePath.length > 1) {
          routePath = routePath.slice(0, -1);
        }
        const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
        
        // Get route-level middlewares (excluding final handler which is at the end of the stack)
        const routeMiddlewares = layer.route.stack
          .slice(0, -1)
          .map((s: any) => s.name)
          .filter((name: string) => name && name !== 'bound dispatch' && name !== '<anonymous>');

        const allMiddlewares = [...activeRouterMiddlewares, ...routeMiddlewares];

        console.log(`     🎯 Route Found: [${methods.join(',')}] ${routePath} (middlewares: ${allMiddlewares.join(',')})`);
        for (const method of methods) {
          routes.push({
            path: routePath,
            method,
            middlewares: allMiddlewares,
          });
        }
      } else if (layer.name === 'router') {
        // Sub-router middleware node
        let prefix = currentPrefix;
        if (layer.regexp) {
          const regexpStr = layer.regexp.toString();
          const match = regexpStr.match(/^\/\^\\?(\/[a-zA-Z0-9_\-\\\/]+?)\\\/\?/);
          if (match) {
            prefix = (currentPrefix + match[1]).replace(/\\/g, '').replace(/\/+/g, '/');
          }
        } else if (layer.matchers) {
          // Express 5 matching against the dynamic prefixes
          for (const testPrefix of prefixes) {
            if (layer.match(testPrefix)) {
              prefix = (currentPrefix + testPrefix).replace(/\/+/g, '/');
              break;
            }
          }
        }
        
        console.log(`     🔗 Nested Router mounted at prefix: "${prefix}"`);
        if (layer.handle && layer.handle.stack) {
          traverse(layer.handle.stack, prefix, activeRouterMiddlewares);
        }
      } else {
        // Router-level middleware inside a Router (like router.use(authenticateJWT))
        if (
          layer.name !== 'corsMiddleware' &&
          layer.name !== 'jsonParser' &&
          layer.name !== 'logger' &&
          layer.name !== 'errorHandler' &&
          layer.name !== '<anonymous>' &&
          layer.name !== 'bound dispatch'
        ) {
          activeRouterMiddlewares.push(layer.name);
          console.log(`     🛡️ Added Router-level Middleware: "${layer.name}"`);
        }
      }
    }
  };

  const router = expressApp.router || expressApp._router;
  if (router && router.stack) {
    traverse(router.stack);
  } else {
    console.log('⚠️ expressApp.router or expressApp._router is undefined!');
  }

  return routes;
};


const generateDocumentation = () => {
  console.log('🔍 Reflectively scanning active Express routing table...');
  const activeRoutes = scanExpressRouter(app);
  
  if (activeRoutes.length === 0) {
    console.error('❌ Error: No active routes found. Express app is not configured.');
    return;
  }

  console.log(`📡 Found ${activeRoutes.length} registered API endpoints. Generating README.md...`);

  let markdown = `# 🛍️ Obsidian Luxe E-Commerce Backend Engine\n\n`;
  markdown += `Welcome to the **Obsidian Luxe Backend Engine**—a robust, production-grade Express + Node.js + TypeScript service layer built for high-performance e-commerce product catalog operations and shopping cart management.\n\n`;
  
  markdown += `This engine is strictly structured under a decoupled **Controller-Service-Model (CSM)** architecture, ensuring extreme code separation, highly testable service layers, and thin Express controllers.\n\n`;
  
  markdown += `> [!TIP]\n`;
  markdown += `> This entire document is dynamically synchronized. The active route tables and middleware chains in the documentation are **reflectively scanned in real-time** from the live Express engine stack!\n\n`;

  markdown += `---\n\n`;
  markdown += `## 🏗️ Architectural System Blueprint\n\n`;
  markdown += `The diagram below represents the exact operational dataflow and security validation chains of the backend:\n\n`;
  
  markdown += `\`\`\`mermaid\ngraph TD\n`;
  markdown += `    %% Clients\n`;
  markdown += `    Client[Client / Supertest Suite]\n\n`;
  
  markdown += `    %% Express App Router\n`;
  markdown += `    subgraph Express Routing Layer [Express App & Routers]\n`;
  markdown += `        App[app.ts]\n`;
  markdown += `        AuthRouter[authRoutes.ts]\n`;
  markdown += `        UserRouter[userRoutes.ts]\n`;
  markdown += `        ProductRouter[productRoutes.ts]\n`;
  markdown += `        CartRouter[cartRoutes.ts]\n`;
  markdown += `    end\n\n`;
  
  markdown += `    %% Middlewares\n`;
  markdown += `    subgraph Security Guardrails [RBAC Middleware Guards]\n`;
  markdown += `        AuthJWT[authenticateJWT]\n`;
  markdown += `        IsAdmin[isAdmin]\n`;
  markdown += `        CanCRUD[canCRUDProducts]\n`;
  markdown += `    end\n\n`;
  
  markdown += `    %% Controllers\n`;
  markdown += `    subgraph CSM Controller Layer [HTTP Controllers]\n`;
  markdown += `        AuthController[authController.ts]\n`;
  markdown += `        UserController[userController.ts]\n`;
  markdown += `        ProductController[productController.ts]\n`;
  markdown += `        CartController[cartController.ts]\n`;
  markdown += `    end\n\n`;
  
  markdown += `    %% Services\n`;
  markdown += `    subgraph CSM Service Layer [Business Services]\n`;
  markdown += `        AuthService[authService.ts]\n`;
  markdown += `        UserService[userService.ts]\n`;
  markdown += `        ProductService[productService.ts]\n`;
  markdown += `        CartService[cartService.ts]\n`;
  markdown += `    end\n\n`;
  
  markdown += `    %% Models\n`;
  markdown += `    subgraph CSM Model Layer [Database Access Models]\n`;
  markdown += `        UserModel[UserModel.ts]\n`;
  markdown += `        ProductModel[ProductModel.ts]\n`;
  markdown += `        CartModel[CartModel.ts]\n`;
  markdown += `        Pool[Database Connection Pool]\n`;
  markdown += `    end\n\n`;
  
  markdown += `    %% Database\n`;
  markdown += `    Database[(Neon Serverless PostgreSQL)]\n\n`;
  
  markdown += `    %% Connections\n`;
  markdown += `    Client -->|HTTP Request| App\n`;
  markdown += `    App --> AuthRouter & UserRouter & ProductRouter & CartRouter\n`;
  markdown += `    \n`;
  markdown += `    UserRouter --> AuthJWT --> IsAdmin --> UserController\n`;
  markdown += `    ProductRouter --> AuthJWT\n`;
  markdown += `    ProductRouter -->|Create/Update/Delete| CanCRUD --> ProductController\n`;
  markdown += `    ProductRouter -->|Read| ProductController\n`;
  markdown += `    CartRouter --> AuthJWT --> CartController\n\n`;
  
  markdown += `    AuthController --> AuthService --> UserModel\n`;
  markdown += `    UserController --> UserService --> UserModel\n`;
  markdown += `    ProductController --> ProductService --> ProductModel\n`;
  markdown += `    CartController --> CartService --> CartModel & ProductModel\n\n`;
  
  markdown += `    UserModel & ProductModel & CartModel --> Pool\n`;
  markdown += `    Pool --> Database\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `---\n\n`;
  markdown += `## 🏁 Operations & Local Deployment Manual\n\n`;
  markdown += `### 1. Local Environment Configuration\n`;
  markdown += `Establish a \`.env\` file in the root workspace of the project with your database string:\n`;
  markdown += `\`\`\`env\n`;
  markdown += `PORT=5000\n`;
  markdown += `DATABASE_URL=postgres://<username>:<password>@<host>/neondb?sslmode=require\n`;
  markdown += `JWT_SECRET=super_secret_jwt_passphrase_key\n`;
  markdown += `JWT_EXPIRES_IN=24h\n`;
  markdown += `NODE_ENV=development\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### 2. Dependency Resolution\n`;
  markdown += `Install production-grade libraries and typescript compilers:\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm install\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### 3. Dynamic Database Seeding\n`;
  markdown += `Execute our Faker-fueled seed routine to safely stand up database schema tables and seed over 10+ randomized users and 20+ realistic e-commerce products in Neon PostgreSQL:\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run seed\n`;
  markdown += `\`\`\`\n`;
  markdown += `> 🔒 **Admin Seed Directives**:\n`;
  markdown += `> *   **Email**: \`pageadmin@gmail.com\`\n`;
  markdown += `> *   **Password**: \`admin123\`\n\n`;

  markdown += `### 4. Running the Dev Server\n`;
  markdown += `Launch live hot-reloading compilers for real-time testing:\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run dev\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### 5. Triggering E2E Integration Suite\n`;
  markdown += `Verify security middleware interceptors, cart validations, stock limits, and role access control under Supertest:\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run test\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `### 6. Document Generation\n`;
  markdown += `Inspect active router stacks and auto-generate this system manual programmatically:\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run docs\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `---\n\n`;
  markdown += `## 🚦 Programmatic Active Route Registry\n\n`;
  markdown += `### 🏁 Global Base URL\n`;
  markdown += `\`http://localhost:5000\`\n\n`;

  markdown += `### 🚦 Active Endpoint Summary\n\n`;
  markdown += `| Method | Endpoint | Security / Middlewares | Description |\n`;
  markdown += `| :--- | :--- | :--- | :--- |\n`;

  activeRoutes.sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return a.method.localeCompare(b.method);
  });

  for (const route of activeRoutes) {
    const key = `${route.method} ${route.path}`;
    const meta = routeMetadata[key];
    const desc = meta ? meta.description.split('.')[0] + '.' : 'No description provided.';
    const security = route.middlewares.length > 0 
      ? route.middlewares.map(m => `\`${m}\``).join(', ') 
      : '`Public`';

    markdown += `| **${route.method}** | \`${route.path}\` | ${security} | ${desc} |\n`;
  }

  markdown += `\n---\n\n### 🛠️ Detailed Endpoint Reference\n\n`;

  for (const route of activeRoutes) {
    const key = `${route.method} ${route.path}`;
    const meta = routeMetadata[key];

    markdown += `#### ➡️ ${route.method} \`${route.path}\`\n\n`;
    
    if (meta) {
      markdown += `**Description**:\n${meta.description}\n\n`;
    }

    markdown += `**Security & Guards**:\n`;
    if (route.middlewares.length === 0) {
      markdown += `*   🔓 **Public Endpoint** (No authentication required)\n\n`;
    } else {
      markdown += `*   🔒 **Protected Endpoint**\n`;
      markdown += `*   **Middlewares**: ${route.middlewares.map(m => `\`${m}\``).join(' ➡️ ')}\n\n`;
    }

    if (meta) {
      if (meta.params) {
        markdown += `**Path/Query Parameters**:\n\`\`\`text\n${meta.params}\n\`\`\`\n\n`;
      }
      if (meta.body) {
        markdown += `**Expected Request Body** (\`application/json\`):\n\`\`\`json\n${meta.body}\n\`\`\`\n\n`;
      }
      if (meta.response) {
        markdown += `**Example Success Response** (\`200/201 Success\`):\n\`\`\`json\n${meta.response}\n\`\`\`\n\n`;
      }
    } else {
      markdown += `*No detailed request/response payload examples defined.*\n\n`;
    }

    markdown += `---\n\n`;
  }

  const outputPath = path.join(__dirname, '../README.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`🎉 Unified README.md generated successfully at: ${outputPath}`);
};

generateDocumentation();
