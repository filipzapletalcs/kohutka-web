import { MapPin, Car, Bus, ParkingCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

const DirectionsInfo = () => {
  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Kudy k nám</h2>
          <p className="text-lg text-muted-foreground">
            Důležité informace pro vaši cestu
          </p>
        </div>

        {/* Important Notice */}
        <Card className="glass p-6 border-yellow-500/30 bg-yellow-500/5 mb-4 md:mb-8 rounded-lg">
          <div className="flex gap-4">
            <Info className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-foreground">
                Upozornění při zadávání navigace:
              </p>
              <p className="text-muted-foreground">
                Při zadávání cíle do navigace nebo vyhledávače dbejte dalšího pokynu. Ne naší vinou nelze v některých případech zadat cíl Kohútka pro návštěvníky přijíždějící z České republiky. Zadejte tedy obec <strong className="text-foreground">Nový Hrozenkov</strong> (popř. část <strong className="text-foreground">Vranča</strong>) a dále pokračujte podle směrových tabulí. Pro návštěvníky ze Slovenska je možno zadat přímo cíl Kohútka.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">
          {/* Czech Route */}
          <Card className="glass p-6 border-white/20 rounded-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Příjezd z České strany</h3>
                <p className="text-sm text-muted-foreground">
                  Přes Nový Hrozenkov
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              Na Kohútku vede cesta z české (Nový Hrozenkov) i slovenské (Lazy pod Makytou) strany. Není tedy nutno v žádném případě přejíždět hranice obou republik.
            </p>
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Trasa z Prahy/Brna/Olomouce:</p>
              <p className="text-sm text-muted-foreground">
                Praha → Brno → Olomouc → Hranice na Moravě → Valašské Meziříčí → Vsetín → <strong className="text-foreground">Nový Hrozenkov</strong> (směr Velké Karlovice) → V Novém Hrozenkově doprava do údolí Vranča → Kohútka
              </p>
            </div>
          </Card>

          {/* Slovak Route */}
          <Card className="glass p-6 border-white/20 rounded-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Príjazd zo Slovenska</h3>
                <p className="text-sm text-muted-foreground">
                  Cez Lazy pod Makytou
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mb-4">
              Pouze klienti od Bytče na sever (Žilina, Martin, ...) mají výhodnější příjezd přes Makov a Velké Karlovice (ČR).
            </p>
            <div className="bg-primary/5 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Trasa z Bratislavy:</p>
              <p className="text-sm text-muted-foreground">
                Bratislava → Trnava → Trenčín → Púchov (doleva směr Zlín) → Lúky pod Makytou (doprava směr Lazy pod Makytou) → <strong className="text-foreground">Lazy pod Makytou</strong> → Čertov → Po místní komunikaci 6 km do kopce do lyžařského střediska
              </p>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {/* Parking */}
          <Card className="glass p-6 border-white/20 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <ParkingCircle className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-bold">Parkování</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Zdarma</strong> na centrálním parkovišti v horském sedle pod Kohútkou popř. na záchytném parkovišti v údolí Vranča. Dbejte pokynů obsluhy parkoviště.
            </p>
          </Card>

          {/* Skibus */}
          <Card className="glass p-6 border-white/20 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Bus className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-bold">Skibus</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              V zimním období <strong className="text-foreground">zdarma pouze pro sjezdové lyžaře</strong>, v provozu každý den.
            </p>
            <p className="text-sm text-muted-foreground">
              Odjezdy z centrálního parkoviště ve <strong className="text-foreground">14:00, 15:00 a 16:00</strong>. Cesta trvá cca 10 minut. Info: <a href="tel:+420725005725" className="text-primary hover:underline">+420 725 005 725</a>
            </p>
          </Card>

          {/* Roads */}
          <Card className="glass p-6 border-white/20 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Car className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-bold">Stav komunikací</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Přístupové komunikace z české i slovenské strany jsou pravidelně udržovány. V zimě sjízdné se <strong className="text-foreground">zimní výbavou</strong> (sněhové řetězy, lopata). Z české strany vjezd autobusů pouze do 10 tun.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DirectionsInfo;
