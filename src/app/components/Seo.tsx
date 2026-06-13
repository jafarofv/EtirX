import { useEffect } from "react";
import { useI18n } from "../i18n";

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  lang?: "az" | "en" | "ru";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
};

function upsertMeta(name: string, content: string, by: "name" | "property" = "name") {
  const selector = `meta[${by}="${name}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(by, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function Seo({
  title,
  description,
  path = "/",
  image = "/favicon.png",
  lang,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const { language } = useI18n();
  // Default to the active UI language so og:locale, the document language and
  // alternates track az/en/ru switches. An explicit `lang` prop still wins.
  const activeLang = lang ?? language;
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalPath = path.startsWith("/") ? path : `/${path}`;
    const canonicalUrl = `${origin}${canonicalPath}`;
    const imageUrl = image.startsWith("http") ? image : `${origin}${image}`;

    document.title = title;
    document.documentElement.lang = activeLang;

    upsertMeta("description", description);
    upsertMeta("robots", noindex ? "noindex, nofollow" : "index, follow");

    upsertMeta("og:type", "website", "property");
    upsertMeta("og:title", title, "property");
    upsertMeta("og:description", description, "property");
    upsertMeta("og:url", canonicalUrl, "property");
    upsertMeta("og:image", imageUrl, "property");
    upsertMeta(
      "og:locale",
      activeLang === "az" ? "az_AZ" : activeLang === "ru" ? "ru_RU" : "en_US",
      "property"
    );

    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", description);
    upsertMeta("twitter:image", imageUrl);

    upsertLink("canonical", canonicalUrl);
    upsertLink("alternate", `${origin}${canonicalPath}`, "az-AZ");
    upsertLink("alternate", `${origin}${canonicalPath}`, "en-US");
    upsertLink("alternate", `${origin}${canonicalPath}`, "ru-RU");
    upsertLink("alternate", `${origin}${canonicalPath}`, "x-default");

    const oldScripts = document.querySelectorAll('script[data-seo-jsonld="1"]');
    oldScripts.forEach((node) => node.parentNode?.removeChild(node));
    if (jsonLd) {
      const list = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      list.forEach((item) => {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "1");
        script.text = JSON.stringify(item);
        document.head.appendChild(script);
      });
    }
  }, [title, description, path, image, activeLang, noindex, jsonLd]);

  return null;
}
