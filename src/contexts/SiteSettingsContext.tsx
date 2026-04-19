import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  background_color: string;
  accent_color: string;
  footer_text: string;
  contact_email: string;
  support_phone: string;
  social_facebook: string;
  social_twitter: string;
  social_instagram: string;
  og_image_url: string;
  custom_css: string;
}

const defaults: SiteSettings = {
  site_name: "Hajj Wallet",
  site_tagline: "Your Sacred Journey Starts Here",
  site_description: "Save for Hajj, book packages, shop community merch, and connect with fellow pilgrims — all in one app.",
  logo_url: "",
  favicon_url: "",
  primary_color: "142 79% 44%",
  background_color: "0 0% 100%",
  accent_color: "142 79% 44%",
  footer_text: "© 2025 Hajj Wallet. All rights reserved.",
  contact_email: "",
  support_phone: "001-800-HAJJ-HELP",
  social_facebook: "",
  social_twitter: "",
  social_instagram: "",
  og_image_url: "",
  custom_css: "",
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refetch: () => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaults,
  loading: true,
  refetch: () => {},
});

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("key, value") as any;
    if (data) {
      const map: Record<string, string> = {};
      (data as { key: string; value: string }[]).forEach((r) => (map[r.key] = r.value));
      setSettings((prev) => ({ ...prev, ...map }) as SiteSettings);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply dynamic CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (settings.primary_color) {
      root.style.setProperty("--primary", settings.primary_color);
      root.style.setProperty("--accent", settings.accent_color || settings.primary_color);
      root.style.setProperty("--ring", settings.primary_color);
    }
    if (settings.background_color) {
      root.style.setProperty("--background", settings.background_color);
    }
  }, [settings.primary_color, settings.background_color, settings.accent_color]);

  // Apply favicon
  useEffect(() => {
    if (settings.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings.favicon_url]);

  // Apply site title
  useEffect(() => {
    if (settings.site_name && settings.site_tagline) {
      const currentTitle = document.title;
      // Only update if it's the default title (not overridden by a page like ProductDetail)
      if (currentTitle.includes("Hajj Wallet") || currentTitle === "") {
        document.title = `${settings.site_name} — ${settings.site_tagline}`;
      }
    }
  }, [settings.site_name, settings.site_tagline]);

  // Apply OG meta
  useEffect(() => {
    const setMeta = (attr: string, key: string, content: string) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", settings.site_description);
    setMeta("property", "og:title", settings.site_name);
    setMeta("property", "og:description", settings.site_description);
    if (settings.og_image_url) setMeta("property", "og:image", settings.og_image_url);
  }, [settings.site_name, settings.site_description, settings.og_image_url]);

  // Apply custom CSS
  useEffect(() => {
    let style = document.getElementById("site-custom-css");
    if (settings.custom_css) {
      if (!style) { style = document.createElement("style"); style.id = "site-custom-css"; document.head.appendChild(style); }
      style.textContent = settings.custom_css;
    } else if (style) {
      style.remove();
    }
  }, [settings.custom_css]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);
