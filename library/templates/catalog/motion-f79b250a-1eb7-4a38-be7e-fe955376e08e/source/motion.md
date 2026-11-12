# Grok Bot × Linear

把两个品牌作为画面的唯一主信息。它们保持固定，紫黑背景提供缓慢而连续的流动。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7.3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Grok × Linear",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#6f65a8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Grok × Linear",
        "accent": "#6f65a8"
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

## 两方标识保持等权

标识在同一水平线上，细竖线位于中间。按视觉重量调整大小，双方留白接近；文字替代标识时使用简洁的白色无衬线。

紫黑背景压低亮度，只在远离文字的位置保留柔软高光。

## 背景流动，标识不跟着漂移

褶皱以低速穿过画面，明暗变化连续。分隔线、标识基线和两侧间距始终保持稳定。

## 换成另一组合作方

替换双方名称与品牌色，再重新平衡视觉重量。只保留合作身份这一层信息，让画面有足够时间读完两个名字。

## 配色与字形

紫黑柔软流体、居中双品牌与细分隔线。

#24203a · #ffffff · #6f65a8 · #393d57 · #7a6786

## 元素与制作规则

主品牌 / 分隔线 / 合作品牌 / 流体背景

- 两枚品牌固定对齐，背景持续流动，避免抢文字。
- 只用品牌与背景表达合作，保持信息简洁。

## 内容替换

- 可替换双方名称与配色，保留同等权重和稳定分隔。
- 不根据合作名臆造功能演示。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "xAI / Grok",
  "id": "V311",
  "palette": [
    "#24203a",
    "#ffffff",
    "#6f65a8",
    "#393d57",
    "#7a6786"
  ],
  "typography": "紫黑柔软流体、居中双品牌与细分隔线",
  "sample": "Grok × Linear",
  "objects": [
    "主品牌",
    "分隔线",
    "合作品牌",
    "流体背景"
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
      "timeSeconds": 3.0,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 7.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "双品牌建立",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "背景流动",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "双品牌持续留读",
      "end": 10.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.0,
  "fontFamily": "Arial, sans-serif"
}
```
