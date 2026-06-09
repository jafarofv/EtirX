import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getSiteSettings, type ApiSiteSettings } from "./lib/api";
import { WHATSAPP_NUMBER } from "./lib/config";

// Used until the API responds, or if it is unreachable. Mirrors the values that
// were previously hardcoded across the storefront, so the page looks identical
// before the admin-managed copy loads.
const FALLBACK_SETTINGS: ApiSiteSettings = {
  whatsapp_number: WHATSAPP_NUMBER,
  instagram_url: "https://instagram.com/etirx.az",
  instagram_handle: "@etirx.az",
  tiktok_url: "https://www.tiktok.com/@etirx.az",
  tiktok_handle: "@etirx.az",
  store_address: "Fəxrəddin Musayev küçəsi, Adore Plaza",
  banner_text: "",
  gram_image_url: "",
};

type SiteSettingsContextValue = ApiSiteSettings & { whatsappUrl: string };

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

function withDerived(settings: ApiSiteSettings): SiteSettingsContextValue {
  const digits = (settings.whatsapp_number || "").replace(/\D/g, "");
  return { ...settings, whatsappUrl: `https://wa.me/${digits || WHATSAPP_NUMBER}` };
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ApiSiteSettings>(FALLBACK_SETTINGS);

  useEffect(() => {
    let active = true;
    getSiteSettings()
      .then((data) => {
        if (active && data) setSettings(data);
      })
      .catch(() => {
        // keep FALLBACK_SETTINGS on failure
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => withDerived(settings), [settings]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    throw new Error("useSiteSettings must be used within SiteSettingsProvider");
  }
  return ctx;
}
