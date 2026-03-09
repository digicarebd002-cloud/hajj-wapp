import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: Record<string, any>;
  noindex?: boolean;
}

const SITE_NAME = "Hajj Wallet";
const BASE_URL = "https://hajj-wapp.lovable.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/pwa-512x512.png`;

/**
 * SEO component that dynamically sets document head meta tags and JSON-LD.
 * Use one per page at the top level of the page component.
 */
const SEOHead = ({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage,
  jsonLd,
  noindex = false,
}: SEOHeadProps) => {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical || (typeof window !== "undefined" ? window.location.href.split("?")[0] : BASE_URL);
  const image = ogImage || DEFAULT_OG_IMAGE;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Helper to set/create meta tags
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Standard meta
    setMeta("name", "description", description);
    if (noindex) setMeta("name", "robots", "noindex, nofollow");
    else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.remove();
    }

    // Open Graph
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:image", image);
    setMeta("property", "og:site_name", SITE_NAME);

    // Twitter
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
    setMeta("name", "twitter:card", "summary_large_image");

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl);

    // JSON-LD
    const ldId = "seo-jsonld";
    let script = document.getElementById(ldId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!script) {
        script = document.createElement("script");
        script.id = ldId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }

    return () => {
      // Cleanup JSON-LD on unmount
      const s = document.getElementById(ldId);
      if (s) s.remove();
    };
  }, [fullTitle, description, canonicalUrl, ogType, image, jsonLd, noindex]);

  return null;
};

export default SEOHead;
export { BASE_URL, SITE_NAME };
