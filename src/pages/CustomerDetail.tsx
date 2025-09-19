import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Edit,
  ExternalLink,
  User,
  Phone,
  Mail,
  Globe,
  Building,
  EuroIcon,
  FileText
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';

const parseContacts = (contacts: any) => {
  if (!contacts) return [];
  if (typeof contacts === 'string') {
    try {
      return JSON.parse(contacts);
    } catch {
      return [];
    }
  }
  return Array.isArray(contacts) ? contacts : [];
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, loading, getCustomer } = useCustomers();

  const customer = getCustomer(id!);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-32" />
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

  const contacts = parseContacts(customer.contacts);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/customers')}
              className="hover-scale"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-heading">{customer.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Cliente</Badge>
                {customer.vat_number && (
                  <span className="text-sm font-mono text-muted-foreground">
                    P.IVA: {customer.vat_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/customers/${id}/edit`)}
              className="hover-scale"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifica
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/customers/${id}/price-lists`)}
              className="hover-scale"
            >
              <EuroIcon className="h-4 w-4 mr-2" />
              Listini
            </Button>
          </div>
        </div>

        {/* Customer Info */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Informazioni Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Azienda</p>
                  <p className="font-semibold">{customer.name}</p>
                </div>
                {customer.vat_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Partita IVA</p>
                    <p className="font-mono">{customer.vat_number}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {customer.website && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sito Web</p>
                    <a 
                      href={customer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline story-link"
                    >
                      <Globe className="h-4 w-4" />
                      {customer.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {customer.annual_revenue_eur && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fatturato Annuo</p>
                    <p className="text-xl font-bold text-primary">
                      €{customer.annual_revenue_eur.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contatti</p>
                  <p className="font-semibold">
                    {contacts.length} contatto{contacts.length !== 1 ? 'i' : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente dal</p>
                  <p className="font-semibold">
                    {new Date(customer.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Note</p>
                <p className="text-sm leading-relaxed">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="contacts" className="animate-scale-in">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contacts">Contatti</TabsTrigger>
            <TabsTrigger value="pricing">Listini</TabsTrigger>
            <TabsTrigger value="rfq">RFQ</TabsTrigger>
            <TabsTrigger value="documents">Documenti</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Contatti</CardTitle>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <div className="grid gap-4">
                    {contacts.map((contact: any, index: number) => (
                      <div key={index} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="font-semibold">{contact.name}</p>
                            {contact.role && (
                              <p className="text-sm text-muted-foreground">{contact.role}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4" />
                                <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4" />
                                <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                                  {contact.phone}
                                </a>
                              </div>
                            )}
                          </div>
                          {contact.department && (
                            <div>
                              <p className="text-sm text-muted-foreground">Dipartimento</p>
                              <p className="text-sm font-medium">{contact.department}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nessun contatto registrato</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing">
            <Card className="card-elevated">
              <CardContent className="text-center py-12">
                <EuroIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Listini Prezzi</h3>
                <p className="text-muted-foreground mb-4">
                  Gestisci i listini prezzi per questo cliente.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/customers/${id}/price-lists`)}
                >
                  Gestisci Listini
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rfq">
            <Card className="card-elevated">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">RFQ Cliente</h3>
                <p className="text-muted-foreground mb-4">
                  Visualizza tutte le richieste di offerta per questo cliente.
                </p>
                <Button variant="outline">
                  Visualizza RFQ
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="card-elevated">
              <CardContent className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Documenti</h3>
                <p className="text-muted-foreground mb-4">
                  Gestisci i documenti e allegati del cliente.
                </p>
                <Button variant="outline">
                  Gestisci Documenti
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}