import { Phone, Mail, Navigation as NavigationIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import DirectionsInfo from "@/components/DirectionsInfo";
import CompanyDetails from "@/components/CompanyDetails";
import Footer from "@/components/Footer";

const Contact = () => {
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2602.3!2d18.230488!3d49.2951606!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47147f3bee77ddc5%3A0x5153436e011669ee!2sSKI%20CENTRUM%20KOH%C3%9ATKA%2C%20a.s.!5e0!3m2!1scs!2scz!4v1234567890123!5m2!1scs!2scz`;
  const googleMapsLink = `https://www.google.com/maps/dir//SKI+CENTRUM+KOH%C3%9ATKA,+a.s.+Nov%C3%BD+Hrozenkov+241+756+04+Nov%C3%BD+Hrozenkov/@49.2951606,18.230488,14z`;

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-8">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Kontakt</h1>
          <p className="text-lg text-muted-foreground">
            SKI CENTRUM KOHÚTKA, a.s.
          </p>
        </div>
      </section>

      {/* Main Contact Section - Contact Info + Map */}
      <section className="py-8">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-[1fr,1.5fr] gap-4 md:gap-8">
            {/* Contact Information - LEFT */}
            <div className="space-y-4 md:space-y-6">
              {/* Ski Centrum */}
              <Card className="glass p-6 border-white/20 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Ski Centrum</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefon</p>
                      <a
                        href="tel:+420725005725"
                        className="text-lg font-semibold hover:text-primary transition-colors"
                      >
                        +420 725 005 725
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href="mailto:ski@kohutka.ski"
                        className="text-lg font-semibold hover:text-primary transition-colors break-all"
                      >
                        ski@kohutka.ski
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Infocentrum */}
              <Card className="glass p-6 border-white/20 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Infocentrum</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon CZ</p>
                        <a
                          href="tel:+420571160800"
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          +420 571 160 800
                        </a>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon SK</p>
                        <a
                          href="tel:+421422028602"
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          +421 422 028 602
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href="mailto:infocentrum@kohutka.info"
                        className="text-lg font-semibold hover:text-primary transition-colors break-all"
                      >
                        infocentrum@kohutka.info
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Social Media - LEFT BOTTOM */}
              <Card className="glass p-6 border-white/20 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Sledujte nás</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Aktuální informace o sněhových podmínkách a novinkách
                </p>
                <div className="space-y-3">
                  <a
                    href="https://www.facebook.com/SKI.CENTRUM.KOHUTKA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Facebook</p>
                      <p className="text-xs text-muted-foreground">SKI.CENTRUM.KOHUTKA</p>
                    </div>
                  </a>
                  <a
                    href="https://www.instagram.com/ski_centrum_kohutka"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold group-hover:text-primary transition-colors">Instagram</p>
                      <p className="text-xs text-muted-foreground">@ski_centrum_kohutka</p>
                    </div>
                  </a>
                </div>
              </Card>
            </div>

            {/* Map - RIGHT */}
            <Card className="glass overflow-hidden border-white/20 rounded-lg">
              <div className="relative w-full h-[300px] md:h-[500px] lg:h-full lg:min-h-[500px]">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa - Ski Centrum Kohútka"
                />
              </div>
              <div className="p-6">
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-semibold transition-colors duration-300 w-full justify-center"
                >
                  <NavigationIcon className="h-5 w-5" />
                  Navigovat na místo
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Directions Component */}
      <DirectionsInfo />

      {/* Company Details Component */}
      <CompanyDetails />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
