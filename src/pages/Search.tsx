import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImpellerSimilaritySearch } from '@/components/product/ImpellerSimilaritySearch';
import { 
  Search,
  Target
} from 'lucide-react';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Search className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Ricerca Prodotti</h1>
            <p className="text-muted-foreground">
              Cerca giranti per nome o utilizza la ricerca dimensionale per trovare prodotti simili
            </p>
          </div>
        </div>

        {/* Basic Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Ricerca Base
            </CardTitle>
            <CardDescription>
              Cerca giranti per nome, codice interno o note
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Termine di ricerca</Label>
                <Input
                  id="search"
                  placeholder="Inserisci nome girante, codice interno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button className="gap-2">
                  <Search className="w-4 h-4" />
                  Cerca
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensional Search */}
        <ImpellerSimilaritySearch />

        {/* Search Results */}
        <Card>
          <CardHeader>
            <CardTitle>Risultati Ricerca</CardTitle>
            <CardDescription>
              I risultati della ricerca appariranno qui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Utilizza i filtri sopra per iniziare la ricerca</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}