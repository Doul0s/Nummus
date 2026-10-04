import { getLocales } from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

export type Language = keyof typeof resources;

export const fallbackLanguage: Language = "en";

export const supportedLanguages = Object.keys(resources) as Language[];

export function detectLanguage(): Language {
  const deviceLanguage = getLocales()[0]?.languageCode;
  return supportedLanguages.includes(deviceLanguage as Language)
    ? (deviceLanguage as Language)
    : fallbackLanguage;
}

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: fallbackLanguage,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;