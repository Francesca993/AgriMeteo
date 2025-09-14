import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  MapPin,
  Cloud,
  Users,
  Mail,
  ExternalLink
} from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Chi Siamo
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AGRIMETEO è una piattaforma innovativa per l'agricoltura di precisione, 
            che fornisce dati meteorologici contestuali e indici operativi per ottimizzare 
            le decisioni agricole.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Mission */}
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                La Nostra Missione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Supportiamo agricoltori, agronomi e cooperative nel prendere decisioni informate 
                attraverso dati meteorologici precisi e algoritmi di calcolo dedicati 
                all'ottimizzazione dei trattamenti agricoli.
              </p>
            </CardContent>
          </Card>

          {/* Technology */}
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cloud className="w-5 h-5 mr-2 text-primary" />
                Tecnologia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dati Meteorologici</span>
                  <Badge variant="secondary">Open-Meteo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Mappe</span>
                  <Badge variant="secondary">OpenStreetMap</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Calcoli</span>
                  <Badge variant="secondary">Algoritmi Proprietari</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Funzionalità
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Selezione aree su mappa interattiva
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Previsioni meteorologiche 48h
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Calcolo indice Sprayability
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Finestre operative ottimali
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                  Export e condivisione risultati
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy & Legal */}
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Privacy & Conformità
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                I dati di posizione sono utilizzati esclusivamente per fornire previsioni 
                meteorologiche accurate e non vengono conservati permanentemente.
              </p>
              <p className="text-xs text-muted-foreground">
                Conformità GDPR • Attribution OSM • Fonti meteorologiche pubbliche
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="mt-8 border-destructive/20 bg-destructive/5 shadow-card-soft">
          <CardHeader>
            <CardTitle className="text-destructive">Avvertenze Importanti</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              ⚠️ Le indicazioni fornite da AGRIMETEO sono puramente informative e sperimentali (versione v0).
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              🧪 Gli algoritmi sono in fase di sviluppo e possono presentare imprecisioni.
            </p>
            <p className="text-sm text-muted-foreground">
              📋 Fare sempre riferimento alle etichette dei prodotti fitosanitari e alla normativa locale vigente.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <div className="text-center mt-12 p-6 bg-muted/50 rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">Contatti & Feedback</h3>
          <div className="flex items-center justify-center space-x-4 text-muted-foreground">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">info@agrimeteo.app</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Il tuo feedback è prezioso per migliorare la piattaforma
          </p>
        </div>

        {/* Attribution */}
        <div className="mt-8 text-center text-xs text-muted-foreground space-y-1">
          <p>
            Dati meteorologici: 
            <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="ml-1 underline">
              Open-Meteo <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
          <p>
            Dati cartografici: 
            <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="ml-1 underline">
              OpenStreetMap Contributors <ExternalLink className="w-3 h-3 inline" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;