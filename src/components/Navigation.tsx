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
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" aria-label="Přejít na úvodní stránku">
            <img src={logo} alt="Ski Kohútka logo" className="h-16 md:h-12 w-auto" />
            <span className="font-bold text-xl hidden sm:inline" aria-hidden="true">Ski Kohútka</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={
                    isActive(item.path)
                      ? "bg-primary/90 text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "text-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  }
                  aria-label={`Přejít na ${item.name}`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
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
            className="md:hidden"
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
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive(item.path)
                      ? "bg-primary/90 text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : "text-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  }`}
                  aria-label={`Přejít na ${item.name}`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
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
