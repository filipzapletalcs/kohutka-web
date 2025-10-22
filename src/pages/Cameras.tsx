import { useState } from "react";
import { Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Camera {
  id: string;
  name: string;
  location: string;
  url: string;
  thumbnail: string;
}

const cameras: Camera[] = [
  {
    id: "1",
    name: "Horní stanice",
    location: "Sedačková lanovka",
    url: "http://data.kohutka.ski/snimky/kamera_P5_snimek.jpg",
    thumbnail: "http://data.kohutka.ski/snimky/kamera_P5_nahled.jpg",
  },
  {
    id: "2",
    name: "Sjezdovka 1",
    location: "Hlavní sjezdovka",
    url: "http://data.kohutka.ski/snimky/kamera_P1_snimek.jpg",
    thumbnail: "http://data.kohutka.ski/snimky/kamera_P1_nahled.jpg",
  },
  {
    id: "3",
    name: "Dolní stanice",
    location: "Parkoviště",
    url: "http://data.kohutka.ski/snimky/kamera_P3_snimek.jpg",
    thumbnail: "http://data.kohutka.ski/snimky/kamera_P3_nahled.jpg",
  },
  {
    id: "4",
    name: "Panorama",
    location: "Výhled na areál",
    url: "http://data.kohutka.ski/snimky/kamera_P4_snimek.jpg",
    thumbnail: "http://data.kohutka.ski/snimky/kamera_P4_nahled.jpg",
  },
];

const Cameras = () => {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({});

  const refreshCamera = (cameraId: string) => {
    setRefreshKeys(prev => ({
      ...prev,
      [cameraId]: (prev[cameraId] || 0) + 1
    }));
  };

  const refreshAllCameras = () => {
    const newKeys: Record<string, number> = {};
    cameras.forEach(cam => {
      newKeys[cam.id] = (refreshKeys[cam.id] || 0) + 1;
    });
    setRefreshKeys(newKeys);
  };

  return (
    <div className="min-h-screen bg-gradient pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-7xl">
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
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Obnovit vše
          </Button>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cameras.map((camera) => (
            <Card
              key={camera.id}
              className="glass overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              onClick={() => setSelectedCamera(camera)}
            >
              <div className="relative aspect-video bg-muted">
                <img
                  src={`${camera.url}?t=${refreshKeys[camera.id] || Date.now()}`}
                  alt={camera.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
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
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                </div>
              </div>

              {/* Camera Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{camera.name}</h3>
                <p className="text-sm text-muted-foreground">{camera.location}</p>
              </div>
            </Card>
          ))}
        </div>

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
            </div>
            <div>
              <p className="text-muted-foreground mb-2">
                • Klikněte na kameru pro fullscreen zobrazení
              </p>
              <p className="text-muted-foreground mb-2">
                • Live indikátor ukazuje aktivní kameru
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={!!selectedCamera} onOpenChange={() => setSelectedCamera(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span className="text-xl">{selectedCamera?.name}</span>
                <span className="text-sm text-muted-foreground ml-3">
                  {selectedCamera?.location}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => selectedCamera && refreshCamera(selectedCamera.id)}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedCamera && (
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={`${selectedCamera.url}?t=${refreshKeys[selectedCamera.id] || Date.now()}`}
                alt={selectedCamera.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cameras;
