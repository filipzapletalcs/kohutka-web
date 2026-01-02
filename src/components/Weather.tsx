import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";

const Weather = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Meteoblue "three" widget - Kohútka (49.296N, 18.229E, 878m)
  // Mobile: 3 dny (kompaktní náhled)
  const mobileWidgetUrl =
    "https://www.meteoblue.com/cs/po%C4%8Das%C3%AD/widget/three/Koh%C3%BAtka_49.296N18.229E878_Europe%2FPrague?geoloc=fixed&nocurrent=0&noforecast=0&days=3&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&layout=image&user_key=69fc26ded3c243c7&embed_key=2a96f0909419f56b&sig=3ae2055847592d6e0c718ca0a9a6fbbb8053a106f31f40571a5619515ac21429";

  // Desktop: 7 dní, stejný design, jen delší horizontální přehled
  const desktopWidgetUrl =
    "https://www.meteoblue.com/cs/po%C4%8Das%C3%AD/widget/three/Koh%C3%BAtka_49.296N18.229E878_Europe%2FPrague?geoloc=fixed&nocurrent=0&noforecast=0&days=7&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&layout=image&user_key=69fc26ded3c243c7&embed_key=2a96f0909419f56b&sig=3ae2055847592d6e0c718ca0a9a6fbbb8053a106f31f40571a5619515ac21429";

  return (
    <section className="pt-6 pb-10 md:pt-8 md:pb-14 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Předpověď počasí
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            {isMobile
              ? "Přehled počasí na další 3 dny"
              : "Aktuální počasí a předpověď na týden"}
          </p>
        </div>

        <Card className="glass overflow-hidden border-white/20 rounded-lg">
          <div className="bg-white px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm md:text-base">
                  Kohútka (878 m n. m.)
                </h3>
                <p className="text-xs text-gray-600">
                  Meteoblue grafická předpověď, Valašsko
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full overflow-hidden md:overflow-x-auto touch-pan-y">
            {/* Meteoblue widget – plná šířka, responsivní */}
            <div className="w-full">
              <iframe
                key={isMobile ? "mobile-three" : "desktop-three"}
                src={isMobile ? mobileWidgetUrl : desktopWidgetUrl}
                sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                style={{
                  width: "100%",
                  height: isMobile ? "550px" : "630px",
                  border: "0",
                  overflow: "hidden",
                }}
                title="Meteoblue weather widget"
                {...{ allowtransparency: "true" }}
              />
            </div>
          </div>

          {/* meteoblue credit – zachování požadovaného odkazu */}
          <div className="p-3 md:p-4 bg-primary/5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <p className="text-center sm:text-left">
                Předpověď počasí poskytuje služba meteoblue.
              </p>
              <a
                href="https://www.meteoblue.com/en/weather/week/index"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors underline"
              >
                meteoblue – detailní týdenní předpověď
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Weather;
