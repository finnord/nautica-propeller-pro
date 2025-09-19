import { createContext, useContext, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';
import { KeyboardShortcutsContext as KeyboardShortcutsContextType } from '@/types/shortcuts';

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
};

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutsProvider = ({ children }: KeyboardShortcutsProviderProps) => {
  const {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    showHelp,
    toggleHelp,
    isSequenceMode,
    sequenceBuffer
  } = useKeyboardShortcuts();

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        showHelp,
        toggleHelp
      }}
    >
      {children}
      <KeyboardShortcutsHelp
        open={showHelp}
        onOpenChange={toggleHelp}
        shortcuts={shortcuts}
        isSequenceMode={isSequenceMode}
        sequenceBuffer={sequenceBuffer}
      />
    </KeyboardShortcutsContext.Provider>
  );
};