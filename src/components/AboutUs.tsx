import { Card } from "@/components/ui/card";
import aboutImage from "@/assets/lanovka-zima_1000x750.jpg";

const AboutUs = () => {
  return (
    <section className="pt-8 pb-20 px-0 md:px-4">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center px-4">
          O nás
        </h2>

        <div className="grid lg:grid-cols-2 gap-0 md:gap-8 items-center">
          {/* Text Content - LEFT */}
          <Card className="glass py-8 px-6 md:p-10 border-white/20 rounded-none md:rounded-lg">
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Vítejte v Ski Centru Kohútka – místě, kde si zima podává ruku s pohodou a zážitky!
                Naše horské středisko se nachází v srdci Beskyd na pomezí České republiky a Slovenska.
                Nabízíme skvělé podmínky pro lyžování, snowboarding i rodinné radovánky na sněhu.
              </p>
              <p>
                Čekají na vás upravené sjezdovky různých obtížností, moderní vleky a lanovky,
                stejně jako zázemí pro odpočinek i občerstvení. Ať už jste začátečník nebo zkušený lyžař,
                u nás si přijdete na své.
              </p>
              <p>
                Naším cílem je poskytnout vám nezapomenutelný zážitek, a proto klademe důraz na kvalitu služeb,
                bezpečnost i pohodlí. Přijeďte zažít zimní radost do Ski Centra Kohútka – vaše dokonalá
                destinace pro zimní dovolenou!
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="font-semibold text-foreground">Tým Skicentra Kohútka</p>
                <p className="text-sm italic">Těšíme se na vás.</p>
              </div>
            </div>
          </Card>

          {/* Image - RIGHT */}
          <div className="order-first lg:order-last">
            <Card className="glass overflow-hidden border-white/20 rounded-none md:rounded-lg">
              <img
                src={aboutImage}
                alt="Lanovka v zimě - Ski Centrum Kohútka"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
