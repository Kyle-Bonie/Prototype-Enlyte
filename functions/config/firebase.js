const admin = require("firebase-admin");

// Admin SDK is initialized in index.js
const db = admin.firestore();
const auth = admin.auth();

module.exports = { db, auth, admin };
