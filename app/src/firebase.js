// Firebase Client SDK Configuration
// Project: enlyteprototype
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDslmuJHhdIkXyXlEslwZpBdHVgRbTjG4",
  authDomain: "enlyteprototype.firebaseapp.com",
  projectId: "enlyteprototype",
  storageBucket: "enlyteprototype.firebasestorage.app",
  messagingSenderId: "991028391498",
  appId: "1:991028391498:web:dff1e2eac2c441711980b3",
  measurementId: "G-V13TQ249Z1",
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
