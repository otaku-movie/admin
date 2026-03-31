export function showTotal(total: number, range: number[]) {
  const [start, end] = range

  const rawLang =
    typeof window !== 'undefined'
      ? localStorage.getItem('language') || navigator.language
      : 'ja'
  const lang = (rawLang || 'ja').toLowerCase()

  if (lang.startsWith('en')) {
    return `Total ${total}, ${start} - ${end}`
  }
  if (lang.startsWith('ja')) {
    return `合計 ${total} 件、現在 ${start} ～ ${end} 件`
  }
  return `合计 ${total} 件，现在 ${start} ～ ${end} 件`
}
