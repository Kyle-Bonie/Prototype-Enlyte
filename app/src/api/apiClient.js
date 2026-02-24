// API Client for backend communication
const API_BASE_URL =
  process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api";

// ============================================
// DEMO MODE - For Free Tier Hosting (No Backend)
// ============================================
const DEMO_MODE = true; // Set to false when backend is available

// Hardcoded demo users (for UI demonstration only)
const DEMO_USERS = [
  {
    id: "demo-agent-001",
    username: "agent",
    password: "agent123",
    name: "Demo Agent",
    role: "Agent",
    status: "Active",
  },
  {
    id: "demo-lead-001",
    username: "teamlead",
    password: "lead123",
    name: "Demo Team Lead",
    role: "Team Lead",
    status: "Active",
  },
];
// ============================================

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "An error occurred");
  }

  return data;
};

// Auth API calls
export const authAPI = {
  // Login user
  login: async (username, password) => {
    // DEMO MODE: Mock login without backend
    if (DEMO_MODE) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const user = DEMO_USERS.find(
            (u) => u.username === username && u.password === password,
          );

          if (user) {
            // Create mock token (base64 encoded user info)
            const token = btoa(
              JSON.stringify({ userId: user.id, role: user.role }),
            );
            resolve({
              success: true,
              token,
              user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
              },
            });
          } else {
            reject(new Error("Invalid credentials"));
          }
        }, 500); // Simulate network delay
      });
    }

    // REAL API MODE (commented out for demo)
    /* BACKEND INTEGRATION (Requires Blaze Plan)
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
    */

    throw new Error(
      "Backend not available. Enable DEMO_MODE or upgrade to Blaze plan.",
    );
  },

  // Register new user
  register: async (username, password, name, role) => {
    // DEMO MODE: Registration disabled
    if (DEMO_MODE) {
      return Promise.reject(new Error("Registration disabled in demo mode"));
    }

    // REAL API MODE (commented out for demo)
    /* BACKEND INTEGRATION (Requires Blaze Plan)
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, name, role }),
    });
    return handleResponse(response);
    */

    throw new Error(
      "Backend not available. Enable DEMO_MODE or upgrade to Blaze plan.",
    );
  },

  // Get current user
  getCurrentUser: async () => {
    // DEMO MODE: Mock user retrieval
    if (DEMO_MODE) {
      const token = getAuthToken();
      if (!token) {
        return Promise.reject(new Error("No token found"));
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          try {
            // Decode mock token
            const decoded = JSON.parse(atob(token));
            const user = DEMO_USERS.find((u) => u.id === decoded.userId);
            resolve({ user });
          } catch (error) {
            resolve({ user: null });
          }
        }, 300);
      });
    }

    // REAL API MODE (commented out for demo)
    /* BACKEND INTEGRATION (Requires Blaze Plan)
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
    */

    throw new Error(
      "Backend not available. Enable DEMO_MODE or upgrade to Blaze plan.",
    );
  },

  // Logout user
  logout: async () => {
    // DEMO MODE: Mock logout
    if (DEMO_MODE) {
      return Promise.resolve({ success: true });
    }

    // REAL API MODE (commented out for demo)
    /* BACKEND INTEGRATION (Requires Blaze Plan)
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
    */

    throw new Error(
      "Backend not available. Enable DEMO_MODE or upgrade to Blaze plan.",
    );
  },
};

// Export for backward compatibility
export const login = authAPI.login;

export default authAPI;
