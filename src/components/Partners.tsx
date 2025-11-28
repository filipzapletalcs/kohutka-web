import { useEffect, useRef } from "react";
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
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);
  const animationRef1 = useRef<number>();
  const animationRef2 = useRef<number>();

  useEffect(() => {
    const scrollContainer1 = scrollRef1.current;
    const scrollContainer2 = scrollRef2.current;

    if (!scrollContainer1 || !scrollContainer2) return;

    let scrollPos1 = 0;
    let scrollPos2 = 0;
    const speed = 0.8; // pixels per frame
    let wrapWidth1 = 0;
    let wrapWidth2 = 0;

    // Calculate the width of one set (half of total, since we have 2x duplication)
    const calculateWrapWidth = (container: HTMLDivElement) => {
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length === 0) return 0;

      // Total width of all children including gaps
      let totalWidth = 0;
      children.forEach((child, index) => {
        totalWidth += child.offsetWidth;
        // Add gap width (12px on mobile, 16px on desktop - using computed style)
        if (index < children.length - 1) {
          const gap = window.innerWidth >= 768 ? 16 : 12;
          totalWidth += gap;
        }
      });

      // Since we have 2x duplication, one set is half the total
      return totalWidth / 2;
    };

    // Initial calculation
    wrapWidth1 = calculateWrapWidth(scrollContainer1);
    wrapWidth2 = calculateWrapWidth(scrollContainer2);

    const animate1 = () => {
      if (!scrollContainer1 || wrapWidth1 === 0) return;

      scrollPos1 += speed;

      // Seamless wrapping using modulo - no hard reset!
      if (scrollPos1 >= wrapWidth1) {
        scrollPos1 = scrollPos1 % wrapWidth1;
      }

      scrollContainer1.style.transform = `translateX(-${scrollPos1}px)`;
      animationRef1.current = requestAnimationFrame(animate1);
    };

    const animate2 = () => {
      if (!scrollContainer2 || wrapWidth2 === 0) return;

      scrollPos2 += speed; // Same direction increment

      // Seamless wrapping for right-to-left scroll
      if (scrollPos2 >= wrapWidth2) {
        scrollPos2 = scrollPos2 % wrapWidth2;
      }

      // Render in opposite direction by starting from the right
      scrollContainer2.style.transform = `translateX(-${wrapWidth2 - scrollPos2}px)`;
      animationRef2.current = requestAnimationFrame(animate2);
    };

    // Recalculate on resize
    const handleResize = () => {
      wrapWidth1 = calculateWrapWidth(scrollContainer1);
      wrapWidth2 = calculateWrapWidth(scrollContainer2);
    };

    window.addEventListener('resize', handleResize);

    animationRef1.current = requestAnimationFrame(animate1);
    animationRef2.current = requestAnimationFrame(animate2);

    return () => {
      if (animationRef1.current) cancelAnimationFrame(animationRef1.current);
      if (animationRef2.current) cancelAnimationFrame(animationRef2.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="pb-20 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Naši partneři a sponzoři
          </h2>
          <p className="text-lg text-muted-foreground font-medium">
            Děkujeme všem, kteří s námi spolupracují a podporují nás
          </p>
        </div>

        <div className="relative -mx-4 md:mx-0 overflow-hidden">
          {/* Infinite Scroll Carousel - Row 1 (Left to Right) */}
          <div className="relative mb-6 py-4">
            {/* Gradienty - skryté na mobile, viditelné na desktop */}
            <div
              className="hidden md:block pointer-events-none absolute inset-y-0 left-0 w-48 lg:w-64 z-20"
              style={{
                background:
                  "linear-gradient(to right, hsl(210 45% 97%), transparent)",
              }}
            />
            <div
              className="hidden md:block pointer-events-none absolute inset-y-0 right-0 w-48 lg:w-64 z-20"
              style={{
                background:
                  "linear-gradient(to left, hsl(210 45% 97%), transparent)",
              }}
            />

            <div ref={scrollRef1} className="flex gap-3 md:gap-4" style={{ willChange: "transform" }}>
              {/* Duplicate array 2 times for seamless JS-based infinite scroll */}
              {[...rowOne, ...rowOne].map((partner, index) => (
                <div
                  key={`row1-${partner.id}-${index}`}
                  className="flex-shrink-0"
                >
                  <div className="glass rounded-xl p-3 md:p-5 w-40 h-20 md:w-64 md:h-32 flex items-center justify-center border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
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
          <div className="relative py-4">
            {/* Gradienty - skryté na mobile, viditelné na desktop */}
            <div
              className="hidden md:block pointer-events-none absolute inset-y-0 left-0 w-48 lg:w-64 z-20"
              style={{
                background:
                  "linear-gradient(to right, hsl(210 45% 97%), transparent)",
              }}
            />
            <div
              className="hidden md:block pointer-events-none absolute inset-y-0 right-0 w-48 lg:w-64 z-20"
              style={{
                background:
                  "linear-gradient(to left, hsl(210 45% 97%), transparent)",
              }}
            />

            <div ref={scrollRef2} className="flex gap-3 md:gap-4" style={{ willChange: "transform" }}>
              {/* Duplicate array 2 times for seamless JS-based infinite scroll */}
              {[...rowTwo, ...rowTwo].map((partner, index) => (
                <div
                  key={`row2-${partner.id}-${index}`}
                  className="flex-shrink-0"
                >
                  <div className="glass rounded-xl p-3 md:p-5 w-40 h-20 md:w-64 md:h-32 flex items-center justify-center border border-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 cursor-pointer group">
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
      </div>
    </section>
  );
};

export default Partners;
