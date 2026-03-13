# OA 系统数据库设计文档

## 1. 设计目标

本文档按当前前端真实联调需求重新整理，目标是支撑以下模块：

- 认证与当前用户信息
- 菜单与角色权限
- 员工与部门管理
- 考勤与考勤统计
- 请假申请与假期余额
- 公告发布与已读状态
- 任务管理与状态流转
- 系统配置与操作日志

当前前端请求统一走 `/api/v1`，并依赖 [api-docs.md](/Users/liuxiaopeng/Downloads/oa-system/backend/api-docs.md) 中约定的字段结构。数据库设计优先保证：

1. 前端字段可稳定映射
2. 列表查询与统计查询好写
3. 菜单、组织、流程三类数据边界清晰

---

## 2. 数据库约定

- 数据库：MySQL 8.0+
- 字符集：`utf8mb4`
- 排序规则：`utf8mb4_unicode_ci`
- 主键：统一使用 `BIGINT UNSIGNED`
- 时间字段：
  - `created_at`
  - `updated_at`
- 软删除：
  - 核心业务表统一保留 `deleted_at`
- 审计字段：
  - 关键业务表建议增加 `created_by`、`updated_by`

推荐统一建表选项：

```sql
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

---

## 3. 模块关系总览

### 3.1 组织权限

- `users`
- `departments`
- `roles`
- `menus`
- `user_roles`
- `role_menus`

### 3.2 日常办公

- `attendance_records`
- `attendance_appeals`
- `leave_requests`
- `leave_balances`
- `notices`
- `notice_reads`
- `tasks`
- `task_logs`

### 3.3 系统支撑

- `user_sessions`
- `files`
- `settings`
- `operation_logs`

---

## 4. 核心表结构

### 4.1 用户表 `users`

用途：
- 登录认证
- 当前用户信息
- 员工管理列表
- 部门负责人、任务负责人、公告发布人等外键来源

```sql
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码哈希（bcrypt/argon2）',
  `real_name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
  `department_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '所属部门 ID',
  `primary_role_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '主角色 ID，便于前端直接展示 roleName',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-在职，0-离职',
  `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(64) DEFAULT NULL COMMENT '最后登录 IP',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人',
  `updated_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_phone` (`phone`),
  KEY `idx_users_department_id` (`department_id`),
  KEY `idx_users_primary_role_id` (`primary_role_id`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';
```

前端核心映射字段：

- `id`
- `username`
- `realName`
- `email`
- `phone`
- `avatar`
- `departmentId`
- `departmentName`
- `roleId`
- `roleName`
- `status`
- `createTime`

实现建议：
- 前端返回时可通过连表或视图补出 `departmentName`、`roleName`
- 若支持多角色，接口响应仍建议保留一个主角色字段给前端直接用
- 当前接口层的 `roleId`、`roleName` 应固定映射 `primary_role_id`

---

### 4.2 部门表 `departments`

用途：
- 部门树
- 部门管理
- 用户列表中的部门名称

```sql
CREATE TABLE `departments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(100) NOT NULL COMMENT '部门名称',
  `parent_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '父部门 ID',
  `leader_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '负责人 ID',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人',
  `updated_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新人',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_departments_parent_id` (`parent_id`),
  KEY `idx_departments_leader_id` (`leader_id`),
  KEY `idx_departments_status` (`status`),
  KEY `idx_departments_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='部门表';
```

前端核心映射字段：

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

实现建议：
- `/departments` 接口可在 service 层组装树结构，不一定依赖嵌套存储

---

### 4.3 角色表 `roles`

用途：
- 菜单权限
- 用户角色展示

```sql
CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
  `code` VARCHAR(50) NOT NULL COMMENT '角色编码',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_roles_name` (`name`),
  UNIQUE KEY `uk_roles_code` (`code`),
  KEY `idx_roles_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';
```

---

### 4.4 用户角色关联表 `user_roles`

用途：
- 支持一个用户多个角色

```sql
CREATE TABLE `user_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色 ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_roles_user_role` (`user_id`, `role_id`),
  KEY `idx_user_roles_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';
```

实现建议：
- 当前前端仅消费单角色展示
- `user_roles` 主要用于权限扩展、后台配置和未来多角色场景
- `/users`、`/auth/info` 返回的 `roleId`、`roleName` 应以主角色为准

---

### 4.5 菜单表 `menus`

用途：
- 左侧导航
- 路由级权限

```sql
CREATE TABLE `menus` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(50) NOT NULL COMMENT '菜单名称',
  `path` VARCHAR(120) NOT NULL COMMENT '路由路径',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标名称',
  `parent_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '父级菜单 ID',
  `permission_code` VARCHAR(100) DEFAULT NULL COMMENT '权限标识',
  `type` TINYINT NOT NULL DEFAULT 1 COMMENT '类型：1-目录，2-菜单，3-按钮',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `hidden` TINYINT NOT NULL DEFAULT 0 COMMENT '是否隐藏：0-显示，1-隐藏',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_menus_parent_id` (`parent_id`),
  KEY `idx_menus_type` (`type`),
  KEY `idx_menus_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单表';
```

前端核心映射字段：

- `id`
- `name`
- `path`
- `icon`
- `parentId`
- `sort`
- `hidden`
- `children`

---

### 4.6 角色菜单关联表 `role_menus`

```sql
CREATE TABLE `role_menus` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色 ID',
  `menu_id` BIGINT UNSIGNED NOT NULL COMMENT '菜单 ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_menus_role_menu` (`role_id`, `menu_id`),
  KEY `idx_role_menus_menu_id` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色菜单关联表';
```

---

### 4.7 用户会话表 `user_sessions`

用途：
- 支撑 refresh token
- 支撑主动下线、单端控制、会话吊销

```sql
CREATE TABLE `user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `refresh_token` VARCHAR(512) NOT NULL COMMENT '刷新令牌',
  `device_type` VARCHAR(50) DEFAULT NULL COMMENT '设备类型',
  `device_name` VARCHAR(100) DEFAULT NULL COMMENT '设备名称',
  `ip_address` VARCHAR(64) DEFAULT NULL COMMENT '登录 IP',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '客户端标识',
  `expires_at` DATETIME NOT NULL COMMENT '过期时间',
  `revoked_at` DATETIME DEFAULT NULL COMMENT '吊销时间',
  `last_used_at` DATETIME DEFAULT NULL COMMENT '最近使用时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sessions_refresh_token` (`refresh_token`),
  KEY `idx_user_sessions_user_id` (`user_id`),
  KEY `idx_user_sessions_expires_at` (`expires_at`),
  KEY `idx_user_sessions_revoked_at` (`revoked_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会话表';
```

实现建议：
- `POST /auth/refresh` 校验 `refresh_token` 是否存在且未吊销
- `POST /auth/logout` 可按当前会话写入 `revoked_at`
- 若不想保存原始 refresh token，可保存其哈希值

---

## 5. 日常办公模块

### 5.1 考勤记录表 `attendance_records`

用途：
- 上下班打卡
- 考勤记录列表
- 月度统计

```sql
CREATE TABLE `attendance_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `date` DATE NOT NULL COMMENT '考勤日期',
  `clock_in_time` TIME DEFAULT NULL COMMENT '上班打卡时间',
  `clock_out_time` TIME DEFAULT NULL COMMENT '下班打卡时间',
  `work_hours` DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT '工作时长',
  `status` ENUM('normal', 'late', 'early', 'absent') NOT NULL DEFAULT 'normal' COMMENT '状态',
  `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_attendance_records_user_date` (`user_id`, `date`),
  KEY `idx_attendance_records_date` (`date`),
  KEY `idx_attendance_records_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤记录表';
```

前端核心映射字段：

- `id`
- `userId`
- `userName`
- `date`
- `clockInTime`
- `clockOutTime`
- `workHours`
- `status`
- `remark`

统计口径建议：
- `shouldWorkDays`：按当月工作日或配置表计算
- `actualWorkDays`：有效打卡天数
- `lateCount`：状态 `late`
- `earlyCount`：状态 `early`
- `absentCount`：状态 `absent`
- `leaveDays`：联动请假表统计

---

### 5.2 考勤申诉表 `attendance_appeals`

```sql
CREATE TABLE `attendance_appeals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `attendance_record_id` BIGINT UNSIGNED NOT NULL COMMENT '考勤记录 ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '申诉人 ID',
  `reason` TEXT NOT NULL COMMENT '申诉原因',
  `proof_images` JSON DEFAULT NULL COMMENT '图片凭证',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '审批状态',
  `comment` VARCHAR(255) DEFAULT NULL COMMENT '审批意见',
  `approver_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审批人',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_attendance_appeals_record_id` (`attendance_record_id`),
  KEY `idx_attendance_appeals_user_id` (`user_id`),
  KEY `idx_attendance_appeals_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤申诉表';
```

---

### 5.3 请假申请表 `leave_requests`

用途：
- 请假列表
- 请假审批
- 工作台待审批统计

```sql
CREATE TABLE `leave_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '申请人 ID',
  `type` ENUM('annual', 'sick', 'personal', 'marriage', 'maternity', 'paternity', 'bereavement') NOT NULL COMMENT '请假类型',
  `start_date` DATE NOT NULL COMMENT '开始日期',
  `end_date` DATE NOT NULL COMMENT '结束日期',
  `days` DECIMAL(5,1) NOT NULL COMMENT '请假天数',
  `reason` TEXT NOT NULL COMMENT '请假原因',
  `attachment_urls` JSON DEFAULT NULL COMMENT '附件地址数组',
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `comment` VARCHAR(255) DEFAULT NULL COMMENT '审批意见',
  `approver_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审批人 ID',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_leave_requests_user_id` (`user_id`),
  KEY `idx_leave_requests_type` (`type`),
  KEY `idx_leave_requests_status` (`status`),
  KEY `idx_leave_requests_dates` (`start_date`, `end_date`),
  KEY `idx_leave_requests_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='请假申请表';
```

前端核心映射字段：

- `id`
- `userId`
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

实现建议：
- 请假记录默认不建议物理删除
- 前端“撤销申请”对应 `status = 'cancelled'`
- 仅待审批记录允许撤销

---

### 5.4 假期余额表 `leave_balances`

用途：
- 请假页面中的“假期余额”

```sql
CREATE TABLE `leave_balances` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `year` SMALLINT NOT NULL COMMENT '年份',
  `type` ENUM('annual', 'sick', 'personal', 'marriage', 'maternity', 'paternity', 'bereavement') NOT NULL COMMENT '类型',
  `total_days` DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT '总天数',
  `used_days` DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT '已用天数',
  `remaining_days` DECIMAL(5,1) NOT NULL DEFAULT 0 COMMENT '剩余天数',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_leave_balances_user_year_type` (`user_id`, `year`, `type`),
  KEY `idx_leave_balances_year` (`year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='假期余额表';
```

---

### 5.5 公告表 `notices`

用途：
- 公告列表
- 公告详情
- 工作台最新公告

```sql
CREATE TABLE `notices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `content` TEXT NOT NULL COMMENT '内容',
  `publisher_id` BIGINT UNSIGNED NOT NULL COMMENT '发布人 ID',
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium' COMMENT '优先级',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-已发布，0-草稿',
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '阅读数',
  `publish_time` DATETIME DEFAULT NULL COMMENT '发布时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_notices_publisher_id` (`publisher_id`),
  KEY `idx_notices_priority` (`priority`),
  KEY `idx_notices_status` (`status`),
  KEY `idx_notices_publish_time` (`publish_time`),
  KEY `idx_notices_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';
```

前端核心映射字段：

- `id`
- `title`
- `content`
- `publisherId`
- `publisherName`
- `priority`
- `priorityName`
- `status`
- `viewCount`
- `createTime`
- `isRead`

实现建议：
- `createTime` 可优先返回 `publish_time`，若为空再退回 `created_at`

---

### 5.6 公告阅读表 `notice_reads`

```sql
CREATE TABLE `notice_reads` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `notice_id` BIGINT UNSIGNED NOT NULL COMMENT '公告 ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户 ID',
  `read_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notice_reads_notice_user` (`notice_id`, `user_id`),
  KEY `idx_notice_reads_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告阅读记录表';
```

实现建议：
- `GET /notices/{id}` 只查询详情与已读状态，不写入本表
- `POST /notices/{id}/read` 首次调用时插入记录
- 阅读数 `view_count` 应与首次已读保持一致，避免重复累计

---

### 5.7 任务表 `tasks`

用途：
- 任务列表
- 状态流转
- 工作台任务面板

```sql
CREATE TABLE `tasks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` VARCHAR(200) NOT NULL COMMENT '任务标题',
  `description` TEXT DEFAULT NULL COMMENT '任务描述',
  `assigner_id` BIGINT UNSIGNED NOT NULL COMMENT '指派人 ID',
  `assignee_id` BIGINT UNSIGNED NOT NULL COMMENT '负责人 ID',
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium' COMMENT '优先级',
  `status` ENUM('todo', 'inprogress', 'done', 'cancelled') NOT NULL DEFAULT 'todo' COMMENT '状态',
  `due_date` DATE DEFAULT NULL COMMENT '截止日期',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `attachment_urls` JSON DEFAULT NULL COMMENT '附件地址数组',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_tasks_assigner_id` (`assigner_id`),
  KEY `idx_tasks_assignee_id` (`assignee_id`),
  KEY `idx_tasks_priority` (`priority`),
  KEY `idx_tasks_status` (`status`),
  KEY `idx_tasks_due_date` (`due_date`),
  KEY `idx_tasks_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';
```

前端核心映射字段：

- `id`
- `title`
- `description`
- `assignerId`
- `assignerName`
- `assigneeId`
- `assigneeName`
- `priority`
- `priorityName`
- `status`
- `statusName`
- `dueDate`
- `createTime`

---

### 5.8 任务日志表 `task_logs`

```sql
CREATE TABLE `task_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `task_id` BIGINT UNSIGNED NOT NULL COMMENT '任务 ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '操作人 ID',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `content` TEXT DEFAULT NULL COMMENT '操作内容',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_task_logs_task_id` (`task_id`),
  KEY `idx_task_logs_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务日志表';
```

---

## 6. 系统支撑表

### 6.1 文件表 `files`

```sql
CREATE TABLE `files` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '上传人 ID',
  `filename` VARCHAR(255) NOT NULL COMMENT '存储文件名',
  `original_name` VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
  `url` VARCHAR(500) NOT NULL COMMENT '文件访问地址',
  `size` BIGINT UNSIGNED NOT NULL COMMENT '文件大小',
  `mime_type` VARCHAR(100) DEFAULT NULL COMMENT 'MIME 类型',
  `folder` VARCHAR(255) DEFAULT NULL COMMENT '文件夹',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_files_user_id` (`user_id`),
  KEY `idx_files_folder` (`folder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';
```

---

### 6.2 系统配置表 `settings`

如果你的后端想保持接口文档中的 `/settings` 是对象形式，推荐采用“单表多 key”方案。

```sql
CREATE TABLE `settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT DEFAULT NULL COMMENT '配置值',
  `value_type` VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT '值类型',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settings_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';
```

推荐内置配置：

- `company_name`
- `work_start_time`
- `work_end_time`
- `allow_clock_in_early`
- `leave_apply_days_limit`

---

### 6.3 操作日志表 `operation_logs`

```sql
CREATE TABLE `operation_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人 ID',
  `module` VARCHAR(50) DEFAULT NULL COMMENT '模块',
  `action` VARCHAR(50) DEFAULT NULL COMMENT '操作类型',
  `request_method` VARCHAR(10) DEFAULT NULL COMMENT '请求方法',
  `request_path` VARCHAR(255) DEFAULT NULL COMMENT '请求路径',
  `ip` VARCHAR(64) DEFAULT NULL COMMENT 'IP 地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器标识',
  `request_data` JSON DEFAULT NULL COMMENT '请求数据',
  `response_code` INT DEFAULT NULL COMMENT '响应码',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_operation_logs_user_id` (`user_id`),
  KEY `idx_operation_logs_module` (`module`),
  KEY `idx_operation_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';
```

---

## 7. 外键关系建议

说明：
- 是否真正加数据库外键，你可以自己决定
- 若追求写入性能与部署灵活性，可以只建索引，在业务层保证一致性

主要关系：

- `users.department_id -> departments.id`
- `users.primary_role_id -> roles.id`
- `user_roles.user_id -> users.id`
- `user_roles.role_id -> roles.id`
- `role_menus.role_id -> roles.id`
- `role_menus.menu_id -> menus.id`
- `departments.parent_id -> departments.id`
- `departments.leader_id -> users.id`
- `attendance_records.user_id -> users.id`
- `attendance_appeals.attendance_record_id -> attendance_records.id`
- `leave_requests.user_id -> users.id`
- `leave_requests.approver_id -> users.id`
- `leave_balances.user_id -> users.id`
- `notices.publisher_id -> users.id`
- `notice_reads.notice_id -> notices.id`
- `notice_reads.user_id -> users.id`
- `tasks.assigner_id -> users.id`
- `tasks.assignee_id -> users.id`
- `task_logs.task_id -> tasks.id`
- `task_logs.user_id -> users.id`

---

## 8. 索引建议

### 8.1 列表查询常用索引

- `users(status, department_id, deleted_at)`
- `leave_requests(status, user_id, start_date, end_date, deleted_at)`
- `attendance_records(user_id, date)`
- `notices(status, publish_time, deleted_at)`
- `tasks(status, assignee_id, due_date, deleted_at)`

### 8.2 工作台统计常用索引

- `leave_requests(status, deleted_at)`
- `notice_reads(user_id, read_at)`
- `attendance_records(user_id, date, status)`

### 8.3 组织树常用索引

- `departments(parent_id, status, deleted_at)`
- `menus(parent_id, sort, status)`

---

## 9. 初始数据建议

### 9.1 角色初始化

```sql
INSERT INTO `roles` (`name`, `code`, `description`, `sort`, `status`) VALUES
('超级管理员', 'super_admin', '拥有系统全部权限', 1, 1),
('管理员', 'admin', '系统管理员', 2, 1),
('部门经理', 'manager', '部门管理者', 3, 1),
('普通员工', 'employee', '普通员工', 4, 1);
```

### 9.2 部门初始化

```sql
INSERT INTO `departments` (`id`, `name`, `parent_id`, `leader_id`, `sort`, `status`) VALUES
(1, '总公司', NULL, NULL, 1, 1),
(11, '技术部', 1, NULL, 1, 1),
(12, '市场部', 1, NULL, 2, 1),
(13, '人事部', 1, NULL, 3, 1),
(14, '财务部', 1, NULL, 4, 1);
```

### 9.3 管理员初始化

```sql
INSERT INTO `users`
(`username`, `password`, `real_name`, `email`, `phone`, `department_id`, `primary_role_id`, `status`)
VALUES
('admin', '$2a$10$replace_with_real_bcrypt_hash', '管理员', 'admin@company.com', '13800138000', 11, 1, 1);
```

说明：
- `password` 请使用真实 `bcrypt` 哈希
- 默认测试账号可保持：`admin / admin123`

### 9.4 菜单初始化

```sql
INSERT INTO `menus` (`id`, `name`, `path`, `icon`, `parent_id`, `type`, `sort`, `hidden`, `status`) VALUES
(1, '工作台', '/dashboard', 'HomeFilled', NULL, 2, 1, 0, 1),
(2, '员工管理', '/users', 'User', NULL, 2, 2, 0, 1),
(3, '部门管理', '/departments', 'OfficeBuilding', NULL, 2, 3, 0, 1),
(4, '考勤管理', '/attendance', 'Clock', NULL, 2, 4, 0, 1),
(5, '请假管理', '/leaves', 'Document', NULL, 2, 5, 0, 1),
(6, '公告管理', '/notices', 'Bell', NULL, 2, 6, 0, 1),
(7, '任务管理', '/tasks', 'List', NULL, 2, 7, 0, 1);
```

### 9.5 系统配置初始化

```sql
INSERT INTO `settings` (`config_key`, `config_value`, `value_type`, `description`) VALUES
('company_name', 'Nova OA', 'string', '公司名称'),
('work_start_time', '09:00', 'string', '上班时间'),
('work_end_time', '18:00', 'string', '下班时间'),
('allow_clock_in_early', '30', 'number', '允许提前打卡分钟数'),
('leave_apply_days_limit', '30', 'number', '请假申请最大天数');
```

---

## 10. 命名与返回映射建议

数据库字段建议保持下划线命名，接口返回建议统一转成前端已经在用的驼峰格式：

- `real_name -> realName`
- `department_id -> departmentId`
- `department_name -> departmentName`
- `role_id -> roleId`
- `role_name -> roleName`
- `clock_in_time -> clockInTime`
- `clock_out_time -> clockOutTime`
- `work_hours -> workHours`
- `view_count -> viewCount`
- `publish_time / created_at -> createTime`

如果你在 Spring Boot 中实现，建议在 DTO / VO 层完成字段映射，不要直接把数据库实体返回给前端。

---

## 11. 实现建议

### 11.1 推荐最先实现的表

第一阶段：

- `users`
- `departments`
- `roles`
- `menus`
- `user_roles`
- `role_menus`

第二阶段：

- `attendance_records`
- `leave_requests`
- `leave_balances`

第三阶段：

- `notices`
- `notice_reads`
- `tasks`
- `task_logs`

### 11.2 当前前端最低可用条件

如果你想先把前端跑通，最少需要保证这些接口背后有表支撑：

- `/auth/login`
- `/auth/info`
- `/menus`
- `/users`
- `/departments`
- `/attendance`
- `/attendance/stats/{userId}`
- `/leaves`
- `/leaves/balance/{userId}`
- `/notices`
- `/tasks`

只要这些表和字段对齐，当前前端就能稳定联调。
