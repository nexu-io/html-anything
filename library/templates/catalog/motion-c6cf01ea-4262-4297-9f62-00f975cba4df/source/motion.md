# Introducing Wabi 2.0: a new kind of messenger that makes apps and gets things done…

聊天中的信息逐渐长成可用的小应用，再让这些应用组成个人首页。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 80.483333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 50,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "A new kind of messenger",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#a58bc9"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "A new kind of messenger",
        "accent": "#a58bc9"
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

## 每个应用都从一句话产生

旅行确认先成为行程和倒计时，群聊继续加入地点推荐，生活事务引出执行结果。输入与结果保持同一语境，小应用出现后仍能回到聊天。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 渐变球 |
| 4.00–9.00s | 产品主张 |
| 9.00–14.00s | 旅行消息 |
| 14.00–18.00s | 手机行程 |
| 18.00–23.00s | 邀请朋友 |
| 23.00–29.00s | 群聊与反馈 |
| 29.00–34.00s | 生活事务 |
| 34.00–39.00s | 任务执行 |
| 39.00–44.00s | 合适界面 |
| 44.00–50.00s | 宠物请求 |
| 50.00–55.00s | 宠物应用 |
| 55.00–62.00s | 继续聊天 |
| 62.00–67.00s | 个人首页 |
| 67.00–72.00s | 应用弧线 |
| 72.00–78.00s | 渐变球收尾 |
| 78.00–80.48s | 品牌 |

## 从聊天进入独立应用，再回来

共享宠物请求先出现在气泡，再生成应用卡，进入完整宠物页后回到群聊。手机框始终是稳定参照，应用与气泡用同一名称关联。

```motion-demo
{
  "id": "clip-2",
  "title": "从聊天进入独立应用，再回来",
  "src": "demos/clip-2.html",
  "duration": 11,
  "status": "authored",
  "description": "44–55 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 白色工作面让情绪素材点到为止

主张短句用黑色无衬线，头像和爱心提供人情味，渐变球用于开头和结束。手机与应用卡留足空白，渐变色不进入正文阅读区。

## 可换故事，保留消息到工具的因果

旅行、宠物或任务都能替换，但要准备对应输入、生成卡片和实际功能页。最后首页只收纳前面已建立的应用，形成个人化成果。

## 配色与字形

无衬线简短主张与聊天正文；白底大留白，气泡和小应用保持轻边界。

#fcfcfc · #151515 · #a58bc9 · #efb9a4 · #7598d7

## 元素与制作规则

渐变球 / 手机聊天 / 小应用卡 / 参与者头像 / 个人首页 / 弧形应用列

- 聊天中的信息逐渐长成可用的小应用，再让这些应用组成个人首页。
- 旅行确认先成为行程和倒计时，群聊继续加入地点推荐，生活事务引出执行结果。输入与结果保持同一语境，小应用出现后仍能回到聊天。
- 共享宠物请求先出现在气泡，再生成应用卡，进入完整宠物页后回到群聊。手机框始终是稳定参照，应用与气泡用同一名称关联。

## 内容替换

- 旅行、宠物或任务都能替换，但要准备对应输入、生成卡片和实际功能页。最后首页只收纳前面已建立的应用，形成个人化成果。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Wabi",
  "id": "V222",
  "palette": [
    "#fcfcfc",
    "#151515",
    "#a58bc9",
    "#efb9a4",
    "#7598d7"
  ],
  "typography": "无衬线简短主张与聊天正文；白底大留白，气泡和小应用保持轻边界",
  "sample": "A new kind of messenger",
  "objects": [
    "渐变球",
    "手机聊天",
    "小应用卡",
    "参与者头像",
    "个人首页",
    "弧形应用列"
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
      "timeSeconds": 14.0,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 29.0,
      "frameId": "K0073",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 44.0,
      "frameId": "K0111",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 62.0,
      "frameId": "K0156",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 78.0,
      "frameId": "K0204",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "渐变球",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "产品主张",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "旅行消息",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "手机行程",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "邀请朋友",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "群聊与反馈",
      "end": 29,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 29,
      "label": "生活事务",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "任务执行",
      "end": 39,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 39,
      "label": "合适界面",
      "end": 44,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 44,
      "label": "宠物请求",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "宠物应用",
      "end": 55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 55,
      "label": "继续聊天",
      "end": 62,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 62,
      "label": "个人首页",
      "end": 67,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 67,
      "label": "应用弧线",
      "end": 72,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 72,
      "label": "渐变球收尾",
      "end": 78,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 78,
      "label": "品牌",
      "end": 80.483333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 80.483333,
  "fontFamily": "Arial, sans-serif"
}
```
