import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table-view';
import { ActionButtonGroup, ActionButton } from '@/components/ui/action-button-group';
import { Eye, Edit, FileText, CheckCircle, XCircle, Clock, PauseCircle } from 'lucide-react';
import type { RFQ as RFQType, RFQStatus } from '@/types';

interface RFQTableViewProps {
  rfqs?: RFQType[];
  data?: RFQType[]; // Alternative prop name for compatibility
  onViewDetails: (rfqId: string) => void;
  onEdit: (rfqId: string) => void;
  onQuote?: (rfqId: string) => void;
}

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

export const RFQTableView = ({ rfqs, data, onViewDetails, onEdit, onQuote }: RFQTableViewProps) => {
  const rfqData = data || rfqs || [];
  return (
    <Card className="card-elevated">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RFQ ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data RFQ</TableHead>
              <TableHead>Ultimo Aggiornamento</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfqData.map((rfq) => {
              const StatusIcon = getStatusIcon(rfq.status);
              
              const actions: ActionButton[] = [
                { icon: Eye, label: 'Dettagli', onClick: () => onViewDetails(rfq.rfq_id) },
                { icon: Edit, label: 'Modifica', onClick: () => onEdit(rfq.rfq_id) }
              ];

              if (rfq.status === 'open' && onQuote) {
                actions.push({ 
                  icon: FileText, 
                  label: 'Quota', 
                  onClick: () => onQuote(rfq.rfq_id),
                  variant: 'default'
                });
              }

              return (
                <TableRow key={rfq.rfq_id}>
                  <TableCell className="font-mono font-semibold">
                    {rfq.rfq_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {rfq.customer_id}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(rfq.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {getStatusLabel(rfq.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(rfq.rfq_date).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    {new Date(rfq.updated_at).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {rfq.notes && (
                      <span className="text-sm text-muted-foreground truncate block">
                        {rfq.notes}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionButtonGroup actions={actions} className="justify-end" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};