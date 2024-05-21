import { route } from './route'

export interface Options {
  name: string
  query: Record<string, any>
}


export function processPath (options: string | Options, query?: Record<string, any>) {
  const process = (name: string, query?: Record<string, any>) => {
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
  
  if (typeof options === 'string') {
    return process(options, query)
  } else {
    return process(options.name, options.query)
  }
}