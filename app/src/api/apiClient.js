// API Client for backend communication
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Auth API calls
export const authAPI = {
  // Login user — queries Firestore users collection
  login: async (username, password) => {
    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Invalid username or password.");
    }

    const docSnap = snapshot.docs[0];
    const user = { id: docSnap.id, ...docSnap.data() };

    if (user.password !== password) {
      throw new Error("Invalid username or password.");
    }

    // Create a simple session token
    const token = btoa(JSON.stringify({ userId: user.id, role: user.role }));

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    };
  },


  // Get current user from stored token
  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) {
      return Promise.reject(new Error("No token found"));
    }
    try {
      const decoded = JSON.parse(atob(token));
      return { user: decoded };
    } catch {
      return { user: null };
    }
  },

  // Logout user
  logout: async () => {
    return Promise.resolve({ success: true });
  },
};

// Export for backward compatibility
export const login = authAPI.login;

export default authAPI;
