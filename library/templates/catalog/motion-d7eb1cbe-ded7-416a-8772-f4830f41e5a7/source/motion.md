# 订阅改版

云在上方，设备在下方，发光竖线连接两层。周围终端信息降低对比，主体保持纵向中央构图。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 12.333333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 8.7,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "NOUS",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#aab8aa"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "NOUS",
        "accent": "#aab8aa"
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

## 建立上下相连的计算图景

云在上方，设备在下方，发光竖线连接两层。周围终端信息降低对比，主体保持纵向中央构图。

## 用短暂故障切换到品牌

徽章先以条带错位闪入，随后稳定在中心；云和设备变为粒子向外消散，徽章自身保持完整。

```motion-demo
{
  "id": "clip-2",
  "title": "用短暂故障切换到品牌",
  "src": "demos/clip-2.html",
  "duration": 3,
  "status": "authored",
  "description": "6–9 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 把尾段留给清晰标识

去掉背景后保留一段黑底徽章，再整体淡出。换主题时更换中央标志和上下对象，但保留复杂环境退场、品牌留下的逻辑。

## 配色与字形

黑白高反差 CRT 拼贴，少量绿色终端字，中央徽章锐利。。

#000000 · #e5e5e5 · #aab8aa · #354f3d · #555555

## 元素与制作规则

发光云 / 下方设备 / 代码片段 / 中央徽章 / 消散粒子

- 云在上方，设备在下方，发光竖线连接两层。周围终端信息降低对比，主体保持纵向中央构图。
- 徽章先以条带错位闪入，随后稳定在中心；云和设备变为粒子向外消散，徽章自身保持完整。
- 去掉背景后保留一段黑底徽章，再整体淡出。换主题时更换中央标志和上下对象，但保留复杂环境退场、品牌留下的逻辑。

## 内容替换

- 替换中心徽章与网络对象，保持从复杂计算场景到纯品牌的减法。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Nous Research",
  "id": "V133",
  "palette": [
    "#000000",
    "#e5e5e5",
    "#aab8aa",
    "#354f3d",
    "#555555"
  ],
  "typography": "黑白高反差 CRT 拼贴，少量绿色终端字，中央徽章锐利。",
  "sample": "NOUS",
  "objects": [
    "发光云",
    "下方设备",
    "代码片段",
    "中央徽章",
    "消散粒子"
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
      "timeSeconds": 1.0,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/f336d6befc4d8b159a4d19ce6f726af210fc9d6101a5362181020af8a267fa14",
      "timeSeconds": 6.0,
      "frameId": "K0022",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/8b651e749b8234d81cd8226f4b84fa0fad43e28d5f5a34f51be4c09c36c4e694",
      "timeSeconds": 7.583333333333333,
      "frameId": "K0028",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.webp",
      "timeSeconds": 9.791666666666666,
      "frameId": "K0037",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-6.webp",
      "timeSeconds": 11.0,
      "frameId": "K0042",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "黑场",
      "end": 0.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.8,
      "label": "云与设备网络",
      "end": 6,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 6,
      "label": "徽章故障显现",
      "end": 7.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 7.5,
      "label": "场景粒子消散",
      "end": 9.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 9.5,
      "label": "徽章停留",
      "end": 11,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 11,
      "label": "淡出",
      "end": 12.333333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 12.333333,
  "fontFamily": "Arial, sans-serif"
}
```
