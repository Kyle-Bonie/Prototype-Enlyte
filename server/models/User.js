const { db } = require("../config/firebase");

class User {
  constructor(data) {
    this.username = data.username;
    this.password = data.password;
    this.name = data.name;
    this.role = data.role; // 'Agent' or 'Team Lead'
    this.status = data.status || "Active";
    this.createdAt = data.createdAt || new Date();
  }

  // Create a new user in Firestore
  static async create(userData) {
    const userRef = db.collection("users").doc();
    const user = new User(userData);
    await userRef.set({
      ...user,
      id: userRef.id,
    });
    return { id: userRef.id, ...user };
  }

  // Find user by username
  static async findByUsername(username) {
    const snapshot = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  // Find user by ID
  static async findById(userId) {
    const doc = await db.collection("users").doc(userId).get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() };
  }

  // Update user
  static async update(userId, updateData) {
    await db.collection("users").doc(userId).update(updateData);
    return this.findById(userId);
  }

  // Get all users
  static async findAll() {
    const snapshot = await db.collection("users").get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // Delete user
  static async delete(userId) {
    await db.collection("users").doc(userId).delete();
    return true;
  }
}

module.exports = User;
