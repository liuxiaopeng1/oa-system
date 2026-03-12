import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' }
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '员工管理', icon: 'User' }
      },
      {
        path: 'departments',
        name: 'DepartmentManage',
        component: () => import('@/views/department/DeptList.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'attendance',
        name: 'Attendance',
        component: () => import('@/views/attendance/AttendanceList.vue'),
        meta: { title: '考勤管理', icon: 'Clock' }
      },
      {
        path: 'leaves',
        name: 'Leave',
        component: () => import('@/views/leave/LeaveList.vue'),
        meta: { title: '请假管理', icon: 'Document' }
      },
      {
        path: 'notices',
        name: 'Notice',
        component: () => import('@/views/notice/NoticeList.vue'),
        meta: { title: '公告管理', icon: 'Bell' }
      },
      {
        path: 'tasks',
        name: 'Task',
        component: () => import('@/views/task/TaskList.vue'),
        meta: { title: '任务管理', icon: 'List' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  document.title = `${to.meta.title || 'OA 系统'} - 企业 OA 办公系统`
  
  const userStore = useUserStore()

  if (to.path === '/' && !userStore.isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
