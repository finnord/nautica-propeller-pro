import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { CalendarDays, Euro, TrendingUp, Users, Plus, BarChart3 } from 'lucide-react';
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
      name: string;
    };
  };
  unit_price: number;
  margin_percent: number | null;
  margin_euro: number | null;
  pricing_method: string;
  min_quantity: number;
}

interface ProductPriceListsTabProps {
  productId: string;
}

export const ProductPriceListsTab = ({ productId }: ProductPriceListsTabProps) => {
  const [priceListItems, setPriceListItems] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPriceListItems();
  }, [productId]);

  const fetchPriceListItems = async () => {
    try {
      const { data, error } = await supabase
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
              name
            )
          )
        `)
        .eq('propeller_id', productId);

      if (error) throw error;
      setPriceListItems(data || []);
    } catch (error) {
      console.error('Error fetching price list items:', error);
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

  const averagePrice = priceListItems.reduce((sum, item) => sum + item.unit_price, 0) / priceListItems.length;
  const priceRange = {
    min: Math.min(...priceListItems.map(item => item.unit_price)),
    max: Math.max(...priceListItems.map(item => item.unit_price))
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Listini attivi</p>
                <p className="text-2xl font-bold">{priceListItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Prezzo medio</p>
                <p className="text-2xl font-bold">€{averagePrice.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Range prezzi</p>
                <p className="text-xl font-bold">€{priceRange.min.toFixed(2)} - €{priceRange.max.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <Button variant="outline" size="sm" className="w-full">
                Confronta prezzi
              </Button>
            </div>
          </CardContent>
        </Card>
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