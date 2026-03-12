# 快速启动指南

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 前端启动

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录

### 4. 预览生产构建

```bash
npm run preview
```

## 测试账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin | admin123 | 管理员 |
| user | user123 | 普通员工 |

## 项目结构说明

```
frontend/
├── src/
│   ├── api/              # API 接口封装
│   │   └── index.ts      # 所有 API 定义
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── layouts/          # 布局组件
│   │   └── MainLayout.vue
│   ├── router/           # 路由配置
│   │   └── index.ts
│   ├── stores/           # Pinia 状态管理
│   │   └── user.ts       # 用户状态
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/            # 工具函数
│   │   └── request.ts    # Axios 封装
│   ├── views/            # 页面组件
│   │   ├── Login.vue     # 登录页
│   │   ├── Dashboard.vue # 工作台
│   │   ├── attendance/   # 考勤管理
│   │   ├── department/   # 部门管理
│   │   ├── leave/        # 请假管理
│   │   ├── notice/       # 公告管理
│   │   ├── task/         # 任务管理
│   │   └── user/         # 员工管理
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 主要功能

### 1. 用户认证
- JWT Token 认证
- 登录/登出
- 权限控制

### 2. 工作台
- 数据统计卡片
- 快捷入口
- 我的任务
- 最新公告
- 考勤统计

### 3. 员工管理
- 员工列表（分页、搜索、筛选）
- 员工 CRUD 操作
- 批量操作

### 4. 部门管理
- 树形结构展示
- 部门 CRUD
- 子部门管理

### 5. 考勤管理
- 实时时钟显示
- 上班/下班打卡
- 考勤记录查询
- 考勤统计

### 6. 请假管理
- 请假申请
- 审批流程
- 假期余额查询
- 请假记录管理

### 7. 公告管理
- 公告发布
- 公告列表
- 公告详情
- 已读未读状态

### 8. 任务管理
- 任务创建/分配
- 任务状态跟踪
- 任务列表筛选

## API 对接说明

前端已配置 API 代理，开发环境下 `/api` 开头的请求会转发到 `http://localhost:8080`

如需修改后端地址，编辑 `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://your-backend-url:8080',
      changeOrigin: true
    }
  }
}
```

## 状态管理

使用 Pinia 进行状态管理，主要 store:

- `user`: 用户信息、登录状态、Token

## 路由守卫

- 需要认证的页面会自动检查登录状态
- 未登录用户访问受保护页面会重定向到登录页
- 已登录用户访问登录页会重定向到首页

## 样式规范

- 使用 Element Plus 组件库
- 统一的颜色主题
- 响应式布局

## 下一步开发建议

1. **完善后端 API**: 根据 `backend/api-docs.md` 实现后端接口
2. **添加更多组件**: 如个人中心、消息通知等
3. **数据可视化**: 添加 ECharts 图表展示统计数据
4. **移动端适配**: 优化移动端显示效果
5. **国际化**: 添加多语言支持
6. **单元测试**: 添加 Vitest 测试用例
