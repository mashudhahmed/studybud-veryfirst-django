import { useState, useEffect, useCallback } from 'react';
import * as messagesApi from '../api/messages';

export const useMessages = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await messagesApi.getMessages({ roomId });
      setMessages(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = useCallback(async (messageData) => {
    try {
      const newMessage = await messagesApi.createMessage(messageData);
      setMessages(prev => [newMessage, ...prev]);
      return newMessage;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeMessage = useCallback(async (messageId) => {
    try {
      await messagesApi.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return { messages, loading, error, addMessage, removeMessage, refetch: fetchMessages };
};