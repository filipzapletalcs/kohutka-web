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
