# Harvey II

以纸面拼贴建立材质，方块、圆和孔洞不断重组；产品卡片围绕中心对象出现，让抽象图形与项目、任务和资源关系接在一起。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 60.125,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 43,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Harvey II",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#8e879d"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Harvey II",
        "accent": "#8e879d"
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

## 让几何系统承担信息关系

以纸面拼贴建立材质，方块、圆和孔洞不断重组；产品卡片围绕中心对象出现，让抽象图形与项目、任务和资源关系接在一起。

## 复杂拼贴与清晰界面交替

几何段可快速移动、转向和缩放，进入产品界面时减速并保持平直。每次界面出现只强调当前任务，不把所有纹理叠在正文上。

| 时间 | 段落 |
|---|---|
| 0.00–9.00s | 纸面几何巡游 |
| 9.00–12.00s | 几何聚为立方体 |
| 12.00–14.00s | 工作台 |
| 14.00–18.00s | 项目关系 |
| 18.00–22.00s | 任务输入 |
| 22.00–30.00s | 圆与空间孔洞 |
| 30.00–37.00s | 几何重排 |
| 37.00–41.00s | 信息文字拼贴 |
| 41.00–51.00s | 研究关系图 |
| 51.00–56.00s | 项目界面 |
| 56.00–60.12s | 立方体拆出标志 |

## 以中心孔洞作为重组锚点

圆形空间缩小为方孔，周边弧线和块面让出白区，再将文档卡带到中心。保留黑点位置能让大幅重构仍有连续性。

```motion-demo
{
  "id": "clip-3",
  "title": "以中心孔洞作为重组锚点",
  "src": "demos/clip-3.html",
  "duration": 6,
  "status": "authored",
  "description": "41–47 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 最后从复杂结构减到一个字母

立方体外壳分离，背景变亮，只留下 H。更换主题时同时更换文本、关系卡和几何标志，仍使用纸张与低饱和材质。

## 配色与字形

纸张底纹与炭笔几何，灰紫、灰绿低饱和色，法律界面以白面板出现。。

#efefeb · #242129 · #8e879d · #a3b7b0 · #c0b3b2 · #424e48

## 元素与制作规则

纸面几何 / 立方体 / 中心孔洞 / 任务卡 / 项目界面 / 信息字母 / H 标志

- 以纸面拼贴建立材质，方块、圆和孔洞不断重组；产品卡片围绕中心对象出现，让抽象图形与项目、任务和资源关系接在一起。
- 几何段可快速移动、转向和缩放，进入产品界面时减速并保持平直。每次界面出现只强调当前任务，不把所有纹理叠在正文上。
- 圆形空间缩小为方孔，周边弧线和块面让出白区，再将文档卡带到中心。保留黑点位置能让大幅重构仍有连续性。

## 内容替换

- 沿用几何关系语言，替换为目标知识系统与标志，不只换结尾文字。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Harvey",
  "id": "V149",
  "palette": [
    "#efefeb",
    "#242129",
    "#8e879d",
    "#a3b7b0",
    "#c0b3b2",
    "#424e48"
  ],
  "typography": "纸张底纹与炭笔几何，灰紫、灰绿低饱和色，法律界面以白面板出现。",
  "sample": "Harvey II",
  "objects": [
    "纸面几何",
    "立方体",
    "中心孔洞",
    "任务卡",
    "项目界面",
    "信息字母",
    "H 标志"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/51eec03a431fbbf504dfe1a77472e353914eabee1916c1c0fbb523c3f3eec331",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/6349802bd6aa4177d0fccb744adfa9d546307643b87ff48d68157cc1edb9b853",
      "timeSeconds": 12.0,
      "frameId": "K0053",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/a00c6e0bab5a5a2a81a9481424d431b6b10fd9da8d0cd2759475a011012cfd2b",
      "timeSeconds": 18.0,
      "frameId": "K0081",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/0f76859a79356e51c78b03b1d0b81cbda56b8c14c317b5e8caa8c734bead20b2",
      "timeSeconds": 30.0,
      "frameId": "K0124",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/5db4dcb6e24d8033ae891d3dc851e396816828c52a8fed3bca8478b5d91c58f5",
      "timeSeconds": 41.0,
      "frameId": "K0173",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 56.0,
      "frameId": "K0234",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "纸面几何巡游",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "几何聚为立方体",
      "end": 12,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 12,
      "label": "工作台",
      "end": 14,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 14,
      "label": "项目关系",
      "end": 18,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 18,
      "label": "任务输入",
      "end": 22,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 22,
      "label": "圆与空间孔洞",
      "end": 30,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 30,
      "label": "几何重排",
      "end": 37,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 37,
      "label": "信息文字拼贴",
      "end": 41,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 41,
      "label": "研究关系图",
      "end": 51,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 51,
      "label": "项目界面",
      "end": 56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 56,
      "label": "立方体拆出标志",
      "end": 60.125,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 60.125,
  "fontFamily": "Arial, sans-serif"
}
```
