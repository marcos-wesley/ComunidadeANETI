const fs = require('fs');

// Debug the CSV file format
const csvContent = fs.readFileSync('attached_assets/aneti_users_1754413800087.csv', 'utf8');

console.log('File length:', csvContent.length);
console.log('First 200 chars:', csvContent.substring(0, 200));
console.log('Last 200 chars:', csvContent.substring(csvContent.length - 200));

// Try to parse as JSON array
try {
  const users = JSON.parse('[' + csvContent + ']');
  console.log('Parsed successfully! Users count:', users.length);
  console.log('First user:', JSON.stringify(users[0], null, 2));
  console.log('Last user:', JSON.stringify(users[users.length - 1], null, 2));
} catch (error) {
  console.error('Parse error:', error.message);
  
  // Try parsing line by line
  const lines = csvContent.split('\n').filter(line => line.trim());
  console.log('Lines count:', lines.length);
  
  // Try parsing just the first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    try {
      const user = JSON.parse(lines[i].replace(/,$/, ''));
      console.log(`Line ${i} parsed:`, user.user_login);
    } catch (e) {
      console.log(`Line ${i} failed:`, lines[i].substring(0, 100));
    }
  }
}