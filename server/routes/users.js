const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const usersController = require("../controllers/usersController");

// Middleware: verify Firebase ID token (issued by Firebase Auth on login)
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// POST /api/users - create user (protected)
router.post("/", verifyFirebaseToken, usersController.createUser);

// PUT /api/users/:id - update user (protected)
router.put("/:id", verifyFirebaseToken, usersController.updateUser);

// DELETE /api/users/:id - delete user (protected)
router.delete("/:id", verifyFirebaseToken, usersController.deleteUser);

module.exports = router;
