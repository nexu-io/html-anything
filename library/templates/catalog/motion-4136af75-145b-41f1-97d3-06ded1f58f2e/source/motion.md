# Google Search (AI upgrade) — At #GoogleIO last month,…

让一个熟悉的搜索框逐渐容纳完整问题。文字变多时，界面用空间增长来回应。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 22.2,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 2.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Ask Google",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4a80e2"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Ask Google",
        "accent": "#4a80e2"
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

## 从短胶囊到多行输入

白色胶囊放在大面积留白中，细阴影区分边界，四彩光晕集中在外缘。无衬线文字保持深色和稳定字号。

短输入先以单行呈现，进入手机后扩为多行问题框；每次换行向下增高，发送入口贴住右下角。

## 长问题有清楚的阅读顺序

先写目标，再补时间、地点或条件。按句子逐段输入，前一句完成后才增加下一条限制，框体高度跟随内容增长。

```motion-demo
{
  "id": "clip-2",
  "title": "长问题有清楚的阅读顺序",
  "src": "demos/clip-2.html",
  "duration": 12,
  "status": "authored",
  "description": "10–22 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 迁移到其他意图输入

可换品牌、问题和边缘光色。适合从关键词升级到完整请求的产品；正文长度增加时优先扩大容器，保留可读字号与发送按钮位置。

## 配色与字形

白色大留白、细阴影胶囊、四彩边缘光。

#ffffff · #333938 · #4a80e2 · #d95e5d · #6bb79a

## 元素与制作规则

搜索胶囊 / 品牌光晕 / 输入文字 / 手机 / 模式标签 / 发送钮

- 从短搜索栏扩大为多行问题框，体现由关键词到完整意图。
- 光晕沿边缘强调激活，正文保持高对比。
- 输入增多时容器增高而非缩小文字。

## 内容替换

- 迁移保留短查询→长意图的容量变化。
- 文字替换须真实换行并随内容扩高。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Google",
  "id": "V017",
  "palette": [
    "#ffffff",
    "#333938",
    "#4a80e2",
    "#d95e5d",
    "#6bb79a"
  ],
  "typography": "白色大留白、细阴影胶囊、四彩边缘光",
  "sample": "Ask Google",
  "objects": [
    "搜索胶囊",
    "品牌光晕",
    "输入文字",
    "手机",
    "模式标签",
    "发送钮"
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
      "timeSeconds": 1.5690225563909774,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 2.637293233082707,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 6.009022556390978,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 10.015037593984964,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 18.027067669172933,
      "frameId": "K0032",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "搜索入口",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "胶囊扩展",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "Ask Google 字样",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "手机界面",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "AI Mode 输入",
      "end": 10,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10,
      "label": "长问题输入",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "问题完成留读",
      "end": 22.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 22.2,
  "fontFamily": "Arial, sans-serif"
}
```
