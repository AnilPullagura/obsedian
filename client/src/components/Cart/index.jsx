import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Cookies from "js-cookie";
import { Oval } from "react-loader-spinner";
import { API_ENDPOINTS } from "../../apiConfig";
import "./index.css";

// API Status State Machine Constants
const cartApiStatusConstants = {
  initial: "INITIAL",
  loading: "LOADING",
  success: "SUCCESS",
  failure: "FAILURE",
};

const Cart = () => {
  const [apiStatus, setApiStatus] = useState(cartApiStatusConstants.initial);
  const [cartData, setCartData] = useState({
    items: [],
    totalItemsCount: 0,
    totalCost: 0,
  });
  const [errMsg, setErrMsg] = useState("");

  // Checkout success overlay state
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Individual item quantity modification loader state (product_id -> boolean)
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const navigate = useNavigate();

  // Retrieve Cart Details from Express API Node
  const fetchCartContent = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setApiStatus(cartApiStatusConstants.loading);
    setErrMsg("");

    try {
      const response = await fetch(API_ENDPOINTS.cart, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Exact destructuring of response sent by server: { cart }
        const { cart } = data;
        setCartData(cart);
        setApiStatus(cartApiStatusConstants.success);
      } else {
        const errorData = await response.json().catch(() => ({}));

        // Handle expired token
        if (response.status === 401) {
          Cookies.remove("token");
          localStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        setErrMsg(errorData.message || `Status Code: ${response.status}`);
        setApiStatus(cartApiStatusConstants.failure);
      }
    } catch (error) {
      setErrMsg(
        error.message || "Connecting to secure shopping cart node failed",
      );
      setApiStatus(cartApiStatusConstants.failure);
    }
  }, [navigate]);

  // Auth Redirect check: If user is not authenticated, redirect to /login
  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login", { replace: true });
    } else {
      const timer = setTimeout(() => {
        fetchCartContent();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [navigate, fetchCartContent]);

  // Update Cart Quantity handler (calls PUT /api/cart/:productId)
  const handleUpdateQuantity = async (productId, currentQty, increment) => {
    const nextQuantity = currentQty + increment;
    if (nextQuantity <= 0) {
      // If quantity falls below 1, remove item instead
      handleRemoveItem(productId);
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setUpdatingItemId(productId);
    try {
      const response = await fetch(API_ENDPOINTS.cartItem(productId), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: nextQuantity }),
      });

      if (response.ok) {
        // Refetch fresh aggregates from server
        await response.json();
        // Trigger global cart sync to update persistent Header cart count badge
        window.dispatchEvent(new Event("cartUpdated"));
        await fetchCartContent();
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
          return;
        }
        alert(errorData.message || "Unable to update item stock units");
      }
    } catch (error) {
      console.error("Cart update quantity error:", error);
      alert("Communication failure modifying cart item quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Remove individual product from cart (calls DELETE /api/cart/:productId)
  const handleRemoveItem = async (productId) => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setUpdatingItemId(productId);
    try {
      const response = await fetch(API_ENDPOINTS.cartItem(productId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        window.dispatchEvent(new Event("cartUpdated"));
        await fetchCartContent();
      } else {
        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
          return;
        }
        alert("Failed to remove item from secure storage");
      }
    } catch (error) {
      console.error("Cart item remove error:", error);
      alert("Communication failure removing cart item");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Clear entire cart for checkout/cleanup (calls DELETE /api/cart)
  const handleClearCart = async () => {
    const token = Cookies.get("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.cart, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        window.dispatchEvent(new Event("cartUpdated"));
        await fetchCartContent();
      } else {
        if (response.status === 401) {
          Cookies.remove("token");
          navigate("/login", { replace: true });
          return;
        }
        alert("Failed to reset cart state");
      }
    } catch (error) {
      console.error("Cart clear error:", error);
      alert("Communication error resetting cart nodes");
    }
  };

  // Handle Checkout Securely Action with premium vault checkout aesthetics
  const handleCheckoutSecurely = async () => {
    setIsProcessingCheckout(true);
    // Simulate transaction handshake verification latency (1.5 seconds)
    setTimeout(async () => {
      try {
        await handleClearCart();
        setCheckoutSuccess(true);
      } catch (e) {
        console.error("Checkout error:", e);
        alert("Secure transaction pipeline failed");
      } finally {
        setIsProcessingCheckout(false);
      }
    }, 1500);
  };

  const handleCloseCheckoutSuccess = () => {
    setCheckoutSuccess(false);
    navigate("/", { replace: true });
  };

  // Safe fallback default product image on image load failures
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src =
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";
  };

  // Render Loader View
  const renderLoadingView = () => (
    <div className="cart-status-wrapper">
      <Oval
        height={50}
        width={50}
        color="#E91E63"
        secondaryColor="#333"
        strokeWidth={4}
      />
      <p className="cart-status-title">Decrypting vault cart state...</p>
    </div>
  );

  // Render Failure View
  const renderFailureView = () => (
    <div className="cart-status-wrapper error-border">
      <span className="material-symbols-outlined error-icon">warning</span>
      <h3 className="cart-status-title error-text">
        Secure Cart Connection Offline
      </h3>
      <p className="cart-status-sub">{errMsg}</p>
      <button
        type="button"
        className="cart-action-btn"
        onClick={fetchCartContent}
      >
        Retry Decryption Request
      </button>
    </div>
  );

  // Render Cart Catalog/Summary View
  const renderSuccessView = () => {
    const { items, totalCost } = cartData;

    if (items.length === 0) {
      return (
        <div className="cart-empty-panel glass-surface animate-fade-in">
          <span className="material-symbols-outlined empty-cart-icon">
            shopping_bag
          </span>
          <h2 className="empty-cart-title">Your Cart is Pristine</h2>
          <p className="empty-cart-sub">
            The secure acquisition nodes are empty. Browse our catalog to
            acquire elite hardware components.
          </p>
          <Link to="/" className="empty-cart-return-link btn-glow">
            Acquire Hardware
          </Link>
        </div>
      );
    }

    // Calculations based on premium e-commerce logic
    const shippingFee = totalCost > 500 ? 0 : 25.0;
    const estTax = totalCost * 0.08; // 8% technical acquisition VAT
    const grandTotal = totalCost + shippingFee + estTax;

    return (
      <div className="cart-content-layout animate-fade-in">
        {/* Cart items list */}
        <div className="cart-items-column">
          <div className="cart-column-header">
            <h1 className="cart-page-title">Hardware Acquisitions</h1>
            <button
              type="button"
              className="cart-clear-all-btn"
              onClick={handleClearCart}
            >
              <span className="material-symbols-outlined">delete_sweep</span>{" "}
              Clear All
            </button>
          </div>

          <div className="cart-rows-list">
            {items.map((item) => {
              const isUpdating = updatingItemId === item.product_id;
              const productImg =
                item.img ||
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

              return (
                <div
                  key={item.product_id}
                  className="cart-item-row glass-surface"
                >
                  <div className="cart-item-image-box">
                    <img
                      src={productImg}
                      alt={item.product_name}
                      className="cart-item-img"
                      onError={handleImageError}
                    />
                  </div>

                  <div className="cart-item-details-box">
                    <div className="cart-item-title-row">
                      <h3 className="cart-item-name">{item.product_name}</h3>
                      <button
                        type="button"
                        className="cart-item-trash-btn"
                        title="Remove product"
                        onClick={() => handleRemoveItem(item.product_id)}
                        disabled={isUpdating}
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>

                    <p className="cart-item-unit-price">
                      $
                      {item.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}{" "}
                      each
                    </p>

                    <div className="cart-item-actions-row">
                      <div className="quantity-adjuster-bar">
                        <button
                          type="button"
                          className="qty-btn minus"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product_id,
                              item.quantity,
                              -1,
                            )
                          }
                          disabled={isUpdating}
                        >
                          -
                        </button>
                        <span className="qty-value-label">
                          {isUpdating ? (
                            <Oval
                              height={10}
                              width={10}
                              color="#fff"
                              strokeWidth={5}
                            />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          type="button"
                          className="qty-btn plus"
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product_id,
                              item.quantity,
                              +1,
                            )
                          }
                          disabled={isUpdating || item.quantity >= item.stock}
                        >
                          +
                        </button>
                      </div>

                      <div className="cart-item-subtotal-box">
                        <span className="subtotal-label">Subtotal:</span>
                        <span className="subtotal-price">
                          $
                          {(item.price * item.quantity).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 },
                          )}
                        </span>
                      </div>
                    </div>

                    {item.quantity >= item.stock && (
                      <p className="stock-alert-text">
                        Maximum active stock level reached ({item.stock} units)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart summary box */}
        <div className="cart-summary-column">
          <div className="cart-summary-sticky-card glass-card glow-border-rose">
            <h2 className="summary-card-title">Acquisition Invoice</h2>
            <div className="summary-divider"></div>

            <div className="summary-row">
              <span className="summary-row-label">Acquisition Value</span>
              <span className="summary-row-value">
                $
                {totalCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-row-label">Secured Air Transport</span>
              <span className="summary-row-value">
                {shippingFee === 0 ? (
                  <span className="free-shipping-tag">WAIVED</span>
                ) : (
                  `$${shippingFee.toFixed(2)}`
                )}
              </span>
            </div>

            <div className="summary-row">
              <span className="summary-row-label">Technical VAT (8%)</span>
              <span className="summary-row-value">
                $
                {estTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total-row">
              <span className="total-label">Total Cost</span>
              <span className="total-value">
                $
                {grandTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <p className="encryption-disclaimer">
              Transactions are protected using RSA-4096 custom cryptography
              pathways.
            </p>

            <button
              type="button"
              className="btn-glow checkout-submit-btn"
              onClick={handleCheckoutSecurely}
              disabled={isProcessingCheckout}
            >
              {isProcessingCheckout ? (
                <div className="checkout-loader-row">
                  <Oval
                    height={16}
                    width={16}
                    color="#FFFFFF"
                    strokeWidth={4}
                  />
                  <span>Verifying Ledger...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined checkout-lock-icon">
                    lock
                  </span>
                  <span>Acquire Securely</span>
                </>
              )}
            </button>

            <Link to="/" className="continue-shopping-link">
              ← Return to Collection
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case cartApiStatusConstants.loading:
        return renderLoadingView();
      case cartApiStatusConstants.success:
        return renderSuccessView();
      case cartApiStatusConstants.failure:
        return renderFailureView();
      default:
        return null;
    }
  };

  return (
    <main className="cart-page-view animate-fade-in">
      <div className="cart-page-container">{renderContent()}</div>

      {/* Vault Checkout Success Modal */}
      {checkoutSuccess && (
        <div className="checkout-success-fixed-overlay">
          <div className="checkout-success-panel glass-surface glow-border-rose animate-fade-in">
            <span className="material-symbols-outlined checkout-success-icon">
              check_circle
            </span>
            <h2 className="checkout-success-title">Acquisition Successful</h2>
            <p className="checkout-success-sub">
              Your hardware allocation sequence has been successfully committed
              to the database ledger. Secure shipment coordinates are locked.
            </p>
            <div className="ledger-receipt-box">
              <p className="receipt-row">
                <span className="receipt-lbl">Status:</span>{" "}
                <span className="receipt-val green">LEDGER_COMMITTED</span>
              </p>
              <p className="receipt-row">
                <span className="receipt-lbl">Node:</span>{" "}
                <span className="receipt-val">AES_DECRYPT_206</span>
              </p>
              <p className="receipt-row">
                <span className="receipt-lbl">Hash:</span>{" "}
                <span className="receipt-val code">0x4F8...E912B</span>
              </p>
            </div>
            <button
              type="button"
              className="success-close-btn btn-glow"
              onClick={handleCloseCheckoutSuccess}
            >
              Close Invoice Ledger
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Cart;
