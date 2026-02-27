// API Client — direct Firestore login
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const authAPI = {
  // Login: query Firestore by username, compare password
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

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    };
  },

  logout: async () => ({ success: true }),
};

export default authAPI;
