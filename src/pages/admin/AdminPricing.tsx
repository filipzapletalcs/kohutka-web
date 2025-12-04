import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  supabase,
  fetchPricingCategories,
  fetchAllPricingItems,
  fetchInfoItems,
  fetchDiscountItems,
  type PricingItem,
  type InfoItem,
  type DiscountItem,
} from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  RefreshCw,
  FileText,
  Percent,
  DollarSign,
} from 'lucide-react';

type EditingPricingItem = Partial<PricingItem> & { isNew?: boolean };
type EditingInfoItem = Partial<InfoItem> & { isNew?: boolean };
type EditingDiscountItem = Partial<DiscountItem> & { isNew?: boolean };

export default function AdminPricing() {
  const queryClient = useQueryClient();
  const [mainTab, setMainTab] = useState<'cenik' | 'informace' | 'slevy'>('cenik');
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Pricing state
  const [editingPricingItem, setEditingPricingItem] = useState<EditingPricingItem | null>(null);
  const [deletePricingItem, setDeletePricingItem] = useState<PricingItem | null>(null);

  // Info state
  const [editingInfoItem, setEditingInfoItem] = useState<EditingInfoItem | null>(null);
  const [deleteInfoItem, setDeleteInfoItem] = useState<InfoItem | null>(null);

  // Discount state
  const [editingDiscountItem, setEditingDiscountItem] = useState<EditingDiscountItem | null>(null);
  const [deleteDiscountItem, setDeleteDiscountItem] = useState<DiscountItem | null>(null);

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['pricing-categories'],
    queryFn: fetchPricingCategories,
  });

  const { data: allPricingItems = [], isLoading: pricingLoading } = useQuery({
    queryKey: ['pricing-items'],
    queryFn: fetchAllPricingItems,
  });

  const { data: infoItems = [], isLoading: infoLoading } = useQuery({
    queryKey: ['info-items'],
    queryFn: fetchInfoItems,
  });

  const { data: discountItems = [], isLoading: discountsLoading } = useQuery({
    queryKey: ['discount-items'],
    queryFn: fetchDiscountItems,
  });

  // Set default category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  // Filter pricing items by category
  const categoryItems = allPricingItems.filter(
    (item) => item.category_slug === activeCategory
  );

  // ============ PRICING MUTATIONS ============
  const savePricingMutation = useMutation({
    mutationFn: async (item: EditingPricingItem) => {
      if (item.isNew) {
        const { isNew, ...data } = item;
        const { error } = await supabase.from('pricing_items').insert(data);
        if (error) throw error;
      } else {
        const { id, ...data } = item;
        const { error } = await supabase.from('pricing_items').update(data).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      setEditingPricingItem(null);
      toast.success('Položka byla uložena');
    },
    onError: (error: Error) => toast.error(`Chyba: ${error.message}`),
  });

  const deletePricingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pricing_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
      setDeletePricingItem(null);
      toast.success('Položka byla smazána');
    },
    onError: (error: Error) => toast.error(`Chyba: ${error.message}`),
  });

  // ============ INFO MUTATIONS ============
  const saveInfoMutation = useMutation({
    mutationFn: async (item: EditingInfoItem) => {
      if (item.isNew) {
        const { isNew, ...data } = item;
        const { error } = await supabase.from('info_items').insert(data);
        if (error) throw error;
      } else {
        const { id, ...data } = item;
        const { error } = await supabase.from('info_items').update(data).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-items'] });
      setEditingInfoItem(null);
      toast.success('Informace byla uložena');
    },
    onError: (error: Error) => toast.error(`Chyba: ${error.message}`),
  });

  const deleteInfoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('info_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['info-items'] });
      setDeleteInfoItem(null);
      toast.success('Informace byla smazána');
    },
    onError: (error: Error) => toast.error(`Chyba: ${error.message}`),
  });

  // ============ DISCOUNT MUTATIONS ============
  const saveDiscountMutation = useMutation({
    mutationFn: async (item: EditingDiscountItem) => {
      if (item.isNew) {
        const { isNew, ...data } = item;
        const { error } = await supabase.from('discount_items').insert(data);
        if (error) throw error;
      } else {
        const { id, ...data } = item;
        const { error } = await supabase.from('discount_items').update(data).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-items'] });
      setEditingDiscountItem(null);
      toast.success('Sleva byla uložena');
    },
    onError: (error: Error) => toast.error(`Chyba: ${error.message}`),
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discount_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-items'] });
      setDeleteDiscountItem(null);
      toast.success('Sleva byla smazána');
    },
    onError: (error: Error) => toast.error(`Chyba: ${error.message}`),
  });

  // ============ REORDER MUTATIONS ============
  const reorderPricingMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from('pricing_items').update({ sort_order: newOrder }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pricing-items'] }),
  });

  const reorderInfoMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from('info_items').update({ sort_order: newOrder }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['info-items'] }),
  });

  const reorderDiscountMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from('discount_items').update({ sort_order: newOrder }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discount-items'] }),
  });

  // ============ HANDLERS ============
  const handleAddPricingItem = () => {
    const maxOrder = Math.max(0, ...categoryItems.map((i) => i.sort_order));
    setEditingPricingItem({
      isNew: true,
      category_slug: activeCategory,
      name: '',
      adult: null,
      child: null,
      junior: null,
      senior: null,
      all_price: null,
      is_header: false,
      is_family_pricing: false,
      note: null,
      sort_order: maxOrder + 10,
    });
  };

  const handleAddInfoItem = () => {
    const maxOrder = Math.max(0, ...infoItems.map((i) => i.sort_order));
    setEditingInfoItem({
      isNew: true,
      text: '',
      sort_order: maxOrder + 1,
    });
  };

  const handleMovePricingItem = (item: PricingItem, direction: 'up' | 'down') => {
    const currentIndex = categoryItems.findIndex((i) => i.id === item.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= categoryItems.length) return;
    const swapItem = categoryItems[swapIndex];
    reorderPricingMutation.mutate({ id: item.id, newOrder: swapItem.sort_order });
    reorderPricingMutation.mutate({ id: swapItem.id, newOrder: item.sort_order });
  };

  const handleMoveInfoItem = (item: InfoItem, direction: 'up' | 'down') => {
    const currentIndex = infoItems.findIndex((i) => i.id === item.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= infoItems.length) return;
    const swapItem = infoItems[swapIndex];
    reorderInfoMutation.mutate({ id: item.id, newOrder: swapItem.sort_order });
    reorderInfoMutation.mutate({ id: swapItem.id, newOrder: item.sort_order });
  };

  const handleMoveDiscountItem = (item: DiscountItem, items: DiscountItem[], direction: 'up' | 'down') => {
    const currentIndex = items.findIndex((i) => i.id === item.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;
    const swapItem = items[swapIndex];
    reorderDiscountMutation.mutate({ id: item.id, newOrder: swapItem.sort_order });
    reorderDiscountMutation.mutate({ id: swapItem.id, newOrder: item.sort_order });
  };

  const formatPrice = (price: number | null) => (price === null ? '-' : `${price} Kč`);

  const isLoading = categoriesLoading || pricingLoading || infoLoading || discountsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group discount items by section
  const discountsBySection = {
    general: discountItems.filter((d) => d.section === 'general'),
    beskydy: discountItems.filter((d) => d.section === 'beskydy'),
    eshop: discountItems.filter((d) => d.section === 'eshop'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Správa obsahu</h2>
          <p className="text-gray-600 mt-1">Ceník, informace a slevy</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['pricing-items'] });
            queryClient.invalidateQueries({ queryKey: ['info-items'] });
            queryClient.invalidateQueries({ queryKey: ['discount-items'] });
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Obnovit
        </Button>
      </div>

      {/* Main tabs */}
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cenik" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Ceník
          </TabsTrigger>
          <TabsTrigger value="informace" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informace
          </TabsTrigger>
          <TabsTrigger value="slevy" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Slevy
          </TabsTrigger>
        </TabsList>

        {/* ============ CENÍK TAB ============ */}
        <TabsContent value="cenik" className="mt-6">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="flex-wrap h-auto gap-1">
              {categories.map((cat) => (
                <TabsTrigger key={cat.slug} value={cat.slug}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.slug} value={cat.slug} className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg">{cat.label}</CardTitle>
                    <Button onClick={handleAddPricingItem}>
                      <Plus className="w-4 h-4 mr-2" />
                      Přidat položku
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Pořadí</TableHead>
                            <TableHead>Název</TableHead>
                            <TableHead className="text-right">Dospělí</TableHead>
                            <TableHead className="text-right">Děti</TableHead>
                            <TableHead className="text-right">Junior</TableHead>
                            <TableHead className="text-right">Senior</TableHead>
                            <TableHead className="text-right">Jednotná</TableHead>
                            <TableHead className="text-center">Hlavička</TableHead>
                            <TableHead className="w-24">Akce</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categoryItems.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                                Žádné položky
                              </TableCell>
                            </TableRow>
                          ) : (
                            categoryItems.map((item, index) => (
                              <TableRow key={item.id} className={item.is_header ? 'bg-gray-100 font-semibold' : ''}>
                                <TableCell>
                                  <div className="flex flex-col gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMovePricingItem(item, 'up')}>
                                      <ArrowUp className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === categoryItems.length - 1} onClick={() => handleMovePricingItem(item, 'down')}>
                                      <ArrowDown className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell className="text-right">{formatPrice(item.adult)}</TableCell>
                                <TableCell className="text-right">{formatPrice(item.child)}</TableCell>
                                <TableCell className="text-right">{formatPrice(item.junior)}</TableCell>
                                <TableCell className="text-right">{formatPrice(item.senior)}</TableCell>
                                <TableCell className="text-right">{formatPrice(item.all_price)}</TableCell>
                                <TableCell className="text-center">{item.is_header ? '✓' : ''}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingPricingItem(item)}>
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeletePricingItem(item)}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* ============ INFORMACE TAB ============ */}
        <TabsContent value="informace" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Důležité informace</CardTitle>
              <Button onClick={handleAddInfoItem}>
                <Plus className="w-4 h-4 mr-2" />
                Přidat informaci
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {infoItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Žádné informace</p>
                ) : (
                  infoItems.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveInfoItem(item, 'up')}>
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === infoItems.length - 1} onClick={() => handleMoveInfoItem(item, 'down')}>
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="flex-1 text-gray-800">{item.text}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingInfoItem(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteInfoItem(item)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SLEVY TAB ============ */}
        <TabsContent value="slevy" className="mt-6 space-y-6">
          {/* General discounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Obecné slevy</CardTitle>
              <Button onClick={() => { setEditingDiscountItem({ isNew: true, text: '', section: 'general', is_header: false, sort_order: Math.max(0, ...discountsBySection.general.map(i => i.sort_order)) + 1 }); }}>
                <Plus className="w-4 h-4 mr-2" />
                Přidat
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {discountsBySection.general.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Žádné položky</p>
                ) : (
                  discountsBySection.general.map((item, index) => (
                    <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg ${item.is_header ? 'bg-primary/10 border-l-4 border-primary' : 'bg-gray-50'}`}>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveDiscountItem(item, discountsBySection.general, 'up')}>
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === discountsBySection.general.length - 1} onClick={() => handleMoveDiscountItem(item, discountsBySection.general, 'down')}>
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className={`flex-1 ${item.is_header ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{item.text}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingDiscountItem(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDiscountItem(item)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Beskydy Card discounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Slevy Beskydy Card</CardTitle>
              <Button onClick={() => { setEditingDiscountItem({ isNew: true, text: '', section: 'beskydy', is_header: false, sort_order: Math.max(0, ...discountsBySection.beskydy.map(i => i.sort_order)) + 1 }); }}>
                <Plus className="w-4 h-4 mr-2" />
                Přidat
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {discountsBySection.beskydy.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Žádné položky</p>
                ) : (
                  discountsBySection.beskydy.map((item, index) => (
                    <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg ${item.is_header ? 'bg-primary/10 border-l-4 border-primary' : 'bg-gray-50'}`}>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveDiscountItem(item, discountsBySection.beskydy, 'up')}>
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === discountsBySection.beskydy.length - 1} onClick={() => handleMoveDiscountItem(item, discountsBySection.beskydy, 'down')}>
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className={`flex-1 ${item.is_header ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{item.text}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingDiscountItem(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDiscountItem(item)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* E-shop discounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Slevy e-shop</CardTitle>
              <Button onClick={() => { setEditingDiscountItem({ isNew: true, text: '', section: 'eshop', is_header: false, sort_order: Math.max(0, ...discountsBySection.eshop.map(i => i.sort_order)) + 1 }); }}>
                <Plus className="w-4 h-4 mr-2" />
                Přidat
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {discountsBySection.eshop.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">Žádné položky</p>
                ) : (
                  discountsBySection.eshop.map((item, index) => (
                    <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg ${item.is_header ? 'bg-primary/10 border-l-4 border-primary' : 'bg-gray-50'}`}>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => handleMoveDiscountItem(item, discountsBySection.eshop, 'up')}>
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === discountsBySection.eshop.length - 1} onClick={() => handleMoveDiscountItem(item, discountsBySection.eshop, 'down')}>
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className={`flex-1 ${item.is_header ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{item.text}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditingDiscountItem(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteDiscountItem(item)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ PRICING EDIT DIALOG ============ */}
      <Dialog open={!!editingPricingItem} onOpenChange={() => setEditingPricingItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPricingItem?.isNew ? 'Nová položka ceníku' : 'Upravit položku'}</DialogTitle>
          </DialogHeader>
          {editingPricingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Název</Label>
                <Input value={editingPricingItem.name || ''} onChange={(e) => setEditingPricingItem({ ...editingPricingItem, name: e.target.value })} placeholder="Název položky" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="grid gap-2">
                  <Label>Dospělí</Label>
                  <Input type="number" value={editingPricingItem.adult ?? ''} onChange={(e) => setEditingPricingItem({ ...editingPricingItem, adult: e.target.value ? Number(e.target.value) : null })} placeholder="-" />
                </div>
                <div className="grid gap-2">
                  <Label>Děti</Label>
                  <Input type="number" value={editingPricingItem.child ?? ''} onChange={(e) => setEditingPricingItem({ ...editingPricingItem, child: e.target.value ? Number(e.target.value) : null })} placeholder="-" />
                </div>
                <div className="grid gap-2">
                  <Label>Junior</Label>
                  <Input type="number" value={editingPricingItem.junior ?? ''} onChange={(e) => setEditingPricingItem({ ...editingPricingItem, junior: e.target.value ? Number(e.target.value) : null })} placeholder="-" />
                </div>
                <div className="grid gap-2">
                  <Label>Senior</Label>
                  <Input type="number" value={editingPricingItem.senior ?? ''} onChange={(e) => setEditingPricingItem({ ...editingPricingItem, senior: e.target.value ? Number(e.target.value) : null })} placeholder="-" />
                </div>
                <div className="grid gap-2">
                  <Label>Jednotná</Label>
                  <Input type="number" value={editingPricingItem.all_price ?? ''} onChange={(e) => setEditingPricingItem({ ...editingPricingItem, all_price: e.target.value ? Number(e.target.value) : null })} placeholder="-" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Poznámka</Label>
                <Input value={editingPricingItem.note || ''} onChange={(e) => setEditingPricingItem({ ...editingPricingItem, note: e.target.value || null })} placeholder="Volitelná poznámka" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox id="is_header" checked={editingPricingItem.is_header || false} onCheckedChange={(checked) => setEditingPricingItem({ ...editingPricingItem, is_header: checked === true })} />
                  <Label htmlFor="is_header" className="font-normal">Je hlavička sekce</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="is_family" checked={editingPricingItem.is_family_pricing || false} onCheckedChange={(checked) => setEditingPricingItem({ ...editingPricingItem, is_family_pricing: checked === true })} />
                  <Label htmlFor="is_family" className="font-normal">Rodinné jízdné</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPricingItem(null)}>Zrušit</Button>
            <Button onClick={() => editingPricingItem && savePricingMutation.mutate(editingPricingItem)} disabled={savePricingMutation.isPending}>
              {savePricingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ INFO EDIT DIALOG ============ */}
      <Dialog open={!!editingInfoItem} onOpenChange={() => setEditingInfoItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInfoItem?.isNew ? 'Nová informace' : 'Upravit informaci'}</DialogTitle>
          </DialogHeader>
          {editingInfoItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Text</Label>
                <Textarea value={editingInfoItem.text || ''} onChange={(e) => setEditingInfoItem({ ...editingInfoItem, text: e.target.value })} placeholder="Text informace..." rows={4} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInfoItem(null)}>Zrušit</Button>
            <Button onClick={() => editingInfoItem && saveInfoMutation.mutate(editingInfoItem)} disabled={saveInfoMutation.isPending}>
              {saveInfoMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DISCOUNT EDIT DIALOG ============ */}
      <Dialog open={!!editingDiscountItem} onOpenChange={() => setEditingDiscountItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDiscountItem?.isNew ? 'Nová sleva' : 'Upravit slevu'}</DialogTitle>
          </DialogHeader>
          {editingDiscountItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Text</Label>
                <Textarea value={editingDiscountItem.text || ''} onChange={(e) => setEditingDiscountItem({ ...editingDiscountItem, text: e.target.value })} placeholder="Text slevy..." rows={4} />
              </div>
              <div className="grid gap-2">
                <Label>Sekce</Label>
                <Select value={editingDiscountItem.section} onValueChange={(v) => setEditingDiscountItem({ ...editingDiscountItem, section: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Obecné slevy</SelectItem>
                    <SelectItem value="beskydy">Beskydy Card</SelectItem>
                    <SelectItem value="eshop">E-shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="discount_is_header" checked={editingDiscountItem.is_header || false} onCheckedChange={(checked) => setEditingDiscountItem({ ...editingDiscountItem, is_header: checked === true })} />
                <Label htmlFor="discount_is_header" className="font-normal">Je hlavička sekce</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDiscountItem(null)}>Zrušit</Button>
            <Button onClick={() => editingDiscountItem && saveDiscountMutation.mutate(editingDiscountItem)} disabled={saveDiscountMutation.isPending}>
              {saveDiscountMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Uložit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ DELETE DIALOGS ============ */}
      <AlertDialog open={!!deletePricingItem} onOpenChange={() => setDeletePricingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat položku?</AlertDialogTitle>
            <AlertDialogDescription>Opravdu chcete smazat "{deletePricingItem?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deletePricingItem && deletePricingMutation.mutate(deletePricingItem.id)}>
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteInfoItem} onOpenChange={() => setDeleteInfoItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat informaci?</AlertDialogTitle>
            <AlertDialogDescription>Opravdu chcete smazat tuto informaci?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteInfoItem && deleteInfoMutation.mutate(deleteInfoItem.id)}>
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteDiscountItem} onOpenChange={() => setDeleteDiscountItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat slevu?</AlertDialogTitle>
            <AlertDialogDescription>Opravdu chcete smazat tuto slevu?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteDiscountItem && deleteDiscountMutation.mutate(deleteDiscountItem.id)}>
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
