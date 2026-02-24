# Firebase Hosting Integration Guide

## Overview

This document explains how Firebase Hosting and Cloud Functions were integrated into the Enlyte Tracking System project.

## Project Architecture

### Folder Structure

```
Prototype/
├── app/                    # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── apiClient.js    # API communication layer
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
│   └── build/              # Production build output
├── server/                 # Local development backend
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js          # Express server (port 5000)
├── functions/             # Firebase Cloud Functions (production)
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── index.js          # Cloud Function entry point
│   └── package.json
├── firebase.json          # Firebase configuration
└── .firebaserc           # Firebase project settings
```

## Setup Steps

### 1. Firebase CLI Installation

```powershell
npm install -g firebase-tools
firebase --version  # Verify installation (v15.6.0)
firebase login      # Authenticate with Google account
```

### 2. Firebase Project Setup

```powershell
# List available projects
firebase projects:list

# Project used: enlyteprototype
# Project Number: 991028391498
```

### 3. Configuration Files Created

#### `.firebaserc`

```json
{
  "projects": {
    "default": "enlyteprototype"
  }
}
```

#### `firebase.json`

```json
{
  "hosting": {
    "public": "app/build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

**Key Configuration Points:**

- `public: "app/build"` - Serves the React production build
- `/api/**` rewrite routes API calls to Cloud Function named "api"
- `**` rewrite enables React Router (SPA support)
- Functions use Node.js 18 runtime

### 4. Cloud Functions Setup

#### Created `functions/` folder structure

```powershell
mkdir functions
xcopy server\config functions\config /E /I /Y
xcopy server\controllers functions\controllers /E /I /Y
xcopy server\models functions\models /E /I /Y
xcopy server\routes functions\routes /E /I /Y
```

**Why duplicate server code?**

- `server/` folder: For local development with `node server.js`
- `functions/` folder: For production serverless deployment
- Same business logic, different execution environments

---

## Key Files Explained

### `functions/index.js` (Cloud Function Entry Point)

**Purpose:** Main entry point that wraps your Express app as a Firebase Cloud Function

```javascript
const functions = require("firebase-functions");
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Export Express app as Cloud Function
exports.api = functions.https.onRequest(app);
```

**Key Differences from Traditional Server:**

- No `app.listen(5000)` - Firebase handles the runtime
- Wrapped with `functions.https.onRequest()`
- Exported as named function `api` (matches firebase.json rewrite)
- Firebase Admin SDK initialized at the function level

### `functions/index.js` (Cloud Function Entry Point)

**Purpose:** Main entry point that wraps your Express app as a Firebase Cloud Function

```javascript
const functions = require("firebase-functions");
const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");

// Import routes
const authRoutes = require("./routes/auth");

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Export Express app as Cloud Function
exports.api = functions.https.onRequest(app);
```

**What it does:**

1. **Initializes Firebase Admin SDK** - Gives backend access to Firestore, Auth, etc.
2. **Creates Express app** - Standard Express server setup
3. **Sets up CORS** - `origin: true` allows all origins (restrict in production)
4. **Registers routes** - `/api/auth` endpoints for login, register, etc.
5. **Exports as Cloud Function** - `exports.api` makes this accessible via HTTPS

**Key Differences from Traditional Server:**

- ❌ No `app.listen(5000)` - Firebase handles the runtime
- ✅ Wrapped with `functions.https.onRequest()`
- ✅ Exported as named function `api` (matches firebase.json rewrite)
- ✅ Automatically scales based on traffic

---

### `functions/package.json`

**Purpose:** Defines dependencies and Node.js version for Cloud Functions

```json
{
  "name": "functions",
  "description": "Cloud Functions for Enlyte Tracking System",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  }
}
```

**What it does:**

- **Specifies Node.js 18** - Required by Firebase Cloud Functions
- **Lists dependencies** - All packages needed for backend functionality
- **Main entry point** - Points to `index.js` as the function entry

---

### `functions/config/firebase.js`

**Purpose:** Provides access to Firestore database and Firebase Admin services

```javascript
const admin = require("firebase-admin");

const db = admin.firestore();
const auth = admin.auth();

module.exports = { admin, db, auth };
```

**What it does:**

- **Exports database instance** - `db` used for Firestore queries
- **Exports auth instance** - `auth` for user management (if needed)
- **Simplified for Cloud Functions** - Admin SDK already initialized in `index.js`

---

### `functions/controllers/authController.js`

**Purpose:** Handles authentication business logic (login, register, token verification)

**Key Features:**

```javascript
const JWT_SECRET = process.env.JWT_SECRET || "enlyte-production-secret-2026";

// Login function
exports.login = async (req, res) => {
  // 1. Get username/password from request
  // 2. Query Firestore for user
  // 3. Verify password with bcrypt
  // 4. Generate JWT token (8-hour expiration)
  // 5. Return token and user data
};

// Register function
exports.register = async (req, res) => {
  // 1. Validate input (username, password, name, role)
  // 2. Check if username already exists
  // 3. Hash password with bcrypt (10 salt rounds)
  // 4. Save user to Firestore
  // 5. Return success message
};
```

**What it does:**

- **Login** - Authenticates users and issues JWT tokens
- **Register** - Creates new users with hashed passwords
- **Token verification** - Validates JWT tokens for protected routes
- **Password security** - Uses bcrypt for hashing (never stores plain text)

---

### `functions/models/User.js`

**Purpose:** Defines user data structure and database operations

```javascript
class User {
  static async findByUsername(username) {
    // Queries Firestore 'users' collection
    // Returns user document matching username
  }

  static async create(userData) {
    // Creates new user in Firestore
    // Returns created user with ID
  }

  static async findById(id) {
    // Retrieves user by document ID
    // Used for authentication
  }
}
```

**What it does:**

- **Abstracts database operations** - Clean separation of concerns
- **User CRUD operations** - Create, Read, Update, Delete users
- **Firestore integration** - Directly queries `users` collection

---

### `functions/routes/auth.js`

**Purpose:** Defines API endpoints and connects them to controller functions

```javascript
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authController.verifyToken, authController.getUser);

module.exports = router;
```

**What it does:**

- **POST /api/auth/login** - Authenticates user
- **POST /api/auth/register** - Creates new user account
- **GET /api/auth/me** - Gets current user info (protected by JWT middleware)

**URL Structure:**

```
https://enlyteprototype.web.app/api/auth/login
                                  ↑    ↑     ↑
                                  │    │     └─ Route defined here
                                  │    └─ Mounted in index.js
                                  └─ Firebase rewrite in firebase.json
```

---

### `firebase.json`

**Purpose:** Configures Firebase Hosting and Cloud Functions deployment

```json
{
  "hosting": {
    "public": "app/build",
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

**What it does:**

1. **Sets public directory** - Serves files from `app/build/` folder
2. **API routing** - `/api/**` requests → Cloud Function named `api`
3. **SPA support** - All other requests → `index.html` (React Router works)
4. **Functions config** - Uses `functions/` folder with Node.js 18

**Request Flow:**

```
User visits: https://enlyteprototype.web.app/login
→ Firebase Hosting serves: app/build/index.html (React app)

User calls: https://enlyteprototype.web.app/api/auth/login
→ Firebase rewrites to: Cloud Function "api"
→ Executes: functions/index.js → authRoutes → authController.login
```

---

### `.firebaserc`

**Purpose:** Specifies which Firebase project to deploy to

```json
{
  "projects": {
    "default": "enlyteprototype"
  }
}
```

**What it does:**

- **Links local project to Firebase project** - ID: `enlyteprototype`
- **Allows multiple environments** - Can add `staging`, `production` aliases
- **Used by Firebase CLI** - `firebase deploy` knows where to deploy

---

### `app/src/api/apiClient.js`

**Purpose:** Frontend API communication layer with environment-aware URLs

```json
{
  "name": "functions",
  "description": "Cloud Functions for Enlyte Tracking System",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### `app/src/api/apiClient.js`

**Purpose:** Frontend API communication layer with environment-aware URLs

```javascript
// Environment-aware API URL
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "/api" // Production: uses Firebase rewrite
    : "http://localhost:5000/api"; // Development: local server

const authAPI = {
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response);
  },
  // ... register, getUser methods
};
```

**What it does:**

- **Switches API URL automatically** - Production vs Development
- **Development mode** - Calls `http://localhost:5000/api` (local `server/server.js`)
- **Production mode** - Calls `/api` (Firebase rewrites to Cloud Function)
- **Centralized API calls** - All backend requests go through this file
- **Token management** - Automatically includes JWT in Authorization header

**How environment switching works:**

```
npm start (development)
→ NODE_ENV = "development"
→ API_BASE_URL = "http://localhost:5000/api"
→ Calls local Express server

npm run build (production)
→ NODE_ENV = "production"
→ API_BASE_URL = "/api"
→ Uses Firebase Hosting rewrite to Cloud Function
```

---

## Architecture Overview

### Development Flow

```
Frontend (localhost:3000)
    ↓ HTTP Request
Backend (localhost:5000)
    ↓ Firebase Admin SDK
Firestore Database (Cloud)
```

### Production Flow

```
User Browser
    ↓ HTTPS
Firebase Hosting (serves React app)
    ↓ /api/** requests
Cloud Function "api" (serverless backend)
    ↓ Firebase Admin SDK
Firestore Database (Cloud)
```

---

## Code Deployment Pipeline

### Step-by-Step Explanation

1. **Build React App**

   ```powershell
   cd app
   npm run build
   ```

   - Compiles React code to optimized JavaScript
   - Creates `app/build/` folder with static files
   - Minifies and bundles for production

2. **Deploy to Firebase**

   ```powershell
   firebase deploy
   ```

   - Uploads `app/build/` to Firebase Hosting CDN
   - Uploads `functions/` folder to Cloud Functions
   - Configures routing based on `firebase.json`

3. **Firebase Processes Requests**
   - Static files (HTML, CSS, JS) → Served from CDN
   - `/api/**` requests → Routed to Cloud Function
   - Other requests → Served `index.html` (React Router)

---

## 5. Frontend API Configuration

**Issue:** Firebase deprecated `functions.config()` API (shutting down March 2026)

**Solution:** Environment variable with fallback in `functions/controllers/authController.js`

```javascript
const JWT_SECRET = process.env.JWT_SECRET || "enlyte-production-secret-2026";

// Usage
const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
  expiresIn: "8h",
});
```

---

## 6. JWT Secret Handling

**Issue:** Firebase deprecated `functions.config()` API (shutting down March 2026)

**Solution:** Environment variable with fallback in `functions/controllers/authController.js`

```javascript
const JWT_SECRET = process.env.JWT_SECRET || "enlyte-production-secret-2026";

// Usage in token generation
const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
  expiresIn: "8h",
});

// Usage in token verification
const decoded = jwt.verify(token, JWT_SECRET);
```

**What this means:**

- **Development** - Uses fallback secret for testing
- **Production** - Can override with environment variable
- **Security** - Change the secret in production for better security

**To set production secret (optional):**

```powershell
# In Firebase Console: Functions → Configuration → Add environment variable
# Key: JWT_SECRET
# Value: your-secure-random-string-here
```

---

## 7. Dependencies Installation

```powershell
cd functions
npm install  # Installed 272 packages
```

## Deployment Process

### Build React App

```powershell
cd app
npm run build
# Output: app/build/ folder with optimized production files
```

### Deploy to Firebase

**Option 1: Deploy Everything** (Requires Blaze Plan)

```powershell
firebase deploy
# Deploys both hosting (frontend) and functions (backend)
```

**Option 2: Deploy Frontend Only** (Free Tier)

```powershell
firebase deploy --only hosting
# Hosting URL: https://enlyteprototype.web.app
```

**Option 3: Deploy Functions Only**

```powershell
firebase deploy --only functions
# Deploys backend API only
```

## Pricing Considerations

### Spark Plan (Free)

- ✅ Firebase Hosting
- ❌ Cloud Functions (not available)

### Blaze Plan (Pay-as-you-go)

- ✅ Firebase Hosting (free)
- ✅ Cloud Functions with generous free tier:
  - 2M invocations/month
  - 400K GB-seconds/month
  - 200K CPU-seconds/month

**To Upgrade:**
https://console.firebase.google.com/project/enlyteprototype/usage/details

## Development Workflow

### Local Development

```powershell
# Terminal 1: Run local backend
cd server
npm start  # Runs on http://localhost:5000

# Terminal 2: Run React dev server
cd app
npm start  # Runs on http://localhost:3000
```

### Production Deployment

```powershell
# Build and deploy
cd app
npm run build
cd ..
firebase deploy

# Or one-liner:
cd app ; npm run build ; cd .. ; firebase deploy
```

## API Endpoints

### Authentication Routes

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

### Request Flow

```
Browser → https://enlyteprototype.web.app/api/auth/login
         ↓ (Firebase rewrite)
         → Cloud Function "api"
         ↓
         → Express app → authRoutes
         ↓
         → authController.login()
         ↓
         → Firestore database
         ↓
         ← JWT token response
```

## Database Setup

### Firebase Firestore

- **Collection:** `users`
- **Fields:** username, password (hashed), name, role, status, createdAt

### Seeding Users (Production)

Create `functions/seedUsers.js`:

```javascript
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

admin.initializeApp({
  credential: admin.credential.cert(require("./config/serviceAccountKey.json")),
});

const db = admin.firestore();

async function seedUsers() {
  const users = [
    {
      username: "agent",
      password: await bcrypt.hash("agent123", 10),
      name: "John Agent",
      role: "agent",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      username: "teamlead",
      password: await bcrypt.hash("lead123", 10),
      name: "Sarah Lead",
      role: "teamlead",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const user of users) {
    await db.collection("users").add(user);
  }
  console.log("Users seeded successfully");
}

seedUsers().then(() => process.exit(0));
```

Run: `node functions/seedUsers.js`

## Useful Commands

### View Logs

```powershell
firebase functions:log           # All function logs
firebase functions:log --only api  # Specific function
```

### Open Firebase Console

```powershell
firebase open hosting:site  # Hosting dashboard
firebase open functions     # Functions dashboard
```

### Rollback/Version Management

```powershell
firebase hosting:channel:list           # List versions
firebase hosting:clone SOURCE:DEST      # Clone version to another channel
```

## Useful Firebase Commands

### Deployment Commands

```powershell
# Deploy everything
firebase deploy

# Deploy specific targets
firebase deploy --only hosting          # Frontend only
firebase deploy --only functions        # Backend only
firebase deploy --only functions:api    # Specific function

# Quick redeploy after changes
cd C:\Users\kyle.bonifacio\Enlyte\Prototype\app ; npm run build ; cd .. ; firebase deploy
```

### Local Development & Testing

```powershell
# Test hosting locally
firebase serve

# Run full emulator suite (hosting, functions, firestore)
firebase emulators:start

# Run specific emulators
firebase emulators:start --only hosting
firebase emulators:start --only functions,firestore
```

### Monitoring & Logs

```powershell
# View function execution logs
firebase functions:log

# View logs for specific function
firebase functions:log --only api

# Stream logs in real-time
firebase functions:log --follow
```

### Project Management

```powershell
# List all Firebase projects
firebase projects:list

# Switch between projects
firebase use enlyteprototype
firebase use production

# Open Firebase Console dashboards
firebase open hosting:site              # Open hosting dashboard
firebase open functions                 # Open functions dashboard
firebase open console                   # Open main console
```

### Configuration

```powershell
# Re-initialize Firebase config
firebase init

# Set hosting target
firebase target:apply hosting TARGET

# View current configuration
firebase list
```

### Build & Deploy Workflow

```powershell
# Step 1: Build React app
cd app
npm run build

# Step 2: Deploy to Firebase
cd ..
firebase deploy

# Step 3: Check logs for errors
firebase functions:log

# Step 4: View deployed site
firebase open hosting:site
```

### Quick Commands for Daily Use

```powershell
# After code changes (most common):
cd app ; npm run build ; cd .. ; firebase deploy --only hosting

# After backend changes:
firebase deploy --only functions

# Check if functions are working:
firebase functions:log

# View project info:
firebase projects:list
firebase use
```

## Troubleshooting

### Issue: "Unable to find a valid endpoint for function `api`"

**Cause:** Functions not deployed yet (frontend-only deployment)
**Solution:** Upgrade to Blaze plan and run `firebase deploy`

### Issue: Node version warning (v24 vs v18 required)

**Impact:** Warning only, deployment proceeds normally
**Solution:** Consider using nvm to switch Node versions if issues arise

### Issue: Login fails in production

**Cause:** Cloud Functions not deployed (API calls fail)
**Solution:** Deploy functions: `firebase deploy --only functions`

## Security Notes

1. **JWT Secret:** Currently uses hardcoded fallback. For production, set environment variable:

   ```powershell
   # Set in Firebase Console under Functions → Configuration
   ```

2. **CORS:** Currently allows all origins (`origin: true`). Restrict in production:

   ```javascript
   app.use(cors({ origin: "https://enlyteprototype.web.app" }));
   ```

3. **Firebase Credentials:** Keep `server/.env` and service account keys private (never commit)

## Project URLs

- **Hosted App:** https://enlyteprototype.web.app
- **Firebase Console:** https://console.firebase.google.com/project/enlyteprototype
- **GitHub Repo:** https://github.com/Kyle-Bonie/Prototype-Enlyte

## Summary

This integration maintains **dual deployment modes**:

- **Local Development:** Uses `server/` folder with Express on port 5000
- **Production:** Uses `functions/` folder with Firebase Cloud Functions

The frontend automatically switches API endpoints based on `NODE_ENV`, providing seamless development and production workflows.
