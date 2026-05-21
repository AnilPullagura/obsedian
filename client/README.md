# Obsidian Luxe Client: Architecture & Technical Specifications

This documentation outlines the architectural patterns, state machines, authentication flow, and dynamic access control mechanics implemented within the **Obsidian Luxe** storefront application. It is designed to serve as an executive recap for engineering leadership and the CTO.

---

## 🛠️ Technological Paradigm & Design Systems

1. **Core Architecture**: Single Page Application (SPA) powered by **React** and bundled via **Vite** for rapid hot module replacement (HMR) and optimized static production assets.
2. **Technical Minimalism (Obsidian Glass)**: Engineered without heavy design frameworks or CSS bloat. Fully customized responsive layouts, subtle micro-animations, color gradients, and glassmorphic overlays are implemented using modular **Vanilla CSS** (`index.css` design system token map).
3. **Robust API Decoupling**: Centralized configuration of endpoint nodes resides within `src/apiConfig.js`. Pointing the entire frontend to local environments or hot remote servers is managed by mutating a single base variable:
   ```javascript
   export const API_BASE_URL = "https://obsedian-kgyt.onrender.com";
   ```

---

## 🧭 State Management & Component Inter-Communication

To maximize performance and avoid unnecessary library overhead, the client uses a lightweight, robust two-pronged state architecture:

### 1. Finite State Machine (FSM)
Asynchronous API invocations are governed by explicit state machines. Rather than relying on simple boolean flags, views map their layout to explicit status constants:
```javascript
export const apiStatusConstants = {
  initial: "INITIAL",
  loading: "LOADING",
  success: "SUCCESS",
  failure: "FAILURE",
};
```
* **Benefits**: Strictly eliminates UI race conditions, double renders, and half-loaded skeleton elements.

### 2. Global Event-Driven Synchronizations
Shopping cart changes (adding products, quantity increments/decrements, card purges) need to reflect immediately in the header badge count. This is achieved using a decoupled custom DOM event model:
```javascript
// Triggered by Home/Cart components upon success:
window.dispatchEvent(new Event("cartUpdated"));

// Listened to by the Header component to trigger silent syncs:
useEffect(() => {
  const handleCartSync = () => {
    getCartDetails();
  };
  window.addEventListener('cartUpdated', handleCartSync);
  return () => window.removeEventListener('cartUpdated', handleCartSync);
}, [getCartDetails]);
```
* **Benefits**: 0% global state library overhead (e.g., Redux, Recoil), decoupling component nodes while guaranteeing state consistency.

---

## 🔒 Authentication & Session Hydration

Authentication state relies on a twin-storage model combining cryptographically signed token layers with client-side state hydration:

```
[ Client Page Mount ] ──> Check Cookies.get("token")
                               │
                ┌──────────────┴──────────────┐
                ▼ (No Token)                  ▼ (Token Found)
        Redirect to /login           Load localStorage.getItem("user")
                                              │
                                     Hydrate React State 
                                     & Fetch Catalog Data
```

1. **Session Cookies**: Handled securely via `js-cookie`. The token is parsed from HTTP responses and stored temporarily under expiration guidelines (session vs. 7-day memory).
2. **Client Hydration**: User profile structures (`id`, `name`, `email`, `role`, `permission_to_crud`) are stored in `localStorage` under the `"user"` key. On page mount, this data is parsed to hydrate the React contexts.
3. **Redirection Gates**:
   * **Unauthenticated Access**: Route-level checks force redirects to `/login` if cookie validation fails during resource loads.
   * **Double Authentication Guard**: Active sessions checking the `/login` route are immediately redirected back to `/` to block credential re-entry.

---

## 🛡️ Access Control & Dynamic UI Representation

The client enforces role-based user-interface representations (Role-Based Access Control) to separate normal consumers from administrators and authorized operators.

### 1. Dynamic UI Gates (Conditional Render Mappings)
Dynamic gates parse user metadata roles to determine layout nodes:

* **Navbar Admin Portal Access**:
  The `Admin Panel` navigation target is restricted directly in JSX:
  ```jsx
  {userProfile && userProfile.role === 'admin' && (
    <Link to="/admin" className="...">Admin Panel</Link>
  )}
  ```

* **Product Cards Actions (Edit/Delete)**:
  Product catalog manipulation is guarded by verifying system administrators or operators explicitly granted CRUD privileges:
  ```jsx
  {userProfile && (userProfile.role === "admin" || userProfile.permission_to_crud === true) ? (
    <button className="product-delete-btn">Delete Product</button>
  ) : (
    <button className="product-add-cart-btn">Add to Cart</button>
  )}
  ```

### 2. Context Isolation & Defensive Programming
To ensure maximum client-side security, modal triggers are hard-guarded. Attempts to open modals manually or via injected payloads are caught immediately:
```javascript
const handleOpenEditModal = (product) => {
  try {
    setSelectedProduct(product);
    setEditName(product.name || "");
    // ... setting properties ...
    setIsModalOpen(true);
  } catch (err) {
    alert("System Alert: Failed to open product editor modal: " + err.message);
  }
};
```
Furthermore, the modal container is rendered at the **absolute root level** of the DOM, completely isolated from catalog grid context stacking blocks to bypass CSS transition limits.

---

## 📡 API Integration Map

Below is the API routing matrix matching operations in the client-side modules:

| Feature Node | Http Method | Target URI Endpoint | Client Call Location |
| :--- | :--- | :--- | :--- |
| **User Sign-up** | `POST` | `/api/auth/signup` | `login/index.jsx` |
| **User Log-in** | `POST` | `/api/auth/login` | `login/index.jsx` |
| **Catalog Products** | `GET` | `/api/products` | `Home/index.jsx` |
| **Update Product** | `PUT` | `/api/products/:id` | `Home/index.jsx` (Modal Form) |
| **Purge Product** | `DELETE` | `/api/products/:id` | `Home/index.jsx` |
| **Read Cart** | `GET` | `/api/cart` | `Cart/index.jsx` & `Header/index.jsx` |
| **Append to Cart** | `POST` | `/api/cart` | `Home/index.jsx` |
| **Modify Cart Qty** | `PUT` | `/api/cart/:productId` | `Cart/index.jsx` |
| **Remove Cart Item** | `DELETE` | `/api/cart/:productId` | `Cart/index.jsx` |
| **Reset/Clear Cart** | `DELETE` | `/api/cart` | `Cart/index.jsx` |
| **Read User Base** | `GET` | `/api/users` | `Admin/index.jsx` |
| **Set User Privilege**| `PUT` | `/api/users/:id/permission`| `Admin/index.jsx` |
| **Purge User Account**| `DELETE` | `/api/users/:id` | `Admin/index.jsx` |
