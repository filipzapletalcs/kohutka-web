import { useEffect, useRef, useState } from "react";
import { X, RefreshCw, Thermometer, Clock, Video, Mountain, Camera, Play, Loader2 } from "lucide-react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera as CameraType } from "@/types/holidayInfo";

interface CameraModalProps {
  camera: CameraType | null;
  isOpen: boolean;
  onClose: () => void;
  getCameraUrl: (baseUrl: string, cacheKey?: number) => string;
  refreshCamera: (cameraId: string) => void;
  refreshKey?: number;
}

export const CameraModal = ({
  camera,
  isOpen,
  onClose,
  getCameraUrl,
  refreshCamera,
  refreshKey,
}: CameraModalProps) => {
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isStreamLoaded, setIsStreamLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Initialize HLS.js for live stream cameras
  useEffect(() => {
    // Only initialize when modal is open and camera has live stream
    if (!isOpen || !camera?.hasLiveStream || !camera?.liveStreamUrl) {
      return;
    }

    // Reset loading state when camera changes
    setIsStreamLoaded(false);
    setShowPlayButton(false);

    let timeoutId: NodeJS.Timeout | null = null;
    let hlsInstance: Hls | null = null;
    let pauseHandler: (() => void) | null = null;
    let playingHandler: (() => void) | null = null;
    let metadataHandler: (() => void) | null = null;
    let errorHandler: (() => void) | null = null;

    const initVideo = () => {
      if (!videoRef.current) {
        timeoutId = setTimeout(initVideo, 100);
        return;
      }

      const video = videoRef.current;

      // Check if browser supports HLS natively (Safari)
      // DEBUG: Set to false to force HLS.js usage for testing
      const forceHlsJs = false; // Change to true to test HLS.js in Chrome/Safari

      if (!forceHlsJs && video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('[HLS] Using native HLS support (Safari)');
        video.src = camera.liveStreamUrl;

        const playVideo = () => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              setTimeout(playVideo, 1000);
            });
          }
        };

        pauseHandler = () => {
          setTimeout(() => {
            if (video.paused && !video.ended) {
              playVideo();
              setTimeout(() => {
                if (video.paused && !video.ended) {
                  setShowPlayButton(true);
                }
              }, 2000);
            }
          }, 100);
        };

        playingHandler = () => {
          setShowPlayButton(false);
          setIsStreamLoaded(true);
        };

        errorHandler = () => {
          console.error('[HLS] Native playback error');
          setIsStreamLoaded(true);
          setShowPlayButton(true);
        };

        video.addEventListener('playing', playingHandler);
        video.addEventListener('error', errorHandler);
        metadataHandler = playVideo;
        video.addEventListener('pause', pauseHandler);
        video.addEventListener('loadedmetadata', metadataHandler);
        playVideo();
      }
      // Use HLS.js for other browsers (Edge, Firefox, Chrome)
      else if (Hls.isSupported()) {
        console.log('[HLS] Using HLS.js for stream playback');
        hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          debug: false,
          // Additional settings for better compatibility
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startLevel: -1, // Auto quality
        });

        // Use proxy URL to bypass CORS restrictions
        const proxyUrl = `/api/hls-proxy?url=${encodeURIComponent(camera.liveStreamUrl)}`;
        console.log('[HLS] Using proxy URL:', proxyUrl);
        hlsInstance.loadSource(proxyUrl);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('[HLS] Manifest parsed, starting playback');
          video.play().catch((err) => {
            console.warn('[HLS] Autoplay blocked:', err);
            setShowPlayButton(true);
            setIsStreamLoaded(true);
          });
        });

        hlsInstance.on(Hls.Events.FRAG_LOADED, () => {
          // Stream is loading, mark as loaded
          setIsStreamLoaded(true);
        });

        pauseHandler = () => {
          setTimeout(() => {
            if (video.paused && !video.ended) {
              setShowPlayButton(true);
            }
          }, 2000);
        };

        playingHandler = () => {
          setShowPlayButton(false);
          setIsStreamLoaded(true);
        };

        video.addEventListener('playing', playingHandler);
        video.addEventListener('pause', pauseHandler);

        hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
          console.error('[HLS] Error:', data.type, data.details);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('[HLS] Network error, trying to recover...');
                hlsInstance?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('[HLS] Media error, trying to recover...');
                hlsInstance?.recoverMediaError();
                break;
              default:
                console.error('[HLS] Fatal error, cannot recover');
                hlsInstance?.destroy();
                setIsStreamLoaded(true);
                setShowPlayButton(true);
                break;
            }
          }
        });
      } else {
        // HLS not supported at all
        console.error('[HLS] HLS is not supported in this browser');
        setIsStreamLoaded(true);
      }
    };

    initVideo();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
      if (videoRef.current) {
        if (pauseHandler) videoRef.current.removeEventListener('pause', pauseHandler);
        if (playingHandler) videoRef.current.removeEventListener('playing', playingHandler);
        if (metadataHandler) videoRef.current.removeEventListener('loadedmetadata', metadataHandler);
        if (errorHandler) videoRef.current.removeEventListener('error', errorHandler);
        // Clear video source
        videoRef.current.src = '';
        videoRef.current.load();
      }
      setShowPlayButton(false);
      setIsStreamLoaded(false);
    };
  }, [camera, isOpen]);

  if (!camera) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden bg-black/95 border-2 border-white/10 flex flex-col"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100dvh',
          maxWidth: '100vw',
          maxHeight: '100dvh',
          transform: 'none',
          left: 0,
          top: 0,
          borderRadius: 0,
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        {/* Header with camera info and close button */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/70 to-transparent p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {camera.name}
              </h2>
              <p className="text-sm text-white/80 line-clamp-1 mb-3">
                {camera.description || camera.location}
              </p>
              <div className="flex flex-wrap gap-2">
                {camera.hasLiveStream && (
                  <Badge className="bg-blue-500 text-white border-0">
                    <Video className="h-3 w-3 mr-1" />
                    STREAM
                  </Badge>
                )}
                {camera.hasPanorama && !camera.hasLiveStream && (
                  <Badge className="bg-purple-500 text-white border-0">
                    <Mountain className="h-3 w-3 mr-1" />
                    PANORAMA
                  </Badge>
                )}
                {!camera.hasLiveStream && !camera.hasPanorama && (
                  <Badge className="bg-slate-600 text-white border-0">
                    <Camera className="h-3 w-3 mr-1" />
                    SNÍMEK
                  </Badge>
                )}
                {camera.media.last_image.temp && (
                  <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                    <Thermometer className="h-3 w-3 mr-1" />
                    {camera.media.last_image.temp}°C
                  </Badge>
                )}
              </div>
            </div>

            {/* Single close button - top right */}
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm flex-shrink-0"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Refresh button for non-video cameras */}
          {!camera.hasVideo && !camera.hasLiveStream && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="ghost"
                className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
                onClick={() => refreshCamera(camera.id)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Obnovit obrázek
              </Button>
            </div>
          )}
        </div>

        {/* Main content - camera view */}
        <div
          className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden"
          style={{ minHeight: 0 }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {camera.hasLiveStream && camera.liveStreamUrl ? (
              <>
                {/* Loading indicator - shown while stream is loading */}
                {!isStreamLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                    <p className="text-white/80 text-sm">Načítání streamu...</p>
                  </div>
                )}

                {/* Video element - hidden until stream loads */}
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  muted
                  playsInline
                  className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
                    isStreamLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  Váš prohlížeč nepodporuje HLS live stream.
                </video>

                {/* Play button - shown when stream is loaded but paused */}
                {showPlayButton && isStreamLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Button
                      size="lg"
                      onClick={() => {
                        videoRef.current?.play()
                          .then(() => setShowPlayButton(false))
                          .catch(() => {});
                      }}
                      className="h-20 w-20 rounded-full bg-white hover:bg-white/90 text-black shadow-2xl"
                    >
                      <Play className="h-10 w-10" />
                    </Button>
                  </div>
                )}
              </>
            ) : camera.hasVideo && camera.media.last_video ? (
              <video
                controls
                autoPlay
                muted
                playsInline
                className="max-w-full max-h-full object-contain"
                key={camera.id}
              >
                <source
                  src={camera.media.last_video.direct_url || camera.media.last_video.url}
                  type="video/mp4"
                />
                Váš prohlížeč nepodporuje video tag.
              </video>
            ) : camera.hasPanorama && camera.media.last_panorama ? (
              <img
                src={camera.media.last_panorama.url}
                alt={`${camera.name} - Panorama`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                src={getCameraUrl(camera.media.last_image.url, refreshKey)}
                alt={camera.name}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Timestamp badge for static images - bottom right */}
            {!camera.hasVideo && !camera.hasLiveStream && camera.media.last_image.time && (
              <div className="absolute bottom-4 right-4">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 shadow-lg">
                  <Clock className="h-4 w-4 mr-1" />
                  Aktualizováno: {camera.media.last_image.time}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
