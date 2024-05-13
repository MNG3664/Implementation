const crypto = require('crypto');

// Generate a random buffer of bytes (change the byte length as needed)
const randomBytes = crypto.randomBytes(32);

// Convert the random buffer to a hexadecimal string
const secretKey = randomBytes.toString('hex');

console.log('Generated Secret Key:', secretKey);
