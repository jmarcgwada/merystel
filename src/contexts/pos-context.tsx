'use client';
import React, {
  createContext,
  useContext,
} from 'react';
import { DataManagementProvider, type PosContextType as InternalPosContextType } from './data-management-context';

// Export the types for external use
export type PosContextType = InternalPosContextType;

// Create the context
const PosContext = createContext<PosContextType | undefined>(undefined);

// The main provider that wraps the data management logic
export function PosProvider({ children }: { children: React.ReactNode }) {
  const contextValue = useContext(PosContext);
  if (contextValue) {
    return <>{children}</>;
  }
  return (
    <DataManagementProvider>
      {children}
    </DataManagementProvider>
  );
}

// The main hook to access the context
export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}

// Export the context itself for the provider
export { PosContext };
