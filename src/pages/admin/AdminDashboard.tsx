import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, ArrowRight, Camera, Gauge, Cable, Share2, Loader2 } from 'lucide-react';
import {
  fetchAllPricingItems,
  fetchCameraSettings,
  fetchWidgetSettings,
  fetchSlopesLiftsOverrides,
  fetchAutopostSettings,
} from '@/lib/supabase';

export default function AdminDashboard() {
  // Fetch data for system overview
  const { data: pricingItems, isLoading: pricingLoading } = useQuery({
    queryKey: ['pricing-items-all'],
    queryFn: fetchAllPricingItems,
  });

  const { data: cameraSettings, isLoading: camerasLoading } = useQuery({
    queryKey: ['camera-settings'],
    queryFn: fetchCameraSettings,
  });

  const { data: widgetSettings, isLoading: widgetsLoading } = useQuery({
    queryKey: ['widget-settings'],
    queryFn: fetchWidgetSettings,
  });

  const { data: slopesLifts, isLoading: slopesLoading } = useQuery({
    queryKey: ['slopes-lifts-overrides'],
    queryFn: fetchSlopesLiftsOverrides,
  });

  const { data: autopostSettings, isLoading: autopostLoading } = useQuery({
    queryKey: ['autopost-settings'],
    queryFn: fetchAutopostSettings,
  });

  // Calculate stats
  const activeCameras = cameraSettings?.filter(c => c.is_active).length ?? 0;

  const autoWidgets = widgetSettings?.filter(w => w.mode === 'auto').length ?? 0;
  const manualWidgets = widgetSettings?.filter(w => w.mode === 'manual').length ?? 0;

  const slopes = slopesLifts?.filter(s => s.type === 'slope') ?? [];
  const lifts = slopesLifts?.filter(s => s.type === 'lift') ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vítejte v administraci</h2>
        <p className="text-gray-600 mt-1">
          SKI CENTRUM KOHÚTKA - správa obsahu webu
        </p>
      </div>

      {/* Quick links with integrated stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rychlé odkazy</h3>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Správa ceníku */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Správa ceníku</CardTitle>
              </div>
              <div className="mt-2">
                {pricingLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <span className="text-2xl font-bold text-gray-900">{pricingItems?.length ?? 0} <span className="text-sm font-normal text-gray-500">položek</span></span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Upravovat ceny, přidávat položky a kategorie</CardDescription>
              <Link to="/admin/cenik">
                <Button variant="outline" className="w-full group">
                  Otevřít
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Správa webkamer */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Správa webkamer</CardTitle>
              </div>
              <div className="mt-2">
                {camerasLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <span className="text-2xl font-bold text-gray-900">{activeCameras}/8 <span className="text-sm font-normal text-gray-500">aktivních</span></span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Aktivovat/deaktivovat kamery, měnit popis a pořadí</CardDescription>
              <Link to="/admin/kamery">
                <Button variant="outline" className="w-full group">
                  Otevřít
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Nastavení widgetů */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Nastavení widgetů</CardTitle>
              </div>
              <div className="mt-2 flex gap-2">
                {widgetsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {autoWidgets} auto
                    </Badge>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {manualWidgets} manual
                    </Badge>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Auto/Manuální režim pro widgety na hlavní stránce</CardDescription>
              <Link to="/admin/widget">
                <Button variant="outline" className="w-full group">
                  Otevřít
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Sjezdovky a vleky */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Cable className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Sjezdovky a vleky</CardTitle>
              </div>
              <div className="mt-2">
                {slopesLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-900">{slopes.length}</span> sjezdovek, <span className="font-semibold text-gray-900">{lifts.length}</span> vleků
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Manuální přepis stavu sjezdovek a vleků</CardDescription>
              <Link to="/admin/sjezdovky">
                <Button variant="outline" className="w-full group">
                  Otevřít
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Auto-posting */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">Auto-posting</CardTitle>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {autopostLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : (
                  <>
                    <Badge
                      variant={autopostSettings?.enabled ? "default" : "secondary"}
                      className={autopostSettings?.enabled ? "bg-green-500" : ""}
                    >
                      {autopostSettings?.enabled ? 'Aktivní' : 'Vypnutý'}
                    </Badge>
                    {autopostSettings?.enabled && autopostSettings?.schedule_type !== 'disabled' && (
                      <span className="text-sm text-gray-600">
                        {autopostSettings.schedule_type === 'daily' && (
                          <>v {autopostSettings.morning_time}</>
                        )}
                        {autopostSettings.schedule_type === 'twice_daily' && (
                          <>{autopostSettings.morning_time} a {autopostSettings.afternoon_time}</>
                        )}
                      </span>
                    )}
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">Automatické publikování na sociální sítě</CardDescription>
              <Link to="/admin/autopost">
                <Button variant="outline" className="w-full group">
                  Otevřít
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
