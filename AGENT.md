# Agent Guide — 项目任务与临时事项管理工具

## 项目简介

轻量级静态网页工具，管理项目待办任务和临时事项，支持智能延期计算（考虑工作日/节假日/调休）、文档附件归档、数据导入导出。

## 技术栈

- 纯 HTML/CSS/JavaScript（零依赖、单文件部署）
- File System Access API（附件本地存档）
- CDN 加载节假日数据（holiday-cn）
- 单文件部署：`index.html` 即全部代码

## 文件结构

```
TaskManager/
├── index.html         # 主应用（HTML + CSS + JS 全部内联）
├── DESIGN.md          # 技术方案文档（详细架构设计）
├── README.md          # 项目说明文档
├── sample-data.json   # 完整示例数据
├── sample-tasks.csv   # CSV 批量导入示例
└── sample-tasks.json  # JSON 批量导入示例
```

## 核心架构

### 四个标签页

| Tab | 功能 |
|-----|------|
| 任务管理 | 新建/编辑/删除任务，按项目分组，搜索筛选 |
| 临时事项 | 记录会议/紧急任务，关联影响任务，附件上传 |
| 审阅 | 查看延期记录，追溯影响来源 |
| 数据管理 | 导出/导入 JSON，附件存档路径设置 |

### 关键模块

| 模块 | 主要函数 | 说明 |
|------|---------|------|
| 数据层 | `loadData()`, `saveData()`, `genId()` | localStorage CRUD |
| 节假日 | `loadHolidaysFromAPI()`, `isWorkingDay()`, `addWorkingDays()` | 从 CDN 加载+本地 fallback |
| 延期计算 | `hoursToWorkingDaysOffset()`, `recalcTaskEndDate()` | 分段计算，计划调整归零 |
| 任务管理 | `showTaskForm()`, `saveTask()`, `renderTasks()` | CRUD + 按项目分组渲染 |
| 临时事项 | `showTempForm()`, `saveTempItem()`, `deleteTempItem()` | 含附件写入磁盘 |
| 附件管理 | `setArchivePath()`, `saveAttachmentsToDisk()`, `listAttachments()`, `deleteAttachmentFile()`, `getUniqueFileName()` | File System Access API，重名自动重命名 |
| 数据导入 | `exportData()`, `importData()` | JSON 覆盖/合并两种模式 |
| 筛选器 | `initDropdown()`, `toggleDropdownItem()` | Excel 风格下拉多选 |

## 数据模型

```javascript
data = {
  tasks: [{
    id, projectName, projectTitle, taskName,
    startDate, plannedEndDate, adjustedEndDate,
    status,           // "未开始"|"进行中"|"已完成"|"已延期"
    delayRecords: [{  // 延期记录
      id, date, delayHours,
      type,            // "adjust" = 计划调整, 否则为临时延期
      adjustToDate,    // 计划调整目标日期
      newEndDate, causedByTempItemId, reason
    }],
    currentEndDate
  }],
  tempItems: [{
    id, date, durationValue, durationUnit,  // "h"|"d"
    description, impactType,                // "all"|"specific"
    affectedTaskIds: [],
    attachments: [{ name, size, type }]
  }]
}
```

## 延期计算核心逻辑

```
公式: offset = ceil(累计小时数 / 8)  → 工作日数
分段: 遇到 type="adjust" 时累计归零，切换基准日期
工作日: 跳过周末+法定节假日，识别调休工作日
```

## 修改指南

- **修改延期规则**：修改 `hoursToWorkingDaysOffset()` 函数
- **修改节假日数据**：更新 `HOLIDAYS_FALLBACK` 和 `MAKEUP_WORKDAYS_FALLBACK` 常量
- **新增任务字段**：在 `saveTask()` 的 data.tasks.push 中添加 → `renderTasks()` 中渲染
- **localStorage key**：`task-temp-manager`
- **附件存档**：使用 File System Access API，IndexedDB 持久化 handle（数据库: `TaskManagerArchive`）
- **详细技术方案**：参考 `DESIGN.md`
