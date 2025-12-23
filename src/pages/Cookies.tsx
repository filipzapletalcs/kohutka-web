import { Cookie, Shield, BarChart3, Target, Settings, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-8">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Cookie className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">Zásady používání cookies</h1>
          <p className="text-lg text-muted-foreground font-medium">
            Informace o tom, jak používáme soubory cookies na našich webových stránkách
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="space-y-8">

            {/* Co jsou cookies */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Cookie className="h-6 w-6 text-primary" />
                Co jsou cookies?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Cookies jsou malé textové soubory, které se ukládají do vašeho zařízení (počítače, tabletu nebo mobilního telefonu) při návštěvě webových stránek. Tyto soubory umožňují webovým stránkám rozpoznat vaše zařízení a zapamatovat si určité informace o vaší návštěvě.
                </p>
                <p>
                  Cookies jsou běžnou součástí moderního internetu a pomáhají zajistit správné fungování webových stránek, zlepšují uživatelský zážitek a poskytují provozovatelům stránek užitečné informace o jejich návštěvnících.
                </p>
              </div>
            </Card>

            {/* Nezbytné cookies */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Shield className="h-6 w-6 text-green-500" />
                Nezbytné (technické) cookies
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Tyto cookies jsou nezbytné pro správné fungování webových stránek. Bez nich by některé části webu nemohly fungovat. Zajišťují základní funkce jako navigaci mezi stránkami, přístup k zabezpečeným částem webu nebo načítání obsahu.
                </p>
                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">Příklady použití:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Uchovávání informací o přihlášení</li>
                    <li>Zajištění bezpečného připojení</li>
                    <li>Správné načítání obsahu stránek</li>
                  </ul>
                </div>
                <p className="text-sm italic">
                  Tyto cookies nelze vypnout, protože jsou nezbytné pro základní funkčnost webu.
                </p>
              </div>
            </Card>

            {/* Preferenční cookies */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Settings className="h-6 w-6 text-blue-500" />
                Preferenční cookies
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Preferenční cookies umožňují webovým stránkám zapamatovat si informace, které mění způsob chování nebo vzhledu webu. Díky nim si web pamatuje vaše preference a nastavení pro budoucí návštěvy.
                </p>
                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2">Příklady použití:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Zapamatování jazykových preferencí</li>
                    <li>Uložení oblíbených nastavení zobrazení</li>
                    <li>Personalizace obsahu podle vašich zájmů</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Analytické cookies */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-orange-500" />
                Analytické cookies
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Analytické cookies nám pomáhají porozumět tomu, jak návštěvníci používají naše webové stránky. Shromažďují anonymizované informace o návštěvnosti, které nám umožňují zlepšovat obsah a funkčnost webu.
                </p>

                {/* Google Analytics */}
                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Google Analytics
                  </h4>
                  <p className="text-sm mb-2">
                    Používáme službu Google Analytics pro analýzu návštěvnosti. Tato služba nám poskytuje informace o:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Počtu návštěvníků a zobrazení stránek</li>
                    <li>Způsobu, jakým se návštěvníci na web dostali</li>
                    <li>Které stránky jsou nejnavštěvovanější</li>
                    <li>Době strávené na webu</li>
                  </ul>
                  <p className="text-sm mt-2 italic">
                    IP adresy jsou anonymizovány, takže nelze identifikovat konkrétní uživatele.
                  </p>
                </div>

                {/* Google Tag Manager */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Google Tag Manager
                  </h4>
                  <p className="text-sm">
                    Google Tag Manager je nástroj pro správu měřicích kódů na webu. Sám o sobě nesbírá žádná osobní data, ale umožňuje nám efektivně spravovat analytické a marketingové nástroje.
                  </p>
                </div>
              </div>
            </Card>

            {/* Marketingové cookies */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Target className="h-6 w-6 text-purple-500" />
                Marketingové cookies
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Marketingové cookies se používají ke sledování návštěvníků napříč webovými stránkami. Jejich účelem je zobrazovat reklamy, které jsou relevantní a zajímavé pro jednotlivé uživatele, a tím hodnotnější pro vydavatele a inzerenty třetích stran.
                </p>

                {/* Meta (Facebook) Pixel */}
                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Meta (Facebook) Pixel
                  </h4>
                  <p className="text-sm mb-2">
                    Meta Pixel nám umožňuje měřit efektivitu reklam na Facebooku a Instagramu. Pomocí tohoto nástroje můžeme:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Zobrazovat relevantní reklamy na Facebooku a Instagramu</li>
                    <li>Měřit konverze z reklamních kampaní</li>
                    <li>Vytvářet vlastní publika pro cílení reklam</li>
                    <li>Optimalizovat reklamní kampaně</li>
                  </ul>
                </div>

                {/* Google Ads */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                    </svg>
                    Google Ads
                  </h4>
                  <p className="text-sm mb-2">
                    Google Ads cookies nám pomáhají zobrazovat relevantní reklamy ve vyhledávání Google a na partnerských webech. Používáme je pro:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Remarketing - zobrazování reklam lidem, kteří již navštívili náš web</li>
                    <li>Měření konverzí z reklamních kampaní</li>
                    <li>Optimalizaci reklamních kampaní</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Správa cookies */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                Jak spravovat cookies?
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Máte plnou kontrolu nad tím, které cookies povolíte. Cookies můžete spravovat nebo mazat podle svých preferencí v nastavení vašeho prohlížeče.
                </p>
                <div className="bg-white/5 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-foreground mb-3">Nastavení v prohlížečích:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href="https://support.google.com/chrome/answer/95647"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Google Chrome
                    </a>
                    <a
                      href="https://support.mozilla.org/cs/kb/povoleni-zakazani-cookies"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Mozilla Firefox
                    </a>
                    <a
                      href="https://support.apple.com/cs-cz/guide/safari/sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Safari
                    </a>
                    <a
                      href="https://support.microsoft.com/cs-cz/windows/odstran%C4%9Bn%C3%AD-a-spr%C3%A1va-soubor%C5%AF-cookie-168dab11-0753-043d-7c16-ede5947fc64d"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Microsoft Edge
                    </a>
                  </div>
                </div>
                <p className="text-sm">
                  Více informací o cookies a jejich správě najdete na stránkách{" "}
                  <a
                    href="https://www.aboutcookies.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold hover:underline"
                  >
                    aboutcookies.org
                  </a>
                </p>
                <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg p-4 mt-4">
                  <p className="text-sm text-foreground">
                    <strong>Upozornění:</strong> Pokud zakážete některé cookies, může dojít k omezení funkčnosti webových stránek. Některé části webu nemusí fungovat správně.
                  </p>
                </div>
              </div>
            </Card>

            {/* Kontakt */}
            <Card className="glass p-6 md:p-8 border-white/20 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Kontakt</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Pokud máte jakékoliv dotazy ohledně používání cookies na našich stránkách, neváhejte nás kontaktovat:
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
                </div>
              </div>
            </Card>

            {/* Datum aktualizace */}
            <div className="text-center text-sm text-muted-foreground pt-4">
              <p>Tyto zásady byly naposledy aktualizovány dne <strong>23. prosince 2025</strong></p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Cookies;
