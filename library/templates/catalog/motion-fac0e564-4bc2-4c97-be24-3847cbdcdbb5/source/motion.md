# 状态词与 HyperFrames

状态词用低亮度等宽字快速变化，接着切为暗色双三角。绿色从下方向上填入标志，再让白色品牌字标展开。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.7,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "HyperFrames",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#49fca6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "HyperFrames",
        "accent": "#49fca6"
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

## 从工作状态切到产品标志

状态词用低亮度等宽字快速变化，接着切为暗色双三角。绿色从下方向上填入标志，再让白色品牌字标展开。

```motion-demo
{
  "id": "clip-1",
  "title": "从工作状态切到产品标志",
  "src": "demos/clip-1.html",
  "duration": 2.4,
  "status": "authored",
  "description": "2.4–4.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 留读阶段只更新字幕

字标就位后保持稳定，绿色继续作为唯一高饱和色。字幕位于底部安全区，不随主标志缩放。替换产品时保留短促建立、长段停留的比例。

## 配色与字形

纯黑舞台、粗白字标、绿色几何标志，下方极小字幕。。

#000000 · #ffffff · #49fca6 · #252527 · #777777

## 元素与制作规则

状态词 / 双三角标志 / 绿色填充 / 品牌字标 / 字幕

- 状态词用低亮度等宽字快速变化，接着切为暗色双三角。绿色从下方向上填入标志，再让白色品牌字标展开。
- 字标就位后保持稳定，绿色继续作为唯一高饱和色。字幕位于底部安全区，不随主标志缩放。替换产品时保留短促建立、长段停留的比例。

## 内容替换

- 替换产品名、标志和底部短字幕，主动作集中在前四秒。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "HeyGen",
  "id": "V342",
  "palette": [
    "#000000",
    "#ffffff",
    "#49fca6",
    "#252527",
    "#777777"
  ],
  "typography": "纯黑舞台、粗白字标、绿色几何标志，下方极小字幕。",
  "sample": "HyperFrames",
  "objects": [
    "状态词",
    "双三角标志",
    "绿色填充",
    "品牌字标",
    "字幕"
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
      "timeSeconds": 1.8,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.7666666666666666,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 3.533333333333333,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 5.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 10.633333333333333,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "状态词",
      "end": 1.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.6,
      "label": "暗色标志",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "绿色填充",
      "end": 3.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.5,
      "label": "展开字标",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "标志停留",
      "end": 10.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.5,
      "label": "黑场",
      "end": 10.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.7,
  "fontFamily": "Arial, sans-serif"
}
```
