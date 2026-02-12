require("dotenv").config();
const bcrypt = require("bcrypt");
const User = require("./models/User");

async function seedUsers() {
  try {
    console.log("Seeding users...");

    // Check if users already exist
    const existingAgent = await User.findByUsername("agent");
    const existingTeamLead = await User.findByUsername("teamlead");

    if (existingAgent) {
      console.log("Agent user already exists");
    } else {
      // Create agent user
      const agentPassword = await bcrypt.hash("agent123", 10);
      await User.create({
        username: "agent",
        password: agentPassword,
        name: "Test Agent",
        role: "Agent",
        status: "Active",
      });
      console.log("✓ Agent user created (username: agent, password: agent123)");
    }

    if (existingTeamLead) {
      console.log("Team Lead user already exists");
    } else {
      // Create team lead user
      const leadPassword = await bcrypt.hash("lead123", 10);
      await User.create({
        username: "teamlead",
        password: leadPassword,
        name: "Test Team Lead",
        role: "Team Lead",
        status: "Active",
      });
      console.log(
        "✓ Team Lead user created (username: teamlead, password: lead123)",
      );
    }

    console.log("\nSeeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

seedUsers();
