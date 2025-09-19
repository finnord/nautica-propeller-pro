import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useKeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { SearchFilterCard } from '@/components/ui/search-filter-card';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { EmptyStateCard } from '@/components/ui/empty-state-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table-view';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, GitCompare, History, Map, AlertCircle } from 'lucide-react';
import { useCrossMappings } from '@/hooks/useCrossMappings';

const formatNotes = (notes: string[]) => notes.filter(Boolean).join(' • ');

export default function Equivalences() {
  const navigate = useNavigate();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'oem' | 'supersession' | 'applications'>('oem');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { isLoading, error, oemInterchanges, supersessions, applicationGuides } = useCrossMappings();

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const filteredOem = useMemo(() => {
    return oemInterchanges.filter(entry => {
      if (!normalizedQuery) return true;
      return (
        entry.cefCode.toLowerCase().includes(normalizedQuery) ||
        entry.manufacturers.some(manufacturer =>
          manufacturer.name.toLowerCase().includes(normalizedQuery) ||
          manufacturer.codes.some(code => code.toLowerCase().includes(normalizedQuery)) ||
          manufacturer.notes.some(note => note.toLowerCase().includes(normalizedQuery))
        )
      );
    });
  }, [normalizedQuery, oemInterchanges]);

  const filteredSupersessions = useMemo(() => {
    return supersessions.filter(entry => {
      if (!normalizedQuery) return true;
      return (
        entry.cefCode.toLowerCase().includes(normalizedQuery) ||
        entry.chain.some(item =>
          item.code.toLowerCase().includes(normalizedQuery) ||
          (item.note?.toLowerCase().includes(normalizedQuery) ?? false)
        )
      );
    });
  }, [normalizedQuery, supersessions]);

  const filteredApplications = useMemo(() => {
    return applicationGuides.filter(entry => {
      if (!normalizedQuery) return true;
      return (
        entry.cefCode.toLowerCase().includes(normalizedQuery) ||
        entry.applications.some(app =>
          app.model.toLowerCase().includes(normalizedQuery) ||
          app.referenceCode.toLowerCase().includes(normalizedQuery) ||
          (app.note?.toLowerCase().includes(normalizedQuery) ?? false)
        )
      );
    });
  }, [normalizedQuery, applicationGuides]);

  useEffect(() => {
    const shortcuts = [
      {
        key: 'tab',
        description: 'Cambia visualizzazione (cards/table)',
        action: () => setViewMode(prev => (prev === 'cards' ? 'table' : 'cards')),
        category: 'view' as const,
      },
      {
        key: '1',
        description: 'Vai a OEM cross reference',
        action: () => setSelectedTab('oem'),
        category: 'view' as const,
      },
      {
        key: '2',
        description: 'Vai a Supersession',
        action: () => setSelectedTab('supersession'),
        category: 'view' as const,
      },
      {
        key: '3',
        description: 'Vai a Application guide',
        action: () => setSelectedTab('applications'),
        category: 'view' as const,
      },
      {
        key: 'k',
        ctrlKey: true,
        description: 'Focus ricerca',
        action: () => searchInputRef.current?.focus(),
        category: 'search' as const,
      },
      {
        key: 'n',
        ctrlKey: true,
        description: 'Nuova equivalenza',
        action: () => navigate('/equivalences/new'),
        category: 'actions' as const,
      },
      {
        key: 'escape',
        description: 'Reset filtri',
        action: () => setSearchTerm(''),
        category: 'search' as const,
      },
    ];

    shortcuts.forEach(registerShortcut);

    return () => {
      shortcuts.forEach(shortcut => unregisterShortcut(shortcut.key));
    };
  }, [navigate, registerShortcut, unregisterShortcut]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestione Equivalenze"
          description="Cross mapping OEM, supersession e applicazioni motore"
          actions={
            <div className="flex gap-2">
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              <Button className="gap-2" onClick={() => navigate('/equivalences/new')}>
                <Plus className="h-4 w-4" />
                Nuova equivalenza
              </Button>
            </div>
          }
        />

        <SearchFilterCard
          ref={searchInputRef}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Cerca per codice CEF, OEM o applicazione..."
        />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Caricamento delle equivalenze...</p>
            </div>
          </div>
        ) : (
          <Tabs value={selectedTab} onValueChange={value => setSelectedTab(value as typeof selectedTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="oem" className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                OEM cross reference
              </TabsTrigger>
              <TabsTrigger value="supersession" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Supersession
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Application guide
              </TabsTrigger>
            </TabsList>

            <TabsContent value="oem" className="space-y-4">
              {filteredOem.length === 0 ? (
                <EmptyStateCard
                  icon={GitCompare}
                  title="Nessuna equivalenza OEM"
                  description="Non sono disponibili cross reference per i criteri selezionati"
                  actions={[{
                    icon: Plus,
                    label: 'Aggiungi equivalenza',
                    onClick: () => navigate('/equivalences/new'),
                    variant: 'default',
                  }]}
                />
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredOem.map(entry => (
                    <Card key={entry.cefCode} className="card-interactive">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Codice CEF</p>
                            <p className="font-mono text-lg font-semibold">{entry.cefCode}</p>
                          </div>
                          <Badge variant="secondary">OEM interscambio</Badge>
                        </div>

                        <div className="space-y-3">
                          {entry.manufacturers.map(manufacturer => (
                            <div key={`${entry.cefCode}-${manufacturer.name}`} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">{manufacturer.name}</p>
                                <Badge variant="outline">{manufacturer.codes.length} codici</Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {manufacturer.codes.map(code => (
                                  <Badge key={code} variant="outline" className="font-mono">
                                    {code}
                                  </Badge>
                                ))}
                              </div>
                              {manufacturer.notes.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatNotes(manufacturer.notes)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <ActionButtonGroup
                            actions={[{
                              icon: GitCompare,
                              label: 'Apri prodotto',
                              onClick: () => {
                                if (entry.propellerId) {
                                  navigate(`/products/${entry.propellerId}`);
                                } else {
                                  navigate(`/search?query=${encodeURIComponent(entry.cefCode)}`);
                                }
                              },
                              variant: 'outline',
                            }]}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-elevated">
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codice CEF</TableHead>
                          <TableHead>OEM</TableHead>
                          <TableHead>Codici equivalenti</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOem.flatMap(entry =>
                          entry.manufacturers.map(manufacturer => (
                            <TableRow key={`${entry.cefCode}-${manufacturer.name}`}>
                              <TableCell className="font-mono">{entry.cefCode}</TableCell>
                              <TableCell>{manufacturer.name}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  {manufacturer.codes.map(code => (
                                    <Badge key={code} variant="outline" className="font-mono">
                                      {code}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatNotes(manufacturer.notes) || '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="supersession" className="space-y-4">
              {filteredSupersessions.length === 0 ? (
                <EmptyStateCard
                  icon={History}
                  title="Nessuna supersession disponibile"
                  description="Non sono presenti catene di supersessione per i criteri selezionati"
                />
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredSupersessions.map(entry => (
                    <Card key={entry.cefCode} className="card-interactive">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Codice CEF origine</p>
                            <p className="font-mono text-lg font-semibold">{entry.cefCode}</p>
                          </div>
                          <Badge variant="secondary">Supersession</Badge>
                        </div>

                        <div className="space-y-2">
                          {entry.chain.map((item, index) => (
                            <div key={`${entry.cefCode}-${item.code}-${index}`} className="flex items-start gap-3">
                              <Badge variant="outline" className="font-mono">
                                {item.code}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {item.note || 'Codice successivo nella catena'}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <ActionButtonGroup
                            actions={[{
                              icon: History,
                              label: 'Dettaglio prodotto',
                              onClick: () => {
                                if (entry.propellerId) {
                                  navigate(`/products/${entry.propellerId}`);
                                } else {
                                  navigate(`/search?query=${encodeURIComponent(entry.cefCode)}`);
                                }
                              },
                              variant: 'outline',
                            }]}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-elevated">
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codice CEF</TableHead>
                          <TableHead>Sequenza supersession</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSupersessions.map(entry => (
                          <TableRow key={entry.cefCode}>
                            <TableCell className="font-mono align-top">{entry.cefCode}</TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                {entry.chain.map((item, index) => (
                                  <div key={`${entry.cefCode}-${item.code}-${index}`} className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono">
                                      {item.code}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {item.note || 'Successivo'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground align-top">
                              {entry.chain.some(item => item.note) ?
                                entry.chain.map(item => item.note).filter(Boolean).join(' • ') :
                                '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="applications" className="space-y-4">
              {filteredApplications.length === 0 ? (
                <EmptyStateCard
                  icon={Map}
                  title="Nessuna applicazione trovata"
                  description="Non risultano applicazioni motore/modello per i filtri impostati"
                />
              ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredApplications.map(entry => (
                    <Card key={entry.cefCode} className="card-interactive">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Codice CEF</p>
                            <p className="font-mono text-lg font-semibold">{entry.cefCode}</p>
                          </div>
                          <Badge variant="secondary">Application guide</Badge>
                        </div>

                        <div className="space-y-3">
                          {entry.applications.map((app, index) => (
                            <div key={`${entry.cefCode}-${app.referenceCode}-${index}`} className="border rounded-lg p-3">
                              <p className="font-semibold text-sm">{app.model}</p>
                              <p className="text-xs text-muted-foreground">Codice OEM: {app.referenceCode}</p>
                              {app.note && (
                                <p className="text-xs text-muted-foreground mt-1">{app.note}</p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <ActionButtonGroup
                            actions={[{
                              icon: Map,
                              label: 'Apri prodotto',
                              onClick: () => {
                                if (entry.propellerId) {
                                  navigate(`/products/${entry.propellerId}`);
                                } else {
                                  navigate(`/search?query=${encodeURIComponent(entry.cefCode)}`);
                                }
                              },
                              variant: 'outline',
                            }]}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="card-elevated">
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codice CEF</TableHead>
                          <TableHead>Applicazione motore/modello</TableHead>
                          <TableHead>OEM</TableHead>
                          <TableHead>Note</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.flatMap(entry =>
                          entry.applications.map((app, index) => (
                            <TableRow key={`${entry.cefCode}-${app.referenceCode}-${index}`}>
                              <TableCell className="font-mono">{entry.cefCode}</TableCell>
                              <TableCell>{app.model}</TableCell>
                              <TableCell>{app.referenceCode}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{app.note || '—'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
