import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { FileQuestion, TrendingUp, Target, Award, Calendar, Euro, Eye, Edit, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface RFQLine {
  id: string;
  line_number: number;
  quantity: number;
  target_price: number | null;
  quoted_price: number | null;
  quoted_at: string | null;
  notes: string | null;
  rfq: {
    id: string;
    rfq_number: string;
    rfq_date: string;
    status: string;
    expiry_date: string | null;
    customer: {
      name: string;
    };
  };
}

interface ProductRFQTabProps {
  productId: string;
}

export const ProductRFQTab = ({ productId }: ProductRFQTabProps) => {
  const [rfqLines, setRfqLines] = useState<RFQLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRFQLines();
  }, [productId]);

  const fetchRFQLines = async () => {
    try {
      const { data, error } = await supabase
        .from('rfq_lines')
        .select(`
          id,
          line_number,
          quantity,
          target_price,
          quoted_price,
          quoted_at,
          notes,
          rfq:rfq (
            id,
            rfq_number,
            rfq_date,
            status,
            expiry_date,
            customer:customers (
              name
            )
          )
        `)
        .eq('propeller_id', productId)
        .order('rfq_date', { foreignTable: 'rfq', ascending: false });

      if (error) throw error;
      setRfqLines(data || []);
    } catch (error) {
      console.error('Error fetching RFQ lines:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'quoted': return 'secondary';
      case 'won': return 'default';
      case 'lost': return 'destructive';
      case 'on_hold': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aperto';
      case 'quoted': return 'Quotato';
      case 'won': return 'Vinto';
      case 'lost': return 'Perso';
      case 'on_hold': return 'In attesa';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return FileQuestion;
      case 'quoted': return Euro;
      case 'won': return Award;
      case 'lost': return Target;
      case 'on_hold': return Calendar;
      default: return FileQuestion;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Caricamento...</div>;
  }

  if (rfqLines.length === 0) {
    return (
      <div className="text-center py-12">
        <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nessuna RFQ trovata</h3>
        <p className="text-muted-foreground mb-4">
          Questo prodotto non è presente in nessuna richiesta di quotazione
        </p>
        <Button>
          <FileQuestion className="h-4 w-4 mr-2" />
          Crea nuova RFQ
        </Button>
      </div>
    );
  }

  // Calculate statistics
  const totalRFQs = rfqLines.length;
  const wonRFQs = rfqLines.filter(line => line.rfq.status === 'won').length;
  const winRate = totalRFQs > 0 ? (wonRFQs / totalRFQs * 100) : 0;
  
  const quotedLines = rfqLines.filter(line => line.quoted_price);
  const avgQuotedPrice = quotedLines.length > 0 
    ? quotedLines.reduce((sum, line) => sum + (line.quoted_price || 0), 0) / quotedLines.length 
    : 0;

  const totalQuantity = rfqLines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">RFQ totali</p>
                <p className="text-2xl font-bold">{totalRFQs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tasso vittoria</p>
                <p className="text-2xl font-bold">{winRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Prezzo medio quotato</p>
                <p className="text-2xl font-bold">
                  {avgQuotedPrice > 0 ? `€${avgQuotedPrice.toFixed(2)}` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Quantità totale</p>
                <p className="text-2xl font-bold">{totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFQ Lines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Richieste di quotazione</span>
            <Button size="sm">
              <FileQuestion className="h-4 w-4 mr-2" />
              Nuova RFQ
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RFQ</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Qta</TableHead>
                <TableHead>Prezzo target</TableHead>
                <TableHead>Prezzo quotato</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqLines.map((line) => {
                const StatusIcon = getStatusIcon(line.rfq.status);
                return (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-4 w-4" />
                        <span>{line.rfq.rfq_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>{line.rfq.customer.name}</TableCell>
                    <TableCell>
                      {format(new Date(line.rfq.rfq_date), 'dd/MM/yyyy', { locale: it })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(line.rfq.status)}>
                        {getStatusLabel(line.rfq.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>
                      {line.target_price ? (
                        <span className="font-mono">€{line.target_price.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {line.quoted_price ? (
                        <div>
                          <span className="font-mono">€{line.quoted_price.toFixed(2)}</span>
                          {line.quoted_at && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(line.quoted_at), 'dd/MM/yyyy', { locale: it })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Non quotato</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {line.rfq.expiry_date ? (
                        <span className="text-sm">
                          {format(new Date(line.rfq.expiry_date), 'dd/MM/yyyy', { locale: it })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {line.rfq.status === 'open' && !line.quoted_price && (
                          <Button variant="ghost" size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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