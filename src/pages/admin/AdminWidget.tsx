import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWidgetSettings,
  updateWidgetSettings,
  type WidgetSettings,
  type WidgetKey,
  type WidgetMode,
  type WidgetStatus,
} from '@/lib/supabase';
import { fetchHolidayInfoData } from '@/services/holidayInfoApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mountain,
  CableCar,
  Snowflake,
  Navigation2,
  CloudSun,
  Loader2,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react';
import { GiSnowboard } from 'react-icons/gi';
import { MountainSnow } from 'lucide-react';
import { toast } from 'sonner';

// Widget configuration
const WIDGET_CONFIG: Record<WidgetKey, {
  label: string;
  icon: React.ElementType;
  description: string;
  canBeAuto: boolean;
  hasStatus: boolean;
  inputType: 'text' | 'counts';
}> = {
  skiareal: {
    label: 'Skiareál',
    icon: Mountain,
    description: 'Stav otevření areálu',
    canBeAuto: true,
    hasStatus: true,
    inputType: 'text',
  },
  vleky: {
    label: 'Vleky a lanovky',
    icon: CableCar,
    description: 'Počet otevřených vleků',
    canBeAuto: true,
    hasStatus: true,
    inputType: 'counts',
  },
  sjezdovky: {
    label: 'Sjezdovky',
    icon: MountainSnow,
    description: 'Počet otevřených sjezdovek',
    canBeAuto: true,
    hasStatus: true,
    inputType: 'counts',
  },
  vozovka: {
    label: 'Stav vozovky',
    icon: Navigation2,
    description: 'Stav příjezdové komunikace (vždy manuální)',
    canBeAuto: false,
    hasStatus: true,
    inputType: 'text',
  },
  pocasi: {
    label: 'Počasí',
    icon: CloudSun,
    description: 'Aktuální teplota',
    canBeAuto: true,
    hasStatus: false,
    inputType: 'text',
  },
  skipark: {
    label: 'Skipark',
    icon: (props: any) => <GiSnowboard {...props} />,
    description: 'Stav dětského skiparku',
    canBeAuto: true,
    hasStatus: true,
    inputType: 'text',
  },
  snih: {
    label: 'Sníh',
    icon: Snowflake,
    description: 'Výška sněhu na sjezdovkách',
    canBeAuto: true,
    hasStatus: false,
    inputType: 'text',
  },
};

const WIDGET_ORDER: WidgetKey[] = ['skiareal', 'vleky', 'sjezdovky', 'vozovka', 'pocasi', 'skipark', 'snih'];

export default function AdminWidget() {
  const queryClient = useQueryClient();

  // Fetch widget settings
  const { data: widgetSettings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['widget-settings'],
    queryFn: fetchWidgetSettings,
    staleTime: 30 * 1000,
  });

  // Fetch current API data for preview
  const { data: apiData, isLoading: isLoadingApi, refetch: refetchApi } = useQuery({
    queryKey: ['holidayInfo'],
    queryFn: fetchHolidayInfoData,
    staleTime: 60 * 1000,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, updates }: { key: WidgetKey; updates: Partial<WidgetSettings> }) => {
      return updateWidgetSettings(key, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-settings'] });
      toast.success('Nastavení uloženo');
    },
    onError: (error) => {
      toast.error('Chyba při ukládání: ' + (error as Error).message);
    },
  });

  // Get settings for a widget
  const getSettings = (key: WidgetKey): WidgetSettings | undefined => {
    return widgetSettings.find((s) => s.widget_key === key);
  };

  // Get API value for a widget
  const getApiValue = (key: WidgetKey): { value: string; status?: WidgetStatus } => {
    const operation = apiData?.operation;
    const lifts = apiData?.lifts;
    const slopes = apiData?.slopes;

    switch (key) {
      case 'skiareal':
        return {
          value: operation?.operationText || 'mimo provoz',
          status: operation?.isOpen ? 'open' : 'closed',
        };
      case 'vleky':
        return {
          value: `${lifts?.openCount || 0} z ${lifts?.totalCount || 0}`,
          status: (lifts?.openCount || 0) > 0 ? 'open' : 'closed',
        };
      case 'sjezdovky':
        return {
          value: `${slopes?.openCount || 0} z ${slopes?.totalCount || 0}`,
          status: (slopes?.openCount || 0) > 0 ? 'open' : 'closed',
        };
      case 'vozovka':
        return { value: 'N/A (není v API)', status: 'partial' };
      case 'pocasi':
        return { value: operation?.temperature ? `${operation.temperature}°C` : 'N/A' };
      case 'skipark':
        return {
          value: lifts?.skiParkOpen ? 'otevřen' : 'zavřen',
          status: lifts?.skiParkOpen ? 'open' : 'closed',
        };
      case 'snih':
        return { value: operation?.snowHeight || '0 cm' };
      default:
        return { value: 'N/A' };
    }
  };

  // Handle mode change
  const handleModeChange = async (key: WidgetKey, mode: WidgetMode) => {
    const settings = getSettings(key);
    await updateMutation.mutateAsync({
      key,
      updates: {
        mode,
        // If switching to manual, use current API value as default
        ...(mode === 'manual' && !settings?.manual_value
          ? { manual_value: getApiValue(key).value, manual_status: getApiValue(key).status }
          : {}),
      },
    });
  };

  // Handle value change
  const handleValueChange = async (key: WidgetKey, value: string) => {
    await updateMutation.mutateAsync({
      key,
      updates: { manual_value: value },
    });
  };

  // Handle status change
  const handleStatusChange = async (key: WidgetKey, status: WidgetStatus) => {
    await updateMutation.mutateAsync({
      key,
      updates: { manual_status: status },
    });
  };

  const isLoading = isLoadingSettings || isLoadingApi;

  // Get status badge color
  const getStatusBadge = (status: WidgetStatus) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500">Otevřeno</Badge>;
      case 'closed':
        return <Badge className="bg-red-500">Zavřeno</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500">Částečně</Badge>;
      default:
        return <Badge variant="secondary">N/A</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nastavení widgetů</h2>
          <p className="text-gray-600 mt-1">
            Přepínejte mezi automatickým a manuálním režimem pro každý widget
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetchApi()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingApi ? 'animate-spin' : ''}`} />
          Obnovit API data
        </Button>
      </div>

      {/* Info card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Jak to funguje:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Auto</strong> - hodnota se načítá automaticky z Holiday Info API</li>
                <li><strong>Manuální</strong> - zadáte vlastní hodnotu, která přepíše data z API</li>
                <li><strong>Stav vozovky</strong> - je vždy manuální (API tato data neposkytuje)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Widget cards */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {WIDGET_ORDER.map((key) => {
            const config = WIDGET_CONFIG[key];
            const settings = getSettings(key);
            const apiValue = getApiValue(key);
            const isManual = settings?.mode === 'manual';
            const Icon = config.icon;

            return (
              <Card key={key} className={isManual ? 'border-primary/50 bg-primary/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isManual ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config.label}</CardTitle>
                        <CardDescription className="text-xs">{config.description}</CardDescription>
                      </div>
                    </div>

                    {/* Mode switch */}
                    {config.canBeAuto ? (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!isManual ? 'font-medium' : 'text-gray-500'}`}>
                          Auto
                        </span>
                        <Switch
                          checked={isManual}
                          onCheckedChange={(checked) => handleModeChange(key, checked ? 'manual' : 'auto')}
                        />
                        <span className={`text-sm ${isManual ? 'font-medium' : 'text-gray-500'}`}>
                          Manuální
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline">Pouze manuální</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Current API value */}
                  {config.canBeAuto && (
                    <div className="text-sm">
                      <span className="text-gray-500">Hodnota z API: </span>
                      <span className="font-medium">{apiValue.value}</span>
                      {config.hasStatus && apiValue.status && (
                        <span className="ml-2">{getStatusBadge(apiValue.status)}</span>
                      )}
                    </div>
                  )}

                  {/* Manual value input */}
                  {(isManual || !config.canBeAuto) && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="space-y-2">
                        <Label htmlFor={`${key}-value`}>Manuální hodnota</Label>
                        <Input
                          id={`${key}-value`}
                          value={settings?.manual_value || ''}
                          onChange={(e) => handleValueChange(key, e.target.value)}
                          placeholder={apiValue.value}
                        />
                      </div>

                      {config.hasStatus && (
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-status`}>Stav (barva)</Label>
                          <Select
                            value={settings?.manual_status || 'closed'}
                            onValueChange={(value) => handleStatusChange(key, value as WidgetStatus)}
                          >
                            <SelectTrigger id={`${key}-status`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-green-500" />
                                  Otevřeno (zelená)
                                </div>
                              </SelectItem>
                              <SelectItem value="closed">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500" />
                                  Zavřeno (červená)
                                </div>
                              </SelectItem>
                              <SelectItem value="partial">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                  Částečně (žlutá)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Current display value */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Aktuálně zobrazeno:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {isManual || !config.canBeAuto
                            ? settings?.manual_value || apiValue.value
                            : apiValue.value}
                        </span>
                        {config.hasStatus && (
                          getStatusBadge(
                            isManual || !config.canBeAuto
                              ? settings?.manual_status
                              : apiValue.status
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
