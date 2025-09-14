import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { 
  Cloud, 
  Thermometer, 
  Wind, 
  Droplets,
  Eye,
  Clock,
  Gauge,
  ArrowRight,
  TrendingUp,
  CloudRain,
  Sun,
  CloudSnow
} from 'lucide-react';

const WeatherData = () => {
  const mockCurrentData = {
    temperature: 22.5,
    humidity: 68,
    windSpeed: 4.2,
    windDirection: 'NE',
    pressure: 1013.2,
    visibility: 15,
    precipitation: 0.2,
    cloudCover: 35
  };

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural mb-4">
            Dati Meteorologici
          </Badge>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Previsioni Meteorologiche di Precisione
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Dati meteorologici aggiornati in tempo reale e previsioni precise fino a 48 ore, 
            specificamente calibrati per le esigenze dell'agricoltura moderna.
          </p>
        </div>

        {/* Current Weather Dashboard */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Cloud className="w-6 h-6 mr-3 text-primary" />
              Condizioni Attuali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
                <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">{mockCurrentData.temperature}°C</div>
                <div className="text-sm text-red-600">Temperatura</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">{mockCurrentData.humidity}%</div>
                <div className="text-sm text-blue-600">Umidità Relativa</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <Wind className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{mockCurrentData.windSpeed} m/s</div>
                <div className="text-sm text-green-600">Vento {mockCurrentData.windDirection}</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                <CloudRain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">{mockCurrentData.precipitation} mm</div>
                <div className="text-sm text-purple-600">Precipitazioni</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Fonti dei Dati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-semibold text-sm">Open-Meteo</div>
                  <div className="text-xs text-muted-foreground">Dati principali</div>
                </div>
                <Badge variant="default">Primaria</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-semibold text-sm">MET Norway</div>
                  <div className="text-xs text-muted-foreground">Backup europeo</div>
                </div>
                <Badge variant="secondary">Fallback</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-semibold text-sm">Stazioni Locali</div>
                  <div className="text-xs text-muted-foreground">Calibrazione</div>
                </div>
                <Badge variant="outline">Ausiliario</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Frequenza Aggiornamenti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dati Attuali</span>
                  <Badge variant="default">10 min</Badge>
                </div>
                <Progress value={100} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Previsioni 6h</span>
                  <Badge variant="default">30 min</Badge>
                </div>
                <Progress value={85} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Previsioni 48h</span>
                  <Badge variant="secondary">2 ore</Badge>
                </div>
                <Progress value={70} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parameters Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Parametri di Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm">Temperatura (°C)</span>
                  </div>
                  <Badge variant="outline">±0.5°C</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm">Umidità Relativa (%)</span>
                  </div>
                  <Badge variant="outline">±3%</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Velocità Vento (m/s)</span>
                  </div>
                  <Badge variant="outline">±0.8 m/s</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CloudRain className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-sm">Precipitazioni (mm)</span>
                  </div>
                  <Badge variant="outline">±0.1 mm</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Parametri Avanzati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 text-orange-500 mr-2" />
                    <span className="text-sm">Pressione (hPa)</span>
                  </div>
                  <Badge variant="outline">±1 hPa</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm">Visibilità (km)</span>
                  </div>
                  <Badge variant="outline">±2 km</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sun className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm">Radiazione UV</span>
                  </div>
                  <Badge variant="outline">Indice</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CloudSnow className="w-4 h-4 text-cyan-500 mr-2" />
                    <span className="text-sm">Punto di Rugiada (°C)</span>
                  </div>
                  <Badge variant="outline">±0.8°C</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Indici Derivati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Temperatura Percepita</span>
                  <Badge className="bg-red-100 text-red-800">Calcolato</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Windchill</span>
                  <Badge className="bg-blue-100 text-blue-800">Calcolato</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Evapotraspirazione</span>
                  <Badge className="bg-green-100 text-green-800">Calcolato</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bagnatura Fogliare</span>
                  <Badge className="bg-purple-100 text-purple-800">Stimato</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quality Indicators */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle>Qualità e Affidabilità dei Dati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700 mb-1">98%</div>
                <div className="text-sm text-green-600">Disponibilità</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-1">±2°C</div>
                <div className="text-sm text-blue-600">Precisione T°</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-700 mb-1">±15%</div>
                <div className="text-sm text-purple-600">Errore Pioggia</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-700 mb-1">10 min</div>
                <div className="text-sm text-orange-600">Latenza Max</div>
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
              <Cloud className="w-5 h-5 mr-2" />
              Visualizza Dati Meteorologici Live
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Accesso completo ai dati meteorologici per la tua area
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherData;