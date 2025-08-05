const fs = require('fs');

// Test different ways to parse the CSV
const content = fs.readFileSync('attached_assets/aneti_users_1754413800087.csv', 'utf8');

console.log('File size:', content.length);

// Method 1: Parse as is (current method)
try {
  const users1 = JSON.parse('[' + content + ']');
  console.log('Method 1 - Users found:', users1.length);
} catch (e) {
  console.log('Method 1 failed:', e.message);
}

// Method 2: Parse directly
try {
  const users2 = JSON.parse(content);
  console.log('Method 2 - Users found:', users2.length);
} catch (e) {
  console.log('Method 2 failed:', e.message);
}

// Method 3: Check if already has brackets
if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
  try {
    const users3 = JSON.parse(content);
    console.log('Method 3 - Users found:', users3.length);
  } catch (e) {
    console.log('Method 3 failed:', e.message);
  }
} else {
  console.log('Method 3 - File does not start with [ or end with ]');
}

// Method 4: Show first and last characters
console.log('First 5 chars:', JSON.stringify(content.substring(0, 5)));
console.log('Last 5 chars:', JSON.stringify(content.substring(content.length - 5)));