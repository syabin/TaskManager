# TaskManager 项目记忆

单文件前端任务管理工具（index.html），localStorage 持久化，无后端。

## 数据模型
- `tasks[]`：项目任务，含 `plannedEndDate`、`adjustedEndDate`、`status`、`delayRecords[]`。
- `delayRecords[]`：每条含 `date`、`delayHours`、`type`（`adjust` 为计划调整 / 否则为临时事项延期）、`causedByTempItemId`、`createdAt`。
- `tempItems[]`：临时事项，含 `date`、`durationValue`、`durationUnit`、`impactType`、`affectedTaskIds`、`createdAt`。

## 关键约定
- 延期重算 `recalcTaskEndDate`：按 `date` 正序、同日按 `createdAt` 正序；遇到 `type:'adjust'` 重置累计小时并以 `adjustToDate` 为新基准。
- 计划调整表单含「调整日期」字段（record.date），可补录前几天的调整，不再强制用今天。
- 临时事项列表按 `date` 倒序、同日按 `createdAt` 倒序。
- 旧数据无 `createdAt` 时，同日期回退到空字符串，保持原有相对顺序。

## 用户偏好
- 同一天条目需按输入时间（createdAt）排序，后输入的在前。
- 补录历史计划调整时，希望系统能区分调整前/后的延期。
