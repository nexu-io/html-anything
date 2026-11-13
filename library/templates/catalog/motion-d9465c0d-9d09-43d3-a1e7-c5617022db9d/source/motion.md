# 大会预热｜Config 2026 loading

把加载状态做成一次字形聚合：碎片形成短标题，再散开；细进度线独立推进到终点。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 7.1071,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "CONFIG",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#b8b8b3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "CONFIG",
        "accent": "#b8b8b3"
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

## 字形与进度是两条时间线

碎片先进入并聚成 CONFIG，完整字形停留后再消散。进度线持续向前，不随字形反向；字形退出后，进度才完成，形成明确的结束状态。

## 居中小尺度，黑白高对比

标题与细线组成紧凑中心，周围留大面积黑色。使用粗无衬线字形作为碎片基底，完整状态应一眼可读；进度线比标题轻得多，灰阶只用于过渡与次级细节。

## 适合短名称，不适合长句

换成另一个短单词或简短标志时，重新分配碎片与字间距，确保完整状态有足够停顿。加载线可以调整总时长，但仍持续增长，不与字形的散开动作互相抵消。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#000000 · #f5f5f0 · #b8b8b3 · #252525 · #ffffff

## 元素与制作规则

字形碎片 / 品牌单词 / 进度线

- 字形碎片先乱后聚成标题，进度线独立持续增长；退出时字形先消散、进度后完成。
- 黑白对比与小尺寸居中形成加载状态感。

## 内容替换

- 可换短单词；避免用长段落替代碎片标题。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V104",
  "palette": [
    "#000000",
    "#f5f5f0",
    "#b8b8b3",
    "#252525",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "CONFIG",
  "objects": [
    "字形碎片",
    "品牌单词",
    "进度线"
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
      "timeSeconds": 2.0020000000000002,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 3.003,
      "frameId": "K0006",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 5.005,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 6.006,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "进度开始",
      "end": 0.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.5,
      "label": "字形碎片进入",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "逐渐成字",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "完整标题",
      "end": 4.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.8,
      "label": "字形散开",
      "end": 6.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.5,
      "label": "进度完成",
      "end": 7.1071,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 7.1071,
  "fontFamily": "Arial, sans-serif"
}
```
