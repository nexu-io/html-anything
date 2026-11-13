# Runway Agent 新能力

先给最终产品页，再倒回请求，提取配色与产品，生成场景和不同尺寸，最后展示动效能力。同一音箱在多个产物中反复出现。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 64.297567,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 38,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Agent finishes the job",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#c3c1e3"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Agent finishes the job",
        "accent": "#c3c1e3"
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

## 围绕一件商品证明完整交付

先给最终产品页，再倒回请求，提取配色与产品，生成场景和不同尺寸，最后展示动效能力。同一音箱在多个产物中反复出现。

| 时间 | 段落 |
|---|---|
| 0.00–4.00s | 产品结果预览 |
| 4.00–7.00s | Agent 图标 |
| 7.00–15.00s | 能力主张 |
| 15.00–21.00s | 浏览与操作 |
| 21.00–27.00s | 品牌请求 |
| 27.00–34.00s | 提取配色与产品 |
| 34.00–43.00s | 成品矩阵 |
| 43.00–50.00s | 字体与多尺寸 |
| 50.00–56.00s | 动效参考 |
| 56.00–64.30s | 能力条带与收尾 |

## 一句主张配一种成果

大多数场景采用左右分区，白色短句与图片分居两侧。黑底持续连接段落，只有能力引入短暂反白。

## 由少量结果拉远成大量变体

先展示四张可辨认的图片，再迅速扩成密集矩阵；突出同一产品在不同环境中的一致外观。

```motion-demo
{
  "id": "clip-3",
  "title": "由少量结果拉远成大量变体",
  "src": "demos/clip-3.html",
  "duration": 7,
  "status": "authored",
  "description": "34–41 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 迁移必须成套更换产品资产

更换商品、品牌字体、色盘和多尺寸成果，保留从需求到可交付产物的过程。

## 配色与字形

黑色开放版面，白色简短说明，一侧为内容或产品成果。。

#080808 · #ffffff · #c3c1e3 · #55515b · #d4b2a2

## 元素与制作规则

Agent 图标 / 任务输入 / 配色条 / 单品照片 / 成果矩阵 / 尺寸变体 / 能力条带

- 先给最终产品页，再倒回请求，提取配色与产品，生成场景和不同尺寸，最后展示动效能力。同一音箱在多个产物中反复出现。
- 大多数场景采用左右分区，白色短句与图片分居两侧。黑底持续连接段落，只有能力引入短暂反白。
- 先展示四张可辨认的图片，再迅速扩成密集矩阵；突出同一产品在不同环境中的一致外观。

## 内容替换

- 换成另一商品系列，保持跨页面、图片与动效的一致对象。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Runway",
  "id": "V140",
  "palette": [
    "#080808",
    "#ffffff",
    "#c3c1e3",
    "#55515b",
    "#d4b2a2"
  ],
  "typography": "黑色开放版面，白色简短说明，一侧为内容或产品成果。",
  "sample": "Agent finishes the job",
  "objects": [
    "Agent 图标",
    "任务输入",
    "配色条",
    "单品照片",
    "成果矩阵",
    "尺寸变体",
    "能力条带"
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
      "timeSeconds": 7.007000000000001,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 21.021,
      "frameId": "K0062",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 27.027,
      "frameId": "K0075",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 43.043,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 56.056000000000004,
      "frameId": "K0164",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "产品结果预览",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "Agent 图标",
      "end": 7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7,
      "label": "能力主张",
      "end": 15,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 15,
      "label": "浏览与操作",
      "end": 21,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 21,
      "label": "品牌请求",
      "end": 27,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 27,
      "label": "提取配色与产品",
      "end": 34,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 34,
      "label": "成品矩阵",
      "end": 43,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 43,
      "label": "字体与多尺寸",
      "end": 50,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 50,
      "label": "动效参考",
      "end": 56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 56,
      "label": "能力条带与收尾",
      "end": 64.297567,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 64.297567,
  "fontFamily": "Arial, sans-serif"
}
```
