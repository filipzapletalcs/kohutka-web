import { useState, Fragment } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Info, Clock, Calendar, Ticket, Award, Coins, Package, FileText, Percent } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PricingTab = "denni" | "casove" | "sezonni" | "jednotlive" | "bodove" | "ostatni" | "informace" | "slevy";

interface PriceRow {
  name: string;
  adult?: number | string;
  child?: number | string;
  junior?: number | string;
  senior?: number | string;
  all?: number | string;
  isHeader?: boolean;
  isSubheader?: boolean;
  note?: string;
}

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
      all: 170,
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
      name: "Kurz (300 bodů)",
      all: 1500,
    },
    {
      name: "Spotřeba bodů na jednotlivých vlecích",
      isHeader: true,
    },
    {
      name: "Kohútka (4-sed. lanovka)",
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

  const data = getCurrentData();

  const renderInformaceTab = () => (
    <div className="space-y-6">
      <Card className="bg-white/95 p-6 border-0 shadow-lg">
        <h3 className="font-bold text-2xl mb-6 text-gray-900 flex items-center gap-3">
          <Info className="h-7 w-7 text-primary" />
          Věkové kategorie
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-primary/90 hover:bg-primary p-5 rounded-lg shadow-md hover:shadow-lg transition-all">
            <p className="font-bold text-xl text-primary-foreground mb-2">Dospělí</p>
            <p className="text-primary-foreground/80 font-semibold text-base">Narození 1961-2007</p>
          </div>
          <div className="bg-primary/90 hover:bg-primary p-5 rounded-lg shadow-md hover:shadow-lg transition-all">
            <p className="font-bold text-xl text-primary-foreground mb-2">Děti</p>
            <p className="text-primary-foreground/80 font-semibold text-base">Narození 2015 a mladší</p>
          </div>
          <div className="bg-primary/90 hover:bg-primary p-5 rounded-lg shadow-md hover:shadow-lg transition-all">
            <p className="font-bold text-xl text-primary-foreground mb-2">Junioři</p>
            <p className="text-primary-foreground/80 font-semibold text-base">Narození 2006-2014</p>
          </div>
          <div className="bg-primary/90 hover:bg-primary p-5 rounded-lg shadow-md hover:shadow-lg transition-all">
            <p className="font-bold text-xl text-primary-foreground mb-2">Senioři</p>
            <p className="text-primary-foreground/80 font-semibold text-base">Narození 1960 a starší</p>
          </div>
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
      <div className="min-h-screen bg-gradient pt-24 pb-12 scroll-smooth">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-8 md:mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
              Ceník skipasů
            </h1>
            <p className="text-base md:text-lg text-white drop-shadow-md">
              Sezóna 2024/2025
            </p>
          </div>

          {/* Tabs - Desktop */}
          <div className="mb-8 hidden md:block overflow-x-auto">
            <div className="flex gap-2 flex-wrap bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 lg:px-6 py-3 rounded-md font-semibold text-sm transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-accent text-accent-foreground shadow-lg scale-105"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdown - Mobile */}
          <div className="mb-8 md:hidden">
            <Select value={activeTab} onValueChange={(value) => setActiveTab(value as PricingTab)}>
              <SelectTrigger className="w-full bg-white/95 text-gray-900 border-2 border-primary/30 h-14 text-lg shadow-lg hover:bg-white hover:border-primary/50 transition-all">
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
              <SelectContent className="bg-white border-2 border-primary/30">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem key={tab.id} value={tab.id} className="text-base py-3 cursor-pointer hover:bg-primary/10">
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
              {/* Desktop Table View */}
              <Card className="glass overflow-hidden border-0 shadow-2xl hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-b border-white/20">
                        <th className="text-left p-5 font-bold text-lg">Typ jízdenky</th>
                        {data[0]?.all !== undefined ? (
                          <th className="text-right p-5 font-bold">
                            <span className="text-lg">Všechny kategorie</span>
                          </th>
                        ) : (
                          <>
                            <th className="text-right p-5 font-bold">
                              <div className="flex flex-col items-end">
                                <span className="text-lg">Dospělí</span>
                                <span className="text-xs font-normal opacity-70">(1961-2007)</span>
                              </div>
                            </th>
                            <th className="text-right p-5 font-bold">
                              <div className="flex flex-col items-end">
                                <span className="text-lg">Děti</span>
                                <span className="text-xs font-normal opacity-70">(2015 a mladší)</span>
                              </div>
                            </th>
                            <th className="text-right p-5 font-bold">
                              <div className="flex flex-col items-end">
                                <span className="text-lg">Junioři</span>
                                <span className="text-xs font-normal opacity-70">(2006-2014)</span>
                              </div>
                            </th>
                            <th className="text-right p-5 font-bold">
                              <div className="flex flex-col items-end">
                                <span className="text-lg">Senioři</span>
                                <span className="text-xs font-normal opacity-70">(1960 a starší)</span>
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
                                ? "bg-blue-100 border-l-4 border-blue-600"
                                : "border-b border-gray-100 hover:bg-blue-50 transition-colors"
                            }
                          >
                            <td className={`p-4 ${row.isHeader ? "font-bold text-gray-900 text-lg" : "font-medium text-gray-700"}`}>
                              {row.name}
                            </td>
                            {row.all !== undefined ? (
                              <td className="text-right p-4 font-semibold text-gray-900">
                                {row.isHeader ? "" : (
                                  typeof row.all === "number" ? (
                                    <span className="inline-flex items-center gap-1">
                                      <span className="text-lg">{row.all}</span>
                                      <span className="text-xs text-gray-500">Kč</span>
                                    </span>
                                  ) : (
                                    <span className="text-sm">{row.all}</span>
                                  )
                                )}
                              </td>
                            ) : (
                              <>
                                <td className="text-right p-4 font-semibold text-gray-900">
                                  {row.isHeader ? "" : (
                                    typeof row.adult === "number" ? (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="text-lg">{row.adult}</span>
                                        <span className="text-xs text-gray-500">Kč</span>
                                      </span>
                                    ) : (
                                      <span className="text-sm">{row.adult}</span>
                                    )
                                  )}
                                </td>
                                <td className="text-right p-4 font-semibold text-gray-900">
                                  {row.isHeader ? "" : (
                                    typeof row.child === "number" ? (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="text-lg">{row.child}</span>
                                        <span className="text-xs text-gray-500">Kč</span>
                                      </span>
                                    ) : (
                                      <span className="text-sm">{row.child}</span>
                                    )
                                  )}
                                </td>
                                <td className="text-right p-4 font-semibold text-gray-900">
                                  {row.isHeader ? "" : (
                                    typeof row.junior === "number" ? (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="text-lg">{row.junior}</span>
                                        <span className="text-xs text-gray-500">Kč</span>
                                      </span>
                                    ) : (
                                      <span className="text-sm">{row.junior}</span>
                                    )
                                  )}
                                </td>
                                <td className="text-right p-4 font-semibold text-gray-900">
                                  {row.isHeader ? "" : (
                                    typeof row.senior === "number" ? (
                                      <span className="inline-flex items-center gap-1">
                                        <span className="text-lg">{row.senior}</span>
                                        <span className="text-xs text-gray-500">Kč</span>
                                      </span>
                                    ) : (
                                      <span className="text-sm">{row.senior}</span>
                                    )
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                          {row.note && (
                            <tr>
                              <td colSpan={5} className="px-4 py-2 bg-blue-50 border-b border-gray-100">
                                <p className="text-xs text-blue-700 italic flex items-center gap-2">
                                  <Info className="h-3 w-3" />
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
              <div className="md:hidden space-y-2">
                {data.map((row, index) => (
                  <div key={`mobile-price-${index}-${row.name}`}>
                    {row.isHeader ? (
                      <div className="bg-white/95 backdrop-blur-sm p-3 border-l-4 border-primary shadow-lg rounded-lg">
                        <h3 className="font-bold text-base text-gray-900">
                          {row.name}
                        </h3>
                      </div>
                    ) : (
                      <Card className="bg-white/95 border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="p-3">
                          <h4 className="font-semibold text-base text-gray-900 mb-2.5 leading-snug">
                            {row.name}
                          </h4>

                          {row.all !== undefined ? (
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-2.5 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Všechny kategorie</span>
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
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Dospělí</span>
                                  <p className="text-xs text-gray-500 mt-0.5">(1961-2007)</p>
                                </div>
                                <span className="text-xl font-bold text-gray-900">
                                  {typeof row.adult === "number" ? (
                                    <>
                                      {row.adult} <span className="text-xs text-gray-500">Kč</span>
                                    </>
                                  ) : (
                                    row.adult
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Děti</span>
                                  <p className="text-xs text-gray-500 mt-0.5">(2015 a mladší)</p>
                                </div>
                                <span className="text-xl font-bold text-gray-900">
                                  {typeof row.child === "number" ? (
                                    <>
                                      {row.child} <span className="text-xs text-gray-500">Kč</span>
                                    </>
                                  ) : (
                                    row.child
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Junioři</span>
                                  <p className="text-xs text-gray-500 mt-0.5">(2006-2014)</p>
                                </div>
                                <span className="text-xl font-bold text-gray-900">
                                  {typeof row.junior === "number" ? (
                                    <>
                                      {row.junior} <span className="text-xs text-gray-500">Kč</span>
                                    </>
                                  ) : (
                                    row.junior
                                  )}
                                </span>
                              </div>

                              <div className="flex justify-between items-center py-3">
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Senioři</span>
                                  <p className="text-xs text-gray-500 mt-0.5">(1960 a starší)</p>
                                </div>
                                <span className="text-xl font-bold text-gray-900">
                                  {typeof row.senior === "number" ? (
                                    <>
                                      {row.senior} <span className="text-xs text-gray-500">Kč</span>
                                    </>
                                  ) : (
                                    row.senior
                                  )}
                                </span>
                              </div>
                            </div>
                          )}

                          {row.note && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-2 border-blue-400">
                              <p className="text-xs text-blue-700 flex items-start gap-2">
                                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
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
              <Card className="bg-blue-50 p-5 md:p-6 border-0 shadow-lg border-l-4 border-primary">
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
