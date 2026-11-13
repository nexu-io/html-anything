# Mercor Launch Video

输入技能条件后展示候选人，再打开详情看面试与文字记录，接着聘用、介绍和付款。用同一位候选人把多个步骤连起来。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 31.95,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Find the perfect candidate",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#8060d9"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Find the perfect candidate",
        "accent": "#8060d9"
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

## 从筛选一直走到聘用管理

输入技能条件后展示候选人，再打开详情看面试与文字记录，接着聘用、介绍和付款。用同一位候选人把多个步骤连起来。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 检索输入 |
| 3.00–6.00s | 候选人网格 |
| 6.00–7.50s | 能力短句 |
| 7.50–10.00s | 候选人详情 |
| 10.00–12.50s | AI 面试主张 |
| 12.50–16.00s | 视频与文字记录 |
| 16.00–20.00s | 聘用按钮 |
| 20.00–23.00s | 介绍邮件 |
| 23.00–29.00s | 合规与付款 |
| 29.00–31.95s | 品牌 |

## 能力短句是段落间隔

Find、Access、Hire、Compliance 等短句用紫色居中，停留短于实际界面。白底与小量散点保持轻盈，避免抢走资料可读性。

## 放大关键决定，再返回详情

聘用按钮短暂从界面抽出独立展示，点击后转向介绍邮件。迁移时替换职位条件、人物资料与动作结果，保持流程真实对应。

```motion-demo
{
  "id": "clip-3",
  "title": "放大关键决定，再返回详情",
  "src": "demos/clip-3.html",
  "duration": 4.800000000000001,
  "status": "authored",
  "description": "16–20.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 配色与字形

纯白界面、紫色行动按钮与能力短句，细线候选人卡片。。

#ffffff · #242424 · #8060d9 · #e8e1f7 · #b9b9c4

## 元素与制作规则

搜索框 / 候选人卡 / 详情页 / 视频面试 / 转写文本 / 聘用按钮 / 付款表

- 输入技能条件后展示候选人，再打开详情看面试与文字记录，接着聘用、介绍和付款。用同一位候选人把多个步骤连起来。
- Find、Access、Hire、Compliance 等短句用紫色居中，停留短于实际界面。白底与小量散点保持轻盈，避免抢走资料可读性。
- 聘用按钮短暂从界面抽出独立展示，点击后转向介绍邮件。迁移时替换职位条件、人物资料与动作结果，保持流程真实对应。

## 内容替换

- 用于其他人才或服务匹配流程，保持同一候选人在各阶段的身份。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Mercor",
  "id": "V151",
  "palette": [
    "#ffffff",
    "#242424",
    "#8060d9",
    "#e8e1f7",
    "#b9b9c4"
  ],
  "typography": "纯白界面、紫色行动按钮与能力短句，细线候选人卡片。",
  "sample": "Find the perfect candidate",
  "objects": [
    "搜索框",
    "候选人卡",
    "详情页",
    "视频面试",
    "转写文本",
    "聘用按钮",
    "付款表"
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
      "timeSeconds": 5.996871741397289,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 9.994786235662149,
      "frameId": "K0026",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 12.460166840458811,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 19.989572471324298,
      "frameId": "K0057",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 28.98488008342023,
      "frameId": "K0070",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "检索输入",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "候选人网格",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "能力短句",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "候选人详情",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "AI 面试主张",
      "end": 12.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.5,
      "label": "视频与文字记录",
      "end": 16,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 16,
      "label": "聘用按钮",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "介绍邮件",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "合规与付款",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "品牌",
      "end": 31.95,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 31.95,
  "fontFamily": "Arial, sans-serif"
}
```
