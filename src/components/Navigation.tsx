import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Camera, Home, DollarSign, Mail, Ticket } from "lucide-react";
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient text-primary-foreground border-b border-primary-foreground/30 shadow-xl backdrop-blur-sm">
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3" aria-label="Přejít na úvodní stránku">
            <img src={logo} alt="SKI CENTRUM KOHÚTKA logo" className="h-16 md:h-12 w-auto" />
            <span className="font-bold text-xl hidden sm:inline text-primary-foreground" aria-hidden="true">SKI CENTRUM KOHÚTKA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden min-[1195px]:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                {isActive(item.path) ? (
                  <div
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold transition-all duration-200 h-11 px-5 py-2 bg-white text-primary hover:bg-white hover:shadow-lg shadow-md"
                    aria-label={`Přejít na ${item.name}`}
                    aria-current="page"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground transition-all duration-200 h-11 font-bold"
                    aria-label={`Přejít na ${item.name}`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                )}
              </Link>
            ))}

            {/* Prominent CTA Button */}
            <a
              href="https://valassko.ski/shop-kohutka"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-3 inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:scale-105"
            >
              <Ticket className="h-5 w-5" />
              Koupit skipas online
            </a>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="min-[1195px]:hidden text-primary-foreground hover:bg-primary-foreground/15 transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Zavřít menu" : "Otevřít menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="min-[1195px]:hidden py-4 space-y-3 border-t border-primary-foreground/20">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
              >
                {isActive(item.path) ? (
                  <div
                    className="flex items-center justify-start whitespace-nowrap rounded-full text-sm font-bold transition-all duration-200 h-11 px-5 py-2 w-full bg-white text-primary hover:bg-white shadow-md hover:shadow-lg"
                    aria-label={`Přejít na ${item.name}`}
                    aria-current="page"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground transition-all duration-200 h-11 font-bold"
                    aria-label={`Přejít na ${item.name}`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                )}
              </Link>
            ))}

            {/* Prominent CTA Button for Mobile */}
            <a
              href="https://valassko.ski/shop-kohutka"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Ticket className="h-5 w-5" />
              Koupit skipas online
            </a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
