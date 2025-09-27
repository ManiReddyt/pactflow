import { useState, useCallback, useRef, useEffect } from 'react';
import { aiChatService } from '../services/aiChatService';
import type { Message } from '../components/ChatWindow';

interface UseChatOptions {
  onSessionEnd?: () => void;
  pollingInterval?: number; // in milliseconds, default 5000
}

export interface UseChatReturn {
  // Session state
  sessionId: string | null;
  isSessionActive: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Messages
  messages: Message[];
  isSendingMessage: boolean;
  
  // Actions
  startSession: (document: File | Blob) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  endSession: () => Promise<void>;
  clearError: () => void;
  
  // Polling status
  isPolling: boolean;
  hasDocument: boolean;
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { onSessionEnd, pollingInterval = 5000 } = options;
  
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // Polling state
  const [isPolling, setIsPolling] = useState(false);
  const [hasDocument, setHasDocument] = useState(false);
  
  // Refs for cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMountedRef = useRef(true);
  
  // Generate unique message ID
  const generateMessageId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Polling function
  const poll = useCallback(async (currentSessionId: string) => {
    if (!currentSessionId || !isComponentMountedRef.current) return;
    
    try {
      const response = await aiChatService.pollSession(currentSessionId);
      
      if (!isComponentMountedRef.current) return;
      
      setIsSessionActive(response.active);
      setHasDocument(response.has_document);
      
      // If session is no longer active, stop polling
      if (!response.active) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      if (isComponentMountedRef.current) {
        // Don't set error for polling failures to avoid spam
        // Just stop polling if there's an error
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    }
  }, []);
  
  // Start polling
  const startPolling = useCallback((currentSessionId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    setIsPolling(true);
    
    // Initial poll
    poll(currentSessionId);
    
    // Set up interval
    pollingIntervalRef.current = setInterval(() => {
      poll(currentSessionId);
    }, pollingInterval);
  }, [poll, pollingInterval]);
  
  // Stop polling
  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);
  
  // Start session
  const startSession = useCallback(async (document: File | Blob) => {
    if (!isComponentMountedRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await aiChatService.startSession(document);
      
      if (!isComponentMountedRef.current) return;
      
      setSessionId(response.session_id);
      setIsSessionActive(true);
      setMessages([]);
      
      // Start polling
      startPolling(response.session_id);
      
      console.log('Chat session started:', response.session_id);
    } catch (err) {
      if (isComponentMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start chat session';
        setError(errorMessage);
        console.error('Failed to start session:', err);
      }
    } finally {
      if (isComponentMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [startPolling]);
  
  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !isComponentMountedRef.current) return;
    
    // Add user message immediately
    const userMessage: Message = {
      id: generateMessageId(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsSendingMessage(true);
    setError(null);
    
    try {
      const response = await aiChatService.sendMessage(sessionId, content);
      
      if (!isComponentMountedRef.current) return;
      
      // Add AI response
      const aiMessage: Message = {
        id: generateMessageId(),
        content: response.reply,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      if (isComponentMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Failed to send message:', err);
      }
    } finally {
      if (isComponentMountedRef.current) {
        setIsSendingMessage(false);
      }
    }
  }, [sessionId]);
  
  // End session
  const endSession = useCallback(async () => {
    if (!sessionId) return;
    
    const currentSessionId = sessionId;
    
    // Stop polling immediately
    stopPolling();
    
    // Clear local state
    setSessionId(null);
    setIsSessionActive(false);
    setMessages([]);
    setHasDocument(false);
    setError(null);
    
    try {
      await aiChatService.endSession(currentSessionId);
      console.log('Chat session ended:', currentSessionId);
      
      // Call the callback if provided
      onSessionEnd?.();
    } catch (err) {
      console.error('Failed to end session:', err);
      // Don't show error to user since session is already cleared locally
    }
  }, [sessionId, stopPolling, onSessionEnd]);
  
  // Cleanup on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    return () => {
      isComponentMountedRef.current = false;
      
      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      // End session if active (fire and forget)
      if (sessionId) {
        aiChatService.endSession(sessionId).catch(console.error);
      }
    };
  }, [sessionId]);
  
  return {
    // Session state
    sessionId,
    isSessionActive,
    isLoading,
    error,
    
    // Messages
    messages,
    isSendingMessage,
    
    // Actions
    startSession,
    sendMessage,
    endSession,
    clearError,
    
    // Polling status
    isPolling,
    hasDocument,
  };
};