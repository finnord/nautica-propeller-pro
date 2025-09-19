import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShortcutAction } from '@/types/shortcuts';
import { useSidebar } from '@/contexts/SidebarContext';

export const useKeyboardShortcuts = () => {
  const [shortcuts, setShortcuts] = useState<ShortcutAction[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [isSequenceMode, setIsSequenceMode] = useState(false);
  const [sequenceBuffer, setSequenceBuffer] = useState('');
  const navigate = useNavigate();
  const { toggleCollapsed } = useSidebar();

  const registerShortcut = useCallback((shortcut: ShortcutAction) => {
    setShortcuts(prev => {
      const filtered = prev.filter(s => s.key !== shortcut.key);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  const toggleHelp = useCallback(() => {
    setShowHelp(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    const key = event.key.toLowerCase();
    const ctrlKey = event.ctrlKey;
    const altKey = event.altKey;
    const shiftKey = event.shiftKey;

    // Handle help toggle
    if (key === '?' && !ctrlKey && !altKey && !shiftKey) {
      event.preventDefault();
      toggleHelp();
      return;
    }

    // Handle sidebar toggle (B key)
    if (key === 'b' && !ctrlKey && !altKey && !shiftKey) {
      event.preventDefault();
      toggleCollapsed();
      return;
    }

    // Handle escape - close help or clear sequence
    if (key === 'escape') {
      event.preventDefault();
      if (showHelp) {
        setShowHelp(false);
      } else if (isSequenceMode) {
        setIsSequenceMode(false);
        setSequenceBuffer('');
      }
      return;
    }

    // Handle 'g' key to start navigation sequence
    if (key === 'g' && !ctrlKey && !altKey && !shiftKey && !isSequenceMode) {
      event.preventDefault();
      setIsSequenceMode(true);
      setSequenceBuffer('g');
      setTimeout(() => {
        setIsSequenceMode(false);
        setSequenceBuffer('');
      }, 2000); // Reset after 2 seconds
      return;
    }

    // Handle navigation sequences
    if (isSequenceMode && sequenceBuffer === 'g') {
      event.preventDefault();
      setIsSequenceMode(false);
      setSequenceBuffer('');
      
      switch (key) {
        case 'd':
          navigate('/');
          break;
        case 'p':
          navigate('/products');
          break;
        case 'c':
          navigate('/customers');
          break;
        case 'e':
          navigate('/equivalences');
          break;
        case 'r':
          navigate('/rfq');
          break;
        case 's':
          navigate('/search');
          break;
      }
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatches = shortcut.key.toLowerCase() === key;
      const ctrlMatches = !!shortcut.ctrlKey === ctrlKey;
      const altMatches = !!shortcut.altKey === altKey;
      const shiftMatches = !!shortcut.shiftKey === shiftKey;
      
      return keyMatches && ctrlMatches && altMatches && shiftMatches;
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts, showHelp, isSequenceMode, sequenceBuffer, navigate, toggleHelp, toggleCollapsed]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
    registerShortcut,
    unregisterShortcut,
    showHelp,
    toggleHelp,
    isSequenceMode,
    sequenceBuffer
  };
};