import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, Download } from "lucide-react";
import mapaPDF from "@/assets/Ski_Centrum_Kohutka_Mapa.pdf";

const InteractiveMap = () => {
  return (
    <section className="pt-8 pb-20 bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Map className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Mapa areálu</h2>
          </div>
          <p className="text-lg text-muted-foreground">
            Prozkoumejte všechny sjezdovky, vleky a lanovky v našem ski areálu
          </p>
        </div>

        {/* Map Card */}
        <Card className="glass overflow-hidden border-white/20 rounded-lg">
          <div className="w-full bg-white aspect-[4/3]">
            <object
              data={`${mapaPDF}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              type="application/pdf"
              className="w-full h-full"
              title="Mapa ski areálu Kohútka"
            >
              <p className="p-8 text-center">
                Váš prohlížeč nepodporuje zobrazení PDF.
                <a href={mapaPDF} className="text-primary underline ml-2">
                  Stáhněte si mapu zde
                </a>
              </p>
            </object>
          </div>

          {/* Footer with download button */}
          <div className="p-4 md:p-6 bg-primary/5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Mapa ski areálu Kohútka s vyznačením všech sjezdovek, vleků a lanovek
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
