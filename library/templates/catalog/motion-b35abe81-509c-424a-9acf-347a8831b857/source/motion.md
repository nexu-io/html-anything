# 生态扩展｜MCP 新增 5 个合作方

用一句往返主张和一列伙伴图标说明连接关系，最后将视线集中到核心工具。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 7.541667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Roundtrip between code and canvas",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#8f50de"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Roundtrip between code and canvas",
        "accent": "#8f50de"
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

## 两行主张先稳定，图标队列再进入

文字按两行排布，留足行间距。伙伴图标随后沿同一水平队列出现，视觉尺寸相近；队列经过后逐步聚焦核心品牌，内部标识保持完整。

## 灰色舞台把生态图标留给自己

主背景采用灰阶，紫色承担有限强调，黑色无衬线标题保持有力。图标拥有各自颜色，但外部边距与基线统一；标题与图标列之间保留足够空白。

## 换合作生态时保留两类角色

更新主张、合作工具和最终核心图标。生态中应同时包含代码与设计等互补角色，队列展示的名称与文案对应；收尾核心品牌的比例高于外围图标，但不需要复杂旋转。

## 配色与字形

无衬线中粗主标题；细边框界面与小号功能文字。

#d2d2d2 · #161616 · #8f50de · #ffffff · #333333

## 元素与制作规则

两行标题 / 伙伴图标列 / 中心品牌图标

- 先给往返主张，再用横向图标巡览证明生态范围，最终聚焦核心工具。
- 图标位置跟随队列，内部标识保持完整。

## 内容替换

- 可换合作生态；保留代码与设计两类角色。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Figma",
  "id": "V105",
  "palette": [
    "#d2d2d2",
    "#161616",
    "#8f50de",
    "#ffffff",
    "#333333"
  ],
  "typography": "无衬线中粗主标题；细边框界面与小号功能文字",
  "sample": "Roundtrip between code and canvas",
  "objects": [
    "两行标题",
    "伙伴图标列",
    "中心品牌图标"
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
      "timeSeconds": 2.5,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 3.5,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 5.5,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 6.333333333333333,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "分行标题",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "伙伴图标进入",
      "end": 3.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.4,
      "label": "横向图标列",
      "end": 5.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.6,
      "label": "聚焦 Figma",
      "end": 6.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.4,
      "label": "品牌",
      "end": 7.541667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 7.541667,
  "fontFamily": "Arial, sans-serif"
}
```
