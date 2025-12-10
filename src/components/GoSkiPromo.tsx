import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Wrench,
  Package,
  Phone,
  ExternalLink,
} from "lucide-react";
import heroImage from "@/assets/P01Slider-Slide03.jpg";

const services = [
  {
    icon: GraduationCap,
    title: "Lyžařská škola",
    description: "Profesionální instruktoři pro začátečníky i pokročilé",
  },
  {
    icon: Package,
    title: "Půjčovna vybavení",
    description: "Kompletní lyžařské a snowboardové vybavení",
  },
  {
    icon: Wrench,
    title: "Servis lyží",
    description: "Profesionální údržba a opravy vašeho vybavení",
  },
];

const GoSkiPromo = () => {
  return (
    <section className="py-16 md:py-20 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Lyžařská škola
          </h2>
          <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto">
            Profesionální výuka lyžování a snowboardingu přímo v areálu Kohútka
          </p>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* Left - Image */}
          <Card className="glass overflow-hidden border-white/20 rounded-lg h-full">
            <div className="relative h-full min-h-[300px] md:min-h-[400px]">
              <img
                src={heroImage}
                alt="Lyžařská škola GoSki - výuka lyžování"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay badge */}
              <div className="absolute top-4 left-4">
                <div className="glass px-4 py-2 rounded-full border-white/30">
                  <span className="text-sm font-semibold text-primary">
                    Partner areálu
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Right - Content */}
          <div className="flex flex-col h-full">
            <Card className="glass py-6 px-5 md:py-8 md:px-8 border-white/20 rounded-lg flex-grow">
              <div className="space-y-5 md:space-y-6">
                {/* Services */}
                {services.map((service) => (
                  <div
                    key={service.title}
                    className="flex items-start gap-4 group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <service.icon className="w-6 h-6 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {service.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {service.description}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Divider */}
                <div className="border-t border-white/10 pt-5 md:pt-6">
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    Zkušení instruktoři, individuální přístup a moderní metody výuky
                    zaručí rychlý pokrok a zábavu na svahu pro celou rodinu.
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      asChild
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-lg"
                    >
                      <a href="https://goski.cz" target="_blank" rel="noopener noreferrer">
                        Navštívit web
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>

                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-primary/30 hover:bg-primary/5 font-medium"
                    >
                      <a href="tel:+420774155385">
                        <Phone className="mr-2 h-4 w-4" />
                        +420 774 155 385
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoSkiPromo;
