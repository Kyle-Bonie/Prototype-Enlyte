const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";

async function testAPI() {
  console.log("🧪 Testing Enlyte API...\n");

  try {
    // Test 1: Server health check
    console.log("1. Testing server health...");
    const healthResponse = await axios.get("http://localhost:5000/");
    console.log("✓ Server is running:", healthResponse.data.message);
    console.log("✓ Database:", healthResponse.data.database);
    console.log();

    // Test 2: Login with agent credentials
    console.log("2. Testing agent login...");
    const agentLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: "agent",
      password: "agent123",
    });
    console.log("✓ Agent login successful");
    console.log("   Token:", agentLogin.data.token.substring(0, 20) + "...");
    console.log("   User:", agentLogin.data.user.name);
    console.log("   Role:", agentLogin.data.user.role);
    console.log();

    // Test 3: Login with team lead credentials
    console.log("3. Testing team lead login...");
    const leadLogin = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: "teamlead",
      password: "lead123",
    });
    console.log("✓ Team Lead login successful");
    console.log("   Token:", leadLogin.data.token.substring(0, 20) + "...");
    console.log("   User:", leadLogin.data.user.name);
    console.log("   Role:", leadLogin.data.user.role);
    console.log();

    // Test 4: Get current user with token
    console.log("4. Testing token verification...");
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${agentLogin.data.token}` },
    });
    console.log("✓ Token verified successfully");
    console.log("   Authenticated as:", meResponse.data.user.name);
    console.log();

    // Test 5: Invalid login
    console.log("5. Testing invalid login...");
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        username: "invalid",
        password: "wrong",
      });
      console.log("✗ Should have failed");
    } catch (error) {
      console.log("✓ Invalid credentials rejected correctly");
    }
    console.log();

    console.log("✅ All tests passed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

// Check if server is running
console.log(
  "Make sure your server is running (npm run dev) before running tests\n",
);
setTimeout(testAPI, 1000);
