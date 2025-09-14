import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  Wind,
  Droplets,
  Thermometer,
  ArrowRight,
  Calculator,
  Target,
  Activity
} from 'lucide-react';

const SprayabilityIndices = () => {
  const sprayabilityFactors = [
    { 
      name: 'Velocità Vento', 
      icon: Wind, 
      threshold: '≤ 4 m/s', 
      current: 3.2, 
      unit: 'm/s',
      status: 'good',
      weight: 30 
    },
    { 
      name: 'Pioggia Prevista', 
      icon: Droplets, 
      threshold: '≤ 0.2 mm/6h', 
      current: 0.0, 
      unit: 'mm',
      status: 'good',
      weight: 25 
    },
    { 
      name: 'Temperatura', 
      icon: Thermometer, 
      threshold: '8-30°C', 
      current: 22.5, 
      unit: '°C',
      status: 'good',
      weight: 20 
    },
    { 
      name: 'Umidità Relativa', 
      icon: Droplets, 
      threshold: '30-90%', 
      current: 68, 
      unit: '%',
      status: 'good',
      weight: 25 
    }
  ];

  const timeWindows = [
    { time: '06:00-09:00', status: 'Buona', confidence: 95, reason: 'Vento calmo, no pioggia' },
    { time: '10:00-12:00', status: 'Discreta', confidence: 75, reason: 'Vento moderato' },
    { time: '13:00-15:00', status: 'Scarsa', confidence: 40, reason: 'Vento forte, T° alta' },
    { time: '16:00-18:00', status: 'Discreta', confidence: 70, reason: 'Vento in diminuzione' },
    { time: '19:00-21:00', status: 'Buona', confidence: 90, reason: 'Condizioni ideali' }
  ];

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural mb-4">
            Indici di Sprayability
          </Badge>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Calcolo Finestre Operative Ottimali
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Algoritmi avanzati per determinare i momenti ideali per i trattamenti fitosanitari, 
            basati su condizioni meteorologiche, efficacia del prodotto e sicurezza operativa.
          </p>
        </div>

        {/* Current Index */}
        <Card className="shadow-card-soft mb-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
              Indice Sprayability Attuale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-4xl font-bold text-green-700 mb-2">BUONA</div>
                <div className="text-green-600">Condizioni ideali per il trattamento</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700">92%</div>
                <div className="text-sm text-green-600">Confidenza</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sprayabilityFactors.map((factor) => (
                <div key={factor.name} className="text-center p-3 bg-white/50 rounded-lg">
                  <factor.icon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-sm text-green-800">{factor.current}{factor.unit}</div>
                  <div className="text-xs text-green-600">{factor.threshold}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calculation Method */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-primary" />
                Metodo di Calcolo v0.1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm mb-4">
                L'algoritmo valuta multiple variabili meteorologiche per classificare 
                ogni ora nelle prossime 48h:
              </p>
              
              {sprayabilityFactors.map((factor) => (
                <div key={factor.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{factor.name}</span>
                    <Badge variant="outline">{factor.weight}%</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={factor.weight} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">{factor.threshold}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Soglie di Classificazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <div>
                      <div className="font-semibold text-green-800">BUONA</div>
                      <div className="text-xs text-green-600">Tutti i parametri ottimali</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">85-100%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                    <div>
                      <div className="font-semibold text-yellow-800">DISCRETA</div>
                      <div className="text-xs text-yellow-600">Condizioni accettabili</div>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">50-84%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-600 mr-2" />
                    <div>
                      <div className="font-semibold text-red-800">SCARSA</div>
                      <div className="text-xs text-red-600">Sconsigliato trattare</div>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800">0-49%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Windows */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Finestre Operative Prossime 24h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeWindows.map((window, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    window.status === 'Buona' ? 'bg-green-50 border-green-200' :
                    window.status === 'Discreta' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="font-mono text-lg font-semibold">
                      {window.time}
                    </div>
                    <Badge 
                      variant={
                        window.status === 'Buona' ? 'default' :
                        window.status === 'Discreta' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {window.status}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{window.confidence}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{window.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Personalizzazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Tipo di Coltura</span>
                  <Badge variant="outline">Cereali</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tipo di Prodotto</span>
                  <Badge variant="outline">Fungicida</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Sensibilità Vento</span>
                  <Badge variant="outline">Standard</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Prossime Feature</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary/50 rounded-full mr-2"></span>
                  Indice Deriva (v0.2)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary/50 rounded-full mr-2"></span>
                  Finestra Inversione Termica
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary/50 rounded-full mr-2"></span>
                  Compatibilità Prodotti
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Feedback Utenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="text-2xl font-bold text-primary">4.2/5</div>
                <div className="text-sm text-muted-foreground">Accuratezza percepita</div>
                <Button variant="outline" size="sm">
                  Valuta Previsione
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning */}
        <Card className="shadow-card-soft mb-12 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Avvertenze Importanti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Gli indici sono informativi e sperimentali (versione v0.1)</p>
              <p>• Consultare sempre l'etichetta del prodotto fitosanitario</p>
              <p>• Rispettare le normative locali su tempi di carenza e deriva</p>
              <p>• Utilizzare sempre dispositivi di protezione individuale appropriati</p>
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
              <TrendingUp className="w-5 h-5 mr-2" />
              Calcola Indici per la Tua Area
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Prova il calcolo degli indici di sprayability sulla tua area
          </p>
        </div>
      </div>
    </div>
  );
};

export default SprayabilityIndices;