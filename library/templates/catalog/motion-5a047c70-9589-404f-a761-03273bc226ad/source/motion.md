# 本周更新：Notes 支持图片

先让清单完整可读，从桌面右侧拖动图片到笔记下方。文件跟随光标，释放后图片展开，笔记窗口随内容增高。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 14.016667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Iceland Trip",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#7396bc"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Iceland Trip",
        "accent": "#7396bc"
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

## 用一次拖放证明图片支持

先让清单完整可读，从桌面右侧拖动图片到笔记下方。文件跟随光标，释放后图片展开，笔记窗口随内容增高。

```motion-demo
{
  "id": "clip-1",
  "title": "用一次拖放证明图片支持",
  "src": "demos/clip-1.html",
  "duration": 2.8999999999999995,
  "status": "authored",
  "description": "5.3–8.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 让文字与图片共享笔记宽度

笔记固定在中央偏上，图片左右对齐正文边界，圆角轻微。黑色桌面保持安静，唯一彩色区域来自照片。

## 结果出现后继续写字

插图完成后补一行文字，说明图片属于文档流。替换旅行主题时同步更换清单、照片与文件名，最后关闭窗口回到桌面。

## 配色与字形

黑色桌面与窄笔记窗口；小字号清单配一张横向旅行照片。。

#050505 · #f1f1f1 · #7396bc · #1a1a1a · #aeaeae

## 元素与制作规则

笔记窗口 / 清单文本 / 桌面图片文件 / 拖拽光标 / 内嵌图片

- 先让清单完整可读，从桌面右侧拖动图片到笔记下方。文件跟随光标，释放后图片展开，笔记窗口随内容增高。
- 笔记固定在中央偏上，图片左右对齐正文边界，圆角轻微。黑色桌面保持安静，唯一彩色区域来自照片。
- 插图完成后补一行文字，说明图片属于文档流。替换旅行主题时同步更换清单、照片与文件名，最后关闭窗口回到桌面。

## 内容替换

- 保留“桌面文件—拖入—文档增高”的可见因果，可替换任意图片笔记。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Raycast",
  "id": "V158",
  "palette": [
    "#050505",
    "#f1f1f1",
    "#7396bc",
    "#1a1a1a",
    "#aeaeae"
  ],
  "typography": "黑色桌面与窄笔记窗口；小字号清单配一张横向旅行照片。",
  "sample": "Iceland Trip",
  "objects": [
    "笔记窗口",
    "清单文本",
    "桌面图片文件",
    "拖拽光标",
    "内嵌图片"
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
      "timeSeconds": 4.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.0,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 7.25,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 10.0,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 13.35,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "笔记清单",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "添加一行",
      "end": 5.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.5,
      "label": "拖入图片",
      "end": 7.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.25,
      "label": "图片展开",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "继续编辑",
      "end": 13.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.3,
      "label": "关闭窗口",
      "end": 14.016667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 14.016667,
  "fontFamily": "Arial, sans-serif"
}
```
