<template>
  <router-view />
</template>

<script setup lang="ts">
</script>

<style>
:root {
  --oa-bg: #f3f5f8;
  --oa-panel: rgba(255, 255, 255, 0.92);
  --oa-panel-strong: #ffffff;
  --oa-line: rgba(15, 23, 42, 0.08);
  --oa-text: #182230;
  --oa-muted: #6b7280;
  --oa-primary: #2463eb;
  --oa-primary-soft: rgba(36, 99, 235, 0.12);
  --oa-success: #17a34a;
  --oa-warning: #c8811a;
  --oa-danger: #dc4d41;
  --oa-shadow: 0 22px 50px rgba(15, 23, 42, 0.08);
  --oa-radius-lg: 24px;
  --oa-radius-md: 18px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
}

body {
  font-family: 'PingFang SC', 'Helvetica Neue', 'Hiragino Sans GB', 'Microsoft YaHei',
    sans-serif;
  color: var(--oa-text);
  background:
    radial-gradient(circle at top left, rgba(36, 99, 235, 0.18), transparent 30%),
    radial-gradient(circle at top right, rgba(17, 181, 255, 0.12), transparent 22%),
    linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button,
input,
select,
textarea {
  font: inherit;
}

.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.page-subtitle {
  margin-top: 6px;
  color: var(--oa-muted);
  font-size: 14px;
}

.section-card {
  background: var(--oa-panel);
  backdrop-filter: blur(16px);
  border: 1px solid var(--oa-line);
  border-radius: var(--oa-radius-lg);
  box-shadow: var(--oa-shadow);
}

.empty-hint {
  display: grid;
  place-items: center;
  min-height: 180px;
  color: var(--oa-muted);
  text-align: center;
}

.empty-hint strong {
  display: block;
  margin-bottom: 8px;
  color: var(--oa-text);
  font-size: 16px;
}

.el-card {
  border: 1px solid var(--oa-line);
  border-radius: var(--oa-radius-md);
  box-shadow: none;
}

.el-card__body {
  padding: 22px;
}

.el-table,
.el-table tr,
.el-table th.el-table__cell,
.el-table td.el-table__cell {
  background: transparent;
}

.el-table th.el-table__cell {
  color: var(--oa-muted);
  font-weight: 600;
}

.el-dialog {
  border-radius: var(--oa-radius-md);
  overflow: hidden;
}

.el-dialog__header {
  margin-right: 0;
  padding: 22px 24px 12px;
}

.el-dialog__body {
  padding: 12px 24px 24px;
}

.el-dialog__footer {
  padding: 0 24px 24px;
}
</style>
