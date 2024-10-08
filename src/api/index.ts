import axios, { AxiosError, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

import { toCamelCase } from '../utils'
import { ApiResponse } from '@/type/api'

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
http.interceptors.request.use((config) => {
  // 在发送请求之前做些什么
  const token = localStorage.getItem('token')
  const language = localStorage.getItem('language') ?? 'ja'
  const roleId = localStorage.getItem('roleId')
  
  config.headers = {
    'Accept-Language': language
  }

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

http.interceptors.response.use((res: AxiosResponse) => {
  if (res.headers['content-disposition']) {
    return res.data
  }
  // 对响应数据做点什么
  if ((res.status === 200 || res.status === 201) && res.data.code === 200) {
    return toCamelCase(res.data) as ApiResponse
  } else {
    message.warning(res.data.message)
    return Promise.reject(new Error(res.data.message))
  }
}, (err: AxiosError<ApiResponse>) => {
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

export default http
