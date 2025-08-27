const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${req.headers['user-agent']?.substring(0, 50) || 'Unknown'}`);

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404 Not Found', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const wss = new WebSocket.Server({ server });

const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  const clientIP = req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] Client connected - ID: ${clientId}, IP: ${clientIP}`);
  console.log(`[${new Date().toISOString()}] Total connected clients: ${clients.size + 1}`);
  
  clients.add(ws);
  ws.clientId = clientId;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      let logDetails = `${data.type}`;
      
      if (data.type === 'signal' && data.data) {
        if (data.data.type === 'offer') {
          logDetails += ` (offer - ${data.data.sdp ? 'with SDP' : 'no SDP'})`;
        } else if (data.data.type === 'answer') {
          logDetails += ` (answer - ${data.data.sdp ? 'with SDP' : 'no SDP'})`;
        } else if (data.data.candidate) {
          if (typeof data.data.candidate === 'string') {
            const candParts = data.data.candidate.split(' ');
            logDetails += ` (ICE candidate: ${candParts[7] || 'unknown'} ${candParts[4] || ''})`;
          } else {
            logDetails += ` (ICE candidate: ${data.data.candidate.candidate || 'object'})`;
          }
        }
      }
      
      console.log(`[${new Date().toISOString()}] 📨 Message from ${clientId}: ${logDetails}`);
      
      // Only allow maximum of 2 connected clients (1 streamer + 1 viewer)
      if (clients.size > 2) {
        console.warn(`[${new Date().toISOString()}] ⚠️ Too many clients (${clients.size}), message may cause issues`);
      }
      
      let relayCount = 0;
      const targetClients = Array.from(clients).filter(client => 
        client !== ws && client.readyState === WebSocket.OPEN
      );
      
      // Only relay to the first available client to prevent duplicates
      if (targetClients.length > 0) {
        targetClients[0].send(message);
        relayCount = 1;
        
        if (targetClients.length > 1) {
          console.warn(`[${new Date().toISOString()}] ⚠️ Multiple target clients, only relaying to first one`);
        }
      }
      
      console.log(`[${new Date().toISOString()}] 🔄 Relayed to ${relayCount} clients`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error parsing message from ${clientId}:`, error);
    }
  });

  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected - ID: ${clientId}`);
    console.log(`[${new Date().toISOString()}] Total connected clients: ${clients.size - 1}`);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] WebSocket error from ${clientId}:`, error);
    clients.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Streamer: http://localhost:${PORT}/streamer.html`);
  console.log(`Viewer: http://localhost:${PORT}/viewer.html`);
});