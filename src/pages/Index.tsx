import { Link } from "react-router-dom";
import { Camera, CloudSnow, Mountain, TrendingUp, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusWidget } from "@/components/StatusWidget";
import Navigation from "@/components/Navigation";
import Partners from "@/components/Partners";
import Location from "@/components/Location";
import Weather from "@/components/Weather";
import AboutUs from "@/components/AboutUs";
import SlopesAndLifts from "@/components/SlopesAndLifts";
import { fetchHolidayInfoData } from "@/services/holidayInfoApi";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import heroImage1 from "@/assets/Mira-Foto-01-1920x700-1.png";
import heroImage2 from "@/assets/P01Slider-Slide01.jpg";
import heroImage3 from "@/assets/P01Slider-Slide02.jpg";
import logo from "@/assets/logo.png";

const heroImages = [heroImage1, heroImage2, heroImage3];

const Index = () => {
  const [panoramaProgress, setPanoramaProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch data with auto-refresh every 5 minutes
  const { data, isLoading } = useQuery({
    queryKey: ['holidayInfo'],
    queryFn: fetchHolidayInfoData,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000, // 4 minutes
  });

  const operation = data?.operation;
  const lifts = data?.lifts;
  const slopes = data?.slopes;

  // Auto-rotate hero images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-animate panoramic scroll effect
  useEffect(() => {
    let animationFrame: number;
    let progress = 0;
    let direction = 1; // 1 for right, -1 for left

    const animate = () => {
      progress += direction * 0.0005; // Adjust speed here (smaller = slower)

      // Reverse direction at edges
      if (progress >= 1) {
        progress = 1;
        direction = -1;
      } else if (progress <= 0) {
        progress = 0;
        direction = 1;
      }

      setPanoramaProgress(progress);
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        {/* Panoramic Images with Automatic Horizontal Movement and Rotation */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'auto 100%',
              backgroundPosition: `${panoramaProgress * 100}% center`,
              backgroundRepeat: 'no-repeat',
              opacity: currentImageIndex === index ? 1 : 0,
              zIndex: currentImageIndex === index ? 1 : 0,
            }}
          />
        ))}

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <img
                  src={logo}
                  alt="Kohútka Logo"
                  className="h-24 md:h-60 w-auto drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
                />
              </div>

              <p className="text-xl md:text-2xl text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-semibold">
                Lyžařské středisko v srdci Valašska
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-xl">
                  <a href="https://valassko.ski/shop-kohutka" target="_blank" rel="noopener noreferrer">
                    Skipas Online
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8 py-6 backdrop-blur-sm shadow-xl">
                  <Link to="/kamery">
                    <Camera className="mr-2 h-5 w-5" />
                    Live Kamery
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <div className="flex flex-col items-center gap-2 text-white animate-bounce">
            <span className="text-sm font-medium drop-shadow-lg">Scrolluj dolů</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Status Widgets */}
      <section className="py-12 px-4 -mt-20 relative z-20">
        <div className="container mx-auto max-w-6xl">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass p-4 rounded-lg">
                  <Skeleton className="h-8 w-8 mx-auto mb-2" />
                  <Skeleton className="h-3 w-16 mx-auto mb-2" />
                  <Skeleton className="h-6 w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatusWidget
                icon={Mountain}
                label="Skiareál"
                value={operation?.operationText || "mimo provoz"}
                status={operation?.isOpen ? "open" : "closed"}
              />
              <StatusWidget
                icon={TrendingUp}
                label="Vleky a lanovky"
                value={`${lifts?.openCount || 0} z ${lifts?.totalCount || 0}`}
                status={
                  (lifts?.openCount || 0) > 0
                    ? "open"
                    : "closed"
                }
              />
              <StatusWidget
                icon={MapPin}
                label="Sjezdovky"
                value={`${slopes?.openCount || 0} z ${slopes?.totalCount || 0}`}
                status={
                  (slopes?.openCount || 0) > 0
                    ? "open"
                    : "closed"
                }
              />
              <StatusWidget
                icon={CloudSnow}
                label="Počasí"
                value={operation?.temperature ? `${operation.temperature}°C` : "N/A"}
              />
              <StatusWidget
                icon={Mountain}
                label="Skipark"
                value={lifts?.skiParkOpen ? "otevřen" : "zavřen"}
                status={lifts?.skiParkOpen ? "open" : "closed"}
              />
              <StatusWidget
                icon={Calendar}
                label="Sníh"
                value={operation?.snowHeight || "N/A"}
              />
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <AboutUs />

      {/* Weather Section */}
      <Weather />

      {/* Slopes and Lifts Section */}
      <SlopesAndLifts />

      {/* Camera Preview Section */}
      <section className="pt-8 pb-20 px-2 md:px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sledujte areál naživo
            </h2>
            <p className="text-lg text-muted-foreground">
              Webkamery v reálném čase z různých míst areálu
            </p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="glass rounded-2xl overflow-hidden w-full">
              <div className="aspect-video bg-muted relative">
                {isLoading ? (
                  <Skeleton className="w-full h-full" />
                ) : data?.cameras && data.cameras.length > 0 ? (
                  <>
                    <img
                      src={`${data.cameras[0].media.last_image.url}&t=${Date.now()}`}
                      alt={data.cameras[0].name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Kamera není dostupná
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">
                  {data?.cameras?.[0]?.name || "Horní stanice"}
                </h3>
                <p className="text-muted-foreground">
                  {data?.cameras?.[0]?.description || "Pohled ze sedačkové lanovky"}
                </p>
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

      {/* Location Section */}
      <Location />

      {/* Partners Section */}
      <Partners />

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
