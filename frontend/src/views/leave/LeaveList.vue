<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="请假类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="年假" value="annual" />
            <el-option label="病假" value="sick" />
            <el-option label="事假" value="personal" />
            <el-option label="婚假" value="marriage" />
            <el-option label="产假" value="maternity" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>

      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            申请请假
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button @click="handleViewBalance">
            <el-icon><Wallet /></el-icon>
            假期余额
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userName" label="申请人" width="100" />
        <el-table-column prop="typeName" label="请假类型" width="100" />
        <el-table-column prop="startDate" label="开始日期" width="120" />
        <el-table-column prop="endDate" label="结束日期" width="120" />
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column prop="reason" label="请假事由" min-width="200" show-overflow-tooltip />
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              link
              @click="handleApprove(row, true)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              link
              @click="handleApprove(row, false)"
            >
              拒绝
            </el-button>
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
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

    <el-dialog v-model="dialogVisible" title="申请请假" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="请假类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择请假类型">
            <el-option label="年假" value="annual" />
            <el-option label="病假" value="sick" />
            <el-option label="事假" value="personal" />
            <el-option label="婚假" value="marriage" />
            <el-option label="产假" value="maternity" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="formData.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="formData.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="请假天数" prop="days">
          <el-input-number v-model="formData.days" :min="0.5" :max="30" :step="0.5" />
        </el-form-item>
        <el-form-item label="请假事由" prop="reason">
          <el-input v-model="formData.reason" type="textarea" :rows="4" placeholder="请输入请假事由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          提交申请
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="balanceVisible" title="假期余额" width="500px" v-loading="balanceLoading">
      <el-descriptions :column="1" border>
        <el-descriptions-item
          v-for="item in balanceItems"
          :key="item.type"
          :label="item.typeName"
        >
          <el-tag type="success">{{ item.totalDays }} 天</el-tag>
          <span class="ml-10">已用 {{ item.usedDays }} 天，剩余 {{ item.remainingDays }} 天</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { leaveApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Leave } from '@/types'

interface LeaveBalanceItem {
  type: string
  typeName: string
  totalDays: number
  usedDays: number
  remainingDays: number
}

interface LeaveBalanceResponse {
  userId: number
  year: number
  balances: LeaveBalanceItem[]
}

const userStore = useUserStore()
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const balanceVisible = ref(false)
const balanceLoading = ref(false)
const formRef = ref<FormInstance>()
const tableData = ref<Leave[]>([])
const balanceItems = ref<LeaveBalanceItem[]>([])

const searchForm = reactive({
  type: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive<Partial<Leave>>({
  type: undefined,
  startDate: '',
  endDate: '',
  days: 1,
  reason: ''
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  days: [{ required: true, message: '请输入请假天数', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入请假事由', trigger: 'blur' }]
}

async function handleSearch() {
  loading.value = true
  try {
    const res = await leaveApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      type: searchForm.type || undefined,
      status: searchForm.status || undefined
    })
    tableData.value = res.list
    pagination.total = res.total
  } catch {
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.type = ''
  searchForm.status = ''
  pagination.page = 1
  handleSearch()
}

function handleAdd() {
  Object.assign(formData, {
    type: undefined,
    startDate: '',
    endDate: '',
    days: 1,
    reason: ''
  })
  dialogVisible.value = true
}

function handleView(row: Leave) {
  ElMessageBox.alert(row.reason, `${row.userName}的请假详情`, {
    confirmButtonText: '确定'
  })
}

async function handleApprove(row: Leave, approved: boolean) {
  const action = approved ? '通过' : '拒绝'
  await ElMessageBox.confirm(`确定要${action}该请假申请吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await leaveApi.approve(row.id, approved, action)
  ElMessage.success(`${action}成功`)
  await handleSearch()
}

async function handleDelete(row: Leave) {
  await ElMessageBox.confirm('确定要删除该请假记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await leaveApi.delete(row.id)
  ElMessage.success('删除成功')
  await handleSearch()
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      await leaveApi.create({
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: formData.days,
        reason: formData.reason
      })
      dialogVisible.value = false
      ElMessage.success('申请提交成功')
      await handleSearch()
    } finally {
      submitLoading.value = false
    }
  })
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

async function handleViewBalance() {
  if (!userStore.user?.id) return

  balanceVisible.value = true
  balanceLoading.value = true
  try {
    const res = await leaveApi.getBalance<LeaveBalanceResponse>(userStore.user.id)
    balanceItems.value = res.balances
  } catch {
    balanceItems.value = []
  } finally {
    balanceLoading.value = false
  }
}

function getStatusType(status: string) {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

onMounted(async () => {
  await handleSearch()
})
</script>

<style scoped>
.page-container {
  padding: 0;
}

.search-form {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.ml-10 {
  margin-left: 10px;
}
</style>
