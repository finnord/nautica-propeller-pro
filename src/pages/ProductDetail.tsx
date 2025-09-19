import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Edit,
  ExternalLink,
  Ship,
  Package,
  FileText,
  ArrowLeftRight
} from 'lucide-react';
import { Product, ProductType } from '@/types';
import { ProductPriceListsTab } from '@/components/product/ProductPriceListsTab';
import { ProductRFQTab } from '@/components/product/ProductRFQTab';

// Mock product data (in real app, this would come from Supabase)
const mockProduct: Product = {
  product_id: 'G-2847',
  product_type: 'impeller',
  name: 'Girante Standard 85mm',
  internal_code: 'GS-085-NBR',
  uom: 'pcs',
  base_cost: 45.80,
  gross_margin_pct: 35,
  base_list_price: 70.46,
  drawing_link_url: 'https://drawings.company.com/G-2847.pdf',
  notes: 'Girante standard per pompe centrifughe marine. Realizzata in mescola NBR con rinforzi in fibra per maggiore durata.',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-20T14:22:00Z'
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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // In a real app, you'd fetch the product based on the ID
  const product = mockProduct;

  if (!product) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Prodotto non trovato</h1>
          <Button onClick={() => navigate('/products')}>
            Torna ai Prodotti
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-heading">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getProductTypeColor(product.product_type)}>
                  {getProductTypeLabel(product.product_type)}
                </Badge>
                <span className="text-sm font-mono text-muted-foreground">
                  {product.product_id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/products/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
            {product.drawing_link_url && (
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Disegno
              </Button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informazioni Generali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Codice Interno</p>
                  <p className="font-mono">{product.internal_code || 'N/D'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unità di Misura</p>
                  <p className="uppercase font-semibold">{product.uom}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Costo Base</p>
                  <p className="text-xl font-bold">€{product.base_cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margine Lordo</p>
                  <p className="text-lg font-semibold">{product.gross_margin_pct}%</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prezzo Lista Base</p>
                  <p className="text-xl font-bold text-primary">€{product.base_list_price?.toFixed(2) || 'N/D'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margine Euro</p>
                  <p className="text-lg font-semibold">
                    €{product.base_list_price ? (product.base_list_price - product.base_cost).toFixed(2) : 'N/D'}
                  </p>
                </div>
              </div>
            </div>

            {product.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Note</p>
                <p className="text-sm leading-relaxed">{product.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="materials">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="materials">Materiali</TabsTrigger>
            <TabsTrigger value="pricing">Listini</TabsTrigger>
            <TabsTrigger value="equivalences">Equivalenze</TabsTrigger>
            <TabsTrigger value="rfq">RFQ</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            {product.product_type === 'impeller' ? (
              <>
                {/* Impeller Materials */}
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Mescola Gomma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Codice Mescola</p>
                          <p className="font-mono font-semibold">NBR-85</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Polimero Base</p>
                          <p>NBR (Nitrile Butadiene Rubber)</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Densità</p>
                          <p>1.35 g/cm³</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Volume Gomma</p>
                          <p className="font-semibold">45.2 cm³</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Massa Calcolata</p>
                          <p className="font-semibold">61.02 g</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Costo Materiale (indicativo)</p>
                          <p className="font-semibold">€0.43</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="text-lg">Bussola</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Codice Bussola</p>
                          <p className="font-mono font-semibold">BO-012</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Materiale</p>
                          <p>Ottone CW617N</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Profilo Albero</p>
                          <p>D-shaft 12mm</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Costo Indicativo</p>
                          <p className="font-semibold text-muted-foreground">€2.15 (non utilizzato nel pricing)</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Disegno</p>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Visualizza
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-elevated">
                <CardContent className="text-center py-12">
                  <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Dettagli materiali</h3>
                  <p className="text-muted-foreground">
                    I dettagli dei materiali sono disponibili solo per le giranti.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pricing">
            <ProductPriceListsTab productId={product.product_id} />
          </TabsContent>

          <TabsContent value="equivalences">
            <Card className="card-elevated">
              <CardContent className="text-center py-12">
                <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Equivalenze</h3>
                <p className="text-muted-foreground mb-4">
                  Gestisci le equivalenze per sostituzioni di questo prodotto.
                </p>
                <Button variant="outline">
                  Gestisci Equivalenze
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rfq">
            <ProductRFQTab productId={product.product_id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}