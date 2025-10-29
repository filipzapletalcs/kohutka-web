import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { fetchHolidayInfoData } from "@/services/holidayInfoApi";

const ApiDebug = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-primary-foreground mb-8">
            Holiday Info API Debug
          </h1>

          <Card className="glass p-6 mb-6">
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
        </div>
      </div>
    </>
  );
};

export default ApiDebug;
