import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/page-header';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { TableView } from '@/components/ui/table-view';
import { Skeleton } from '@/components/ui/skeleton';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useImpellers } from '@/hooks/useImpellers';
import { ProductType } from '@/types';

// Helper functions for product type handling
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
  const { impellers, loading, error } = useImpellers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filter impellers based on search term and selected type
  const filteredImpellers = impellers.filter(impeller => {
    const matchesSearch = 
      impeller.impeller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      impeller.internal_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      impeller.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    
    const matchesType = selectedType === 'all' || impeller.product_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'v',
      ctrlKey: true,
      description: 'Cambia vista (card/tabella)',
      action: () => setViewMode(viewMode === 'cards' ? 'table' : 'cards'),
    },
    {
      key: 'f',
      ctrlKey: true,
      description: 'Focalizza ricerca',
      action: () => document.getElementById('search-input')?.focus(),
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'Nuova girante',
      action: () => navigate('/impellers/new'),
    },
    {
      key: 'r',
      ctrlKey: true,
      description: 'Reset filtri',
      action: () => {
        setSearchTerm('');
        setSelectedType('all');
      },
    },
  ]);

  return (
    <AppLayout>
      <PageHeader
        title="Giranti"
        description="Gestisci il catalogo giranti con ricerca dimensionale e filtri avanzati"
        action={
          <Button onClick={() => navigate('/impellers/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuova Girante
          </Button>
        }
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="search-input"
                placeholder="Cerca giranti per nome, codice interno o note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ProductType | 'all')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Tipi</SelectItem>
                <SelectItem value="impeller">Giranti</SelectItem>
                <SelectItem value="bushing">Bussole</SelectItem>
                <SelectItem value="kit">Kit</SelectItem>
              </SelectContent>
            </Select>
            <ViewModeToggle 
              viewMode={viewMode} 
              onViewModeChange={setViewMode}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredImpellers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-semibold mb-2">Nessuna girante trovata</h3>
              <p className="text-muted-foreground mb-4">
                Non ci sono giranti che corrispondono ai criteri di ricerca.
              </p>
              <Button onClick={() => navigate('/impellers/new')} className="gap-2">
                <Plus className="w-4 h-4" />
                Crea Prima Girante
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredImpellers.map((impeller) => (
              <Card 
                key={impeller.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/impellers/${impeller.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{impeller.impeller_name}</CardTitle>
                    <Badge 
                      variant="outline" 
                      className={getProductTypeColor(impeller.product_type)}
                    >
                      {getProductTypeLabel(impeller.product_type)}
                    </Badge>
                  </div>
                  <CardDescription>
                    {impeller.internal_code || 'Codice non specificato'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Ø Esterno:</span>
                        <div className="font-medium">{impeller.outer_diameter_mm ? `${impeller.outer_diameter_mm}mm` : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Altezza:</span>
                        <div className="font-medium">{impeller.height_mm ? `${impeller.height_mm}mm` : 'N/A'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Alette:</span>
                        <div className="font-medium">{impeller.blade_count || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <div className="font-medium">{impeller.rubber_volume_cm3}cm³</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Mescola:</span>
                        <div className="font-medium text-xs">{(impeller.rubber_compound as any)?.compound_code || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stato:</span>
                        <div className="font-medium capitalize">{impeller.status}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <TableView
            columns={[
              { header: 'Nome', accessor: 'impeller_name' },
              { header: 'Codice', accessor: 'internal_code' },
              { header: 'Ø Esterno (mm)', accessor: 'outer_diameter_mm' },
              { header: 'Altezza (mm)', accessor: 'height_mm' },
              { header: 'Alette', accessor: 'blade_count' },
              { header: 'Volume (cm³)', accessor: 'rubber_volume_cm3' },
              { header: 'Stato', accessor: 'status', render: (value) => <span className="capitalize">{value}</span> },
            ]}
            data={filteredImpellers}
            onRowClick={(impeller) => navigate(`/impellers/${impeller.id}`)}
          />
        )}
      </div>
    </AppLayout>
  );
}