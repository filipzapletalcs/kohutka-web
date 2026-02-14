import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAutopostSettings,
  updateAutopostSettings,
  fetchAutopostHistory,
  fetchCameraSettings,
  fetchAutopostTemplates,
  createAutopostTemplate,
  updateAutopostTemplate,
  deleteAutopostTemplate,
  type AutopostSettings,
  type AutopostScheduleType,
  type AutopostImageType,
  type AutopostCaptionMode,
  type AutopostTemplate,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Save, Clock, Globe, ThumbsUp, MessageCircle, Share2, Calendar, Thermometer, Mountain, Cable, Snowflake, Edit3, Send, Eye, ExternalLink, Camera, ChevronLeft, ChevronRight, Image, ImageOff, Images, MessageSquare, Plus, Pencil, Trash2, X, RefreshCw, Sparkles, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import StatusImagePreview from '@/components/admin/autopost/StatusImagePreview';
import type { ManualOverrides, StatusImageData, TemplateId } from '@/components/admin/autopost/types';
import { DEFAULT_TEMPLATES, stripCameraReferences } from '@/components/admin/autopost/templates';

// Dostupné proměnné pro vkládání do textu
// getValue funkce vrací aktuální hodnotu z holidayData
const TEXT_PLACEHOLDERS = [
  // Texty
  { key: '{text_comment}', label: 'Poznámka majitele', emoji: '💬', getValue: (d: any) => d?.operation?.textComment || '' },
  { key: '{desc_text}', label: 'Popis', emoji: '📝', getValue: (d: any) => d?.operation?.descText || '' },
  // Počasí
  { key: '{teplota}', label: 'Teplota', emoji: '🌡️', getValue: (d: any) => d?.operation?.temperature ? `${d.operation.temperature}°C` : '' },
  { key: '{pocasi}', label: 'Počasí', emoji: '☀️', getValue: (d: any) => d?.operation?.weather || '' },
  // Sníh
  { key: '{snih_vyska}', label: 'Výška sněhu', emoji: '❄️', getValue: (d: any) => d?.operation?.snowHeight || '' },
  { key: '{snih_typ}', label: 'Typ sněhu', emoji: '🏔️', getValue: (d: any) => d?.operation?.snowType || '' },
  { key: '{novy_snih}', label: 'Nový sníh', emoji: '🌨️', getValue: (d: any) => d?.operation?.newSnow || '' },
  // Provoz
  { key: '{provozni_doba}', label: 'Provozní doba', emoji: '🕐', getValue: (d: any) => d?.operation?.opertime || '' },
  { key: '{stav}', label: 'Stav areálu', emoji: '🚦', getValue: (d: any) => d?.operation?.isOpen ? 'Otevřeno' : 'Zavřeno' },
  { key: '{provozni_text}', label: 'Provozní text', emoji: '📋', getValue: (d: any) => d?.operation?.operationText || '' },
  // Vleky a lanovky
  { key: '{lanovky}', label: 'Lanovky', emoji: '🚡', getValue: (d: any) => String(d?.lifts?.cableCarOpenCount || 0) },
  { key: '{lanovky_celkem}', label: 'Lanovky celkem', emoji: '🚠', getValue: (d: any) => String(d?.lifts?.cableCarTotalCount || 0) },
  { key: '{vleky}', label: 'Vleky', emoji: '🎿', getValue: (d: any) => String(d?.lifts?.dragLiftOpenCount || 0) },
  { key: '{vleky_celkem}', label: 'Vleky celkem', emoji: '⛷️', getValue: (d: any) => String(d?.lifts?.dragLiftTotalCount || 0) },
  // Sjezdovky
  { key: '{sjezdovky}', label: 'Sjezdovky', emoji: '🗻', getValue: (d: any) => String(d?.slopes?.openCount || 0) },
  { key: '{sjezdovky_celkem}', label: 'Sjezdovky celkem', emoji: '⛰️', getValue: (d: any) => String(d?.slopes?.totalCount || 0) },
  // Datum a čas
  { key: '{datum}', label: 'Datum', emoji: '📅', getValue: () => new Date().toLocaleDateString('cs-CZ') },
  { key: '{den}', label: 'Den v týdnu', emoji: '🗓️', getValue: () => ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'][new Date().getDay()] },
  // Kamera - speciální placeholder, hodnota se předá zvlášť
  { key: '{kamera}', label: 'Název kamery', emoji: '📸', getValue: () => '' },
];

// Funkce pro nahrazení placeholderů skutečnými hodnotami v náhledu
function replacePlaceholdersForPreview(text: string, data: any, cameraName?: string): string {
  if (!text) return text;
  let result = text;
  for (const p of TEXT_PLACEHOLDERS) {
    // Speciální zacházení pro {kamera}
    const value = p.key === '{kamera}' ? (cameraName || '') : p.getValue(data);
    result = result.replace(new RegExp(p.key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return result;
}

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
    descText: '',
    newSnow: '',
    weatherCode: 0,
  });

  // Carousel state for preview (0 = status image, 1 = camera image)
  const [carouselSlide, setCarouselSlide] = useState(0);

  // Ref pro textarea - pro vkládání proměnných na pozici kurzoru
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPlaceholderPopoverOpen, setIsPlaceholderPopoverOpen] = useState(false);

  // Funkce pro vložení proměnné na pozici kurzoru
  const insertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      // Fallback - přidáme na konec
      setFormState({
        ...formState,
        custom_caption: formState.custom_caption + placeholder,
        selected_template: 'custom' as TemplateId,
      });
      setIsPlaceholderPopoverOpen(false);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formState.custom_caption;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + placeholder + after;
    setFormState({
      ...formState,
      custom_caption: newText,
      selected_template: 'custom' as TemplateId,
    });
    setIsPlaceholderPopoverOpen(false);

    // Přesunout kurzor za vloženou proměnnou
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + placeholder.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Reset carousel when camera changes
  useEffect(() => {
    setCarouselSlide(0);
  }, [formState.camera_id]);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['autopost-settings'],
    queryFn: fetchAutopostSettings,
  });

  const { data: holidayData, isLoading: isLoadingData } = useQuery({
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

  // Fetch templates from database
  const { data: templates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['autopost-templates'],
    queryFn: fetchAutopostTemplates,
  });

  // Template editor state
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<AutopostTemplate> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<AutopostTemplate | null>(null);

  // Template editor textarea ref
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTemplatePlaceholderOpen, setIsTemplatePlaceholderOpen] = useState(false);

  // AI caption generation state
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showDataInfoModal, setShowDataInfoModal] = useState(false);

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
      // Převést caption_mode a selected_template_id na selected_template pro UI
      let selected_template: TemplateId = 'custom';
      if (settings.caption_mode === 'ai') {
        selected_template = 'ai';
      } else if (settings.caption_mode === 'template' && settings.selected_template_id) {
        selected_template = settings.selected_template_id;
      } else if (settings.caption_mode === 'custom') {
        selected_template = 'custom';
      }

      setFormState({
        enabled: settings.enabled,
        schedule_type: settings.schedule_type,
        morning_time: settings.morning_time,
        afternoon_time: settings.afternoon_time,
        custom_caption: settings.custom_caption || DEFAULT_CAPTION,
        hashtags: settings.hashtags,
        camera_id: settings.camera_id,
        image_type: settings.image_type || 'both',
        selected_template,
      });

      // Označit, že jsme načetli z DB (ne defaultní hodnota)
      if (settings.caption_mode) {
        hasInitializedTemplate.current = true;
      }
    }
  }, [settings]);

  // Track if we've initialized the template selection
  const hasInitializedTemplate = useRef(false);

  // Set first template as default when templates load (only once)
  useEffect(() => {
    if (templates.length > 0 && !hasInitializedTemplate.current) {
      hasInitializedTemplate.current = true;
      const firstTemplate = templates[0];
      setFormState((prev) => ({
        ...prev,
        selected_template: firstTemplate.id,
        custom_caption: prev.image_type === 'widget_only' || prev.image_type === 'none'
          ? stripCameraReferences(firstTemplate.content)
          : firstTemplate.content,
      }));
    }
  }, [templates]);

  // Získat název vybrané kamery pro šablony (používáme displayName = custom_name z nastavení)
  const selectedCameraName = formState.camera_id
    ? activeCameras.find(c => c.id === formState.camera_id)?.displayName || ''
    : '';

  // Automatická aktualizace textu při změně šablony
  // Nyní vkládáme template STRING s placeholdery, ne vygenerovaný text
  // Pro AI šablonu neděláme nic - uživatel musí kliknout na tlačítko
  useEffect(() => {
    if (formState.selected_template && formState.selected_template !== 'custom' && formState.selected_template !== 'ai' && templates.length > 0) {
      const template = templates.find(t => t.id === formState.selected_template);
      if (template) {
        let content = template.content;

        // Pokud je widget_only nebo none, odstranit reference na kameru
        if (formState.image_type === 'widget_only' || formState.image_type === 'none') {
          content = stripCameraReferences(content);
        }

        setFormState((prev) => ({
          ...prev,
          custom_caption: content,
        }));
      }
    }
  }, [formState.selected_template, templates, formState.image_type]);

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

    // Převést selected_template na caption_mode a selected_template_id
    let caption_mode: AutopostCaptionMode = 'custom';
    let selected_template_id: string | null = null;

    if (formState.selected_template === 'ai') {
      caption_mode = 'ai';
    } else if (formState.selected_template === 'custom') {
      caption_mode = 'custom';
    } else if (formState.selected_template) {
      // Je to UUID šablony
      caption_mode = 'template';
      selected_template_id = formState.selected_template;
    }

    // Odstranit selected_template z ukládaných dat (to je UI stav)
    const { selected_template, ...settingsToSave } = formState;

    // Auto-enable based on schedule type
    const enabled = formState.schedule_type !== 'disabled';

    updateMutation.mutate({
      ...settingsToSave,
      enabled,
      camera_image_url,
      caption_mode,
      selected_template_id,
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

  // Template CRUD mutations
  const createTemplateMutation = useMutation({
    mutationFn: createAutopostTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopost-templates'] });
      toast.success('Šablona vytvořena');
      setIsTemplateEditorOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => toast.error('Chyba při vytváření šablony: ' + (error as Error).message),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AutopostTemplate> }) =>
      updateAutopostTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopost-templates'] });
      toast.success('Šablona aktualizována');
      setIsTemplateEditorOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => toast.error('Chyba při aktualizaci šablony: ' + (error as Error).message),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: deleteAutopostTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopost-templates'] });
      toast.success('Šablona smazána');
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      // Pokud byla smazána aktuálně vybraná šablona, přepnout na custom
      if (templateToDelete && formState.selected_template === templateToDelete.id) {
        setFormState(prev => ({ ...prev, selected_template: 'custom' }));
      }
    },
    onError: (error) => toast.error('Chyba při mazání šablony: ' + (error as Error).message),
  });

  // Template editor handlers
  const handleOpenNewTemplate = () => {
    setEditingTemplate({
      name: '',
      description: '',
      emoji: '📝',
      content: '',
      sort_order: templates.length + 1,
    });
    setIsTemplateEditorOpen(true);
  };

  const handleOpenEditTemplate = (template: AutopostTemplate) => {
    setEditingTemplate({ ...template });
    setIsTemplateEditorOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name?.trim()) {
      toast.error('Název šablony je povinný');
      return;
    }
    if (!editingTemplate.content?.trim()) {
      toast.error('Obsah šablony je povinný');
      return;
    }

    if (editingTemplate.id) {
      // Update existing template
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        updates: {
          name: editingTemplate.name,
          description: editingTemplate.description || null,
          emoji: editingTemplate.emoji || '📝',
          content: editingTemplate.content,
          sort_order: editingTemplate.sort_order || 0,
        },
      });
    } else {
      // Create new template
      createTemplateMutation.mutate({
        name: editingTemplate.name,
        description: editingTemplate.description || null,
        emoji: editingTemplate.emoji || '📝',
        content: editingTemplate.content,
        sort_order: editingTemplate.sort_order || templates.length + 1,
      });
    }
  };

  const handleDeleteTemplate = (template: AutopostTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
      deleteTemplateMutation.mutate(templateToDelete.id);
    }
  };

  // Insert placeholder into template editor
  const insertTemplateEditorPlaceholder = (placeholder: string) => {
    if (!editingTemplate) return;

    const textarea = templateTextareaRef.current;
    if (!textarea) {
      setEditingTemplate({
        ...editingTemplate,
        content: (editingTemplate.content || '') + placeholder,
      });
      setIsTemplatePlaceholderOpen(false);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editingTemplate.content || '';
    const newText = text.substring(0, start) + placeholder + text.substring(end);

    setEditingTemplate({
      ...editingTemplate,
      content: newText,
    });
    setIsTemplatePlaceholderOpen(false);

    setTimeout(() => {
      textarea.focus();
      const newPosition = start + placeholder.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // AI caption generation
  const generateAiCaption = async () => {
    setIsGeneratingAi(true);
    console.log('[AI Caption] Starting generation...');
    try {
      console.log('[AI Caption] Fetching /api/generate-caption...');
      const response = await fetch('/api/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      console.log('[AI Caption] Response status:', response.status);
      console.log('[AI Caption] Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('[AI Caption] Response data:', data);

      if (!response.ok || !data.success) {
        console.error('[AI Caption] Error in response:', data);
        throw new Error(data.error || 'Nepodařilo se vygenerovat text');
      }

      setFormState((prev) => ({
        ...prev,
        custom_caption: data.caption,
      }));

      console.log('[AI Caption] Success! Caption:', data.caption?.substring(0, 50) + '...');
      toast.success('Text vygenerován!');
    } catch (error) {
      console.error('[AI Caption] Catch error:', error);
      toast.error('Chyba: ' + (error as Error).message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

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
              {/* Manual overrides badge - TEMPORARILY HIDDEN
              {manualOverrides.enabled && (
                <Badge variant="outline" className="w-fit text-orange-600 border-orange-300">
                  <Edit3 className="w-3 h-3 mr-1" /> Manuální hodnoty
                </Badge>
              )}
              */}
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
                  <p className="text-sm whitespace-pre-line">{replacePlaceholdersForPreview(formState.custom_caption, holidayData, selectedCameraName)}</p>
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
                ) : formState.image_type === 'camera_only' ? (
                  // Camera only - show camera image or placeholder if no camera selected
                  formState.camera_id && getCameraPreviewUrl(formState.camera_id) ? (
                    <div className="bg-gray-900 flex items-center justify-center min-h-[200px]">
                      <img
                        src={getCameraPreviewUrl(formState.camera_id)}
                        alt="Snímek z kamery"
                        className="w-full h-auto"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-200 flex flex-col items-center justify-center text-gray-500">
                      <Camera className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">Vyberte kameru</p>
                    </div>
                  )
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
                <button
                  onClick={() => setShowDataInfoModal(true)}
                  className="ml-auto p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="Jak fungují data pro autoposting"
                >
                  <Info className="w-4 h-4 text-gray-400" />
                </button>
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

          {/* Manual Overrides - TEMPORARILY HIDDEN
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

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Label className="text-xs font-medium flex items-center gap-2 mb-2">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    Popis (desc_text)
                  </Label>
                  <Textarea
                    placeholder={holidayData?.operation?.descText || 'Doplňkový popis areálu...'}
                    value={manualOverrides.descText}
                    onChange={(e) => setManualOverrides({ ...manualOverrides, descText: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    Doplňkový text pro šablony. Prázdné = použije se z API.
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
          */}
        </div>

        {/* Right - Settings */}
        <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label>Šablona textu</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenNewTemplate}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Nová šablona
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={formState.selected_template}
                    onValueChange={(value: TemplateId) => {
                      setFormState({ ...formState, selected_template: value });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Vyberte šablonu" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <span className="flex items-center gap-2">
                            <span>{template.emoji}</span>
                            <span>{template.name}</span>
                            <span className="text-xs text-muted-foreground">- {template.description}</span>
                          </span>
                        </SelectItem>
                      ))}
                      <SelectItem value="ai">
                        <span className="flex items-center gap-2">
                          <span>🤖</span>
                          <span>Automatický text (AI)</span>
                          <span className="text-xs text-muted-foreground">- generuje OpenAI</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="custom">
                        <span className="flex items-center gap-2">
                          <span>✏️</span>
                          <span>Vlastní text</span>
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Edit/Delete buttons for selected template */}
                  {formState.selected_template && formState.selected_template !== 'custom' && formState.selected_template !== 'ai' && (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => {
                          const template = templates.find(t => t.id === formState.selected_template);
                          if (template) handleOpenEditTemplate(template);
                        }}
                        title="Upravit šablonu"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const template = templates.find(t => t.id === formState.selected_template);
                          if (template) handleDeleteTemplate(template);
                        }}
                        title="Smazat šablonu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Generation UI */}
              {formState.selected_template === 'ai' && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-purple-700">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium">Automatický text (AI)</span>
                  </div>
                  <p className="text-sm text-purple-600">
                    AI vygeneruje kreativní text na základě aktuálních dat z areálu - počasí, sníh, sjezdovky.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={generateAiCaption}
                      disabled={isGeneratingAi}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {isGeneratingAi ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      {formState.custom_caption && formState.custom_caption !== generateCaption()
                        ? 'Vygenerovat znovu'
                        : 'Vygenerovat text'}
                    </Button>
                    {formState.custom_caption && formState.custom_caption !== generateCaption() && (
                      <Button
                        onClick={generateAiCaption}
                        disabled={isGeneratingAi}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-purple-500">
                    Po vygenerování můžete text upravit v poli níže.
                  </p>
                </div>
              )}

              {/* Warning: text zmiňuje kameru ale není nastavená */}
              {(formState.custom_caption.includes('📸') || formState.custom_caption.includes('{kamera}')) &&
               (formState.image_type === 'widget_only' || formState.image_type === 'none' || !formState.camera_id) && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  <Camera className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Text obsahuje zmínku o kameře, ale{' '}
                    {!formState.camera_id
                      ? 'není vybraná žádná kamera'
                      : 'typ obrázku nezahrnuje kameru'}
                    . Proměnná {'{kamera}'} bude prázdná.
                  </span>
                </div>
              )}

              {/* Textarea */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label>Popisek</Label>
                  <Popover open={isPlaceholderPopoverOpen} onOpenChange={setIsPlaceholderPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0 text-primary hover:bg-primary hover:text-white"
                        title="Vložit proměnnou"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-2" align="start">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 pb-1 border-b">
                          Vložit proměnnou
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-0.5">
                          {TEXT_PLACEHOLDERS.map((p) => {
                            const currentValue = p.getValue(holidayData);
                            return (
                              <button
                                key={p.key}
                                type="button"
                                onClick={() => insertPlaceholder(p.key)}
                                className="w-full flex items-center justify-between px-2 py-1.5 text-left text-xs rounded hover:bg-gray-100 transition-colors group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span>{p.emoji}</span>
                                  <span className="font-medium">{p.label}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-500 ml-2">
                                  {currentValue ? (
                                    <span className="truncate max-w-[120px] text-green-600" title={currentValue}>
                                      {currentValue.length > 20 ? currentValue.substring(0, 20) + '...' : currentValue}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">prázdné</span>
                                  )}
                                  <code className="text-[10px] bg-gray-100 px-1 rounded group-hover:bg-gray-200">
                                    {p.key}
                                  </code>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500 pt-1 border-t">
                          Proměnné se nahradí skutečnými hodnotami při publikaci
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Textarea
                  ref={textareaRef}
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
                Publikuj příspěvek ručně kdykoliv
              </CardDescription>
            </CardHeader>
            <CardContent>
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

      {/* Template Editor Dialog */}
      <Dialog open={isTemplateEditorOpen} onOpenChange={setIsTemplateEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate?.id ? 'Upravit šablonu' : 'Nová šablona'}
            </DialogTitle>
            <DialogDescription>
              Vytvořte nebo upravte šablonu pro automatické příspěvky. Použijte proměnné v složených závorkách.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Název</Label>
                <Input
                  value={editingTemplate?.name || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  placeholder="Např. Denní report"
                />
              </div>
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input
                  value={editingTemplate?.emoji || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, emoji: e.target.value })}
                  placeholder="📝"
                  className="w-20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Popis</Label>
              <Input
                value={editingTemplate?.description || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                placeholder="Krátký popis šablony"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Obsah šablony</Label>
                <Popover open={isTemplatePlaceholderOpen} onOpenChange={setIsTemplatePlaceholderOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7">
                      <Plus className="w-3 h-3 mr-1" /> Vložit proměnnou
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2" align="end">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 pb-1 border-b">
                        Dostupné proměnné
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-0.5">
                        {TEXT_PLACEHOLDERS.map((p) => (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => insertTemplateEditorPlaceholder(p.key)}
                            className="w-full flex items-center justify-between px-2 py-1.5 text-left text-xs rounded hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span>{p.emoji}</span>
                              <span className="font-medium">{p.label}</span>
                            </div>
                            <code className="text-[10px] bg-gray-100 px-1 rounded">{p.key}</code>
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea
                ref={templateTextareaRef}
                value={editingTemplate?.content || ''}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                rows={6}
                className="font-mono text-sm"
                placeholder="Např.: 📢 {text_comment}

📸 Pohled z kamery: {kamera}

Více info 👉 kohutka.ski"
              />
            </div>

            {/* Live preview */}
            <Card className="bg-gray-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Náhled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">
                  {replacePlaceholdersForPreview(editingTemplate?.content || '', holidayData, selectedCameraName) || (
                    <span className="text-gray-400 italic">Zadejte obsah šablony...</span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateEditorOpen(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat šablonu?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat šablonu "{templateToDelete?.name}"? Tuto akci nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTemplateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Data Source Info Modal */}
      <Dialog open={showDataInfoModal} onOpenChange={setShowDataInfoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Odkud autoposting bere data?
            </DialogTitle>
            <DialogDescription>
              Jak funguje priorita datových zdrojů pro generování příspěvků.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-800 mb-1">Automatický režim (výchozí)</p>
              <p className="text-blue-700">
                Data se načítají z HolidayInfo API (aktualizace každých 20 minut). Teplota, sníh, sjezdovky, vleky a provozní doba se berou přímo z API.
              </p>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-medium text-orange-800 mb-1">Manuální přepis (priorita)</p>
              <p className="text-orange-700 mb-2">
                Pokud v administraci přepnete widget nebo sjezdovku/vlek do <strong>manuálního režimu</strong>, autoposting použije vaši hodnotu místo dat z API.
              </p>
              <div className="space-y-1.5 text-orange-700">
                <div className="flex items-start gap-2">
                  <span className="font-medium shrink-0">Widgety</span>
                  <span className="text-orange-500">&#8594;</span>
                  <span>
                    <a href="/admin/widget" className="underline hover:text-orange-900">Správa widgetů</a>
                    {' '}&mdash; přepište teplotu, sníh, provozní dobu, stav areálu, skipark
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium shrink-0">Sjezdovky/Vleky</span>
                  <span className="text-orange-500">&#8594;</span>
                  <span>
                    <a href="/admin/sjezdovky" className="underline hover:text-orange-900">Správa sjezdovek</a>
                    {' '}&mdash; přepište stav jednotlivých sjezdovek a vleků (otevřeno/zavřeno)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-700 mb-1">Pořadí priority</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li><strong>Manuální hodnoty z widgetů</strong> &mdash; nejvyšší priorita</li>
                <li><strong>Manuální stavy sjezdovek/vleků</strong> &mdash; přepočítá počty</li>
                <li><strong>HolidayInfo API</strong> &mdash; fallback, pokud není manuální přepis</li>
              </ol>
            </div>

            <p className="text-xs text-gray-400">
              Manuální hodnoty se projeví jak v AI generovaných popiscích, tak v šablonách s proměnnými.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataInfoModal(false)}>
              Rozumím
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
