const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Check if we have admin credentials
const hasCredentials =
  process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL;

if (!hasCredentials) {
  console.error("❌ Missing Firebase Admin credentials in .env file!");
  console.error("Required: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

// Initialize Admin SDK with service account credentials
const credential = admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
});

try {
  admin.initializeApp({
    credential: credential,
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  console.log("✓ Firebase Admin SDK initialized");
} catch (error) {
  console.error("Firebase initialization error:", error.message);
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth, firebaseConfig };
