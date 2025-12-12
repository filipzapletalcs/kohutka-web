import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import mapaPNG from "@/assets/Ski_Centrum_Kohutka_Mapa.png";
import mapaPDF from "@/assets/Ski_Centrum_Kohutka_Mapa.pdf";

const InteractiveMap = () => {
  return (
    <section className="pt-8 pb-10 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Mapa areálu
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Prozkoumejte všechny sjezdovky, vleky a lanovky v našem ski areálu
          </p>
        </div>

        {/* Map Card */}
        <Card className="glass overflow-hidden border-white/20 rounded-lg">
          <div className="w-full bg-white">
            <img
              src={mapaPNG}
              alt="Mapa SKI CENTRUM KOHÚTKA"
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>

          {/* Footer with download button */}
          <div className="p-4 md:p-6 bg-primary/5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Mapa SKI CENTRUM KOHÚTKA s vyznačením všech sjezdovek, vleků a lanovek
              </p>
              <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm">
                <a href={mapaPDF} download="Ski_Centrum_Kohutka_Mapa.pdf">
                  <Download className="mr-2 h-4 w-4" />
                  Stáhnout mapu PDF
                </a>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default InteractiveMap;
