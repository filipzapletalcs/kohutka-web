import { Card } from "@/components/ui/card";
import aboutImage from "@/assets/lanovka-zima_1000x750.jpg";

const AboutUs = () => {
  return (
    <section className="pt-8 pb-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            O nás
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Poznejte SKI CENTRUM KOHÚTKA
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-8 items-stretch">
          {/* Text Content - LEFT */}
          <Card className="glass py-8 px-6 md:p-10 border-white/20 rounded-lg h-full flex flex-col">
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Vítejte v SKI CENTRUM KOHÚTKA – místě, kde si zima podává ruku s pohodou a zážitky!
                Naše horské středisko se nachází v srdci Valašska na pomezí České republiky a Slovenska.
                Nabízíme skvělé podmínky pro lyžování, snowboarding i rodinné radovánky na sněhu.
              </p>
              <p>
                Čekají na vás upravené sjezdovky různých obtížností, moderní vleky a lanovky,
                stejně jako zázemí pro odpočinek i občerstvení. Ať už jste začátečník nebo zkušený lyžař,
                u nás si přijdete na své.
              </p>
              <p>
                Naším cílem je poskytnout vám nezapomenutelný zážitek, a proto klademe důraz na kvalitu služeb,
                bezpečnost i pohodlí. Přijeďte zažít zimní radost do SKI CENTRUM KOHÚTKA – vaše dokonalá
                destinace pro zimní dovolenou!
              </p>
              <div className="pt-4 border-t border-white/10">
                <p className="font-semibold text-foreground">Tým SKI CENTRUM KOHÚTKA</p>
                <p className="text-sm italic">Těšíme se na vás.</p>
              </div>
            </div>
          </Card>

          {/* Image - RIGHT */}
          <div className="order-first lg:order-last h-full">
            <Card className="glass overflow-hidden border-white/20 rounded-lg h-full">
              <img
                src={aboutImage}
                alt="Lanovka v zimě - SKI CENTRUM KOHÚTKA"
                className="w-full h-full object-cover object-center"
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
