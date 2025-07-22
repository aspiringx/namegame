import { useState, useEffect, useRef } from 'react';

export interface Message {
    from: {
        id: string;
        name: string;
    };
    content: string;
    participants: string[];
}

const useWebSocket = (userId?: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const webSocketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!userId) {
            return;
        }

        const webSocketUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080'}?userId=${userId}`;

        if (!webSocketRef.current) {
            const ws = new WebSocket(webSocketUrl);
            webSocketRef.current = ws;

            ws.onopen = () => {
                console.log(`WebSocket connected for user: ${userId}`);
                setIsConnected(true);
            };

            ws.onmessage = (event) => {
                try {
                    const newMessageData = JSON.parse(event.data);
                    setMessages((prevMessages) => [...prevMessages, newMessageData]);
                } catch (error) {
                    console.error('Failed to parse incoming message:', error);
                }
            };

            ws.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                webSocketRef.current = null;
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        return () => {
            if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
                webSocketRef.current.close();
            }
        };
    }, [userId]);

    const sendMessage = (targetUserIds: string[], content: string) => {
        if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ targetUserIds, content });
            webSocketRef.current.send(message);
        } else {
            console.error('WebSocket is not connected.');
        }
    };

    return { messages, isConnected, sendMessage };
};

export default useWebSocket;
