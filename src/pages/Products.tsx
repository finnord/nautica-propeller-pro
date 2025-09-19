import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useKeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Ship, 
  Eye,
  Edit,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Product, ProductType } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table-view';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { SearchFilterCard } from '@/components/ui/search-filter-card';
import { StatusFilterButtons } from '@/components/ui/status-filter-buttons';
import { ActionButtonGroup, ActionButton } from '@/components/ui/action-button-group';
import { EmptyStateCard } from '@/components/ui/empty-state-card';

// Mock data for demonstration
const mockProducts: Product[] = [
  {
    product_id: 'G-2847',
    product_type: 'impeller',
    name: 'Girante Standard 85mm',
    internal_code: 'GS-085-NBR',
    uom: 'pcs',
    base_cost: 45.80,
    gross_margin_pct: 35,
    base_list_price: 70.46,
    drawing_link_url: 'https://drawings.company.com/G-2847.pdf',
    notes: 'Girante standard per pompe centrifughe marine',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:22:00Z'
  },
  {
    product_id: 'B-1523',
    product_type: 'bushing',
    name: 'Bussola Ottone 12mm',
    internal_code: 'BO-012',
    uom: 'pcs',
    base_cost: 8.50,
    gross_margin_pct: 40,
    base_list_price: 14.17,
    notes: 'Bussola in ottone per alberi 12mm',
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-18T11:45:00Z'
  },
  {
    product_id: 'K-0934',
    product_type: 'kit',
    name: 'Kit Completo Pompa 75mm',
    internal_code: 'KC-075',
    uom: 'set',
    base_cost: 125.30,
    gross_margin_pct: 30,
    base_list_price: 179.00,
    notes: 'Kit completo con girante, bussola e guarnizioni',
    created_at: '2024-01-08T16:20:00Z',
    updated_at: '2024-01-22T08:30:00Z'
  }
];

const getProductTypeColor = (type: ProductType) => {
  switch (type) {
    case 'impeller':
      return 'bg-primary text-primary-foreground';
    case 'bushing':
      return 'bg-accent text-accent-foreground';
    case 'kit':
      return 'bg-steel text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getProductTypeLabel = (type: ProductType) => {
  switch (type) {
    case 'impeller':
      return 'Girante';
    case 'bushing':
      return 'Bussola';
    case 'kit':
      return 'Kit';
    default:
      return 'Generico';
  }
};

export default function Products() {
  const navigate = useNavigate();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const typeOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'impeller', label: 'Giranti' },
    { value: 'bushing', label: 'Bussole' },
    { value: 'kit', label: 'Kit' }
  ];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.internal_code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesType = selectedType === 'all' || product.product_type === selectedType;
    
    return matchesSearch && matchesType;
  });

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
        description: 'Nuovo prodotto',
        action: () => navigate('/products/new'),
        category: 'actions' as const
      },
      {
        key: 'escape',
        description: 'Reset filtri',
        action: () => {
          setSearchTerm('');
          setSelectedType('all');
        },
        category: 'search' as const
      }
    ];

    shortcuts.forEach(registerShortcut);

    return () => {
      shortcuts.forEach(shortcut => unregisterShortcut(shortcut.key));
    };
  }, [registerShortcut, unregisterShortcut, navigate]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Gestione Prodotti"
          description="Giranti, bussole, kit e prodotti generici"
          actions={
            <div className="flex gap-2">
              <ViewModeToggle 
                viewMode={viewMode} 
                onViewModeChange={setViewMode} 
              />
              <ActionButtonGroup
                actions={[{
                  icon: Plus,
                  label: 'Nuovo Prodotto',
                  onClick: () => navigate('/products/new'),
                  variant: 'default'
                }]}
              />
            </div>
          }
        />

        <SearchFilterCard
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Cerca per nome, codice prodotto o codice interno..."
        >
          <StatusFilterButtons
            selectedStatus={selectedType}
            onStatusChange={(status) => setSelectedType(status as ProductType | 'all')}
            options={typeOptions}
          />
        </SearchFilterCard>

        {/* Products Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.product_id} className="card-interactive">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={getProductTypeColor(product.product_type)}
                        >
                          {getProductTypeLabel(product.product_type)}
                        </Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          {product.product_id}
                        </span>
                      </div>
                    </div>
                    <Ship className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Costo Industriale</p>
                      <p className="font-semibold">€{product.base_cost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prezzo Lista</p>
                      <p className="font-semibold">€{product.base_list_price?.toFixed(2) || 'N/D'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margine</p>
                      <p className="font-semibold">{product.gross_margin_pct}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">UdM</p>
                      <p className="font-semibold uppercase">{product.uom}</p>
                    </div>
                  </div>

                  {product.internal_code && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Codice Interno</p>
                      <p className="font-mono">{product.internal_code}</p>
                    </div>
                  )}

                  {product.notes && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Note</p>
                      <p className="text-xs leading-relaxed">{product.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <ActionButtonGroup
                      actions={[
                        {
                          icon: Eye,
                          label: 'Dettagli',
                          onClick: () => navigate(`/products/${product.product_id}`),
                          variant: 'outline'
                        },
                        {
                          icon: Edit,
                          label: 'Modifica',
                          onClick: () => navigate(`/products/${product.product_id}/edit`),
                          variant: 'outline'
                        },
                        ...(product.drawing_link_url ? [{
                          icon: ExternalLink,
                          label: '',
                          onClick: () => window.open(product.drawing_link_url, '_blank'),
                          variant: 'ghost' as const
                        }] : [])
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
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Codice</TableHead>
                    <TableHead className="text-right">Costo Industriale</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-right">Margine</TableHead>
                    <TableHead>UdM</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.internal_code && (
                            <div className="text-sm text-muted-foreground font-mono">
                              {product.internal_code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getProductTypeColor(product.product_type)}>
                          {getProductTypeLabel(product.product_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.product_id}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{product.base_cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{product.base_list_price?.toFixed(2) || 'N/D'}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.gross_margin_pct}%
                      </TableCell>
                      <TableCell className="uppercase">
                        {product.uom}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionButtonGroup
                          actions={[
                            {
                              icon: Eye,
                              label: 'Dettagli',
                              onClick: () => navigate(`/products/${product.product_id}`),
                              variant: 'outline'
                            },
                            {
                              icon: Edit,
                              label: 'Modifica',
                              onClick: () => navigate(`/products/${product.product_id}/edit`),
                              variant: 'outline'
                            },
                            ...(product.drawing_link_url ? [{
                              icon: ExternalLink,
                              label: '',
                              onClick: () => window.open(product.drawing_link_url, '_blank'),
                              variant: 'ghost' as const
                            }] : [])
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

        {filteredProducts.length === 0 && (
          <EmptyStateCard
            icon={Ship}
            title="Nessun prodotto trovato"
            description="Prova a modificare i filtri di ricerca o aggiungi un nuovo prodotto."
            actionButton={{
              label: "Aggiungi Prodotto",
              onClick: () => navigate('/products/new'),
              icon: Plus
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}