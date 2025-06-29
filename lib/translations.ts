// Cache for translations
const translationCache = new Map<string, any>();

export type Locale = "en" | "ps";

export async function getTranslations(locale: string): Promise<any> {
  // Check cache first
  if (translationCache.has(locale)) {
    return translationCache.get(locale);
  }

  try {
    // Dynamic import for better performance
    const translations = await import(
      `../public/locales/${locale}/common.json`
    );
    translationCache.set(locale, translations.default);
    return translations.default;
  } catch (error) {
    // Fallback to English
    if (locale !== "en") {
      return getTranslations("en");
    }
    return {};
  }
}

export function t(locale: string, key: string): string {
  // For server-side rendering, we'll use a simpler approach
  // This will be replaced by the async version in client components
  return key;
}

// Preload translations for better performance
export function preloadTranslations(locales: Locale[]) {
  locales.forEach((locale) => {
    if (!translationCache.has(locale)) {
      getTranslations(locale);
    }
  });
}
