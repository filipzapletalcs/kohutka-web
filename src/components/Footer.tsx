import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const googleMapsLink = "https://www.google.com/maps/dir//SKI+CENTRUM+KOH%C3%9ATKA,+a.s.+Nov%C3%BD+Hrozenkov+241+756+04+Nov%C3%BD+Hrozenkov/@49.2951606,18.230488,14z";

  return (
    <footer className="bg-gradient text-primary-foreground relative overflow-hidden">
      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05),transparent_50%)]" />

      {/* Main Footer Content */}
      <div className="container mx-auto max-w-7xl px-4 py-10 md:py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Column 1: Company Info & Address */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-5 tracking-wide">SKI CENTRUM KOHÚTKA</h3>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 hover:text-accent transition-all duration-200 group hover:translate-x-1"
            >
              <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5 group-hover:text-accent transition-colors" />
              <div>
                <p className="font-semibold">Nový Hrozenkov 241</p>
                <p className="text-sm opacity-90">756 04 Nový Hrozenkov</p>
                <p className="text-xs opacity-80 mt-1 group-hover:opacity-100 transition-opacity">Klikněte pro navigaci</p>
              </div>
            </a>
          </div>

          {/* Column 2: Contact Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-5 tracking-wide">Kontakt</h3>

            {/* Ski Centrum */}
            <div className="space-y-2.5">
              <p className="text-sm font-bold opacity-95">SkI CENTRUM KOHÚTKA</p>
              <a
                href="tel:+420725005725"
                className="flex items-center gap-2.5 hover:text-accent transition-all duration-200 text-sm hover:translate-x-1 group"
              >
                <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-medium">+420 725 005 725</span>
              </a>
              <a
                href="mailto:ski@kohutka.ski"
                className="flex items-center gap-2.5 hover:text-accent transition-all duration-200 text-sm hover:translate-x-1 group"
              >
                <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-medium">ski@kohutka.ski</span>
              </a>
            </div>

            {/* Infocentrum */}
            <div className="space-y-2.5 pt-3">
              <p className="text-sm font-bold opacity-95">Infocentrum</p>
              <a
                href="tel:+420571160800"
                className="flex items-center gap-2.5 hover:text-accent transition-all duration-200 text-sm hover:translate-x-1 group"
              >
                <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-medium">+420 571 160 800</span>
              </a>
              <a
                href="mailto:infocentrum@kohutka.info"
                className="flex items-center gap-2.5 hover:text-accent transition-all duration-200 text-sm hover:translate-x-1 group"
              >
                <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-medium">infocentrum@kohutka.info</span>
              </a>
            </div>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-5 tracking-wide">Sledujte nás</h3>
            <div className="space-y-4">
              <a
                href="https://www.facebook.com/SKI.CENTRUM.KOHUTKA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-accent transition-all duration-200 group hover:translate-x-1"
              >
                <div className="w-11 h-11 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-200 shadow-lg group-hover:shadow-xl">
                  <Facebook className="h-5 w-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <p className="font-bold">Facebook</p>
                  <p className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">SKI.CENTRUM.KOHUTKA</p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/ski_centrum_kohutka"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-accent transition-all duration-200 group hover:translate-x-1"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-200 shadow-lg group-hover:shadow-xl">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold">Instagram</p>
                  <p className="text-xs opacity-80 group-hover:opacity-100 transition-opacity">@ski_centrum_kohutka</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & EffiStream */}
      <div className="border-t border-primary-foreground/30 bg-black/10 relative z-10">
        <div className="container mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <p className="opacity-90 text-center md:text-left font-medium">
                © 2025 SKI CENTRUM KOHÚTKA, a.s. - Lyžařské středisko v srdci Valašska
              </p>
              <Link
                to="/cookies"
                className="opacity-85 hover:opacity-100 hover:text-accent transition-all duration-200 font-medium"
              >
                Zásady cookies
              </Link>
              <span className="hidden md:inline opacity-50">|</span>
              <Link
                to="/ochrana-udaju"
                className="opacity-85 hover:opacity-100 hover:text-accent transition-all duration-200 font-medium"
              >
                Ochrana osobních údajů
              </Link>
            </div>
            <a
              href="https://effistream.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-85 hover:opacity-100 hover:text-accent transition-all duration-200 font-semibold hover:translate-x-1 inline-block"
            >
              Powered by EffiStream →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
