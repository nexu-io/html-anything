# 能力更新｜450+ integrations

橙色胶囊把 connect、with 等词接起来，最终落到一个可点击加号。点击后图标沿多条弧线涌入，数字增长到 450。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 26.259567,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "450 Tools",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ed2d08"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "450 Tools",
        "accent": "#ed2d08"
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

## 从连接这个动词推进到数量

橙色胶囊把 connect、with 等词接起来，最终落到一个可点击加号。点击后图标沿多条弧线涌入，数字增长到 450。

```motion-demo
{
  "id": "clip-1",
  "title": "从连接这个动词推进到数量",
  "src": "demos/clip-1.html",
  "duration": 4,
  "status": "authored",
  "description": "4–8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把工具名与用途绑定在同一行

用途列表纵向滚动，当前行变黑并连接右侧橙色工具标签，其他行渐淡。观众一次只读一种用途。

## 大量图标后回到一个行动问题

图标从队列组成环，配 More，再用一句问题引向品牌。替换产品生态时，数量、工具图标和用途说明要同步更新。

| 时间 | 段落 |
|---|---|
| 0.00–1.00s | 集成数量 |
| 1.00–4.00s | 动词胶囊 |
| 4.00–5.00s | 点击加号 |
| 5.00–9.00s | 工具环与计数 |
| 9.00–17.00s | 逐项用途 |
| 17.00–20.00s | 更多图标 |
| 20.00–23.00s | 提问 |
| 23.00–26.26s | 品牌 |

## 配色与字形

米白底，大黑字与橙色胶囊词，蓝色中心加号和多色集成图标。。

#fbf8ef · #151515 · #ed2d08 · #1656f6 · #f3b3a4

## 元素与制作规则

胶囊动词 / 加号 / 计数 / 工具轨道 / 滚动用途 / 图标环

- 橙色胶囊把 connect、with 等词接起来，最终落到一个可点击加号。点击后图标沿多条弧线涌入，数字增长到 450。
- 用途列表纵向滚动，当前行变黑并连接右侧橙色工具标签，其他行渐淡。观众一次只读一种用途。
- 图标从队列组成环，配 More，再用一句问题引向品牌。替换产品生态时，数量、工具图标和用途说明要同步更新。

## 内容替换

- 保留动词、数量、具体用途和行动问题四种尺度。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Replit",
  "id": "V145",
  "palette": [
    "#fbf8ef",
    "#151515",
    "#ed2d08",
    "#1656f6",
    "#f3b3a4"
  ],
  "typography": "米白底，大黑字与橙色胶囊词，蓝色中心加号和多色集成图标。",
  "sample": "450 Tools",
  "objects": [
    "胶囊动词",
    "加号",
    "计数",
    "工具轨道",
    "滚动用途",
    "图标环"
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
      "timeSeconds": 1.0010000000000001,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 5.005,
      "frameId": "K0021",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 9.009,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 20.02,
      "frameId": "K0080",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 23.023,
      "frameId": "K0089",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "集成数量",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "动词胶囊",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "点击加号",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "工具环与计数",
      "end": 9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9,
      "label": "逐项用途",
      "end": 17,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 17,
      "label": "更多图标",
      "end": 20,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 20,
      "label": "提问",
      "end": 23,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 23,
      "label": "品牌",
      "end": 26.259567,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 26.259567,
  "fontFamily": "Arial, sans-serif"
}
```
