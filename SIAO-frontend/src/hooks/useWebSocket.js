import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for WebSocket connections with fallback for development
 * @param {string} url - WebSocket server URL
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Whether to connect automatically on mount
 * @param {number} options.reconnectInterval - Interval in ms between reconnection attempts
 * @param {number} options.maxReconnectAttempts - Maximum number of reconnection attempts
 * @param {Function} options.onMessage - Callback for incoming messages
 * @param {Function} options.onOpen - Callback when connection opens
 * @param {Function} options.onClose - Callback when connection closes
 * @param {Function} options.onError - Callback when error occurs
 * @param {boolean} options.mockInDev - Whether to use mock data in development
 * @returns {Object} WebSocket methods and state
 */
export const useWebSocket = (url, options = {}) => {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage = () => {},
    onOpen = () => {},
    onClose = () => {},
    onError = () => {},
    mockInDev = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [isMockMode, setIsMockMode] = useState(false);
  
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mockIntervalRef = useRef(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Check if we should use mock mode
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && mockInDev) {
      console.log('WebSocket: Using mock mode in development');
      setIsMockMode(true);
      setIsConnected(true);
      onOpen({ type: 'open', isMock: true });
      return;
    }
    
    // Don't try to connect if URL is undefined
    if (!url) {
      console.warn('WebSocket URL is undefined, not connecting');
      return;
    }
    
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      console.log(`Connecting to WebSocket: ${url}`);
      const socket = new WebSocket(url);
      
      socket.onopen = (event) => {
        console.log('WebSocket connection opened');
        setIsConnected(true);
        setReconnectCount(0);
        onOpen(event);
      };
      
      socket.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          data = event.data;
        }
        setLastMessage(data);
        onMessage(data);
      };
      
      socket.onclose = (event) => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        onClose(event);
        
        // Attempt to reconnect if not closed cleanly and under max attempts
        if (!event.wasClean && reconnectCount < maxReconnectAttempts) {
          console.log(`Attempting to reconnect (${reconnectCount + 1}/${maxReconnectAttempts})...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount(prev => prev + 1);
            connect();
          }, reconnectInterval);
        } else if (reconnectCount >= maxReconnectAttempts && isDev && mockInDev) {
          // Fall back to mock mode after max reconnect attempts
          console.log('Max reconnect attempts reached, falling back to mock mode');
          setIsMockMode(true);
          setIsConnected(true);
          onOpen({ type: 'open', isMock: true });
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError(error);
        
        // In development, if we get an error, immediately fall back to mock mode
        if (isDev && mockInDev) {
          console.log('WebSocket error in development, falling back to mock mode');
          socket.close();
          setIsMockMode(true);
          setIsConnected(true);
          onOpen({ type: 'open', isMock: true });
        }
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      onError(error);
      
      // In development, if we can't connect, fall back to mock mode
      if (isDev && mockInDev) {
        console.log('WebSocket connection failed in development, falling back to mock mode');
        setIsMockMode(true);
        setIsConnected(true);
        onOpen({ type: 'open', isMock: true });
      }
    }
  }, [url, reconnectCount, maxReconnectAttempts, reconnectInterval, onOpen, onMessage, onClose, onError, mockInDev]);

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
    
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setIsMockMode(false);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((data) => {
    // If in mock mode, simulate receiving a response
    if (isMockMode) {
      console.log('Mock WebSocket: Sending message', data);
      
      // Simulate a response after a short delay
      setTimeout(() => {
        const mockResponse = {
          type: 'mock_response',
          originalMessage: data,
          timestamp: new Date().toISOString(),
          success: true
        };
        
        setLastMessage(mockResponse);
        onMessage(mockResponse);
      }, 500);
      
      return true;
    }
    
    // Real WebSocket send
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socketRef.current.send(message);
      return true;
    }
    
    return false;
  }, [isMockMode, onMessage]);

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

  // Set up mock interval to simulate periodic messages in mock mode
  useEffect(() => {
    if (isMockMode) {
      // Simulate periodic messages in mock mode
      mockIntervalRef.current = setInterval(() => {
        const mockHeartbeat = {
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        };
        
        setLastMessage(mockHeartbeat);
        // Don't call onMessage for heartbeats to avoid spamming
      }, 30000); // Every 30 seconds
    }
    
    return () => {
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
      }
    };
  }, [isMockMode]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnectCount,
    isMockMode
  };
};

export default useWebSocket;