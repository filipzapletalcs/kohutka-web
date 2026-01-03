import { Link } from "react-router-dom";
import {
  CableCar,
  Camera,
  CloudSun,
  Mountain,
  MountainSnow,
  Snowflake,
  Navigation2,
} from "lucide-react";
import { GiSnowboard } from "react-icons/gi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusWidget } from "@/components/StatusWidget";
import Navigation from "@/components/Navigation";
import { fetchHolidayInfoData } from "@/services/holidayInfoApi";
import { fetchWidgetSettings, fetchSiteSetting, type WidgetKey, type WidgetStatus } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState, useRef, useMemo } from "react";
import heroImage1 from "@/assets/Mira-Foto-01-1920x700-1.webp";
import logo from "@/assets/logo.png";

// Lazy load components below the fold
const AboutUs = lazy(() => import("@/components/AboutUs"));
const Weather = lazy(() => import("@/components/Weather"));
const SlopesAndLifts = lazy(() => import("@/components/SlopesAndLifts"));
const InteractiveMap = lazy(() => import("@/components/InteractiveMap"));
const GoSkiPromo = lazy(() => import("@/components/GoSkiPromo"));
const FacebookFeed = lazy(() => import("@/components/FacebookFeed"));
const Partners = lazy(() => import("@/components/Partners"));
const Location = lazy(() => import("@/components/Location"));
const Footer = lazy(() => import("@/components/Footer"));

const Index = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Fetch data with auto-refresh every 5 minutes
  const { data, isLoading: isLoadingApi } = useQuery({
    queryKey: ['holidayInfo'],
    queryFn: fetchHolidayInfoData,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000, // 4 minutes
  });

  // Fetch widget settings from Supabase
  const { data: widgetSettings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['widget-settings'],
    queryFn: fetchWidgetSettings,
    staleTime: 30 * 1000,
  });

  // Fetch Facebook feed visibility setting
  const { data: facebookSetting } = useQuery({
    queryKey: ['site-setting', 'facebook_feed_visible'],
    queryFn: () => fetchSiteSetting('facebook_feed_visible'),
    staleTime: 30 * 1000,
  });

  const showFacebookFeed = facebookSetting?.value?.visible !== false;

  const isLoading = isLoadingApi || isLoadingSettings;

  const operation = data?.operation;
  const lifts = data?.lifts;
  const slopes = data?.slopes;

  // Helper to get widget value (manual or auto)
  const getWidgetValue = useMemo(() => {
    return (key: WidgetKey, autoValue: string): string => {
      const settings = widgetSettings.find((s) => s.widget_key === key);
      if (settings?.mode === 'manual' && settings.manual_value) {
        return settings.manual_value;
      }
      return autoValue;
    };
  }, [widgetSettings]);

  // Helper to get widget status (manual or auto)
  const getWidgetStatus = useMemo(() => {
    return (key: WidgetKey, autoStatus: WidgetStatus): WidgetStatus => {
      const settings = widgetSettings.find((s) => s.widget_key === key);
      if (settings?.mode === 'manual' && settings.manual_status) {
        return settings.manual_status;
      }
      return autoStatus;
    };
  }, [widgetSettings]);

  // Preload hero image
  useEffect(() => {
    const img = new Image();
    img.src = heroImage1;
    img.onload = () => {
      setImageLoaded(true);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation />

      <main>
        {/* Hero Section */}
        <div ref={heroRef} className="relative min-h-[80vh] md:h-[110vh] overflow-hidden">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse" />
        )}

        {/* Static Panoramic Image - Centered */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${heroImage1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            opacity: imageLoaded ? 1 : 0,
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <img
                  src={logo}
                  alt="SKI CENTRUM KOHÚTKA Logo"
                  className="h-48 md:h-96 w-auto drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
                  width={512}
                  height={512}
                  fetchPriority="high"
                />
              </div>

              <p className="text-xl md:text-2xl text-white mb-6 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-semibold">
                SKI CENTRUM KOHÚTKA - Lyžařské středisko v srdci Valašska
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-xl" style={{ backgroundColor: '#a3e635' }}>
                  <a href="https://valassko.ski/shop-kohutka" target="_blank" rel="noopener noreferrer" style={{ backgroundColor: '#a3e635' }}>
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
      </div>

      {/* Status Widgets */}
      <section className="py-12 -mt-20 relative z-20">
        <div className="container mx-auto max-w-7xl px-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5 md:gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="glass p-4 rounded-lg">
                  <Skeleton className="h-8 w-8 mx-auto mb-2" />
                  <Skeleton className="h-3 w-16 mx-auto mb-2" />
                  <Skeleton className="h-6 w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5 md:gap-2.5">
              {widgetSettings.map((widget) => {
                const widgetConfig: Record<string, { icon: typeof Mountain; autoValue: string; autoStatus: WidgetStatus; fullWidth?: boolean }> = {
                  skiareal: {
                    icon: Mountain,
                    autoValue: operation?.operationText || "mimo provoz",
                    autoStatus: operation?.isOpen ? "open" : "closed",
                    fullWidth: true,
                  },
                  vleky: {
                    icon: CableCar,
                    autoValue: `${lifts?.cableCarOpenCount || 0}/${lifts?.dragLiftOpenCount || 0}`,
                    autoStatus: (lifts?.openCount || 0) > 0 ? "open" : "closed",
                  },
                  sjezdovky: {
                    icon: MountainSnow,
                    autoValue: `${slopes?.openCount || 0} z ${slopes?.totalCount || 0}`,
                    autoStatus: (slopes?.openCount || 0) > 0 ? "open" : "closed",
                  },
                  skipark: {
                    icon: GiSnowboard as typeof Mountain,
                    autoValue: lifts?.skiParkOpen ? "V provozu" : "mimo provoz",
                    autoStatus: lifts?.skiParkOpen ? "open" : "closed",
                  },
                  pocasi: {
                    icon: CloudSun,
                    autoValue: operation?.temperature ? `${operation.temperature}°C` : "N/A",
                    autoStatus: null,
                  },
                  snih: {
                    icon: Snowflake,
                    autoValue: operation?.snowHeight || "0 cm",
                    autoStatus: null,
                  },
                  vozovka: {
                    icon: Navigation2,
                    autoValue: "N/A",
                    autoStatus: "partial",
                  },
                };

                const config = widgetConfig[widget.widget_key];
                if (!config) return null;

                return (
                  <StatusWidget
                    key={widget.widget_key}
                    icon={config.icon}
                    label={widget.display_name || widget.widget_key}
                    value={getWidgetValue(widget.widget_key, config.autoValue)}
                    status={getWidgetStatus(widget.widget_key, config.autoStatus)}
                    fullWidth={config.fullWidth}
                    className={config.fullWidth ? "col-span-2 md:col-span-1" : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Lazy loaded sections */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted/20" />}>
        {/* About Section */}
        <AboutUs />

        {/* Weather Section */}
        <Weather />

        {/* Slopes and Lifts Section */}
        <SlopesAndLifts />

        {/* Interactive Map Section */}
        <InteractiveMap />
      </Suspense>

      {/* Camera Preview Section - COMMENTED OUT */}
      {/* <section className="pt-8 pb-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4">
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
      </section> */}

      <Suspense fallback={<div className="h-64 animate-pulse bg-muted/20" />}>
        {/* GoSki Promo Section */}
        <GoSkiPromo />

        {/* Facebook Feed Section */}
        {showFacebookFeed && <FacebookFeed />}

        {/* Partners Section */}
        <Partners />

        {/* Location Section */}
        <Location />
      </Suspense>
      </main>

      {/* Footer */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
