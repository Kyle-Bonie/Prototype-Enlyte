const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Firebase
const { db } = require("./config/firebase");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
  res.json({
    message: "Enlyte API Server is running",
    database: "Firebase Firestore",
    status: "connected",
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
// app.use('/api/cases', require('./routes/cases'));
// app.use('/api/users', require('./routes/users'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Firebase Firestore connected`);
});
