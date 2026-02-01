import axios, { AxiosError, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

import { toCamelCase } from '../utils'
import { ApiResponse } from '@/type/api'

/** 请求配置，与 Axios 一致，便于传 url / method / data / params */
export type HttpRequestConfig = AxiosRequestConfig

/** 封装后的 http 实例：拦截器返回接口体，.then(res) 的 res 为 ApiResponse<T>，T 为接口 data 类型 */
export interface HttpInstance {
  <T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>>
  request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>>
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  head<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  options<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
}

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 在发送请求之前做些什么
  const token = localStorage.getItem('token')
  const language = localStorage.getItem('language') ?? 'ja'
  const roleId = localStorage.getItem('roleId')

  config.headers = {
    'Accept-Language': language
  } as unknown as AxiosRequestHeaders

  if (token) {
    config.headers = {
      ...config.headers,
      token,
      'role-id': roleId
    } as unknown as AxiosRequestHeaders
  }

  return config
}, (err: AxiosError) => {
  console.log(err)
  // 对请求错误做些什么
  return Promise.reject(err)
})

// 响应拦截器返回接口体 ApiResponse，与 axios 默认 AxiosResponse 类型不一致，用类型断言
http.interceptors.response.use(
  ((res: AxiosResponse) => {
    if (res.headers['content-disposition']) {
      return res.data
    }
    if ((res.status === 200 || res.status === 201) && res.data.code === 200) {
      return toCamelCase(res.data) as ApiResponse<any>
    }
    message.warning(res.data.message)
    return Promise.reject(new Error(res.data.message))
  }) as (value: AxiosResponse) => AxiosResponse,
  (err: AxiosError<ApiResponse>) => {
  if (err.response) {
    if (err.response.status === 401) {
      localStorage.removeItem('userInfo')
      localStorage.removeItem('token')
      localStorage.setItem('redirectURL', location.href)
      location.href = `/${document.documentElement.lang}/login`
    } else {
      const status = err.response.status as keyof typeof httpStatus
      if (httpStatus[status]) {
        message.warning(httpStatus[status])
      } else {
        const msg = err.response.data.message
        message.warning(Array.isArray(msg) ? msg.join('、') : msg)
      }
    }
    return Promise.reject(new Error(err.response.data.message))
  } else {
    console.log('-------')
    return Promise.reject(new Error('Network Error'))
  }
})

export default http as HttpInstance
