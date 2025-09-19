import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MetricCard } from '@/components/ui/metric-card';
import { AppLayout } from '@/components/layout/AppLayout';

import { 
  Search, 
  Plus, 
  Users, 
  Euro, 
  BarChart3, 
  Calendar,
  GitCompare,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { downloadPriceListTemplate } from '@/lib/excel-utils';
import { NewPriceListDialog } from '@/components/dialogs/NewPriceListDialog';
import { PriceListImportDialog } from '@/components/dialogs/PriceListImportDialog';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface PriceList {
  id: string;
  list_name: string;
  valid_from: string;
  valid_to: string | null;
  currency: string;
  customer: {
    id: string;
    name: string;
  };
  items_count: number;
  avg_price: number;
}

interface Customer {
  id: string;
  name: string;
}

export const PriceListManagement = () => {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch price lists with aggregated data
      const { data: priceListsData, error: priceListsError } = await supabase
        .from('price_lists')
        .select(`
          id,
          list_name,
          valid_from,
          valid_to,
          currency,
          customer:customers (
            id,
            name
          )
        `);

      if (priceListsError) throw priceListsError;

      // Fetch price list items count and average prices
      const priceListsWithStats = await Promise.all(
        (priceListsData || []).map(async (priceList) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('price_list_items')
            .select('unit_price')
            .eq('price_list_id', priceList.id);

          if (itemsError) {
            console.error('Error fetching items for price list:', itemsError);
            return {
              ...priceList,
              items_count: 0,
              avg_price: 0
            };
          }

          const items = itemsData || [];
          const avgPrice = items.length > 0 
            ? items.reduce((sum, item) => sum + item.unit_price, 0) / items.length 
            : 0;

          return {
            ...priceList,
            items_count: items.length,
            avg_price: avgPrice
          };
        })
      );

      setPriceLists(priceListsWithStats);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (customersError) throw customersError;
      setCustomers(customersData || []);

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

  const filteredPriceLists = priceLists.filter(priceList => {
    const matchesSearch = priceList.list_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         priceList.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCustomer = selectedCustomer === 'all' || priceList.customer.id === selectedCustomer;
    
    const validity = getValidityStatus(priceList.valid_to);
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'valid' && validity.status === 'valid') ||
                         (selectedStatus === 'expired' && validity.status === 'expired') ||
                         (selectedStatus === 'expiring' && validity.status === 'expiring') ||
                         (selectedStatus === 'unlimited' && validity.status === 'unlimited');
    
    return matchesSearch && matchesCustomer && matchesStatus;
  });

  const stats = {
    totalPriceLists: priceLists.length,
    activePriceLists: priceLists.filter(pl => getValidityStatus(pl.valid_to).status !== 'expired').length,
    totalItems: priceLists.reduce((sum, pl) => sum + pl.items_count, 0),
    avgListPrice: priceLists.length > 0 ? priceLists.reduce((sum, pl) => sum + pl.avg_price, 0) / priceLists.length : 0
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Caricamento listini...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-heading">Gestione Listini Prezzi</h1>
            <p className="text-body">Gestisci e confronta i listini prezzi dei clienti</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={downloadPriceListTemplate}
            >
              <Download className="h-4 w-4" />
              Esporta template
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4" />
              Importa Excel
            </Button>
            <Button 
              className="gap-2"
              onClick={() => setShowNewDialog(true)}
            >
              <Plus className="h-4 w-4" />
              Nuovo listino
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Listini totali"
            value={stats.totalPriceLists}
            description={`${stats.activePriceLists} attivi`}
            icon={<BarChart3 className="h-4 w-4" />}
            trend={{
              value: Math.round((stats.activePriceLists / Math.max(stats.totalPriceLists, 1)) * 100),
              label: "attivi",
              direction: stats.activePriceLists === stats.totalPriceLists ? 'up' : 'down'
            }}
          />

          <MetricCard
            title="Prodotti listati"
            value={stats.totalItems}
            description="Totale voci prezzi"
            icon={<Euro className="h-4 w-4" />}
          />

          <MetricCard
            title="Prezzo medio listini"
            value={`€${stats.avgListPrice.toFixed(2)}`}
            description="Media ponderata"
            icon={<BarChart3 className="h-4 w-4" />}
          />

          <MetricCard
            title="Clienti attivi"
            value={customers.length}
            description="Con listini validi"
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        {/* Filters */}
        <Card className="card-interactive">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome listino o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtra per cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i clienti</SelectItem>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="valid">Validi</SelectItem>
                  <SelectItem value="expiring">In scadenza</SelectItem>
                  <SelectItem value="expired">Scaduti</SelectItem>
                  <SelectItem value="unlimited">Illimitati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Price Lists Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Listini prezzi ({filteredPriceLists.length})</span>
              <Button variant="outline" className="gap-2">
                <GitCompare className="h-4 w-4" />
                Confronta selezionati
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Nome listino</TableHead>
                  <TableHead>Prodotti</TableHead>
                  <TableHead>Prezzo medio</TableHead>
                  <TableHead>Valuta</TableHead>
                  <TableHead>Validità</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPriceLists.map((priceList) => {
                  const validity = getValidityStatus(priceList.valid_to);
                  return (
                    <TableRow key={priceList.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {priceList.customer.name}
                      </TableCell>
                      <TableCell>{priceList.list_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {priceList.items_count} prodotti
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          €{priceList.avg_price.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>{priceList.currency}</TableCell>
                      <TableCell className="text-sm">
                        <div>Dal: {format(new Date(priceList.valid_from), 'dd/MM/yyyy', { locale: it })}</div>
                        {priceList.valid_to && (
                          <div>Al: {format(new Date(priceList.valid_to), 'dd/MM/yyyy', { locale: it })}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={validity.variant}>
                          {validity.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            Modifica
                          </Button>
                          <Button variant="ghost" size="sm">
                            Duplica
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <NewPriceListDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
          customers={customers}
          onSuccess={fetchData}
        />

        <PriceListImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onSuccess={fetchData}
        />
      </div>
    </AppLayout>
  );
};