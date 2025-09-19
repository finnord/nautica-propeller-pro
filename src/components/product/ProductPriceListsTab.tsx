import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '@/components/ui/metric-card';

import { CalendarDays, Euro, TrendingUp, Users, Plus, BarChart3, GitCompare, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { PriceComparisonView } from './PriceComparisonView';

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

interface ProductPriceListsTabProps {
  productId: string;
}

export const ProductPriceListsTab = ({ productId }: ProductPriceListsTabProps) => {
  const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
  const [productInfo, setProductInfo] = useState<ProductBasicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  useEffect(() => {
    fetchPriceListItems();
  }, [productId]);

  const fetchPriceListItems = async () => {
    try {
      // Fetch price list items
      const { data: priceData, error: priceError } = await supabase
        .from('price_list_items')
        .select(`
          id,
          unit_price,
          margin_percent,
          margin_euro,
          pricing_method,
          min_quantity,
          price_list:price_lists (
            id,
            list_name,
            valid_from,
            valid_to,
            currency,
            customer:customers (
              id,
              name
            )
          )
        `)
        .eq('propeller_id', productId);

      if (priceError) throw priceError;
      setPriceListItems(priceData || []);

      // Fetch product basic info
      const { data: productData, error: productError } = await supabase
        .from('propellers')
        .select('id, model, material_type, diameter, pitch')
        .eq('id', productId)
        .single();

      if (productError) throw productError;
      setProductInfo(productData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValidityStatus = (validTo: string | null) => {
    if (!validTo) return { status: 'unlimited', label: 'Illimitato', variant: 'secondary' as const };
    
    const today = new Date();
    const expiryDate = new Date(validTo);
    
    if (expiryDate < today) {
      return { status: 'expired', label: 'Scaduto', variant: 'destructive' as const };
    } else if (expiryDate <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
      return { status: 'expiring', label: 'In scadenza', variant: 'default' as const };
    } else {
      return { status: 'valid', label: 'Valido', variant: 'secondary' as const };
    }
  };

  const getPricingMethodLabel = (method: string) => {
    switch (method) {
      case 'margin_percent': return 'Margine %';
      case 'margin_euro': return 'Margine €';
      case 'target_price': return 'Prezzo Target';
      default: return method;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  if (priceListItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Euro className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nessun listino trovato</h3>
        <p className="text-muted-foreground mb-4">
          Questo prodotto non è presente in nessun listino prezzi
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi a listino
        </Button>
      </div>
    );
  }

  const validPriceListItems = priceListItems.filter(item => {
    const validity = getValidityStatus(item.price_list.valid_to);
    return validity.status !== 'expired';
  });

  const averagePrice = validPriceListItems.length > 0 
    ? validPriceListItems.reduce((sum, item) => sum + item.unit_price, 0) / validPriceListItems.length 
    : 0;
  
  const priceRange = validPriceListItems.length > 0 ? {
    min: Math.min(...validPriceListItems.map(item => item.unit_price)),
    max: Math.max(...validPriceListItems.map(item => item.unit_price))
  } : { min: 0, max: 0 };

  const priceVariation = validPriceListItems.length > 0 && averagePrice > 0
    ? ((priceRange.max - priceRange.min) / averagePrice) * 100
    : 0;

  const uniqueCustomers = [...new Set(priceListItems.map(item => item.price_list.customer.id))];

  const getComparisonAnalysis = () => {
    if (validPriceListItems.length === 0) return null;
    
    const sortedPrices = validPriceListItems.map(item => item.unit_price).sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    return {
      median,
      standardDeviation: Math.sqrt(
        validPriceListItems.reduce((sum, item) => 
          sum + Math.pow(item.unit_price - averagePrice, 2), 0
        ) / validPriceListItems.length
      ),
      competitivePosition: averagePrice > median ? 'above' : averagePrice < median ? 'below' : 'at',
    };
  };

  const analysis = getComparisonAnalysis();

  return (
    <div className="space-y-6">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Listini attivi"
          value={validPriceListItems.length}
          description={`${priceListItems.length - validPriceListItems.length} scaduti`}
          icon={<Users className="h-4 w-4" />}
          trend={validPriceListItems.length > 0 ? {
            value: Math.round((validPriceListItems.length / Math.max(priceListItems.length, 1)) * 100),
            label: "attivi",
            direction: validPriceListItems.length === priceListItems.length ? 'up' : 'down'
          } : undefined}
        />

        <MetricCard
          title="Prezzo medio"
          value={`€${averagePrice.toFixed(2)}`}
          description={analysis ? `Mediana: €${analysis.median.toFixed(2)}` : 'Nessun dato'}
          icon={<Euro className="h-4 w-4" />}
          trend={analysis ? {
            value: Math.round(((averagePrice - analysis.median) / analysis.median) * 100),
            label: analysis.competitivePosition === 'above' ? 'sopra mediana' : 
                   analysis.competitivePosition === 'below' ? 'sotto mediana' : 'in linea',
            direction: analysis.competitivePosition === 'above' ? 'up' : 
                      analysis.competitivePosition === 'below' ? 'down' : 'neutral'
          } : undefined}
        />

        <MetricCard
          title="Variazione prezzi"
          value={`${priceVariation.toFixed(1)}%`}
          description={priceVariation > 20 ? 'Alta variabilità' : priceVariation > 10 ? 'Media variabilità' : 'Bassa variabilità'}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            value: Math.round(priceVariation),
            label: "variazione",
            direction: priceVariation > 15 ? 'up' : priceVariation < 5 ? 'down' : 'neutral'
          }}
        />

        <MetricCard
          title="Clienti attivi"
          value={uniqueCustomers.length}
          description="Con listini validi"
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Confronta listini
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confronto prezzi listini</DialogTitle>
            </DialogHeader>
            <PriceComparisonView priceListItems={validPriceListItems} productInfo={productInfo} />
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Aggiungi a listino
        </Button>

        <Button variant="outline" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Analisi prezzi
        </Button>
      </div>

      {/* Price Lists Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Listini prezzi attivi</span>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo listino
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Listino</TableHead>
                <TableHead>Prezzo</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead>Margine</TableHead>
                <TableHead>Qta Min</TableHead>
                <TableHead>Validità</TableHead>
                <TableHead>Stato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceListItems.map((item) => {
                const validity = getValidityStatus(item.price_list.valid_to);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.price_list.customer.name}
                    </TableCell>
                    <TableCell>{item.price_list.list_name}</TableCell>
                    <TableCell>
                      <span className="font-mono">
                        €{item.unit_price.toFixed(2)} {item.price_list.currency}
                      </span>
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
                    <TableCell>
                      <div className="text-sm">
                        <div>Dal: {format(new Date(item.price_list.valid_from), 'dd/MM/yyyy', { locale: it })}</div>
                        {item.price_list.valid_to && (
                          <div>Al: {format(new Date(item.price_list.valid_to), 'dd/MM/yyyy', { locale: it })}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={validity.variant}>
                        {validity.label}
                      </Badge>
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