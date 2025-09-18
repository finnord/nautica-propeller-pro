import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Users, 
  Eye,
  Edit,
  FileText,
  Globe
} from 'lucide-react';
import { Customer } from '@/types';

// Mock data for demonstration
const mockCustomers: Customer[] = [
  {
    customer_id: 'C-001',
    name: 'Marina di Capri S.r.l.',
    contacts: JSON.stringify([
      { name: 'Marco Rossi', email: 'marco@marinadicapri.it', phone: '+39 081 123456' },
      { name: 'Laura Bianchi', email: 'laura@marinadicapri.it', phone: '+39 081 123457' }
    ]),
    website: 'https://marinadicapri.it',
    vat_number: 'IT12345678901',
    annual_revenue_eur: 2500000,
    notes: 'Cliente principale per pompe marine di lusso',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:22:00Z'
  },
  {
    customer_id: 'C-002',
    name: 'Cantieri Navali Mediterraneo',
    contacts: JSON.stringify([
      { name: 'Giuseppe Verdi', email: 'g.verdi@cantierimediterraneo.com', phone: '+39 010 987654' }
    ]),
    website: 'https://cantierimediterraneo.com',
    vat_number: 'IT98765432109',
    annual_revenue_eur: 5000000,
    notes: 'Specializzati in yacht di media dimensione',
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-18T11:45:00Z'
  }
];

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.vat_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-heading">Gestione Clienti</h1>
            <p className="text-body">Anagrafica clienti e gestione listini prezzi</p>
          </div>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Ricerca Clienti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, codice cliente o partita IVA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-business"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.customer_id} className="card-interactive">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{customer.customer_id}</Badge>
                      {customer.vat_number && (
                        <span className="text-sm font-mono text-muted-foreground">
                          {customer.vat_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fatturato Annuo</p>
                    <p className="font-semibold">
                      {customer.annual_revenue_eur ? 
                        `€${(customer.annual_revenue_eur / 1000000).toFixed(1)}M` : 
                        'N/D'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Contatti</p>
                    <p className="font-semibold">
                      {JSON.parse(customer.contacts).length} contatto{JSON.parse(customer.contacts).length !== 1 ? 'i' : ''}
                    </p>
                  </div>
                </div>

                {customer.website && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Sito Web</p>
                    <a 
                      href={customer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      {customer.website.replace('https://', '')}
                    </a>
                  </div>
                )}

                {customer.notes && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Note</p>
                    <p className="text-xs leading-relaxed">{customer.notes}</p>
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
                  <Button size="sm" variant="ghost">
                    <FileText className="h-3 w-3 mr-1" />
                    Listini
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card className="card-elevated">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun cliente trovato</h3>
              <p className="text-muted-foreground mb-4">
                Prova a modificare i criteri di ricerca o aggiungi un nuovo cliente.
              </p>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}