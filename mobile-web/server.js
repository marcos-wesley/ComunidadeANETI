const express = require('express');
const path = require('path');

const app = express();
const PORT = 8082;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`ANETI Mobile Web App running on http://0.0.0.0:${PORT}`);
    console.log(`Access from your phone: https://${process.env.REPL_ID}-00-${process.env.REPL_SLUG}.${process.env.REPLIT_CLUSTER}.replit.dev:${PORT}`);
});