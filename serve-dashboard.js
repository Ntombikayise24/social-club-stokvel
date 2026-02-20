const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const HTML_FILE = path.join(__dirname, 'business-logic-dashboard.html');

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/dashboard') {
    fs.readFile(HTML_FILE, 'utf-8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading dashboard: ' + err.message);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 - Not Found');
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         STOCKVEL Business Logic Dashboard Server           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n✅ Server running at: ' + url);
  console.log('📊 Dashboard:        ' + url + '/dashboard');
  console.log('\n💡 Open in your browser to view the interactive dashboard');
  console.log('\n📝 To stop the server, press Ctrl+C\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use. Try:
  - Change the PORT variable in this file to a different port
  - Or stop the process using port ${PORT}
  - Or run: npx kill-port ${PORT}\n`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
