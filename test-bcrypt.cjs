const bcrypt = require('bcrypt');

async function testBcrypt() {
  // Test the WordPress hash from fernando.silva
  const wordpressHash = '$wp$2y$10$A4wVb9xB6jh/yVWBPDpp2eakW51fJk6CIaVKYZCzc8qo0RR4sqema';
  const cleanHash = wordpressHash.replace('$wp', '');
  const testPassword = 'Ste*23050508';
  
  console.log('Original WordPress hash:', wordpressHash);
  console.log('Clean hash:', cleanHash);
  console.log('Testing password:', testPassword);
  
  try {
    const result = await bcrypt.compare(testPassword, cleanHash);
    console.log('Bcrypt comparison result:', result);
    
    // Also test with some common passwords
    const commonPasswords = ['123456', 'password', 'fernando', 'silva', 'Fernando123'];
    for (const password of commonPasswords) {
      const result = await bcrypt.compare(password, cleanHash);
      console.log(`Testing '${password}': ${result}`);
    }
    
  } catch (error) {
    console.error('Bcrypt error:', error);
  }
}

testBcrypt();