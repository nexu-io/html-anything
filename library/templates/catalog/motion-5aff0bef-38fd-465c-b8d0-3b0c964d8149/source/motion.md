# 信息拼贴变为墨字

前半段用不同大小的字母、条带和几何铺满画面，整体缩小后，碎片向中央单词的基线靠拢。元素退出与新字母出现错开进行。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 4.333333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Intelligence.",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#655158"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Intelligence.",
        "accent": "#655158"
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

## 杂乱字母先收成一个词的轮廓

前半段用不同大小的字母、条带和几何铺满画面，整体缩小后，碎片向中央单词的基线靠拢。元素退出与新字母出现错开进行。

```motion-demo
{
  "id": "clip-1",
  "title": "杂乱字母先收成一个词的轮廓",
  "src": "demos/clip-1.html",
  "duration": 1.5999999999999999,
  "status": "authored",
  "description": "1.2–2.8 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 结尾必须能一眼读完

黑色单词居中，字号明显小于开头碎片；纸片和线条退到极低对比，只留下阅读所需的笔画。更换关键词时重新分配字母宽度，不保持原碎片机械平移。

## 配色与字形

纸白背景，黑色字母碎片与少量灰紫几何，最终统一成清楚单词。。

#eeeee9 · #222224 · #655158 · #b5bdb8 · #a69cae

## 元素与制作规则

大字母碎片 / 几何纸片 / Information 条带 / Intelligence 单词

- 前半段用不同大小的字母、条带和几何铺满画面，整体缩小后，碎片向中央单词的基线靠拢。元素退出与新字母出现错开进行。
- 黑色单词居中，字号明显小于开头碎片；纸片和线条退到极低对比，只留下阅读所需的笔画。更换关键词时重新分配字母宽度，不保持原碎片机械平移。

## 内容替换

- 适合表达由杂乱信息到清晰结论，替换单词后重算字距与汇聚点。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Harvey",
  "id": "V337",
  "palette": [
    "#eeeee9",
    "#222224",
    "#655158",
    "#b5bdb8",
    "#a69cae"
  ],
  "typography": "纸白背景，黑色字母碎片与少量灰紫几何，最终统一成清楚单词。",
  "sample": "Intelligence.",
  "objects": [
    "大字母碎片",
    "几何纸片",
    "Information 条带",
    "Intelligence 单词"
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
      "timeSeconds": 1.4166666666666667,
      "frameId": "K0007",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 1.5833333333333333,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 2.5,
      "frameId": "K0013",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 3.0,
      "frameId": "K0014",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "信息字母拼贴",
      "end": 1.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.4,
      "label": "整体缩小",
      "end": 1.6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.6,
      "label": "碎片重排",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "单词对齐",
      "end": 3,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 3,
      "label": "留读",
      "end": 4.333333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 4.333333,
  "fontFamily": "Arial, sans-serif"
}
```
