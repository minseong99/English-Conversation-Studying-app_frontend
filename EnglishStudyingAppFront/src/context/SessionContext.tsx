// src/context/SessionContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Context 생성
const SessionContext = createContext<{ sessionId: string; setSessionId: (id: string) => void } | undefined>(undefined);

// Provider 컴포넌트
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessionId, setSessionId] = useState(`session-${Date.now()}`); // 동적 생성

  return (
    <SessionContext.Provider value={{ sessionId, setSessionId }}>
      {children}
    </SessionContext.Provider>
  );
};

// Custom Hook (다른 컴포넌트에서 사용)
export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};
