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
    <section className="py-20 overflow-hidden bg-muted/20">
      <div className="container mx-auto px-4 max-w-7xl mb-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Naši partneři a sponzoři
          </h2>
          <p className="text-lg text-muted-foreground">
            Děkujeme všem, kteří s námi spolupracují a podporují nás
          </p>
        </div>
      </div>

      {/* Infinite Scroll Carousel - Row 1 (Left to Right) */}
      <div className="relative mb-6 overflow-hidden">
        <div className="flex animate-scroll-left md:animate-scroll-left-slow">
          {/* Duplicate array 3 times for seamless loop */}
          {[...rowOne, ...rowOne, ...rowOne].map((partner, index) => (
            <div
              key={`row1-${partner.id}-${index}`}
              className="flex-shrink-0 mx-2 md:mx-3"
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
        <div className="flex animate-scroll-right md:animate-scroll-right-slow">
          {/* Duplicate array 3 times for seamless loop */}
          {[...rowTwo, ...rowTwo, ...rowTwo].map((partner, index) => (
            <div
              key={`row2-${partner.id}-${index}`}
              className="flex-shrink-0 mx-2 md:mx-3"
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

      {/* Call to Action */}
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="glass rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Chcete se stát naším partnerem?</h3>
          <p className="text-muted-foreground mb-6">
            Spojte se s námi a podpořte rozvoj lyžařského střediska Kohútka
          </p>
          <a
            href="mailto:info@kohutka.cz"
            className="inline-block bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 rounded-lg font-semibold transition-colors duration-300"
          >
            Kontaktujte nás
          </a>
        </div>
      </div>
    </section>
  );
};

export default Partners;
