import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSlopesLiftsOverrides,
  upsertSlopeLiftOverride,
  updateSlopeLiftOverride,
  type SlopeLiftOverride,
  type SlopeLiftMode,
} from '@/lib/supabase';
import { fetchHolidayInfoData } from '@/services/holidayInfoApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mountain, Cable, CircleCheck, CircleX, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminSlopesLifts() {
  const queryClient = useQueryClient();

  // Fetch API data
  const { data: apiData, isLoading: isLoadingApi, refetch: refetchApi } = useQuery({
    queryKey: ['holiday-info-details'],
    queryFn: fetchHolidayInfoData,
    staleTime: 60 * 1000,
  });

  // Fetch overrides from database
  const { data: overrides = [], isLoading: isLoadingOverrides } = useQuery({
    queryKey: ['slopes-lifts-overrides'],
    queryFn: fetchSlopesLiftsOverrides,
    staleTime: 30 * 1000,
  });

  // Upsert mutation (create if not exists)
  const upsertMutation = useMutation({
    mutationFn: upsertSlopeLiftOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slopes-lifts-overrides'] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<SlopeLiftOverride, 'is_open' | 'mode'>> }) =>
      updateSlopeLiftOverride(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slopes-lifts-overrides'] });
      toast.success('Uloženo');
    },
    onError: (error) => {
      toast.error('Chyba: ' + (error as Error).message);
    },
  });

  // Initialize overrides from API data
  useEffect(() => {
    if (!apiData || overrides.length > 0) return;

    const initOverrides = async () => {
      const slopesDetailed = apiData.slopesDetailed || [];
      const liftsDetailed = apiData.liftsDetailed || [];

      for (const slope of slopesDetailed) {
        await upsertMutation.mutateAsync({
          id: `slope_${slope.id}`,
          type: 'slope',
          name: slope.name,
          is_open: slope.status_code !== 2 && slope.status_code !== 3,
          mode: 'auto',
        });
      }

      for (const lift of liftsDetailed) {
        await upsertMutation.mutateAsync({
          id: `lift_${lift.id}`,
          type: 'lift',
          name: lift.name,
          is_open: lift.status_code !== 2,
          mode: 'auto',
        });
      }
    };

    initOverrides();
  }, [apiData, overrides.length]);

  // Get override for an item
  const getOverride = (type: 'slope' | 'lift', id: number): SlopeLiftOverride | undefined => {
    return overrides.find((o) => o.id === `${type}_${id}`);
  };

  // Get effective status (considering override)
  const getEffectiveStatus = (type: 'slope' | 'lift', id: number, apiIsOpen: boolean): boolean => {
    const override = getOverride(type, id);
    if (override && override.mode === 'manual') {
      return override.is_open;
    }
    return apiIsOpen;
  };

  // Handle mode toggle
  const handleModeToggle = async (type: 'slope' | 'lift', id: number, name: string, apiIsOpen: boolean) => {
    const overrideId = `${type}_${id}`;
    const existing = overrides.find((o) => o.id === overrideId);

    if (existing) {
      const newMode: SlopeLiftMode = existing.mode === 'auto' ? 'manual' : 'auto';
      await updateMutation.mutateAsync({
        id: overrideId,
        updates: { mode: newMode },
      });
    } else {
      await upsertMutation.mutateAsync({
        id: overrideId,
        type,
        name,
        is_open: apiIsOpen,
        mode: 'manual',
      });
    }
  };

  // Handle status toggle (only when manual)
  const handleStatusToggle = async (type: 'slope' | 'lift', id: number) => {
    const overrideId = `${type}_${id}`;
    const existing = overrides.find((o) => o.id === overrideId);

    if (existing && existing.mode === 'manual') {
      await updateMutation.mutateAsync({
        id: overrideId,
        updates: { is_open: !existing.is_open },
      });
    }
  };

  const isLoading = isLoadingApi || isLoadingOverrides;
  const slopesDetailed = apiData?.slopesDetailed || [];
  const liftsDetailed = apiData?.liftsDetailed || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sjezdovky a lanovky</h2>
          <p className="text-gray-600 mt-1">
            Manuální přepis stavu sjezdovek a lanovek
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
                <li><strong>Auto</strong> - stav se načítá automaticky z Holiday Info API</li>
                <li><strong>Manuální</strong> - můžete přepsat stav ručně (otevřeno/zavřeno)</li>
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

      {!isLoading && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Slopes */}
          <Card>
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Mountain className="w-5 h-5" />
                Sjezdovky ({slopesDetailed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {slopesDetailed.map((slope) => {
                  const apiIsOpen = slope.status_code !== 2 && slope.status_code !== 3;
                  const override = getOverride('slope', slope.id);
                  const isManual = override?.mode === 'manual';
                  const effectiveStatus = getEffectiveStatus('slope', slope.id, apiIsOpen);

                  return (
                    <div
                      key={slope.id}
                      className={`p-4 flex items-center justify-between ${isManual ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            effectiveStatus ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {effectiveStatus ? (
                            <CircleCheck className="w-5 h-5 text-green-600" />
                          ) : (
                            <CircleX className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{slope.name}</div>
                          <div className="text-xs text-gray-500">
                            API: {apiIsOpen ? 'otevřeno' : 'zavřeno'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Manual status toggle */}
                        {isManual && (
                          <Button
                            variant={effectiveStatus ? 'default' : 'destructive'}
                            size="sm"
                            onClick={() => handleStatusToggle('slope', slope.id)}
                            disabled={updateMutation.isPending}
                          >
                            {effectiveStatus ? 'Otevřeno' : 'Zavřeno'}
                          </Button>
                        )}

                        {/* Mode toggle */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${!isManual ? 'font-medium' : 'text-gray-500'}`}>
                            Auto
                          </span>
                          <Switch
                            checked={isManual}
                            onCheckedChange={() => handleModeToggle('slope', slope.id, slope.name, apiIsOpen)}
                            disabled={updateMutation.isPending || upsertMutation.isPending}
                          />
                          <span className={`text-xs ${isManual ? 'font-medium' : 'text-gray-500'}`}>
                            Manuální
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lifts */}
          <Card>
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Cable className="w-5 h-5" />
                Vleky a lanovky ({liftsDetailed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {liftsDetailed.map((lift) => {
                  const apiIsOpen = lift.status_code !== 2;
                  const override = getOverride('lift', lift.id);
                  const isManual = override?.mode === 'manual';
                  const effectiveStatus = getEffectiveStatus('lift', lift.id, apiIsOpen);

                  return (
                    <div
                      key={lift.id}
                      className={`p-4 flex items-center justify-between ${isManual ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            effectiveStatus ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {effectiveStatus ? (
                            <CircleCheck className="w-5 h-5 text-green-600" />
                          ) : (
                            <CircleX className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{lift.name}</div>
                          <div className="text-xs text-gray-500">
                            API: {apiIsOpen ? 'otevřeno' : 'zavřeno'} | {lift.type_text}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Manual status toggle */}
                        {isManual && (
                          <Button
                            variant={effectiveStatus ? 'default' : 'destructive'}
                            size="sm"
                            onClick={() => handleStatusToggle('lift', lift.id)}
                            disabled={updateMutation.isPending}
                          >
                            {effectiveStatus ? 'Otevřeno' : 'Zavřeno'}
                          </Button>
                        )}

                        {/* Mode toggle */}
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${!isManual ? 'font-medium' : 'text-gray-500'}`}>
                            Auto
                          </span>
                          <Switch
                            checked={isManual}
                            onCheckedChange={() => handleModeToggle('lift', lift.id, lift.name, apiIsOpen)}
                            disabled={updateMutation.isPending || upsertMutation.isPending}
                          />
                          <span className={`text-xs ${isManual ? 'font-medium' : 'text-gray-500'}`}>
                            Manuální
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
