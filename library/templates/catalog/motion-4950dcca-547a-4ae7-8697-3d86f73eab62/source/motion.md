# Creative Cloud｜橙色手绘变体

以橙黄为主线，在手绘、液态、软管与平面花卉之间快切；弧线轮廓始终把不同材质连在一起。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 1.583333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 0.79,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Playful Cloud",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#ff9c25"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Playful Cloud",
        "accent": "#ff9c25"
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

## 让材质拥有自己的动作

手绘版本可以爆开，液体版本可以拉伸，软管可以弯折。动作来自材质特性，轮廓则维持同一识别位置。

## 高饱和装饰围绕中心长出

橙、粉、黄、青形成配色家族，花朵与小符号点缀外围。暗面版本缩减背景亮度作为节奏顿点，然后返回白场结构线稿。

## 配色与字形

以标志轮廓与材质为主；文字只是拼贴或编辑辅助。

#ffffff · #202020 · #ff9c25 · #eb62b6 · #43b9a4 · #f5d644

## 元素与制作规则

标志弧线 / 材质层 / 外围装饰 / 局部光泽 / 编辑线框

- 手绘版本可以爆开，液体版本可以拉伸，软管可以弯折。动作来自材质特性，轮廓则维持同一识别位置。
- 橙、粉、黄、青形成配色家族，花朵与小符号点缀外围。暗面版本缩减背景亮度作为节奏顿点，然后返回白场结构线稿。

## 内容替换

- 替换基础标志与风格素材组；保留相同重心、尺度与外围留白。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Adobe",
  "id": "V347",
  "palette": [
    "#ffffff",
    "#202020",
    "#ff9c25",
    "#eb62b6",
    "#43b9a4",
    "#f5d644"
  ],
  "typography": "以标志轮廓与材质为主；文字只是拼贴或编辑辅助",
  "sample": "Playful Cloud",
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
      "timeSeconds": 0.27708333333333335,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.webp",
      "timeSeconds": 0.475,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 0.9895833333333334,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 1.2666666666666666,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 1.5041666666666667,
      "frameId": "K0011",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "手绘爆点",
      "end": 0.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.25,
      "label": "线描",
      "end": 0.45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.45,
      "label": "液态金色",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "彩色软管",
      "end": 0.95,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.95,
      "label": "平面花卉",
      "end": 1.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.25,
      "label": "暗面浮雕",
      "end": 1.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.5,
      "label": "结构线稿",
      "end": 1.583333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 1.583333,
  "fontFamily": "Arial, sans-serif"
}
```
