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
  const [globalResolution, setGlobalResolution] = useState<PriceListConflictResolution>('use_new');

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

  const getConflictTypeLabel = (type: PriceListConflict['type']) => {
    switch (type) {
      case 'customer': return 'Cliente';
      case 'price_list': return 'Listino';
      case 'price_list_item': return 'Prezzo';
      default: return 'Dato';
    }
  };

  const getConflictTypeColor = (type: PriceListConflict['type']) => {
    switch (type) {
      case 'customer': return 'default';
      case 'price_list': return 'secondary';
      case 'price_list_item': return 'outline';
      default: return 'default';
    }
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
                <RadioGroupItem value="use_new" id="global-new" />
                <Label htmlFor="global-new">Usa Nuovi Valori</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keep_existing" id="global-keep" />
                <Label htmlFor="global-keep">Mantieni Esistenti</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip_record" id="global-skip" />
                <Label htmlFor="global-skip">Salta Record</Label>
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
                    <TableHead>Riga</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Campo</TableHead>
                    <TableHead>Valore Esistente</TableHead>
                    <TableHead>Nuovo Valore</TableHead>
                    <TableHead>Risoluzione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflicts.map((conflict) => (
                    <TableRow key={conflict.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {conflict.rowNumber}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getConflictTypeColor(conflict.type)}>
                          {getConflictTypeLabel(conflict.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {conflict.field}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {formatValue(conflict.existingValue)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-primary/10 px-2 py-1 rounded">
                          {formatValue(conflict.newValue)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <RadioGroup
                          value={resolutions[conflict.id] || 'use_new'}
                          onValueChange={(value) => 
                            handleResolutionChange(conflict.id, value as PriceListConflictResolution)
                          }
                          className="flex gap-2"
                        >
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem 
                              value="use_new" 
                              id={`${conflict.id}-new`}
                              className="h-3 w-3"
                            />
                            <Label htmlFor={`${conflict.id}-new`} className="text-xs">Nuovo</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem 
                              value="keep_existing" 
                              id={`${conflict.id}-keep`}
                              className="h-3 w-3"
                            />
                            <Label htmlFor={`${conflict.id}-keep`} className="text-xs">Esistente</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <RadioGroupItem 
                              value="skip_record" 
                              id={`${conflict.id}-skip`}
                              className="h-3 w-3"
                            />
                            <Label htmlFor={`${conflict.id}-skip`} className="text-xs">Salta</Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
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