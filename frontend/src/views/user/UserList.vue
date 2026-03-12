<template>
  <div class="page-container">
    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.keyword" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.departmentId" placeholder="请选择部门" clearable>
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="在职" :value="1" />
            <el-option label="离职" :value="0" />
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
            新增员工
          </el-button>
          <el-button type="danger" :disabled="selectedRows.length === 0">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="tableData" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column prop="departmentName" label="部门" width="100" />
        <el-table-column prop="roleName" label="角色" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="入职时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
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
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-select v-model="formData.departmentId" placeholder="请选择部门">
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="formData.roleId" placeholder="请选择角色">
            <el-option label="管理员" :value="1" />
            <el-option label="普通员工" :value="2" />
            <el-option label="部门经理" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">在职</el-radio>
            <el-radio :label="0">离职</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!formData.id" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" />
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
import { deptApi, userApi } from '@/api'
import type { Department, User } from '@/types'

interface UserForm extends Partial<User> {
  password?: string
}

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增员工')
const formRef = ref<FormInstance>()
const selectedRows = ref<User[]>([])
const tableData = ref<User[]>([])
const departmentOptions = ref<Department[]>([])

const searchForm = reactive({
  keyword: '',
  departmentId: null as number | null,
  status: null as number | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive<UserForm>({
  username: '',
  realName: '',
  email: '',
  phone: '',
  departmentId: undefined,
  roleId: undefined,
  status: 1,
  password: ''
})

const rules: FormRules<UserForm> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  departmentId: [{ required: true, message: '请选择部门', trigger: 'change' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function loadDepartments() {
  try {
    departmentOptions.value = await deptApi.getList()
  } catch {
    departmentOptions.value = []
  }
}

async function handleSearch() {
  loading.value = true
  try {
    const res = await userApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      departmentId: searchForm.departmentId || undefined,
      status: searchForm.status ?? undefined
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
  searchForm.departmentId = null
  searchForm.status = null
  pagination.page = 1
  handleSearch()
}

function handleAdd() {
  dialogTitle.value = '新增员工'
  Object.assign(formData, {
    id: undefined,
    username: '',
    realName: '',
    email: '',
    phone: '',
    departmentId: undefined,
    roleId: undefined,
    status: 1,
    password: ''
  })
  dialogVisible.value = true
}

function handleEdit(row: User) {
  dialogTitle.value = '编辑员工'
  Object.assign(formData, { ...row, password: '' })
  dialogVisible.value = true
}

async function handleDelete(row: User) {
  await ElMessageBox.confirm(`确定要删除员工"${row.realName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await userApi.delete(row.id)
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
        username: formData.username,
        realName: formData.realName,
        email: formData.email,
        phone: formData.phone,
        departmentId: formData.departmentId,
        roleId: formData.roleId,
        status: formData.status,
        ...(formData.password ? { password: formData.password } : {})
      }

      if (formData.id) {
        await userApi.update(formData.id, payload)
      } else {
        await userApi.create(payload)
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

function handleSelectionChange(selection: User[]) {
  selectedRows.value = selection
}

function handleExport() {
  ElMessage.info('导出功能开发中')
}

onMounted(async () => {
  await loadDepartments()
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
</style>
