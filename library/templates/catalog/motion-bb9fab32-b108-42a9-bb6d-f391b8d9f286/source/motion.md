# Notion External Agents (Claude + Cursor integration)…

让同一张任务卡走完交付流程。状态和责任人持续变化，任务身份始终保持一致。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 30.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "External Agents",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2f91cb"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "External Agents",
        "accent": "#2f91cb"
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

## 卡片不换，状态向前走

Triage、Plan、Build、PR Ready、Ship 依次推进。同一任务标题、编号或核心摘要始终可辨；进入新阶段时改变状态和代理标记，不另造一张看似无关的任务。

## 在需要判断的位置停一下

计划阶段展示上下文与计划更新，实施阶段接执行动作，评论作为原任务的补充出现。人工反馈后再推进状态，让交接原因可读。

| 状态 | 要交代的内容 |
| --- | --- |
| Triage / Plan | 任务范围与计划 |
| Build | 执行者和实施进度 |
| PR Ready | 准备审阅的结果 |
| Ship | 已完成的交付状态 |

## 浅色分区支持顺序阅读

用白色工作面板和淡色状态区，强调色只标记当前阶段。无衬线标题与小号状态文字统一字形，卡片宽度和信息顺序不随阶段跳变。

## 替换为你的交付流程

可迁移到设计、内容或审批流程。保留一个持续的对象，替换阶段名称、负责人和成果；评论与附件仍归属于该对象，别把它们当成新主角。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

同一任务卡 / 状态标签 / 代理标记 / 执行步骤 / 评论

- 同一任务卡持续存在，状态按 Triage→Plan→Build→PR→Ship 改变。
- 代理标记伴随职责交接；评论提供人工反馈，不是新任务卡。

## 内容替换

- 可迁移任意交付流程；保留身份与状态流转。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V087",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "External Agents",
  "objects": [
    "同一任务卡",
    "状态标签",
    "代理标记",
    "执行步骤",
    "评论"
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
      "timeSeconds": 6.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0036",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 22.0,
      "frameId": "K0041",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 29.0,
      "frameId": "K0057",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "标题",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "Triage",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "Plan",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "读取上下文",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "计划更新",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "Build",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "PR Ready",
      "end": 26,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 26,
      "label": "Ship",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "品牌",
      "end": 30.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 30.0,
  "fontFamily": "Arial, sans-serif"
}
```
