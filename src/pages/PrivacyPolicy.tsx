import { Shield, Database, Users, Globe, Clock, FileText, Mail, Scale, UserCheck, Server, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-8">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Zásady ochrany osobních údajů</h1>
          <p className="text-lg text-muted-foreground font-medium">
            Informace o zpracování a ochraně vašich osobních údajů v souladu s GDPR
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-8">

            {/* Správce osobních údajů */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary" />
                Správce osobních údajů
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Správcem vašich osobních údajů je společnost:
                </p>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-foreground text-lg">SKI CENTRUM KOHÚTKA, a.s.</p>
                  <p className="text-sm mt-2">IČO: 26904390</p>
                  <p className="text-sm">Sídlo: Nový Hrozenkov 241, 756 04 Nový Hrozenkov</p>
                  <p className="text-sm mt-2">
                    Email:{" "}
                    <a href="mailto:ski@kohutka.ski" className="text-primary font-semibold hover:underline">
                      ski@kohutka.ski
                    </a>
                  </p>
                  <p className="text-sm">
                    Telefon:{" "}
                    <a href="tel:+420725005725" className="text-primary font-semibold hover:underline">
                      +420 725 005 725
                    </a>
                  </p>
                </div>
                <p className="text-sm">
                  Jako správce osobních údajů určujeme, jakým způsobem budou osobní údaje zpracovávány a za jakým účelem, po jak dlouhou dobu a vybíráme případné další zpracovatele, kteří nám se zpracováním pomohou.
                </p>
              </div>
            </Card>

            {/* Jaké údaje zpracováváme */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Database className="h-6 w-6 text-blue-500" />
                Jaké osobní údaje zpracováváme
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  V závislosti na konkrétní službě můžeme zpracovávat následující kategorie osobních údajů:
                </p>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Identifikační a kontaktní údaje</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Jméno a příjmení</li>
                    <li>E-mailová adresa</li>
                    <li>Telefonní číslo</li>
                    <li>Adresa (u obchodních partnerů)</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Technické údaje</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>IP adresa</li>
                    <li>Typ a verze prohlížeče</li>
                    <li>Operační systém</li>
                    <li>Identifikátory zařízení</li>
                    <li>Údaje o interakci s webem (navštívené stránky, čas strávený na webu)</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Údaje z komunikace</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Obsah e-mailové komunikace</li>
                    <li>Zprávy zaslané prostřednictvím kontaktních formulářů</li>
                    <li>Údaje z telefonické komunikace</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Účely a právní základ zpracování */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Scale className="h-6 w-6 text-green-500" />
                Účely a právní základ zpracování
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Vaše osobní údaje zpracováváme vždy pouze pro konkrétní účely a na základě odpovídajícího právního základu podle čl. 6 GDPR:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left p-3 font-semibold text-foreground">Účel zpracování</th>
                        <th className="text-left p-3 font-semibold text-foreground">Právní základ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr>
                        <td className="p-3">Poskytování služeb lyžařského střediska</td>
                        <td className="p-3">Plnění smlouvy (čl. 6 odst. 1 písm. b)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Odpovědi na dotazy a požadavky</td>
                        <td className="p-3">Oprávněný zájem (čl. 6 odst. 1 písm. f)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Zasílání marketingových sdělení</td>
                        <td className="p-3">Souhlas (čl. 6 odst. 1 písm. a)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Analýza návštěvnosti webu</td>
                        <td className="p-3">Souhlas (čl. 6 odst. 1 písm. a)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Cílená reklama (remarketing)</td>
                        <td className="p-3">Souhlas (čl. 6 odst. 1 písm. a)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Plnění zákonných povinností</td>
                        <td className="p-3">Právní povinnost (čl. 6 odst. 1 písm. c)</td>
                      </tr>
                      <tr>
                        <td className="p-3">Zajištění bezpečnosti webu</td>
                        <td className="p-3">Oprávněný zájem (čl. 6 odst. 1 písm. f)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Příjemci osobních údajů */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-500" />
                Příjemci osobních údajů
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Vaše osobní údaje můžeme sdílet s následujícími kategoriemi příjemců:
                </p>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Poskytovatelé analytických služeb</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Google LLC</strong> - Google Analytics pro analýzu návštěvnosti webu</li>
                    <li><strong>Google LLC</strong> - Google Tag Manager pro správu měřicích kódů</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Poskytovatelé reklamních služeb</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Meta Platforms Ireland Ltd.</strong> - Meta (Facebook) Pixel pro měření konverzí a remarketing</li>
                    <li><strong>Google LLC</strong> - Google Ads pro cílenou reklamu</li>
                  </ul>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-3">Další příjemci</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Poskytovatelé IT služeb a hostingu</li>
                    <li>Poskytovatelé platebních služeb</li>
                    <li>Státní orgány (na základě zákonné povinnosti)</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Předávání do třetích zemí */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Globe className="h-6 w-6 text-orange-500" />
                Předávání údajů do třetích zemí
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  V souvislosti s využíváním služeb Google a Meta může docházet k předávání vašich osobních údajů do Spojených států amerických. Toto předávání je zajištěno na základě:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>
                    <strong>EU-US Data Privacy Framework</strong> - Google LLC a Meta Platforms, Inc. jsou certifikováni v rámci tohoto rámce
                  </li>
                  <li>
                    <strong>Standardních smluvních doložek</strong> schválených Evropskou komisí
                  </li>
                </ul>
                <p className="text-sm">
                  Tyto mechanismy zajišťují, že vaše údaje jsou chráněny na srovnatelné úrovni jako v EU.
                </p>
              </div>
            </Card>

            {/* Doba uchovávání */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-cyan-500" />
                Doba uchovávání údajů
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Osobní údaje uchováváme pouze po dobu nezbytnou pro splnění účelu, pro který byly shromážděny:
                </p>
                <div className="bg-white/5 rounded-lg p-4">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Údaje z kontaktních formulářů:</strong> po dobu vyřízení vašeho dotazu + 2 roky</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Marketingové souhlasy:</strong> do odvolání souhlasu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Analytické údaje (cookies):</strong> dle nastavení jednotlivých služeb (obvykle 14-26 měsíců)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span><strong>Technické logy:</strong> maximálně 90 dní</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Vaše práva */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <FileText className="h-6 w-6 text-yellow-500" />
                Vaše práva
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  V souvislosti se zpracováním vašich osobních údajů máte následující práva:
                </p>

                <div className="grid gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Právo na přístup (čl. 15 GDPR)</h4>
                    <p className="text-sm">Máte právo získat potvrzení, zda zpracováváme vaše osobní údaje, a pokud ano, získat k nim přístup spolu s dalšími informacemi o zpracování.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Právo na opravu (čl. 16 GDPR)</h4>
                    <p className="text-sm">Máte právo požádat o opravu nepřesných osobních údajů nebo o doplnění neúplných údajů.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Právo na výmaz (čl. 17 GDPR)</h4>
                    <p className="text-sm">Máte právo požádat o vymazání vašich osobních údajů, pokud již nejsou potřebné, odvoláte souhlas, vznesete námitku, nebo byly zpracovány protiprávně.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Právo na omezení zpracování (čl. 18 GDPR)</h4>
                    <p className="text-sm">Máte právo požádat o omezení zpracování, pokud popíráte přesnost údajů, zpracování je protiprávní, údaje již nepotřebujeme, nebo jste vznesli námitku.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Právo na přenositelnost (čl. 20 GDPR)</h4>
                    <p className="text-sm">Máte právo získat své osobní údaje ve strukturovaném, běžně používaném a strojově čitelném formátu a předat je jinému správci.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Právo vznést námitku (čl. 21 GDPR)</h4>
                    <p className="text-sm">Máte právo kdykoliv vznést námitku proti zpracování založenému na oprávněném zájmu, včetně profilování. Proti zpracování pro přímý marketing můžete vznést námitku bez udání důvodu.</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Právo odvolat souhlas (čl. 7 GDPR)</h4>
                    <p className="text-sm">Pokud je zpracování založeno na vašem souhlasu, máte právo tento souhlas kdykoliv odvolat. Odvolání souhlasu nemá vliv na zákonnost zpracování před jeho odvoláním.</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Jak uplatnit svá práva */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Mail className="h-6 w-6 text-primary" />
                Jak uplatnit svá práva
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Pro uplatnění jakéhokoliv z výše uvedených práv nás můžete kontaktovat:
                </p>
                <div className="bg-white/5 rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>E-mailem:</strong>{" "}
                      <a href="mailto:ski@kohutka.ski" className="text-primary font-semibold hover:underline">
                        ski@kohutka.ski
                      </a>
                    </li>
                    <li>
                      <strong>Písemně:</strong> SKI CENTRUM KOHÚTKA, a.s., Nový Hrozenkov 241, 756 04 Nový Hrozenkov
                    </li>
                  </ul>
                </div>
                <p className="text-sm">
                  Na vaši žádost odpovíme bez zbytečného odkladu, nejpozději do jednoho měsíce od obdržení žádosti. Ve složitých případech můžeme tuto lhůtu prodloužit o další dva měsíce.
                </p>

                <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">Právo podat stížnost</h4>
                  <p className="text-sm">
                    Pokud se domníváte, že zpracování vašich osobních údajů porušuje GDPR, máte právo podat stížnost u dozorového úřadu:
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-foreground">Úřad pro ochranu osobních údajů</p>
                    <p className="text-sm">Pplk. Sochora 27, 170 00 Praha 7</p>
                    <a
                      href="https://www.uoou.cz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      www.uoou.cz
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Zabezpečení údajů */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Server className="h-6 w-6 text-red-500" />
                Zabezpečení údajů
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Přijali jsme vhodná technická a organizační opatření k zajištění bezpečnosti vašich osobních údajů:
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Šifrovaný přenos dat pomocí protokolu HTTPS/TLS</li>
                  <li>Pravidelné aktualizace zabezpečení systémů</li>
                  <li>Omezený přístup k osobním údajům pouze oprávněným osobám</li>
                  <li>Pravidelné zálohování dat</li>
                  <li>Školení zaměstnanců v oblasti ochrany osobních údajů</li>
                </ul>
              </div>
            </Card>

            {/* Cookies */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Soubory cookies</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Informace o používání souborů cookies na našich webových stránkách naleznete v samostatném dokumentu{" "}
                  <Link to="/cookies" className="text-primary font-semibold hover:underline">
                    Zásady používání cookies
                  </Link>.
                </p>
              </div>
            </Card>

            {/* Změny zásad */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Změny těchto zásad</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Tyto zásady ochrany osobních údajů můžeme příležitostně aktualizovat, abychom zohlednili změny v našich postupech nebo z jiných provozních, právních či regulačních důvodů.
                </p>
                <p className="text-sm">
                  O významných změnách vás budeme informovat prostřednictvím našich webových stránek. Doporučujeme tyto zásady pravidelně kontrolovat.
                </p>
              </div>
            </Card>

            {/* Kontakt */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Kontakt</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  V případě jakýchkoliv dotazů ohledně zpracování vašich osobních údajů nás neváhejte kontaktovat:
                </p>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-foreground">SKI CENTRUM KOHÚTKA, a.s.</p>
                  <p className="text-sm">Nový Hrozenkov 241, 756 04 Nový Hrozenkov</p>
                  <p className="text-sm mt-2">
                    Email:{" "}
                    <a href="mailto:ski@kohutka.ski" className="text-primary font-semibold hover:underline">
                      ski@kohutka.ski
                    </a>
                  </p>
                  <p className="text-sm">
                    Telefon:{" "}
                    <a href="tel:+420725005725" className="text-primary font-semibold hover:underline">
                      +420 725 005 725
                    </a>
                  </p>
                </div>
              </div>
            </Card>

            {/* Datum aktualizace */}
            <div className="text-center text-sm text-muted-foreground pt-4">
              <p>Tyto zásady byly naposledy aktualizovány dne <strong>2. ledna 2026</strong></p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
