import { useState, useMemo } from "react";
import { Maximize2, RefreshCw, AlertCircle, Thermometer, Clock, Video, Mountain, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { CameraModal } from "@/components/CameraModal";
import { fetchHolidayInfoData } from "@/services/holidayInfoApi";
import { fetchCameraSettings, type CameraSettings } from "@/lib/supabase";
import { Camera as CameraType } from "@/types/holidayInfo";
import { useQuery } from "@tanstack/react-query";

interface CameraWithSettings extends CameraType {
  displayName: string;
  displayDescription: string;
}

const Cameras = () => {
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

  // Helper function to get camera URL with cache busting
  const getCameraUrl = (baseUrl: string, cacheKey?: number) => {
    const cacheBuster = cacheKey ?? Date.now();

    // In production (HTTPS) we can't načíst HTTP snímky přímo kvůli mixed content,
    // proto je pro data.kohutka.ski posíláme přes Vercel proxy.
    const isBrowser = typeof window !== 'undefined';
    if (
      isBrowser &&
      window.location.protocol === 'https:' &&
      baseUrl.startsWith('http://data.kohutka.ski/snimky/')
    ) {
      return `/api/camera-proxy?url=${encodeURIComponent(baseUrl)}&t=${cacheBuster}`;
    }

    // Lokální vývoj (HTTP) nebo už HTTPS URL z API
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${cacheBuster}`;
  };

  // Fetch camera data with auto-refresh every 5 minutes
  const { data, isLoading: isLoadingCameras, error } = useQuery({
    queryKey: ['holidayInfo'],
    queryFn: fetchHolidayInfoData,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000, // 4 minutes
  });

  // Fetch camera settings from Supabase
  const { data: cameraSettings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['camera-settings'],
    queryFn: fetchCameraSettings,
    staleTime: 30 * 1000,
  });

  const isLoading = isLoadingCameras || isLoadingSettings;

  // Merge cameras with settings, filter inactive, and sort
  const cameras = useMemo((): CameraWithSettings[] => {
    const rawCameras = data?.cameras || [];

    // Filter out archive cameras (except kohutka-p0)
    const filteredCameras = rawCameras.filter(
      (camera: CameraType) => camera.source !== 'archive' || camera.id === 'kohutka-p0'
    );

    // Merge with settings
    const camerasWithSettings = filteredCameras.map((camera: CameraType, index: number) => {
      const settings = cameraSettings.find((s) => s.camera_id === camera.id);
      return {
        ...camera,
        displayName: settings?.custom_name || camera.name,
        displayDescription: settings?.custom_description || camera.description,
        _isActive: settings?.is_active ?? true,
        _sortOrder: settings?.sort_order ?? index,
      };
    });

    // Filter out inactive cameras
    const activeCameras = camerasWithSettings.filter((c) => c._isActive);

    // Sort by sort_order from settings
    activeCameras.sort((a, b) => a._sortOrder - b._sortOrder);

    return activeCameras;
  }, [data?.cameras, cameraSettings]);

  const refreshCamera = (cameraId: string) => {
    setRefreshKeys(prev => ({
      ...prev,
      [cameraId]: Date.now()
    }));
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-24 pb-12 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-10 space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Live Webkamery
            </h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Sledujte aktuální stav sjezdovek v reálném čase
            </p>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Chyba při načítání kamer</AlertTitle>
              <AlertDescription>
                Nepodařilo se načíst data z Holiday Info API. Zkuste to prosím znovu.
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Camera Grid - 2 columns (2x4 or 1x8) */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cameras.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-lg">Momentálně nejsou k dispozici žádné kamery.</p>
                </div>
              ) : (
                cameras.map((camera, index) => (
                  <Card
                    key={camera.id}
                    className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border-2 hover:border-primary/20 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setSelectedCamera(camera)}
                  >
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={getCameraUrl(camera.media.last_image.url, refreshKeys[camera.id])}
                        alt={camera.displayName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Overlay buttons */}
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-9 w-9 bg-background/95 hover:bg-background shadow-lg backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshCamera(camera.id);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-9 w-9 bg-background/95 hover:bg-background shadow-lg backdrop-blur-sm"
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Status badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {camera.hasLiveStream && (
                          <>
                            <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              LIVE
                            </div>
                            <Badge variant="secondary" className="bg-blue-500/90 text-white backdrop-blur-sm shadow-lg">
                              <Video className="h-3 w-3 mr-1" />
                              STREAM
                            </Badge>
                          </>
                        )}

                        {camera.hasPanorama && !camera.hasLiveStream && (
                          <Badge variant="secondary" className="bg-purple-500/90 text-white backdrop-blur-sm shadow-lg">
                            <Mountain className="h-3 w-3 mr-1" />
                            PANORAMA
                          </Badge>
                        )}

                        {!camera.hasLiveStream && !camera.hasPanorama && (
                          <Badge variant="secondary" className="bg-slate-600/90 text-white backdrop-blur-sm shadow-lg">
                            <Camera className="h-3 w-3 mr-1" />
                            SNÍMEK
                          </Badge>
                        )}
                      </div>

                      {/* Info badges */}
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                        {camera.media.last_image.temp && (
                          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm shadow-lg">
                            <Thermometer className="h-3 w-3 mr-1" />
                            {camera.media.last_image.temp}°C
                          </Badge>
                        )}
                        {camera.media.last_image.time && (
                          <Badge variant="secondary" className="bg-background/95 backdrop-blur-sm text-xs shadow-lg">
                            <Clock className="h-3 w-3 mr-1" />
                            {camera.media.last_image.time}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Camera Info */}
                    <div className="p-4 bg-card">
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                        {camera.displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {camera.displayDescription || camera.location}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* Camera Modal - Separate component */}
      <CameraModal
        camera={selectedCamera}
        isOpen={!!selectedCamera}
        onClose={() => setSelectedCamera(null)}
        getCameraUrl={getCameraUrl}
        refreshCamera={refreshCamera}
        refreshKey={selectedCamera ? refreshKeys[selectedCamera.id] : undefined}
      />

      <Footer />
    </>
  );
};

export default Cameras;
