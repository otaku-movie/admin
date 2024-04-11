import { BASE_URL } from './../config/index'
import axios, { AxiosError, AxiosRequestHeaders, AxiosResponse } from 'axios'
import { message } from 'antd'

import { toCamelCase } from '../utils'
import { response } from '@/type/api'

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 3600 * 1000,
  // withCredentials: true
})

const httpStatus = {
  403: '没有权限',
  404: '地址不存在',
  405: '请求方式异常',
  500: '服务器异常',
  503: '服务器挂掉了',
  504: '服务器找不到了'
}

// 添加请求拦截器
http.interceptors.request.use(config => {
  // 在发送请求之前做些什么
  const token = localStorage.getItem('token')
  
  if (token) {
    config.headers = {
      ...config.headers,
      token
    } as unknown as AxiosRequestHeaders
  }

  return config
}, (err: AxiosError<response>) => {
  console.log(err)
  // 对请求错误做些什么
  Promise.reject(err)
})

http.interceptors.response.use((res: AxiosResponse<response>) => {
  // 对响应数据做点什么
  if ((res.status === 200 || res.status === 201) && res.data.code === 200) {
    return toCamelCase(res.data)
  } else {
    message.warning(res.data.message)
    return Promise.reject(res.data)
  }
}, (err: AxiosError<AxiosResponse<response>>) => {
  console.log(err)
  if (err.response) {
    if (err.response.status === 401) {
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')
      location.href = '/login'

    } else {
      const status = err.response.status as keyof typeof httpStatus
      if (httpStatus[status]) {
        message.warning(httpStatus[status] as string)
      } else {
        const msg = err.response.data.data.message
        message.warning(Array.isArray(msg) ? msg.join('、') : msg)
      }
    }
    return Promise.reject(err.response)
  } else {
    console.log('-------')
    return Promise.reject(err.response)
  }
})

export default http
