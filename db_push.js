const { execSync } = require('child_process');
const readline = require('readline');

try {
  // Simulate user input "y" for the prompt
  const child = execSync('echo "y" | npx drizzle-kit push', { 
    stdio: 'inherit',
    shell: true 
  });
} catch (error) {
  console.log('Command completed with status:', error.status);
}
