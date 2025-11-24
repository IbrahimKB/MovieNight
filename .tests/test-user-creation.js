const fetch = require("node-fetch");

async function testUserCreation() {
  const baseUrl = "http://localhost:5173";

  try {
    console.log("Testing user registration...");

    // Test user signup
    const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser1",
        email: "test1@example.com",
        name: "Test User One",
        password: "password123",
      }),
    });

    const signupResult = await signupResponse.json();
    console.log("Signup response:", signupResult);

    if (signupResult.success) {
      console.log("✅ User registration successful");

      // Test user search
      console.log("\nTesting user search...");
      const searchResponse = await fetch(
        `${baseUrl}/api/auth/search-users?q=test`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${signupResult.data.token}`,
          },
        },
      );

      const searchResult = await searchResponse.json();
      console.log("Search response:", searchResult);

      if (searchResult.success && searchResult.data.length > 0) {
        console.log("✅ User search working correctly");
      } else {
        console.log("❌ User search not finding users");
      }
    } else {
      console.log("❌ User registration failed:", signupResult.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testUserCreation();
