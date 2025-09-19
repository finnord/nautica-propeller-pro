import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { NewCustomerDialog } from '@/components/dialogs/NewCustomerDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Customers() {
  const navigate = useNavigate();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  
  // Debug: Log when the dialog state changes
  useEffect(() => {
    console.log('showNewCustomerDialog state changed to:', showNewCustomerDialog);
  }, [showNewCustomerDialog]);

  // Load customers from database
  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Cast the data to match our Customer type
      const customers = (data || []).map(customer => ({
        ...customer,
        contacts: typeof customer.contacts === 'string' ? customer.contacts : JSON.stringify(customer.contacts)
      })) as Customer[];
      
      setCustomers(customers);
    } catch (error) {
      console.error('Errore nel caricamento clienti:', error);
      toast({
        title: 'Errore',
        description: 'Errore nel caricamento dei clienti',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        action: () => setShowNewCustomerDialog(true),
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
                onClick: () => {
                  console.log('Nuovo Cliente button clicked!');
                  console.log('Current showNewCustomerDialog state:', showNewCustomerDialog);
                  setShowNewCustomerDialog(true);
                  console.log('setShowNewCustomerDialog(true) called');
                },
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
        {isLoading ? (
          <div className="text-center py-8">
            <p>Caricamento clienti...</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="card-interactive">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{customer.name}</h3>
                        <div className="flex items-center gap-2">
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
                        {(() => {
                          if (!customer.contacts) return '0 contatti';
                          const contacts = typeof customer.contacts === 'string' ? JSON.parse(customer.contacts) : customer.contacts;
                          const count = Array.isArray(contacts) ? contacts.length : 0;
                          return `${count} contatto${count !== 1 ? 'i' : ''}`;
                        })()}
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
                          onClick: () => navigate(`/customers/${customer.id}`),
                          variant: 'outline'
                        },
                        {
                          icon: Edit,
                          label: 'Modifica',
                          onClick: () => navigate(`/customers/${customer.id}/edit`),
                          variant: 'outline'
                        }
                      ]}
                    />
                    <ActionButtonGroup
                      actions={[{
                        icon: FileText,
                        label: 'Listini',
                        onClick: () => navigate(`/customers/${customer.id}/price-lists`),
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
                    <TableRow key={customer.id}>
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
                        <span className="text-sm text-muted-foreground">ID: {customer.id.slice(0, 8)}...</span>
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
                        {(() => {
                          if (!customer.contacts) return '0 contatti';
                          const contacts = typeof customer.contacts === 'string' ? JSON.parse(customer.contacts) : customer.contacts;
                          const count = Array.isArray(contacts) ? contacts.length : 0;
                          return `${count} contatto${count !== 1 ? 'i' : ''}`;
                        })()}
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
                              onClick: () => navigate(`/customers/${customer.id}`),
                              variant: 'outline'
                            },
                            {
                              icon: Edit,
                              label: 'Modifica',
                              onClick: () => navigate(`/customers/${customer.id}/edit`),
                              variant: 'outline'
                            },
                            {
                              icon: FileText,
                              label: 'Listini',
                              onClick: () => navigate(`/customers/${customer.id}/price-lists`),
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
                onClick: () => {
                  console.log('Empty state "Aggiungi Cliente" button clicked!');
                  setShowNewCustomerDialog(true);
                },
                icon: Plus
              }}
          />
        )}
        
        <NewCustomerDialog 
          open={showNewCustomerDialog}
          onOpenChange={(open) => {
            console.log('NewCustomerDialog onOpenChange called with:', open);
            setShowNewCustomerDialog(open);
          }}
          onCustomerCreated={loadCustomers}
        />
      </div>
    </AppLayout>
  );
}