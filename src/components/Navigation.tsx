import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Info, Menu, X } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const mainLinks = [
    { to: '/dati-meteo', label: 'Dati Meteo' },
    { to: '/indici-sprayability', label: 'Indici Sprayability' },
    { to: '/analisi-condizioni', label: 'Analisi Condizioni' },
  ];

  const primaryLinkClass = (isActive: boolean) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/10'
    }`;

  const mapLinkClass = (isActive: boolean) =>
    `px-3 py-2 rounded-md text-sm font-medium flex items-center ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'bg-gradient-agricultural hover:opacity-90 text-primary-foreground shadow-agricultural'
    }`;

  const mobileLinkClass = (isActive: boolean) =>
    `block rounded-md px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/10'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-agricultural rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">AGRIMETEO</span>
        </Link>

        <div className="hidden lg:flex items-center space-x-4">
          <NavLink to="/map" className={({ isActive }) => mapLinkClass(isActive)}>
            <MapPin className="w-4 h-4 mr-2" />
            Apri Mappa
          </NavLink>

          {mainLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => primaryLinkClass(isActive)}>
              {label}
            </NavLink>
          ))}

          <Button variant="ghost" asChild>
            <Link to="/about">
              <Info className="w-4 h-4 mr-2" />
              About
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-border p-2 text-foreground transition hover:bg-muted lg:hidden"
          aria-label={mobileMenuOpen ? 'Chiudi il menu di navigazione' : 'Apri il menu di navigazione'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <NavLink to="/map" className={({ isActive }) => mobileLinkClass(isActive)}>
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Apri Mappa
              </span>
            </NavLink>

            {mainLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} className={({ isActive }) => mobileLinkClass(isActive)}>
                {label}
              </NavLink>
            ))}

            <Button variant="ghost" asChild className="w-full justify-start">
              <Link to="/about">
                <Info className="w-4 h-4 mr-2" />
                About
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
