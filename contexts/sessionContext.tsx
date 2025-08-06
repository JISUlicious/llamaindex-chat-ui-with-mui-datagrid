"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SessionContextType {
  sessionId: string | null;
  loading: boolean;
  removeSessionId: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        let currentSessionId = localStorage.getItem('session_id');

        // if (!currentSessionId) {
        //   console.log("No session ID found. Generating a new one.");
        currentSessionId = crypto.randomUUID();
        localStorage.setItem('session_id', currentSessionId);
        // }

        setSessionId(currentSessionId);
      } catch (error) {
        console.error("Failed to access localStorage or generate session ID:", error);
      } finally {
        setLoading(false);
      }
    }
  }, []); 

  const removeSessionId = () => {
    try {
      localStorage.removeItem('session_id');
      setSessionId(null);
    } catch (error) {
      console.error("Failed to remove session ID from localStorage:", error);
    }
  };  
  const value = { sessionId, loading, removeSessionId };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}