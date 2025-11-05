import { Share2 } from "lucide-react";
import { useEffect } from "react";

const FacebookFeed = () => {
  const FACEBOOK_PAGE_URL = "https://www.facebook.com/SKI.CENTRUM.KOHUTKA";

  useEffect(() => {
    // Load Elfsight script
    const script = document.createElement('script');
    script.src = 'https://elfsightcdn.com/platform.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <section className="pt-8 pb-20 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#1c3a5c]">
            NOVINKY Z KOHÚTKY
          </h2>
        </div>

        {/* Elfsight Facebook Feed Widget */}
        <div className="mb-8">
          <div
            className="elfsight-app-015f8fdb-935f-4f87-b961-ffe533eefcc8"
            data-elfsight-app-lazy
          />
        </div>

        {/* Alternative: Direct Facebook link */}
        <div className="text-center">
          <a
            href={FACEBOOK_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#1877F2] hover:bg-[#1665D8] text-white rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            <Share2 className="w-6 h-6" />
            <span>Zobrazit všechny příspěvky na Facebooku</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FacebookFeed;
