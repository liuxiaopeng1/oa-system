// 用户相关类型
export interface User {
  id: number
  username: string
  realName: string
  email: string
  phone: string
  avatar?: string
  departmentId: number
  departmentName?: string
  roleId: number
  roleName?: string
  status: number
  createTime: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// 部门相关类型
export interface Department {
  id: number
  name: string
  parentId?: number
  parentName?: string
  leaderId?: number
  leaderName?: string
  sort: number
  status: number
  createTime: string
  children?: Department[]
}

// 考勤相关类型
export interface Attendance {
  id: number
  userId: number
  userName: string
  date: string
  clockInTime?: string
  clockOutTime?: string
  status: 'normal' | 'late' | 'early' | 'absent'
  workHours: number
  remark?: string
}

// 请假相关类型
export interface Leave {
  id: number
  userId: number
  userName: string
  type: 'annual' | 'sick' | 'personal' | 'marriage' | 'maternity' | 'paternity' | 'bereavement'
  typeName: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  statusName: string
  createTime: string
}

// 公告相关类型
export interface Notice {
  id: number
  title: string
  content: string
  publisherId: number
  publisherName: string
  priority: 'low' | 'medium' | 'high'
  priorityName: string
  status: number
  viewCount: number
  createTime: string
  isRead?: boolean
}

// 任务相关类型
export interface Task {
  id: number
  title: string
  description: string
  assignerId: number
  assignerName: string
  assigneeId: number
  assigneeName: string
  priority: 'low' | 'medium' | 'high'
  priorityName: string
  status: 'todo' | 'inprogress' | 'done' | 'cancelled'
  statusName: string
  dueDate: string
  createTime: string
}

// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResult<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 菜单相关类型
export interface Menu {
  id: number
  name: string
  path: string
  icon: string
  parentId?: number
  children?: Menu[]
  sort: number
  hidden: boolean
}
