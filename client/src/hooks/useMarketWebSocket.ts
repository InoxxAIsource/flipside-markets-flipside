import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useMarketWebSocket(marketId: string | undefined) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!marketId) return;

    const connect = () => {
      // Get WebSocket URL from current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WebSocket] Connected to order book updates');
          setIsConnected(true);
          // Subscribe to market updates
          ws.send(JSON.stringify({ type: 'subscribe', marketId }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'orderbook_update' && message.marketId === marketId) {
              console.log('[WebSocket] Order book update received', message.data);
              
              // Invalidate all market queries for this market
              queryClient.invalidateQueries({ 
                predicate: (query) => {
                  const queryKey = query.queryKey;
                  return Array.isArray(queryKey) && 
                         queryKey[0] === '/api/markets' && 
                         queryKey[1] === marketId;
                }
              });
              
              // If order was filled, invalidate all user/portfolio/proxy queries
              // This ensures profile, portfolio, and all user-specific data stays fresh
              if (message.data?.type === 'order_filled' || message.data?.type === 'new_order') {
                queryClient.invalidateQueries({
                  predicate: (query) => {
                    const key = query.queryKey[0];
                    return typeof key === 'string' && (
                      key.includes('/api/users') ||
                      key.includes('/api/portfolio') ||
                      key.includes('/api/proxy') ||
                      key.includes('/api/positions')
                    );
                  }
                });
              }
            }
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        ws.onclose = () => {
          console.log('[WebSocket] Disconnected, reconnecting in 3s...');
          setIsConnected(false);
          wsRef.current = null;
          
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        // Unsubscribe before closing
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'unsubscribe', marketId }));
        }
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [marketId, queryClient]);

  return isConnected;
}
