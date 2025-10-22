import { Link } from "react-router-dom";
import { Camera, CloudSnow, Mountain, TrendingUp, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusWidget } from "@/components/StatusWidget";
import Navigation from "@/components/Navigation";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section with gradient background */}
      <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="container mx-auto px-4 z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              SKI CENTRUM
              <span className="block text-accent mt-2">KOHÚTKA</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
              Lyžařské středisko v srdci Valašska
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6">
                <a href="https://valassko.ski/shop-kohutka" target="_blank" rel="noopener noreferrer">
                  Skipas Online
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8 py-6 backdrop-blur-sm">
                <Link to="/kamery">
                  <Camera className="mr-2 h-5 w-5" />
                  Live Kamery
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Status Widgets */}
      <section className="py-12 px-4 -mt-20 relative z-20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatusWidget
              icon={Mountain}
              label="Skiareál"
              value="mimo provoz"
              status="closed"
            />
            <StatusWidget
              icon={TrendingUp}
              label="Vleky a lanovky"
              value="0 z 6"
              status="closed"
            />
            <StatusWidget
              icon={MapPin}
              label="Sjezdovky"
              value="0 z 10"
              status="closed"
            />
            <StatusWidget
              icon={CloudSnow}
              label="Počasí"
              value="9.1°C"
            />
            <StatusWidget
              icon={Mountain}
              label="Skipark"
              value="zavřen"
              status="closed"
            />
            <StatusWidget
              icon={Calendar}
              label="Cesta"
              value="udržovaná"
              status="open"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="glass rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
              O nás
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Vítejte v Ski Centru Kohútka – místě, kde si zima podává ruku s pohodou a zážitky! 
              Naše horské středisko se nachází v srdci Beskyd na pomezí České republiky a Slovenska. 
              Nabízíme skvělé podmínky pro lyžování, snowboarding i rodinné radovánky na sněhu.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Čekají na vás upravené sjezdovky různých obtížností, moderní vleky a lanovky, 
              stejně jako zázemí pro odpočinek i občerstvení. Ať už jste začátečník nebo zkušený lyžař, 
              u nás si přijdete na své.
            </p>
          </div>
        </div>
      </section>

      {/* Camera Preview Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sledujte areál naživo
            </h2>
            <p className="text-lg text-muted-foreground">
              Webkamery v reálném čase z různých míst areálu
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-6">
            <div className="glass rounded-2xl overflow-hidden max-w-3xl w-full">
              <div className="aspect-video bg-muted relative">
                <img
                  src="http://data.kohutka.ski/snimky/kamera_P5_snimek.jpg"
                  alt="Live kamera - horní stanice"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Horní stanice</h3>
                <p className="text-muted-foreground">Pohled ze sedačkové lanovky</p>
              </div>
            </div>

            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link to="/kamery">
                <Camera className="mr-2 h-5 w-5" />
                Zobrazit všechny kamery
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm opacity-80">
            © 2025 Ski Centrum Kohútka - Lyžařské středisko v srdci Valašska
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
