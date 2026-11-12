# Notion AI 大升级（Agents 等）

先展示代理完成任务，再交代模型与订阅如何配置。能力和使用方式分成三段，依次回答不同问题。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 51.416667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 10,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Your agents. Now doing more.",
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
        "title": "Your agents. Now doing more.",
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

## 用一项完成的任务开场

标题之后直接进入输入、执行清单和结果，先建立产品价值。执行行逐步更新，完成产物有独立停留，避免过早进入配置菜单。

```motion-demo
{
  "id": "clip-1",
  "title": "用一项完成的任务开场",
  "src": "demos/clip-1.html",
  "duration": 13,
  "status": "authored",
  "description": "5–18 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 模型与订阅各有一个清楚动作

第二任务之后展示模型切换，再转入已有订阅的连接与用量。切换模型强调选中态，连接订阅强调确认状态，用量图表强调信息汇总；三种界面不共用同一个加载动画。

| 时间 | 段落 |
|---|---|
| 0.00–5.00s | 生态标题 |
| 5.00–10.00s | 任务输入 |
| 10.00–14.00s | 执行清单 |
| 14.00–18.00s | 结果 |
| 18.00–24.00s | 第二任务 |
| 24.00–31.00s | 模型切换 |
| 31.00–36.00s | 订阅主张 |
| 36.00–40.00s | 连接确认 |
| 40.00–48.00s | 用量图表 |
| 48.00–51.42s | 品牌 |

## 用柔和底色分段

主界面始终保持明亮，段落背景在淡蓝、粉杏和浅黄之间切换。主标题用中粗无衬线，功能文字减小字重；细边框与清楚间距维持工具感。

## 改品牌时保留任务线和配置线

先替换任务及其结果，再替换模型选项、连接对象和用量指标。若产品无需订阅连接，可删去对应段落，但不要用另一段聊天填满时长。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#ffffff · #191919 · #2f91cb · #f2e1bb · #aea0ce

## 元素与制作规则

代理图标 / 任务输入 / 执行列表 / 模型清单 / 订阅状态 / 用量看板

- 能力展示分为执行、换模型、连接已有订阅三个段落。
- 背景淡蓝、粉杏、淡黄随段落换色，主界面始终浅色。

## 内容替换

- 主题迁移保留任务与配置两条信息线，别把所有操作变成聊天。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Notion",
  "id": "V084",
  "palette": [
    "#ffffff",
    "#191919",
    "#2f91cb",
    "#f2e1bb",
    "#aea0ce"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Your agents. Now doing more.",
  "objects": [
    "代理图标",
    "任务输入",
    "执行列表",
    "模型清单",
    "订阅状态",
    "用量看板"
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
      "timeSeconds": 10.0,
      "frameId": "K0025",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 18.0,
      "frameId": "K0040",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 24.0,
      "frameId": "K0052",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 36.0,
      "frameId": "K0084",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 48.0,
      "frameId": "K0105",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "生态标题",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "任务输入",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "执行清单",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "结果",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "第二任务",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "模型切换",
      "end": 31,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 31,
      "label": "订阅主张",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "连接确认",
      "end": 40,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 40,
      "label": "用量图表",
      "end": 48,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 48,
      "label": "品牌",
      "end": 51.416667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 51.416667,
  "fontFamily": "Arial, sans-serif"
}
```
