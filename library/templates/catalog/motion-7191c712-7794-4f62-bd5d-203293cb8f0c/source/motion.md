# Perplexity AI / Snowflake Integration — Computer now…

从已有业务数据引出问题，再展示连接、查询和报告。数据卡负责吸引注意，查询过程负责交代结果的来路。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 71.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Your data has answers",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2c8587"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Your data has answers",
        "accent": "#2c8587"
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

## 先有业务问题，再连接数据

开场给少量关键指标，接一句要解决的问题，然后进入数据源连接。标题页和操作页交替出现，让复杂的数据库过程有清晰段落。

| 时间 | 段落 |
|---|---|
| 0.00–8.00s | 数据卡与主张 |
| 8.00–13.00s | 文字过渡 |
| 13.00–20.00s | 连接数据源 |
| 20.00–25.00s | 可信数据主张 |
| 25.00–31.00s | 报告证据 |
| 31.00–38.00s | 团队问题 |
| 38.00–44.00s | 执行检索 |
| 44.00–55.00s | SQL 证据 |
| 55.00–62.00s | 成果列 |
| 62.00–71.00s | 总结品牌 |

## 连接状态完成后才开始检索

数据源标记、连接动作和成功状态放在同一个局部区域。完成连接后再进入团队提问，保留数据源名称作为后续报告的上下文。

```motion-demo
{
  "id": "clip-2",
  "title": "连接状态完成后才开始检索",
  "src": "demos/clip-2.html",
  "duration": 12,
  "status": "authored",
  "description": "13–25 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 查询与报告互相对应

代码片段只展示影响结果的关键部分；紧接着给出对应表格或指标。保持字段名称、单位和报告标题一致，使观众能顺着问题读到结论。

| 画面内容 | 制作重点 |
| --- | --- |
| 问题 | 一个明确业务对象与时间范围 |
| 查询 | 对应字段、筛选条件或聚合 |
| 报告 | 承接问题的指标与结论 |
| 成果列 | 汇总同一业务链中的交付物 |

## 数据多，页面仍保持留白

用浅暖底、细线和青绿强调色组织界面；大标题用衬线，代码用等宽字体，表格用无衬线。每个近景只突出一块查询或一个报告区域，长表格不缩成不可读的小图。

## 换业务时连同字段一起改

可以迁移到销售、支持或研发数据。同步替换数据源、提问、查询字段和最终数字；展示用的数据必须内部一致，不能只替换报表标题。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#fafaf7 · #171917 · #2c8587 · #dbe4df · #ffffff

## 元素与制作规则

指标卡 / 数据库连接 / 提问 / SQL 片段 / 报告 / 成果列

- 从已有数据卡引入问题，连接数据源之后展示查询与报告证据。
- 代码和报告只在对应阶段出现，主张页负责节奏停顿。

## 内容替换

- 可迁移为业务数据助手；保留数据源可追溯性。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V247",
  "palette": [
    "#fafaf7",
    "#171917",
    "#2c8587",
    "#dbe4df",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Your data has answers",
  "objects": [
    "指标卡",
    "数据库连接",
    "提问",
    "SQL 片段",
    "报告",
    "成果列"
  ],
  "frames": [
    {
      "path": "assets/reference-1.webp",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 13.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e5e2d9b4daf4761e7620568c9b84da608495fefa2cea28d30559757d549bb868",
      "timeSeconds": 25.0,
      "frameId": "K0068",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 31.0,
      "frameId": "K0085",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 44.0,
      "frameId": "K0121",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 62.0,
      "frameId": "K0185",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "数据卡与主张",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "文字过渡",
      "end": 13,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13,
      "label": "连接数据源",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "可信数据主张",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "报告证据",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "团队问题",
      "end": 38,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 38,
      "label": "执行检索",
      "end": 44,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44,
      "label": "SQL 证据",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "成果列",
      "end": 62,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 62,
      "label": "总结品牌",
      "end": 71.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 71.0,
  "fontFamily": "Georgia, serif"
}
```
