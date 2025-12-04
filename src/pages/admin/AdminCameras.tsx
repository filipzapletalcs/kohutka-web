import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  fetchCameraSettings,
  upsertCameraSettings,
  type CameraSettings,
} from '@/lib/supabase';
import { fetchHolidayInfoData } from '@/services/holidayInfoApi';
import { Camera as CameraType } from '@/types/holidayInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Camera,
  Video,
  Mountain,
  Pencil,
  Save,
  Loader2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CameraWithSettings extends CameraType {
  settings?: CameraSettings;
  displayName: string;
  displayDescription: string;
}

export default function AdminCameras() {
  const queryClient = useQueryClient();
  const [editingCamera, setEditingCamera] = useState<CameraWithSettings | null>(null);
  const [editForm, setEditForm] = useState({ custom_name: '', custom_description: '' });

  // Fetch cameras from Holiday Info API
  const {
    data: holidayData,
    isLoading: isLoadingCameras,
    error: camerasError,
    refetch: refetchCameras,
  } = useQuery({
    queryKey: ['holidayInfo'],
    queryFn: fetchHolidayInfoData,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch camera settings from Supabase
  const { data: cameraSettings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['camera-settings'],
    queryFn: fetchCameraSettings,
    staleTime: 30 * 1000,
  });

  // Merge cameras with settings
  const camerasWithSettings: CameraWithSettings[] = (holidayData?.cameras || [])
    .filter((camera: CameraType) => camera.source !== 'archive' || camera.id === 'kohutka-p0')
    .map((camera: CameraType, index: number) => {
      const settings = cameraSettings.find((s) => s.camera_id === camera.id);
      return {
        ...camera,
        settings,
        displayName: settings?.custom_name || camera.name,
        displayDescription: settings?.custom_description || camera.description,
      };
    })
    .sort((a, b) => {
      const orderA = a.settings?.sort_order ?? 999;
      const orderB = b.settings?.sort_order ?? 999;
      return orderA - orderB;
    });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      camera_id: string;
      custom_name: string | null;
      custom_description: string | null;
      is_active: boolean;
      sort_order: number;
    }) => {
      return upsertCameraSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camera-settings'] });
      toast.success('Nastavení uloženo');
    },
    onError: (error) => {
      toast.error('Chyba při ukládání: ' + (error as Error).message);
    },
  });

  // Toggle active status
  const toggleActive = async (camera: CameraWithSettings) => {
    const newIsActive = !(camera.settings?.is_active ?? true);
    await saveMutation.mutateAsync({
      camera_id: camera.id,
      custom_name: camera.settings?.custom_name ?? null,
      custom_description: camera.settings?.custom_description ?? null,
      is_active: newIsActive,
      sort_order: camera.settings?.sort_order ?? camerasWithSettings.indexOf(camera),
    });
  };

  // Move camera up/down
  const moveCamera = async (camera: CameraWithSettings, direction: 'up' | 'down') => {
    const currentIndex = camerasWithSettings.findIndex((c) => c.id === camera.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= camerasWithSettings.length) return;

    const targetCamera = camerasWithSettings[targetIndex];
    const currentOrder = camera.settings?.sort_order ?? currentIndex;
    const targetOrder = targetCamera.settings?.sort_order ?? targetIndex;

    // Swap orders
    await Promise.all([
      saveMutation.mutateAsync({
        camera_id: camera.id,
        custom_name: camera.settings?.custom_name ?? null,
        custom_description: camera.settings?.custom_description ?? null,
        is_active: camera.settings?.is_active ?? true,
        sort_order: targetOrder,
      }),
      saveMutation.mutateAsync({
        camera_id: targetCamera.id,
        custom_name: targetCamera.settings?.custom_name ?? null,
        custom_description: targetCamera.settings?.custom_description ?? null,
        is_active: targetCamera.settings?.is_active ?? true,
        sort_order: currentOrder,
      }),
    ]);
  };

  // Open edit dialog
  const openEditDialog = (camera: CameraWithSettings) => {
    setEditingCamera(camera);
    setEditForm({
      custom_name: camera.settings?.custom_name || '',
      custom_description: camera.settings?.custom_description || '',
    });
  };

  // Save edit
  const saveEdit = async () => {
    if (!editingCamera) return;

    await saveMutation.mutateAsync({
      camera_id: editingCamera.id,
      custom_name: editForm.custom_name || null,
      custom_description: editForm.custom_description || null,
      is_active: editingCamera.settings?.is_active ?? true,
      sort_order: editingCamera.settings?.sort_order ?? camerasWithSettings.indexOf(editingCamera),
    });

    setEditingCamera(null);
  };

  // Initialize sort orders if not set
  useEffect(() => {
    const initSortOrders = async () => {
      if (cameraSettings.length === 0 && camerasWithSettings.length > 0) {
        // Initialize sort orders for all cameras
        for (let i = 0; i < camerasWithSettings.length; i++) {
          const camera = camerasWithSettings[i];
          if (!camera.settings) {
            await saveMutation.mutateAsync({
              camera_id: camera.id,
              custom_name: null,
              custom_description: null,
              is_active: true,
              sort_order: i,
            });
          }
        }
      }
    };

    if (!isLoadingCameras && !isLoadingSettings) {
      initSortOrders();
    }
  }, [isLoadingCameras, isLoadingSettings, cameraSettings.length]);

  const isLoading = isLoadingCameras || isLoadingSettings;

  // Helper to get camera type badge
  const getCameraTypeBadge = (camera: CameraType) => {
    if (camera.hasLiveStream) {
      return (
        <Badge className="bg-red-500 text-white">
          <Video className="w-3 h-3 mr-1" />
          LIVE
        </Badge>
      );
    }
    if (camera.hasPanorama) {
      return (
        <Badge className="bg-purple-500 text-white">
          <Mountain className="w-3 h-3 mr-1" />
          PANORAMA
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Camera className="w-3 h-3 mr-1" />
        SNÍMEK
      </Badge>
    );
  };

  // Helper to get camera preview URL
  const getCameraPreviewUrl = (camera: CameraType) => {
    const baseUrl = camera.media.last_image.url;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${Date.now()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Správa webkamer</h2>
          <p className="text-gray-600 mt-1">
            Aktivujte/deaktivujte kamery, měňte popis a pořadí
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetchCameras()}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Obnovit
        </Button>
      </div>

      {/* Error state */}
      {camerasError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>Chyba při načítání kamer z API</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Camera grid */}
      {!isLoading && (
        <div className="grid gap-4">
          {camerasWithSettings.map((camera, index) => {
            const isActive = camera.settings?.is_active ?? true;

            return (
              <Card
                key={camera.id}
                className={`transition-all ${!isActive ? 'opacity-60 bg-gray-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Camera preview */}
                    <div className="relative w-48 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={getCameraPreviewUrl(camera)}
                        alt={camera.displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-camera.jpg';
                        }}
                      />
                      <div className="absolute top-2 left-2">
                        {getCameraTypeBadge(camera)}
                      </div>
                      {!isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <EyeOff className="w-8 h-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Camera info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {camera.displayName}
                            {camera.settings?.custom_name && (
                              <span className="ml-2 text-sm text-gray-500 font-normal">
                                (původně: {camera.name})
                              </span>
                            )}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {camera.displayDescription}
                          </p>
                          <p className="text-gray-400 text-xs mt-2">
                            ID: {camera.id}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Move buttons */}
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === 0}
                              onClick={() => moveCamera(camera, 'up')}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              disabled={index === camerasWithSettings.length - 1}
                              onClick={() => moveCamera(camera, 'down')}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Edit button */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(camera)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          {/* Active toggle */}
                          <div className="flex items-center gap-2 ml-2">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => toggleActive(camera)}
                            />
                            <span className="text-sm text-gray-600">
                              {isActive ? 'Aktivní' : 'Skrytá'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingCamera} onOpenChange={() => setEditingCamera(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upravit kameru</DialogTitle>
          </DialogHeader>
          {editingCamera && (
            <div className="space-y-4 py-4">
              {/* Preview */}
              <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={getCameraPreviewUrl(editingCamera)}
                  alt={editingCamera.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-sm text-gray-500">
                <p>Původní název: <strong>{editingCamera.name}</strong></p>
                <p>Původní popis: <strong>{editingCamera.description}</strong></p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_name">Vlastní název (ponechte prázdné pro původní)</Label>
                <Input
                  id="custom_name"
                  value={editForm.custom_name}
                  onChange={(e) => setEditForm({ ...editForm, custom_name: e.target.value })}
                  placeholder={editingCamera.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_description">Vlastní popis (ponechte prázdné pro původní)</Label>
                <Textarea
                  id="custom_description"
                  value={editForm.custom_description}
                  onChange={(e) => setEditForm({ ...editForm, custom_description: e.target.value })}
                  placeholder={editingCamera.description}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCamera(null)}>
              Zrušit
            </Button>
            <Button onClick={saveEdit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
