import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWidgetSettings,
  updateWidgetSettings,
  updateWidgetOrder,
  fetchSiteSetting,
  updateSiteSetting,
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
  RefreshCw,
  Info,
  ChevronUp,
  ChevronDown,
  Save,
  Facebook,
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

export default function AdminWidget() {
  const queryClient = useQueryClient();

  // Local state for editing (prevents lag while typing)
  const [localEdits, setLocalEdits] = useState<Record<WidgetKey, { value: string; status: WidgetStatus; extra: Record<string, any> }>>({} as any);

  // Fetch widget settings
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

  const isFacebookFeedVisible = facebookSetting?.value?.visible !== false;

  // Initialize local edits when widget settings load
  useEffect(() => {
    if (widgetSettings.length > 0) {
      const edits: Record<WidgetKey, { value: string; status: WidgetStatus; extra: Record<string, any> }> = {} as any;
      widgetSettings.forEach((w) => {
        edits[w.widget_key] = {
          value: w.manual_value || '',
          status: w.manual_status || 'closed',
          extra: w.manual_extra || {},
        };
      });
      setLocalEdits(edits);
    }
  }, [widgetSettings]);

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

  // Order mutation
  const orderMutation = useMutation({
    mutationFn: updateWidgetOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-settings'] });
      toast.success('Pořadí uloženo');
    },
    onError: (error) => {
      toast.error('Chyba při ukládání pořadí: ' + (error as Error).message);
    },
  });

  // Facebook feed visibility mutation
  const facebookMutation = useMutation({
    mutationFn: (visible: boolean) => updateSiteSetting('facebook_feed_visible', { visible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-setting', 'facebook_feed_visible'] });
      toast.success('Nastavení uloženo');
    },
    onError: (error) => {
      toast.error('Chyba při ukládání: ' + (error as Error).message);
    },
  });

  // Get sorted widgets
  const sortedWidgets = [...widgetSettings].sort((a, b) => a.sort_order - b.sort_order);

  // Move widget up or down
  const handleMoveWidget = async (key: WidgetKey, direction: 'up' | 'down') => {
    const currentIndex = sortedWidgets.findIndex((w) => w.widget_key === key);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedWidgets.length) return;

    // Swap sort_order values
    const newOrders = sortedWidgets.map((w, i) => {
      if (i === currentIndex) {
        return { widget_key: w.widget_key, sort_order: sortedWidgets[newIndex].sort_order };
      }
      if (i === newIndex) {
        return { widget_key: w.widget_key, sort_order: sortedWidgets[currentIndex].sort_order };
      }
      return { widget_key: w.widget_key, sort_order: w.sort_order };
    });

    await orderMutation.mutateAsync(newOrders);
  };

  // Get settings for a widget
  const getSettings = (key: WidgetKey): WidgetSettings | undefined => {
    return widgetSettings.find((s) => s.widget_key === key);
  };

  // Get API value for a widget
  const getApiValue = (key: WidgetKey): { value: string; subValue?: string; status?: WidgetStatus; extra?: Record<string, any> } => {
    const operation = apiData?.operation;
    const lifts = apiData?.lifts;
    const slopes = apiData?.slopes;

    switch (key) {
      case 'skiareal':
        return {
          value: operation?.operationText || 'mimo provoz',
          subValue: operation?.opertime || undefined,
          status: operation?.isOpen ? 'open' : 'closed',
          extra: {
            isNightSkiing: operation?.isNightSkiing || false,
            opertime: operation?.opertime || '',
          },
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
        return {
          value: operation?.temperature ? `${operation.temperature}°C` : 'N/A',
          subValue: operation?.weather || undefined,
          extra: { weather: operation?.weather || '' },
        };
      case 'skipark':
        return {
          value: lifts?.skiParkOpen ? 'otevřen' : 'zavřen',
          status: lifts?.skiParkOpen ? 'open' : 'closed',
        };
      case 'snih':
        return {
          value: operation?.snowHeight || '0 cm',
          subValue: operation?.snowType || undefined,
          extra: { snowType: operation?.snowType || '' },
        };
      default:
        return { value: 'N/A' };
    }
  };

  // Handle mode change
  const handleModeChange = async (key: WidgetKey, mode: WidgetMode) => {
    const settings = getSettings(key);
    const apiValue = getApiValue(key);
    await updateMutation.mutateAsync({
      key,
      updates: {
        mode,
        // If switching to manual, use current API value as default
        ...(mode === 'manual' && !settings?.manual_value
          ? {
              manual_value: apiValue.value,
              manual_status: apiValue.status,
              manual_extra: apiValue.extra || null,
            }
          : {}),
      },
    });
  };

  // Handle local value change (no DB save)
  const handleLocalValueChange = (key: WidgetKey, value: string) => {
    setLocalEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  // Handle local status change (no DB save)
  const handleLocalStatusChange = (key: WidgetKey, status: WidgetStatus) => {
    setLocalEdits((prev) => ({
      ...prev,
      [key]: { ...prev[key], status },
    }));
  };

  // Handle local extra change (no DB save)
  const handleLocalExtraChange = (key: WidgetKey, extraKey: string, extraValue: any) => {
    setLocalEdits((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        extra: { ...prev[key]?.extra, [extraKey]: extraValue },
      },
    }));
  };

  // Save to database
  const handleSave = async (key: WidgetKey) => {
    const edits = localEdits[key];
    if (!edits) return;

    await updateMutation.mutateAsync({
      key,
      updates: {
        manual_value: edits.value,
        manual_status: edits.status,
        manual_extra: Object.keys(edits.extra || {}).length > 0 ? edits.extra : null,
      },
    });
  };

  // Check if widget has unsaved changes
  const hasUnsavedChanges = (key: WidgetKey): boolean => {
    const widget = widgetSettings.find((w) => w.widget_key === key);
    const local = localEdits[key];
    if (!widget || !local) return false;

    const valueChanged = (widget.manual_value || '') !== local.value;
    const statusChanged = (widget.manual_status || 'closed') !== local.status;
    const extraChanged = JSON.stringify(widget.manual_extra || {}) !== JSON.stringify(local.extra || {});

    return valueChanged || statusChanged || extraChanged;
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

      {/* Facebook Feed Section Visibility */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isFacebookFeedVisible ? 'bg-[#1877F2] text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                <Facebook className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Novinky z Kohútky (Facebook)</CardTitle>
                <CardDescription className="text-xs">Sekce s příspěvky z Facebooku na hlavní stránce</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!isFacebookFeedVisible ? 'font-medium' : 'text-gray-500'}`}>
                Skryto
              </span>
              <Switch
                checked={isFacebookFeedVisible}
                onCheckedChange={(checked) => facebookMutation.mutate(checked)}
                disabled={facebookMutation.isPending}
              />
              <span className={`text-sm ${isFacebookFeedVisible ? 'font-medium' : 'text-gray-500'}`}>
                Zobrazeno
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            {isFacebookFeedVisible
              ? 'Sekce "Novinky z Kohútky" je aktuálně zobrazena na hlavní stránce.'
              : 'Sekce "Novinky z Kohútky" je aktuálně skrytá na hlavní stránce.'}
          </p>
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
          {sortedWidgets.map((widget, index) => {
            const key = widget.widget_key;
            const config = WIDGET_CONFIG[key];
            if (!config) return null;
            const apiValue = getApiValue(key);
            const isManual = widget.mode === 'manual';
            const Icon = config.icon;

            return (
              <Card key={key} className={isManual ? 'border-primary/50 bg-primary/5' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Order buttons */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveWidget(key, 'up')}
                          disabled={index === 0 || orderMutation.isPending}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveWidget(key, 'down')}
                          disabled={index === sortedWidgets.length - 1 || orderMutation.isPending}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
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
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-500">Hodnota z API: </span>
                        <span className="font-medium">{apiValue.value}</span>
                        {apiValue.subValue && (
                          <span className="text-gray-500 ml-1">({apiValue.subValue})</span>
                        )}
                        {config.hasStatus && apiValue.status && (
                          <span className="ml-2">{getStatusBadge(apiValue.status)}</span>
                        )}
                      </div>
                      {key === 'skiareal' && apiValue.extra?.isNightSkiing && (
                        <div>
                          <Badge className="bg-purple-500">Noční lyžování</Badge>
                        </div>
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
                          value={localEdits[key]?.value || ''}
                          onChange={(e) => handleLocalValueChange(key, e.target.value)}
                          placeholder={apiValue.value}
                        />
                      </div>

                      {/* Extra fields for pocasi widget */}
                      {key === 'pocasi' && (
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-weather`}>Popis počasí</Label>
                          <Input
                            id={`${key}-weather`}
                            value={localEdits[key]?.extra?.weather || ''}
                            onChange={(e) => handleLocalExtraChange(key, 'weather', e.target.value)}
                            placeholder={apiValue.extra?.weather || 'jasno'}
                          />
                        </div>
                      )}

                      {/* Extra fields for snih widget */}
                      {key === 'snih' && (
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-snowType`}>Typ sněhu</Label>
                          <Input
                            id={`${key}-snowType`}
                            value={localEdits[key]?.extra?.snowType || ''}
                            onChange={(e) => handleLocalExtraChange(key, 'snowType', e.target.value)}
                            placeholder={apiValue.extra?.snowType || 'prachový'}
                          />
                        </div>
                      )}

                      {/* Extra fields for skiareal widget */}
                      {key === 'skiareal' && (
                        <>
                          <div className="flex items-center justify-between py-2">
                            <Label htmlFor={`${key}-nightSkiing`}>Noční lyžování</Label>
                            <Switch
                              id={`${key}-nightSkiing`}
                              checked={localEdits[key]?.extra?.isNightSkiing || false}
                              onCheckedChange={(v) => handleLocalExtraChange(key, 'isNightSkiing', v)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${key}-opertime`}>Otevírací doba</Label>
                            <Input
                              id={`${key}-opertime`}
                              value={localEdits[key]?.extra?.opertime || ''}
                              onChange={(e) => handleLocalExtraChange(key, 'opertime', e.target.value)}
                              placeholder={apiValue.extra?.opertime || '08:30-16:00'}
                            />
                          </div>
                        </>
                      )}

                      {config.hasStatus && (
                        <div className="space-y-2">
                          <Label htmlFor={`${key}-status`}>Stav (barva)</Label>
                          <Select
                            value={localEdits[key]?.status || 'closed'}
                            onValueChange={(value) => handleLocalStatusChange(key, value as WidgetStatus)}
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

                      {/* Save button */}
                      <Button
                        onClick={() => handleSave(key)}
                        disabled={!hasUnsavedChanges(key) || updateMutation.isPending}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateMutation.isPending ? 'Ukládám...' : 'Uložit změny'}
                      </Button>
                    </div>
                  )}

                  {/* Current display value */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Aktuálně zobrazeno:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {isManual || !config.canBeAuto
                            ? widget.manual_value || apiValue.value
                            : apiValue.value}
                        </span>
                        {config.hasStatus && (
                          getStatusBadge(
                            isManual || !config.canBeAuto
                              ? widget.manual_status
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
