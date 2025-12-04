import { useState, Fragment, useMemo } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Info, Clock, Calendar, Ticket, Award, Coins, Package, FileText, Percent } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import {
  fetchPricingCategories,
  fetchPricingItems,
  fetchAgeCategories,
  fetchInfoItems,
  fetchDiscountItems,
  PricingItem,
  AgeCategory,
  DiscountItem,
} from "@/lib/supabase";

type PricingTab = "denni" | "casove" | "sezonni" | "jednotlive" | "bodove" | "ostatni" | "informace" | "slevy";

// Icon mapping
const iconMap: Record<string, any> = {
  Clock,
  Calendar,
  Ticket,
  Award,
  Coins,
  Package,
  FileText,
  Percent,
};

// Helper pro "Rodinné jízdné" values
const getRodinneJizdneValues = (column: 'adult' | 'child' | 'junior' | 'senior'): string => {
  const values = { adult: "1+2", child: "2+1", junior: "2+2", senior: "2+3" };
  return values[column];
};

const isRodinneJizdne = (name: string): boolean => name.toLowerCase().includes("rodinné");

// Helper pro bodové jednotky
const getBodoveUnit = (value: number): string => value < 50 ? "bodů" : "Kč";

// Helper pro kontrolu individuálních cen
const hasIndividualPrices = (rows: PricingItem[]): boolean => {
  return rows.some(row =>
    !row.is_header && (
      row.adult !== null ||
      row.child !== null ||
      row.junior !== null ||
      row.senior !== null
    )
  );
};

const Pricing2 = () => {
  const [activeTab, setActiveTab] = useState<PricingTab>("casove");

  // Fetch categories from Supabase
  const { data: categories = [] } = useQuery({
    queryKey: ['pricing-categories'],
    queryFn: fetchPricingCategories,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch pricing items for active tab
  const { data: pricingItems = [] } = useQuery({
    queryKey: ['pricing-items', activeTab],
    queryFn: () => fetchPricingItems(activeTab),
    enabled: !['informace', 'slevy'].includes(activeTab),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch age categories
  const { data: ageCategoriesData = [] } = useQuery({
    queryKey: ['age-categories'],
    queryFn: fetchAgeCategories,
    staleTime: 60 * 60 * 1000,
  });

  // Fetch info items
  const { data: infoItems = [] } = useQuery({
    queryKey: ['info-items'],
    queryFn: fetchInfoItems,
    staleTime: 60 * 60 * 1000,
  });

  // Fetch discount items
  const { data: discountItems = [] } = useQuery({
    queryKey: ['discount-items'],
    queryFn: fetchDiscountItems,
    staleTime: 60 * 60 * 1000,
  });

  // Transform age categories to object format
  const ageCategories = ageCategoriesData.reduce((acc, cat) => {
    acc[cat.slug] = cat;
    return acc;
  }, {} as Record<string, AgeCategory>);

  // Default fallback
  const defaultAgeCategories = {
    adult: { slug: 'adult', name: 'Dospělí', birth_years: '1962-2008' },
    child: { slug: 'child', name: 'Děti', birth_years: '2016 a mladší' },
    junior: { slug: 'junior', name: 'Junioři', birth_years: '2007-2015' },
    senior: { slug: 'senior', name: 'Senioři', birth_years: '1961 a starší' },
  };

  const ages = Object.keys(ageCategories).length > 0 ? ageCategories : defaultAgeCategories;

  // Build tabs from categories
  const tabs = categories.length > 0
    ? categories.map(cat => ({
        id: cat.slug as PricingTab,
        label: cat.label,
        icon: iconMap[cat.icon] || FileText,
      }))
    : [
        { id: "casove" as PricingTab, label: "ČASOVÉ", icon: Clock },
        { id: "denni" as PricingTab, label: "DENNÍ", icon: Calendar },
        { id: "bodove" as PricingTab, label: "BODOVÉ", icon: Coins },
        { id: "sezonni" as PricingTab, label: "SEZÓNNÍ", icon: Award },
        { id: "jednotlive" as PricingTab, label: "JEDNOTLIVÉ", icon: Ticket },
        { id: "ostatni" as PricingTab, label: "OSTATNÍ", icon: Package },
        { id: "informace" as PricingTab, label: "INFORMACE", icon: FileText },
        { id: "slevy" as PricingTab, label: "SLEVY", icon: Percent },
      ];

  // Group discount items by section
  const slevySections = {
    general: discountItems.filter(d => d.section === 'general'),
    beskydy: discountItems.filter(d => d.section === 'beskydy'),
    eshop: discountItems.filter(d => d.section === 'eshop'),
  };

  const renderInformaceTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/95 p-6 border-0 shadow-lg">
        <h3 className="font-bold text-2xl mb-6 text-gray-900 flex items-center gap-3">
          <Info className="h-7 w-7 text-primary" />
          Věkové kategorie
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(ages).map((cat) => (
            <div key={cat.slug} className="bg-gradient hover:shadow-xl p-5 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <p className="font-bold text-xl text-primary-foreground mb-2">{cat.name}</p>
              <p className="text-primary-foreground/90 font-semibold text-base">Narození {cat.birth_years}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="bg-white/95 p-6 border-0 shadow-lg">
        <h3 className="font-bold text-2xl mb-6 text-gray-900 flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" />
          Důležité informace
        </h3>
        <div className="bg-gray-50 p-5 rounded-lg">
          <ul className="space-y-3 text-gray-900">
            {infoItems.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="text-primary font-bold text-xl leading-relaxed">•</span>
                <span className="leading-relaxed font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );

  const renderSlevyTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/95 p-6 border-0 shadow-lg">
        <h3 className="font-bold text-2xl mb-6 text-gray-900 flex items-center gap-3">
          <Percent className="h-7 w-7 text-primary" />
          Slevy
        </h3>
        <div className="bg-gray-50 p-5 rounded-lg">
          <ul className="space-y-3 text-gray-900">
            {slevySections.general.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="text-primary font-bold text-xl leading-relaxed">•</span>
                <span className="leading-relaxed font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {slevySections.beskydy.length > 0 && (
        <Card className="bg-white/95 p-6 border-0 shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-gray-900">
            Sleva pro držitele karet BESKYDY CARD
          </h3>
          <div className="bg-gray-50 p-5 rounded-lg">
            <ul className="space-y-3 text-gray-900">
              {slevySections.beskydy.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="text-primary font-bold text-xl leading-relaxed">•</span>
                  <span className="leading-relaxed font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {slevySections.eshop.length > 0 && (
        <Card className="bg-white/95 p-6 border-0 shadow-lg">
          <h3 className="font-bold text-xl mb-4 text-gray-900">
            Slevy při nákupu přes e-shop
          </h3>
          <div className="bg-gray-50 p-5 rounded-lg">
            <ul className="space-y-3 text-gray-900">
              {slevySections.eshop.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="text-primary font-bold text-xl leading-relaxed">•</span>
                  <span className="leading-relaxed font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );

  const data = pricingItems;

  // Rozdělení dat na normální položky a rodinné jízdné pro desktop
  const { normalItems, familyHeader, familyItems } = useMemo(() => {
    const normal: PricingItem[] = [];
    const family: PricingItem[] = [];
    let famHeader: PricingItem | null = null;

    for (const item of data) {
      if (item.is_header && isRodinneJizdne(item.name)) {
        famHeader = item;
      } else if (item.is_family_pricing) {
        family.push(item);
      } else {
        normal.push(item);
      }
    }

    return { normalItems: normal, familyHeader: famHeader, familyItems: family };
  }, [data]);

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-24 pb-12 scroll-smooth">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold mb-2 text-gradient">
                  Ceník skipasů
                </h1>
                <p className="text-base md:text-lg text-muted-foreground font-medium">
                  Sezóna 2025/2026 • <span className="text-primary font-semibold">Supabase Backend</span>
                </p>
              </div>
              <div className="flex-shrink-0 md:hidden">
                <a
                  href="https://valassko.ski/shop-kohutka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-3 rounded-lg font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  <Ticket className="h-5 w-5" />
                  Koupit skipas online
                </a>
              </div>
            </div>
          </div>

          {/* Tabs - Desktop */}
          <div className="mb-8 hidden md:block sticky top-16 z-40 -mx-4 px-4 pt-4 pb-2 bg-background/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto">
              <div className="flex gap-2 flex-wrap bg-white/98 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-primary/10">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 lg:px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                        activeTab === tab.id
                          ? "bg-accent text-accent-foreground shadow-lg scale-105 hover:scale-105"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 hover:scale-102"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dropdown - Mobile */}
          <div className="mb-8 md:hidden sticky top-16 z-40 -mx-4 px-4 pt-4 pb-2 bg-background/95 backdrop-blur-md">
            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as PricingTab)}>
              <SelectTrigger className="w-full bg-white/98 text-gray-900 border-2 border-primary/20 h-14 text-lg shadow-lg hover:bg-white hover:border-primary/40 transition-all duration-200 rounded-xl">
                <SelectValue>
                  {(() => {
                    const currentTab = tabs.find(t => t.id === activeTab);
                    const Icon = currentTab?.icon || Info;
                    return (
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="font-bold">{currentTab?.label}</span>
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-primary/20 shadow-xl">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem key={tab.id} value={tab.id} className="text-base py-3 cursor-pointer hover:bg-primary/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{tab.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          {activeTab === "informace" ? (
            renderInformaceTab()
          ) : activeTab === "slevy" ? (
            renderSlevyTab()
          ) : data.length > 0 ? (
            <>
              {/* Desktop Table View - Normální položky */}
              <Card className="glass overflow-hidden border-0 shadow-2xl hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient text-primary-foreground border-b border-white/30">
                        <th className="text-left p-6 font-bold text-lg tracking-wide">Typ jízdenky</th>
                        {!hasIndividualPrices(normalItems) ? (
                          <th className="text-right p-6 font-bold">
                            <span className="text-lg tracking-wide">Všechny kategorie</span>
                          </th>
                        ) : (
                          <>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ages.adult?.name || 'Dospělí'}</span>
                                <span className="text-xs font-normal opacity-80">({ages.adult?.birth_years})</span>
                              </div>
                            </th>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ages.child?.name || 'Děti'}</span>
                                <span className="text-xs font-normal opacity-80">({ages.child?.birth_years})</span>
                              </div>
                            </th>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ages.junior?.name || 'Junioři'}</span>
                                <span className="text-xs font-normal opacity-80">({ages.junior?.birth_years})</span>
                              </div>
                            </th>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ages.senior?.name || 'Senioři'}</span>
                                <span className="text-xs font-normal opacity-80">({ages.senior?.birth_years})</span>
                              </div>
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white/95 backdrop-blur-sm">
                      {normalItems.map((row, index) => (
                        <Fragment key={row.id || `price-row-${index}`}>
                          <tr
                            className={
                              row.is_header
                                ? "bg-primary/10 border-l-4 border-primary shadow-sm"
                                : "border-b border-gray-100 hover:bg-primary/5 transition-all duration-150"
                            }
                          >
                            <td className={`p-5 ${row.is_header ? "font-bold text-gray-900 text-lg tracking-wide" : "font-medium text-gray-800"}`}>
                              {row.name}
                            </td>
                            {!hasIndividualPrices(normalItems) ? (
                              <td className="text-right p-5 font-semibold text-gray-900">
                                {row.is_header ? "" : (
                                  row.all_price !== null ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.all_price}</span>
                                      <span className="text-sm text-gray-600">{activeTab === "bodove" ? getBodoveUnit(row.all_price) : "Kč"}</span>
                                    </span>
                                  ) : null
                                )}
                              </td>
                            ) : (
                              <>
                                <td className="text-right p-5 font-semibold text-gray-900">
                                  {row.is_header ? "" : row.adult !== null ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.adult}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : null}
                                </td>
                                <td className="text-right p-5 font-semibold text-gray-900">
                                  {row.is_header ? "" : row.child !== null ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.child}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : null}
                                </td>
                                <td className="text-right p-5 font-semibold text-gray-900">
                                  {row.is_header ? "" : row.junior !== null ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.junior}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : null}
                                </td>
                                <td className="text-right p-5 font-semibold text-gray-900">
                                  {row.is_header ? "" : row.senior !== null ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.senior}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : null}
                                </td>
                              </>
                            )}
                          </tr>
                          {row.note && (
                            <tr>
                              <td colSpan={5} className="px-5 py-3 bg-primary/5 border-b border-gray-100">
                                <p className="text-sm text-primary/90 italic flex items-center gap-2 font-medium">
                                  <Info className="h-4 w-4" />
                                  {row.note}
                                </p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Desktop Table View - Rodinné jízdné (oddělená tabulka) */}
              {familyItems.length > 0 && (
                <Card className="glass overflow-hidden border-0 shadow-2xl hidden md:block mt-8">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gradient text-primary-foreground border-b border-white/30">
                          <th className="text-left p-6 font-bold text-lg tracking-wide">
                            {familyHeader?.name || 'Rodinné jízdné'}
                          </th>
                          <th className="text-right p-6 font-bold">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-lg tracking-wide">1+2</span>
                              <span className="text-xs font-normal opacity-80">(1 dosp. + 2 děti)</span>
                            </div>
                          </th>
                          <th className="text-right p-6 font-bold">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-lg tracking-wide">2+1</span>
                              <span className="text-xs font-normal opacity-80">(2 dosp. + 1 dítě)</span>
                            </div>
                          </th>
                          <th className="text-right p-6 font-bold">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-lg tracking-wide">2+2</span>
                              <span className="text-xs font-normal opacity-80">(2 dosp. + 2 děti)</span>
                            </div>
                          </th>
                          <th className="text-right p-6 font-bold">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-lg tracking-wide">2+3</span>
                              <span className="text-xs font-normal opacity-80">(2 dosp. + 3 děti)</span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/95 backdrop-blur-sm">
                        {familyItems.map((row, index) => (
                          <Fragment key={row.id || `family-row-${index}`}>
                            <tr className="border-b border-gray-100 hover:bg-primary/5 transition-all duration-150">
                              <td className="p-5 font-medium text-gray-800">{row.name}</td>
                              <td className="text-right p-5 font-semibold text-gray-900">
                                {row.adult !== null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-xl font-bold text-primary">{row.adult}</span>
                                    <span className="text-sm text-gray-600">Kč</span>
                                  </span>
                                )}
                              </td>
                              <td className="text-right p-5 font-semibold text-gray-900">
                                {row.child !== null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-xl font-bold text-primary">{row.child}</span>
                                    <span className="text-sm text-gray-600">Kč</span>
                                  </span>
                                )}
                              </td>
                              <td className="text-right p-5 font-semibold text-gray-900">
                                {row.junior !== null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-xl font-bold text-primary">{row.junior}</span>
                                    <span className="text-sm text-gray-600">Kč</span>
                                  </span>
                                )}
                              </td>
                              <td className="text-right p-5 font-semibold text-gray-900">
                                {row.senior !== null && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-xl font-bold text-primary">{row.senior}</span>
                                    <span className="text-sm text-gray-600">Kč</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                            {row.note && (
                              <tr>
                                <td colSpan={5} className="px-5 py-3 bg-primary/5 border-b border-gray-100">
                                  <p className="text-sm text-primary/90 italic flex items-center gap-2 font-medium">
                                    <Info className="h-4 w-4" />
                                    {row.note}
                                  </p>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {data.map((row, index) => (
                  <div key={row.id || `mobile-price-${index}`}>
                    {row.is_header ? (
                      <div className="bg-primary/10 backdrop-blur-sm p-4 border-l-4 border-primary shadow-md rounded-xl">
                        <h3 className="font-bold text-base text-gray-900 tracking-wide">
                          {row.name}
                        </h3>
                      </div>
                    ) : (
                      <Card className="bg-gradient-to-br from-white via-white to-primary/5 border-0 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                        <div className="p-4">
                          <h4 className="font-semibold text-base text-gray-900 mb-3 leading-snug">
                            {row.name}
                          </h4>

                          {!hasIndividualPrices(data) ? (
                            <div className="bg-gradient-to-r from-primary/15 to-primary/5 p-3.5 rounded-xl shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700">Všechny kategorie</span>
                                <span className="text-2xl font-bold text-primary">
                                  {row.all_price !== null && (
                                    <>
                                      {row.all_price} <span className="text-sm text-gray-600">{activeTab === "bodove" ? getBodoveUnit(row.all_price) : "Kč"}</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : row.is_family_pricing ? (
                            /* Rodinné jízdné - speciální zobrazení */
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <span className="text-sm font-semibold text-gray-800">1+2 <span className="text-xs text-gray-500">(1 dosp. + 2 děti)</span></span>
                                <span className="text-xl font-bold text-primary">
                                  {row.adult !== null && <>{row.adult} <span className="text-xs text-gray-600">Kč</span></>}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <span className="text-sm font-semibold text-gray-800">2+1 <span className="text-xs text-gray-500">(2 dosp. + 1 dítě)</span></span>
                                <span className="text-xl font-bold text-primary">
                                  {row.child !== null && <>{row.child} <span className="text-xs text-gray-600">Kč</span></>}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <span className="text-sm font-semibold text-gray-800">2+2 <span className="text-xs text-gray-500">(2 dosp. + 2 děti)</span></span>
                                <span className="text-xl font-bold text-primary">
                                  {row.junior !== null && <>{row.junior} <span className="text-xs text-gray-600">Kč</span></>}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2.5">
                                <span className="text-sm font-semibold text-gray-800">2+3 <span className="text-xs text-gray-500">(2 dosp. + 3 děti)</span></span>
                                <span className="text-xl font-bold text-primary">
                                  {row.senior !== null && <>{row.senior} <span className="text-xs text-gray-600">Kč</span></>}
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Standardní zobrazení podle věkových kategorií */
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ages.adult?.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ages.adult?.birth_years})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {row.adult !== null && (
                                    <>{row.adult} <span className="text-xs text-gray-600">Kč</span></>
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ages.child?.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ages.child?.birth_years})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {row.child !== null && (
                                    <>{row.child} <span className="text-xs text-gray-600">Kč</span></>
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ages.junior?.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ages.junior?.birth_years})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {row.junior !== null && (
                                    <>{row.junior} <span className="text-xs text-gray-600">Kč</span></>
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2.5">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ages.senior?.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ages.senior?.birth_years})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {row.senior !== null && (
                                    <>{row.senior} <span className="text-xs text-gray-600">Kč</span></>
                                  )}
                                </span>
                              </div>
                            </div>
                          )}

                          {row.note && (
                            <div className="mt-4 p-3 bg-primary/10 rounded-lg border-l-2 border-primary">
                              <p className="text-xs text-primary/90 flex items-start gap-2 font-medium">
                                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">{row.note}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Card className="glass p-12">
              <div className="text-center text-primary-foreground/70">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Načítám data ze Supabase...</p>
              </div>
            </Card>
          )}

          {/* Info Card */}
          {!["informace", "slevy"].includes(activeTab) && (
            <div className="mt-6 md:mt-8">
              <Card className="bg-white/95 p-5 md:p-6 border-0 shadow-lg border-l-4 border-primary">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <Info className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg md:text-xl mb-2 md:mb-3 text-gray-900">
                      SKIREGION VALAŠSKO
                    </h3>
                    <p className="text-sm md:text-base text-gray-800 leading-relaxed font-medium">
                      Jízdenky platí pro: <span className="font-bold">Kohútka, Kyčerka, Horal, Karolinka, Jezerné, Bílá a Mezivodí</span>
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Pricing2;
