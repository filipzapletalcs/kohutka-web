import {
  Building2,
  MapPin,
  FileText,
  Mountain,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const CompanyDetails = () => {
  const addresses = [
    {
      title: "Adresa provozovny",
      icon: Mountain,
      lines: ["Nový Hrozenkov 241", "756 04 Nový Hrozenkov"],
    },
    {
      title: "Sídlo společnosti",
      icon: Building2,
      lines: ["Dlouhá 719/44", "110 00 Praha 1"],
    },
    {
      title: "Adresa pro doručování",
      icon: MapPin,
      lines: ["Mládí 1466", "755 01 Vsetín"],
    },
    {
      title: "Infocentrum Kohútka",
      icon: MapPin,
      lines: ["Lazy pod Makytou 1133", "020 55 Lazy pod Makytou"],
    },
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">O společnosti</h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          {/* Company Info */}
          <Card className="glass p-8 border-white/20 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Údaje o společnosti</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Název společnosti</p>
                <p className="text-lg font-semibold">SKI CENTRUM KOHÚTKA, a.s.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">IČO</p>
                  <p className="text-lg font-semibold">26834430</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DIČ</p>
                  <p className="text-lg font-semibold">CZ26834430</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nadmořská výška</p>
                <p className="text-lg font-semibold">913 m n. m.</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Poloha</p>
                <p className="text-lg font-semibold">
                  České-slovenské pomezí v pohoří Javorníky
                </p>
              </div>
            </div>
          </Card>

          {/* Addresses */}
          <Card className="glass p-8 border-white/20 rounded-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Adresy</h3>
            </div>
            <div className="space-y-6">
              {addresses.map((address, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <address.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{address.title}</h4>
                    {address.lines.map((line, lineIndex) => (
                      <p key={lineIndex} className="text-sm text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CompanyDetails;
