import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Extend Window interface for dataLayer
declare global {
  interface Window {
    dataLayer: unknown[];
  }
}

// Cookie consent types for Consent Mode V2
interface ConsentSettings {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

const CONSENT_COOKIE_NAME = "cookie_consent";
const CONSENT_VERSION = "1";

// Helper function to get gtag
const gtag = (...args: unknown[]) => {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push(args);
  }
};

// Update Google Consent Mode
const updateGoogleConsent = (settings: ConsentSettings) => {
  gtag("consent", "update", {
    ad_storage: settings.marketing ? "granted" : "denied",
    ad_user_data: settings.marketing ? "granted" : "denied",
    ad_personalization: settings.marketing ? "granted" : "denied",
    analytics_storage: settings.analytics ? "granted" : "denied",
    personalization_storage: settings.personalization ? "granted" : "denied",
  });
};

// Save consent to cookie
const saveConsent = (settings: ConsentSettings) => {
  const consentData = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    settings,
  };
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(consentData)
  )}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
};

// Load consent from cookie
const loadConsent = (): ConsentSettings | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const consentCookie = cookies.find((c) =>
    c.trim().startsWith(`${CONSENT_COOKIE_NAME}=`)
  );

  if (!consentCookie) return null;

  try {
    const value = decodeURIComponent(consentCookie.split("=")[1]);
    const data = JSON.parse(value);
    if (data.version !== CONSENT_VERSION) return null;
    return data.settings;
  } catch {
    return null;
  }
};

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<ConsentSettings>({
    analytics: false,
    marketing: false,
    personalization: false,
  });

  useEffect(() => {
    const savedConsent = loadConsent();
    if (savedConsent) {
      setSettings(savedConsent);
      updateGoogleConsent(savedConsent);
    } else {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const newSettings: ConsentSettings = {
      analytics: true,
      marketing: true,
      personalization: true,
    };
    setSettings(newSettings);
    saveConsent(newSettings);
    updateGoogleConsent(newSettings);
    setIsVisible(false);
  };

  const rejectAll = () => {
    const newSettings: ConsentSettings = {
      analytics: false,
      marketing: false,
      personalization: false,
    };
    setSettings(newSettings);
    saveConsent(newSettings);
    updateGoogleConsent(newSettings);
    setIsVisible(false);
  };

  const saveSettings = () => {
    saveConsent(settings);
    updateGoogleConsent(settings);
    setIsVisible(false);
    setShowDetails(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
      <div className="bg-white rounded-xl shadow-2xl p-5 border border-gray-200">
        {!showDetails ? (
          <>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Nastavení cookies</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Používáme soubory cookies, abychom zlepšili vaše uživatelské prostředí, analyzovali návštěvnost webu a přizpůsobili zobrazovaný obsah. Přečtěte si naše{" "}
              <Link to="/cookies" className="text-primary font-medium hover:underline">
                zásady používání souborů cookie
              </Link>
              .
            </p>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={rejectAll}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Odmítnout vše
              </button>
              <button
                onClick={() => setShowDetails(true)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Vlastní
              </button>
              <button
                onClick={acceptAll}
                className="bg-primary hover:bg-primary/90 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Přijmout vše
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Vlastní nastavení</h3>
            <div className="space-y-3 mb-4">
              {/* Necessary */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Nezbytné</span>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              {/* Analytics */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Analytické</span>
                <button
                  onClick={() => setSettings((s) => ({ ...s, analytics: !s.analytics }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    settings.analytics ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                    settings.analytics ? "right-0.5" : "left-0.5"
                  }`} />
                </button>
              </div>
              {/* Marketing */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Marketingové</span>
                <button
                  onClick={() => setSettings((s) => ({ ...s, marketing: !s.marketing }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    settings.marketing ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                    settings.marketing ? "right-0.5" : "left-0.5"
                  }`} />
                </button>
              </div>
              {/* Personalization */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Personalizační</span>
                <button
                  onClick={() => setSettings((s) => ({ ...s, personalization: !s.personalization }))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    settings.personalization ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                    settings.personalization ? "right-0.5" : "left-0.5"
                  }`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowDetails(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Zpět
              </button>
              <button
                onClick={saveSettings}
                className="bg-primary hover:bg-primary/90 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Uložit nastavení
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
