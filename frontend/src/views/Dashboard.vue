<template>
  <div class="page-shell">
    <section class="hero section-card">
      <div>
        <h1>企业协同工作台</h1>
        <p>
          这里展示组织、流程和执行层面的关键指标。所有数据优先读取真实后端接口，接口暂无数据时保持页面可用并展示空状态。
        </p>
      </div>
    </section>

    <section class="metric-grid">
      <article v-for="card in metricCards" :key="card.label" class="metric-card section-card">
        <div class="metric-head">
          <div class="metric-icon" :style="{ background: card.bg, color: card.color }">
            <el-icon :size="22"><component :is="card.icon" /></el-icon>
          </div>
          <span>{{ card.label }}</span>
        </div>
        <strong>{{ card.value }}</strong>
        <p>{{ card.note }}</p>
      </article>
    </section>

    <section class="dashboard-grid">
      <div class="dashboard-main">
        <article class="section-card panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">快捷入口</div>
              <div class="panel-subtitle">高频操作集中在一个区域</div>
            </div>
          </div>
          <div class="quick-actions">
            <button
              v-for="action in quickActions"
              :key="action.name"
              class="action-item"
              type="button"
              @click="handleAction(action.path)"
            >
              <div class="action-icon" :style="{ background: action.bg, color: action.color }">
                <el-icon :size="24"><component :is="action.icon" /></el-icon>
              </div>
              <strong>{{ action.name }}</strong>
              <span>{{ action.description }}</span>
            </button>
          </div>
        </article>

        <article class="section-card panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">我的任务</div>
              <div class="panel-subtitle">近期待处理工作与执行状态</div>
            </div>
            <el-button link type="primary" @click="handleAction('/tasks')">查看全部</el-button>
          </div>

          <div v-if="tasks.length === 0" class="empty-hint">
            <div>
              <strong>暂无任务数据</strong>
              <span>任务接口未返回数据时，这里保持为空。</span>
            </div>
          </div>

          <el-table v-else :data="tasks" style="width: 100%">
            <el-table-column prop="title" label="任务名称" />
            <el-table-column prop="assigneeName" label="负责人" width="110" />
            <el-table-column prop="priorityName" label="优先级" width="90">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)">{{ row.priorityName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="statusName" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.statusName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="dueDate" label="截止日期" width="120" />
          </el-table>
        </article>
      </div>

      <div class="dashboard-side">
        <article class="section-card panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">最新公告</div>
              <div class="panel-subtitle">组织通知与制度更新</div>
            </div>
            <el-button link type="primary" @click="handleAction('/notices')">查看全部</el-button>
          </div>

          <div v-if="notices.length === 0" class="empty-hint compact">
            <div>
              <strong>暂无公告</strong>
              <span>公告接口未返回数据。</span>
            </div>
          </div>

          <div v-else class="notice-list">
            <div v-for="notice in notices" :key="notice.id" class="notice-item">
              <div class="notice-header">
                <strong>{{ notice.title }}</strong>
                <el-tag size="small" :type="getPriorityType(notice.priority)">
                  {{ notice.priorityName }}
                </el-tag>
              </div>
              <div class="notice-meta">
                <span>{{ notice.publisherName }}</span>
                <span>{{ notice.createTime }}</span>
              </div>
            </div>
          </div>
        </article>

        <article class="section-card panel">
          <div class="panel-head">
            <div>
              <div class="panel-title">考勤概览</div>
              <div class="panel-subtitle">当前用户当月统计</div>
            </div>
          </div>

          <div class="stats-stack">
            <div class="stats-row">
              <span>本月出勤</span>
              <strong>{{ dashboardStats.actualWorkDays }} 天</strong>
            </div>
            <div class="stats-row">
              <span>待审批请假</span>
              <strong>{{ dashboardStats.pendingLeaves }} 条</strong>
            </div>
            <div class="stats-row">
              <span>迟到次数</span>
              <strong class="warning">{{ dashboardStats.lateCount }} 次</strong>
            </div>
            <div class="stats-row">
              <span>早退次数</span>
              <strong class="warning">{{ dashboardStats.earlyCount }} 次</strong>
            </div>
            <div class="stats-row">
              <span>请假天数</span>
              <strong>{{ dashboardStats.leaveDays }} 天</strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { attendanceApi, leaveApi, noticeApi, taskApi, userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Notice, Task } from '@/types'

interface AttendanceStats {
  actualWorkDays: number
  lateCount: number
  earlyCount: number
  leaveDays: number
}

const router = useRouter()
const userStore = useUserStore()

const quickActions = [
  { name: '考勤打卡', icon: 'Clock', color: '#2463eb', bg: 'rgba(36, 99, 235, 0.12)', path: '/attendance', description: '查看考勤并执行上下班打卡' },
  { name: '请假申请', icon: 'Document', color: '#0f9f66', bg: 'rgba(15, 159, 102, 0.12)', path: '/leaves', description: '发起申请并跟踪审批进度' },
  { name: '公告中心', icon: 'Bell', color: '#d46b08', bg: 'rgba(212, 107, 8, 0.12)', path: '/notices', description: '查阅组织公告和制度通知' },
  { name: '任务看板', icon: 'List', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)', path: '/tasks', description: '查看任务状态和截止节点' },
  { name: '员工通讯录', icon: 'User', color: '#0f766e', bg: 'rgba(15, 118, 110, 0.12)', path: '/users', description: '浏览员工和部门信息' },
  { name: '组织架构', icon: 'OfficeBuilding', color: '#dc4d41', bg: 'rgba(220, 77, 65, 0.12)', path: '/departments', description: '维护部门层级和负责人' }
]

const tasks = ref<Task[]>([])
const notices = ref<Notice[]>([])
const dashboardStats = reactive({
  userTotal: 0,
  actualWorkDays: 0,
  pendingLeaves: 0,
  noticeTotal: 0,
  lateCount: 0,
  earlyCount: 0,
  leaveDays: 0
})

const metricCards = computed(() => [
  { label: '组织规模', value: `${dashboardStats.userTotal}`, note: '当前用户与组织数据来源于 `/users`', icon: 'User', color: '#2463eb', bg: 'rgba(36, 99, 235, 0.12)' },
  { label: '本月出勤', value: `${dashboardStats.actualWorkDays} 天`, note: '考勤统计聚合当前月份', icon: 'CircleCheck', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
  { label: '审批积压', value: `${dashboardStats.pendingLeaves} 条`, note: '请假待审批数量', icon: 'Document', color: '#ca8a04', bg: 'rgba(202, 138, 4, 0.12)' },
  { label: '消息触达', value: `${dashboardStats.noticeTotal} 条`, note: '最新公告与通知汇总', icon: 'Bell', color: '#dc4d41', bg: 'rgba(220, 77, 65, 0.12)' }
])

function getPriorityType(priority: string) {
  const map: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' }
  return map[priority] || 'info'
}

function getStatusType(status: string) {
  const map: Record<string, string> = { todo: 'info', inprogress: 'warning', done: 'success' }
  return map[status] || 'info'
}

function handleAction(path: string) {
  router.push(path)
}

async function loadDashboardData() {
  const month = new Date().toISOString().slice(0, 7)
  const currentUserId = userStore.user?.id
  const emptyStats: AttendanceStats = {
    actualWorkDays: 0,
    lateCount: 0,
    earlyCount: 0,
    leaveDays: 0
  }

  const [usersRes, tasksRes, noticesRes, leavesRes, statsRes] = await Promise.all([
    userApi.getList({ page: 1, pageSize: 1 }).catch(() => ({ list: [], total: 0, page: 1, pageSize: 1 })),
    taskApi.getList({ page: 1, pageSize: 5 }).catch(() => ({ list: [], total: 0, page: 1, pageSize: 5 })),
    noticeApi.getList({ page: 1, pageSize: 5 }).catch(() => ({ list: [], total: 0, page: 1, pageSize: 5 })),
    leaveApi.getList({ page: 1, pageSize: 1, status: 'pending' }).catch(() => ({ list: [], total: 0, page: 1, pageSize: 1 })),
    currentUserId ? attendanceApi.getStats<AttendanceStats>(currentUserId, month).catch(() => emptyStats) : Promise.resolve(emptyStats)
  ])

  tasks.value = tasksRes.list ?? []
  notices.value = noticesRes.list ?? []
  dashboardStats.userTotal = usersRes.total ?? 0
  dashboardStats.pendingLeaves = leavesRes.total ?? 0
  dashboardStats.noticeTotal = noticesRes.total ?? 0
  dashboardStats.actualWorkDays = statsRes.actualWorkDays ?? 0
  dashboardStats.lateCount = statsRes.lateCount ?? 0
  dashboardStats.earlyCount = statsRes.earlyCount ?? 0
  dashboardStats.leaveDays = statsRes.leaveDays ?? 0
}

onMounted(async () => {
  await loadDashboardData()
})
</script>

<style scoped>
.hero {
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(36, 99, 235, 0.12), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(245, 248, 255, 0.98));
}

.hero h1 {
  font-size: 40px;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.hero p {
  margin-top: 16px;
  max-width: 620px;
  color: var(--oa-muted);
  line-height: 1.8;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 20px;
}

.metric-head {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--oa-muted);
}

.metric-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
}

.metric-card strong {
  display: block;
  margin-top: 18px;
  font-size: 34px;
  letter-spacing: -0.05em;
}

.metric-card p {
  margin-top: 10px;
  color: var(--oa-muted);
  line-height: 1.7;
  font-size: 13px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.95fr);
  gap: 18px;
}

.dashboard-main,
.dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel {
  padding: 24px;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.panel-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.panel-subtitle {
  margin-top: 6px;
  color: var(--oa-muted);
  font-size: 13px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}

.action-item {
  padding: 18px;
  border: 1px solid var(--oa-line);
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff, #f7f9fc);
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.action-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  border-color: rgba(36, 99, 235, 0.16);
}

.action-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
}

.action-item strong {
  display: block;
  margin-top: 14px;
  font-size: 16px;
}

.action-item span {
  display: block;
  margin-top: 8px;
  color: var(--oa-muted);
  line-height: 1.7;
  font-size: 13px;
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid var(--oa-line);
}

.notice-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.notice-header strong {
  line-height: 1.6;
}

.notice-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  color: var(--oa-muted);
  font-size: 12px;
}

.stats-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stats-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid var(--oa-line);
}

.stats-row span {
  color: var(--oa-muted);
}

.stats-row strong {
  font-size: 18px;
}

.stats-row strong.warning {
  color: var(--oa-warning);
}

.empty-hint.compact {
  min-height: 140px;
}

@media (max-width: 980px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 20px;
  }

  .hero h1 {
    font-size: 30px;
  }

  .panel {
    padding: 18px;
  }
}
</style>
