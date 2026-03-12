<template>
  <div class="shell">
    <aside class="sidebar" :class="{ collapsed: isCollapse }">
      <div class="brand">
        <div class="brand-mark">
          <el-icon :size="26"><OfficeBuilding /></el-icon>
        </div>
        <div v-show="!isCollapse">
          <div class="brand-title">Nova OA</div>
          <div class="brand-subtitle">Office Workflow Suite</div>
        </div>
      </div>

      <div class="nav-caption" v-show="!isCollapse">Workspace</div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="transparent"
        text-color="#8f9bb3"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item v-for="menu in menus" :key="menu.path" :index="menu.path">
          <el-icon><component :is="menu.icon" /></el-icon>
          <template #title>{{ menu.name }}</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="main-wrap">
      <header class="topbar">
        <div class="topbar-left">
          <el-button circle text class="collapse-btn" @click="toggleCollapse">
            <el-icon :size="18">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
          </el-button>

          <div>
            <div class="topbar-title">{{ currentMenu?.name || '首页' }}</div>
            <div class="topbar-subtitle">{{ currentDateLabel }}</div>
          </div>
        </div>

        <div class="topbar-right">
          <div class="status-chip">
            <span class="status-dot"></span>
            在线协同
          </div>

          <el-badge :value="unreadCount" :hidden="unreadCount === 0">
            <div class="action-icon">
              <el-icon :size="18"><Bell /></el-icon>
            </div>
          </el-badge>

          <el-dropdown @command="handleCommand">
            <div class="user-card">
              <el-avatar :size="38" :src="userStore.userAvatar">
                {{ userStore.userName?.charAt(0) || '管' }}
              </el-avatar>
              <div class="user-meta">
                <strong>{{ userStore.userName || '管理员' }}</strong>
                <span>{{ currentRoleLabel }}</span>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { menuApi, noticeApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Menu } from '@/types'

dayjs.locale('zh-cn')

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const unreadCount = ref(0)
const menus = ref<Menu[]>([])

const defaultMenus: Menu[] = [
  { id: 1, name: '工作台', path: '/dashboard', icon: 'HomeFilled', sort: 1, hidden: false },
  { id: 2, name: '员工管理', path: '/users', icon: 'User', sort: 2, hidden: false },
  { id: 3, name: '部门管理', path: '/departments', icon: 'OfficeBuilding', sort: 3, hidden: false },
  { id: 4, name: '考勤管理', path: '/attendance', icon: 'Clock', sort: 4, hidden: false },
  { id: 5, name: '请假管理', path: '/leaves', icon: 'Document', sort: 5, hidden: false },
  { id: 6, name: '公告管理', path: '/notices', icon: 'Bell', sort: 6, hidden: false },
  { id: 7, name: '任务管理', path: '/tasks', icon: 'List', sort: 7, hidden: false }
]

const activeMenu = computed(() => route.path)
const currentMenu = computed(() => menus.value.find((item) => item.path === route.path))
const currentDateLabel = computed(() => dayjs().format('YYYY 年 MM 月 DD 日 dddd'))
const currentRoleLabel = computed(() => userStore.user?.roleName || '系统管理员')

async function loadMenus() {
  try {
    const data = await menuApi.getList()
    menus.value = data.length > 0 ? data : defaultMenus
  } catch {
    menus.value = defaultMenus
  }
}

async function loadNoticeCount() {
  try {
    const res = await noticeApi.getList({ page: 1, pageSize: 1 })
    unreadCount.value = res.total
  } catch {
    unreadCount.value = 0
  }
}

function toggleCollapse() {
  isCollapse.value = !isCollapse.value
}

async function handleCommand(command: string) {
  if (command === 'logout') {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await userStore.logout()
    router.push('/login')
    return
  }

  ElMessage.info('个人中心开发中')
}

onMounted(async () => {
  await Promise.all([loadMenus(), loadNoticeCount()])
})
</script>

<style scoped>
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  padding: 18px;
  gap: 18px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  padding: 22px 14px 14px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(10, 28, 63, 0.96) 0%, rgba(14, 36, 77, 0.98) 100%);
  color: #fff;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.16);
  transition: width 0.25s ease;
}

.sidebar.collapsed {
  padding-inline: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 10px 18px;
}

.brand-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #2c7dff, #56c0ff);
}

.brand-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.brand-subtitle {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
}

.nav-caption {
  margin: 12px 12px 10px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 48px;
  border-radius: 14px;
  margin-bottom: 6px;
}

:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(36, 99, 235, 0.9), rgba(52, 148, 255, 0.9));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.main-wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 22px;
  border-radius: 26px;
  background: var(--oa-panel);
  border: 1px solid var(--oa-line);
  box-shadow: var(--oa-shadow);
  backdrop-filter: blur(16px);
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.topbar-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.topbar-subtitle {
  margin-top: 4px;
  color: var(--oa-muted);
  font-size: 13px;
}

.collapse-btn,
.action-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #f5f7fb;
  color: var(--oa-text);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(23, 163, 74, 0.1);
  color: #0f8a3b;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 18px;
  cursor: pointer;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-meta strong {
  font-size: 14px;
}

.user-meta span {
  color: var(--oa-muted);
  font-size: 12px;
}

.main-content {
  min-height: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1100px) {
  .shell {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .sidebar {
    padding-inline: 10px;
  }

  .brand-title,
  .brand-subtitle,
  .nav-caption {
    display: none;
  }
}

@media (max-width: 640px) {
  .shell {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .sidebar {
    border-radius: 24px;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .topbar-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
