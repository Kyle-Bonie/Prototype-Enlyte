// Users API - Firestore direct client SDK
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const USERS_COLLECTION = "users";

// Seed the two demo users if they don't exist yet
export const seedDemoUsers = async () => {
  const demoUsers = [
    {
      username: "teamlead",
      password: "lead123",
      name: "Demo Team Lead",
      employeeNumber: "EMP-001",
      role: "Team Lead",
    },
    {
      username: "agent",
      password: "agent123",
      name: "Demo Agent",
      employeeNumber: "EMP-002",
      role: "Agent",
    },
  ];

  for (const user of demoUsers) {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("username", "==", user.username)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(collection(db, USERS_COLLECTION), {
        ...user,
        createdAt: serverTimestamp(),
      });
    }
  }
};

// Get all users
export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
};

// Create a new user
export const createUser = async (userData) => {
  // Check if username already exists
  const q = query(
    collection(db, USERS_COLLECTION),
    where("username", "==", userData.username)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("Username already exists");
  }

  const docRef = await addDoc(collection(db, USERS_COLLECTION), {
    ...userData,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...userData };
};

// Update an existing user
export const updateUser = async (userId, updateData) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await updateDoc(userRef, updateData);
  return { id: userId, ...updateData };
};

// Delete a user
export const deleteUser = async (userId) => {
  const userRef = doc(db, USERS_COLLECTION, userId);
  await deleteDoc(userRef);
  return true;
};
