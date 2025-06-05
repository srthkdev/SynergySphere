const http = require('http');
const WebSocket = require('ws');
const { parse } = require('url');

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients and their rooms
const clients = new Map();
const rooms = new Map();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const userId = parse(req.url, true).query.userId;
  if (!userId) {
    ws.close(1008, 'User ID is required');
    return;
  }
  
  console.log(`User ${userId} connected`);
  
  // Store client connection
  clients.set(userId, ws);
  
  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join_room':
          joinRoom(userId, data.payload.roomId);
          break;
          
        case 'leave_room':
          leaveRoom(userId, data.payload.roomId);
          break;
          
        case 'message':
          broadcastMessage(userId, data.payload);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log(`User ${userId} disconnected`);
    
    // Remove from all rooms
    for (const [roomId, members] of rooms.entries()) {
      if (members.has(userId)) {
        members.delete(userId);
        if (members.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
    
    // Remove client
    clients.delete(userId);
  });
  
  // Send a welcome message to the client
  ws.send(JSON.stringify({
    type: 'system',
    payload: {
      message: 'Connected to WebSocket server',
      userId
    }
  }));
});

// Join a room
function joinRoom(userId, roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  
  rooms.get(roomId).add(userId);
  console.log(`User ${userId} joined room ${roomId}`);
}

// Leave a room
function leaveRoom(userId, roomId) {
  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(userId);
    
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
    }
    
    console.log(`User ${userId} left room ${roomId}`);
  }
}

// Broadcast message to all members in a room
function broadcastMessage(senderId, message) {
  const { projectId, taskId } = message;
  const roomId = taskId ? `task:${taskId}` : `project:${projectId}`;
  
  if (rooms.has(roomId)) {
    const messageToSend = JSON.stringify({
      type: 'message',
      payload: message
    });
    
    rooms.get(roomId).forEach((userId) => {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(messageToSend);
      }
    });
    
    console.log(`Message broadcast to room ${roomId} from user ${senderId}`);
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
}); 