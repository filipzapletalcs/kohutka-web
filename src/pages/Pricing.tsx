import { useState, Fragment, useMemo } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Info, Clock, Calendar, Ticket, Award, Coins, Package, FileText, Percent } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { fetchPricingFromGoogleSheets, fetchAgeCategoriesFromGoogleSheets, PricingCategory, PriceRow, AgeCategoriesData } from "@/services/pricingService";
import { getCacheItem } from "@/services/cacheHelper";

type PricingTab = "denni" | "casove" | "sezonni" | "jednotlive" | "bodove" | "ostatni" | "informace" | "slevy";

// Helper funkce pro získání hodnot pro Rodinné jízdné
// Tyto hodnoty jsou hardcodované, protože parsování "1+2" z CSV nefunguje správně
const getRodinneJizdneValues = (column: 'adult' | 'child' | 'junior' | 'senior'): string => {
  const values = {
    adult: "1+2",
    child: "2+1",
    junior: "2+2",
    senior: "2+3",
  };
  return values[column];
};

// Helper pro kontrolu, zda je řádek "Rodinné jízdné"
const isRodinneJizdne = (name: string): boolean => {
  return name.toLowerCase().includes("rodinné");
};

// Helper pro kontrolu, zda data mají jednotlivé ceny (adult/child/junior/senior)
// Pokud ano, ignoruj "all" sloupec úplně
const hasIndividualPrices = (rows: PriceRow[]): boolean => {
  return rows.some(row =>
    !row.isHeader && (
      row.adult !== undefined ||
      row.child !== undefined ||
      row.junior !== undefined ||
      row.senior !== undefined
    )
  );
};

const Pricing = () => {
  const [activeTab, setActiveTab] = useState<PricingTab>("denni");

  const tabs: { id: PricingTab; label: string; icon: any }[] = [
    { id: "denni", label: "DENNÍ", icon: Calendar },
    { id: "casove", label: "ČASOVÉ", icon: Clock },
    { id: "sezonni", label: "SEZÓNNÍ", icon: Award },
    { id: "jednotlive", label: "JEDNOTLIVÉ", icon: Ticket },
    { id: "bodove", label: "BODOVÉ", icon: Coins },
    { id: "ostatni", label: "OSTATNÍ", icon: Package },
    { id: "informace", label: "INFORMACE", icon: FileText },
    { id: "slevy", label: "SLEVY", icon: Percent },
  ];

  // DENNÍ JÍZDENKY
  const denniData: PriceRow[] = [
    {
      name: "Jízdenky platné pouze pro SKI CENTRUM KOHÚTKA",
      isHeader: true,
    },
    {
      name: "1-denní (od 8:30 do 16:00 hod.)",
      adult: 870,
      child: 340,
      junior: 710,
      senior: 710,
    },
    {
      name: "Jízdenky platné pro celý SKIREGION VALAŠSKO",
      isHeader: true,
    },
    {
      name: "2-denní (2 dny po sobě jdoucí bez večerního lyžování)",
      adult: 1540,
      child: 570,
      junior: 1230,
      senior: 1230,
    },
    {
      name: "3-denní (3 dny po sobě jdoucí bez večerního lyžování)",
      adult: 2010,
      child: 750,
      junior: 1610,
      senior: 1610,
    },
    {
      name: "4-denní (4 dny po sobě jdoucí bez večerního lyžování)",
      adult: 2390,
      child: 930,
      junior: 1920,
      senior: 1920,
    },
    {
      name: "5-denní (5 dny po sobě jdoucí bez večerního lyžování)",
      adult: 2790,
      child: 1080,
      junior: 2230,
      senior: 2230,
    },
    {
      name: "6 dnů v sezóně (platí i na večerní lyžování)",
      adult: 3800,
      child: 1400,
      junior: 3000,
      senior: 3000,
    },
    {
      name: "12 dnů v sezóně (platí i na večerní lyžování)",
      adult: 5000,
      child: 2100,
      junior: 4000,
      senior: 4000,
    },
    {
      name: "KOMBI – 8 hodin v sezóně (platí i na večerní lyžování)",
      adult: 1600,
      child: 580,
      junior: 1240,
      senior: 1200,
    },
    {
      name: "Bezkydy Card – jízdenky platné pro celý SKIREGION VALAŠSKO",
      isHeader: true,
    },
    {
      name: "2-denní (2 dny po sobě jdoucí bez večerního lyžování)",
      adult: 1230,
      child: 460,
      junior: 980,
      senior: 980,
    },
    {
      name: "3-denní (3 dny po sobě jdoucí bez večerního lyžování)",
      adult: 1610,
      child: 600,
      junior: 1290,
      senior: 1290,
    },
    {
      name: "4-denní (4 dny po sobě jdoucí bez večerního lyžování)",
      adult: 1910,
      child: 740,
      junior: 1540,
      senior: 1540,
    },
    {
      name: "5-denní (5 dny po sobě jdoucí bez večerního lyžování)",
      adult: 2230,
      child: 860,
      junior: 1780,
      senior: 1780,
    },
  ];

  // ČASOVÉ JÍZDENKY
  const casoveData: PriceRow[] = [
    {
      name: "3 hodinová",
      adult: 710,
      child: 270,
      junior: 590,
      senior: 590,
    },
    {
      name: "4 hodinová",
      adult: 790,
      child: 300,
      junior: 640,
      senior: 640,
    },
    {
      name: "Večerní lyžování (19:00-21:00)",
      adult: 300,
      child: 150,
      junior: 200,
      senior: 200,
    },
    {
      name: "Odpolední lyžování (13:30-16:00)",
      adult: 500,
      child: 180,
      junior: 400,
      senior: 400,
    },
  ];

  // SEZÓNNÍ JÍZDENKY
  const sezonniData: PriceRow[] = [
    {
      name: "Kohútka Skipas (nepřenosný)",
      adult: 8000,
      child: 4000,
      junior: 6000,
      senior: 6000,
    },
    {
      name: "Czech Skipass (s fotkou, 18 středisek)",
      adult: 17490,
      child: 13490,
      junior: 14990,
      senior: 13490,
    },
  ];

  // JEDNOTLIVÁ JÍZDA
  const jednotliveData: PriceRow[] = [
    {
      name: "Jednotlivá jízda (pouze nahoru)",
      adult: 170,
      child: 170,
      junior: 170,
      senior: 170,
    },
  ];

  // BODOVÉ JÍZDENKY
  const bodoveData: PriceRow[] = [
    {
      name: "Bodové jízdenky",
      isHeader: true,
    },
    {
      name: "40 bodů",
      all: 440,
    },
    {
      name: "100 bodů",
      all: 750,
    },
    {
      name: "300 bodů",
      all: 2000,
    },
    {
      name: "Lyžařský kurz (300 bodů)",
      all: 1600,
    },
    {
      name: "Spotřeba bodů na jednotlivých vlecích",
      isHeader: true,
    },
    {
      name: "Lanová dráha Kohútka",
      all: "10 bodů",
    },
    {
      name: "Runda",
      all: "6 bodů",
    },
    {
      name: "Malá Kohútka",
      all: "5 bodů",
    },
    {
      name: "Barborka",
      all: "4 body",
    },
    {
      name: "Spartak",
      all: "5 bodů",
    },
    {
      name: "Seník",
      all: "6 bodů",
    },
  ];

  // OSTATNÍ SLUŽBY
  const ostatniData: PriceRow[] = [
    {
      name: "Lyžařské kurzy (4-5 dní)",
      adult: 1850,
      child: 1850,
      junior: 1850,
      senior: "—",
    },
    {
      name: "Lyžařské kurzy (5 dní)",
      adult: 1950,
      child: 300,
      junior: 1950,
      senior: "—",
    },
    {
      name: "Skialp",
      adult: 200,
      child: 100,
      junior: 150,
      senior: 150,
    },
    {
      name: "Dětský lyžařský park (8:30-16:00)",
      adult: 200,
      child: 200,
      junior: 200,
      senior: 200,
    },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case "denni":
        return denniData;
      case "casove":
        return casoveData;
      case "sezonni":
        return sezonniData;
      case "jednotlive":
        return jednotliveData;
      case "bodove":
        return bodoveData;
      case "ostatni":
        return ostatniData;
      default:
        return [];
    }
  };

  // Fetch data z Google Sheets pomocí React Query (pouze pro ceníky, ne info/slevy)
  const shouldFetchFromSheets = !['informace', 'slevy'].includes(activeTab);

  // Synchronní načtení z localStorage pro okamžité zobrazení (bez skeleton)
  const cachedPricingData = useMemo(() => {
    if (!shouldFetchFromSheets) return undefined;
    return getCacheItem<PriceRow[]>(`pricing_${activeTab}`) ?? undefined;
  }, [activeTab, shouldFetchFromSheets]);

  const cachedAgeCategories = useMemo(() => {
    return getCacheItem<AgeCategoriesData>('age_categories') ?? undefined;
  }, []);

  const { data: sheetData, error } = useQuery({
    queryKey: ['pricing', activeTab],
    queryFn: () => fetchPricingFromGoogleSheets(activeTab as PricingCategory),
    enabled: shouldFetchFromSheets,
    placeholderData: cachedPricingData, // Zobrazí okamžitě z cache
    staleTime: 5 * 60 * 1000, // 5 minut - pak se revaliduje
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  // Fetch věkových kategorií z Google Sheets
  const { data: ageCategoriesData, error: ageCategoriesError } = useQuery({
    queryKey: ['ageCategories'],
    queryFn: fetchAgeCategoriesFromGoogleSheets,
    placeholderData: cachedAgeCategories, // Zobrazí okamžitě, ale fetchne čerstvá data na pozadí
    staleTime: 60 * 60 * 1000, // 1 hodina - mění se zřídka
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  // Fallback věkové kategorie pokud Google Sheets selže
  const ageCategories: AgeCategoriesData = ageCategoriesError || !ageCategoriesData
    ? {
        adult: { category: 'adult', name: 'Dospělí', birthYears: '1961-2007' },
        child: { category: 'child', name: 'Děti', birthYears: '2015 a mladší' },
        junior: { category: 'junior', name: 'Junioři', birthYears: '2006-2014' },
        senior: { category: 'senior', name: 'Senioři', birthYears: '1960 a starší' },
      }
    : ageCategoriesData;

  // Použij data z Google Sheets, nebo fallback na hardcodovaná data
  const data = (error || !sheetData) ? getCurrentData() : sheetData;

  // Log pro debugging (můžeš smazat po otestování)
  if (shouldFetchFromSheets) {
    if (error) {
      console.warn(`API/Google Sheets nedostupný pro "${activeTab}", používám lokální data`, error);
    } else if (sheetData) {
      console.log(`✅ Ceník "${activeTab}" načten (${sheetData.length} položek)`);
    }
  }

  if (ageCategoriesError) {
    console.warn('API/Google Sheets nedostupný pro věkové kategorie, používám lokální data', ageCategoriesError);
  } else if (ageCategoriesData) {
    console.log('✅ Věkové kategorie načteny');
  }

  const renderInformaceTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/95 p-6 border-0 shadow-lg">
        <h3 className="font-bold text-2xl mb-6 text-gray-900 flex items-center gap-3">
          <Info className="h-7 w-7 text-primary" />
          Věkové kategorie
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.values(ageCategories).map((cat) => (
            <div key={cat.category} className="bg-gradient hover:shadow-xl p-5 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <p className="font-bold text-xl text-primary-foreground mb-2">{cat.name}</p>
              <p className="text-primary-foreground/90 font-semibold text-base">Narození {cat.birthYears}</p>
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
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Záloha za čipovou kartu je 100 Kč, vratná pouze do 20 minut po zavření provozu při odevzdání nepoškozené karty</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Jízdenky jsou nepřenosné</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Nevyužité body a čas nelze vrátit</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Bodové jízdenky mají časový zámek zamezující současnému použití více osobami (s výjimkou kurzovních jízdenek)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Večerní lyžování provozováno pouze v sobotu při příznivých podmínkách</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Fotografie pořízená na turniketu je dočasná; po vrácení karty automaticky vymazána</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Pro ověření věku nutný občanský průkaz, pas nebo kartička sociálního pojištění</span>
            </li>
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
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Slevy se nesčítají</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Děti do 11 let obdrží sníženou dětskou sazbu (kromě bodových jízdenek)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Junioři 11-17 let obdrží juniorskou sazbu (kromě bodových jízdenek)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Senioři 65+ obdrží sníženou sazbu (kromě bodových jízdenek)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Studentské slevy dostupné pouze při online nákupu</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Držitelé průkazů TP/ZTP/ZTP/P obdrží slevy pouze na časové jízdenky</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Skupinová sleva: při nákupu 15+ stejných jízdenek jeden kus stejného typu zdarma</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold text-xl leading-relaxed">•</span>
              <span className="leading-relaxed font-medium">Speciální kurzovní ceny: 4-5 dní 1 300 Kč; 5 dní 1 400 Kč (platné 23.12.-17.3.)</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );

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
                  Sezóna 2025/2026
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

          {/* Tabs - Desktop with sticky positioning */}
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

          {/* Dropdown - Mobile with sticky positioning */}
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

          {/* Content - vždy zobrazí data okamžitě */}
          {activeTab === "informace" ? (
            renderInformaceTab()
          ) : activeTab === "slevy" ? (
            renderSlevyTab()
          ) : data.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <Card className="glass overflow-hidden border-0 shadow-2xl hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient text-primary-foreground border-b border-white/30">
                        <th className="text-left p-6 font-bold text-lg tracking-wide">Typ jízdenky</th>
                        {!hasIndividualPrices(data) ? (
                          <th className="text-right p-6 font-bold">
                            <span className="text-lg tracking-wide">Všechny kategorie</span>
                          </th>
                        ) : (
                          <>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ageCategories.adult.name}</span>
                                <span className="text-xs font-normal opacity-80">({ageCategories.adult.birthYears})</span>
                              </div>
                            </th>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ageCategories.child.name}</span>
                                <span className="text-xs font-normal opacity-80">({ageCategories.child.birthYears})</span>
                              </div>
                            </th>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ageCategories.junior.name}</span>
                                <span className="text-xs font-normal opacity-80">({ageCategories.junior.birthYears})</span>
                              </div>
                            </th>
                            <th className="text-right p-6 font-bold">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-lg tracking-wide">{ageCategories.senior.name}</span>
                                <span className="text-xs font-normal opacity-80">({ageCategories.senior.birthYears})</span>
                              </div>
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white/95 backdrop-blur-sm">
                      {data.map((row, index) => (
                        <Fragment key={`price-row-${index}-${row.name}`}>
                          <tr
                            className={
                              row.isHeader
                                ? "bg-primary/10 border-l-4 border-primary shadow-sm"
                                : "border-b border-gray-100 hover:bg-primary/5 transition-all duration-150"
                            }
                          >
                            <td className={`p-5 ${row.isHeader ? "font-bold text-gray-900 text-lg tracking-wide" : "font-medium text-gray-800"}`}>
                              {row.name}
                            </td>
                            {!hasIndividualPrices(data) ? (
                              <td className="text-right p-5 font-semibold text-gray-900">
                                {row.isHeader ? "" : (
                                  typeof row.all === "number" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.all}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : (
                                    <span className="text-base text-gray-700">{row.all}</span>
                                  )
                                )}
                              </td>
                            ) : (
                              <>
                                <td className={`p-5 font-semibold text-gray-900 ${row.isHeader && isRodinneJizdne(row.name) ? "text-center" : "text-right"}`}>
                                  {row.isHeader ? (
                                    isRodinneJizdne(row.name) ? (
                                      <span className="text-lg font-bold text-gray-900">{getRodinneJizdneValues('adult')}</span>
                                    ) : ""
                                  ) : typeof row.adult === "number" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.adult}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : (
                                    <span className="text-base text-gray-700">{row.adult}</span>
                                  )}
                                </td>
                                <td className={`p-5 font-semibold text-gray-900 ${row.isHeader && isRodinneJizdne(row.name) ? "text-center" : "text-right"}`}>
                                  {row.isHeader ? (
                                    isRodinneJizdne(row.name) ? (
                                      <span className="text-lg font-bold text-gray-900">{getRodinneJizdneValues('child')}</span>
                                    ) : ""
                                  ) : typeof row.child === "number" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.child}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : (
                                    <span className="text-base text-gray-700">{row.child}</span>
                                  )}
                                </td>
                                <td className={`p-5 font-semibold text-gray-900 ${row.isHeader && isRodinneJizdne(row.name) ? "text-center" : "text-right"}`}>
                                  {row.isHeader ? (
                                    isRodinneJizdne(row.name) ? (
                                      <span className="text-lg font-bold text-gray-900">{getRodinneJizdneValues('junior')}</span>
                                    ) : ""
                                  ) : typeof row.junior === "number" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.junior}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : (
                                    <span className="text-base text-gray-700">{row.junior}</span>
                                  )}
                                </td>
                                <td className={`p-5 font-semibold text-gray-900 ${row.isHeader && isRodinneJizdne(row.name) ? "text-center" : "text-right"}`}>
                                  {row.isHeader ? (
                                    isRodinneJizdne(row.name) ? (
                                      <span className="text-lg font-bold text-gray-900">{getRodinneJizdneValues('senior')}</span>
                                    ) : ""
                                  ) : typeof row.senior === "number" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="text-xl font-bold text-primary">{row.senior}</span>
                                      <span className="text-sm text-gray-600">Kč</span>
                                    </span>
                                  ) : (
                                    <span className="text-base text-gray-700">{row.senior}</span>
                                  )}
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {data.map((row, index) => (
                  <div key={`mobile-price-${index}-${row.name}`}>
                    {row.isHeader ? (
                      <div className="bg-primary/10 backdrop-blur-sm p-4 border-l-4 border-primary shadow-md rounded-xl">
                        <h3 className="font-bold text-base text-gray-900 tracking-wide">
                          {row.name}
                        </h3>
                        {/* Hardcoded values for Rodinné jízdné */}
                        {isRodinneJizdne(row.name) && (
                          <div className="flex flex-wrap justify-center gap-4 mt-3 text-lg font-bold text-gray-900">
                            <span>{getRodinneJizdneValues('adult')}</span>
                            <span>{getRodinneJizdneValues('child')}</span>
                            <span>{getRodinneJizdneValues('junior')}</span>
                            <span>{getRodinneJizdneValues('senior')}</span>
                          </div>
                        )}
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
                                  {typeof row.all === "number" ? (
                                    <>
                                      {row.all} <span className="text-sm text-gray-600">Kč</span>
                                    </>
                                  ) : (
                                    row.all
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ageCategories.adult.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ageCategories.adult.birthYears})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {typeof row.adult === "number" ? (
                                    <>
                                      {row.adult} <span className="text-xs text-gray-600">Kč</span>
                                    </>
                                  ) : (
                                    row.adult
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ageCategories.child.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ageCategories.child.birthYears})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {typeof row.child === "number" ? (
                                    <>
                                      {row.child} <span className="text-xs text-gray-600">Kč</span>
                                    </>
                                  ) : (
                                    row.child
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2.5 border-b border-gray-150">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ageCategories.junior.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ageCategories.junior.birthYears})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {typeof row.junior === "number" ? (
                                    <>
                                      {row.junior} <span className="text-xs text-gray-600">Kč</span>
                                    </>
                                  ) : (
                                    row.junior
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-2.5">
                                <div>
                                  <span className="text-sm font-semibold text-gray-800">{ageCategories.senior.name}</span>
                                  <p className="text-xs text-gray-500 mt-0.5">({ageCategories.senior.birthYears})</p>
                                </div>
                                <span className="text-xl font-bold text-primary">
                                  {typeof row.senior === "number" ? (
                                    <>
                                      {row.senior} <span className="text-xs text-gray-600">Kč</span>
                                    </>
                                  ) : (
                                    row.senior
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
                <p className="text-lg">Ceník pro tuto kategorii bude brzy dostupný.</p>
              </div>
            </Card>
          )}

          {/* Info Card - Show for tabs with pricing tables */}
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

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Pricing;
