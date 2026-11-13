# Deezer｜声波心形标志

让独立声波先各自动起来，再共同组成一个稳定的心形标记。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 5.6,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.5,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "DEEZER",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#9419f6"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "DEEZER",
        "accent": "#9419f6"
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

## 声波共同形成轮廓

紫色底只承载黑色图形和单行字标。中部与两侧椭圆使用不同长度，保持双峰与下端收尖。

先展开几个声波，再补齐整体轮廓，字标从下方稳定出现。

```motion-demo
{
  "id": "clip-1",
  "title": "声波共同形成轮廓",
  "src": "demos/clip-1.html",
  "duration": 1.1,
  "status": "authored",
  "description": "0–1.1 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 留读后按声波拆开

主体完成后保持位置，退场逐条缩短和分离，最后回到纯底色。

```motion-demo
{
  "id": "clip-2",
  "title": "留读后按声波拆开",
  "src": "demos/clip-2.html",
  "duration": 1.2999999999999998,
  "status": "authored",
  "description": "4–5.3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 替换品牌而保留形态

更换背景、字标或声波颜色；保持心形轮廓、独立条带和下方稳定文字三者的关系。

| 时间 | 段落 |
|---|---|
| 0.00–0.28s | 声波点进入 |
| 0.28–0.56s | 纵向扩张 |
| 0.56–4.20s | 心形完成 |
| 4.20–5.00s | 错峰收缩 |
| 5.00–5.60s | 回到空白 |

## 配色与字形

粗重无衬线全大写字标；紫色满版背景、黑色纵向椭圆声波。

#9419f6 · #09090b · #09090b · #c092fc · #ffffff

## 元素与制作规则

紫色背景 / 九个声波椭圆 / 心形轮廓 / 底部字标

- 各椭圆保持独立，纵向尺寸错峰增长后共同形成心形；不要直接缩放一个完整心形。
- 字标稳定在心形下方，主图形完成后留读；退场先拆开声波，再收回小点。

## 内容替换

- 可替换字标和底色；保留分条声波共同组成心形的特征。
- 字标保持单行，宽度略小于图形整体宽度；文字不随每个声波一起抖动。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Deezer",
  "id": "V396",
  "palette": [
    "#9419f6",
    "#09090b",
    "#09090b",
    "#c092fc",
    "#ffffff"
  ],
  "typography": "粗重无衬线全大写字标；紫色满版背景、黑色纵向椭圆声波",
  "sample": "DEEZER",
  "objects": [
    "紫色背景",
    "九个声波椭圆",
    "心形轮廓",
    "底部字标"
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
      "timeSeconds": 0.28,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 0.56,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 5.0,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "声波点进入",
      "end": 0.28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.28,
      "label": "纵向扩张",
      "end": 0.56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.56,
      "label": "心形完成",
      "end": 4.2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.2,
      "label": "错峰收缩",
      "end": 5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5,
      "label": "回到空白",
      "end": 5.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 5.6,
  "fontFamily": "Arial, sans-serif"
}
```
