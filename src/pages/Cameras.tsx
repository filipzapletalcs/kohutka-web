import { useState, useEffect, useRef } from "react";
import { Maximize2, RefreshCw, AlertCircle, Thermometer, Clock, Video, History, Mountain, Play, Camera } from "lucide-react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [selectedCameraTime, setSelectedCameraTime] = useState<string>("current");
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});
  const [selectedTime, setSelectedTime] = useState<string>("current");
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const timeOptions = [
    { value: "current", label: "Aktuální", hour: null },
    { value: "06:00", label: "6:00", hour: "06" },
    { value: "09:00", label: "9:00", hour: "09" },
    { value: "12:00", label: "12:00", hour: "12" },
    { value: "15:00", label: "15:00", hour: "15" },
    { value: "18:00", label: "18:00", hour: "18" },
  ];

  // Helper function to get camera URL based on selected time
  const getCameraUrl = (baseUrl: string, time: string, cacheKey?: number) => {
    const selectedOption = timeOptions.find(opt => opt.value === time);

    // Base URL for the requested time (current or historical)
    let rawUrl = baseUrl;

    if (selectedOption && selectedOption.hour) {
      // Historical time - convert URL pattern
      // From: http://data.kohutka.ski/snimky/kamera_P1_snimek.jpg
      // To:   http://data.kohutka.ski/snimky/kamera_HOD09_P1_snimek.jpg
      const urlParts = baseUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const newFilename = filename.replace('kamera_P', `kamera_HOD${selectedOption.hour}_P`);
      urlParts[urlParts.length - 1] = newFilename;
      rawUrl = urlParts.join('/');
    }

    const cacheBuster = cacheKey ?? Date.now();

    // In production (HTTPS) we can't načíst HTTP snímky přímo kvůli mixed content,
    // proto je pro data.kohutka.ski posíláme přes Vercel proxy.
    const isBrowser = typeof window !== 'undefined';
    if (
      isBrowser &&
      window.location.protocol === 'https:' &&
      rawUrl.startsWith('http://data.kohutka.ski/snimky/')
    ) {
      return `/api/camera-proxy?url=${encodeURIComponent(rawUrl)}&t=${cacheBuster}`;
    }

    // Lokální vývoj (HTTP) nebo už HTTPS URL z API
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}t=${cacheBuster}`;
  };

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
    if (!selectedCamera?.hasLiveStream || !selectedCamera?.liveStreamUrl) {
      return;
    }

    // Wait for video element to be in DOM (dialog animation)
    let timeoutId: NodeJS.Timeout | null = null;
    let hlsInstance: Hls | null = null;
    let pauseHandler: (() => void) | null = null;
    let playingHandler: (() => void) | null = null;
    let metadataHandler: (() => void) | null = null;

    const initVideo = () => {
      if (!videoRef.current) {
        timeoutId = setTimeout(initVideo, 100);
        return;
      }

      const video = videoRef.current;

      // Check if browser supports HLS natively (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = selectedCamera.liveStreamUrl;

        // Safari autoplay handling
        const playVideo = () => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .catch(() => {
                setTimeout(playVideo, 1000);
              });
          }
        };

        // Handle pause events (Safari might pause automatically)
        pauseHandler = () => {
          // Try to resume automatically first
          setTimeout(() => {
            if (video.paused && !video.ended) {
              playVideo();
              // Only show play button if auto-resume fails after 2 seconds
              setTimeout(() => {
                if (video.paused && !video.ended) {
                  setShowPlayButton(true);
                }
              }, 2000);
            }
          }, 100);
        };

        // Hide play button when video starts playing
        playingHandler = () => {
          setShowPlayButton(false);
        };

        video.addEventListener('playing', playingHandler);

        metadataHandler = playVideo;

        video.addEventListener('pause', pauseHandler);
        video.addEventListener('loadedmetadata', metadataHandler);

        // Initial play attempt
        playVideo();
      }
      // Use HLS.js for other browsers
      else if (Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          debug: false,
        });

        hlsInstance.loadSource(selectedCamera.liveStreamUrl);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            setShowPlayButton(true);
          });
        });

        // Handle pause events (Chrome might pause automatically)
        pauseHandler = () => {
          // Only show play button after 2 seconds if still paused
          setTimeout(() => {
            if (video.paused && !video.ended) {
              setShowPlayButton(true);
            }
          }, 2000);
        };

        // Hide play button when video starts playing
        playingHandler = () => {
          setShowPlayButton(false);
        };

        video.addEventListener('playing', playingHandler);
        video.addEventListener('pause', pauseHandler);

        hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hlsInstance?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsInstance?.recoverMediaError();
                break;
              default:
                hlsInstance?.destroy();
                break;
            }
          }
        });
      }
    };

    initVideo();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      if (videoRef.current) {
        if (pauseHandler) {
          videoRef.current.removeEventListener('pause', pauseHandler);
        }
        if (playingHandler) {
          videoRef.current.removeEventListener('playing', playingHandler);
        }
        if (metadataHandler) {
          videoRef.current.removeEventListener('loadedmetadata', metadataHandler);
        }
      }
      setShowPlayButton(false);
    };
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
      <div className="min-h-screen pt-24 pb-12">
        <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Live Webkamery
            </h1>
            <p className="text-muted-foreground">
              Sledujte aktuální stav sjezdovek v reálném čase
            </p>
          </div>
          <Button
            onClick={refreshAllCameras}
            disabled={isLoading}
            variant="outline"
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
              cameras.filter((camera: CameraType) => camera.source !== 'archive' || camera.id === 'kohutka-p0').map((camera: CameraType) => (
                <Card
                  key={camera.id}
                  className="glass overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => {
                    setSelectedCamera(camera);
                    setSelectedCameraTime("current");
                  }}
                >
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={getCameraUrl(
                        camera.media.last_image.url,
                        "current",
                        refreshKeys[camera.id]
                      )}
                      alt={camera.name}
                      className="w-full h-full object-cover"
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

                    {/* Live indicator and camera type badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {/* LIVE tag only for live stream cameras */}
                      {camera.hasLiveStream && (
                        <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          LIVE
                        </div>
                      )}

                      {/* STREAM badge for live stream cameras */}
                      {camera.hasLiveStream && (
                        <Badge variant="secondary" className="bg-blue-500 text-white">
                          <Video className="h-3 w-3 mr-1" />
                          STREAM
                        </Badge>
                      )}

                      {/* PANORAMA badge - show for cameras with panorama support */}
                      {camera.hasPanorama && !camera.hasLiveStream && (
                        <Badge variant="secondary" className="bg-purple-500 text-white">
                          <Mountain className="h-3 w-3 mr-1" />
                          PANORAMA
                        </Badge>
                      )}

                      {/* SNÍMEK badge for regular cameras (no special features) */}
                      {!camera.hasLiveStream && !camera.hasPanorama && (
                        <Badge variant="secondary" className="bg-slate-500 text-white">
                          <Camera className="h-3 w-3 mr-1" />
                          SNÍMEK
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

        {/* Time-based Camera Gallery */}
        <Card className="glass mt-12 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <History className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Archiv snímků</h2>
              </div>
              <p className="text-muted-foreground">
                Prohlédněte si snímky z kamer z různých časů během dne
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {timeOptions.map((time) => (
                <Button
                  key={time.value}
                  variant={selectedTime === time.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time.value)}
                  className={selectedTime === time.value ? "bg-accent hover:bg-accent/90 text-foreground" : ""}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {time.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cameras
              .filter((camera: CameraType) => camera.source === 'archive')
              .map((camera: CameraType) => (
                <Card
                  key={`archive-${camera.id}-${selectedTime}`}
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => {
                    setSelectedCamera(camera);
                    setSelectedCameraTime(selectedTime);
                  }}
                >
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={getCameraUrl(camera.media.last_image.url, selectedTime)}
                      alt={`${camera.name} - ${timeOptions.find(t => t.value === selectedTime)?.label}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.opacity = '0.3';
                        img.alt = 'Snímek nedostupný';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-100">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs font-semibold truncate">
                          {camera.name}
                        </p>
                        {selectedTime !== 'current' && (
                          <p className="text-white/80 text-[10px]">
                            {timeOptions.find(t => t.value === selectedTime)?.label}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 Tip: Klikněte na libovolný snímek pro zobrazení ve větším rozlišení
            </p>
          </div>
        </Card>

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
                • Kamery s 🎥 STREAM nabízí live přenos
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">
                • Klikněte na kameru pro fullscreen zobrazení
              </p>
              <p className="text-muted-foreground mb-2">
                • LIVE indikátor ukazuje aktivní live stream
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
            <DialogContent className="max-w-7xl w-[95vw]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-4 pr-8">
                  <div>
                    <span className="text-xl">{selectedCamera.name}</span>
                    <span className="text-sm text-muted-foreground ml-3">
                      {selectedCamera.description || selectedCamera.location}
                    </span>
                    {selectedCamera.hasLiveStream && (
                      <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                        <Video className="h-3 w-3 mr-1" />
                        STREAM
                      </Badge>
                    )}
                    {selectedCamera.hasPanorama && !selectedCamera.hasLiveStream && (
                      <Badge variant="secondary" className="ml-2 bg-purple-500 text-white">
                        <Mountain className="h-3 w-3 mr-1" />
                        PANORAMA
                      </Badge>
                    )}
                    {!selectedCamera.hasLiveStream && !selectedCamera.hasPanorama && (
                      <Badge variant="secondary" className="ml-2 bg-slate-500 text-white">
                        <Camera className="h-3 w-3 mr-1" />
                        SNÍMEK
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
                <DialogDescription className="sr-only">
                  Zobrazení live kamery {selectedCamera.name}
                </DialogDescription>
              </DialogHeader>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {selectedCamera.hasLiveStream && selectedCamera.liveStreamUrl ? (
                  <>
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      Váš prohlížeč nepodporuje HLS live stream.
                    </video>
                    {showPlayButton && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <Button
                          size="lg"
                          onClick={() => {
                            videoRef.current?.play()
                              .then(() => {
                                setShowPlayButton(false);
                              })
                              .catch(() => {
                                // Play failed
                              });
                          }}
                          className="h-20 w-20 rounded-full bg-white hover:bg-white/90 text-black"
                        >
                          <Play className="h-10 w-10" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : selectedCamera.hasVideo && selectedCamera.media.last_video ? (
                  <video
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                    key={selectedCamera.id}
                  >
                    <source
                      src={selectedCamera.media.last_video.direct_url || selectedCamera.media.last_video.url}
                      type="video/mp4"
                    />
                    Váš prohlížeč nepodporuje video tag.
                  </video>
                ) : selectedCamera.hasPanorama && selectedCamera.media.last_panorama ? (
                  <img
                    src={selectedCamera.media.last_panorama.url}
                    alt={`${selectedCamera.name} - Panorama`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={getCameraUrl(
                      selectedCamera.media.last_image.url,
                      selectedCamera.source === 'archive' ? selectedCameraTime : "current",
                      refreshKeys[selectedCamera.id]
                    )}
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
