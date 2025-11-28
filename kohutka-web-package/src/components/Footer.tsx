import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

const Footer = () => {
  const googleMapsLink = "https://www.google.com/maps/dir//SKI+CENTRUM+KOH%C3%9ATKA,+a.s.+Nov%C3%BD+Hrozenkov+241+756+04+Nov%C3%BD+Hrozenkov/@49.2951606,18.230488,14z";

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Column 1: Company Info & Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">SKI CENTRUM KOHÚTKA</h3>
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 hover:text-accent transition-colors group"
            >
              <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5 group-hover:text-accent" />
              <div>
                <p className="font-medium">Nový Hrozenkov 241</p>
                <p className="text-sm opacity-90">756 04 Nový Hrozenkov</p>
                <p className="text-xs opacity-70 mt-1">Klikněte pro navigaci</p>
              </div>
            </a>
          </div>

          {/* Column 2: Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Kontakt</h3>

            {/* Ski Centrum */}
            <div className="space-y-2">
              <p className="text-sm font-semibold opacity-90">Ski Centrum</p>
              <a
                href="tel:+420725005725"
                className="flex items-center gap-2 hover:text-accent transition-colors text-sm"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                +420 725 005 725
              </a>
              <a
                href="mailto:ski@kohutka.ski"
                className="flex items-center gap-2 hover:text-accent transition-colors text-sm"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                ski@kohutka.ski
              </a>
            </div>

            {/* Infocentrum */}
            <div className="space-y-2 pt-2">
              <p className="text-sm font-semibold opacity-90">Infocentrum</p>
              <a
                href="tel:+420571160800"
                className="flex items-center gap-2 hover:text-accent transition-colors text-sm"
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                +420 571 160 800
              </a>
              <a
                href="mailto:infocentrum@kohutka.info"
                className="flex items-center gap-2 hover:text-accent transition-colors text-sm"
              >
                <Mail className="h-4 w-4 flex-shrink-0" />
                infocentrum@kohutka.info
              </a>
            </div>
          </div>

          {/* Column 3: Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold mb-4">Sledujte nás</h3>
            <div className="space-y-3">
              <a
                href="https://www.facebook.com/SKI.CENTRUM.KOHUTKA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-accent transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Facebook className="h-5 w-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <p className="font-semibold">Facebook</p>
                  <p className="text-xs opacity-70">SKI.CENTRUM.KOHUTKA</p>
                </div>
              </a>

              <a
                href="https://www.instagram.com/ski_centrum_kohutka"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-accent transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Instagram className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold">Instagram</p>
                  <p className="text-xs opacity-70">@ski_centrum_kohutka</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & EffiStream */}
      <div className="border-t border-primary-foreground/20">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-sm">
            <p className="opacity-80 text-center md:text-left">
              © 2025 SKI CENTRUM KOHÚTKA, a.s. - Lyžařské středisko v srdci Valašska
            </p>
            <a
              href="https://effistream.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-80 hover:opacity-100 hover:text-accent transition-all font-medium"
            >
              Powered by EffiStream
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
