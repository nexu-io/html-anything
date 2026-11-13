# Higgsfield · 十亿美元里程碑

把一组商业里程碑编成递进的论证：先给最强数字，再交代时间、增长、采用情况与支持者。每个大数字都带着自己的口径。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 26.041667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 4.4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "1 BILLION",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c9f721"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "1 BILLION",
        "accent": "#c9f721"
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

## 一句主张占满开场

收入数字与指标名称组成主视觉，数字最大，指标次之，品牌最小。使用紧凑、结实的无衬线粗体，黑白底之间交替制造节奏。

荧光绿和洋红承担少量强强调；需要解释的文字回到黑白高对比，不让整屏都变成霓虹色。

![0.00s · 构图参考](assets/reference-1.webp)

## 数字之后马上解释它

用时间跨度、增长曲线或同口径比较支撑开场。月份、金额单位、百分比与比较对象不能拆得太远；缩放数字时让口径信息始终留在同一阅读组。

## 从公司增长，推到使用规模

团队、报道、采用率与覆盖范围逐段展开。图表可以由线变柱或由数量变点阵，但每种图形只表达一个维度。最后用投资者或品牌署名收束，不再加新指标。

| 时间 | 段落 |
|---|---|
| 0.00–2.00s | 大数滚动 |
| 2.00–4.00s | 里程碑定格 |
| 4.00–5.00s | 18个月 |
| 5.00–8.00s | 团队拼贴 |
| 8.00–12.00s | 增长比较 |
| 12.00–15.00s | 媒体证据 |
| 15.00–17.00s | 留存指标 |
| 17.00–19.00s | 增长曲线 |
| 19.00–22.00s | 用户覆盖 |
| 22.00–25.00s | 投资方 |
| 25.00–26.04s | 品牌 |

## 先换数据，再换视觉

换公司时重建一条真实的增长论证，更新金额、周期、采用对象与引用来源。可以保留大字、强对比和快切，但不要照搬别家数字或把不同统计口径放在同一比较里。

## 配色与字形

无衬线界面文字与清晰大小层级。

#101110 · #ffffff · #c9f721 · #d00081 · #777777

## 元素与制作规则

大数标题 / 时间环 / 团队照片 / 增长曲线 / 媒体标题 / 覆盖点阵

- 先用大数吸引，再用时间、曲线与媒体截图分层解释
- 荧光色突出主曲线，其余比较曲线降低亮度
- 黑白底交替切段，数字与解释标签必须同屏

## 内容替换

- 可迁移为公司成果报告，替换可核实指标与证据
- 保持数值、单位、时期及比较口径，不只改数字

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Higgsfield",
  "id": "V051",
  "palette": [
    "#101110",
    "#ffffff",
    "#c9f721",
    "#d00081",
    "#777777"
  ],
  "typography": "无衬线界面文字与清晰大小层级",
  "sample": "1 BILLION",
  "objects": [
    "大数标题",
    "时间环",
    "团队照片",
    "增长曲线",
    "媒体标题",
    "覆盖点阵"
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
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 8.0,
      "frameId": "K0032",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 15.0,
      "frameId": "K0061",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/e141664b5210b269d499e014ede0a672d8ca65b779d0399d092a0543eb7146ef",
      "timeSeconds": 19.0,
      "frameId": "K0075",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 25.0,
      "frameId": "K0094",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0.0,
      "label": "大数滚动",
      "end": 2.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.0,
      "label": "里程碑定格",
      "end": 4.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.0,
      "label": "18个月",
      "end": 5.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.0,
      "label": "团队拼贴",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.0,
      "label": "增长比较",
      "end": 12.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12.0,
      "label": "媒体证据",
      "end": 15.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15.0,
      "label": "留存指标",
      "end": 17.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17.0,
      "label": "增长曲线",
      "end": 19.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 19.0,
      "label": "用户覆盖",
      "end": 22.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22.0,
      "label": "投资方",
      "end": 25.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 25.0,
      "label": "品牌",
      "end": 26.041667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 26.041667,
  "fontFamily": "Arial, sans-serif"
}
```
