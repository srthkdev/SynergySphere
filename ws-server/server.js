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

// Heartbeat interval to detect disconnected clients (in milliseconds)
const HEARTBEAT_INTERVAL = 30000;

// Setup heartbeat to detect and clean up disconnected clients
function heartbeat() {
  this.isAlive = true;
}

// Interval to check client connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log('Terminating inactive client');
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

// Handle WebSocket server close
wss.on('close', () => {
  clearInterval(interval);
  console.log('WebSocket server closed');
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  // Set up heartbeat
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  
  // Parse client IP for logging
  const ip = req.socket.remoteAddress;
  
  // Get userId from query parameters
  const { query } = parse(req.url, true);
  const userId = query.userId;
  
  if (!userId) {
    console.log(`Connection rejected: No userId provided from ${ip}`);
    ws.close(1008, 'User ID is required');
    return;
  }
  
  console.log(`User ${userId} connected from ${ip}`);
  
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
          console.log(`Unknown message type from ${userId}: ${data.type}`);
      }
    } catch (error) {
      console.error(`Error processing message from ${userId}:`, error);
      
      // Send error back to client
      ws.send(JSON.stringify({
        type: 'error',
        payload: {
          message: 'Failed to process message',
          error: error.message
        }
      }));
    }
  });
  
  // Handle client disconnection
  ws.on('close', (code, reason) => {
    console.log(`User ${userId} disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    
    // Remove from all rooms
    for (const [roomId, members] of rooms.entries()) {
      if (members.has(userId)) {
        members.delete(userId);
        console.log(`User ${userId} removed from room ${roomId}`);
        
        if (members.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    }
    
    // Remove client
    clients.delete(userId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`WebSocket error for user ${userId}:`, error);
  });
  
  // Send a welcome message to the client
  ws.send(JSON.stringify({
    type: 'system',
    payload: {
      message: 'Connected to WebSocket server',
      userId,
      timestamp: new Date().toISOString()
    }
  }));
});

// Join a room
function joinRoom(userId, roomId) {
  if (!roomId) {
    console.error(`Invalid roomId provided by user ${userId}`);
    return;
  }
  
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
    console.log(`New room created: ${roomId}`);
  }
  
  rooms.get(roomId).add(userId);
  console.log(`User ${userId} joined room ${roomId} (${rooms.get(roomId).size} members)`);
  
  // Notify user they joined the room
  const client = clients.get(userId);
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({
      type: 'system',
      payload: {
        message: `Joined room: ${roomId}`,
        roomId,
        timestamp: new Date().toISOString()
      }
    }));
  }
}

// Leave a room
function leaveRoom(userId, roomId) {
  if (!roomId) {
    console.error(`Invalid roomId provided by user ${userId}`);
    return;
  }
  
  if (rooms.has(roomId)) {
    rooms.get(roomId).delete(userId);
    console.log(`User ${userId} left room ${roomId}`);
    
    if (rooms.get(roomId).size === 0) {
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted (empty)`);
    }
    
    // Notify user they left the room
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'system',
        payload: {
          message: `Left room: ${roomId}`,
          roomId,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }
}

// Broadcast message to all members in a room
function broadcastMessage(senderId, message) {
  if (!message) {
    console.error(`Invalid message from user ${senderId}`);
    return;
  }
  
  const { projectId, taskId } = message;
  
  if (!projectId && !taskId) {
    console.error(`Message missing projectId or taskId from user ${senderId}`);
    return;
  }
  
  const roomId = taskId ? `task:${taskId}` : `project:${projectId}`;
  
  // Auto-join the sender to the room if not already a member
  if (!rooms.has(roomId) || !rooms.get(roomId).has(senderId)) {
    joinRoom(senderId, roomId);
  }
  
  if (rooms.has(roomId)) {
    // Add server timestamp and message ID if not present
    const enrichedMessage = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const messageToSend = JSON.stringify({
      type: 'message',
      payload: enrichedMessage
    });
    
    let deliveredCount = 0;
    
    // Send to all room members
    rooms.get(roomId).forEach((userId) => {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(messageToSend);
        deliveredCount++;
      }
    });
    
    console.log(`Message broadcast to room ${roomId} from user ${senderId}: Delivered to ${deliveredCount} clients`);
  } else {
    console.log(`Attempted to send message to non-existent room ${roomId}`);
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
}); 