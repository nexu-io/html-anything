# Deezer｜Live the Music 动态背景

让背景波形持续呼吸，中央标题始终清楚地停在同一个位置。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 10.04,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Live the Music",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#080909"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Live the Music",
        "accent": "#080909"
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

## 让重复椭圆构成流动背景

椭圆按固定行距排列，只改变横向长度；连续变化形成整列波形。中央列宽，侧列窄，避免变成均匀条纹。

```motion-demo
{
  "id": "clip-1",
  "title": "让重复椭圆构成流动背景",
  "src": "demos/clip-1.html",
  "duration": 3,
  "status": "authored",
  "description": "0–3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 为标题保留稳定黑底

双行白字固定在中央，不跟随背景漂移。背景收窄时，文字周围仍保留足够的黑色覆盖。

外围波形可以出画，中央阅读区保持完整。

![2.28s · 构图参考](assets/reference-2.webp)

## 把循环用于不同画幅

扩展两侧列或裁切上下边缘适配画幅；保持行距、中心文字与循环相位关系。

## 配色与字形

粗重无衬线双行标题；薄荷底、重复黑色横向椭圆与白色反白文字。

#9ef4e4 · #080909 · #080909 · #ffffff · #4ebfa9

## 元素与制作规则

中列波形 / 两侧波形 / 固定双行标题 / 薄荷背景

- 椭圆的中心沿竖向排列，通过宽度变化形成向上和向下流动的轮廓。
- 中央黑色区域始终覆盖标题四周，保证反白文字可读；周边变化更大。
- 侧列与中列错开相位，让背景持续变化而不拖动标题。

## 内容替换

- 替换两行短文案和背景色，保持中央阅读区域、横向椭圆语言及错峰循环。
- 避免长段文字；字高与行距保持紧凑，不让字块超出稳定黑色区域。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Deezer",
  "id": "V397",
  "palette": [
    "#9ef4e4",
    "#080909",
    "#080909",
    "#ffffff",
    "#4ebfa9"
  ],
  "typography": "粗重无衬线双行标题；薄荷底、重复黑色横向椭圆与白色反白文字",
  "sample": "Live the Music",
  "objects": [
    "中列波形",
    "两侧波形",
    "固定双行标题",
    "薄荷背景"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/7d6488fe8b0788b50e0d863771011d578e59be6db7d6c4f956d43d0bd5fe761f",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-2.webp",
      "timeSeconds": 2.28,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/70dabe5a52bb3721f9762000e00756799934676e363bd7d675a40c497509cb90",
      "timeSeconds": 4.84,
      "frameId": "K0020",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.webp",
      "timeSeconds": 7.56,
      "frameId": "K0031",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 9.56,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "宽波形",
      "end": 2.28,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.28,
      "label": "中部收窄",
      "end": 4.84,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.84,
      "label": "中部展开",
      "end": 7.56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.56,
      "label": "侧列错峰",
      "end": 9.56,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.56,
      "label": "回到持续循环",
      "end": 10.04,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 10.04,
  "fontFamily": "Arial, sans-serif"
}
```
