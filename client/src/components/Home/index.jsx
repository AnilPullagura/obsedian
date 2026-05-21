import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Oval } from "react-loader-spinner";
import { API_ENDPOINTS } from "../../apiConfig";
import "./index.css";

// API Status State Machine Constants
export const apiStatusConstants = {
  initial: "INITIAL",
  loading: "LOADING",
  success: "SUCCESS",
  failure: "FAILURE",
};

const Home = () => {
  const [apiStatus, setApiStatus] = useState(apiStatusConstants.initial);
  const [productsList, setProductsList] = useState([]);
  const [errMsg, setErrMsg] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStock, setEditStock] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Cart addition tracking per product to show local loader feedback
  const [addingCartId, setAddingCartId] = useState(null);

  const navigate = useNavigate();

  // API callback wrapped in useCallback to prevent hook dependency warnings
  const getProducts = useCallback(async () => {
    setApiStatus(apiStatusConstants.loading);
    setErrMsg("");

    try {
      const token = Cookies.get("token");
      // If token disappears mid-session, force redirection to Vault
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      // Using centralized endpoint variable prefix
      const response = await fetch(API_ENDPOINTS.products, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Exact destructuring of response sent by server: { products }
        const { products } = data;

        setProductsList(products);
        setApiStatus(apiStatusConstants.success);
      } else {
        const errorData = await response.json().catch(() => ({}));

        // Handle expired or invalid session token
        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
          return;
        }

        setErrMsg(
          errorData.message ||
            `Error: ${response.status} ${response.statusText}`,
        );
        setApiStatus(apiStatusConstants.failure);
      }
    } catch (error) {
      setErrMsg(error.message || "Connecting to secure catalog node failed");
      setApiStatus(apiStatusConstants.failure);
    }
  }, [navigate]);

  // Auth Redirect check: If user is not authenticated, redirect to /login
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login", { replace: true });
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUserProfile(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user profile metadata:", e);
        }
      }
      getProducts();
    }
  }, [navigate, getProducts]);

  // Add Product to Cart API call
  const handleAddToCart = async (productId) => {
    setAddingCartId(productId);
    try {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(API_ENDPOINTS.cart, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Body keys expected by cartController: { product_id, quantity }
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });

      if (response.ok) {
        // Broadcast custom event so Header component refreshes its count automatically
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
          return;
        }
        alert(errData.message || "Failed to add item to secure storage");
      }
    } catch (error) {
      alert("Connection failed while modifying cart node");
    } finally {
      setAddingCartId(null);
    }
  };

  // Open Edit Product Modal
  const handleOpenEditModal = (product) => {
    console.log(
      "DEBUG: handleOpenEditModal initiated with product payload:",
      product,
    );
    try {
      setSelectedProduct(product);
      setEditName(product.name || "");

      let priceStr = "";
      if (product.price !== undefined && product.price !== null) {
        priceStr =
          typeof product.price === "number"
            ? product.price.toString()
            : String(product.price);
      }
      setEditPrice(priceStr);

      setEditDescription(product.description || "");
      setEditStock(
        product.stock !== undefined && product.stock !== null
          ? Number(product.stock)
          : 0,
      );
      setIsModalOpen(true);
      document.body.style.overflow = "hidden";
      console.log(
        "DEBUG: handleOpenEditModal completed successfully. isModalOpen set to true.",
      );
    } catch (err) {
      console.error("CRITICAL ERROR inside handleOpenEditModal:", err);
      alert(
        "System Alert: Failed to open product editor modal due to raw data error: " +
          err.message,
      );
    }
  };

  // Delete Product from database registry (calls DELETE /api/products/:id)
  const handleDeleteProduct = async (productId) => {
    const isConfirmed = window.confirm(
      "CRITICAL SECURITY ACTION: Are you absolute in purging this product catalog entry? This cannot be undone.",
    );
    if (!isConfirmed) return;

    try {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(API_ENDPOINTS.productDetails(productId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refetch catalog from database
        await getProducts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
          return;
        }
        alert(
          errorData.message || "Failed to remove product from catalog database",
        );
      }
    } catch (error) {
      console.error("Deletion error:", error);
      alert("Communication failure during product purge request");
    }
  };

  // Close Edit Product Modal
  const handleCloseEditModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    document.body.style.overflow = "auto";
  };

  // Submit Edit Product details
  const handleSaveProductChanges = async (event) => {
    event.preventDefault();
    if (!selectedProduct) return;

    setIsSaving(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(
        API_ENDPOINTS.productDetails(selectedProduct.id),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editName,
            price: parseFloat(editPrice),
            description: editDescription,
            stock: parseInt(editStock, 10),
          }),
        },
      );

      if (response.ok) {
        // Refetch products list to show fresh database updates
        await getProducts();
        handleCloseEditModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
          return;
        }
        alert(errorData.message || "Failed to update system product variables");
      }
    } catch (error) {
      alert("Connection failure during product update request");
    } finally {
      setIsSaving(false);
    }
  };

  // Render Loading View
  const renderLoadingView = () => (
    <div className="catalog-status-container">
      <Oval
        height={50}
        width={50}
        color="#E91E63"
        secondaryColor="#333"
        strokeWidth={4}
      />
      <p className="catalog-status-text">Synchronizing vault catalog...</p>
    </div>
  );

  // Render Failure View
  const renderFailureView = () => (
    <div className="catalog-status-container failure-box">
      <span className="material-symbols-outlined failure-icon">warning</span>
      <p className="catalog-status-text error-text">Node Connection Offline</p>
      <p className="catalog-error-sub">{errMsg}</p>
      <button type="button" className="catalog-retry-btn" onClick={getProducts}>
        Retry Secure Fetch
      </button>
    </div>
  );

  // Render Success Catalog
  const renderSuccessView = () => (
    <div className="catalog-grid-wrapper">
      <div className="catalog-header-block">
        <h1 className="catalog-title">The Obsidian Collection</h1>
        <p className="catalog-subtitle">
          Precision-engineered hardware forged in monochromatic brilliance.
          Discover technical minimalism at its zenith.
        </p>
      </div>

      <div className="products-grid-layout">
        {productsList.map((product) => {
          const isAdding = addingCartId === product.id;
          // Fallback image if database image is missing
          const imageSrc =
            product.img ||
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCOEpTycpLO7xmfpzNZCI2o4sei3NaNd1TohqZN3eNXnKSc5ZyoDNQkjZt3bdGzpuF2HhRWDkurymPSSePBCe6SbB-QWI7tPSiyza2fBEVYkMFAbicYZA_gPCBekmWnEfsjJCK7R_p5DoStEa5iSXvUTrQcM1tmP_A3i6R4LF-1SuLMx77d_3w7c3mOXu2ssizNKsA5NP6tqrwqbW7y_5aHiyFx2NjTPGdno6SVP5CWbCYl52d3vwxPh0MdxOil18MU-_TD5LCtsUM";

          return (
            <div
              key={product.id}
              className="product-glass-card glass-surface group"
            >
              <div className="product-image-container">
                <img
                  alt={product.name}
                  className="product-card-img"
                  src={imageSrc}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
                  }}
                />
                <div className="product-tag-overlay">
                  <span className="product-tag">
                    <span className="tag-dot"></span>
                    {product.availability ? "SECURE" : "LOCKED"}
                  </span>
                </div>
              </div>

              <div className="product-card-details">
                <div className="product-name-row">
                  <h3 className="product-card-name">{product.name}</h3>
                  {userProfile &&
                    (userProfile.role === "admin" ||
                      userProfile.permission_to_crud === true) && (
                      <button
                        type="button"
                        className="product-edit-pencil"
                        title="Edit System Product"
                        onClick={() => {
                          handleOpenEditModal(product);
                        }}
                      >
                        <span className="material-symbols-outlined pencil-icon">
                          edit
                        </span>
                      </button>
                    )}
                </div>

                <p className="product-card-price">
                  $
                  {product.price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="product-card-description">
                  {product.description || "No digital signature provided."}
                </p>

                <div className="product-card-actions">
                  {userProfile &&
                  (userProfile.role === "admin" ||
                    userProfile.permission_to_crud === true) ? (
                    <button
                      type="button"
                      className="product-delete-btn"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <span className="material-symbols-outlined delete-btn-icon">
                        delete
                      </span>
                      Delete Product
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="product-add-cart-btn btn-primary-glow"
                      disabled={
                        isAdding || !product.availability || product.stock <= 0
                      }
                      onClick={() => handleAddToCart(product.id)}
                    >
                      {isAdding ? (
                        <Oval
                          height={12}
                          width={12}
                          color="#fff"
                          strokeWidth={4}
                        />
                      ) : product.stock <= 0 ? (
                        "OUT OF STOCK"
                      ) : (
                        "Add to Cart"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (apiStatus) {
      case apiStatusConstants.loading:
        return renderLoadingView();
      case apiStatusConstants.success:
        return renderSuccessView();
      case apiStatusConstants.failure:
        return renderFailureView();
      default:
        return null;
    }
  };

  return (
    <>
      <div className="home-catalog-view animate-fade-in">{renderContent()}</div>
      
      {/* Edit Product Modal at root level to bypass any parent styling/transform/animation constraints */}
      {isModalOpen && (
        <div className="modal-fixed-overlay">
          <div className="modal-backdrop" onClick={handleCloseEditModal}></div>
          <div className="modal-content-panel glass-surface glow-border-rose">
            <div className="modal-header-row">
              <h2 className="modal-title">Edit Product</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseEditModal}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              className="modal-form-body"
              onSubmit={handleSaveProductChanges}
            >
              <div className="modal-form-grid">
                <div className="modal-form-group">
                  <label htmlFor="modal-name-input" className="modal-label">
                    Product Name
                  </label>
                  <input
                    id="modal-name-input"
                    type="text"
                    className="input-ghost modal-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-form-group">
                  <label htmlFor="modal-price-input" className="modal-label">
                    Price (USD)
                  </label>
                  <input
                    id="modal-price-input"
                    type="number"
                    step="0.01"
                    className="input-ghost modal-input"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label htmlFor="modal-desc-input" className="modal-label">
                  Description
                </label>
                <textarea
                  id="modal-desc-input"
                  rows="3"
                  className="input-ghost modal-textarea"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Stock Level</label>
                <div className="modal-slider-row">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="modal-slider-input"
                    value={editStock}
                    onChange={(e) => setEditStock(parseInt(e.target.value, 10))}
                  />
                  <span className="modal-slider-value">{editStock} units</span>
                </div>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseEditModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-save-btn btn-glow"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
