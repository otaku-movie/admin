import { route } from './route'

export function processPath (name: string, query?: Record<string, any>) {
  const find = route.find(item => item.name === name)
  const bashPath = `/${navigator.language}/${find?.path}`
  
  if (query) {
    const queryStr = Object.keys(query).map((item) => {
      return `${item}=${query[item]}`
    }).join('&')

    return `${bashPath}?${queryStr}`
  } else {
    return bashPath 
  }  
}