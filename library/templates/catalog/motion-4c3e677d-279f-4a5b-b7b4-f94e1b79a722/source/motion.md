# Scheduled Tasks 2.0 (Manus) — Scheduled Tasks 2.0 — a…

把一句日程需求落到日历，再展示它如何反复运行。日历负责时间安排，任务列表与日志负责执行情况。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 41.866667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 9.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Scheduled Tasks",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#538cbe"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Scheduled Tasks",
        "accent": "#538cbe"
      }
    },
    {
      "label": "OpenDesign 改编",
      "values": {
        "title": "OpenDesign",
        "accent": "#7050da"
      }
    }
  ]
}
```

## 日历先建立时间坐标

开场用月历或周历展示任务密度，选中项和当前日期要可区分。日期数字、任务短名和时间各有层级，避免每个格子堆满完整句子。

采用浅底和低对比网格，强调色用于任务块和当前选择。界面字体保持统一的无衬线，日期数字适合使用等宽数字。

## 从聊天创建一个重复任务

输入需求后，弹出频率、时间和任务内容的配置。确认配置再把事件放进日历；创建动作与新任务出现之间不要插入无关页面。

将“每隔多久执行”写在计划位置，将“这次执行是否完成”写在运行记录里，二者不能共用一个状态标签。

| 信息 | 所在位置 |
| --- | --- |
| 周期与计划时间 | 任务配置与日历 |
| 本次开始时间 | 运行日志 |
| 本次结果 | 完成状态与成果 |
| 任务集合 | 列表或卡片视图 |

## 切换视图时保留同一任务

日历、列表和卡片视图之间，用相同任务名或选中色承接。进入日志后再返回任务集合，说明这些结果属于同一套计划。

迁移时可替换为周报、库存或项目提醒，保留任务内容、周期和执行结果的一致关系。

## 配色与字形

无衬线界面文字与清晰大小层级。

#f7f8f6 · #222522 · #538cbe · #b6cbb9 · #ffffff

## 元素与制作规则

日历网格 / 任务卡 / 聊天输入 / 计划开关 / 执行记录

- 日历先给全局分布，推近单个任务说明设置
- 聊天内容转为任务卡，保留名称与执行周期身份
- 从创建展示到执行历史，证明不是单次对话

## 内容替换

- 可换为设计评审或内容发布排期，保留日历→设置→记录
- 时间与名称可改，但重复周期与结果对应

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Manus",
  "id": "V049",
  "palette": [
    "#f7f8f6",
    "#222522",
    "#538cbe",
    "#b6cbb9",
    "#ffffff"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "Scheduled Tasks",
  "objects": [
    "日历网格",
    "任务卡",
    "聊天输入",
    "计划开关",
    "执行记录"
  ],
  "frames": [
    {
      "path": "assets/reference-1.jpg",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 14.0,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0046",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c767d3cb17c195b0a5083efe5a22479859f67ec15e0d7e9ac36de31e53ee5dea",
      "timeSeconds": 29.0,
      "frameId": "K0084",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/c045c757959a36ff0ce6b1ade17a465d15d9ccc53c651ab265f8f3db60946b64",
      "timeSeconds": 38.0,
      "frameId": "K0100",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "日历介绍",
      "end": 3.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.0,
      "label": "日程概览",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "聊天转任务",
      "end": 14.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14.0,
      "label": "计划设置",
      "end": 18.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18.0,
      "label": "应用定时执行",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "运行记录",
      "end": 29.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29.0,
      "label": "列表与卡片视图",
      "end": 38.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38.0,
      "label": "品牌",
      "end": 41.866667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 41.866667,
  "fontFamily": "Arial, sans-serif"
}
```
