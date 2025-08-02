const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'push'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Send "y" to accept the prompt
child.stdin.write('y\n');
child.stdin.end();

child.on('close', (code) => {
  console.log(`Push completed with exit code ${code}`);
  process.exit(code);
});
