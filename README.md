# 企业 OA 办公系统

## 项目简介
基于 Vue 3 + TypeScript + Element Plus 的企业办公自动化系统

## 技术栈

### 前端
- Vue 3.4+
- TypeScript 5+
- Element Plus
- Vue Router 4
- Pinia (状态管理)
- Axios (HTTP 请求)
- Vite (构建工具)

### 后端接口
- RESTful API
- JWT 认证
- OpenAPI 3.0 规范

## 功能模块

1. **用户认证**
   - 登录/登出
   - 权限管理
   - 角色控制

2. **员工管理**
   - 员工信息 CRUD
   - 部门管理
   - 岗位管理

3. **考勤管理**
   - 打卡记录
   - 考勤统计
   - 异常处理

4. **请假审批**
   - 请假申请
   - 审批流程
   - 假期余额

5. **公告通知**
   - 公告发布
   - 通知推送
   - 已读未读状态

6. **任务管理**
   - 任务创建/分配
   - 进度跟踪
   - 任务统计

7. **文档管理**
   - 文件上传/下载
   - 文档分类
   - 权限控制

## 快速开始

### 安装依赖
```bash
cd frontend
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

## 项目结构
```
oa-system/
├── frontend/           # 前端项目
│   ├── src/
│   │   ├── api/       # API 接口
│   │   ├── assets/    # 静态资源
│   │   ├── components/# 公共组件
│   │   ├── layouts/   # 布局组件
│   │   ├── router/    # 路由配置
│   │   ├── stores/    # Pinia 状态
│   │   ├── views/     # 页面组件
│   │   ├── types/     # TypeScript 类型
│   │   └── utils/     # 工具函数
│   └── package.json
├── backend/           # 后端接口文档
│   └── api-docs.md
└── README.md
```

## 默认账号
- 管理员：admin / admin123
- 普通用户：user / user123
