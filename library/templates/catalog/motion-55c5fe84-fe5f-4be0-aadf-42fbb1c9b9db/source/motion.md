# Cash App｜竖版产品应用

用同一手机串联利益点，黑、灰、荧光绿背景切换承担章节节奏。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 11.942667,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 6.8,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Bank on Cash App.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#b8f135"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Bank on Cash App.",
        "accent": "#b8f135"
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

## 标题在上，手机占下半画面

台座场景先建立产品，随后用倾斜手机近景展示余额与进度。主张按短行排布，数字变化只发生在屏幕内，边框维持亮绿色身份。

```motion-demo
{
  "id": "clip-1",
  "title": "标题在上，手机占下半画面",
  "src": "demos/clip-1.html",
  "duration": 4.199999999999999,
  "status": "authored",
  "description": "4–8.2 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 费用短句用胶囊逐词强调

转到荧光绿全屏后，黑色圆角条在费用短句中逐项移动。粗无衬线大字与黑白灰产品面构成强对比，每次背景切换对应一个新信息点。

## 改主题要重写具体利益点

可迁移银行、会员或效率工具宣传。替换金额、功能文案和设备内容时保持同一个产品对象，结束用短句而非继续加入功能。

## 配色与字形

无衬线粗短句，逐行换词；大数字与胶囊强调交替。

#06e928 · #101010 · #b8f135 · #d8d8d8 · #ffffff

## 元素与制作规则

竖版手机 / 台座与卡片 / 功能标题 / 圆形余额 / 胶囊高亮

- 用同一手机串联利益点，黑、灰、荧光绿背景切换承担章节节奏。
- 台座场景先建立产品，随后用倾斜手机近景展示余额与进度。主张按短行排布，数字变化只发生在屏幕内，边框维持亮绿色身份。
- 转到荧光绿全屏后，黑色圆角条在费用短句中逐项移动。粗无衬线大字与黑白灰产品面构成强对比，每次背景切换对应一个新信息点。

## 内容替换

- 可迁移银行、会员或效率工具宣传。替换金额、功能文案和设备内容时保持同一个产品对象，结束用短句而非继续加入功能。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Cash App",
  "id": "V358",
  "palette": [
    "#06e928",
    "#101010",
    "#b8f135",
    "#d8d8d8",
    "#ffffff"
  ],
  "typography": "无衬线粗短句，逐行换词；大数字与胶囊强调交替",
  "sample": "Bank on Cash App.",
  "objects": [
    "竖版手机",
    "台座与卡片",
    "功能标题",
    "圆形余额",
    "胶囊高亮"
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
      "timeSeconds": 1.9904444444444445,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 3.980888888888889,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 5.639592592592592,
      "frameId": "K0024",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 8.956999999999999,
      "frameId": "K0039",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.jpg",
      "timeSeconds": 10.217614814814814,
      "frameId": "K0048",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "绿底标志",
      "end": 2,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2,
      "label": "产品台座",
      "end": 4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4,
      "label": "储蓄主张",
      "end": 5.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 5.7,
      "label": "到账主张",
      "end": 8.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 8.7,
      "label": "费用短句",
      "end": 10.3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 10.3,
      "label": "品牌总结",
      "end": 11.942667,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 11.942667,
  "fontFamily": "Arial, sans-serif"
}
```
