import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Plus,
  EuroIcon,
  FileText,
  Calendar,
  Download,
  Edit
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';

export default function CustomerPriceLists() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCustomer, loading } = useCustomers();

  const customer = getCustomer(id!);

  // Mock price lists data (in real app, this would come from Supabase)
  const mockPriceLists = [
    {
      id: '1',
      list_name: 'Listino Standard 2024',
      currency: 'EUR',
      valid_from: '2024-01-01',
      valid_to: '2024-12-31',
      items_count: 45,
      status: 'active'
    },
    {
      id: '2',
      list_name: 'Listino Speciale Q1',
      currency: 'EUR',
      valid_from: '2024-01-01',
      valid_to: '2024-03-31',
      items_count: 12,
      status: 'expired'
    }
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <div className="text-center py-12 animate-fade-in">
          <h1 className="text-2xl font-bold mb-4">Cliente non trovato</h1>
          <Button onClick={() => navigate('/customers')}>
            Torna ai Clienti
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/customers/${id}`)}
              className="hover-scale"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-heading">Listini Prezzi</h1>
              <p className="text-body">Gestisci i listini per {customer.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              className="btn-primary hover-scale"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Listino
            </Button>
          </div>
        </div>

        {/* Customer Info Card */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <EuroIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{customer.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {mockPriceLists.length} listino{mockPriceLists.length !== 1 ? 'i' : ''}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/customers/${id}`)}
                className="hover-scale"
              >
                Vedi Cliente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Price Lists */}
        <div className="grid gap-4">
          {mockPriceLists.length > 0 ? (
            mockPriceLists.map((priceList) => (
              <Card key={priceList.id} className="card-interactive">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{priceList.list_name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(priceList.valid_from).toLocaleDateString('it-IT')} - 
                            {new Date(priceList.valid_to).toLocaleDateString('it-IT')}
                          </div>
                          <span>•</span>
                          <span>{priceList.items_count} articoli</span>
                          <span>•</span>
                          <span>{priceList.currency}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={priceList.status === 'active' ? 'default' : 'secondary'}
                        className={priceList.status === 'active' ? 'status-active' : 'status-inactive'}
                      >
                        {priceList.status === 'active' ? 'Attivo' : 'Scaduto'}
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="hover-scale">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover-scale">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="card-elevated">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessun listino prezzi</h3>
                <p className="text-muted-foreground mb-6">
                  Non ci sono ancora listini prezzi per questo cliente.
                </p>
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Primo Listino
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}