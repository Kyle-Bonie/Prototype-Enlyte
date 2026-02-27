const admin = require("firebase-admin");
const { db } = require("../config/firebase");

const toEmail = (username) => `${username}@enlyteprototype.app`;

// Create user — creates Firebase Auth account + Firestore profile (no password in DB)
exports.createUser = async (req, res) => {
  try {
    const { username, password, name, employeeNumber, role } = req.body;

    if (!username || !password || !name || !employeeNumber || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const email = toEmail(username);

    // Create Firebase Auth account (password is stored securely by Firebase)
    let authUser;
    try {
      authUser = await admin.auth().createUser({ email, password, displayName: name });
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        return res.status(409).json({ error: "Username already exists" });
      }
      throw err;
    }

    // Store profile in Firestore (no password field)
    const docRef = await db.collection("users").add({
      uid: authUser.uid,
      username,
      name,
      employeeNumber,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      success: true,
      user: { id: docRef.id, username, name, employeeNumber, role },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user — updates Firestore profile; updates Firebase Auth password if provided
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, employeeNumber, role, password, username } = req.body;

    // Update Firestore profile
    const updateData = {};
    if (name) updateData.name = name;
    if (employeeNumber) updateData.employeeNumber = employeeNumber;
    if (role) updateData.role = role;

    await db.collection("users").doc(id).update(updateData);

    // If password provided, update Firebase Auth
    if (password && password.trim() !== "") {
      const resolvedUsername = username || (await db.collection("users").doc(id).get()).data().username;
      const email = toEmail(resolvedUsername);
      const authUser = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(authUser.uid, { password: password.trim() });
    }

    res.json({ success: true, user: { id, ...updateData } });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete user — deletes from Firebase Auth + Firestore
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Get username to find Firebase Auth account
    const docSnap = await db.collection("users").doc(id).get();
    if (!docSnap.exists) return res.status(404).json({ error: "User not found" });

    const { username } = docSnap.data();

    // Delete from Firebase Auth
    try {
      const authUser = await admin.auth().getUserByEmail(toEmail(username));
      await admin.auth().deleteUser(authUser.uid);
    } catch (err) {
      console.warn("Firebase Auth user not found, skipping auth delete:", err.message);
    }

    // Delete from Firestore
    await db.collection("users").doc(id).delete();

    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
