export const status = {
  1: '未上映',
  2: '上映中',
  3: '上映終了'
}

const API_URL = {
  development: 'http://localhost:8080/api',
  production: '',
  test: '',
}

export const BASE_URL = API_URL[process.env.NODE_ENV]