// Seed demo users directly into Firestore using Admin SDK
require("dotenv").config();
const admin = require("firebase-admin");

const credential = admin.credential.cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
});

admin.initializeApp({ credential, projectId: process.env.FIREBASE_PROJECT_ID });

const db = admin.firestore();

const demoUsers = [
  {
    username: "teamlead",
    password: "lead123",
    name: "Demo Team Lead",
    employeeNumber: "EMP-001",
    role: "Team Lead",
  },
  {
    username: "agent",
    password: "agent123",
    name: "Demo Agent",
    employeeNumber: "EMP-002",
    role: "Agent",
  },
];

async function seed() {
  console.log("Seeding Firestore users...");

  for (const user of demoUsers) {
    const snapshot = await db
      .collection("users")
      .where("username", "==", user.username)
      .get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.set(
        {
          username: user.username,
          password: user.password,
          name: user.name,
          employeeNumber: user.employeeNumber,
          role: user.role,
        },
        { merge: true }
      );
      console.log(`Updated: ${user.username}`);
    } else {
      await db.collection("users").add({
        ...user,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Created: ${user.username}`);
    }
  }

  console.log("\nDone! Login credentials:");
  console.log("  teamlead / lead123  -> Team Lead dashboard");
  console.log("  agent    / agent123 -> Agent dashboard");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
