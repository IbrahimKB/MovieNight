// Quick script to generate the correct password hash
const bcrypt = require("bcryptjs");

async function generateHash() {
  const password = "L3m0n!";
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log("Original password:", password);
  console.log("Hashed password:", hashedPassword);

  // Test the hash
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log("Hash verification:", isValid);
}

generateHash().catch(console.error);
