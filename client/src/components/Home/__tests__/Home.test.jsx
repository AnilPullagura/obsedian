import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../index";
import { MemoryRouter } from "react-router-dom";
import Cookies from "js-cookie";

// Mock dependencies
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("react-loader-spinner", () => ({
  Oval: () => <div data-testid="loader">Loading...</div>,
}));

vi.mock("../../apiConfig", () => ({
  API_ENDPOINTS: {
    products: "/api/products",
    cart: "/api/cart",
    productDetails: (id) => `/api/products/${id}`,
  },
}));

describe("Home Component - Edit Modal Handshake", () => {
  const dummyProducts = [
    {
      id: 1,
      name: "Onyx Wireless Headphones",
      description: "Custom-engineered noise cancelling headphones",
      img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      price: 399.00,
      stock: 15,
      ratings: 4.8,
      availability: true,
    },
    {
      id: 2,
      name: "Aether Ceramic Chronograph",
      description: "Automatic mechanical timepiece",
      img: null,
      price: 1250.50,
      stock: 0,
      ratings: 4.9,
      availability: false,
    }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    // Setup local storage user profile with admin role to allow edit pencil view
    const adminUserProfile = {
      id: 1,
      name: "anil",
      email: "pageadmin@gmail.com",
      role: "admin",
      permission_to_crud: true,
    };
    localStorage.setItem("user", JSON.stringify(adminUserProfile));
    Cookies.get.mockReturnValue("dummy-token");

    // Mock successful catalog fetch
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ products: dummyProducts }),
      })
    );
  });

  it("renders product list and checks if clicking the edit pencil opens the modal", async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Verify loading screen is shown first or resolved
    await waitFor(() => {
      expect(screen.getByText("The Obsidian Collection")).toBeInTheDocument();
    });

    // Check if both products are rendered
    expect(screen.getByText("Onyx Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("Aether Ceramic Chronograph")).toBeInTheDocument();

    // Check if Edit pencil icons exist
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    expect(editButtons).toHaveLength(2);

    // Click the edit button for the first product
    fireEvent.click(editButtons[0]);

    // Modal should now be open
    expect(screen.getByRole("heading", { name: "Edit Product" })).toBeInTheDocument();

    // Check values populated inside the modal
    const nameInput = screen.getByLabelText("Product Name");
    const priceInput = screen.getByLabelText("Price (USD)");
    const descInput = screen.getByLabelText("Description");

    expect(nameInput.value).toBe("Onyx Wireless Headphones");
    expect(priceInput.value).toBe("399"); // 399.toString()
    expect(descInput.value).toBe("Custom-engineered noise cancelling headphones");

    // Close the modal
    const closeBtn = screen.getByRole("button", { name: "close" });
    fireEvent.click(closeBtn);

    // Modal should be closed
    expect(screen.queryByRole("heading", { name: "Edit Product" })).not.toBeInTheDocument();
  });

  it("handles string prices and missing descriptions without throwing any error", async () => {
    // Modify dummy products to have string prices and missing descriptions (null/undefined)
    const irregularProducts = [
      {
        id: 3,
        name: "Irregular Product",
        description: null,
        img: null,
        price: "499.99", // string price
        stock: null,
        ratings: 3.5,
        availability: true,
      }
    ];

    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ products: irregularProducts }),
      })
    );

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("The Obsidian Collection")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);

    // Modal should be open and populated safely
    expect(screen.getByRole("heading", { name: "Edit Product" })).toBeInTheDocument();
    expect(screen.getByLabelText("Product Name").value).toBe("Irregular Product");
    expect(screen.getByLabelText("Price (USD)").value).toBe("499.99");
    expect(screen.getByLabelText("Description").value).toBe("");
  });
});
