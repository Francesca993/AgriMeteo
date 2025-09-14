import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { 
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  ArrowRight,
  BarChart3,
  LineChart,
  Calendar
} from 'lucide-react';

const ConditionsAnalysis = () => {
  const analysisMetrics = [
    {
      name: 'Stabilità Atmosferica',
      value: 78,
      trend: 'up',
      description: 'Condizioni stabili favoriscono trattamenti precisi',
      icon: Activity,
      color: 'green'
    },
    {
      name: 'Rischio Deriva',
      value: 25,
      trend: 'down', 
      description: 'Basso rischio di deriva del prodotto',
      icon: Wind,
      color: 'blue'
    },
    {
      name: 'Finestra Operativa',
      value: 92,
      trend: 'up',
      description: 'Ampia finestra per operazioni efficaci',
      icon: Calendar,
      color: 'purple'
    },
    {
      name: 'Stress Idrico',
      value: 35,
      trend: 'stable',
      description: 'Livelli di stress moderati nelle colture',
      icon: Droplets,
      color: 'orange'
    }
  ];

  const environmentalFactors = [
    { factor: 'Inversione Termica', status: 'Assente', impact: 'Positivo', confidence: 85 },
    { factor: 'Turbolenza Aria', status: 'Moderata', impact: 'Neutro', confidence: 72 },
    { factor: 'Bagnatura Fogliare', status: 'Secca', impact: 'Positivo', confidence: 90 },
    { factor: 'Radiazione Solare', status: 'Media', impact: 'Neutro', confidence: 95 }
  ];

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural mb-4">
            Analisi delle Condizioni
          </Badge>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Monitoraggio Ambientale Avanzato
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Analisi completa delle condizioni ambientali per ottimizzare l'efficacia 
            dei trattamenti e minimizzare l'impatto sull'ambiente e sulle colture adiacenti.
          </p>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {analysisMetrics.map((metric) => (
            <Card key={metric.name} className="shadow-card-soft text-center">
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  metric.color === 'green' ? 'bg-green-100' :
                  metric.color === 'blue' ? 'bg-blue-100' :
                  metric.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  <metric.icon className={`w-6 h-6 ${
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                  }`} />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl font-bold">{metric.value}%</span>
                    {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  </div>
                  <h3 className="font-semibold text-sm">{metric.name}</h3>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Environmental Factors */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-primary" />
              Fattori Ambientali Critici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {environmentalFactors.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="font-semibold">{item.factor}</div>
                    <Badge 
                      variant={
                        item.status === 'Assente' || item.status === 'Secca' ? 'default' :
                        item.status === 'Moderata' || item.status === 'Media' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.impact}</div>
                      <div className="text-xs text-muted-foreground">{item.confidence}% confidenza</div>
                    </div>
                    <div className="w-16">
                      <Progress value={item.confidence} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Tools */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Analisi Microclimatica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm">Gradiente Termico</span>
                  </div>
                  <span className="text-sm font-mono">-0.8°C/100m</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm">Profilo del Vento</span>
                  </div>
                  <span className="text-sm font-mono">Logaritmico</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 text-cyan-500 mr-2" />
                    <span className="text-sm">Umidità Stratificata</span>
                  </div>
                  <span className="text-sm font-mono">±12% variazione</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-sm">Pressione Locale</span>
                  </div>
                  <span className="text-sm font-mono">1013.2 hPa</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-primary" />
                Modelli Predittivi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-800">Dispersione Aerosol</span>
                    <Badge className="bg-blue-100 text-blue-800">Gaussiano</Badge>
                  </div>
                  <div className="text-xs text-blue-600">
                    Modello di dispersione 3D per calcolo deriva
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-800">Evaporazione Gocce</span>
                    <Badge className="bg-green-100 text-green-800">Termodinamico</Badge>
                  </div>
                  <div className="text-xs text-green-600">
                    Calcolo tempo di vita goccioline
                  </div>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-purple-800">Deposizione</span>
                    <Badge className="bg-purple-100 text-purple-800">Gravitazionale</Badge>
                  </div>
                  <div className="text-xs text-purple-600">
                    Efficienza deposizione su target
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Monitoring */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle>Monitoraggio in Tempo Reale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <Activity className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-700 mb-1">Live</div>
                <div className="text-sm text-green-600">Stazione Meteo</div>
                <div className="text-xs text-muted-foreground mt-2">Aggiornamento ogni 10 min</div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <Wind className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-700 mb-1">3.2 m/s</div>
                <div className="text-sm text-blue-600">Vento Attuale</div>
                <div className="text-xs text-muted-foreground mt-2">Direzione: NE (45°)</div>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                <Gauge className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-700 mb-1">Stabile</div>
                <div className="text-sm text-purple-600">Condizioni</div>
                <div className="text-xs text-muted-foreground mt-2">Trend: miglioramento</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts and Warnings */}
        <Card className="shadow-card-soft mb-12 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Avvisi e Raccomandazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-yellow-800 text-sm">Possibile Inversione Termica</div>
                  <div className="text-xs text-yellow-700">Monitorare dalle 19:00 - Rischio deriva aumentato</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <div className="font-semibold text-green-800 text-sm">Finestra Ottimale Identificata</div>
                  <div className="text-xs text-green-700">06:00-09:00 - Condizioni ideali per trattamenti</div>
                </div>
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
              <Activity className="w-5 h-5 mr-2" />
              Visualizza Analisi Completa
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Accedi all'analisi dettagliata delle condizioni per la tua area
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConditionsAnalysis;