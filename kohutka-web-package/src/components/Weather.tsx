import { CloudSnow } from "lucide-react";
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

  // Meteoblue "three" widget based on your snippet
  // Mobile: 3 dny (kompaktní náhled)
  const mobileWidgetUrl =
    "https://www.meteoblue.com/cs/weather/widget/three/nov%c3%bd-hrozenkov_czechia_3069308?geoloc=fixed&nocurrent=0&noforecast=0&days=3&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&layout=image&user_key=69fc26ded3c243c7&embed_key=e7c3668d2023e303&sig=47fcb56ceb3694a5c47d17bad12fc0ce226453ab22463d71863de2072f1f5791";

  // Desktop: 7 dní, stejný design, jen delší horizontální přehled
  const desktopWidgetUrl =
    "https://www.meteoblue.com/cs/weather/widget/three/nov%c3%bd-hrozenkov_czechia_3069308?geoloc=fixed&nocurrent=0&noforecast=0&days=7&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&layout=image&user_key=69fc26ded3c243c7&embed_key=e7c3668d2023e303&sig=47fcb56ceb3694a5c47d17bad12fc0ce226453ab22463d71863de2072f1f5791";

  return (
    <section className="pt-6 pb-10 md:pt-8 md:pb-14 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-6 md:mb-10">
          <div className="flex items-center justify-center gap-3 mb-3 md:mb-4">
            <CloudSnow className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h2 className="text-2xl md:text-4xl font-bold">Předpověď počasí</h2>
          </div>
          <p className="text-base md:text-lg text-muted-foreground">
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
                  Nový Hrozenkov / Kohútka
                </h3>
                <p className="text-xs text-gray-600">
                  Meteoblue grafická předpověď, horská oblast Valašsko
                </p>
              </div>
            </div>
          </div>

          <div className="relative w-full overflow-x-auto">
            {/* Meteoblue widget – plná šířka, responsivní */}
            <div className="min-w-[320px] md:min-w-full">
              <iframe
                key={isMobile ? "mobile-three" : "desktop-three"}
                src={isMobile ? mobileWidgetUrl : desktopWidgetUrl}
                frameBorder="0"
                scrolling="no"
                allowTransparency={true}
                sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
                style={{
                  width: "100%",
                  height: isMobile ? "520px" : "588px",
                  border: "0",
                  overflow: "hidden",
                }}
                title="Meteoblue weather widget"
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
