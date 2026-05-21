import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Cookies from "js-cookie";
import { Oval } from "react-loader-spinner";
import { API_ENDPOINTS } from "../../apiConfig";
import "./index.css";

export const authApiStatusConstants = {
  initial: "INITIAL",
  loading: "LOADING",
  success: "SUCCESS",
  failure: "FAILURE",
};

const Login = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [apiStatus, setApiStatus] = useState(authApiStatusConstants.initial);
  const [errMsg, setErrMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiStatus(authApiStatusConstants.loading);
    setErrMsg("");

    if (!email || !password) {
      setErrMsg("Email and password are required");
      setApiStatus(authApiStatusConstants.failure);
      return;
    }
    if (!isLoginTab && !name) {
      setErrMsg("Full name is required for registration");
      setApiStatus(authApiStatusConstants.failure);
      return;
    }

    const endpoint = isLoginTab ? API_ENDPOINTS.login : API_ENDPOINTS.signup;
    const requestBody = isLoginTab
      ? { email, password }
      : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setApiStatus(authApiStatusConstants.success);

        const { token, user } = data;

        const cookieOptions = rememberMe ? { expires: 7 } : { expires: 1 };
        Cookies.set("token", token, cookieOptions);

        localStorage.setItem("user", JSON.stringify(user));

        navigate("/", { replace: true });
      } else {
        setErrMsg(
          data.message ||
            "Authentication failed. Please verify your credentials.",
        );
        setApiStatus(authApiStatusConstants.failure);
      }
    } catch (error) {
      setErrMsg(
        error.message || "Connecting to secure authentication node failed",
      );
      setApiStatus(authApiStatusConstants.failure);
    }
  };

  const toggleTab = (tabState) => {
    setIsLoginTab(tabState);
    setErrMsg("");
    setName("");
    setEmail("");
    setPassword("");
    setApiStatus(authApiStatusConstants.initial);
  };

  const handleNameChange = (e) => setName(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleRememberMeChange = (e) => setRememberMe(e.target.checked);

  return (
    <main className="auth-page-layout animate-fade-in">
      <section className="auth-lifestyle-panel">
        <img
          alt="Obsidian Luxe Lifestyle"
          className="lifestyle-img"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdlGZAYcJRG3pdE7t0YFKFpInuGLxWRGruP0ZYOdf5HdbGJIukwenZIOLWF7mYlJ7XTAr1g25psi5F1YB9qmUePEsJlyILd_hy1GZ5M9N_XD91O8tVUxrTOggnzTn0xf1uPhuL3eqIyOTn-ufqaJOukizIWIUpvYWgbvB2bgJpocCBe0TBJ0H_m-W8wypghN50HIQfiE1FUnQPO0D_x4KRA_D4C1tlmv5FzzaQdU1eR7TQpPYxmwKU1nkVKy7MSBmCuXVrfEuXwhs"
        />
        <div className="lifestyle-overlay"></div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card glass-card glow-border-rose">
          <div className="auth-tabs-container">
            <button
              type="button"
              className={`auth-tab-toggle ${isLoginTab ? "active" : ""}`}
              onClick={() => toggleTab(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab-toggle ${!isLoginTab ? "active" : ""}`}
              onClick={() => toggleTab(false)}
            >
              Signup
            </button>
          </div>

          <form className="auth-form-body" onSubmit={handleSubmit}>
            <h2 className="auth-card-title">
              {isLoginTab ? "Obsidian Luxe " : "Obsidian Signup"}
            </h2>

            {!isLoginTab && (
              <div className="auth-form-group">
                <label htmlFor="name-input" className="auth-form-label">
                  Full Name
                </label>
                <input
                  id="name-input"
                  type="text"
                  className="input-ghost auth-form-input"
                  placeholder="Enter your name"
                  value={name}
                  onChange={handleNameChange}
                  required
                />
              </div>
            )}

            <div className="auth-form-group">
              <label htmlFor="email-input" className="auth-form-label">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                className="input-ghost auth-form-input"
                placeholder="id@obsidian.luxe"
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password-input" className="auth-form-label">
                Password
              </label>
              <input
                id="password-input"
                type="password"
                className="input-ghost auth-form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={handlePasswordChange}
                required
              />
            </div>

            {errMsg && <p className="auth-error-message">{errMsg}</p>}

            <button
              type="submit"
              className="btn-glow auth-submit-btn"
              disabled={apiStatus === authApiStatusConstants.loading}
            >
              {apiStatus === authApiStatusConstants.loading ? (
                <Oval height={18} width={18} color="#FFFFFF" strokeWidth={4} />
              ) : isLoginTab ? (
                "Login"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="auth-footer-divider"></div>
        </div>
      </section>

      <footer className="auth-footer-bar">
        <span className="footer-copyright">
          © 2024 OBSIDIAN LUXE. SECURED ACCESS ONLY.
        </span>
        <div className="footer-links-group">
          <Link to="/" className="footer-link">
            Return to Storefront
          </Link>
          <a
            href="#privacy"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Privacy Protocol
          </a>
          <a
            href="#support"
            className="footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Encrypted Support
          </a>
        </div>
      </footer>
    </main>
  );
};

export default Login;
