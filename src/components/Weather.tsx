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

  // Mobile: 3 days, compact view
  const mobileWidgetUrl = "https://www.meteoblue.com/cs/weather/widget/daily/kohu%cc%81tka_%c4%8desko_3073493?geoloc=fixed&days=3&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=0&pictoicon=1&maxtemperature=0&maxtemperature=1&mintemperature=0&mintemperature=1&windspeed=0&windspeed=1&windgust=0&winddirection=0&winddirection=1&uv=0&humidity=0&precipitation=0&precipitation=1&precipitationprobability=0&precipitationprobability=1&spot=0&pressure=0&layout=light";

  // Desktop: 7 days
  const desktopWidgetUrl = "https://www.meteoblue.com/cs/weather/widget/daily/kohu%cc%81tka_%c4%8desko_3073493?geoloc=fixed&days=7&tempunit=CELSIUS&windunit=KILOMETER_PER_HOUR&precipunit=MILLIMETER&coloured=coloured&pictoicon=0&pictoicon=1&maxtemperature=0&maxtemperature=1&mintemperature=0&mintemperature=1&windspeed=0&windspeed=1&windgust=0&winddirection=0&winddirection=1&uv=0&humidity=0&precipitation=0&precipitation=1&precipitationprobability=0&precipitationprobability=1&spot=0&pressure=0&layout=light";

  return (
    <section className="pt-8 pb-20 px-2 md:px-4 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8 md:mb-12 px-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CloudSnow className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h2 className="text-2xl md:text-4xl font-bold">Předpověď počasí</h2>
          </div>
          <p className="text-base md:text-lg text-muted-foreground">
            {isMobile ? "3denní předpověď pro Kohútku" : "Aktuální počasí a 7denní předpověď pro Kohútku"}
          </p>
        </div>

        <Card className="glass overflow-hidden border-white/20 rounded-lg">
          <div className="relative w-full">
            {/* Meteoblue Widget - Responsive */}
            <iframe
              key={isMobile ? "mobile" : "desktop"}
              src={isMobile ? mobileWidgetUrl : desktopWidgetUrl}
              frameBorder="0"
              scrolling="no"
              allowTransparency={true}
              sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
              style={{
                width: "100%",
                height: isMobile ? "360px" : "420px",
              }}
              className="rounded-t-lg"
            />
          </div>

          {/* Footer with meteoblue credit */}
          <div className="p-4 bg-primary/5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
              <p className="text-center sm:text-left">Předpověď počasí pro lyžařské středisko Kohútka</p>
              <a
                href="https://www.meteoblue.com/cs/po%c4%8das%c3%ad/t%c3%bdden/kohu%cc%81tka_%c4%8desko_3073493"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <span>Více na meteoblue</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Weather;
