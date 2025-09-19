import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export interface Conflict {
  id: string;
  recordKey: string;
  field: string;
  existingValue: any;
  newValue: any;
  rowNumber: number;
}

export type ConflictResolution = 'keep_existing' | 'use_new' | 'skip_record';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: Conflict[];
  onResolve: (resolutions: Record<string, ConflictResolution>) => void;
  onResolveAll: (resolution: ConflictResolution) => void;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  onResolveAll
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});
  const [globalResolution, setGlobalResolution] = useState<ConflictResolution>('use_new');

  const handleResolutionChange = (conflictId: string, resolution: ConflictResolution) => {
    setResolutions(prev => ({
      ...prev,
      [conflictId]: resolution
    }));
  };

  const handleApplyResolutions = () => {
    onResolve(resolutions);
    onOpenChange(false);
  };

  const handleApplyGlobal = () => {
    onResolveAll(globalResolution);
    onOpenChange(false);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'Vuoto';
    if (typeof value === 'boolean') return value ? 'Sì' : 'No';
    if (typeof value === 'number') return value.toString();
    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Conflitti Rilevati - {conflicts.length} record
          </DialogTitle>
          <DialogDescription>
            I seguenti record esistono già nel database con valori diversi. 
            Scegli come gestire ogni conflitto:
          </DialogDescription>
        </DialogHeader>

        {/* Global Actions */}
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Risoluzione Globale</h4>
              <p className="text-sm text-muted-foreground">
                Applica la stessa azione a tutti i conflitti
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={globalResolution} onValueChange={(value: ConflictResolution) => setGlobalResolution(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="use_new">Sovrascrivi con nuovi valori</SelectItem>
                  <SelectItem value="keep_existing">Mantieni valori esistenti</SelectItem>
                  <SelectItem value="skip_record">Salta record</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleApplyGlobal} variant="outline">
                Applica a Tutti
              </Button>
            </div>
          </div>
        </div>

        {/* Conflicts Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Valore Esistente</TableHead>
                <TableHead className="text-center">→</TableHead>
                <TableHead>Nuovo Valore</TableHead>
                <TableHead>Azione</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conflicts.map((conflict) => (
                <TableRow key={conflict.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{conflict.recordKey}</div>
                      <div className="text-sm text-muted-foreground">Riga {conflict.rowNumber}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{conflict.field}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm bg-destructive/10 px-2 py-1 rounded">
                      {formatValue(conflict.existingValue)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                      {formatValue(conflict.newValue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={resolutions[conflict.id] || 'use_new'} 
                      onValueChange={(value: ConflictResolution) => handleResolutionChange(conflict.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="use_new">Sovrascrivi</SelectItem>
                        <SelectItem value="keep_existing">Mantieni</SelectItem>
                        <SelectItem value="skip_record">Salta</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleApplyResolutions}>
            Applica Risoluzioni
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}