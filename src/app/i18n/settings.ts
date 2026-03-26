import { languages } from '@/config'

/** 缺失翻译时的回退语言 */
export const fallbackLng = 'ja'
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