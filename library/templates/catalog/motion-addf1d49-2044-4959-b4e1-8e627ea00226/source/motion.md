# Computer for Counsel — Perplexity for lawyers

用一条专业工作链串起工具、来源和三类成果：先让人知道处理什么问题，再展示不同产物如何各司其职。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 64.1,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Computer for Counsel",
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
        "title": "Computer for Counsel",
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

## 领域定位与工具连接

开场说明专业场景，随后给工具连接。工具图标围绕任务服务，不要抢过任务标题；用浅暖底、青绿强调和细分隔线保持专业阅读感。大标题可用衬线，任务与文件内容采用无衬线。

## 任务、执行和来源接在一起

输入任务后进入执行步骤，再展开来源侧栏。侧栏和正文共享同一个任务标题，当前来源高亮靠近正在呈现的内容，避免变成两块互不相关的界面。

```motion-demo
{
  "id": "clip-2",
  "title": "任务、执行和来源接在一起",
  "src": "demos/clip-2.html",
  "duration": 22,
  "status": "authored",
  "description": "12–34 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 三种产物使用三种版式

法规看板突出状态与分类，协议突出条款结构，研究报告突出结论与出处。按实际工作顺序依次展示，切换时保留共同的页面边距与文件标题区。

| 产物 | 主视觉结构 |
| --- | --- |
| 跟踪看板 | 分类列、状态和条目 |
| 协议文档 | 标题、分节与关键条款 |
| 研究报告 | 摘要、结论及来源 |

## 在成果回顾处收束

三类产物完成展示后再汇入成果列，尾段不增加新的操作。用较短的总结标题连接品牌结束页，保持前面工作流程的连续性。

| 时间 | 段落 |
|---|---|
| 0.00–6.00s | 领域标题 |
| 6.00–12.00s | 工具连接 |
| 12.00–18.00s | 法律任务 |
| 18.00–23.00s | 路由主张 |
| 23.00–28.00s | 执行步骤 |
| 28.00–34.00s | 来源侧栏 |
| 34.00–39.00s | 法规看板 |
| 39.00–45.00s | 协议 |
| 45.00–51.00s | 研究报告 |
| 51.00–58.00s | 成果列 |
| 58.00–64.10s | 品牌 |

## 换专业领域时重写工作链

可改成财务、采购或工程审查，但要同时替换任务、来源类型和对应产物。保留“接入工具→执行任务→引用依据→形成交付”的顺序。

## 配色与字形

衬线主张标题搭配无衬线界面文字；大留白、细边框。

#fafaf7 · #171917 · #2c8587 · #dbe4df · #ffffff

## 元素与制作规则

工具生态 / 任务框 / 来源列表 / 法规看板 / 协议文档 / 研究报告

- 领域定位后展示输入与来源，再给三种具体业务产物。
- 成果类型与法律工作步骤匹配，而非同一界面重复展示。

## 内容替换

- 迁移其他专业领域时替换来源类别、专业任务和产物形态。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Perplexity",
  "id": "V252",
  "palette": [
    "#fafaf7",
    "#171917",
    "#2c8587",
    "#dbe4df",
    "#ffffff"
  ],
  "typography": "衬线主张标题搭配无衬线界面文字；大留白、细边框",
  "sample": "Computer for Counsel",
  "objects": [
    "工具生态",
    "任务框",
    "来源列表",
    "法规看板",
    "协议文档",
    "研究报告"
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
      "timeSeconds": 12.0,
      "frameId": "K0027",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 23.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 34.0,
      "frameId": "K0068",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 45.0,
      "frameId": "K0092",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 58.0,
      "frameId": "K0118",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "领域标题",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "工具连接",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "法律任务",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "路由主张",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "执行步骤",
      "end": 28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 28,
      "label": "来源侧栏",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "法规看板",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "协议",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "研究报告",
      "end": 51,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 51,
      "label": "成果列",
      "end": 58,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 58,
      "label": "品牌",
      "end": 64.1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 64.1,
  "fontFamily": "Georgia, serif"
}
```
