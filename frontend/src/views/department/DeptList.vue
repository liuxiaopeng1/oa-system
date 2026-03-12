<template>
  <div class="page-container">
    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增部门
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        :tree-props="{ children: 'children' }"
      >
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="leaderName" label="负责人" width="120" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleAddChild(row)">添加子部门</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="上级部门" prop="parentId">
          <el-tree-select
            v-model="formData.parentId"
            :data="treeData"
            placeholder="选择上级部门"
            check-strictly
            :render-after-expand="false"
            clearable
          />
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="负责人" prop="leaderId">
          <el-select v-model="formData.leaderId" placeholder="请选择负责人" clearable>
            <el-option
              v-for="user in leaderOptions"
              :key="user.id"
              :label="user.realName"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { deptApi, userApi } from '@/api'
import type { Department, User } from '@/types'

type DepartmentNode = Department & { children?: DepartmentNode[] }

interface TreeOption {
  id: number
  label: string
  children?: TreeOption[]
}

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增部门')
const formRef = ref<FormInstance>()
const tableData = ref<DepartmentNode[]>([])
const leaderOptions = ref<User[]>([])

const formData = reactive<Partial<Department>>({
  id: undefined,
  parentId: undefined,
  name: '',
  leaderId: undefined,
  sort: 0,
  status: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

const treeData = computed<TreeOption[]>(() => {
  const mapNode = (list: DepartmentNode[]): TreeOption[] =>
    list.map((item) => ({
      id: item.id,
      label: item.name,
      children: item.children?.length ? mapNode(item.children) : undefined
    }))

  return mapNode(tableData.value)
})

async function loadDepartments() {
  loading.value = true
  try {
    tableData.value = await deptApi.getList()
  } catch {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

async function loadLeaders() {
  try {
    const res = await userApi.getList({ page: 1, pageSize: 1000 })
    leaderOptions.value = res.list
  } catch {
    leaderOptions.value = []
  }
}

function resetForm(parentId?: number) {
  Object.assign(formData, {
    id: undefined,
    parentId,
    name: '',
    leaderId: undefined,
    sort: 0,
    status: 1
  })
}

function handleAdd() {
  dialogTitle.value = '新增部门'
  resetForm()
  dialogVisible.value = true
}

function handleAddChild(row: Department) {
  dialogTitle.value = '新增子部门'
  resetForm(row.id)
  dialogVisible.value = true
}

function handleEdit(row: Department) {
  dialogTitle.value = '编辑部门'
  Object.assign(formData, row)
  dialogVisible.value = true
}

async function handleDelete(row: Department) {
  await ElMessageBox.confirm(`确定要删除部门"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })

  await deptApi.delete(row.id)
  ElMessage.success('删除成功')
  await loadDepartments()
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      const payload = {
        parentId: formData.parentId,
        name: formData.name,
        leaderId: formData.leaderId,
        sort: formData.sort,
        status: formData.status
      }

      if (formData.id) {
        await deptApi.update(formData.id, payload)
      } else {
        await deptApi.create(payload)
      }

      dialogVisible.value = false
      ElMessage.success(formData.id ? '更新成功' : '创建成功')
      await loadDepartments()
    } finally {
      submitLoading.value = false
    }
  })
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

onMounted(async () => {
  await Promise.all([loadDepartments(), loadLeaders()])
})
</script>

<style scoped>
.page-container {
  padding: 0;
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
</style>
