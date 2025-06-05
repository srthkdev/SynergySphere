"use client";

import { toast } from "sonner";
import { ChatMessage } from "@/types";

// This determines if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// WebSocket connection status
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// Event types
type MessageListener = (message: ChatMessage) => void;
type StatusListener = (status: ConnectionStatus) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageListeners: MessageListener[] = [];
  private statusListeners: StatusListener[] = [];
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private initialized = false;

  constructor() {
    // Only initialize in browser environment
    if (isBrowser) {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  // Set the user ID for authentication
  setUserId(userId: string) {
    this.userId = userId;
    
    // Auto-connect when userId is set if we haven't connected yet
    if (!this.initialized && userId) {
      this.initialized = true;
      this.connect();
    }
  }

  // Connect to the WebSocket server
  connect() {
    if (!isBrowser || !this.userId) {
      console.log("Cannot connect: Browser environment or userId not available");
      return;
    }
    
    // Don't connect if already connecting or connected
    if (this.status === 'connecting' || this.status === 'connected') {
      console.log(`Skipping connection attempt. Current status: ${this.status}`);
      return;
    }
    
    if (this.socket) {
      this.disconnect();
    }

    this.updateStatus('connecting');
    
    try {
      // Fetch server URL from environment or use default with fallback
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
      console.log(`Attempting to connect to WebSocket at ${wsUrl}?userId=${this.userId}`);
      
      this.socket = new WebSocket(`${wsUrl}?userId=${this.userId}`);
      
      this.socket.onopen = this.handleOpen;
      this.socket.onmessage = this.handleMessage;
      this.socket.onclose = this.handleClose;
      this.socket.onerror = this.handleError;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.updateStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  // Disconnect from the WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.updateStatus('disconnected');
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    }
  }

  // Send a message through the WebSocket
  sendMessage(message: Omit<ChatMessage, 'id' | 'createdAt' | 'updatedAt' | 'readBy'>) {
    if (this.socket && this.status === 'connected') {
      this.socket.send(JSON.stringify({
        type: 'message',
        payload: message
      }));
    } else {
      console.log("Socket not connected, reconnecting first");
      // Store message to send after connection
      const pendingMessage = message;
      // Set up a one-time listener for connection
      const statusUnsubscribe = this.onStatusChange((status) => {
        if (status === 'connected') {
          // Send the message once connected
          this.socket?.send(JSON.stringify({
            type: 'message',
            payload: pendingMessage
          }));
          // Remove this listener
          statusUnsubscribe();
        }
      });
      
      toast.info("Connecting to chat server...");
      this.connect(); // Try to reconnect
    }
  }

  // Join a chat room
  joinRoom(roomId: string) {
    if (this.socket && this.status === 'connected') {
      console.log(`Joining room: ${roomId}`);
      this.socket.send(JSON.stringify({
        type: 'join_room',
        payload: { roomId }
      }));
    } else {
      // Setup a one-time listener to join the room when connected
      const unsubscribe = this.onStatusChange((status) => {
        if (status === 'connected') {
          console.log(`Now connected, joining room: ${roomId}`);
          this.socket?.send(JSON.stringify({
            type: 'join_room',
            payload: { roomId }
          }));
          unsubscribe();
        }
      });
      
      // Try to connect if not already connected
      if (this.status !== 'connecting') {
        this.connect();
      }
    }
  }

  // Leave a chat room
  leaveRoom(roomId: string) {
    if (this.socket && this.status === 'connected') {
      console.log(`Leaving room: ${roomId}`);
      this.socket.send(JSON.stringify({
        type: 'leave_room',
        payload: { roomId }
      }));
    }
  }

  // Subscribe to message events
  onMessage(listener: MessageListener) {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== listener);
    };
  }

  // Subscribe to connection status changes
  onStatusChange(listener: StatusListener) {
    this.statusListeners.push(listener);
    listener(this.status); // Immediately call with current status
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  // Handle WebSocket open event
  private handleOpen = () => {
    console.log('WebSocket connection established');
    this.updateStatus('connected');
    this.reconnectAttempts = 0;
  };

  // Handle WebSocket message event
  private handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        const message = data.payload as ChatMessage;
        this.messageListeners.forEach(listener => listener(message));
      } else if (data.type === 'system') {
        console.log('System message:', data.payload);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  // Handle WebSocket close event
  private handleClose = (event: CloseEvent) => {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason || 'No reason provided'}`);
    this.updateStatus('disconnected');
    
    // Don't reconnect in these cases:
    // 1000 = Normal closure
    // 1001 = Going away (page refresh/navigation)
    // 1005 = No status received (often normal in dev environments)
    if (event.code !== 1000 && event.code !== 1001 && event.code !== 1005) {
      console.log(`Reconnecting due to abnormal close code: ${event.code}`);
      this.scheduleReconnect();
    } else {
      console.log(`Not reconnecting. Close code ${event.code} is considered normal.`);
    }
  };

  // Handle WebSocket error event
  private handleError = (event: Event) => {
    console.error('WebSocket error:', event);
    this.updateStatus('disconnected');
    this.scheduleReconnect();
  };

  // Handle browser going online
  private handleOnline = () => {
    console.log('Browser is online, reconnecting WebSocket');
    this.connect();
  };

  // Handle browser going offline
  private handleOffline = () => {
    console.log('Browser is offline, disconnecting WebSocket');
    this.updateStatus('disconnected');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  };

  // Update connection status and notify listeners
  private updateStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  // Schedule reconnection attempt
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }
    
    // Don't schedule if already connecting or connected
    if (this.status === 'connecting' || this.status === 'connected') {
      console.log(`Not scheduling reconnect. Current status: ${this.status}`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000); // Exponential backoff, max 30 seconds
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.connect();
    }, delay);
  }

  // Clean up event listeners
  cleanup() {
    if (isBrowser) {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.disconnect();
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient();

// Export a hook for React components
export function useWebSocket() {
  return websocketClient;
} 