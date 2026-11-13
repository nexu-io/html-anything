# Bluevine｜品牌几何动效

先展示字标的几何构造，再把圆弧模块变成独立符号和应用图标。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 17.875,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 13.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "bluevine",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#2548db"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "bluevine",
        "accent": "#2548db"
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

## 沿字标横移，填色追随视线

深蓝底上先画基线、字高与圆弧线稿，蓝色填充依次进入。构造线比字形更轻，横移时让正在完成的字母留在中心。

```motion-demo
{
  "id": "clip-1",
  "title": "沿字标横移，填色追随视线",
  "src": "demos/clip-1.html",
  "duration": 6.4,
  "status": "authored",
  "description": "1.4–7.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 字形模块成为自己的视觉语言

半圆、拱门、圆角方形与圆依次占据正方形中心，背景与图形成对换色。每屏只放一个形状，边界清楚，快切后留短暂停顿。

## 拆圆再组合，把标志落到图标里

圆分成两半，重新排列成上直下弧的组合；反白之后缩进圆角方形。迁移时应选择新标志里真正重复的几何母题，替换字标和配色，同时保留构造—模块—应用的顺序。

## 配色与字形

无衬线几何字标；构造辅助线极细，圆弧与直线组成字形。

#09004b · #ffffff · #2548db · #e9cbd7 · #9ce0d3 · #f7e98c

## 元素与制作规则

构造线 / 几何字标 / 半圆模块 / 叶片模块 / 应用图标

- 先展示字标的几何构造，再把圆弧模块变成独立符号和应用图标。
- 深蓝底上先画基线、字高与圆弧线稿，蓝色填充依次进入。构造线比字形更轻，横移时让正在完成的字母留在中心。
- 半圆、拱门、圆角方形与圆依次占据正方形中心，背景与图形成对换色。每屏只放一个形状，边界清楚，快切后留短暂停顿。

## 内容替换

- 圆分成两半，重新排列成上直下弧的组合；反白之后缩进圆角方形。迁移时应选择新标志里真正重复的几何母题，替换字标和配色，同时保留构造—模块—应用的顺序。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Bluevine",
  "id": "V371",
  "palette": [
    "#09004b",
    "#ffffff",
    "#2548db",
    "#e9cbd7",
    "#9ce0d3",
    "#f7e98c"
  ],
  "typography": "无衬线几何字标；构造辅助线极细，圆弧与直线组成字形",
  "sample": "bluevine",
  "objects": [
    "构造线",
    "几何字标",
    "半圆模块",
    "叶片模块",
    "应用图标"
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
      "timeSeconds": 2.5713457076566124,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 7.879930394431554,
      "frameId": "K0030",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 8.958236658932714,
      "frameId": "K0035",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 12.524941995359628,
      "frameId": "K0047",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 14.971867749419953,
      "frameId": "K0057",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "蓝色开场",
      "end": 1.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.4,
      "label": "线稿字标",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "逐段填色",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "横移字形细节",
      "end": 7.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.9,
      "label": "半圆图形",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "形状快切",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "圆拆两半",
      "end": 12.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.5,
      "label": "组合标志",
      "end": 13.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 13.6,
      "label": "反白图形",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "应用图标",
      "end": 17.875,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 17.875,
  "fontFamily": "Arial, sans-serif"
}
```
