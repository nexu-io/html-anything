# 矢量图形｜发布前预告

从完整海报推进到行星，再到黄色轮廓的一条曲线。倍率持续增加，但边缘始终平滑；放大中心保持在同一细节上。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 8.0,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 1.6,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Infinitely scalable.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#f1c916"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Infinitely scalable.",
        "accent": "#f1c916"
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

## 用连续放大证明可缩放

从完整海报推进到行星，再到黄色轮廓的一条曲线。倍率持续增加，但边缘始终平滑；放大中心保持在同一细节上。

```motion-demo
{
  "id": "clip-1",
  "title": "用连续放大证明可缩放",
  "src": "demos/clip-1.html",
  "duration": 3.0,
  "status": "authored",
  "description": "1.5–4.5 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 固定倍率标签作为参照

倍率小标签留在左上，不跟随插画一起放大。开场和结尾用奶油白底与细衬线字，插画阶段可充满画面。

## 从巨大细节回到小标志

放大结束硬切回留白，让碎片在中心组合成品牌图案，再展开字标。更换插画时选择能支持数层细节的矢量主体。

## 配色与字形

奶油底衬线短句，插画用深青、黄色与红色，倍率标签固定。。

#fbfbef · #192d32 · #f1c916 · #d8485c · #ffffff

## 元素与制作规则

插画画布 / 放大中心 / 倍率标签 / 清晰曲线 / 品牌标志

- 从完整海报推进到行星，再到黄色轮廓的一条曲线。倍率持续增加，但边缘始终平滑；放大中心保持在同一细节上。
- 倍率小标签留在左上，不跟随插画一起放大。开场和结尾用奶油白底与细衬线字，插画阶段可充满画面。
- 放大结束硬切回留白，让碎片在中心组合成品牌图案，再展开字标。更换插画时选择能支持数层细节的矢量主体。

## 内容替换

- 目标插画需要真实矢量轮廓；保留连续 zoom 和固定倍率。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Ideogram",
  "id": "V130",
  "palette": [
    "#fbfbef",
    "#192d32",
    "#f1c916",
    "#d8485c",
    "#ffffff"
  ],
  "typography": "奶油底衬线短句，插画用深青、黄色与红色，倍率标签固定。",
  "sample": "Infinitely scalable.",
  "objects": [
    "插画画布",
    "放大中心",
    "倍率标签",
    "清晰曲线",
    "品牌标志"
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
      "timeSeconds": 1.4666666666666666,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 2.0,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 4.0,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 5.333333333333333,
      "frameId": "K0018",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 6.266666666666667,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "能力短句",
      "end": 1.45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.45,
      "label": "完整插画",
      "end": 1.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.9,
      "label": "持续放大",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "几何边界特写",
      "end": 5.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.3,
      "label": "图案标志合成",
      "end": 6.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6.5,
      "label": "品牌字标",
      "end": 8.0,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 8.0,
  "fontFamily": "Georgia, serif"
}
```
