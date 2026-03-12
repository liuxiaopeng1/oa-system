import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types'

interface RequestConfig extends InternalAxiosRequestConfig {
  silentError?: boolean
}

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const config = error.config as RequestConfig | undefined

    if (!config?.silentError) {
      ElMessage.error(error.message || '网络错误')
    }

    return Promise.reject(error)
  }
)

function handleApiResponse<T>(res: ApiResponse<T>): T {
  if (res.code !== 200) {
    ElMessage.error(res.message || '请求失败')

    if (res.code === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    throw new Error(res.message || '请求失败')
  }

  return res.data
}

// 封装请求方法
export function get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request.get<any, ApiResponse<T>>(url, { ...config, params }).then(handleApiResponse)
}

export function post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request.post<any, ApiResponse<T>>(url, data, config).then(handleApiResponse)
}

export function put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<T> {
  return request.put<any, ApiResponse<T>>(url, data, config).then(handleApiResponse)
}

export function del<T = any>(url: string, config?: Partial<RequestConfig>): Promise<T> {
  return request.delete<any, ApiResponse<T>>(url, config).then(handleApiResponse)
}

export default request
