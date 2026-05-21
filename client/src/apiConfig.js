export const API_BASE_URL = "https://obsedian-kgyt.onrender.com";

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/auth/login`,
  signup: `${API_BASE_URL}/api/auth/signup`,
  products: `${API_BASE_URL}/api/products`,
  productDetails: (id) => `${API_BASE_URL}/api/products/${id}`,
  cart: `${API_BASE_URL}/api/cart`,
  cartItem: (productId) => `${API_BASE_URL}/api/cart/${productId}`,
};
