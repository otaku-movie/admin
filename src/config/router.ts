import { permission } from './../dialog/rolePermission'
export interface Options {
  name: string
  query: Record<string, any>
}


export function processPath (options: string | Options, query?: Record<string, any>) {
  const menu = localStorage.getItem('route')

  let route: permission[] = []

  if (menu) {
    route = JSON.parse(menu)
  }

  const process = (name: string, query?: Record<string, any>) => {
    // debugger
    const find = route.find(item => item.pathName === name)
    const bashPath = `/${navigator.language}${find?.path}`
    
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