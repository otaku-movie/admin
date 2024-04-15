import { languages, defaultLanguage } from "@/config"

export const fallbackLng = defaultLanguage
export const defaultNS = 'translation'
export const cookieName = 'i18next'
export {
  languages
}

export function getOptions (lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: Object.keys(languages),
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  }
}