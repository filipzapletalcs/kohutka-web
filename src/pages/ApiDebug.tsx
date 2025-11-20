import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Video, Image as ImageIcon, Mountain } from "lucide-react";
import Navigation from "@/components/Navigation";
import { fetchHolidayInfoData } from "@/services/holidayInfoApi";

const ApiDebug = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testData, setTestData] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const testFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await fetchHolidayInfoData();
      setData(result);
      console.log("API Data:", result);
    } catch (err: any) {
      setError(err.message);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testCameraSupport = async () => {
    setTestLoading(true);
    setTestError(null);
    setTestData(null);

    try {
      const response = await fetch('/api/holidayinfo-test');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setTestData(result);
      console.log("Camera Support Data:", result);
    } catch (err: any) {
      setTestError(err.message);
      console.error("Camera Test Error:", err);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-primary-foreground mb-8">
            Holiday Info API Debug
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="glass p-6">
              <h3 className="font-semibold mb-3">Standard API Test</h3>
              <Button
                onClick={testFetch}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Test API Fetch
              </Button>
            </Card>

            <Card className="glass p-6">
              <h3 className="font-semibold mb-3">Camera Support Test</h3>
              <Button
                onClick={testCameraSupport}
                disabled={testLoading}
                className="w-full"
                size="lg"
                variant="secondary"
              >
                {testLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Test Camera Features
              </Button>
            </Card>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Chyba</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {data && (
            <Alert className="mb-6 bg-green-500/10 border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Úspěch!</AlertTitle>
              <AlertDescription>Data byla úspěšně načtena</AlertDescription>
            </Alert>
          )}

          {data && (
            <>
              <Card className="glass p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Kamery ({data.cameras?.length || 0})</h2>
                <div className="space-y-4">
                  {data.cameras?.map((cam: any) => (
                    <div key={cam.id} className="border-b border-border pb-4">
                      <h3 className="font-semibold text-lg">{cam.name} (ID: {cam.id})</h3>
                      <p className="text-sm text-muted-foreground mb-2">{cam.description}</p>
                      <div className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        <p><strong>URL:</strong> {cam.media.last_image.url}</p>
                        <p><strong>Teplota:</strong> {cam.media.last_image.temp}°C</p>
                        <p><strong>Čas:</strong> {cam.media.last_image.time}</p>
                      </div>
                      {cam.media.last_image.url && (
                        <img
                          src={cam.media.last_image.url}
                          alt={cam.name}
                          className="mt-2 w-full max-w-md rounded border"
                          onError={(e) => {
                            console.error(`Failed to load image for camera ${cam.id}`);
                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="glass p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Provozní Status</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Status:</p>
                    <p>{data.operation?.isOpen ? "Otevřeno ✅" : "Zavřeno ❌"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Text:</p>
                    <p>{data.operation?.operationText}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Čas:</p>
                    <p>{data.operation?.opertime}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Teplota:</p>
                    <p>{data.operation?.temperature}°C</p>
                  </div>
                  <div>
                    <p className="font-semibold">Počasí:</p>
                    <p>{data.operation?.weather}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Sníh:</p>
                    <p>{data.operation?.snowHeight}</p>
                  </div>
                </div>
              </Card>

              <Card className="glass p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">Lanovky & Sjezdovky</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Lanovky otevřené:</p>
                    <p>{data.lifts?.openCount} / {data.lifts?.totalCount}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Skipark:</p>
                    <p>{data.lifts?.skiParkOpen ? "Otevřen ✅" : "Zavřen ❌"}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Sjezdovky otevřené:</p>
                    <p>{data.slopes?.openCount} / {data.slopes?.totalCount}</p>
                  </div>
                </div>
              </Card>

              <Card className="glass p-6">
                <h2 className="text-2xl font-bold mb-4">Raw XML (první 1000 znaků)</h2>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
                  {data.rawXML?.substring(0, 1000)}...
                </pre>
              </Card>
            </>
          )}

          {testError && (
            <Alert variant="destructive" className="mb-6">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Chyba Camera Test</AlertTitle>
              <AlertDescription>{testError}</AlertDescription>
            </Alert>
          )}

          {testData && (
            <Alert className="mb-6 bg-green-500/10 border-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Camera Test úspěšný!</AlertTitle>
              <AlertDescription>
                Nalezeno {testData.totalCameras} kamer
                ({testData.summary.withVideo} s videem, {testData.summary.withPanorama} s panoramou)
              </AlertDescription>
            </Alert>
          )}

          {testData && (
            <Card className="glass p-6 mb-6">
              <h2 className="text-2xl font-bold mb-6">Podporované funkce kamer</h2>
              <div className="space-y-6">
                {testData.cameras?.map((cam: any) => (
                  <div key={cam.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{cam.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ID: {cam.id} | Výška: {cam.sealevel}m
                        </p>
                        {cam.lastUpdate && (
                          <p className="text-xs text-muted-foreground">
                            Poslední aktualizace: {cam.lastUpdate}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {cam.features.hasImage && (
                          <Badge variant="secondary" className="bg-blue-500 text-white">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Image
                          </Badge>
                        )}
                        {cam.features.hasVideo && (
                          <Badge variant="secondary" className="bg-green-500 text-white">
                            <Video className="h-3 w-3 mr-1" />
                            Video
                          </Badge>
                        )}
                        {cam.features.hasPanorama && (
                          <Badge variant="secondary" className="bg-purple-500 text-white">
                            <Mountain className="h-3 w-3 mr-1" />
                            Panorama
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Image Preview */}
                      {cam.features.hasImage && cam.proxyUrls.imagePreview && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Image Preview (640px):</p>
                          <img
                            src={cam.proxyUrls.imagePreview}
                            alt={cam.name}
                            className="w-full rounded border"
                            onError={(e) => {
                              console.error(`Failed to load image for camera ${cam.id}`);
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20" fill="red">Error</text></svg>';
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1 break-all">
                            {cam.proxyUrls.imagePreview}
                          </p>
                        </div>
                      )}

                      {/* Panorama Preview */}
                      {cam.features.hasPanorama && cam.proxyUrls.panorama && (
                        <div>
                          <p className="text-xs font-semibold mb-2">Panorama (1920px):</p>
                          <img
                            src={cam.proxyUrls.panorama}
                            alt={`${cam.name} Panorama`}
                            className="w-full rounded border"
                            onError={(e) => {
                              console.error(`Failed to load panorama for camera ${cam.id}`);
                              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20" fill="red">Error</text></svg>';
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground mt-1 break-all">
                            {cam.proxyUrls.panorama}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Video Info */}
                    {cam.features.hasVideo && cam.videoInfo && (
                      <div className="mt-4 bg-muted/30 p-3 rounded">
                        <p className="text-xs font-semibold mb-2">Video formáty:</p>
                        <div className="space-y-1">
                          {cam.videoInfo.formats.map((format: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <Badge variant="outline" className="mr-2">{format.id}</Badge>
                              <span className="text-muted-foreground">{format.size}</span>
                            </div>
                          ))}
                        </div>
                        {cam.proxyUrls.video && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold mb-2">Video přes proxy:</p>
                            <video
                              controls
                              className="w-full max-w-md rounded border"
                              onError={() => console.error(`Failed to load video for camera ${cam.id}`)}
                            >
                              <source src={cam.proxyUrls.video} type="video/mp4" />
                            </video>
                            <p className="text-[10px] text-muted-foreground mt-1 break-all">
                              {cam.proxyUrls.video}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default ApiDebug;
