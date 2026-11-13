# Grok — 21 brand-new voices

一行功能公告持续停留，背景用柔软的色彩褶皱缓慢流动。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 6.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "21 New Voices on Grok",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#d4a37b"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "21 New Voices on Grok",
        "accent": "#d4a37b"
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

## 文字稳定，颜色在后面变化

标题居中，用中等字重的白色无衬线，四周留出宽阔空白。紫褐承担暗部，橙色形成柔和亮带；标题后方避免出现突然的高亮边缘。

## 把褶皱做成连续运动

亮带缓慢横移、翻卷，速度和形态保持连贯。背景细节的对比低于文字，不跟随每个词做节奏变化。

## 替换一条新公告

更换短标题和背景色系即可沿用。长标题分为两行后保持整体居中，缩短行间距，避免同时加入按钮或副标题分散注意力。

## 配色与字形

紫褐与橙光的柔软流体背景、固定白字。

#2b1a37 · #ffffff · #d4a37b · #80589c · #bd8c92

## 元素与制作规则

固定标题 / 冷色流体 / 暖色光带

- 标题保持位置与大小，运动主要来自背景连续流动。
- 背景低对比细节不能抢占文字可读性。
- 一行功能公告作为全片中心，保持极简信息量。

## 内容替换

- 替换一行公告与品牌配色，保留静态信息对连续底纹。
- 无需添加产品界面。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V026",
  "palette": [
    "#2b1a37",
    "#ffffff",
    "#d4a37b",
    "#80589c",
    "#bd8c92"
  ],
  "typography": "紫褐与橙光的柔软流体背景、固定白字",
  "sample": "21 New Voices on Grok",
  "objects": [
    "固定标题",
    "冷色流体",
    "暖色光带"
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
      "timeSeconds": 1.0,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 3.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 5.0,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "标题建立",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "背景褶皱漂移",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "暖色区域流动",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "保持标题",
      "end": 6.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 6.0,
  "fontFamily": "Arial, sans-serif"
}
```
