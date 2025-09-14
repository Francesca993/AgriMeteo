import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Cloud, 
  Wind, 
  TrendingUp, 
  Shield, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import heroImage from '@/assets/agricultural-hero.jpg';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural">
                  Agricoltura di Precisione
                </Badge>
                <h1 className="text-5xl font-bold text-foreground leading-tight">
                  Dati Meteo
                  <span className="text-primary block">
                    per l'Agricoltura
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Calcola gli indici di sprayability e ottimizza le finestre operative 
                  con dati meteorologici precisi e contestuali alla tua area agricola.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-gradient-agricultural hover:opacity-90 text-primary-foreground shadow-agricultural"
                >
                  <Link to="/map">
                    <MapPin className="w-5 h-5 mr-2" />
                    Apri Mappa Interattiva
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline"
                  size="lg"
                >
                  <Link to="/about">
                    Scopri di più
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  Dati in tempo reale
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  Previsioni 48h
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-primary mr-2" />
                  Gratuito
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={heroImage}
                alt="Vista aerea di campi agricoli con tecnologia di precisione"
                className="w-full h-[500px] object-cover rounded-2xl shadow-agricultural"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Funzionalità Principali
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Una piattaforma completa per l'analisi delle condizioni meteorologiche 
              e la pianificazione dei trattamenti agricoli
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center shadow-card-soft hover:shadow-agricultural transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-agricultural rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">Selezione Aree</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-muted-foreground text-sm mb-4">
                  Seleziona facilmente la tua area di interesse 
                  direttamente sulla mappa interattiva
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/selezione-aree">
                    Scopri di più
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center shadow-card-soft hover:shadow-agricultural transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-agricultural rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Cloud className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">Dati Meteo</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-muted-foreground text-sm mb-4">
                  Previsioni meteorologiche accurate 
                  con aggiornamenti ogni ora per 48 ore
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/dati-meteo">
                    Scopri di più
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center shadow-card-soft hover:shadow-agricultural transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-agricultural rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">Indici Sprayability</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-muted-foreground text-sm mb-4">
                  Calcolo automatico delle finestre ottimali 
                  per i trattamenti fitosanitari
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/indici-sprayability">
                    Scopri di più
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center shadow-card-soft hover:shadow-agricultural transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-agricultural rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Wind className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-lg">Analisi Condizioni</CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-muted-foreground text-sm mb-4">
                  Monitoraggio di vento, pioggia, 
                  temperatura e umidità relativa
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/analisi-condizioni">
                    Scopri di più
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-agricultural">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-primary-foreground">
            <h2 className="text-3xl font-bold mb-6">
              Inizia ad Ottimizzare i Tuoi Trattamenti
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Accedi gratuitamente alla mappa interattiva e scopri le finestre operative 
              ottimali per la tua area agricola
            </p>
            <Button 
              asChild 
              size="lg"
              variant="secondary"
              className="bg-background text-foreground hover:bg-background/90 shadow-agricultural"
            >
              <Link to="/map">
                <MapPin className="w-5 h-5 mr-2" />
                Apri Mappa Interattiva
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2024 AGRIMETEO. Dati forniti gratuitamente.</p>
            </div>
            <div className="flex items-center space-x-6">
              <span>Dati meteo: Open-Meteo</span>
              <span>Mappe: OpenStreetMap</span>
              <Link to="/about" className="hover:text-foreground transition-colors">
                Privacy & Info
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
