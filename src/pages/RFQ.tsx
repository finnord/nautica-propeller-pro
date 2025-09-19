import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { SearchFilterCard } from '@/components/ui/search-filter-card';
import { StatusFilterButtons } from '@/components/ui/status-filter-buttons';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyStateCard } from '@/components/ui/empty-state-card';
import { RFQTableView } from '@/components/ui/rfq-table-view';
import { 
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredRFQs = mockRFQs.filter(rfq => {
    const matchesSearch = rfq.rfq_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rfq.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (rfq.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = selectedStatus === 'all' || rfq.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'open', label: 'Aperti' },
    { value: 'quoted', label: 'Quotati' },
    { value: 'won', label: 'Vinti' },
    { value: 'lost', label: 'Persi' },
    { value: 'on_hold', label: 'In Sospeso' }
  ];

  const handleViewDetails = (rfqId: string) => {
    window.location.href = `/rfq/${rfqId}`;
  };

  const handleEdit = (rfqId: string) => {
    window.location.href = `/rfq/${rfqId}/edit`;
  };

  const handleQuote = (rfqId: string) => {
    // TODO: Implement quote functionality
    console.log('Quote RFQ:', rfqId);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Gestione RFQ"
          description="Richieste di quotazione e gestione offerte"
          actions={
            <>
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              <Button 
                className="btn-primary"
                onClick={() => window.location.href = '/rfq/new'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova RFQ
              </Button>
            </>
          }
        />

        {/* Filters */}
        <SearchFilterCard
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Cerca per numero RFQ, cliente o note..."
        >
          <StatusFilterButtons
            selectedStatus={selectedStatus}
            onStatusChange={(status) => setSelectedStatus(status as RFQStatus | 'all')}
            options={statusOptions}
          />
        </SearchFilterCard>

        {/* RFQ Display */}
        {viewMode === 'cards' ? (
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
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(rfq.rfq_id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Dettagli
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(rfq.rfq_id)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifica
                        </Button>
                      </div>
                      {rfq.status === 'open' && (
                        <Button 
                          size="sm" 
                          className="btn-primary"
                          onClick={() => handleQuote(rfq.rfq_id)}
                        >
                          Quota
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <RFQTableView 
            rfqs={filteredRFQs}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onQuote={handleQuote}
          />
        )}

        {filteredRFQs.length === 0 && (
          <EmptyStateCard
            icon={FileText}
            title="Nessuna RFQ trovata"
            description="Prova a modificare i filtri di ricerca o crea una nuova RFQ."
            actionButton={{
              label: "Nuova RFQ",
              onClick: () => window.location.href = '/rfq/new',
              icon: Plus
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}