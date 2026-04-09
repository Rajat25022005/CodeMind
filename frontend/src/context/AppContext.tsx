import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppState {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  driftOpen: boolean;
  setDriftOpen: (open: boolean) => void;
  toggleDrift: () => void;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('auth_mid');
  const [driftOpen, setDriftOpen] = useState(false);

  const toggleDrift = () => setDriftOpen((prev) => !prev);

  return (
    <AppContext.Provider
      value={{ selectedNodeId, setSelectedNodeId, driftOpen, setDriftOpen, toggleDrift }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppState => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
