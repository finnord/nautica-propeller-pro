import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useKeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ViewModeToggle } from '@/components/ui/view-mode-toggle';
import { SearchFilterCard } from '@/components/ui/search-filter-card';
import { StatusFilterButtons } from '@/components/ui/status-filter-buttons';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyStateCard } from '@/components/ui/empty-state-card';
import { RFQTableView } from '@/components/ui/rfq-table-view';
import { ActionButtonGroup } from '@/components/ui/action-button-group';
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
  const navigate = useNavigate();
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcutsContext();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<RFQStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredRFQs = useMemo(() => {
    return mockRFQs.filter(rfq => {
      const normalizedQuery = searchTerm.toLowerCase();
      const matchesSearch =
        rfq.rfq_id.toLowerCase().includes(normalizedQuery) ||
        rfq.customer_id.toLowerCase().includes(normalizedQuery) ||
        (rfq.notes?.toLowerCase().includes(normalizedQuery) ?? false);

      const matchesStatus =
        selectedStatus === 'all' ||
        rfq.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, selectedStatus]);

  const statusOptions = [
    { value: 'all', label: 'Tutti' },
    { value: 'open', label: 'Aperti' },
    { value: 'quoted', label: 'Quotati' },
    { value: 'won', label: 'Vinti' },
    { value: 'lost', label: 'Persi' },
    { value: 'on_hold', label: 'In Sospeso' }
  ];

  const handleViewDetails = (rfqId: string) => {
    navigate(`/rfq/${rfqId}`);
  };

  const handleEdit = (rfqId: string) => {
    navigate(`/rfq/${rfqId}/edit`);
  };

  const handleQuote = (rfqId: string) => {
    // TODO: Implement quote functionality
    console.log('Quote RFQ:', rfqId);
  };

  // Register keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        key: 'tab',
        description: 'Cambia visualizzazione (cards/table)',
        action: () => setViewMode(prev => (prev === 'cards' ? 'table' : 'cards')),
        category: 'view' as const
      },
      {
        key: 'k',
        ctrlKey: true,
        description: 'Focus ricerca',
        action: () => {
          searchInputRef.current?.focus();
        },
        category: 'search' as const
      },
      {
        key: 'n',
        ctrlKey: true,
        description: 'Nuova RFQ',
        action: () => navigate('/rfq/new'),
        category: 'actions' as const
      },
      {
        key: 'escape',
        description: 'Reset filtri',
        action: () => {
          setSearchTerm('');
          setSelectedStatus('all');
        },
        category: 'search' as const
      }
    ];

    shortcuts.forEach(registerShortcut);

    return () => {
      shortcuts.forEach(shortcut => unregisterShortcut(shortcut.key));
    };
  }, [navigate, registerShortcut, unregisterShortcut]);

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
                onClick={() => navigate('/rfq/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuova RFQ
              </Button>
            </>
          }
        />

        {/* Filters */}
        <SearchFilterCard
          ref={searchInputRef}
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
        {filteredRFQs.length === 0 ? (
          <EmptyStateCard
            icon={Plus}
            title="Nessuna RFQ trovata"
            description="Prova a modificare i filtri o crea una nuova richiesta di quotazione"
            actions={[{
              icon: Plus,
              label: 'Nuova RFQ',
              onClick: () => navigate('/rfq/new'),
              variant: 'default'
            }]}
          />
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRFQs.map((rfq) => {
              const StatusIcon = getStatusIcon(rfq.status);
              return (
                <Card key={rfq.rfq_id} className="card-interactive">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{rfq.rfq_id}</h3>
                        <p className="text-sm text-muted-foreground">Cliente: {rfq.customer_id}</p>
                        <p className="text-xs text-muted-foreground">Data: {rfq.rfq_date}</p>
                      </div>
                      <Badge className={`${getStatusColor(rfq.status)} flex items-center gap-2`}>
                        <StatusIcon className="h-3 w-3" />
                        {getStatusLabel(rfq.status)}
                      </Badge>
                    </div>

                    {rfq.notes && (
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {rfq.notes}
                      </p>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <ActionButtonGroup
                        actions={[
                          {
                            icon: Eye,
                            label: 'Dettagli',
                            onClick: () => handleViewDetails(rfq.rfq_id),
                            variant: 'outline'
                          },
                          {
                            icon: Edit,
                            label: 'Modifica',
                            onClick: () => handleEdit(rfq.rfq_id),
                            variant: 'outline'
                          }
                        ]}
                      />
                      <ActionButtonGroup
                        actions={[{
                          icon: FileText,
                          label: 'Genera offerta',
                          onClick: () => handleQuote(rfq.rfq_id),
                          variant: 'ghost'
                        }]}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Richieste di Quotazione</CardTitle>
            </CardHeader>
            <CardContent>
              <RFQTableView
                data={filteredRFQs}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onQuote={handleQuote}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
