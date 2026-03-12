<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="标题">
          <el-input v-model="searchForm.keyword" placeholder="请输入标题" clearable />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="请选择优先级" clearable>
            <el-option label="普通" value="low" />
            <el-option label="重要" value="medium" />
            <el-option label="紧急" value="high" />
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
            发布公告
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="250" />
        <el-table-column prop="publisherName" label="发布人" width="100" />
        <el-table-column prop="priorityName" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)">
              {{ row.priorityName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="阅读数" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发布时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio label="low">普通</el-radio>
            <el-radio label="medium">重要</el-radio>
            <el-radio label="high">紧急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">立即发布</el-radio>
            <el-radio :label="0">保存草稿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="formData.content" type="textarea" :rows="10" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" title="公告详情" width="700px">
      <el-descriptions v-if="currentNotice" :column="1" border>
        <el-descriptions-item label="标题">{{ currentNotice.title }}</el-descriptions-item>
        <el-descriptions-item label="发布人">{{ currentNotice.publisherName }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(currentNotice.priority)">
            {{ currentNotice.priorityName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发布时间">{{ currentNotice.createTime }}</el-descriptions-item>
        <el-descriptions-item label="阅读数">{{ currentNotice.viewCount }}</el-descriptions-item>
        <el-descriptions-item label="内容">
          <div class="notice-content">{{ currentNotice.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { noticeApi } from '@/api'
import type { Notice } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const viewVisible = ref(false)
const dialogTitle = ref('发布公告')
const formRef = ref<FormInstance>()
const currentNotice = ref<Notice | null>(null)
const tableData = ref<Notice[]>([])

const searchForm = reactive({
  keyword: '',
  priority: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive<Partial<Notice>>({
  id: undefined,
  title: '',
  content: '',
  priority: 'medium',
  status: 1
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

async function handleSearch() {
  loading.value = true
  try {
    const res = await noticeApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      priority: searchForm.priority || undefined
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
  pagination.page = 1
  handleSearch()
}

function handleAdd() {
  dialogTitle.value = '发布公告'
  Object.assign(formData, {
    id: undefined,
    title: '',
    content: '',
    priority: 'medium',
    status: 1
  })
  dialogVisible.value = true
}

function handleEdit(row: Notice) {
  dialogTitle.value = '编辑公告'
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleView(row: Notice) {
  const detail = await noticeApi.getById(row.id)
  currentNotice.value = detail
  viewVisible.value = true
  if (!detail.isRead) {
    await noticeApi.markAsRead(row.id)
    await handleSearch()
  }
}

async function handleDelete(row: Notice) {
  await ElMessageBox.confirm(`确定要删除公告"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await noticeApi.delete(row.id)
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
        content: formData.content,
        priority: formData.priority,
        status: formData.status
      }

      if (formData.id) {
        await noticeApi.update(formData.id, payload)
      } else {
        await noticeApi.create(payload)
      }

      dialogVisible.value = false
      ElMessage.success(formData.id ? '更新成功' : '发布成功')
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

.notice-content {
  white-space: pre-wrap;
  line-height: 1.8;
}
</style>
