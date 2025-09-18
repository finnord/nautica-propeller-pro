import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  FileText, 
  Eye,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle
} from 'lucide-react';
import type { RFQ as RFQType, RFQStatus } from '@/types';

// Mock data for demonstration
const mockRFQs: RFQType[] = [
  {
    rfq_id: 'RFQ-2024-001',
    customer_id: 'C-001',
    rfq_date: '2024-01-20',
    status: 'open',
    notes: 'Richiesta urgente per sostituzione giranti pompe principali',
    created_at: '2024-01-20T09:30:00Z',
    updated_at: '2024-01-20T09:30:00Z'
  },
  {
    rfq_id: 'RFQ-2024-002',
    customer_id: 'C-002',
    rfq_date: '2024-01-18',
    status: 'quoted',
    notes: 'Kit completo per manutenzione yacht 45m',
    created_at: '2024-01-18T14:15:00Z',
    updated_at: '2024-01-19T10:22:00Z'
  },
  {
    rfq_id: 'RFQ-2024-003',
    customer_id: 'C-001',
    rfq_date: '2024-01-15',
    status: 'won',
    notes: 'Ordine confermato per 15 giranti standard',
    created_at: '2024-01-15T11:45:00Z',
    updated_at: '2024-01-21T16:30:00Z'
  }
];

const getStatusColor = (status: RFQStatus) => {
  switch (status) {
    case 'open':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'quoted':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'won':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'lost':
      return 'bg-red-500/10 text-red-700 border-red-200';
    case 'on_hold':
      return 'bg-gray-500/10 text-gray-700 border-gray-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusLabel = (status: RFQStatus) => {
  switch (status) {
    case 'open':
      return 'Aperto';
    case 'quoted':
      return 'Quotato';
    case 'won':
      return 'Vinto';
    case 'lost':
      return 'Perso';
    case 'on_hold':
      return 'In Sospeso';
    default:
      return status;
  }
};

const getStatusIcon = (status: RFQStatus) => {
  switch (status) {
    case 'open':
      return Clock;
    case 'quoted':
      return FileText;
    case 'won':
      return CheckCircle;
    case 'lost':
      return XCircle;
    case 'on_hold':
      return PauseCircle;
    default:
      return FileText;
  }
};

export default function RFQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RFQStatus | 'all'>('all');

  const filteredRFQs = mockRFQs.filter(rfq => {
    const matchesSearch = rfq.rfq_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rfq.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = selectedStatus === 'all' || rfq.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-heading">Gestione RFQ</h1>
            <p className="text-body">Richieste di quotazione e gestione offerte</p>
          </div>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuova RFQ
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
                    placeholder="Cerca per numero RFQ, cliente o note..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 input-business"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('all')}
                >
                  Tutti
                </Button>
                <Button
                  variant={selectedStatus === 'open' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('open')}
                >
                  Aperti
                </Button>
                <Button
                  variant={selectedStatus === 'quoted' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('quoted')}
                >
                  Quotati
                </Button>
                <Button
                  variant={selectedStatus === 'won' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('won')}
                >
                  Vinti
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RFQ Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRFQs.map((rfq) => {
            const StatusIcon = getStatusIcon(rfq.status);
            return (
              <Card key={rfq.rfq_id} className="card-interactive">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{rfq.rfq_id}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(rfq.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusLabel(rfq.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {rfq.customer_id}
                        </span>
                      </div>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data RFQ</p>
                      <p className="font-semibold">
                        {new Date(rfq.rfq_date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ultimo Aggiornamento</p>
                      <p className="font-semibold">
                        {new Date(rfq.updated_at).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>

                  {rfq.notes && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Note</p>
                      <p className="text-xs leading-relaxed">{rfq.notes}</p>
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
                    {rfq.status === 'open' && (
                      <Button size="sm" className="btn-primary">
                        Quota
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredRFQs.length === 0 && (
          <Card className="card-elevated">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessuna RFQ trovata</h3>
              <p className="text-muted-foreground mb-4">
                Prova a modificare i filtri di ricerca o crea una nuova RFQ.
              </p>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nuova RFQ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}