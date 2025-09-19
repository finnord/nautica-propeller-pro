export interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'view' | 'search' | 'actions';
}

export interface ShortcutCategory {
  name: string;
  shortcuts: ShortcutAction[];
}

export interface KeyboardShortcutsContext {
  shortcuts: ShortcutAction[];
  registerShortcut: (shortcut: ShortcutAction) => void;
  unregisterShortcut: (key: string) => void;
  showHelp: boolean;
  toggleHelp: () => void;
}