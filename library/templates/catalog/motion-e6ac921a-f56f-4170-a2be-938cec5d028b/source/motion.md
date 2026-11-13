# 功能发布｜Config 2026 发布 Figma Motion

把动画结果与可编辑时间线放在一起，让观众既看到丰富的作品，也理解这些运动可以被直接控制。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 68.083333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 12,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Figma Motion",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#96d93c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Figma Motion",
        "accent": "#96d93c"
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

## 快速作品之后，停在一个可编辑动作

开头用不同图形建立动感，标题之后收束到轨迹与时间线。先让一个动作讲清楚，再扩展到卡片、图标和手机界面等不同尺度。

| 时间 | 段落 |
|---|---|
| 0.00–7.00s | 图形快切 |
| 7.00–12.00s | 标题 |
| 12.00–18.00s | 轨迹与时间线 |
| 18.00–24.00s | 状态转场 |
| 24.00–30.00s | 作品示例 |
| 30.00–36.00s | 提示词生成 |
| 36.00–42.00s | 对象操作 |
| 42.00–47.00s | 三维卡片 |
| 47.00–53.00s | 协作时间线 |
| 53.00–59.00s | 图标动效 |
| 59.00–64.00s | 手机界面 |
| 64.00–68.08s | 图形品牌 |

## 播放头与对象状态必须对应

时间线位于预览下方，播放头推进时对象沿既定轨迹变化。暂停和拖动时立即回到对应状态；关键帧标记、对象和轨道名称保持可对应关系。

```motion-demo
{
  "id": "clip-2",
  "title": "播放头与对象状态必须对应",
  "src": "demos/clip-2.html",
  "duration": 12,
  "status": "authored",
  "description": "12–24 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 提示词与手工操作展示不同入口

提示词生成负责快速建立初稿，后续对象操作负责精修。将两种入口放在同一个作品上下文里，生成结果出现后再选择对象，不要直接跳到无关案例。

## 通过作品尺度改变节奏

标题动效适合短促快切，卡片需要看到空间关系，协作时间线要保留指针与轨道，手机界面要给布局阅读时间。每类作品用自己的运动方式，避免全片只做缩放进出。

## 作品鲜明，控制区域清楚

深色舞台与浅色编辑面板分层，绿、紫、橙承担不同创作元素。主标题使用中粗无衬线，时间线与数值采用紧凑无衬线或等宽数字；轨道与预览之间保留明确分隔。

## 换成另一套创作工具

可以更换品牌、作品素材和生成指令。保留“可见结果↔可编辑轨道”的对应，先选几类确有差异的作品，再安排它们各自需要的演示时长。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#161616 · #f6f6ef · #96d93c · #8d56d7 · #f56c3d

## 元素与制作规则

设计对象 / 关键帧点 / 时间线 / 提示词 / 协作指针 / 成果

- 运动预览与时间线同步，播放头位置对应对象状态。
- 通过图标、标题、卡片和手机界面展示多种尺度，不能套一个缩放动作。

## 内容替换

- 换创作软件时保留可编辑轨道与结果反馈；主题素材可替换。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V100",
  "palette": [
    "#161616",
    "#f6f6ef",
    "#96d93c",
    "#8d56d7",
    "#f56c3d"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Figma Motion",
  "objects": [
    "设计对象",
    "关键帧点",
    "时间线",
    "提示词",
    "协作指针",
    "成果"
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
      "frameId": "K0049",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 24.0,
      "frameId": "K0099",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/6deff259e147f9912989a98c1c1b32634a64f4a33c958504f5b4cb5a4bfc12b9",
      "timeSeconds": 42.0,
      "frameId": "K0171",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 53.0,
      "frameId": "K0219",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 64.0,
      "frameId": "K0264",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "图形快切",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "标题",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "轨迹与时间线",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "状态转场",
      "end": 24,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 24,
      "label": "作品示例",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "提示词生成",
      "end": 36,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 36,
      "label": "对象操作",
      "end": 42,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 42,
      "label": "三维卡片",
      "end": 47,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 47,
      "label": "协作时间线",
      "end": 53,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 53,
      "label": "图标动效",
      "end": 59,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 59,
      "label": "手机界面",
      "end": 64,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 64,
      "label": "图形品牌",
      "end": 68.083333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 68.083333,
  "fontFamily": "Arial, sans-serif"
}
```
