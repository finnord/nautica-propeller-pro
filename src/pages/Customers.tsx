import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useKeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Users, 
  Eye,
  Edit,
  FileText,
  Globe
} from 'lucide-react';
import { Customer } from '@/types';
import { PageHeader } from '@/components/ui/page-header';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { SearchFilterCard } from '@/components/ui/search-filter-card';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
import { EmptyStateCard } from '@/components/ui/empty-state-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table-view';

// Mock data for demonstration
const mockCustomers: Customer[] = [
  {
    customer_id: 'C-001',
    name: 'Marina di Capri S.r.l.',
    contacts: JSON.stringify([
      { name: 'Marco Rossi', email: 'marco@marinadicapri.it', phone: '+39 081 123456' },
      { name: 'Laura Bianchi', email: 'laura@marinadicapri.it', phone: '+39 081 123457' }
    ]),
    website: 'https://marinadicapri.it',
    vat_number: 'IT12345678901',
    annual_revenue_eur: 2500000,
    notes: 'Cliente principale per pompe marine di lusso',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:22:00Z'
  },
  {
    customer_id: 'C-002',
    name: 'Cantieri Navali Mediterraneo',
    contacts: JSON.stringify([
      { name: 'Giuseppe Verdi', email: 'g.verdi@cantierimediterraneo.com', phone: '+39 010 987654' }
    ]),
    website: 'https://cantierimediterraneo.com',
    vat_number: 'IT98765432109',
    annual_revenue_eur: 5000000,
    notes: 'Specializzati in yacht di media dimensione',
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-18T11:45:00Z'
  }
];

export default function Customers() {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.vat_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
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
        description: 'Nuovo cliente',
        action: () => {}, // TODO: implement new customer
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
          title="Gestione Clienti"
          description="Anagrafica clienti e gestione listini prezzi"
          actions={
            <ActionButtonGroup
              actions={[{
                icon: Plus,
                label: 'Nuovo Cliente',
                onClick: () => {},
                variant: 'default'
              }]}
            />
          }
        />

        <div className="flex justify-between items-center">
          <div></div>
          <ViewModeToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />
        </div>

        <SearchFilterCard
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Cerca per nome, codice cliente o partita IVA..."
        />

        {/* Customers Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.customer_id} className="card-interactive">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{customer.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{customer.customer_id}</Badge>
                        {customer.vat_number && (
                          <span className="text-sm font-mono text-muted-foreground">
                            {customer.vat_number}
                          </span>
                        )}
                      </div>
                    </div>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Fatturato Annuo</p>
                      <p className="font-semibold">
                        {customer.annual_revenue_eur ? 
                          `€${(customer.annual_revenue_eur / 1000000).toFixed(1)}M` : 
                          'N/D'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contatti</p>
                      <p className="font-semibold">
                        {JSON.parse(customer.contacts).length} contatto{JSON.parse(customer.contacts).length !== 1 ? 'i' : ''}
                      </p>
                    </div>
                  </div>

                  {customer.website && (
                    <div className="text-sm mb-4">
                      <p className="text-muted-foreground">Sito Web</p>
                      <a 
                        href={customer.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {customer.website.replace('https://', '')}
                      </a>
                    </div>
                  )}

                  {customer.notes && (
                    <div className="text-sm mb-4">
                      <p className="text-muted-foreground">Note</p>
                      <p className="text-xs leading-relaxed">{customer.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-border">
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
                    <ActionButtonGroup
                      actions={[{
                        icon: FileText,
                        label: 'Listini',
                        onClick: () => {},
                        variant: 'ghost'
                      }]}
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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Codice</TableHead>
                    <TableHead>Partita IVA</TableHead>
                    <TableHead className="text-right">Fatturato</TableHead>
                    <TableHead>Contatti</TableHead>
                    <TableHead>Sito Web</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.customer_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          {customer.notes && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {customer.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.customer_id}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {customer.vat_number || 'N/D'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {customer.annual_revenue_eur ? 
                          `€${(customer.annual_revenue_eur / 1000000).toFixed(1)}M` : 
                          'N/D'
                        }
                      </TableCell>
                      <TableCell>
                        {JSON.parse(customer.contacts).length} contatto{JSON.parse(customer.contacts).length !== 1 ? 'i' : ''}
                      </TableCell>
                      <TableCell>
                        {customer.website ? (
                          <a 
                            href={customer.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Globe className="h-3 w-3" />
                            {customer.website.replace('https://', '')}
                          </a>
                        ) : 'N/D'}
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
                            },
                            {
                              icon: FileText,
                              label: 'Listini',
                              onClick: () => {},
                              variant: 'ghost'
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

        {filteredCustomers.length === 0 && (
          <EmptyStateCard
            icon={Users}
            title="Nessun cliente trovato"
            description="Prova a modificare i criteri di ricerca o aggiungi un nuovo cliente."
            actionButton={{
              label: "Aggiungi Cliente",
              onClick: () => {},
              icon: Plus
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}