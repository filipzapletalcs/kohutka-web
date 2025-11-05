import { useState, useEffect, useRef } from "react";
import { Maximize2, RefreshCw, AlertCircle, Thermometer, Clock, Video } from "lucide-react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { fetchHolidayInfoData } from "@/services/holidayInfoApi";
import { Camera as CameraType } from "@/types/holidayInfo";
import { useQuery } from "@tanstack/react-query";

const Cameras = () => {
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch camera data with auto-refresh every 5 minutes
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['holidayInfo'], // Same key as Index.tsx for shared cache
    queryFn: fetchHolidayInfoData,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000, // 4 minutes
  });

  const cameras = data?.cameras || [];

  // Initialize HLS.js for live stream cameras
  useEffect(() => {
    if (selectedCamera?.hasLiveStream && selectedCamera?.liveStreamUrl && videoRef.current) {
      const video = videoRef.current;

      // Check if browser supports HLS natively (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedCamera.liveStreamUrl;
      }
      // Use HLS.js for other browsers
      else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(selectedCamera.liveStreamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => console.log('Autoplay prevented:', err));
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS error:', data);
        });

        return () => {
          hls.destroy();
        };
      } else {
        console.error('HLS is not supported in this browser');
      }
    }
  }, [selectedCamera]);

  const refreshCamera = (cameraId: string) => {
    setRefreshKeys(prev => ({
      ...prev,
      [cameraId]: Date.now()
    }));
  };

  const refreshAllCameras = () => {
    const newKeys: Record<string, number> = {};
    cameras.forEach((cam: CameraType) => {
      newKeys[cam.id] = Date.now();
    });
    setRefreshKeys(newKeys);
    refetch();
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient pt-24 pb-12">
        <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-primary-foreground mb-2">
              Live Webkamery
            </h1>
            <p className="text-primary-foreground/80">
              Sledujte aktuální stav sjezdovek v reálném čase
            </p>
          </div>
          <Button
            onClick={refreshAllCameras}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Obnovit vše
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
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
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Camera Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cameras.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-muted-foreground">Momentálně nejsou k dispozici žádné kamery.</p>
              </div>
            ) : (
              cameras.map((camera: CameraType) => (
                <Card
                  key={camera.id}
                  className="glass overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => setSelectedCamera(camera)}
                >
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={`${camera.media.last_image.url}${camera.media.last_image.url.includes('?') ? '&' : '?'}t=${refreshKeys[camera.id] || Date.now()}`}
                      alt={camera.name}
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.error(`Failed to load image for camera ${camera.id}:`, camera.media.last_image.url);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Overlay buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
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
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Live indicator */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                      {(camera.hasVideo || camera.hasLiveStream) && (
                        <Badge variant="secondary" className="bg-blue-500 text-white">
                          <Video className="h-3 w-3 mr-1" />
                          {camera.hasLiveStream ? 'STREAM' : 'VIDEO'}
                        </Badge>
                      )}
                    </div>

                    {/* Temperature badge */}
                    {camera.media.last_image.temp && (
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                          <Thermometer className="h-3 w-3 mr-1" />
                          {camera.media.last_image.temp}°C
                        </Badge>
                      </div>
                    )}

                    {/* Time badge */}
                    {camera.media.last_image.time && (
                      <div className="absolute bottom-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {camera.media.last_image.time}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Camera Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{camera.name}</h3>
                    <p className="text-sm text-muted-foreground">{camera.description || camera.location}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Info Box */}
        <Card className="glass mt-8 p-6">
          <h2 className="text-xl font-semibold mb-3">Informace o kamerách</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-2">
                • Snímky se automaticky aktualizují každých 5 minut
              </p>
              <p className="text-muted-foreground mb-2">
                • Můžete obnovit kameru ručně tlačítkem
              </p>
              <p className="text-muted-foreground mb-2">
                • Kamery s 🎥 VIDEO nabízí live stream
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">
                • Klikněte na kameru pro fullscreen zobrazení
              </p>
              <p className="text-muted-foreground mb-2">
                • Live indikátor ukazuje aktivní kameru
              </p>
              <p className="text-muted-foreground mb-2">
                • Zobrazuje se aktuální teplota a čas
              </p>
            </div>
          </div>
        </Card>
      </div>

        {/* Fullscreen Dialog */}
        {selectedCamera && (
          <Dialog open={true} onOpenChange={() => setSelectedCamera(null)}>
            <DialogContent className="max-w-6xl" aria-describedby="camera-description">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div>
                    <span className="text-xl">{selectedCamera.name}</span>
                    <span className="text-sm text-muted-foreground ml-3">
                      {selectedCamera.description || selectedCamera.location}
                    </span>
                    {(selectedCamera.hasVideo || selectedCamera.hasLiveStream) && (
                      <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                        <Video className="h-3 w-3 mr-1" />
                        LIVE STREAM
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedCamera.media.last_image.temp && (
                      <Badge variant="secondary">
                        <Thermometer className="h-4 w-4 mr-1" />
                        {selectedCamera.media.last_image.temp}°C
                      </Badge>
                    )}
                    {!selectedCamera.hasVideo && !selectedCamera.hasLiveStream && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => refreshCamera(selectedCamera.id)}
                        title="Obnovit obrázek"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <p id="camera-description" className="sr-only">
                Zobrazení live kamery {selectedCamera.name}
              </p>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {selectedCamera.hasLiveStream && selectedCamera.liveStreamUrl ? (
                  <video
                    ref={videoRef}
                    controls
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    Váš prohlížeč nepodporuje HLS live stream.
                  </video>
                ) : selectedCamera.hasVideo && selectedCamera.media.last_video ? (
                  <video
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                    key={selectedCamera.id}
                    onError={(e) => {
                      console.error('Video load error:', selectedCamera.media.last_video?.url);
                      console.error('Error event:', e);
                    }}
                    onLoadedData={() => {
                      console.log('Video loaded successfully:', selectedCamera.media.last_video?.url);
                    }}
                  >
                    <source
                      src={selectedCamera.media.last_video.url}
                      type="video/mp4"
                    />
                    Váš prohlížeč nepodporuje video tag.
                  </video>
                ) : (
                  <img
                    src={`${selectedCamera.media.last_image.url}${selectedCamera.media.last_image.url.includes('?') ? '&' : '?'}t=${refreshKeys[selectedCamera.id] || Date.now()}`}
                    alt={selectedCamera.name}
                    className="w-full h-full object-contain"
                  />
                )}
                {!selectedCamera.hasVideo && !selectedCamera.hasLiveStream && selectedCamera.media.last_image.time && (
                  <div className="absolute bottom-4 right-4">
                    <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                      <Clock className="h-4 w-4 mr-1" />
                      Aktualizováno: {selectedCamera.media.last_image.time}
                    </Badge>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Cameras;
