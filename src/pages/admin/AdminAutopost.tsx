import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAutopostSettings,
  updateAutopostSettings,
  fetchAutopostHistory,
  fetchCameraSettings,
  type AutopostSettings,
  type AutopostScheduleType,
  type AutopostImageType,
} from '@/lib/supabase';
import { fetchHolidayInfoData } from '@/services/holidayInfoApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Save, Clock, Globe, ThumbsUp, MessageCircle, Share2, Calendar, Thermometer, Mountain, Cable, Snowflake, Edit3, Send, FileEdit, Eye, ExternalLink, Camera, ChevronLeft, ChevronRight, Image, ImageOff, Images, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import StatusImagePreview from '@/components/admin/autopost/StatusImagePreview';
import type { ManualOverrides, StatusImageData, TemplateId } from '@/components/admin/autopost/types';
import { POST_TEMPLATES, generatePostText } from '@/components/admin/autopost/templates';

const MONTH_NAMES = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'
];

function generateCaption(): string {
  const today = new Date();
  const day = today.getDate();
  const month = MONTH_NAMES[today.getMonth()];

  return `Dnes je ${day}. ${month} a takhle to vypadá na Kohútce! ⛷️`;
}

const DEFAULT_CAPTION = generateCaption();

export default function AdminAutopost() {
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    enabled: false,
    schedule_type: 'disabled' as AutopostScheduleType,
    morning_time: '07:00',
    afternoon_time: '14:00',
    custom_caption: DEFAULT_CAPTION,
    hashtags: '#kohutka #lyze #skiing #beskydy #zima',
    camera_id: null as string | null,
    image_type: 'both' as AutopostImageType,
    selected_template: 'daily' as TemplateId,
  });

  const [manualOverrides, setManualOverrides] = useState<ManualOverrides>({
    enabled: false,
    temperature: '',
    weather: '',
    liftsOpen: '',
    liftsTotal: '',
    slopesOpen: '',
    slopesTotal: '',
    snowHeight: '',
    snowType: '',
    opertime: '',
    isOpen: false,
    isNightSkiing: false,
    textComment: '',
    newSnow: '',
    weatherCode: 0,
  });

  // Carousel state for preview (0 = status image, 1 = camera image)
  const [carouselSlide, setCarouselSlide] = useState(0);

  // Reset carousel when camera changes
  useEffect(() => {
    setCarouselSlide(0);
  }, [formState.camera_id]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['autopost-settings'],
    queryFn: fetchAutopostSettings,
  });

  const { data: holidayData, isLoading: isLoadingData, refetch, isRefetching } = useQuery({
    queryKey: ['holiday-info-autopost'],
    queryFn: fetchHolidayInfoData,
    staleTime: 60 * 1000,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['autopost-history'],
    queryFn: () => fetchAutopostHistory(10),
  });

  const { data: cameraSettings = [] } = useQuery({
    queryKey: ['camera-settings'],
    queryFn: fetchCameraSettings,
  });

  // Get active cameras merged with holiday info data
  // Filter same as AdminCameras: exclude archive (except kohutka-p0), check is_active
  const activeCameras = (holidayData?.cameras || [])
    .filter((cam) => {
      // Exclude archive cameras (same as AdminCameras)
      if (cam.source === 'archive' && cam.id !== 'kohutka-p0') return false;
      // Check if camera is active in settings
      const setting = cameraSettings.find((s) => s.camera_id === cam.id);
      return setting?.is_active !== false;
    })
    .map((cam) => {
      const setting = cameraSettings.find((s) => s.camera_id === cam.id);
      return {
        ...cam,
        displayName: setting?.custom_name || cam.name,
      };
    });

  // Helper to get camera preview URL (same logic as Cameras page)
  const getCameraPreviewUrl = (cameraId: string) => {
    const camera = activeCameras.find((c) => c.id === cameraId);
    if (!camera) return '';
    const baseUrl = camera.media?.last_image?.url || '';
    if (!baseUrl) return '';
    // Add cache-busting timestamp
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${Date.now()}`;
  };

  useEffect(() => {
    if (settings) {
      setFormState({
        enabled: settings.enabled,
        schedule_type: settings.schedule_type,
        morning_time: settings.morning_time,
        afternoon_time: settings.afternoon_time,
        custom_caption: settings.custom_caption || DEFAULT_CAPTION,
        hashtags: settings.hashtags,
        camera_id: settings.camera_id,
        image_type: settings.image_type || 'both',
        selected_template: 'daily' as TemplateId,
      });
    }
  }, [settings]);

  // Získat název vybrané kamery pro šablony
  const selectedCameraName = formState.camera_id
    ? activeCameras.find(c => c.id === formState.camera_id)?.name || ''
    : '';

  // Automatická aktualizace textu při změně šablony nebo dat
  useEffect(() => {
    if (formState.selected_template !== 'custom' && holidayData) {
      const generatedText = generatePostText(
        formState.selected_template,
        holidayData,
        selectedCameraName
      );
      if (generatedText) {
        setFormState((prev) => ({
          ...prev,
          custom_caption: generatedText,
        }));
      }
    }
  }, [formState.selected_template, holidayData, selectedCameraName]);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<AutopostSettings>) => updateAutopostSettings(updates),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['autopost-settings'] });
      // Refresh scheduler immediately after saving settings
      try {
        await fetch('/api/refresh-autopost', { method: 'POST' });
        toast.success('Nastavení uloženo a scheduler aktualizován');
      } catch {
        toast.success('Nastavení uloženo (scheduler se aktualizuje do 5 min)');
      }
    },
    onError: (error) => toast.error('Chyba: ' + (error as Error).message),
  });

  const handleSave = () => {
    // Get camera image URL if camera is selected
    const selectedCamera = formState.camera_id
      ? activeCameras.find((c) => c.id === formState.camera_id)
      : null;
    const camera_image_url = selectedCamera?.media?.last_image?.url || null;

    updateMutation.mutate({
      ...formState,
      camera_image_url,
    });
  };

  // Mutation for manual posting
  const postMutation = useMutation({
    mutationFn: async ({ draft, testMode }: { draft?: boolean; testMode?: boolean }) => {
      // Get camera image URL if camera is selected
      const selectedCamera = formState.camera_id
        ? activeCameras.find((c) => c.id === formState.camera_id)
        : null;
      const cameraImageUrl = selectedCamera?.media?.last_image?.url || null;

      const response = await fetch('/api/facebook-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: formState.custom_caption,
          hashtags: formState.hashtags,
          cameraId: formState.camera_id,
          cameraImageUrl,
          imageType: formState.image_type,
          draft,
          testMode,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Posting failed');
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['autopost-history'] });
      if (data.testMode) {
        toast.success('Test OK! Obrázek vygenerován.');
      } else if (data.mode === 'draft') {
        toast.success('Draft vytvořen! Najdeš ho v Meta Business Suite.', {
          action: {
            label: 'Otevřít Meta',
            onClick: () => window.open('https://business.facebook.com/latest/content_calendar', '_blank'),
          },
        });
      } else {
        toast.success('Příspěvek publikován na Facebook!');
      }
    },
    onError: (error) => toast.error('Chyba: ' + (error as Error).message),
  });

  const hasChanges = settings && (
    formState.enabled !== settings.enabled ||
    formState.schedule_type !== settings.schedule_type ||
    formState.morning_time !== settings.morning_time ||
    formState.afternoon_time !== settings.afternoon_time ||
    formState.custom_caption !== (settings.custom_caption || DEFAULT_CAPTION) ||
    formState.hashtags !== settings.hashtags ||
    formState.camera_id !== settings.camera_id ||
    formState.image_type !== (settings.image_type || 'both')
  );

  // Preview data - use manual if enabled, otherwise API
  // LANOVKY/VLEKY format: cableCarOpenCount/dragLiftOpenCount (e.g., 1/4)
  // This matches landing page widget exactly
  const previewData: StatusImageData = {
    isOpen: manualOverrides.enabled ? manualOverrides.isOpen : holidayData?.operation?.isOpen || false,
    isNightSkiing: manualOverrides.enabled ? manualOverrides.isNightSkiing : holidayData?.operation?.isNightSkiing || false,
    temperature: manualOverrides.enabled && manualOverrides.temperature ? manualOverrides.temperature : holidayData?.operation?.temperature || '--',
    weather: manualOverrides.enabled && manualOverrides.weather ? manualOverrides.weather : holidayData?.operation?.weather || undefined,
    liftsOpen: manualOverrides.enabled && manualOverrides.liftsOpen ? parseInt(manualOverrides.liftsOpen) : holidayData?.lifts?.cableCarOpenCount || 0,
    liftsTotal: manualOverrides.enabled && manualOverrides.liftsTotal ? parseInt(manualOverrides.liftsTotal) : holidayData?.lifts?.dragLiftOpenCount || 0,
    slopesOpen: manualOverrides.enabled && manualOverrides.slopesOpen ? parseInt(manualOverrides.slopesOpen) : holidayData?.slopes?.openCount || 0,
    slopesTotal: manualOverrides.enabled && manualOverrides.slopesTotal ? parseInt(manualOverrides.slopesTotal) : holidayData?.slopes?.totalCount || 0,
    snowHeight: manualOverrides.enabled && manualOverrides.snowHeight ? manualOverrides.snowHeight : holidayData?.operation?.snowHeight || '--',
    snowType: manualOverrides.enabled && manualOverrides.snowType ? manualOverrides.snowType : holidayData?.operation?.snowType || undefined,
    operatingHours: manualOverrides.enabled && manualOverrides.opertime ? manualOverrides.opertime : holidayData?.operation?.opertime || undefined,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auto-posting na Facebook</h2>
          <p className="text-gray-600 mt-1">Automatické publikování denních reportů</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          {isRefetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Obnovit
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left - Preview */}
        <div className="space-y-4">
          {/* Facebook Mockup */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Náhled příspěvku</CardTitle>
                <Badge className={
                  formState.image_type === 'both' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                  formState.image_type === 'widget_only' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                  formState.image_type === 'camera_only' ? 'bg-green-100 text-green-700 border-green-300' :
                  'bg-gray-100 text-gray-700 border-gray-300'
                }>
                  {formState.image_type === 'both' && <><Images className="w-3 h-3 mr-1" /> Carousel</>}
                  {formState.image_type === 'widget_only' && <><Image className="w-3 h-3 mr-1" /> Infografika</>}
                  {formState.image_type === 'camera_only' && <><Camera className="w-3 h-3 mr-1" /> Kamera</>}
                  {formState.image_type === 'none' && <><ImageOff className="w-3 h-3 mr-1" /> Bez obrázku</>}
                </Badge>
              </div>
              {manualOverrides.enabled && (
                <Badge variant="outline" className="w-fit text-orange-600 border-orange-300">
                  <Edit3 className="w-3 h-3 mr-1" /> Manuální hodnoty
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg shadow-lg border overflow-hidden max-w-sm mx-auto">
                {/* FB Header */}
                <div className="p-3 flex items-center gap-3">
                  <img src={logo} alt="Kohútka" className="w-10 h-10 rounded-full object-contain bg-primary/10" />
                  <div>
                    <div className="font-semibold text-sm">SKI CENTRUM KOHUTKA</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>Právě teď</span> · <Globe className="w-3 h-3" />
                    </div>
                  </div>
                </div>
                {/* Caption */}
                <div className="px-3 pb-2">
                  <p className="text-sm whitespace-pre-line">{formState.custom_caption}</p>
                  <p className="text-sm text-blue-600 mt-1">{formState.hashtags}</p>
                </div>
                {/* Image Preview - based on image_type */}
                {isLoadingData ? (
                  <div className="aspect-[1080/1350] bg-gray-200 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : formState.image_type === 'none' ? (
                  // No image - text only
                  null
                ) : formState.image_type === 'widget_only' ? (
                  // Widget only
                  <div style={{ fontSize: '13px' }}>
                    <StatusImagePreview data={previewData} />
                  </div>
                ) : formState.image_type === 'camera_only' && formState.camera_id && getCameraPreviewUrl(formState.camera_id) ? (
                  // Camera only
                  <div className="bg-gray-900 flex items-center justify-center min-h-[200px]">
                    <img
                      src={getCameraPreviewUrl(formState.camera_id)}
                      alt="Snímek z kamery"
                      className="w-full h-auto"
                    />
                  </div>
                ) : formState.image_type === 'both' && formState.camera_id && getCameraPreviewUrl(formState.camera_id) ? (
                  // Carousel view with 2 images
                  <div className="relative">
                    {/* Slides container */}
                    <div className="overflow-hidden">
                      {carouselSlide === 0 ? (
                        <div style={{ fontSize: '13px' }}>
                          <StatusImagePreview data={previewData} />
                        </div>
                      ) : (
                        <div className="bg-gray-900 flex items-center justify-center min-h-[200px]">
                          <img
                            src={getCameraPreviewUrl(formState.camera_id)}
                            alt="Snímek z kamery"
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                    </div>
                    {/* Navigation arrows */}
                    <button
                      onClick={() => setCarouselSlide((s) => (s === 0 ? 1 : 0))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setCarouselSlide((s) => (s === 0 ? 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                    {/* Dots indicator */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      <button
                        onClick={() => setCarouselSlide(0)}
                        className={`w-2 h-2 rounded-full transition-colors ${carouselSlide === 0 ? 'bg-blue-500' : 'bg-white/70 hover:bg-white'}`}
                      />
                      <button
                        onClick={() => setCarouselSlide(1)}
                        className={`w-2 h-2 rounded-full transition-colors ${carouselSlide === 1 ? 'bg-blue-500' : 'bg-white/70 hover:bg-white'}`}
                      />
                    </div>
                    {/* Slide counter */}
                    <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      {carouselSlide + 1}/2
                    </div>
                  </div>
                ) : (
                  // Fallback - single widget image
                  <div style={{ fontSize: '13px' }}>
                    <StatusImagePreview data={previewData} />
                  </div>
                )}
                {/* FB Reactions */}
                <div className="px-3 py-2 border-t flex items-center justify-around text-gray-600 text-sm">
                  <button className="flex items-center gap-1 hover:bg-gray-100 px-3 py-1 rounded">
                    <ThumbsUp className="w-4 h-4" /> Líbí se
                  </button>
                  <button className="flex items-center gap-1 hover:bg-gray-100 px-3 py-1 rounded">
                    <MessageCircle className="w-4 h-4" /> Komentář
                  </button>
                  <button className="flex items-center gap-1 hover:bg-gray-100 px-3 py-1 rounded">
                    <Share2 className="w-4 h-4" /> Sdílet
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Data */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                Aktuální API data
                {holidayData?.fromCache && <Badge variant="outline" className="text-yellow-600">Cache</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {holidayData ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
                    <Badge className={holidayData.operation?.isOpen ? 'bg-green-500' : 'bg-red-500'}>
                      {holidayData.operation?.isOpen ? 'Otevřeno' : 'Zavřeno'}
                    </Badge>
                    {holidayData.operation?.isNightSkiing && (
                      <Badge className="bg-purple-500">Noční</Badge>
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <Thermometer className="w-4 h-4 inline mr-1" /> {holidayData.operation?.temperature || '--'}°C
                    {holidayData.operation?.weather && (
                      <span className="text-gray-500 ml-1">({holidayData.operation.weather})</span>
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <Cable className="w-4 h-4 inline mr-1" /> Lanovky/Vleky: {holidayData.lifts?.cableCarOpenCount}/{holidayData.lifts?.dragLiftOpenCount}
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <Mountain className="w-4 h-4 inline mr-1" /> Sjezdovky: {holidayData.slopes?.openCount}/{holidayData.slopes?.totalCount}
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <Snowflake className="w-4 h-4 inline mr-1" /> Sníh: {holidayData.operation?.snowHeight || '--'}
                    {holidayData.operation?.snowType && (
                      <span className="text-gray-500 ml-1">({holidayData.operation.snowType})</span>
                    )}
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <Clock className="w-4 h-4 inline mr-1" /> Provoz: {holidayData.operation?.opertime || '--'}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Data nejsou k dispozici</p>
              )}
            </CardContent>
          </Card>

          {/* Manual Overrides */}
          <Card className={manualOverrides.enabled ? 'border-orange-300 bg-orange-50/50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-orange-500" /> Manuální hodnoty
                </CardTitle>
                <Switch checked={manualOverrides.enabled} onCheckedChange={(v) => setManualOverrides({ ...manualOverrides, enabled: v })} />
              </div>
            </CardHeader>
            {manualOverrides.enabled && (
              <CardContent className="space-y-3">
                {/* Poznámka majitele - KRITICKÉ pro šablony */}
                <div className="p-3 bg-orange-100 rounded-lg border border-orange-200">
                  <Label className="text-xs font-medium flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    Poznámka majitele (text_comment)
                  </Label>
                  <Textarea
                    placeholder={holidayData?.operation?.textComment || 'Areál je připraven, sjezdovky upravené!'}
                    value={manualOverrides.textComment}
                    onChange={(e) => setManualOverrides({ ...manualOverrides, textComment: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                  <p className="text-xs text-orange-600 mt-1">
                    Používá se v šablonách příspěvků. Prázdné = použije se z API.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Areál otevřen</Label>
                  <Switch checked={manualOverrides.isOpen} onCheckedChange={(v) => setManualOverrides({ ...manualOverrides, isOpen: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Noční lyžování</Label>
                  <Switch checked={manualOverrides.isNightSkiing} onCheckedChange={(v) => setManualOverrides({ ...manualOverrides, isNightSkiing: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Teplota</Label><Input placeholder={holidayData?.operation?.temperature || '-5'} value={manualOverrides.temperature} onChange={(e) => setManualOverrides({ ...manualOverrides, temperature: e.target.value })} /></div>
                  <div><Label className="text-xs">Počasí (popis)</Label><Input placeholder={holidayData?.operation?.weather || 'jasno'} value={manualOverrides.weather} onChange={(e) => setManualOverrides({ ...manualOverrides, weather: e.target.value })} /></div>
                  <div><Label className="text-xs">Sníh (výška)</Label><Input placeholder={holidayData?.operation?.snowHeight || '30 cm'} value={manualOverrides.snowHeight} onChange={(e) => setManualOverrides({ ...manualOverrides, snowHeight: e.target.value })} /></div>
                  <div><Label className="text-xs">Sníh (typ)</Label><Input placeholder={holidayData?.operation?.snowType || 'prachový'} value={manualOverrides.snowType} onChange={(e) => setManualOverrides({ ...manualOverrides, snowType: e.target.value })} /></div>
                  <div><Label className="text-xs">Nový sníh</Label><Input placeholder={holidayData?.operation?.newSnow || '5 cm'} value={manualOverrides.newSnow} onChange={(e) => setManualOverrides({ ...manualOverrides, newSnow: e.target.value })} /></div>
                  <div><Label className="text-xs">Otevírací doba</Label><Input placeholder={holidayData?.operation?.opertime || '08:30-16:00'} value={manualOverrides.opertime} onChange={(e) => setManualOverrides({ ...manualOverrides, opertime: e.target.value })} /></div>
                  <div><Label className="text-xs">Lanovky (otevřené)</Label><Input type="number" min="0" placeholder={String(holidayData?.lifts?.cableCarOpenCount || 0)} value={manualOverrides.liftsOpen} onChange={(e) => setManualOverrides({ ...manualOverrides, liftsOpen: e.target.value })} /></div>
                  <div><Label className="text-xs">Vleky (otevřené)</Label><Input type="number" min="0" placeholder={String(holidayData?.lifts?.dragLiftOpenCount || 0)} value={manualOverrides.liftsTotal} onChange={(e) => setManualOverrides({ ...manualOverrides, liftsTotal: e.target.value })} /></div>
                  <div><Label className="text-xs">Sjezdovky otevřeno</Label><Input type="number" min="0" placeholder={String(holidayData?.slopes?.openCount || 0)} value={manualOverrides.slopesOpen} onChange={(e) => setManualOverrides({ ...manualOverrides, slopesOpen: e.target.value })} /></div>
                  <div><Label className="text-xs">Sjezdovky celkem</Label><Input type="number" min="0" placeholder={String(holidayData?.slopes?.totalCount || 9)} value={manualOverrides.slopesTotal} onChange={(e) => setManualOverrides({ ...manualOverrides, slopesTotal: e.target.value })} /></div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right - Settings */}
        <div className="space-y-4">
          {/* Enable/Disable */}
          <Card className={formState.enabled ? 'border-green-500/50 bg-green-50/50' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Auto-posting</CardTitle>
                <Switch checked={formState.enabled} onCheckedChange={(v) => setFormState({ ...formState, enabled: v })} />
              </div>
              <CardDescription>
                {formState.enabled ? (
                  <span className="text-green-700">Aktivní - {formState.schedule_type === 'daily' ? `denně v ${formState.morning_time}` : 'vypnuto'}</span>
                ) : 'Vypnuto'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5" /> Plán publikace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={formState.schedule_type} onValueChange={(v) => setFormState({ ...formState, schedule_type: v as AutopostScheduleType })}>
                <div className="flex items-center space-x-2"><RadioGroupItem value="disabled" id="disabled" /><Label htmlFor="disabled">Vypnuto</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="daily" id="daily" /><Label htmlFor="daily">Denně ráno</Label></div>
              </RadioGroup>
              {formState.schedule_type !== 'disabled' && (
                <div className="pt-3 border-t">
                  <div><Label className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3" /> Čas publikace</Label><Input type="time" value={formState.morning_time} onChange={(e) => setFormState({ ...formState, morning_time: e.target.value })} className="mt-1" /></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caption */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Text příspěvku</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Výběr šablony */}
              <div className="space-y-2">
                <Label>Šablona textu</Label>
                <Select
                  value={formState.selected_template}
                  onValueChange={(value: TemplateId) => {
                    setFormState({ ...formState, selected_template: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte šablonu" />
                  </SelectTrigger>
                  <SelectContent>
                    {POST_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <span className="flex items-center gap-2">
                          <span>{template.emoji}</span>
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">- {template.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      <span className="flex items-center gap-2">
                        <span>✏️</span>
                        <span>Vlastni text</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Info o automatickém generování */}
              {formState.selected_template !== 'custom' && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1">
                    <RefreshCw className="w-4 h-4" />
                    Automaticky generováno ze šablony
                  </div>
                  <p className="text-xs text-blue-600">
                    Text používá poznámku z Holiday Info API. Editací přepnete na vlastní text.
                  </p>
                </div>
              )}

              {/* Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Popisek</Label>
                  {formState.selected_template !== 'custom' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        if (holidayData) {
                          const text = generatePostText(formState.selected_template, holidayData, selectedCameraName);
                          setFormState({ ...formState, custom_caption: text });
                        }
                      }}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Znovu vygenerovat
                    </Button>
                  )}
                </div>
                <Textarea
                  value={formState.custom_caption}
                  onChange={(e) => setFormState({
                    ...formState,
                    custom_caption: e.target.value,
                    selected_template: 'custom' as TemplateId,
                  })}
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formState.custom_caption.length} znaků
                </p>
              </div>
              <div><Label>Hashtags</Label><Input value={formState.hashtags} onChange={(e) => setFormState({ ...formState, hashtags: e.target.value })} /></div>
            </CardContent>
          </Card>

          {/* Image Type Selection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Images className="w-5 h-5" /> Typ obrázku
              </CardTitle>
              <CardDescription>
                Vyber, jaké obrázky budou v příspěvku
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formState.image_type}
                onValueChange={(v) => setFormState({ ...formState, image_type: v as AutopostImageType })}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                  <RadioGroupItem value="widget_only" id="widget_only" />
                  <Label htmlFor="widget_only" className="flex items-center gap-2 cursor-pointer">
                    <Image className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Jen infografika</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                  <RadioGroupItem value="camera_only" id="camera_only" />
                  <Label htmlFor="camera_only" className="flex items-center gap-2 cursor-pointer">
                    <Camera className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Jen kamera</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="flex items-center gap-2 cursor-pointer">
                    <Images className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Oboje (carousel)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50">
                  <RadioGroupItem value="none" id="img_none" />
                  <Label htmlFor="img_none" className="flex items-center gap-2 cursor-pointer">
                    <ImageOff className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Bez obrázku</span>
                  </Label>
                </div>
              </RadioGroup>

              {/* Camera selection - show when camera_only or both */}
              {(formState.image_type === 'camera_only' || formState.image_type === 'both') && (
                <div className="pt-3 border-t space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Výběr kamery
                  </Label>
                  <Select
                    value={formState.camera_id || 'none'}
                    onValueChange={(v) => setFormState({ ...formState, camera_id: v === 'none' ? null : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte kameru" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Bez kamery</SelectItem>
                      {activeCameras.map((cam) => (
                        <SelectItem key={cam.id} value={cam.id}>
                          {cam.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formState.camera_id && getCameraPreviewUrl(formState.camera_id) && (
                    <div className="rounded-lg overflow-hidden border">
                      <img
                        src={getCameraPreviewUrl(formState.camera_id)}
                        alt="Náhled kamery"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Info based on selection */}
              <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
                {formState.image_type === 'widget_only' && '📊 Příspěvek bude obsahovat pouze infografiku s daty.'}
                {formState.image_type === 'camera_only' && '📷 Příspěvek bude obsahovat pouze snímek z kamery.'}
                {formState.image_type === 'both' && '🎠 Příspěvek bude carousel se 2 obrázky (infografika + kamera).'}
                {formState.image_type === 'none' && '📝 Příspěvek bude pouze textový, bez obrázků.'}
              </div>
            </CardContent>
          </Card>

          {/* Manual Posting */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" /> Ruční publikace
              </CardTitle>
              <CardDescription>
                Otestuj nebo publikuj příspěvek ručně
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => postMutation.mutate({ testMode: true })}
                  disabled={postMutation.isPending}
                  className="w-full"
                >
                  {postMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="w-4 h-4 mr-2" />
                  )}
                  Test
                </Button>
                <Button
                  variant="outline"
                  onClick={() => postMutation.mutate({ draft: true })}
                  disabled={postMutation.isPending}
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  {postMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileEdit className="w-4 h-4 mr-2" />
                  )}
                  Vytvořit draft
                </Button>
              </div>
              <Button
                onClick={() => postMutation.mutate({})}
                disabled={postMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {postMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Publikovat nyní
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Draft najdeš v{' '}
                <a
                  href="https://business.facebook.com/latest/content_calendar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  Meta Business Suite <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Save */}
          <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending} className="w-full" size="lg">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Uložit nastavení
          </Button>
        </div>
      </div>

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Historie publikací</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Zatím žádné publikace</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Platforma</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.created_at).toLocaleString('cs-CZ')}</TableCell>
                    <TableCell><Badge variant="outline">{item.platform}</Badge></TableCell>
                    <TableCell>
                      <Badge className={item.status === 'success' ? 'bg-green-500' : item.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}>
                        {item.status === 'success' ? 'OK' : item.status === 'failed' ? 'Chyba' : 'Čeká'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
