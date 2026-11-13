# Orbit｜大会预告

从字形构造进入完整标题，再把标题退到背景，让日期和网址成为真正可用的信息。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 28.583333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Orbit",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#777873"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Orbit",
        "accent": "#777873"
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

## 细节逐渐组成可读字标

纸面细线和圆弧从局部展开，字形轮廓逐步完整。构造线服务于字母形状，轮廓闭合后再填成实心标题；不是仅把同一张字图放大缩小。

## 标题完成后主动退后

完整字标稳定停留，再虚化为背景。日期和网址进入清楚的前景，文字对齐与位置保持简单；从艺术化字形转向实用信息时明显减少运动。

## 纸面灰阶与精细字形

浅灰纸感、深色字标和弱辅助线形成细腻层级。主字标用有构造感的无衬线，日期网址用简洁小号无衬线；背景纹理保持低对比，不能干扰轮廓和信息。

## 换活动名时重新考虑字形构造

适合短活动名或产品名。根据新字母安排圆弧、直线与轮廓的揭示顺序，同时替换日期和网址；实用信息至少获得一次静止、清楚的阅读停留。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#e3e3de · #151613 · #777873 · #b9b9b2 · #ffffff

## 元素与制作规则

纸面纹理 / 辅助线 / 字形轮廓 / 实心字标 / 活动信息

- 从字形构造细节拉开到可读标题，再把标题虚化为背景，前景显示日期与网址。
- 线稿到实心是信息揭示，不能只做整体缩放。

## 内容替换

- 可换活动名；保持字形细节→完整识别→实用信息。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Linear",
  "id": "V111",
  "palette": [
    "#e3e3de",
    "#151613",
    "#777873",
    "#b9b9b2",
    "#ffffff"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Orbit",
  "objects": [
    "纸面纹理",
    "辅助线",
    "字形轮廓",
    "实心字标",
    "活动信息"
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
      "timeSeconds": 3.0,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 14.0,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/df6f6d40b0fe218f5b756ea753d5c56f46aa02d8089f1c7cdb05a91038140861",
      "timeSeconds": 17.0,
      "frameId": "K0060",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 23.0,
      "frameId": "K0074",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 25.0,
      "frameId": "K0076",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "纸面细线",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "圆弧构造",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "字形局部",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "完整轮廓",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "实心标题",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "标题虚化",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "日期",
      "end": 25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25,
      "label": "网址",
      "end": 28.583333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 28.583333,
  "fontFamily": "Arial, sans-serif"
}
```
