import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShortcutAction } from '@/types/shortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: ShortcutAction[];
  isSequenceMode?: boolean;
  sequenceBuffer?: string;
}

const KeyDisplay = ({ keys }: { keys: string[] }) => (
  <div className="flex gap-1">
    {keys.map((key, index) => (
      <Badge key={index} variant="outline" className="font-mono text-xs px-2 py-1">
        {key}
      </Badge>
    ))}
  </div>
);

const formatShortcutKeys = (shortcut: ShortcutAction): string[] => {
  const keys: string[] = [];
  if (shortcut.ctrlKey) keys.push('Ctrl');
  if (shortcut.altKey) keys.push('Alt');
  if (shortcut.shiftKey) keys.push('Shift');
  keys.push(shortcut.key.toUpperCase());
  return keys;
};

export const KeyboardShortcutsHelp = ({ 
  open, 
  onOpenChange, 
  shortcuts,
  isSequenceMode,
  sequenceBuffer 
}: KeyboardShortcutsHelpProps) => {
  const globalShortcuts = [
    { key: '?', description: 'Mostra/nascondi questa guida', category: 'navigation' as const },
    { key: 'Esc', description: 'Chiudi guida o annulla sequenza', category: 'navigation' as const },
    { key: 'G → D', description: 'Vai a Dashboard', category: 'navigation' as const },
    { key: 'G → P', description: 'Vai a Prodotti', category: 'navigation' as const },
    { key: 'G → C', description: 'Vai a Clienti', category: 'navigation' as const },
    { key: 'G → E', description: 'Vai a Equivalenze', category: 'navigation' as const },
    { key: 'G → R', description: 'Vai a RFQ', category: 'navigation' as const },
    { key: 'G → S', description: 'Vai a Ricerca', category: 'navigation' as const },
  ];

  const categories = {
    navigation: 'Navigazione',
    view: 'Visualizzazione', 
    search: 'Ricerca',
    actions: 'Azioni'
  };

  const shortcutsByCategory = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) acc[shortcut.category] = [];
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutAction[]>);

  return (
    <>
      {/* Sequence Mode Indicator */}
      {isSequenceMode && (
        <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sequenza:</span>
            <Badge variant="secondary" className="font-mono">
              {sequenceBuffer}
            </Badge>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scorciatoie da Tastiera</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Global Navigation */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                {categories.navigation}
              </h3>
              <div className="space-y-2">
                {globalShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm">{shortcut.description}</span>
                    <KeyDisplay keys={shortcut.key.split(' → ')} />
                  </div>
                ))}
              </div>
            </div>

            {/* Page-specific shortcuts */}
            {Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <Separator className="my-4" />
                <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                  {categories[category as keyof typeof categories]}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-1">
                      <span className="text-sm">{shortcut.description}</span>
                      <KeyDisplay keys={formatShortcutKeys(shortcut)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {shortcuts.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nessuna scorciatoia specifica disponibile in questa pagina
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
            <p>💡 Suggerimento: Premi <Badge variant="outline" className="mx-1">G</Badge> seguito da una lettera per navigare rapidamente</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};