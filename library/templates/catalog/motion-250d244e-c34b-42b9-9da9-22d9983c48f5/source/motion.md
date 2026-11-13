# 新视觉｜字标揭晓

从放大的虹彩表面抽出 C 形，把空间形体收回一个字，再沿同一基线展开完整品牌名。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 4.5,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3.4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Comfy",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e7ff64"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Comfy",
        "accent": "#e7ff64"
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

## 先近看材质，再读出字形

粉蓝黄高光填满画面，负空间逐步形成 C。拉远后显示几个相互转向的 C 面，背景回到深紫，物体总重心仍居中。

```motion-demo
{
  "id": "clip-1",
  "title": "先近看材质，再读出字形",
  "src": "demos/clip-1.html",
  "duration": 2.4,
  "status": "authored",
  "description": "0–2.4 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 单字成为完整字标的起点

立体形收成荧光黄 C，随后从左到右补齐名称。字标落定后停止空间旋转，保留约一秒的干净阅读。

## 适合短品牌名称的材质亮相

新名称先选一个足以独立识别的首字，再设计它的负空间与厚度。结尾不叠副标题，避免削弱由一字到全名的动作。

## 配色与字形

最终字标采用圆角粗字；开场只保留同形 C 的剪影。

#211928 · #111111 · #e7ff64 · #efadd9 · #8cccea

## 元素与制作规则

虹彩表面 / C 形负空间 / 三面形体 / 单字 / 最终字标

- 粉蓝黄高光填满画面，负空间逐步形成 C。拉远后显示几个相互转向的 C 面，背景回到深紫，物体总重心仍居中。
- 立体形收成荧光黄 C，随后从左到右补齐名称。字标落定后停止空间旋转，保留约一秒的干净阅读。
- 新名称先选一个足以独立识别的首字，再设计它的负空间与厚度。结尾不叠副标题，避免削弱由一字到全名的动作。

## 内容替换

- 替换品牌首字与短名称；保留材质近景→立体字→平面字标。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Comfy",
  "id": "V365",
  "palette": [
    "#211928",
    "#111111",
    "#e7ff64",
    "#efadd9",
    "#8cccea"
  ],
  "typography": "最终字标采用圆角粗字；开场只保留同形 C 的剪影",
  "sample": "Comfy",
  "objects": [
    "虹彩表面",
    "C 形负空间",
    "三面形体",
    "单字",
    "最终字标"
  ],
  "frames": [
    {
      "path": "https://r.open-design.ai/files/2cb5812c59c9e4ef2eb120fb12a2e71f801f6ab7435708ecc2508cf7b9d69efb",
      "timeSeconds": 0.0,
      "frameId": "K0001",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/f4fa21466e5d1d698f2b7017aaba099ef049aef01a9f9823ba41cd82c31ac09d",
      "timeSeconds": 0.45,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 0.9818181818181819,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.25,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 2.5363636363636366,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 2.9454545454545458,
      "frameId": "K0012",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "满幅虹彩",
      "end": 0.45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.45,
      "label": "字形负空间",
      "end": 0.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.9,
      "label": "旋转形体",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "三面组合",
      "end": 2.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.3,
      "label": "单字收束",
      "end": 2.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.6,
      "label": "名称展开",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "稳定字标",
      "end": 4.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 4.5,
  "fontFamily": "Arial, sans-serif"
}
```
