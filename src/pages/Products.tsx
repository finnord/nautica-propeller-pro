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
import { ProductType } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table-view';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { SearchFilterCard } from '@/components/ui/search-filter-card';
import { StatusFilterButtons } from '@/components/ui/status-filter-buttons';
import { ActionButtonGroup, ActionButton } from '@/components/ui/action-button-group';
import { EmptyStateCard } from '@/components/ui/empty-state-card';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

// Product type mapping for database values
const getProductType = (materialType?: string): ProductType => {
  // Simple mapping - can be enhanced based on actual data
  if (materialType?.toLowerCase().includes('impeller') || materialType?.toLowerCase().includes('girante')) {
    return 'impeller';
  }
  if (materialType?.toLowerCase().includes('bushing') || materialType?.toLowerCase().includes('bussola')) {
    return 'bushing';
  }
  if (materialType?.toLowerCase().includes('kit')) {
    return 'kit';
  }
  return 'impeller'; // Default to impeller for propellers
};

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
  const { products, loading, error } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const typeOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'impeller', label: 'Giranti' },
    { value: 'bushing', label: 'Bussole' },
    { value: 'kit', label: 'Kit' }
  ];

  const filteredProducts = products.filter(product => {
    const productType = getProductType(product.material_type);
    const matchesSearch = product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesType = selectedType === 'all' || productType === selectedType;
    
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
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card-interactive animate-fade-in">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex gap-2 mt-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const productType = getProductType(product.material_type);
              return (
                <Card key={product.id} className="card-interactive animate-fade-in">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{product.model}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={getProductTypeColor(productType)}
                          >
                            {getProductTypeLabel(productType)}
                          </Badge>
                          <span className="text-sm font-mono text-muted-foreground">
                            {product.id.slice(0, 8)}...
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
                        <p className="font-semibold">€{(product.base_cost || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Diametro</p>
                        <p className="font-semibold">{product.diameter ? `${product.diameter}mm` : 'N/D'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Passo</p>
                        <p className="font-semibold">{product.pitch ? `${product.pitch}mm` : 'N/D'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pale</p>
                        <p className="font-semibold">{product.blades || 'N/D'}</p>
                      </div>
                    </div>

                    {product.material_type && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Materiale</p>
                        <p className="font-mono">{product.material_type}</p>
                      </div>
                    )}

                    {product.description && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Descrizione</p>
                        <p className="text-xs leading-relaxed">{product.description}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <ActionButtonGroup
                        actions={[
                          {
                            icon: Eye,
                            label: 'Dettagli',
                            onClick: () => navigate(`/products/${product.id}`),
                            variant: 'outline'
                          },
                          {
                            icon: Edit,
                            label: 'Modifica',
                            onClick: () => navigate(`/products/${product.id}/edit`),
                            variant: 'outline'
                          }
                        ]}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-elevated animate-fade-in">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Codice</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Diametro</TableHead>
                    <TableHead className="text-right">Passo</TableHead>
                    <TableHead>Pale</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const productType = getProductType(product.material_type);
                    return (
                      <TableRow key={product.id} className="animate-fade-in">
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.model}</div>
                            {product.description && (
                              <div className="text-sm text-muted-foreground">
                                {product.description.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getProductTypeColor(productType)}>
                            {getProductTypeLabel(productType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {product.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          €{(product.base_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.diameter ? `${product.diameter}mm` : 'N/D'}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.pitch ? `${product.pitch}mm` : 'N/D'}
                        </TableCell>
                        <TableCell>
                          {product.blades || 'N/D'}
                        </TableCell>
                        <TableCell className="text-right">
                          <ActionButtonGroup
                            actions={[
                              {
                                icon: Eye,
                                label: 'Dettagli',
                                onClick: () => navigate(`/products/${product.id}`),
                                variant: 'outline'
                              },
                              {
                                icon: Edit,
                                label: 'Modifica',
                                onClick: () => navigate(`/products/${product.id}/edit`),
                                variant: 'outline'
                              }
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
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