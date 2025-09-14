import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  MousePointer, 
  Crosshair, 
  Navigation, 
  Search,
  ArrowRight,
  Circle,
  Square,
  Target
} from 'lucide-react';

const AreaSelection = () => {
  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural mb-4">
            Selezione Aree
          </Badge>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Seleziona la Tua Area Agricola
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Identifica con precisione la tua area di interesse utilizzando strumenti 
            di selezione avanzati sulla mappa interattiva per ottenere dati meteorologici 
            specifici per la tua location.
          </p>
        </div>

        {/* Methods Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="shadow-card-soft hover:shadow-agricultural transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-agricultural rounded-lg flex items-center justify-center mx-auto mb-4">
                <MousePointer className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-center">Click Singolo</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Clicca semplicemente su un punto della mappa per selezionare 
                un'area circolare di 250 metri di raggio
              </p>
              <Badge variant="outline">Ideale per piccoli appezzamenti</Badge>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft hover:shadow-agricultural transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-agricultural rounded-lg flex items-center justify-center mx-auto mb-4">
                <Circle className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-center">Area Circolare</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Disegna un cerchio personalizzato con raggio variabile 
                da 100m a 2km per aree di forma regolare
              </p>
              <Badge variant="outline">Raggio personalizzabile</Badge>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft hover:shadow-agricultural transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gradient-agricultural rounded-lg flex items-center justify-center mx-auto mb-4">
                <Square className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-center">Poligono Libero</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Traccia i confini esatti del tuo campo seguendo 
                la forma reale dell'appezzamento agricolo
              </p>
              <Badge variant="outline">Massima precisione</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2 text-primary" />
                Ricerca Indirizzo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Trova rapidamente la tua posizione utilizzando:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <Target className="w-4 h-4 text-primary mr-2" />
                  Indirizzo completo (Via, Comune, CAP)
                </li>
                <li className="flex items-center text-sm">
                  <Target className="w-4 h-4 text-primary mr-2" />
                  Nome località o frazione
                </li>
                <li className="flex items-center text-sm">
                  <Target className="w-4 h-4 text-primary mr-2" />
                  Coordinate geografiche (lat, lng)
                </li>
                <li className="flex items-center text-sm">
                  <Target className="w-4 h-4 text-primary mr-2" />
                  Codice catastale del comune
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Navigation className="w-5 h-5 mr-2 text-primary" />
                Geolocalizzazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Utilizza il GPS del tuo dispositivo per:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <Crosshair className="w-4 h-4 text-primary mr-2" />
                  Centrare automaticamente la mappa
                </li>
                <li className="flex items-center text-sm">
                  <Crosshair className="w-4 h-4 text-primary mr-2" />
                  Selezionare la tua posizione attuale
                </li>
                <li className="flex items-center text-sm">
                  <Crosshair className="w-4 h-4 text-primary mr-2" />
                  Navigare verso le aree salvate
                </li>
                <li className="flex items-center text-sm">
                  <Crosshair className="w-4 h-4 text-primary mr-2" />
                  Verificare la precisione GPS
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Come Funziona la Selezione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                  1
                </div>
                <h4 className="font-semibold">Naviga</h4>
                <p className="text-sm text-muted-foreground">
                  Usa zoom e pan per raggiungere la tua zona di interesse
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                  2
                </div>
                <h4 className="font-semibold">Seleziona</h4>
                <p className="text-sm text-muted-foreground">
                  Scegli il metodo di selezione più adatto alla tua area
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                  3
                </div>
                <h4 className="font-semibold">Conferma</h4>
                <p className="text-sm text-muted-foreground">
                  Verifica la selezione e procedi all'analisi meteorologica
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                  4
                </div>
                <h4 className="font-semibold">Analizza</h4>
                <p className="text-sm text-muted-foreground">
                  Ottieni dati meteo e indici di sprayability per la tua area
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="shadow-card-soft mb-12 bg-gradient-to-r from-agricultural-sand/20 to-agricultural-green/10">
          <CardHeader>
            <CardTitle>💡 Suggerimenti per una Selezione Ottimale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Precisione dell'Area</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Seleziona aree omogenee per coltura e esposizione</li>
                  <li>• Evita di includere edifici o corsi d'acqua</li>
                  <li>• Considera la topografia del terreno</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Dimensioni Consigliate</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Minimo 1 ettaro per dati significativi</li>
                  <li>• Massimo 100 ettari per precisione locale</li>
                  <li>• Aree irregolari: usa il poligono libero</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button 
            asChild 
            size="lg"
            className="bg-gradient-agricultural hover:opacity-90 text-primary-foreground shadow-agricultural"
          >
            <Link to="/map">
              <MapPin className="w-5 h-5 mr-2" />
              Inizia a Selezionare la Tua Area
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Prova gratuitamente tutti gli strumenti di selezione
          </p>
        </div>
      </div>
    </div>
  );
};

export default AreaSelection;