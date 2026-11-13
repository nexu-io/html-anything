# Android Drop — Find Hub, Motion Assist, Gemini

每项更新只用一个主体和一个反馈说清：地图带通知，清单带消息，照片带辅助状态。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 8.066667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Android Drop",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#62b8f3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Android Drop",
        "accent": "#62b8f3"
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

## 三组卡片沿同一中心接续

白色大留白中使用圆角卡，粉蓝光晕停在边缘。主体卡较大，小反馈错位依附在一侧；无衬线文字控制在简短标签和一行说明。

## 让反馈解释主体的变化

地图出现后才带出位置提示，购物清单出现后才带出共享消息，照片出现后才增加辅助标点。每组完成一个可见动作就交给下一组。

```motion-demo
{
  "id": "clip-2",
  "title": "让反馈解释主体的变化",
  "src": "demos/clip-2.html",
  "duration": 4.5,
  "status": "authored",
  "description": "1.5–6 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 用三种新场景替换

适合一组小更新。为每项准备主体、触发动作和短反馈，统一卡片圆角与留白，仅通过内容和光晕色区分章节。

## 配色与字形

白底大留白、粉蓝光晕、三组功能卡。

#fbfbff · #24252c · #62b8f3 · #bc76df · #89e0bc

## 元素与制作规则

地图卡 / 通知标签 / 共享清单 / 聊天气泡 / 照片 / 辅助标点

- 每个功能由一个主体卡和一个依附的小反馈组成。
- 三组内容从同一视觉中心接续，光晕颜色随章节改变。
- 只展示功能瞬间，省去导航和登录，把篇幅留给主体与反馈。

## 内容替换

- 可迁移成三项更新预告，保留主体＋反馈配对。
- 每项只用一个可辨认场景。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V265",
  "palette": [
    "#fbfbff",
    "#24252c",
    "#62b8f3",
    "#bc76df",
    "#89e0bc"
  ],
  "typography": "白底大留白、粉蓝光晕、三组功能卡",
  "sample": "Android Drop",
  "objects": [
    "地图卡",
    "通知标签",
    "共享清单",
    "聊天气泡",
    "照片",
    "辅助标点"
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
      "timeSeconds": 1.6333333333333333,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 4.533333333333333,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 6.0,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 7.533333333333333,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "标题",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "地图与通知",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "共享购物单",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.5,
      "label": "照片运动辅助",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "功能落地短句",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "淡出",
      "end": 8.066667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 8.066667,
  "fontFamily": "Arial, sans-serif"
}
```
