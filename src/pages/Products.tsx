import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  Ship, 
  Eye,
  Edit,
  ExternalLink
} from 'lucide-react';
import { Product, ProductType } from '@/types';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ProductType | 'all'>('all');

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.internal_code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesType = selectedType === 'all' || product.product_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-heading">Gestione Prodotti</h1>
            <p className="text-body">Giranti, bussole, kit e prodotti generici</p>
          </div>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Prodotto
          </Button>
        </div>

        {/* Filters */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Filtri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome, codice prodotto o codice interno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-business"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('all')}
                >
                  Tutti
                </Button>
                <Button
                  variant={selectedType === 'impeller' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('impeller')}
                >
                  Giranti
                </Button>
                <Button
                  variant={selectedType === 'bushing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('bushing')}
                >
                  Bussole
                </Button>
                <Button
                  variant={selectedType === 'kit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType('kit')}
                >
                  Kit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
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
                    <p className="text-muted-foreground">Costo Base</p>
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
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Dettagli
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Modifica
                    </Button>
                  </div>
                  {product.drawing_link_url && (
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <Card className="card-elevated">
            <CardContent className="text-center py-12">
              <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun prodotto trovato</h3>
              <p className="text-muted-foreground mb-4">
                Prova a modificare i filtri di ricerca o aggiungi un nuovo prodotto.
              </p>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Prodotto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}