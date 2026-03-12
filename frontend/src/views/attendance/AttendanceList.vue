<template>
  <div class="page-container">
    <el-card class="clock-card mb-20">
      <div class="clock-content">
        <div class="clock-time">
          <div class="time-display">{{ currentTime }}</div>
          <div class="date-display">{{ currentDate }}</div>
        </div>
        <div class="clock-actions">
          <el-button type="success" size="large" :disabled="hasClockedIn" @click="handleClockIn">
            <el-icon><CircleCheck /></el-icon>
            上班打卡
          </el-button>
          <el-button type="warning" size="large" :disabled="!hasClockedIn" @click="handleClockOut">
            <el-icon><SwitchButton /></el-icon>
            下班打卡
          </el-button>
        </div>
        <div class="clock-status">
          <el-tag v-if="hasClockedIn" type="success">已打卡</el-tag>
          <el-tag v-else type="info">未打卡</el-tag>
          <span class="clock-time-text">
            {{ todayRecord?.clockInTime ? `打卡时间：${todayRecord.clockInTime}` : '请尽快打卡' }}
          </span>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <span class="label">应出勤</span>
            <span class="value">{{ stats.shouldWorkDays }} 天</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <span class="label">实际出勤</span>
            <span class="value success">{{ stats.actualWorkDays }} 天</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <span class="label">迟到</span>
            <span class="value warning">{{ stats.lateCount }} 次</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <span class="label">缺卡</span>
            <span class="value danger">{{ stats.absentCount }} 次</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤记录</span>
          <el-date-picker
            v-model="currentMonth"
            type="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            @change="handleSearch"
          />
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="clockInTime" label="上班打卡" width="120" />
        <el-table-column prop="clockOutTime" label="下班打卡" width="120" />
        <el-table-column prop="workHours" label="工作时长" width="100">
          <template #default="{ row }">
            {{ row.workHours }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { attendanceApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Attendance } from '@/types'

interface AttendanceStats {
  shouldWorkDays: number
  actualWorkDays: number
  lateCount: number
  earlyCount: number
  absentCount: number
  leaveDays: number
  overtimeHours: number
}

const userStore = useUserStore()
const loading = ref(false)
const currentTime = ref('')
const currentDate = ref('')
const currentMonth = ref(dayjs().format('YYYY-MM'))
const tableData = ref<Attendance[]>([])
const stats = reactive<AttendanceStats>({
  shouldWorkDays: 0,
  actualWorkDays: 0,
  lateCount: 0,
  earlyCount: 0,
  absentCount: 0,
  leaveDays: 0,
  overtimeHours: 0
})

let timer: ReturnType<typeof setInterval> | null = null

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const currentUserId = computed(() => userStore.user?.id ?? 0)
const todayRecord = computed(() => tableData.value.find((item) => item.date === dayjs().format('YYYY-MM-DD')))
const hasClockedIn = computed(() => Boolean(todayRecord.value?.clockInTime && !todayRecord.value?.clockOutTime))

function updateCurrentTime() {
  const now = dayjs()
  currentTime.value = now.format('HH:mm:ss')
  currentDate.value = now.format('YYYY 年 MM 月 DD 日 dddd')
}

async function loadStats() {
  if (!currentUserId.value) return
  try {
    const res = await attendanceApi.getStats<AttendanceStats>(currentUserId.value, currentMonth.value)
    Object.assign(stats, res)
  } catch {
    Object.assign(stats, {
      shouldWorkDays: 0,
      actualWorkDays: 0,
      lateCount: 0,
      earlyCount: 0,
      absentCount: 0,
      leaveDays: 0,
      overtimeHours: 0
    })
  }
}

async function handleSearch() {
  loading.value = true
  try {
    const monthStart = `${currentMonth.value}-01`
    const monthEnd = dayjs(monthStart).endOf('month').format('YYYY-MM-DD')
    const res = await attendanceApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      userId: currentUserId.value || undefined,
      startDate: monthStart,
      endDate: monthEnd
    })
    tableData.value = res.list
    pagination.total = res.total
    await loadStats()
  } catch {
    tableData.value = []
    pagination.total = 0
    await loadStats()
  } finally {
    loading.value = false
  }
}

async function handleClockIn() {
  await attendanceApi.clockIn()
  ElMessage.success('上班打卡成功')
  await handleSearch()
}

async function handleClockOut() {
  await attendanceApi.clockOut()
  ElMessage.success('下班打卡成功')
  await handleSearch()
}

function getStatusType(status: string) {
  const map: Record<string, string> = { normal: 'success', late: 'warning', early: 'warning', absent: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = { normal: '正常', late: '迟到', early: '早退', absent: '缺卡' }
  return map[status] || '未知'
}

onMounted(async () => {
  updateCurrentTime()
  timer = setInterval(updateCurrentTime, 1000)
  await handleSearch()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.page-container {
  padding: 0;
}

.mb-20 {
  margin-bottom: 20px;
}

.clock-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.clock-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.clock-time {
  color: #fff;
}

.time-display {
  font-size: 48px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.date-display {
  font-size: 18px;
  margin-top: 10px;
  opacity: 0.9;
}

.clock-actions {
  display: flex;
  gap: 20px;
}

.clock-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.clock-time-text {
  font-size: 14px;
  opacity: 0.9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
}

.stat-item .label {
  font-size: 14px;
  color: #999;
}

.stat-item .value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-item .value.success {
  color: #67C23A;
}

.stat-item .value.warning {
  color: #E6A23C;
}

.stat-item .value.danger {
  color: #F56C6C;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
