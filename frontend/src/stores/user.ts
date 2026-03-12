import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import type { User, LoginRequest } from '@/types'
import { ElMessage } from 'element-plus'

function readStoredUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(readStoredUser())

  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.realName || user.value?.username || '')
  const userAvatar = computed(() => user.value?.avatar || '')

  // 登录
  async function login(loginForm: LoginRequest) {
    const res = await authApi.login(loginForm)
    token.value = res.token
    user.value = res.user
    
    localStorage.setItem('token', res.token)
    localStorage.setItem('user', JSON.stringify(res.user))
    
    ElMessage.success('登录成功')
    return res
  }

  // 登出
  async function logout() {
    try {
      await authApi.logout()
    } catch (e) {
      // 忽略错误
    }
    
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    ElMessage.success('已退出登录')
  }

  // 获取用户信息
  async function getInfo() {
    const res = await authApi.getInfo()
    user.value = res
    localStorage.setItem('user', JSON.stringify(res))
    return res
  }

  return {
    token,
    user,
    isLoggedIn,
    userName,
    userAvatar,
    login,
    logout,
    getInfo
  }
})
