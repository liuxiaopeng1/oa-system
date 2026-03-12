<template>
  <div class="login-page">
    <div class="login-panel">
      <section class="login-brand">
        <div class="brand-chip">Enterprise Workflow Hub</div>
        <h1>企业 OA 协同中枢</h1>
        <p>
          把员工、部门、考勤、请假、公告与任务统一到一个入口。当前前端支持真实后端联调，接口不可用时展示空状态。
        </p>

        <div class="brand-grid">
          <article>
            <strong>组织管理</strong>
            <span>员工、部门、角色、权限菜单</span>
          </article>
          <article>
            <strong>流程协作</strong>
            <span>请假审批、公告分发、任务跟踪</span>
          </article>
          <article>
            <strong>日常办公</strong>
            <span>考勤记录、工作台聚合、消息提醒</span>
          </article>
          <article>
            <strong>后端联调</strong>
            <span>统一走 `/api/v1`，失败时页面不崩溃</span>
          </article>
        </div>
      </section>

      <section class="login-card">
        <div class="card-header">
          <div>
            <div class="eyebrow">Sign In</div>
            <h2>登录系统</h2>
            <p>使用公司账号进入工作台。</p>
          </div>
          <div class="icon-box">
            <el-icon :size="30"><OfficeBuilding /></el-icon>
          </div>
        </div>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              show-password
            />
          </el-form-item>

          <div class="form-row">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <el-button link type="primary" @click="fillDemoAccount">填充测试账号</el-button>
          </div>

          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            进入工作台
          </el-button>
        </el-form>

        <div class="login-tips">
          <div class="tip-title">测试账号</div>
          <div class="tip-value">admin / admin123</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, OfficeBuilding, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import type { LoginRequest } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive<LoginRequest & { remember: boolean }>({
  username: '',
  password: '',
  remember: false
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' }
  ]
}

function fillDemoAccount() {
  loginForm.username = 'admin'
  loginForm.password = 'admin123'
}

async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.login({
        username: loginForm.username,
        password: loginForm.password
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('登录失败:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 28px;
}

.login-panel {
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.12);
}

.login-brand {
  position: relative;
  padding: 56px;
  background:
    radial-gradient(circle at top left, rgba(106, 146, 255, 0.35), transparent 28%),
    linear-gradient(160deg, #123a8f 0%, #0b1d44 55%, #09152c 100%);
  color: #f7fbff;
}

.brand-chip {
  display: inline-flex;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-brand h1 {
  margin-top: 26px;
  font-size: 48px;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.login-brand p {
  margin-top: 18px;
  max-width: 520px;
  color: rgba(247, 251, 255, 0.76);
  line-height: 1.8;
  font-size: 15px;
}

.brand-grid {
  margin-top: 42px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.brand-grid article {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-grid strong {
  display: block;
  margin-bottom: 8px;
  font-size: 17px;
}

.brand-grid span {
  color: rgba(247, 251, 255, 0.74);
  line-height: 1.7;
  font-size: 14px;
}

.login-card {
  padding: 48px;
  background: rgba(255, 255, 255, 0.94);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.eyebrow {
  color: var(--oa-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.card-header h2 {
  margin-top: 10px;
  font-size: 34px;
  line-height: 1.1;
}

.card-header p {
  margin-top: 10px;
  color: var(--oa-muted);
}

.icon-box {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: var(--oa-primary-soft);
  color: var(--oa-primary);
}

.login-form {
  margin-top: 34px;
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  font-weight: 600;
}

.login-tips {
  margin-top: 28px;
  padding: 18px 20px;
  border-radius: 18px;
  background: #f6f8fb;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.tip-title {
  color: var(--oa-muted);
  font-size: 13px;
}

.tip-value {
  margin-top: 8px;
  color: var(--oa-text);
  font-size: 16px;
  font-weight: 700;
}

@media (max-width: 980px) {
  .login-panel {
    grid-template-columns: 1fr;
  }

  .login-brand {
    padding: 36px 28px;
  }

  .login-brand h1 {
    font-size: 34px;
  }

  .brand-grid {
    grid-template-columns: 1fr;
  }

  .login-card {
    padding: 32px 24px;
  }
}
</style>
