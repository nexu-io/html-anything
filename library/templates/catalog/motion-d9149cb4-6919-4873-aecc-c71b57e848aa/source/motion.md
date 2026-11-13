# Creative Cloud｜彩色图形变体

以同一个标志做创作风格轮播，从细线、金属和花卉到图像拼贴；统一的位置和留白把变化收成一个系列。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 2.833333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.415,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Creative Variations",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#7848e8"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Creative Variations",
        "accent": "#7848e8"
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

## 风格差异大，外框占比小

每种材质可以完全不同，但标志中心与最大外接框保持相近。白色四周留足空间，花卉与碎片只在局部扩出。

## 快切之间保留形状对应

沿弧线收缩、展开和断开，使下一种风格接在相近位置。以两三帧材质变化制造速度，较完整版本停留稍长；不额外叠标题。

## 准备素材时先分风格组

可替换为品牌的不同创作领域，每组只选一个材质主意。不要在同一帧混合所有风格。

## 配色与字形

以标志轮廓与材质为主；文字只是拼贴或编辑辅助。

#ffffff · #171717 · #7848e8 · #85e8d1 · #f1b737 · #ed6ad0

## 元素与制作规则

标志弧线 / 材质层 / 外围装饰 / 局部光泽 / 编辑线框

- 每种材质可以完全不同，但标志中心与最大外接框保持相近。白色四周留足空间，花卉与碎片只在局部扩出。
- 沿弧线收缩、展开和断开，使下一种风格接在相近位置。以两三帧材质变化制造速度，较完整版本停留稍长；不额外叠标题。
- 可替换为品牌的不同创作领域，每组只选一个材质主意。不要在同一帧混合所有风格。

## 内容替换

- 替换基础标志与风格素材组；保留相同重心、尺度与外围留白。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Adobe",
  "id": "V346",
  "palette": [
    "#ffffff",
    "#171717",
    "#7848e8",
    "#85e8d1",
    "#f1b737",
    "#ed6ad0"
  ],
  "typography": "以标志轮廓与材质为主；文字只是拼贴或编辑辅助",
  "sample": "Creative Variations",
  "objects": [
    "标志弧线",
    "材质层",
    "外围装饰",
    "局部光泽",
    "编辑线框"
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
      "timeSeconds": 0.2833333333333333,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 0.6880952380952381,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 1.5785714285714285,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 1.8619047619047617,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 2.59047619047619,
      "frameId": "K0016",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "细线轮廓",
      "end": 0.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.25,
      "label": "立体色带",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "金属线条",
      "end": 0.95,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.95,
      "label": "植物图形",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "图像碎片",
      "end": 1.85,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.85,
      "label": "虹彩与字样",
      "end": 2.55,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.55,
      "label": "手绘景观",
      "end": 2.833333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 2.833333,
  "fontFamily": "Arial, sans-serif"
}
```
