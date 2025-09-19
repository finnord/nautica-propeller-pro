import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';
import type { PriceListConflict } from '@/hooks/usePriceListImportValidation';
import type { PriceListConflictResolution } from '@/hooks/usePriceListImportUpsert';

interface PriceListConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: PriceListConflict[];
  onResolve: (resolutions: Record<string, PriceListConflictResolution>) => void;
  onResolveAll: (resolution: PriceListConflictResolution) => void;
}

export function PriceListConflictDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  onResolveAll
}: PriceListConflictDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, PriceListConflictResolution>>({});
  const [globalResolution, setGlobalResolution] = useState<PriceListConflictResolution>('update');

  const handleResolutionChange = (conflictId: string, resolution: PriceListConflictResolution) => {
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

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Generate unique IDs for conflicts based on customer and list name
  const getConflictId = (conflict: PriceListConflict, index: number): string => {
    return `${conflict.customer_name}_${conflict.list_name}_${conflict.list_version || 'v1'}_${index}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Risoluzione Conflitti Import ({conflicts.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Global Resolution */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="font-medium">Risoluzione Globale</span>
            </div>
            
            <RadioGroup 
              value={globalResolution} 
              onValueChange={(value) => setGlobalResolution(value as PriceListConflictResolution)}
              className="flex flex-wrap gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="global-update" />
                <Label htmlFor="global-update">Aggiorna Esistenti</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="global-skip" />
                <Label htmlFor="global-skip">Salta Conflitti</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="append" id="global-append" />
                <Label htmlFor="global-append">Crea Nuove Versioni</Label>
              </div>
            </RadioGroup>

            <Button 
              onClick={handleApplyGlobal}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Applica a Tutti i Conflitti ({conflicts.length})
            </Button>
          </div>

          <Separator />

          {/* Individual Conflicts */}
          <div>
            <h4 className="font-medium mb-4">Conflitti Individuali</h4>
            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Listino</TableHead>
                    <TableHead>Versione</TableHead>
                    <TableHead>Elementi</TableHead>
                    <TableHead>Risoluzione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict, index) => {
                    const conflictId = getConflictId(conflict, index);
                    return (
                      <TableRow key={conflictId}>
                        <TableCell className="font-medium">
                          {conflict.customer_name}
                        </TableCell>
                        <TableCell>
                          {conflict.list_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {conflict.list_version || 'v1'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{conflict.incoming_data.length} elementi da importare</div>
                            <div className="text-muted-foreground">
                              Listino esistente trovato
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RadioGroup
                            value={resolutions[conflictId] || 'update'}
                            onValueChange={(value) => 
                              handleResolutionChange(conflictId, value as PriceListConflictResolution)
                            }
                            className="flex gap-2"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem 
                                value="update" 
                                id={`${conflictId}-update`}
                                className="h-3 w-3"
                              />
                              <Label htmlFor={`${conflictId}-update`} className="text-xs">Aggiorna</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem 
                                value="skip" 
                                id={`${conflictId}-skip`}
                                className="h-3 w-3"
                              />
                              <Label htmlFor={`${conflictId}-skip`} className="text-xs">Salta</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem 
                                value="append" 
                                id={`${conflictId}-append`}
                                className="h-3 w-3"
                              />
                              <Label htmlFor={`${conflictId}-append`} className="text-xs">Nuova Ver.</Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <Button onClick={handleApplyResolutions}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Applica Risoluzioni Selezionate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}