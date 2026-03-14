const { scrypt, randomBytes } = require('node:crypto');

const password = 'Admin@123';
const salt = randomBytes(16).toString('hex');

scrypt(password, salt, 64, (err, derivedKey) => {
    if (err) throw err;
    console.log(`Password: ${password}`);
    console.log(`Hash: ${salt}:${derivedKey.toString('hex')}`);
});
