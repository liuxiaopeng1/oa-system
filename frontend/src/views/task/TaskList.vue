<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入任务名称" clearable />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="请选择优先级" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待办" value="todo" />
            <el-option label="进行中" value="inprogress" />
            <el-option label="已完成" value="done" />
            <el-option label="已取消" value="cancelled" />
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
            创建任务
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="任务名称" min-width="200" />
        <el-table-column prop="assigneeName" label="负责人" width="100" />
        <el-table-column prop="priorityName" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">
              {{ row.priorityName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="statusName" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.statusName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button v-if="row.status !== 'done'" type="success" link @click="handleComplete(row)">
              完成
            </el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="formData.title" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="assigneeId">
          <el-select v-model="formData.assigneeId" placeholder="请选择负责人">
            <el-option
              v-for="user in assigneeOptions"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio label="high">高</el-radio>
            <el-radio label="medium">中</el-radio>
            <el-radio label="low">低</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="截止日期" prop="dueDate">
          <el-date-picker
            v-model="formData.dueDate"
            type="date"
            placeholder="选择截止日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { taskApi, userApi } from '@/api'
import type { Task, User } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('创建任务')
const formRef = ref<FormInstance>()
const tableData = ref<Task[]>([])
const assigneeOptions = ref<User[]>([])

const searchForm = reactive({
  keyword: '',
  priority: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive<Partial<Task>>({
  id: undefined,
  title: '',
  description: '',
  assigneeId: undefined,
  priority: 'medium',
  dueDate: ''
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  assigneeId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
}

async function loadAssignees() {
  try {
    const res = await userApi.getList({ page: 1, pageSize: 1000 })
    assigneeOptions.value = res.list
  } catch {
    assigneeOptions.value = []
  }
}

async function handleSearch() {
  loading.value = true
  try {
    const res = await taskApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      priority: searchForm.priority || undefined,
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
  searchForm.keyword = ''
  searchForm.priority = ''
  searchForm.status = ''
  pagination.page = 1
  handleSearch()
}

function handleAdd() {
  dialogTitle.value = '创建任务'
  Object.assign(formData, {
    id: undefined,
    title: '',
    description: '',
    assigneeId: undefined,
    priority: 'medium',
    dueDate: ''
  })
  dialogVisible.value = true
}

function handleEdit(row: Task) {
  dialogTitle.value = '编辑任务'
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleComplete(row: Task) {
  await ElMessageBox.confirm(`确定要完成任务"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await taskApi.updateStatus(row.id, 'done')
  ElMessage.success('任务已完成')
  await handleSearch()
}

async function handleDelete(row: Task) {
  await ElMessageBox.confirm(`确定要删除任务"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await taskApi.delete(row.id)
  ElMessage.success('删除成功')
  await handleSearch()
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        assigneeId: formData.assigneeId,
        priority: formData.priority,
        dueDate: formData.dueDate
      }

      if (formData.id) {
        await taskApi.update(formData.id, payload)
      } else {
        await taskApi.create(payload)
      }

      dialogVisible.value = false
      ElMessage.success(formData.id ? '更新成功' : '创建成功')
      await handleSearch()
    } finally {
      submitLoading.value = false
    }
  })
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' }
  return map[priority] || 'info'
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    todo: 'info',
    inprogress: 'warning',
    done: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

onMounted(async () => {
  await Promise.all([loadAssignees(), handleSearch()])
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
</style>
