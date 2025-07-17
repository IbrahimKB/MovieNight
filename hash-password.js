const bcrypt = require("bcryptjs");
const password = "L3m0n!";
const hashedPassword = bcrypt.hashSync(password, 12);
console.log(hashedPassword);
