# North 2 — coming October 2026

用一道绿色扫光揭开新产品名称，透明层和暗色极光保持克制；最后将产品名转成两句短承诺。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 16.2,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "North 2",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#53e278"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "North 2",
        "accent": "#53e278"
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

## 让扫光先到，名称随后清楚

黑蓝底上放两三片错位透明板，边缘只留细亮线。横向绿光穿过中心时揭开文字，光离开后文字保持稳定。

```motion-demo
{
  "id": "clip-1",
  "title": "让扫光先到，名称随后清楚",
  "src": "demos/clip-1.html",
  "duration": 2.8,
  "status": "authored",
  "description": "2.7–5.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 背景只做缓慢空间变化

玻璃面沿深度轻移，极光缓慢流动。不要让背景和文字同时大幅旋转；产品名称占中心，日期放上方并缩小。

## 末段用短句收束

名称后接方向与能力主张，最后才出现品牌。更换产品时准备一个短名称、一个时间节点与两句承诺，保持白字和绿光的主次。

## 配色与字形

轻至中等无衬线白字；名称独立居中，结尾短句两行以内。

#020608 · #f2fff4 · #53e278 · #14352d · #3a5360

## 元素与制作规则

玻璃面 / 绿色光带 / 产品名称 / 日期 / 品牌标

- 黑蓝底上放两三片错位透明板，边缘只留细亮线。横向绿光穿过中心时揭开文字，光离开后文字保持稳定。
- 玻璃面沿深度轻移，极光缓慢流动。不要让背景和文字同时大幅旋转；产品名称占中心，日期放上方并缩小。
- 名称后接方向与能力主张，最后才出现品牌。更换产品时准备一个短名称、一个时间节点与两句承诺，保持白字和绿光的主次。

## 内容替换

- 替换短产品名、日期与两句主张；保留扫光揭示。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cohere",
  "id": "V181",
  "palette": [
    "#020608",
    "#f2fff4",
    "#53e278",
    "#14352d",
    "#3a5360"
  ],
  "typography": "轻至中等无衬线白字；名称独立居中，结尾短句两行以内",
  "sample": "North 2",
  "objects": [
    "玻璃面",
    "绿色光带",
    "产品名称",
    "日期",
    "品牌标"
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
      "timeSeconds": 2.0,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 8.0,
      "frameId": "K0023",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 12.266666666666667,
      "frameId": "K0034",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 15.0,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "暗玻璃层",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "时间提示",
      "end": 3.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.3,
      "label": "绿色扫光",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "名称揭示",
      "end": 8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8,
      "label": "极光背景",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "方向主张",
      "end": 12.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.3,
      "label": "能力主张",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "品牌收束",
      "end": 16.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 16.2,
  "fontFamily": "Arial, sans-serif"
}
```
