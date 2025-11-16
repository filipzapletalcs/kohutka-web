// Import partner logos
import partner1 from "@/assets/Sponzoři/02.webp";
import partner2 from "@/assets/Sponzoři/320x72_mikona_02.webp";
import partner3 from "@/assets/Sponzoři/320x72_subaru.webp";
import partner4 from "@/assets/Sponzoři/Partner-zlinsky_kraj_310x72_pix.jpg";
import partner5 from "@/assets/Sponzoři/Partner_Infocentrum-310x72-1.jpg";
import partner6 from "@/assets/Sponzoři/Partner_go-ski_board_school.jpg";
import partner7 from "@/assets/Sponzoři/Partner_rop_eu.jpg";
import partner8 from "@/assets/Sponzoři/banner_-_skipass_310x72_pix_0.webp";
import partner9 from "@/assets/Sponzoři/banner_-_zlinsky_kraj_310x72_pix_1.webp";
import partner10 from "@/assets/Sponzoři/banner_1.webp";
import partner11 from "@/assets/Sponzoři/bc_3.webp";
import partner12 from "@/assets/Sponzoři/ceska_lyzarska_strediska_-_banner_-_04.webp";
import partner13 from "@/assets/Sponzoři/mikona_banner.webp";
import partner14 from "@/assets/Sponzoři/mmr_logo_zelena.webp";
import partner15 from "@/assets/Sponzoři/raveo_-_banner_02.webp";
import partner16 from "@/assets/Sponzoři/skiregion_valassko_02.webp";

interface Partner {
  id: string;
  name: string;
  logo: string;
}

const allPartners: Partner[] = [
  { id: "1", name: "Partner 1", logo: partner1 },
  { id: "2", name: "Mikona", logo: partner2 },
  { id: "3", name: "Subaru", logo: partner3 },
  { id: "4", name: "Zlínský kraj", logo: partner4 },
  { id: "5", name: "Infocentrum", logo: partner5 },
  { id: "6", name: "Go Ski & Board School", logo: partner6 },
  { id: "7", name: "ROP EU", logo: partner7 },
  { id: "8", name: "Skipass", logo: partner8 },
  { id: "9", name: "Zlínský kraj", logo: partner9 },
  { id: "10", name: "Partner", logo: partner10 },
  { id: "11", name: "BC Partner", logo: partner11 },
  { id: "12", name: "Česká lyžařská střediska", logo: partner12 },
  { id: "13", name: "Mikona", logo: partner13 },
  { id: "14", name: "MMR", logo: partner14 },
  { id: "15", name: "Raveo", logo: partner15 },
  { id: "16", name: "Skiregion Valašsko", logo: partner16 },
];

// Split partners into two rows
const rowOne = allPartners.slice(0, 8);
const rowTwo = allPartners.slice(8, 16);

const Partners = () => {
  return (
    <section className="pb-20 overflow-hidden bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4 mb-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Naši partneři a sponzoři
          </h2>
          <p className="text-lg text-muted-foreground">
            Děkujeme všem, kteří s námi spolupracují a podporují nás
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Infinite Scroll Carousel - Row 1 (Left to Right) */}
        <div className="relative mb-6 overflow-hidden">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-0 w-80 md:w-[35rem] z-10 pointer-events-none"
               style={{background: 'linear-gradient(to right, hsl(var(--muted) / 0.2), hsl(var(--muted) / 0.15), hsl(var(--muted) / 0.1), hsl(var(--muted) / 0.05), transparent)'}} />

          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-80 md:w-[35rem] z-10 pointer-events-none"
               style={{background: 'linear-gradient(to left, hsl(var(--muted) / 0.2), hsl(var(--muted) / 0.15), hsl(var(--muted) / 0.1), hsl(var(--muted) / 0.05), transparent)'}} />

          <div className="flex animate-scroll-left">
            {/* Duplicate array 3 times for seamless loop */}
            {[...rowOne, ...rowOne, ...rowOne].map((partner, index) => (
              <div
                key={`row1-${partner.id}-${index}`}
                className="flex-shrink-0 mx-3 md:mx-4"
              >
                <div className="glass rounded-lg p-2 md:p-4 w-40 h-20 md:w-64 md:h-32 flex items-center justify-center border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infinite Scroll Carousel - Row 2 (Right to Left) */}
        <div className="relative mb-12 overflow-hidden">
          {/* Left gradient fade */}
          <div className="absolute left-0 top-0 bottom-0 w-80 md:w-[35rem] z-10 pointer-events-none"
               style={{background: 'linear-gradient(to right, hsl(var(--muted) / 0.2), hsl(var(--muted) / 0.15), hsl(var(--muted) / 0.1), hsl(var(--muted) / 0.05), transparent)'}} />

          {/* Right gradient fade */}
          <div className="absolute right-0 top-0 bottom-0 w-80 md:w-[35rem] z-10 pointer-events-none"
               style={{background: 'linear-gradient(to left, hsl(var(--muted) / 0.2), hsl(var(--muted) / 0.15), hsl(var(--muted) / 0.1), hsl(var(--muted) / 0.05), transparent)'}} />

          <div className="flex animate-scroll-right">
            {/* Duplicate array 3 times for seamless loop */}
            {[...rowTwo, ...rowTwo, ...rowTwo].map((partner, index) => (
              <div
                key={`row2-${partner.id}-${index}`}
                className="flex-shrink-0 mx-3 md:mx-4"
              >
                <div className="glass rounded-lg p-2 md:p-4 w-40 h-20 md:w-64 md:h-32 flex items-center justify-center border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
