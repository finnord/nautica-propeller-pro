import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

const isBrowser = typeof window !== 'undefined';

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  // Initialize from localStorage, default to false (expanded)
  const [collapsed, setCollapsedState] = useState(() => {
    if (!isBrowser) {
      return false;
    }

    const saved = window.localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist to localStorage when state changes
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    window.localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
  };

  const toggleCollapsed = () => {
    setCollapsedState(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
};