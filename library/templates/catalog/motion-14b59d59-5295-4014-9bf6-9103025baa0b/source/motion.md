# Claude Duet｜主动式助手预览

从主动提醒开始，依次展示用户授权、任务结果、修改和确认。大字主张与手机错开，始终给当前内容留出阅读空间。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 67.541666,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 21.49,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Claude Duet",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c67b61"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Claude Duet",
        "accent": "#c67b61"
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

## 手机承载任务，大字强调能力

灰紫背景、暖白手机、衬线主张与无衬线聊天内容。

以主动提醒→用户授权→任务结果建立代理能力，而不是只展示聊天滚动。

![7.54s · 构图参考](assets/reference-2.webp)

## 让结果接在授权之后

外置大字与手机左右交替，聚焦对应能力；字幕不能遮住当前结果。

邮件草稿先可读、再允许修改、最后发送；用户确认是叙事必要环节。

```motion-demo
{
  "id": "clip-2",
  "title": "让结果接在授权之后",
  "src": "demos/clip-2.html",
  "duration": 11.5,
  "status": "authored",
  "description": "11–22.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用任务回合组织段落

每轮任务保留请求、授权和结果。提醒与大字主张插在回合之间，最后用通知确认任务已完成。

| 时间 | 段落 |
|---|---|
| 0.00–3.00s | 手机进入 |
| 3.00–7.50s | 主动消息 |
| 7.50–11.00s | 产品标题 |
| 11.00–20.00s | 请求生成仪表盘 |
| 20.00–23.00s | 结果卡片 |
| 23.00–32.00s | 主动提醒与优先级 |
| 32.00–35.00s | 离开场景的主张 |
| 35.00–41.00s | 等待与返回通知 |
| 41.00–45.00s | 人员选择与邮件草稿 |
| 45.00–49.00s | 用户保留决定权 |
| 49.00–56.00s | 编辑并发送 |
| 56.00–58.00s | 通知确认 |
| 58.00–67.54s | 候补名单与品牌 |

## 换任务，保留用户决定权

可换为设计助手：提醒评审→用户确认→生成稿→人工调整→交付通知。

保持同一任务上下文，示例数据和人物名可替换；不可省略确认阶段。

## 配色与字形

灰紫背景、暖白手机、衬线主张与无衬线聊天内容。

#cac8d8 · #20201e · #c67b61 · #ecece4 · #ffffff

## 元素与制作规则

手机容器 / 用户气泡 / 助手气泡 / 结果卡片 / 主张字幕 / 通知条

- 以主动提醒→用户授权→任务结果建立代理能力，而不是只展示聊天滚动。
- 外置大字与手机左右交替，聚焦对应能力；字幕不能遮住当前结果。
- 邮件草稿先可读、再允许修改、最后发送；用户确认是叙事必要环节。

## 内容替换

- 可换为设计助手：提醒评审→用户确认→生成稿→人工调整→交付通知。
- 保持同一任务上下文，示例数据和人物名可替换；不可省略确认阶段。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Anthropic",
  "id": "V007",
  "palette": [
    "#cac8d8",
    "#20201e",
    "#c67b61",
    "#ecece4",
    "#ffffff"
  ],
  "typography": "灰紫背景、暖白手机、衬线主张与无衬线聊天内容",
  "sample": "Claude Duet",
  "objects": [
    "手机容器",
    "用户气泡",
    "助手气泡",
    "结果卡片",
    "主张字幕",
    "通知条"
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
      "timeSeconds": 7.537016982737361,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 22.98581974845869,
      "frameId": "K0063",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 34.97842135635018,
      "frameId": "K0098",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 48.969789898890255,
      "frameId": "K0136",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 57.96424110480888,
      "frameId": "K0168",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "手机进入",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "主动消息",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "产品标题",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "请求生成仪表盘",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "结果卡片",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "主动提醒与优先级",
      "end": 32,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 32,
      "label": "离开场景的主张",
      "end": 35,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 35,
      "label": "等待与返回通知",
      "end": 41,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41,
      "label": "人员选择与邮件草稿",
      "end": 45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 45,
      "label": "用户保留决定权",
      "end": 49,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 49,
      "label": "编辑并发送",
      "end": 56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 56,
      "label": "通知确认",
      "end": 58,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 58,
      "label": "候补名单与品牌",
      "end": 67.541666,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 67.541666,
  "fontFamily": "Georgia, serif"
}
```
