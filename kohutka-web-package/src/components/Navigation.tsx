import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Camera, Home, DollarSign, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Úvod", path: "/", icon: Home },
    { name: "Webkamery", path: "/kamery", icon: Camera },
    { name: "Ceník", path: "/cenik", icon: DollarSign },
    { name: "Kontakt", path: "/kontakt", icon: Mail },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground border-b border-primary-foreground/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" aria-label="Přejít na úvodní stránku">
            <img src={logo} alt="Ski Kohútka logo" className="h-16 md:h-12 w-auto" />
            <span className="font-bold text-xl hidden sm:inline text-primary-foreground" aria-hidden="true">Ski Kohútka</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                {isActive(item.path) ? (
                  <div
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-white/90 text-foreground hover:bg-white hover:text-foreground"
                    aria-label={`Přejít na ${item.name}`}
                    aria-current="page"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    aria-label={`Přejít na ${item.name}`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                )}
              </Link>
            ))}
            <Button asChild className="ml-4 bg-accent hover:bg-accent/90 text-accent-foreground">
              <a href="https://valassko.ski/shop-kohutka" target="_blank" rel="noopener noreferrer">
                Skipas Online
              </a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Zavřít menu" : "Otevřít menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
              >
                {isActive(item.path) ? (
                  <div
                    className="flex items-center justify-start whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 w-full bg-white/90 text-foreground hover:bg-white hover:text-foreground"
                    aria-label={`Přejít na ${item.name}`}
                    aria-current="page"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                    aria-label={`Přejít na ${item.name}`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                )}
              </Link>
            ))}
            <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <a href="https://valassko.ski/shop-kohutka" target="_blank" rel="noopener noreferrer">
                Skipas Online
              </a>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
