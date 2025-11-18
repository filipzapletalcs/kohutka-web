import { useEffect } from "react";
import { Card } from "@/components/ui/card";

const FacebookFeed = () => {
  useEffect(() => {
    // Load Elfsight script
    const script = document.createElement('script');
    script.src = 'https://elfsightcdn.com/platform.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="pb-8 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4 mb-12">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Novinky z Kohútky
          </h2>
          <p className="text-lg text-muted-foreground">
            Aktuální příspěvky a novinky z našeho Facebooku
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Elfsight Facebook Feed Widget */}
        <Card className="glass overflow-hidden border-white/20 rounded-lg shadow-lg mb-8">
          <div className="w-full">
            <div
              className="elfsight-app-015f8fdb-935f-4f87-b961-ffe533eefcc8"
              data-elfsight-app-lazy
            />
          </div>
        </Card>
      </div>
    </section>
  );
};

export default FacebookFeed;
