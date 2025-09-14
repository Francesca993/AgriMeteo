import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Info } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-agricultural rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AGRIMETEO</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {location.pathname !== '/map' && (
            <Button 
              asChild 
              className="bg-gradient-agricultural hover:opacity-90 text-primary-foreground shadow-agricultural"
            >
              <Link to="/map">
                <MapPin className="w-4 h-4 mr-2" />
                Apri Mappa
              </Link>
            </Button>
          )}

          {/* Added navigation links to the main pages requested */}
          <NavLink
            to="/selezione-aree"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/10'}`
            }
          >
            Selezione Aree
          </NavLink>

          <NavLink
            to="/dati-meteo"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/10'}`
            }
          >
            Dati Meteo
          </NavLink>

          <NavLink
            to="/indici-sprayability"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/10'}`
            }
          >
            Indici Sprayability
          </NavLink>

          <NavLink
            to="/analisi-condizioni"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/10'}`
            }
          >
            Analisi Condizioni
          </NavLink>

          <Button variant="ghost" asChild>
            <Link to="/about">
              <Info className="w-4 h-4 mr-2" />
              About
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Navigation;