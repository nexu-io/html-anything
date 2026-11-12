# 新视觉｜折叠标语

把一句话做成有厚度的连通字块。正面用于阅读，侧面用于展示虹彩材质；循环回到同一正面姿态。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.25,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 0.4,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "BUILD WHAT DOESN’T EXIST YET",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e8ff64"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "BUILD WHAT DOESN’T EXIST YET",
        "accent": "#e8ff64"
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

## 一句话分成三块连通轮廓

上排 BUILD WHAT、下排 DOESN’T EXIST 与 YET 共同形成紧密外形。词块用荧光黄，文字为黑色，块间只留很小的结构凹口。

## 旋转时保住完整的句子关系

绕共同的纵轴略微翻转，前面变窄时显露粉蓝厚度。三个词块共享角度和回转节拍，禁止各自散开；正面停顿应比最侧面更久。

```motion-demo
{
  "id": "clip-2",
  "title": "旋转时保住完整的句子关系",
  "src": "demos/clip-2.html",
  "duration": 3.75,
  "status": "authored",
  "description": "0–3.75 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 短句替换要按词块容量排版

准备三组长短相近的片段，第三块可以最短。保持窄体、厚笔画和连通关系，长文案另行改写，不通过缩成小字容纳。

## 配色与字形

窄粗无衬线黑字；三个连通圆角词块作为一个整体。

#241d2d · #090a0a · #e8ff64 · #d497f4 · #88dcec

## 元素与制作规则

三组词块 / 黑色字面 / 虹彩厚度 / 深紫背景

- 上排 BUILD WHAT、下排 DOESN’T EXIST 与 YET 共同形成紧密外形。词块用荧光黄，文字为黑色，块间只留很小的结构凹口。
- 绕共同的纵轴略微翻转，前面变窄时显露粉蓝厚度。三个词块共享角度和回转节拍，禁止各自散开；正面停顿应比最侧面更久。
- 准备三组长短相近的片段，第三块可以最短。保持窄体、厚笔画和连通关系，长文案另行改写，不通过缩成小字容纳。

## 内容替换

- 替换三段短宣言；保留连通词块和统一厚度旋转。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Comfy",
  "id": "V364",
  "palette": [
    "#241d2d",
    "#090a0a",
    "#e8ff64",
    "#d497f4",
    "#88dcec"
  ],
  "typography": "窄粗无衬线黑字；三个连通圆角词块作为一个整体",
  "sample": "BUILD WHAT DOESN’T EXIST YET",
  "objects": [
    "三组词块",
    "黑色字面",
    "虹彩厚度",
    "深紫背景"
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
      "timeSeconds": 0.75,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 2.0,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.7083333333333335,
      "frameId": "K0010",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 3.75,
      "frameId": "K0015",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 7.5,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "正面阅读",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "向侧面旋转",
      "end": 1.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.8,
      "label": "显露厚度",
      "end": 2.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.7,
      "label": "回到正面",
      "end": 3.75,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3.75,
      "label": "再次循环",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "再次循环",
      "end": 11.25,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.25,
  "fontFamily": "Arial, sans-serif"
}
```
