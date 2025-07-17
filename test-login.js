const fetch = require("node-fetch");

async function testLogin() {
  try {
    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "kaysar",
        password: "L3m0n!",
      }),
    });

    const data = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", data);
  } catch (error) {
    console.error("Test login error:", error);
  }
}

testLogin();
