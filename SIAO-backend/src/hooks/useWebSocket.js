import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for WebSocket connections
 * @param {string} url - WebSocket server URL
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Whether to connect automatically on mount
 * @param {number} options.reconnectInterval - Interval in ms between reconnection attempts
 * @param {number} options.maxReconnectAttempts - Maximum number of reconnection attempts
 * @param {Function} options.onMessage - Callback for incoming messages
 * @param {Function} options.onOpen - Callback when connection opens
 * @param {Function} options.onClose - Callback when connection closes
 * @param {Function} options.onError - Callback when error occurs
 * @returns {Object} WebSocket methods and state
 */
const useWebSocket = (url, options = {}) => {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage = () => {},
    onOpen = () => {},
    onClose = () => {},
    onError = () => {},
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      const socket = new WebSocket(url);
      
      socket.onopen = (event) => {
        setIsConnected(true);
        setReconnectCount(0);
        onOpen(event);
      };
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        onMessage(data);
      };
      
      socket.onclose = (event) => {
        setIsConnected(false);
        onClose(event);
        
        // Attempt to reconnect if not closed cleanly and under max attempts
        if (!event.wasClean && reconnectCount < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };
      
      socket.onerror = (error) => {
        onError(error);
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      onError(error);
    }
  }, [url, reconnectCount, maxReconnectAttempts, reconnectInterval, onOpen, onMessage, onClose, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socketRef.current.send(message);
      return true;
    }
    return false;
  }, []);

  // Connect on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnectCount
  };
};

export default useWebSocket;