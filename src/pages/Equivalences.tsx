import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useKeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  ArrowLeftRight, 
  Eye,
  Edit,
  Ship,
  Circle
} from 'lucide-react';
import { EquivalentImpeller, EquivalentBushing, MatchType } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { SearchFilterCard } from '@/components/ui/search-filter-card';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { EmptyStateCard } from '@/components/ui/empty-state-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table-view';

// Mock data for demonstration
const mockImpellerEquivalences: EquivalentImpeller[] = [
  {
    source_product_id: 'G-2847',
    target_product_id: 'G-2901',
    match_type: 'dimensional',
    dimension_tolerance_mm: 1.0,
    material_note: 'Compatibile EPDM/NBR',
    bushing_note: 'Stesso profilo albero',
    shaft_profile_note: 'D-shaft 12mm',
    general_note: 'Sostituzione diretta per applicazioni marine standard'
  },
  {
    source_product_id: 'G-1234',
    target_product_id: 'G-5678',
    match_type: 'full',
    dimension_tolerance_mm: 0.1,
    general_note: 'Equivalenza completa, stesso codice di ricambio'
  }
];

const mockBushingEquivalences: EquivalentBushing[] = [
  {
    source_bushing_code: 'BO-012',
    target_bushing_code: 'BP-012',
    match_type: 'form-fit',
    shaft_profile_compatible: 'yes',
    material_note: 'Ottone vs Plastica - prestazioni simili',
    general_note: 'Alternativa economica per applicazioni meno critiche'
  }
];

const getMatchTypeColor = (type: MatchType) => {
  switch (type) {
    case 'full':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'dimensional':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'form-fit':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'partial':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getMatchTypeLabel = (type: MatchType) => {
  switch (type) {
    case 'full':
      return 'Completa';
    case 'dimensional':
      return 'Dimensionale';
    case 'form-fit':
      return 'Forma/Funzione';
    case 'partial':
      return 'Parziale';
    default:
      return type;
  }
};

export default function Equivalences() {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('impellers');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredImpellerEquivalences = mockImpellerEquivalences.filter(eq =>
    eq.source_product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.target_product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.general_note?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const filteredBushingEquivalences = mockBushingEquivalences.filter(eq =>
    eq.source_bushing_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.target_bushing_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.general_note?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  // Register keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        key: 'tab',
        description: 'Cambia visualizzazione (cards/table)',
        action: () => setViewMode(prev => prev === 'cards' ? 'table' : 'cards'),
        category: 'view' as const
      },
      {
        key: '1',
        description: 'Vai a tab Giranti',
        action: () => setSelectedTab('impellers'),
        category: 'view' as const
      },
      {
        key: '2',
        description: 'Vai a tab Bussole',
        action: () => setSelectedTab('bushings'),
        category: 'view' as const
      },
      {
        key: 'k',
        ctrlKey: true,
        description: 'Focus ricerca',
        action: () => {
          const searchInput = document.querySelector('input[placeholder*="ricerca"]') as HTMLInputElement;
          searchInput?.focus();
        },
        category: 'search' as const
      },
      {
        key: 'n',
        ctrlKey: true,
        description: 'Nuova equivalenza',
        action: () => window.location.href = '/equivalences/new',
        category: 'actions' as const
      },
      {
        key: 'escape',
        description: 'Reset filtri',
        action: () => {
          setSearchTerm('');
        },
        category: 'search' as const
      }
    ];

    shortcuts.forEach(registerShortcut);

    return () => {
      shortcuts.forEach(shortcut => unregisterShortcut(shortcut.key));
    };
  }, [registerShortcut, unregisterShortcut]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestione Equivalenze"
          description="Equivalenze tra giranti e bussole per sostituzioni"
          actions={
            <div className="flex gap-2">
              <ViewModeToggle 
                viewMode={viewMode} 
                onViewModeChange={setViewMode} 
              />
              <ActionButtonGroup
                actions={[{
                  icon: Plus,
                  label: 'Nuova Equivalenza',
                  onClick: () => window.location.href = '/equivalences/new',
                  variant: 'default'
                }]}
              />
            </div>
          }
        />

        <SearchFilterCard
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Cerca per codice prodotto, bussola o note..."
        />

        {/* Equivalences Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="impellers" className="flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Giranti
            </TabsTrigger>
            <TabsTrigger value="bushings" className="flex items-center gap-2">
              <Circle className="h-4 w-4" />
              Bussole
            </TabsTrigger>
          </TabsList>

          <TabsContent value="impellers" className="space-y-4">
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredImpellerEquivalences.map((eq, index) => (
                  <Card key={index} className="card-interactive">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Sorgente</p>
                            <p className="font-mono font-semibold">{eq.source_product_id}</p>
                          </div>
                          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Target</p>
                            <p className="font-mono font-semibold">{eq.target_product_id}</p>
                          </div>
                        </div>
                        <Badge className={getMatchTypeColor(eq.match_type)}>
                          {getMatchTypeLabel(eq.match_type)}
                        </Badge>
                      </div>

                      {eq.dimension_tolerance_mm && (
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Tolleranza Dimensionale</p>
                          <p className="text-sm font-semibold">±{eq.dimension_tolerance_mm}mm</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        {eq.material_note && (
                          <div>
                            <p className="text-muted-foreground">Note Materiale</p>
                            <p className="text-xs leading-relaxed">{eq.material_note}</p>
                          </div>
                        )}
                        {eq.bushing_note && (
                          <div>
                            <p className="text-muted-foreground">Note Bussola</p>
                            <p className="text-xs leading-relaxed">{eq.bushing_note}</p>
                          </div>
                        )}
                        {eq.shaft_profile_note && (
                          <div>
                            <p className="text-muted-foreground">Profilo Albero</p>
                            <p className="text-xs leading-relaxed">{eq.shaft_profile_note}</p>
                          </div>
                        )}
                      </div>

                      {eq.general_note && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Note Generali</p>
                          <p className="text-xs leading-relaxed">{eq.general_note}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <ActionButtonGroup
                          actions={[
                            {
                              icon: Eye,
                              label: 'Dettagli',
                              onClick: () => {},
                              variant: 'outline'
                            },
                            {
                              icon: Edit,
                              label: 'Modifica',
                              onClick: () => {},
                              variant: 'outline'
                            }
                          ]}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-elevated">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sorgente</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Tipo Equivalenza</TableHead>
                        <TableHead>Tolleranza</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredImpellerEquivalences.map((eq, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{eq.source_product_id}</TableCell>
                          <TableCell className="font-mono">{eq.target_product_id}</TableCell>
                          <TableCell>
                            <Badge className={getMatchTypeColor(eq.match_type)}>
                              {getMatchTypeLabel(eq.match_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {eq.dimension_tolerance_mm ? `±${eq.dimension_tolerance_mm}mm` : 'N/D'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {eq.general_note || eq.material_note || 'N/D'}
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionButtonGroup
                              actions={[
                                {
                                  icon: Eye,
                                  label: 'Dettagli',
                                  onClick: () => {},
                                  variant: 'outline'
                                },
                                {
                                  icon: Edit,
                                  label: 'Modifica',
                                  onClick: () => {},
                                  variant: 'outline'
                                }
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {filteredImpellerEquivalences.length === 0 && (
              <EmptyStateCard
                icon={Ship}
                title="Nessuna equivalenza trovata"
                description="Prova a modificare i criteri di ricerca o aggiungi una nuova equivalenza."
                actionButton={{
                  label: "Nuova Equivalenza Girante",
                  onClick: () => window.location.href = '/equivalences/new',
                  icon: Plus
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="bushings" className="space-y-4">
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredBushingEquivalences.map((eq, index) => (
                  <Card key={index} className="card-interactive">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Sorgente</p>
                            <p className="font-mono font-semibold">{eq.source_bushing_code}</p>
                          </div>
                          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Target</p>
                            <p className="font-mono font-semibold">{eq.target_bushing_code}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getMatchTypeColor(eq.match_type)}>
                            {getMatchTypeLabel(eq.match_type)}
                          </Badge>
                          <Badge variant={eq.shaft_profile_compatible === 'yes' ? 'default' : 'destructive'}>
                            Profilo: {eq.shaft_profile_compatible === 'yes' ? 'Compatibile' : 
                                     eq.shaft_profile_compatible === 'no' ? 'Non Compatibile' : 'Sconosciuto'}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        {eq.material_note && (
                          <div>
                            <p className="text-muted-foreground">Note Materiale</p>
                            <p className="text-xs leading-relaxed">{eq.material_note}</p>
                          </div>
                        )}
                      </div>

                      {eq.general_note && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Note Generali</p>
                          <p className="text-xs leading-relaxed">{eq.general_note}</p>
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <ActionButtonGroup
                          actions={[
                            {
                              icon: Eye,
                              label: 'Dettagli',
                              onClick: () => {},
                              variant: 'outline'
                            },
                            {
                              icon: Edit,
                              label: 'Modifica',
                              onClick: () => {},
                              variant: 'outline'
                            }
                          ]}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-elevated">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sorgente</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Tipo Equivalenza</TableHead>
                        <TableHead>Compatibilità Profilo</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBushingEquivalences.map((eq, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{eq.source_bushing_code}</TableCell>
                          <TableCell className="font-mono">{eq.target_bushing_code}</TableCell>
                          <TableCell>
                            <Badge className={getMatchTypeColor(eq.match_type)}>
                              {getMatchTypeLabel(eq.match_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={eq.shaft_profile_compatible === 'yes' ? 'default' : 'destructive'}>
                              {eq.shaft_profile_compatible === 'yes' ? 'Compatibile' : 
                               eq.shaft_profile_compatible === 'no' ? 'Non Compatibile' : 'Sconosciuto'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {eq.general_note || eq.material_note || 'N/D'}
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionButtonGroup
                              actions={[
                                {
                                  icon: Eye,
                                  label: 'Dettagli',
                                  onClick: () => {},
                                  variant: 'outline'
                                },
                                {
                                  icon: Edit,
                                  label: 'Modifica',
                                  onClick: () => {},
                                  variant: 'outline'
                                }
                              ]}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {filteredBushingEquivalences.length === 0 && (
              <EmptyStateCard
                icon={Circle}
                title="Nessuna equivalenza trovata"
                description="Prova a modificare i criteri di ricerca o aggiungi una nuova equivalenza."
                actionButton={{
                  label: "Nuova Equivalenza Bussola",
                  onClick: () => window.location.href = '/equivalences/new',
                  icon: Plus
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}