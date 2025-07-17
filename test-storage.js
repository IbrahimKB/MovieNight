// Simple test to verify data storage is working
const fs = require("fs");
const bcrypt = require("bcryptjs");

// Read current database
let db;
try {
  const data = fs.readFileSync("./data/database.json", "utf8");
  db = JSON.parse(data);
} catch (error) {
  console.log("Creating new database...");
  db = {
    users: [],
    movies: [],
    suggestions: [],
    watchDesires: [],
    friendships: [],
    watchedMovies: [],
    notifications: [],
    releases: [],
    metadata: {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
    },
  };
}

console.log("Current users count:", db.users.length);

// Add a test user
async function addTestUser() {
  const hashedPassword = await bcrypt.hash("testpass123", 12);

  const testUser = {
    id: "test-user-" + Date.now(),
    username: "testuser",
    email: "test@example.com",
    name: "Test User",
    password: hashedPassword,
    role: "user",
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.users.push(testUser);
  db.metadata.lastUpdated = new Date().toISOString();

  // Write back to file
  fs.writeFileSync("./data/database.json", JSON.stringify(db, null, 2));

  console.log("✅ Test user added successfully");
  console.log("User ID:", testUser.id);
  console.log("Username:", testUser.username);
  console.log("Total users now:", db.users.length);
}

addTestUser().catch(console.error);
