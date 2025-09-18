import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Ship, 
  Users, 
  FileText, 
  TrendingUp,
  Search,
  Plus,
  BarChart3,
  Import
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-primary rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Benvenuto nel Sistema BU Nautica</h1>
          <p className="text-white/90">
            Gestisci giranti, bussole, listini cliente e RFQ in modo efficiente
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Prodotti Totali"
            value="1,247"
            description="847 giranti, 312 bussole, 88 kit"
            icon={<Ship className="h-4 w-4" />}
            trend={{
              value: 12,
              label: "da ultimo mese",
              direction: "up"
            }}
          />
          <MetricCard
            title="Clienti Attivi"
            value="89"
            description="Con listini validi"
            icon={<Users className="h-4 w-4" />}
            trend={{
              value: 5,
              label: "nuovi questo mese",
              direction: "up"
            }}
          />
          <MetricCard
            title="RFQ Aperte"
            value="23"
            description="In attesa di quotazione"
            icon={<FileText className="h-4 w-4" />}
            trend={{
              value: -8,
              label: "rispetto al mese scorso",
              direction: "down"
            }}
          />
          <MetricCard
            title="Fatturato Mese"
            value="€347K"
            description="Preventivi vinti"
            icon={<TrendingUp className="h-4 w-4" />}
            trend={{
              value: 15,
              label: "crescita mensile",
              direction: "up"
            }}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary" />
                <span>Azioni Rapide</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/search" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Search className="h-4 w-4 mr-2" />
                  Trova Girante per Dimensioni
                </Button>
              </Link>
              <Link to="/rfq/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova RFQ
                </Button>
              </Link>
              <Link to="/customers/price-comparison" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Confronto Listini
                </Button>
              </Link>
              <Link to="/import-export" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Import className="h-4 w-4 mr-2" />
                  Import/Export Dati
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Attività Recenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Nuovo prodotto aggiunto</p>
                    <p className="text-xs text-muted-foreground">
                      Girante G-2847 con disegno tecnico
                    </p>
                    <p className="text-xs text-muted-foreground">2 ore fa</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">RFQ quotata</p>
                    <p className="text-xs text-muted-foreground">
                      Cliente MarineTech - 5 giranti personalizzate
                    </p>
                    <p className="text-xs text-muted-foreground">5 ore fa</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-steel rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Listino aggiornato</p>
                    <p className="text-xs text-muted-foreground">
                      AquaComponents S.r.l. - 47 prezzi modificati
                    </p>
                    <p className="text-xs text-muted-foreground">1 giorno fa</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Prodotti per Tipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Giranti</span>
                <span className="font-medium">847</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bussole</span>
                <span className="font-medium">312</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Kit Completi</span>
                <span className="font-medium">88</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm">RFQ per Stato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Aperte</span>
                <span className="font-medium text-yellow-600">23</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quotate</span>
                <span className="font-medium text-blue-600">47</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Vinte</span>
                <span className="font-medium text-green-600">156</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Perse</span>
                <span className="font-medium text-red-600">34</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-sm">Listini Attivi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Questo Mese</span>
                <span className="font-medium">67</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>In Scadenza</span>
                <span className="font-medium text-yellow-600">12</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Da Rinnovare</span>
                <span className="font-medium text-red-600">5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}