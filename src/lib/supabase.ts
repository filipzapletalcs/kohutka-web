import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qtnchzadjrmgfvhfzpzh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bmNoemFkanJtZ2Z2aGZ6cHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYyNDAsImV4cCI6MjA4MDQ1MjI0MH0.gaCkl1hs_RKpbtHbSOMGbkAa4dCPgh6erEq524lSDk0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface PricingCategory {
  id: string;
  slug: string;
  label: string;
  icon: string;
  sort_order: number;
}

export interface PricingItem {
  id: string;
  category_slug: string;
  name: string;
  adult: number | null;
  child: number | null;
  junior: number | null;
  senior: number | null;
  all_price: number | null;
  is_header: boolean;
  is_family_pricing: boolean;
  note: string | null;
  sort_order: number;
}

export interface AgeCategory {
  id: string;
  slug: string;
  name: string;
  birth_years: string;
  sort_order: number;
}

export interface InfoItem {
  id: string;
  text: string;
  sort_order: number;
}

export interface DiscountItem {
  id: string;
  section: 'general' | 'beskydy' | 'eshop';
  text: string;
  sort_order: number;
  is_header: boolean;
}

export interface CameraSettings {
  id: string;
  camera_id: string;
  custom_name: string | null;
  custom_description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type WidgetKey = 'skiareal' | 'vleky' | 'sjezdovky' | 'vozovka' | 'pocasi' | 'skipark' | 'snih';
export type WidgetMode = 'auto' | 'manual';
export type WidgetStatus = 'open' | 'closed' | 'partial' | null;

export interface WidgetSettings {
  id: string;
  widget_key: WidgetKey;
  mode: WidgetMode;
  manual_value: string | null;
  manual_status: WidgetStatus;
  manual_extra: Record<string, any> | null;
  updated_at: string;
  sort_order: number;
  display_name: string | null;
}

// API functions
export async function fetchPricingCategories(): Promise<PricingCategory[]> {
  const { data, error } = await supabase
    .from('pricing_categories')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function fetchPricingItems(categorySlug: string): Promise<PricingItem[]> {
  const { data, error } = await supabase
    .from('pricing_items')
    .select('*')
    .eq('category_slug', categorySlug)
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function fetchAllPricingItems(): Promise<PricingItem[]> {
  const { data, error } = await supabase
    .from('pricing_items')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function fetchAgeCategories(): Promise<AgeCategory[]> {
  const { data, error } = await supabase
    .from('age_categories')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function fetchInfoItems(): Promise<InfoItem[]> {
  const { data, error } = await supabase
    .from('info_items')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function fetchDiscountItems(): Promise<DiscountItem[]> {
  const { data, error } = await supabase
    .from('discount_items')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

// Auth helpers
export async function signInAdmin(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Camera settings functions
export async function fetchCameraSettings(): Promise<CameraSettings[]> {
  const { data, error } = await supabase
    .from('cameras_settings')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function upsertCameraSettings(
  settings: Omit<CameraSettings, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<CameraSettings> {
  const { data, error } = await supabase
    .from('cameras_settings')
    .upsert(
      { ...settings, updated_at: new Date().toISOString() },
      { onConflict: 'camera_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCameraSettings(
  id: string,
  updates: Partial<Omit<CameraSettings, 'id' | 'camera_id' | 'created_at'>>
): Promise<CameraSettings> {
  const { data, error } = await supabase
    .from('cameras_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCameraSettings(id: string): Promise<void> {
  const { error } = await supabase
    .from('cameras_settings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Widget settings functions
export async function fetchWidgetSettings(): Promise<WidgetSettings[]> {
  const { data, error } = await supabase
    .from('widget_settings')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function updateWidgetSettings(
  widgetKey: WidgetKey,
  updates: Partial<Omit<WidgetSettings, 'id' | 'widget_key' | 'updated_at'>>
): Promise<WidgetSettings> {
  const { data, error } = await supabase
    .from('widget_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('widget_key', widgetKey)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWidgetOrder(
  widgetOrders: { widget_key: WidgetKey; sort_order: number }[]
): Promise<void> {
  for (const { widget_key, sort_order } of widgetOrders) {
    const { error } = await supabase
      .from('widget_settings')
      .update({ sort_order, updated_at: new Date().toISOString() })
      .eq('widget_key', widget_key);

    if (error) throw error;
  }
}

// Slopes and Lifts Overrides
export type SlopeLiftType = 'slope' | 'lift';
export type SlopeLiftMode = 'auto' | 'manual';

export interface SlopeLiftOverride {
  id: string;
  type: SlopeLiftType;
  name: string;
  is_open: boolean;
  mode: SlopeLiftMode;
  updated_at: string;
}

export async function fetchSlopesLiftsOverrides(): Promise<SlopeLiftOverride[]> {
  const { data, error } = await supabase
    .from('slopes_lifts_overrides')
    .select('*')
    .order('type')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function upsertSlopeLiftOverride(
  override: Omit<SlopeLiftOverride, 'updated_at'>
): Promise<SlopeLiftOverride> {
  const { data, error } = await supabase
    .from('slopes_lifts_overrides')
    .upsert({
      ...override,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSlopeLiftOverride(
  id: string,
  updates: Partial<Pick<SlopeLiftOverride, 'is_open' | 'mode'>>
): Promise<SlopeLiftOverride> {
  const { data, error } = await supabase
    .from('slopes_lifts_overrides')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Site Settings
export interface SiteSetting {
  key: string;
  value: Record<string, any>;
  updated_at: string;
}

export async function fetchSiteSettings(): Promise<SiteSetting[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function fetchSiteSetting(key: string): Promise<SiteSetting | null> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateSiteSetting(
  key: string,
  value: Record<string, any>
): Promise<SiteSetting> {
  const { data, error } = await supabase
    .from('site_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// HolidayInfo Cache
export interface HolidayInfoCache {
  id: string;
  is_open: boolean;
  operation_text: string | null;
  opertime: string | null;
  temperature: string | null;
  weather: string | null;
  snow_height: string | null;
  snow_type: string | null;
  lifts_open_count: number;
  lifts_total_count: number;
  skipark_open: boolean;
  cable_car_open_count: number;
  cable_car_total_count: number;
  drag_lift_open_count: number;
  drag_lift_total_count: number;
  slopes_open_count: number;
  slopes_total_count: number;
  slopes_detailed: any[];
  lifts_detailed: any[];
  updated_at: string;
}

export async function fetchHolidayInfoCache(): Promise<HolidayInfoCache | null> {
  const { data, error } = await supabase
    .from('holidayinfo_cache')
    .select('*')
    .eq('id', 'main')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching holidayinfo cache:', error);
    return null;
  }
  return data;
}

export async function updateHolidayInfoCache(
  cache: Omit<HolidayInfoCache, 'id' | 'updated_at'>
): Promise<void> {
  const { error } = await supabase
    .from('holidayinfo_cache')
    .upsert({
      id: 'main',
      ...cache,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error updating holidayinfo cache:', error);
  }
}

// Autopost Settings
export type AutopostScheduleType = 'disabled' | 'daily' | 'twice_daily';

export interface AutopostSettings {
  id: string;
  enabled: boolean;
  schedule_type: AutopostScheduleType;
  morning_time: string;
  afternoon_time: string;
  custom_caption: string | null;
  hashtags: string;
  created_at: string;
  updated_at: string;
}

export interface AutopostHistory {
  id: string;
  platform: string;
  status: 'success' | 'failed' | 'pending';
  post_id: string | null;
  caption: string | null;
  error_message: string | null;
  data_snapshot: Record<string, any> | null;
  created_at: string;
}

// Fetch autopost settings (single row)
export async function fetchAutopostSettings(): Promise<AutopostSettings | null> {
  const { data, error } = await supabase
    .from('autopost_settings')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Update autopost settings
export async function updateAutopostSettings(
  updates: Partial<Omit<AutopostSettings, 'id' | 'created_at'>>
): Promise<AutopostSettings> {
  // First get the current settings to get the id
  const current = await fetchAutopostSettings();
  if (!current) {
    throw new Error('Autopost settings not found');
  }

  const { data, error } = await supabase
    .from('autopost_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', current.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Fetch autopost history
export async function fetchAutopostHistory(limit = 20): Promise<AutopostHistory[]> {
  const { data, error } = await supabase
    .from('autopost_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// Create autopost history entry
export async function createAutopostHistoryEntry(
  entry: Omit<AutopostHistory, 'id' | 'created_at'>
): Promise<AutopostHistory> {
  const { data, error } = await supabase
    .from('autopost_history')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}
