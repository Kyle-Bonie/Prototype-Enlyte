# Enlyte Tracking System

Full-stack case management system for Enlyte.

## 🏗️ Project Structure

- `app/` - React frontend
- `server/` - Node.js + Express + Firebase backend

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase account

### Installation

1. Clone the repository

```bash
git clone https://github.com/Kyle-Bonie/Prototype-Enlyte.git
cd Prototype-Enlyte
```

2. Install frontend dependencies

```bash
cd app
npm install
```

3. Install backend dependencies

```bash
cd ../server
npm install
```

4. Set up environment variables

```bash
# In server/.env
PORT=5000
JWT_SECRET=your_secret_key
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY=your_key
```

### Running Locally

1. Start backend

```bash
cd server
npm run dev
```

2. Start frontend

```bash
cd app
npm start
```

Access the app at http://localhost:3000

## 📦 Tech Stack

**Frontend:**

- React
- CSS3

**Backend:**

- Node.js
- Express
- Firebase Admin SDK
- JWT Authentication
- Bcrypt

## 🔐 Default Users

- **Agent**: username: `agent`, password: `agent123`
- **Team Lead**: username: `teamlead`, password: `lead123`
