# 项目任务与临时事项管理工具 - 技术方案

## 一、项目概述

### 1.1 背景

在项目管理过程中，团队经常面临以下挑战：
- 临时会议、紧急任务等突发事项占用开发时间
- 任务延期难以追溯原因
- 无法量化临时事项对项目进度的影响

### 1.2 目标

构建一个轻量级的静态网页工具，实现：
- 以项目维度管理待办任务
- 记录和追踪临时事项
- 自动计算延期影响（考虑工作日、节假日、调休）
- 支持数据导入导出

### 1.3 技术选型

| 维度 | 方案 | 理由 |
|------|------|------|
| 前端框架 | 原生 HTML/CSS/JS | 零依赖、单文件部署 |
| 数据存储 | localStorage | 无需后端、离线可用 |
| 节假日数据 | CDN 动态加载 | 自动更新、数据准确 |
| 部署方式 | 静态文件 | 可直接双击打开或部署到任意 Web 服务器 |

---

## 二、功能设计

### 2.1 核心功能模块

```
┌──────────────────────────────────────────────────────────────┐
│                     任务与临时事项管理                         │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│   任务管理    │   临时事项    │     审阅     │    数据管理     │
├──────────────┼──────────────┼──────────────┼─────────────────┤
│ • 新建任务    │ • 新建事项    │ • 延期追溯   │ • 导出 JSON     │
│ • 编辑任务    │ • 编辑事项    │ • 影响分析   │ • 导入 JSON     │
│ • 删除任务    │ • 删除事项    │ • 多维筛选   │ • 清空数据      │
│ • 批量导入    │ • 影响关联    │ • 详情查看   │ • 批量导入      │
│ • 状态管理    │ • 延期计算    │ • 任务搜索   │                 │
│ • 任务搜索    │              │              │                 │
│ • 隐藏已完成  │              │              │                 │
└──────────────┴──────────────┴──────────────┴─────────────────┘
```

### 2.2 延期计算规则

#### 核心算法

```
累计临时事项时长 → 转换为工作日延期 → 自动跳过节假日/周末

转换规则：
• 累计 ≤ 2小时 → 延期 1 个工作日
• 累计 > 2小时 → 1 + floor((累计-2)/8) 个工作日
```

#### 计算示例

| 累计小时 | 工作日数 | 说明 |
|---------|---------|------|
| 1h | 1天 | 未满2小时，按1天计 |
| 2h | 1天 | 恰好2小时 |
| 10h | 2天 | 2 + floor(8/8) = 2 |
| 18h | 3天 | 2 + floor(16/8) = 3 |
| 26h | 4天 | 2 + floor(24/8) = 4 |

#### 节假日处理

- 数据来源：[NateScarlet/holiday-cn](https://github.com/NateScarlet/holiday-cn)
- 自动从 CDN 加载国务院官方公告
- 支持调休工作日识别
- 年份范围动态计算（当前年前2年至后5年）

---

## 三、数据结构设计

### 3.1 实体关系

```
┌──────────────┐       ┌──────────────────┐
│     Task     │       │     TempItem     │
├──────────────┤       ├──────────────────┤
│ id           │◄──────│ affectedTaskIds  │
│ projectName  │       │ id               │
│ taskName     │       │ date             │
│ startDate    │       │ durationValue    │
│ plannedEndDate│      │ durationUnit     │
│ status       │       │ description      │
│ delayRecords │       │ delayValue       │
│ currentEndDate│      │ delayUnit        │
└──────────────┘       └──────────────────┘
        │
        ▼
┌──────────────────┐
│   DelayRecord    │
├──────────────────┤
│ id               │
│ date             │
│ delayHours       │
│ newEndDate       │
│ causedByTempItemId│
│ reason           │
└──────────────────┘
```

### 3.2 字段说明

#### Task（待办任务）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| projectName | string | ✓ | 项目号/名称 |
| taskName | string | ✓ | 任务名称 |
| startDate | date | ✓ | 开始时间 |
| plannedEndDate | date | ✓ | 计划完成时间 |
| status | enum | ✓ | 未开始/进行中/已完成/已延期 |
| delayRecords | array | - | 延期记录列表 |
| currentEndDate | date | - | 当前最新完成时间 |

#### TempItem（临时事项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 唯一标识 |
| date | date | ✓ | 事项日期 |
| durationValue | number | ✓ | 时长数值（时长即延期时长，自动计算工作日数） |
| durationUnit | enum | ✓ | h(小时)/d(天) |
| description | string | ✓ | 事项描述 |
| impactType | enum | ✓ | all(所有任务)/specific(指定任务) |
| affectedTaskIds | array | ✓ | 受影响的任务ID列表 |

> 延期时长不再单独录入，由 `durationValue` + `durationUnit` 统一表示，系统调用 `hoursToWorkingDaysOffset` 自动转换为工作日数。

---

## 四、页面设计

### 4.1 整体布局

```
┌─────────────────────────────────────────────────────────┐
│                    应用标题 + 数据状态                      │
├─────────────────────────────────────────────────────────┤
│  [任务管理]  [临时事项]  [审阅]  [数据管理]                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    内容区域                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 任务管理页

- **统计卡片**：总任务数、进行中、已延期、已完成
- **搜索框**：实时搜索项目号或任务名称
- **筛选器**：项目和状态均支持 Excel 风格下拉多选，点击展开复选框列表，勾选即可筛选
- **隐藏已完成项目**：默认开启，可切换显示
- **任务列表**：按项目分组，显示完整信息
- **操作按钮**：新建、批量导入、编辑、完成、删除

### 4.3 临时事项页

- **事项列表**：日期、时长、描述、导致延期、影响任务
- **表单**：支持小时/天单位切换，影响范围选择

### 4.4 审阅页

- **搜索框**：实时搜索项目号或任务名称
- **筛选**：项目下拉多选筛选、仅查看有延期的任务
- **延期详情**：点击延期记录查看关联的临时事项，支持从延期详情跳转到临时事项编辑
- **编辑联动**：编辑临时事项后，延期记录自动刷新，无需手动关闭弹窗重新查看

---

## 五、技术实现

### 5.1 文件结构

```
task-manager/
├── DESIGN.md          # 技术方案文档
├── README.md          # 项目说明文档
├── index.html         # 主应用（单文件，含 CSS 和 JS）
├── sample-data.json   # 示例数据（JSON 格式）
├── sample-tasks.csv   # 批量导入示例（CSV 格式）
└── sample-tasks.json  # 批量导入示例（JSON 格式）
```

### 5.2 核心代码模块

```javascript
// 数据层
loadData()           // 从 localStorage 加载数据
saveData()           // 保存数据到 localStorage
genId()              // 生成唯一 ID（基于 crypto.randomUUID）

// 节假日逻辑
loadHolidaysFromAPI()  // 从 CDN 加载官方节假日数据
isWorkingDay()         // 判断是否为工作日
nextWorkingDay()       // 获取下一个工作日
hoursToWorkingDaysOffset()  // 小时转工作日数
addWorkingDays()       // 添加工作日（O(n) 优化版）

// 任务管理
showTaskForm()        // 显示任务表单
saveTask()            // 保存任务（含 Toast 反馈）
renderTasks()         // 渲染任务列表
deleteTask()          // 删除任务（含 Toast 反馈）
completeTask()        // 标记完成（含 Toast 反馈）

// 临时事项管理
showTempForm()        // 显示事项表单
saveTempItem()        // 保存事项（含 Toast 反馈）
deleteTempItem()      // 删除事项（含 Toast 反馈）
recalcTaskEndDate()   // 重新计算任务结束时间

// 数据导入导出
exportData()          // 导出 JSON（含 Toast 反馈）
importData()          // 导入 JSON（支持覆盖/合并两种模式）
clearAllData()        // 清空数据（含 Toast 反馈）

// UI 反馈
showToast()           // 显示 Toast 通知
```

### 5.3 ID 生成策略

使用 `crypto.randomUUID()` 生成全局唯一 ID，碰撞概率可忽略不计。

```javascript
function genId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // 降级方案：旧浏览器使用时间戳 + 随机字符串
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
```

浏览器最低要求：Chrome 92+ / Firefox 95+ / Safari 15.4+。

### 5.4 工作日计算优化

`addWorkingDays` 函数已从原来的 O(n²) 优化为 O(n)：

```javascript
// 优化前：每次循环调用 nextWorkingDay（内部也循环），最坏 O(n²)
for (let i = 0; i < workDays; i++) {
  result = nextWorkingDay(result);
}

// 优化后：一次遍历，O(n)
let d = new Date(dateStr);
let count = 0;
while (count < workDays) {
  d.setDate(d.getDate() + 1);
  if (isWorkingDay(d.toISOString().split('T')[0])) count++;
}
```

### 5.5 Toast 通知系统

所有用户操作均有非阻塞的 Toast 提示，替代 `alert()` 弹窗：

- 成功操作：绿色 Toast（3 秒自动消失）
- 错误提示：红色 Toast（3 秒自动消失）
- 信息提示：蓝色 Toast（3 秒自动消失）

```javascript
function showToast(msg, type) {
  type = type || 'success';
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(function() { el.remove(); }, 3000);
}
```

### 5.6 实时搜索

任务管理和审阅页均支持实时搜索，输入关键词即时过滤：

- 搜索范围：项目号 + 任务名称（不区分大小写）
- 触发方式：`oninput` 事件实时触发
- 搜索与筛选器联合生效（取交集）

### 5.7 键盘快捷键

- `Escape`：关闭当前弹窗（Modal）

```javascript
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('modalOverlay').classList.contains('active')) {
      closeModal();
    }
  }
});
```

### 5.8 数据导入策略

导入 JSON 备份时支持两种模式：

1. **覆盖导入**：清除当前数据，完全替换为导入的数据
2. **合并导入**：保留当前数据，仅追加 ID 不重复的条目

```javascript
// 合并时按 ID 去重
const existingTaskIds = new Set(data.tasks.map(t => t.id));
imported.tasks.forEach(t => {
  if (!existingTaskIds.has(t.id)) {
    data.tasks.push(t);
  }
});
```

### 5.9 延期计算流程

```
创建/编辑临时事项
        │
        ▼
确定影响的任务列表
        │
        ▼
为每个任务添加延期记录
        │
        ▼
调用 recalcTaskEndDate()
        │
        ├─► 按日期排序所有延期记录
        │
        ├─► 累计计算延期小时数
        │
        ├─► 转换为工作日数
        │
        ├─► 从计划完成时间开始
        │   跳过节假日和周末
        │
        └─► 更新 currentEndDate 和 status
```

---

## 六、数据安全

### 6.1 存储安全

- 数据存储在浏览器 localStorage
- 不上传到任何服务器
- 关闭浏览器后数据仍然保留

### 6.2 数据备份

- 支持导出为 JSON 文件
- 支持从 JSON 文件导入
- 建议定期导出备份

---

## 七、扩展性

### 7.1 可扩展方向

1. **多人协作**：接入后端 API + 数据库
2. **权限管理**：添加用户登录和权限控制
3. **通知提醒**：任务到期提醒、延期预警
4. **报表统计**：延期趋势分析、项目进度报表
5. **日历视图**：可视化展示任务时间线

### 7.2 数据迁移

由于使用标准 JSON 格式，可以方便地：
- 迁移到其他系统
- 接入后端 API
- 导入到数据库
