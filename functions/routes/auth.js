const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/register (for creating new users)
router.post("/register", authController.register);

// POST /api/auth/logout
router.post("/logout", authController.logout);

// GET /api/auth/me (verify token and get current user)
router.get("/me", authController.verifyToken, authController.getCurrentUser);

module.exports = router;
