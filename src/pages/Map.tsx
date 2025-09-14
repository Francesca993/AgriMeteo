import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
// Vite-friendly imports for leaflet marker images
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png?url';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  Wind, 
  Thermometer, 
  Droplets, 
  MapPin, 
  Download,
  Share2,
  AlertTriangle
} from 'lucide-react';

// Fix default icon paths for leaflet when using bundlers
// Ensure default icon images are set correctly (avoid runtime require in browser)
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
} catch (e) {
  // ignore
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl
});

const center = { lat: 44.4968, lng: 11.3548 }; // default center (Italy)

function ClickHandler({ onSelect }: { onSelect: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
}

const Map = () => {
  const [selectedArea, setSelectedArea] = useState<{ lat: number; lng: number } | null>(null);

  const mockWeatherData = {
    current: {
      temperature: 22,
      humidity: 65,
      windSpeed: 3.2,
      precipitation: 0,
    },
    forecast: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      temperature: 20 + Math.random() * 8,
      humidity: 60 + Math.random() * 30,
      windSpeed: 2 + Math.random() * 6,
      precipitation: Math.random() * 2,
      sprayability: Math.random() > 0.4 ? (Math.random() > 0.3 ? 'Buona' : 'Discreta') : 'Scarsa'
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Map Area */}
        <div className="flex-1 relative">
          <MapContainer {...({ center: [center.lat, center.lng], zoom: 6, className: 'w-full h-full' } as any)}>
            <TileLayer {...({ attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' } as any)} />
            <ClickHandler onSelect={(latlng) => setSelectedArea(latlng)} />

            {selectedArea && (
              <>
                <Marker position={[selectedArea.lat, selectedArea.lng]} />
                <Circle
                  center={[selectedArea.lat, selectedArea.lng]}
                  {...({ radius: 250, pathOptions: { color: '#16a34a', opacity: 0.5 } } as any)}
                />
              </>
            )}
          </MapContainer>

          <div className="absolute top-4 left-4 z-50">
            <Card className="shadow-card-soft">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Clicca sulla mappa per selezionare un'area</p>
                {selectedArea && (
                  <div className="text-xs text-foreground">
                    Lat: {selectedArea.lat.toFixed(5)}, Lng: {selectedArea.lng.toFixed(5)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-background border-l border-border overflow-y-auto">
          {!selectedArea ? (
            <div className="p-6 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Seleziona un'area</h3>
              <p className="text-muted-foreground">
                Clicca sulla mappa per visualizzare i dati meteo e gli indici di sprayability
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Current Weather */}
              <Card className="shadow-card-soft">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Cloud className="w-5 h-5 mr-2 text-primary" />
                    Condizioni Attuali
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-agricultural-earth" />
                      <span className="text-sm">{mockWeatherData.current.temperature}°C</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-4 h-4 text-agricultural-sky" />
                      <span className="text-sm">{mockWeatherData.current.humidity}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="w-4 h-4 text-agricultural-green" />
                      <span className="text-sm">{mockWeatherData.current.windSpeed} m/s</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Cloud className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{mockWeatherData.current.precipitation} mm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sprayability Index */}
              <Card className="shadow-card-soft">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <AlertTriangle className="w-5 h-5 mr-2 text-primary" />
                    Indice Sprayability (24h)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {mockWeatherData.forecast.slice(0, 24).map((hour) => (
                      <div key={hour.hour} className="flex items-center justify-between py-1">
                        <span className="text-sm text-muted-foreground">
                          {hour.hour.toString().padStart(2, '0')}:00
                        </span>
                        <Badge 
                          variant={
                            hour.sprayability === 'Buona' ? 'default' : 
                            hour.sprayability === 'Discreta' ? 'secondary' : 
                            'destructive'
                          }
                          className="text-xs"
                        >
                          {hour.sprayability}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Windows */}
              <Card className="shadow-card-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Finestre Consigliate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-semibold text-green-800 text-sm">06:00 - 09:00</div>
                      <div className="text-xs text-green-600">Condizioni ideali per il trattamento</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="font-semibold text-green-800 text-sm">18:00 - 21:00</div>
                      <div className="text-xs text-green-600">Vento calmo, temperatura ottimale</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export Actions */}
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Condividi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;