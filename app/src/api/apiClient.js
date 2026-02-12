// API Client for backend communication
const API_BASE_URL = "http://localhost:5000/api";

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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },

  // Register new user
  register: async (username, password, name, role) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, name, role }),
    });
    return handleResponse(response);
  },

  // Get current user
  getCurrentUser: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Logout user
  logout: async () => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
};

// Export for backward compatibility
export const login = authAPI.login;

export default authAPI;
