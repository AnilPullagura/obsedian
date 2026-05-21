import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../index";
import { MemoryRouter } from "react-router-dom";
import Cookies from "js-cookie";


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
    
    const adminUserProfile = {
      id: 1,
      name: "anil",
      email: "pageadmin@gmail.com",
      role: "admin",
      permission_to_crud: true,
    };
    localStorage.setItem("user", JSON.stringify(adminUserProfile));
    Cookies.get.mockReturnValue("dummy-token");

    
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

    
    await waitFor(() => {
      expect(screen.getByText("The Obsidian Collection")).toBeInTheDocument();
    });

    
    expect(screen.getByText("Onyx Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("Aether Ceramic Chronograph")).toBeInTheDocument();

    
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    expect(editButtons).toHaveLength(2);

    
    fireEvent.click(editButtons[0]);

    
    expect(screen.getByRole("heading", { name: "Edit Product" })).toBeInTheDocument();

    
    const nameInput = screen.getByLabelText("Product Name");
    const priceInput = screen.getByLabelText("Price (USD)");
    const descInput = screen.getByLabelText("Description");

    expect(nameInput.value).toBe("Onyx Wireless Headphones");
    expect(priceInput.value).toBe("399"); 
    expect(descInput.value).toBe("Custom-engineered noise cancelling headphones");

    
    const closeBtn = screen.getByRole("button", { name: "close" });
    fireEvent.click(closeBtn);

    
    expect(screen.queryByRole("heading", { name: "Edit Product" })).not.toBeInTheDocument();
  });

  it("handles string prices and missing descriptions without throwing any error", async () => {
    
    const irregularProducts = [
      {
        id: 3,
        name: "Irregular Product",
        description: null,
        img: null,
        price: "499.99", 
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

    
    expect(screen.getByRole("heading", { name: "Edit Product" })).toBeInTheDocument();
    expect(screen.getByLabelText("Product Name").value).toBe("Irregular Product");
    expect(screen.getByLabelText("Price (USD)").value).toBe("499.99");
    expect(screen.getByLabelText("Description").value).toBe("");
  });
});
