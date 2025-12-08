import { MapPin, Phone, Mail, Clock, Navigation as NavigationIcon, Car, Bus, ParkingCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const Location = () => {
  // Correct coordinates for SKI CENTRUM KOHÚTKA - 49.2951606, 18.230488
  const address = "Nový Hrozenkov 241, 756 04";
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2602.3!2d18.230488!3d49.2951606!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47147f3bee77ddc5%3A0x5153436e011669ee!2sSKI%20CENTRUM%20KOH%C3%9ATKA%2C%20a.s.!5e0!3m2!1scs!2scz!4v1234567890123!5m2!1scs!2scz`;
  const googleMapsLink = `https://www.google.com/maps/dir//SKI+CENTRUM+KOH%C3%9ATKA,+a.s.+Nov%C3%BD+Hrozenkov+241+756+04+Nov%C3%BD+Hrozenkov/@49.2951606,18.230488,14z`;

  const contactInfo = [
    {
      icon: MapPin,
      label: "Adresa",
      value: address,
      link: googleMapsLink,
    },
    {
      icon: Phone,
      label: "Telefon",
      value: "+420 725 005 725",
      link: "tel:+420725005725",
    },
    {
      icon: Mail,
      label: "Email",
      value: "ski@kohutka.ski",
      link: "mailto:ski@kohutka.ski",
    },
    {
      icon: Clock,
      label: "Provozní doba",
      value: "Denně 8:00 - 16:00",
      link: null,
    },
  ];

  const transportInfo = [
    {
      icon: Car,
      title: "Autem",
      description: "Z Brna nebo Olomouce po dálnici D1, exit Hulín směr Valašské Meziříčí. Dále po silnici I/57 směr Velké Karlovice a Nový Hrozenkov.",
    },
    {
      icon: Bus,
      title: "Autobusem",
      description: 'Pravidelné autobusové spojení z Vsetína a Valašského Meziříčí. Zastávka "Nový Hrozenkov, Kohútka".',
    },
    {
      icon: ParkingCircle,
      title: "Parkování",
      description: "Placené parkování přímo u sjezdovek. Úhrada u obsluhy nebo v pokladnách areálu.",
    },
  ];

  return (
    <section className="pt-4 pb-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Kde nás najdete
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            SKI CENTRUM KOHÚTKA v srdci Valašska
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-8 items-stretch">
          {/* Map Section */}
          <div className="order-2 lg:order-1 flex">
            <Card className="glass overflow-hidden border-white/20 rounded-lg flex flex-col w-full">
              <div className="relative w-full h-[400px] lg:min-h-[600px] lg:flex-1">
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa - SKI CENTRUM KOHÚTKA"
                  className="rounded-lg"
                />
              </div>
              <div className="p-6">
                <a
                  href={googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-primary/90 hover:bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-colors duration-300 w-full justify-center"
                >
                  <NavigationIcon className="h-5 w-5" />
                  Navigovat na Google Maps
                </a>
              </div>
            </Card>
          </div>

          {/* Contact Info Section */}
          <div className="order-1 lg:order-2 space-y-4 md:space-y-6 flex flex-col">
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h3 className="text-2xl font-bold mb-6">Kontaktní informace</h3>
              <div className="space-y-6">
                {contactInfo.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {item.label}
                      </p>
                      {item.link ? (
                        <a
                          href={item.link}
                          target={item.link.startsWith("http") ? "_blank" : undefined}
                          rel={item.link.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-lg font-semibold hover:text-primary transition-colors duration-300"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-lg font-semibold">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Additional Info Card */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Jak se k nám dostanete</h3>
              <div className="space-y-4">
                {transportInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/90 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <item.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground mb-2">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;
