# OA 系统后端 API 接口文档

## 基本信息

- **版本**: 1.0.0
- **基础路径**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 前端联调约定

当前前端已经按真实接口模式接入，所有读取类页面默认请求 `/api/v1`。为了避免页面白屏或字段错位，后端实现建议遵守以下约定：

### 1. 通用约定

- 所有成功响应统一返回 `code = 200`
- 分页列表统一返回：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 0,
    "page": 1,
    "pageSize": 10
  }
}
```

- 即使没有数据，也请返回空数组或 `0`，不要返回 `null`
- 时间字段统一建议使用字符串格式：`YYYY-MM-DD HH:mm:ss`
- 日期字段统一建议使用：`YYYY-MM-DD`
- 月份参数统一使用：`YYYY-MM`

### 2. 当前前端强依赖字段

#### 2.1 登录与当前用户

- `token`
- `user.id`
- `user.username`
- `user.realName`
- `user.roleName`
- `user.departmentName`

#### 2.2 菜单

前端支持菜单接口为空时回退默认菜单，但若后端返回菜单，建议至少包含：

- `id`
- `name`
- `path`
- `icon`
- `sort`
- `hidden`

#### 2.3 工作台

工作台当前会聚合以下接口：

- `GET /users`：读取 `total`
- `GET /tasks`：读取 `list`
- `GET /notices`：读取 `list`、`total`
- `GET /leaves?status=pending`：读取 `total`
- `GET /attendance/stats/{userId}`：读取
  - `actualWorkDays`
  - `lateCount`
  - `earlyCount`
  - `leaveDays`

#### 2.4 考勤页面

`GET /attendance` 的列表项前端使用：

- `id`
- `date`
- `clockInTime`
- `clockOutTime`
- `workHours`
- `status`
- `remark`

`GET /attendance/stats/{userId}` 前端使用：

- `shouldWorkDays`
- `actualWorkDays`
- `lateCount`
- `earlyCount`
- `absentCount`
- `leaveDays`
- `overtimeHours`

#### 2.5 请假页面

`GET /leaves` 的列表项前端使用：

- `id`
- `userName`
- `type`
- `typeName`
- `startDate`
- `endDate`
- `days`
- `reason`
- `status`
- `statusName`
- `createTime`

`GET /leaves/balance/{userId}` 前端使用：

- `balances[].type`
- `balances[].typeName`
- `balances[].totalDays`
- `balances[].usedDays`
- `balances[].remainingDays`

#### 2.6 公告页面

`GET /notices` / `GET /notices/{id}` 前端使用：

- `id`
- `title`
- `content`
- `publisherName`
- `priority`
- `priorityName`
- `status`
- `viewCount`
- `createTime`
- `isRead`

#### 2.7 任务页面

`GET /tasks` 的列表项前端使用：

- `id`
- `title`
- `description`
- `assigneeId`
- `assigneeName`
- `priority`
- `priorityName`
- `status`
- `statusName`
- `dueDate`
- `createTime`

#### 2.8 用户和部门页面

`GET /users` 列表项前端使用：

- `id`
- `username`
- `realName`
- `email`
- `phone`
- `departmentId`
- `departmentName`
- `roleId`
- `roleName`
- `status`
- `createTime`

`GET /departments` 列表项前端使用：

- `id`
- `name`
- `parentId`
- `parentName`
- `leaderId`
- `leaderName`
- `sort`
- `status`
- `createTime`
- `children`

## 认证说明

所有需要认证的接口需要在请求头中携带 Token:

```
Authorization: Bearer <token>
```

## 统一响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 禁止访问，权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 1. 认证模块

### 1.1 用户登录

**接口**: `POST /auth/login`

**请求参数**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "管理员",
      "email": "admin@company.com",
      "phone": "13800138000",
      "avatar": "https://example.com/avatar.jpg",
      "departmentId": 1,
      "departmentName": "技术部",
      "roleId": 1,
      "roleName": "管理员",
      "status": 1,
      "createTime": "2025-01-01 00:00:00"
    }
  }
}
```

### 1.2 用户登出

**接口**: `POST /auth/logout`

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "退出成功",
  "data": null
}
```

### 1.3 获取当前用户信息

**接口**: `GET /auth/info`

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "管理员",
    "email": "admin@company.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "departmentId": 1,
    "departmentName": "技术部",
    "roleId": 1,
    "roleName": "管理员",
    "status": 1,
    "createTime": "2025-01-01 00:00:00"
  }
}
```

### 1.4 刷新 Token

**接口**: `POST /auth/refresh`

**实现约定**:
- refresh token 采用服务端持久化会话模型
- 后端应校验 token 是否存在、是否过期、是否已吊销
- 建议会话数据落表到 `user_sessions`

**请求参数**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. 用户管理模块

### 2.1 获取用户列表

**接口**: `GET /users`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |
| keyword | string | 否 | 搜索关键词（姓名/用户名） |
| departmentId | number | 否 | 部门 ID |
| status | number | 否 | 状态：1-在职，0-离职 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "realName": "管理员",
        "email": "admin@company.com",
        "phone": "13800138000",
        "departmentId": 1,
        "departmentName": "技术部",
        "roleId": 1,
        "roleName": "管理员",
        "status": 1,
        "createTime": "2025-01-01 00:00:00"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2.2 获取用户详情

**接口**: `GET /users/{id}`

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 用户 ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "realName": "管理员",
    "email": "admin@company.com",
    "phone": "13800138000",
    "departmentId": 1,
    "departmentName": "技术部",
    "roleId": 1,
    "roleName": "管理员",
    "status": 1,
    "createTime": "2025-01-01 00:00:00"
  }
}
```

### 2.3 创建用户

**接口**: `POST /users`

**请求参数**:
```json
{
  "username": "zhangsan",
  "password": "123456",
  "realName": "张三",
  "email": "zhangsan@company.com",
  "phone": "13800138001",
  "departmentId": 1,
  "roleId": 2,
  "status": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 2,
    "username": "zhangsan",
    "realName": "张三"
  }
}
```

### 2.4 更新用户

**接口**: `PUT /users/{id}`

**路径参数**: id - 用户 ID

**请求参数**:
```json
{
  "realName": "张三",
  "email": "zhangsan@company.com",
  "phone": "13800138001",
  "departmentId": 1,
  "roleId": 2,
  "status": 1
}
```

### 2.5 删除用户

**接口**: `DELETE /users/{id}`

**路径参数**: id - 用户 ID

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

### 2.6 重置用户密码

**接口**: `POST /users/{id}/reset-password`

**请求参数**:
```json
{
  "password": "newpassword123"
}
```

---

## 3. 部门管理模块

### 3.1 获取部门列表

**接口**: `GET /departments`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| parentId | number | 否 | 父部门 ID，不传则获取所有 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "总公司",
      "parentId": null,
      "parentName": null,
      "leaderId": 1,
      "leaderName": "管理员",
      "sort": 1,
      "status": 1,
      "createTime": "2025-01-01 00:00:00",
      "children": [
        {
          "id": 11,
          "name": "技术部",
          "parentId": 1,
          "leaderId": 2,
          "leaderName": "张三",
          "sort": 1,
          "status": 1
        }
      ]
    }
  ]
}
```

### 3.2 创建部门

**接口**: `POST /departments`

**请求参数**:
```json
{
  "name": "研发部",
  "parentId": 1,
  "leaderId": 2,
  "sort": 1,
  "status": 1
}
```

### 3.3 更新部门

**接口**: `PUT /departments/{id}`

### 3.4 删除部门

**接口**: `DELETE /departments/{id}`

---

## 4. 考勤管理模块

### 4.1 上班打卡

**接口**: `POST /attendance/clock-in`

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "message": "打卡成功",
  "data": {
    "id": 1,
    "userId": 1,
    "date": "2026-03-11",
    "clockInTime": "09:00:00",
    "status": "normal"
  }
}
```

### 4.2 下班打卡

**接口**: `POST /attendance/clock-out`

**响应示例**:
```json
{
  "code": 200,
  "message": "打卡成功",
  "data": {
    "id": 1,
    "userId": 1,
    "date": "2026-03-11",
    "clockInTime": "09:00:00",
    "clockOutTime": "18:00:00",
    "workHours": 9,
    "status": "normal"
  }
}
```

### 4.3 获取考勤列表

**接口**: `GET /attendance`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| userId | number | 否 | 用户 ID |
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "userId": 1,
        "userName": "张三",
        "date": "2026-03-11",
        "clockInTime": "09:00:00",
        "clockOutTime": "18:00:00",
        "workHours": 9,
        "status": "normal"
      }
    ],
    "total": 22,
    "page": 1,
    "pageSize": 10
  }
}
```

### 4.4 获取考勤统计

**接口**: `GET /attendance/stats/{userId}`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| month | string | 否 | 月份 (YYYY-MM)，默认当前月 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "month": "2026-03",
    "shouldWorkDays": 22,
    "actualWorkDays": 20,
    "lateCount": 2,
    "earlyCount": 1,
    "absentCount": 0,
    "leaveDays": 1,
    "overtimeHours": 5
  }
}
```

### 4.5 考勤异常申诉

**接口**: `POST /attendance/{id}/appeal`

**请求参数**:
```json
{
  "reason": "因地铁故障导致迟到",
  "proofImages": ["url1", "url2"]
}
```

---

## 5. 请假管理模块

### 5.1 获取请假列表

**接口**: `GET /leaves`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| userId | number | 否 | 用户 ID |
| type | string | 否 | 请假类型 |
| status | string | 否 | 审批状态 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "userId": 1,
        "userName": "张三",
        "type": "annual",
        "typeName": "年假",
        "startDate": "2026-03-15",
        "endDate": "2026-03-17",
        "days": 3,
        "reason": "回家探亲",
        "status": "pending",
        "statusName": "待审批",
        "createTime": "2026-03-10 10:00:00"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 10
  }
}
```

### 5.2 创建请假申请

**接口**: `POST /leaves`

**请求参数**:
```json
{
  "type": "annual",
  "startDate": "2026-03-15",
  "endDate": "2026-03-17",
  "days": 3,
  "reason": "回家探亲",
  "attachmentUrls": ["url1", "url2"]
}
```

### 5.3 审批请假

**接口**: `POST /leaves/{id}/approve`

**请求参数**:
```json
{
  "approved": true,
  "comment": "同意"
}
```

### 5.4 获取假期余额

**接口**: `GET /leaves/balance/{userId}`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": 1,
    "year": 2026,
    "balances": [
      {
        "type": "annual",
        "typeName": "年假",
        "totalDays": 10,
        "usedDays": 3,
        "remainingDays": 7
      },
      {
        "type": "sick",
        "typeName": "病假",
        "totalDays": 15,
        "usedDays": 2,
        "remainingDays": 13
      },
      {
        "type": "personal",
        "typeName": "事假",
        "totalDays": 5,
        "usedDays": 1,
        "remainingDays": 4
      }
    ]
  }
}
```

### 5.5 撤销请假申请

**接口**: `POST /leaves/{id}/cancel`

**适用条件**: 仅待审批状态的申请可撤销

**说明**:
- 当前前端不使用 `DELETE /leaves/{id}`
- 请假记录默认保留，撤销通过状态流转实现，便于审计与统计

---

## 6. 公告管理模块

### 6.1 获取公告列表

**接口**: `GET /notices`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| keyword | string | 否 | 标题关键词 |
| priority | string | 否 | 优先级 |
| status | number | 否 | 状态 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "关于清明节放假安排的通知",
        "content": "根据公司安排...",
        "publisherId": 1,
        "publisherName": "行政部",
        "priority": "high",
        "priorityName": "紧急",
        "status": 1,
        "viewCount": 128,
        "createTime": "2026-03-10 10:00:00",
        "isRead": false
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10
  }
}
```

### 6.2 获取公告详情

**接口**: `GET /notices/{id}`

**说明**:
- 此接口为纯查询接口，不应产生副作用
- 返回详情时应带回当前登录用户的 `isRead`
- 阅读数变更统一通过 `POST /notices/{id}/read` 处理

### 6.3 创建公告

**接口**: `POST /notices`

**请求参数**:
```json
{
  "title": "关于 XXX 的通知",
  "content": "公告内容...",
  "priority": "medium",
  "status": 1,
  "notifyUsers": [1, 2, 3]
}
```

### 6.4 更新公告

**接口**: `PUT /notices/{id}`

### 6.5 删除公告

**接口**: `DELETE /notices/{id}`

### 6.6 标记为已读

**接口**: `POST /notices/{id}/read`

**说明**:
- 首次标记已读时写入 `notice_reads`
- 若尚未读取过该公告，可同步递增 `notices.view_count`
- 重复调用应保持幂等

### 6.7 批量标记已读

**接口**: `POST /notices/read-batch`

**请求参数**:
```json
{
  "ids": [1, 2, 3]
}
```

---

## 7. 任务管理模块

### 7.1 获取任务列表

**接口**: `GET /tasks`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页数量 |
| keyword | string | 否 | 任务名称 |
| assigneeId | number | 否 | 负责人 ID |
| priority | string | 否 | 优先级 |
| status | string | 否 | 状态 |
| dueDateStart | string | 否 | 截止日期开始 |
| dueDateEnd | string | 否 | 截止日期结束 |

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "完成季度报告",
        "description": "编写 Q1 季度工作总结报告",
        "assignerId": 1,
        "assignerName": "管理员",
        "assigneeId": 2,
        "assigneeName": "张三",
        "priority": "high",
        "priorityName": "高",
        "status": "inprogress",
        "statusName": "进行中",
        "dueDate": "2026-03-15",
        "createTime": "2026-03-01 10:00:00"
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10
  }
}
```

### 7.2 创建任务

**接口**: `POST /tasks`

**请求参数**:
```json
{
  "title": "任务名称",
  "description": "任务描述",
  "assigneeId": 2,
  "priority": "medium",
  "dueDate": "2026-03-20",
  "attachmentUrls": ["url1"]
}
```

### 7.3 更新任务

**接口**: `PUT /tasks/{id}`

### 7.4 更新任务状态

**接口**: `PUT /tasks/{id}/status`

**请求参数**:
```json
{
  "status": "done"
}
```

### 7.5 删除任务

**接口**: `DELETE /tasks/{id}`

### 7.6 获取任务统计

**接口**: `GET /tasks/stats`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 50,
    "todo": 15,
    "inprogress": 20,
    "done": 15,
    "overdue": 3
  }
}
```

---

## 8. 菜单权限模块

### 8.1 获取当前用户菜单

**接口**: `GET /menus`

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "工作台",
      "path": "/dashboard",
      "icon": "HomeFilled",
      "parentId": null,
      "sort": 1,
      "hidden": false,
      "children": []
    },
    {
      "id": 2,
      "name": "员工管理",
      "path": "/users",
      "icon": "User",
      "parentId": null,
      "sort": 2,
      "hidden": false,
      "children": []
    }
  ]
}
```

### 8.2 获取角色列表

**接口**: `GET /roles`

### 8.3 创建角色

**接口**: `POST /roles`

### 8.4 更新角色权限

**接口**: `PUT /roles/{id}/menus`

**请求参数**:
```json
{
  "menuIds": [1, 2, 3, 4]
}
```

---

## 9. 文件上传模块

### 9.1 单文件上传

**接口**: `POST /upload`

**Content-Type**: `multipart/form-data`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 文件 |
| folder | string | 否 | 文件夹路径 |

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "https://example.com/files/2026/03/xxx.jpg",
    "filename": "original.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  }
}
```

### 9.2 多文件上传

**接口**: `POST /upload/batch`

### 9.3 删除文件

**接口**: `DELETE /files/{id}`

---

## 10. 系统配置模块

### 10.1 获取系统配置

**接口**: `GET /settings`

### 10.2 更新系统配置

**接口**: `PUT /settings`

**请求参数**:
```json
{
  "companyName": "XXX 公司",
  "workStartTime": "09:00",
  "workEndTime": "18:00",
  "leaveTypes": ["年假", "病假", "事假"],
  "allowClockInEarly": 30
}
```

---

## 附录

### 用户角色返回约定

- 当前前端用户对象仅消费单个 `roleId`、`roleName`
- 后端若内部支持多角色，应以 `users.primary_role_id` 作为接口主返回角色
- `user_roles` 用于权限扩展，不直接改变当前前端返回结构

### 请假类型枚举

| 值 | 说明 |
|------|------|
| annual | 年假 |
| sick | 病假 |
| personal | 事假 |
| marriage | 婚假 |
| maternity | 产假 |
| paternity | 陪产假 |
| bereavement | 丧假 |

### 考勤状态枚举

| 值 | 说明 |
|------|------|
| normal | 正常 |
| late | 迟到 |
| early | 早退 |
| absent | 缺卡 |

### 任务优先级枚举

| 值 | 说明 |
|------|------|
| high | 高 |
| medium | 中 |
| low | 低 |

### 任务状态枚举

| 值 | 说明 |
|------|------|
| todo | 待办 |
| inprogress | 进行中 |
| done | 已完成 |
| cancelled | 已取消 |

### 公告优先级枚举

| 值 | 说明 |
|------|------|
| low | 普通 |
| medium | 重要 |
| high | 紧急 |
