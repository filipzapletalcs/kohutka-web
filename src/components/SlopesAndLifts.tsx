import { useQuery } from "@tanstack/react-query";
import { fetchHolidayInfoData } from "@/services/holidayInfoApi";
import { fetchSlopesLiftsOverrides, type SlopeLiftOverride } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Loader2, Mountain, Cable, CircleCheck, CircleX } from "lucide-react";

/**
 * Get difficulty badge color based on diff_code
 * 1 = Easy (blue), 2 = Intermediate (red), 3 = Difficult (black)
 */
function getDifficultyColor(diffCode: number): string {
  switch (diffCode) {
    case 1:
      return "bg-blue-500";
    case 2:
      return "bg-red-500";
    case 3:
      return "bg-gray-900";
    default:
      return "bg-gray-500";
  }
}

/**
 * Get status icon and color based on status_code and type
 *
 * Slopes (sjezdovky): status_code 2,6 = Otevřena, 3 = Zavřena
 * Lifts (vleky): status_code 1,3 = v provozu, 2 = mimo provoz
 */
function getStatusInfo(statusCode: number, statusText: string, type: 'slope' | 'lift') {
  let isOpen: boolean;

  if (type === 'slope') {
    // Slopes: status_code 2 or 6 = open
    isOpen = statusCode === 2 || statusCode === 6;
  } else {
    // Lifts: status_code 1 or 3 = open
    isOpen = statusCode === 1 || statusCode === 3;
  }

  if (isOpen) {
    return {
      icon: CircleCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      text: statusText || "otevřeno",
    };
  }

  return {
    icon: CircleX,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    text: statusText || "zavřeno",
  };
}

const SlopesAndLifts = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["holiday-info-details"],
    queryFn: fetchHolidayInfoData,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch manual overrides
  const { data: overrides = [] } = useQuery({
    queryKey: ["slopes-lifts-overrides"],
    queryFn: fetchSlopesLiftsOverrides,
    staleTime: 30 * 1000,
  });

  // Get override for an item
  const getOverride = (type: 'slope' | 'lift', id: string): SlopeLiftOverride | undefined => {
    return overrides.find((o) => o.id === `${type}_${id}`);
  };

  // Get effective status considering manual override
  const getEffectiveStatusCode = (type: 'slope' | 'lift', id: string, apiStatusCode: number): number => {
    const override = getOverride(type, id);
    if (override && override.mode === 'manual') {
      // Return status code based on manual override
      // Slopes: 2 = open, 3 = closed
      // Lifts: 1 = open, 2 = closed
      if (type === 'slope') {
        return override.is_open ? 2 : 3;
      } else {
        return override.is_open ? 1 : 2;
      }
    }
    return apiStatusCode;
  };

  if (isLoading) {
    return (
      <section className="pt-8 pb-20 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="pt-8 pb-20 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4">
          <Card className="glass p-8 text-center rounded-xl border-0 shadow-lg">
            <p className="text-muted-foreground font-medium text-base">
              Nepodařilo se načíst data o sjezdovkách a lanovkách
            </p>
          </Card>
        </div>
      </section>
    );
  }

  const { slopesDetailed = [], liftsDetailed = [] } = data;

  // Calculate totals (using effective status with overrides)
  // Slopes: status_code 2,6 = open
  // Lifts: status_code 1,3 = open
  const totalSlopes = slopesDetailed.length;
  const openSlopes = slopesDetailed.filter(s => {
    const effectiveCode = getEffectiveStatusCode('slope', s.id, s.status_code);
    return effectiveCode === 2 || effectiveCode === 6;
  }).length;
  const totalSlopesLength = slopesDetailed.reduce((sum, s) => sum + s.length, 0);
  const totalSlopesExceed = slopesDetailed.reduce((sum, s) => sum + s.exceed, 0);

  const totalLifts = liftsDetailed.length; // Včetně skiparku
  const openLifts = liftsDetailed.filter(l => {
    const effectiveCode = getEffectiveStatusCode('lift', l.id, l.status_code);
    return effectiveCode === 1 || effectiveCode === 3;
  }).length;
  const totalLiftsLength = liftsDetailed.reduce((sum, l) => sum + l.length, 0);
  const totalCapacity = liftsDetailed.reduce((sum, l) => sum + l.capacity, 0);

  // Pad arrays to same length for aligned footers
  const maxRows = Math.max(slopesDetailed.length, liftsDetailed.length);

  return (
    <section className="pt-4 pb-20 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Sjezdovky a lanovky
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Aktuální stav sjezdovek a vleků v SKI CENTRUM KOHÚTKA
          </p>
        </div>

        {/* Tables Grid */}
        <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
          {/* Slopes Table */}
          <Card className="glass rounded-xl overflow-hidden flex flex-col border-0 shadow-2xl">
            <div className="bg-gradient text-primary-foreground p-4 md:p-6">
              <div className="flex items-center gap-3">
                <Mountain className="h-6 w-6" />
                <h3 className="text-xl md:text-2xl font-bold tracking-wide">Sjezdovky</h3>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 flex flex-col">
              <table className="w-full text-sm h-full">
                <thead>
                  <tr className="border-b-2 border-white/20 bg-muted/30">
                    <th className="text-left px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Název</th>
                    <th className="text-left px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Obtížnost</th>
                    <th className="text-right px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Převýšení</th>
                    <th className="text-right px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Délka</th>
                    <th className="text-center px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(maxRows)].map((_, index) => {
                    const slope = slopesDetailed[index];

                    // Empty row for alignment (hidden on mobile, visible on desktop)
                    if (!slope) {
                      return (
                        <tr
                          key={`empty-${index}`}
                          className={`hidden lg:table-row ${index % 2 === 0 ? "bg-blue-500/5" : ""}`}
                        >
                          <td className="px-1.5 py-2 md:p-3" colSpan={5}>&nbsp;</td>
                        </tr>
                      );
                    }

                    const effectiveStatusCode = getEffectiveStatusCode('slope', slope.id, slope.status_code);
                    const status = getStatusInfo(effectiveStatusCode, slope.status_text, 'slope');
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={slope.id}
                        className={`hover:bg-primary/5 transition-all duration-150 ${
                          index % 2 === 0 ? "bg-blue-500/5" : ""
                        }`}
                      >
                        <td className="px-1.5 py-2 md:p-3 font-bold text-xs md:text-sm text-gray-800">{slope.name}</td>
                        <td className="px-1.5 py-2 md:p-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full shadow-md flex-shrink-0 ${getDifficultyColor(slope.diff_code)}`} />
                            <span className="text-xs md:text-sm font-semibold text-gray-800">{slope.diff_text}</span>
                          </div>
                        </td>
                        <td className="px-1.5 py-2 md:p-3 text-right whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-800">{slope.exceed} m</span>
                        </td>
                        <td className="px-1.5 py-2 md:p-3 text-right whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-800">{slope.length} m</span>
                        </td>
                        <td className="px-1.5 py-2 md:p-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`rounded-full p-0.5 shadow-sm ${status.bgColor}`}>
                              <StatusIcon className={`h-3 w-3 md:h-3.5 md:w-3.5 ${status.color}`} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-white border-t-4 border-primary shadow-sm">
                    <td className="px-1.5 py-3 md:p-4 text-xs md:text-sm tracking-wide font-bold text-gray-900">
                      Celkem
                    </td>
                    <td className="px-1.5 py-3 md:p-4 text-xs md:text-sm font-semibold text-gray-700">-</td>
                    <td className="px-1.5 py-3 md:p-4 text-right text-xs md:text-sm font-bold text-primary whitespace-nowrap">{totalSlopesExceed} m</td>
                    <td className="px-1.5 py-3 md:p-4 text-right text-xs md:text-sm font-bold text-primary whitespace-nowrap">{totalSlopesLength} m</td>
                    <td className="px-1.5 py-3 md:p-4 text-center text-xs md:text-sm font-bold text-primary whitespace-nowrap">
                      {openSlopes} / {totalSlopes}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Lifts Table */}
          <Card className="glass rounded-xl overflow-hidden flex flex-col border-0 shadow-2xl">
            <div className="bg-gradient text-primary-foreground p-4 md:p-6">
              <div className="flex items-center gap-3">
                <Cable className="h-6 w-6" />
                <h3 className="text-xl md:text-2xl font-bold tracking-wide">Vleky a lanovky</h3>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 flex flex-col">
              <table className="w-full text-sm h-full">
                <thead>
                  <tr className="border-b-2 border-white/20 bg-muted/30">
                    <th className="text-left px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Název</th>
                    <th className="text-left px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Typ</th>
                    <th className="text-right px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Kapacita</th>
                    <th className="text-right px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Délka</th>
                    <th className="text-center px-1.5 py-2 md:p-3 text-xs md:text-sm font-bold tracking-wide">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(maxRows)].map((_, index) => {
                    const lift = liftsDetailed[index];

                    // Empty row for alignment (hidden on mobile, visible on desktop)
                    if (!lift) {
                      return (
                        <tr
                          key={`empty-lift-${index}`}
                          className={`hidden lg:table-row ${index % 2 === 0 ? "bg-blue-500/5" : ""}`}
                        >
                          <td className="px-1.5 py-2 md:p-3" colSpan={5}>&nbsp;</td>
                        </tr>
                      );
                    }

                    const effectiveStatusCode = getEffectiveStatusCode('lift', lift.id, lift.status_code);
                    const status = getStatusInfo(effectiveStatusCode, lift.status_text, 'lift');
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={lift.id}
                        className={`hover:bg-primary/5 transition-all duration-150 ${
                          index % 2 === 0 ? "bg-blue-500/5" : ""
                        }`}
                      >
                        <td className="px-1.5 py-2 md:p-3 font-bold text-xs md:text-sm text-gray-800">{lift.name}</td>
                        <td className="px-1.5 py-2 md:p-3 text-xs md:text-sm font-semibold text-gray-800">{lift.type_text}</td>
                        <td className="px-1.5 py-2 md:p-3 text-right whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-800">{lift.capacity} os/h</span>
                        </td>
                        <td className="px-1.5 py-2 md:p-3 text-right whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-800">{lift.length} m</span>
                        </td>
                        <td className="px-1.5 py-2 md:p-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`rounded-full p-0.5 shadow-sm ${status.bgColor}`}>
                              <StatusIcon className={`h-3 w-3 md:h-3.5 md:w-3.5 ${status.color}`} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-white border-t-4 border-primary shadow-sm">
                    <td className="px-1.5 py-3 md:p-4 text-xs md:text-sm tracking-wide font-bold text-gray-900">
                      Celkem
                    </td>
                    <td className="px-1.5 py-3 md:p-4 text-xs md:text-sm font-semibold text-gray-700">-</td>
                    <td className="px-1.5 py-3 md:p-4 text-right text-xs md:text-sm font-bold text-primary whitespace-nowrap">{totalCapacity} os/h</td>
                    <td className="px-1.5 py-3 md:p-4 text-right text-xs md:text-sm font-bold text-primary whitespace-nowrap">{totalLiftsLength} m</td>
                    <td className="px-1.5 py-3 md:p-4 text-center text-xs md:text-sm font-bold text-primary whitespace-nowrap">
                      {openLifts} / {totalLifts}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>

        {/* Data Source Attribution */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground font-medium">
            Zdroj dat:{" "}
            <a
              href="https://www.holidayinfo.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-accent transition-colors duration-200 font-semibold"
            >
              www.holidayinfo.cz
            </a>
            {" "}© Sitour CZ
          </p>
        </div>
      </div>
    </section>
  );
};

export default SlopesAndLifts;
