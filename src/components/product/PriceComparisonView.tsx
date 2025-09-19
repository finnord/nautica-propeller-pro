import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PriceListItem {
  id: string;
  price_list: {
    id: string;
    list_name: string;
    valid_from: string;
    valid_to: string | null;
    currency: string;
    customer: {
      id: string;
      name: string;
    };
  };
  unit_price: number;
  margin_percent: number | null;
  margin_euro: number | null;
  pricing_method: string;
  min_quantity: number;
}

interface ProductBasicInfo {
  id: string;
  model: string;
  material_type: string | null;
  diameter: number | null;
  pitch: number | null;
}

interface PriceComparisonViewProps {
  priceListItems: PriceListItem[];
  productInfo: ProductBasicInfo | null;
}

export const PriceComparisonView = ({ priceListItems, productInfo }: PriceComparisonViewProps) => {
  if (priceListItems.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Nessun listino attivo da confrontare</p>
      </div>
    );
  }

  const averagePrice = priceListItems.reduce((sum, item) => sum + item.unit_price, 0) / priceListItems.length;
  const sortedByPrice = [...priceListItems].sort((a, b) => a.unit_price - b.unit_price);
  
  const getPositionIndicator = (price: number) => {
    const deviation = ((price - averagePrice) / averagePrice) * 100;
    if (Math.abs(deviation) < 5) return { icon: CheckCircle2, label: 'In linea', variant: 'secondary' as const };
    if (deviation > 0) return { icon: TrendingUp, label: `+${deviation.toFixed(1)}%`, variant: 'default' as const };
    return { icon: TrendingDown, label: `${deviation.toFixed(1)}%`, variant: 'outline' as const };
  };

  const getPricingMethodLabel = (method: string) => {
    switch (method) {
      case 'margin_percent': return 'Margine %';
      case 'margin_euro': return 'Margine €';
      case 'target_price': return 'Prezzo Target';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Summary */}
      {productInfo && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Prodotto in analisi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Modello:</span>
                <p className="font-medium">{productInfo.model}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Materiale:</span>
                <p className="font-medium">{productInfo.material_type || 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Diametro:</span>
                <p className="font-medium">{productInfo.diameter ? `${productInfo.diameter}mm` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Passo:</span>
                <p className="font-medium">{productInfo.pitch ? `${productInfo.pitch}mm` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Prezzo più basso</p>
              <p className="text-2xl font-bold text-green-600">€{sortedByPrice[0].unit_price.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{sortedByPrice[0].price_list.customer.name}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Prezzo medio</p>
              <p className="text-2xl font-bold">€{averagePrice.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Su {priceListItems.length} listini</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Prezzo più alto</p>
              <p className="text-2xl font-bold text-red-600">€{sortedByPrice[sortedByPrice.length - 1].unit_price.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{sortedByPrice[sortedByPrice.length - 1].price_list.customer.name}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>Confronto dettagliato prezzi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Listino</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Posizione</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead>Margine</TableHead>
                <TableHead>Qta Min</TableHead>
                <TableHead>Validità</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedByPrice.map((item, index) => {
                const position = getPositionIndicator(item.unit_price);
                const PositionIcon = position.icon;
                
                return (
                  <TableRow key={item.id} className={index === 0 ? 'bg-green-50 dark:bg-green-950/20' : 
                                                     index === sortedByPrice.length - 1 ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell className="font-medium">
                      {item.price_list.customer.name}
                    </TableCell>
                    <TableCell>{item.price_list.list_name}</TableCell>
                    <TableCell>
                      <span className="font-mono font-semibold">
                        €{item.unit_price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PositionIcon className="h-4 w-4" />
                        <Badge variant={position.variant}>
                          {position.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getPricingMethodLabel(item.pricing_method)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.margin_percent && `${item.margin_percent}%`}
                      {item.margin_euro && `€${item.margin_euro}`}
                    </TableCell>
                    <TableCell>{item.min_quantity}</TableCell>
                    <TableCell className="text-sm">
                      <div>Dal: {format(new Date(item.price_list.valid_from), 'dd/MM/yy', { locale: it })}</div>
                      {item.price_list.valid_to && (
                        <div>Al: {format(new Date(item.price_list.valid_to), 'dd/MM/yy', { locale: it })}</div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};