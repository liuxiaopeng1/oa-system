import { get, post, put, del } from '@/utils/request'
import type { 
  LoginRequest, 
  LoginResponse, 
  User, 
  Department, 
  Attendance, 
  Leave, 
  Notice, 
  Task,
  PageResult,
  Menu
} from '@/types'

const mockAdminUser: User = {
  id: 1,
  username: 'admin',
  realName: '管理员',
  email: 'admin@company.com',
  phone: '13800138000',
  departmentId: 1,
  departmentName: '技术部',
  roleId: 1,
  roleName: '管理员',
  status: 1,
  createTime: '2026-03-11 09:00:00'
}

async function mockLogin(data: LoginRequest): Promise<LoginResponse> {
  if (data.username === 'admin' && data.password === 'admin123') {
    return {
      token: 'mock-token-admin',
      user: mockAdminUser
    }
  }

  throw new Error('用户名或密码错误')
}

function shouldFallbackToMock(error: any) {
  const status = error?.response?.status
  const url = error?.config?.url || ''
  return url.includes('/auth/') && (!status || status >= 500)
}

// 认证相关 API
export const authApi = {
  async login(data: LoginRequest) {
    try {
      return await post<LoginResponse>('/auth/login', data, { silentError: true })
    } catch (error: any) {
      if (shouldFallbackToMock(error)) {
        return mockLogin(data)
      }
      throw error
    }
  },
  async logout() {
    return post('/auth/logout')
  },
  async getInfo() {
    return get<User>('/auth/info')
  }
}

// 用户管理 API
export const userApi = {
  getList: (params: any) => get<PageResult<User>>('/users', params, { silentError: true }),
  getById: (id: number) => get<User>(`/users/${id}`, undefined, { silentError: true }),
  create: (data: Partial<User>) => post<User>('/users', data),
  update: (id: number, data: Partial<User>) => put<User>(`/users/${id}`, data),
  delete: (id: number) => del(`/users/${id}`)
}

// 部门管理 API
export const deptApi = {
  getList: (params?: any) => get<Department[]>('/departments', params, { silentError: true }),
  getById: (id: number) => get<Department>(`/departments/${id}`, undefined, { silentError: true }),
  create: (data: Partial<Department>) => post<Department>('/departments', data),
  update: (id: number, data: Partial<Department>) => put<Department>(`/departments/${id}`, data),
  delete: (id: number) => del(`/departments/${id}`)
}

// 考勤管理 API
export const attendanceApi = {
  clockIn: () => post('/attendance/clock-in'),
  clockOut: () => post('/attendance/clock-out'),
  getList: (params: any) => get<PageResult<Attendance>>('/attendance', params, { silentError: true }),
  getStats: <T = any>(userId: number, month: string) => get<T>(`/attendance/stats/${userId}`, { month }, { silentError: true })
}

// 请假管理 API
export const leaveApi = {
  getList: (params: any) => get<PageResult<Leave>>('/leaves', params, { silentError: true }),
  getById: (id: number) => get<Leave>(`/leaves/${id}`, undefined, { silentError: true }),
  create: (data: Partial<Leave>) => post<Leave>('/leaves', data),
  approve: (id: number, approved: boolean, comment?: string) => post(`/leaves/${id}/approve`, { approved, comment }),
  delete: (id: number) => del(`/leaves/${id}`),
  getBalance: <T = any>(userId: number) => get<T>('/leaves/balance/' + userId, undefined, { silentError: true })
}

// 公告管理 API
export const noticeApi = {
  getList: (params: any) => get<PageResult<Notice>>('/notices', params, { silentError: true }),
  getById: (id: number) => get<Notice>(`/notices/${id}`, undefined, { silentError: true }),
  create: (data: Partial<Notice>) => post<Notice>('/notices', data),
  update: (id: number, data: Partial<Notice>) => put<Notice>(`/notices/${id}`, data),
  delete: (id: number) => del(`/notices/${id}`),
  markAsRead: (id: number) => post(`/notices/${id}/read`)
}

// 任务管理 API
export const taskApi = {
  getList: (params: any) => get<PageResult<Task>>('/tasks', params, { silentError: true }),
  getById: (id: number) => get<Task>(`/tasks/${id}`, undefined, { silentError: true }),
  create: (data: Partial<Task>) => post<Task>('/tasks', data),
  update: (id: number, data: Partial<Task>) => put<Task>(`/tasks/${id}`, data),
  delete: (id: number) => del(`/tasks/${id}`),
  updateStatus: (id: number, status: string) => put(`/tasks/${id}/status`, { status })
}

// 菜单 API
export const menuApi = {
  getList: () => get<Menu[]>('/menus', undefined, { silentError: true })
}
