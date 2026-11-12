# Creative Cloud｜玫红切片变体

以短促快切展示标志从立体切片到平面编辑与银白材质的变化，玫红是贯穿各版本的视觉线索。

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
      "value": "Graphic Cloud",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#e5269c"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Graphic Cloud",
        "accent": "#e5269c"
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

## 每次换媒介仍落在同一中心

切片环、拼贴与排版网格都围绕同一弧形搭建。玫红区域持续出现，旁边的选框、字样与游标只承担设计语境。

## 以减法结束密集快切

最后去掉外围编辑元素，保留银白轮廓和一段粉色高光。新主题可更换媒介，但避免最后一帧比中段更复杂。

## 配色与字形

以标志轮廓与材质为主；文字只是拼贴或编辑辅助。

#ffffff · #2b0b24 · #e5269c · #8938cf · #ece9e7

## 元素与制作规则

标志弧线 / 材质层 / 外围装饰 / 局部光泽 / 编辑线框

- 切片环、拼贴与排版网格都围绕同一弧形搭建。玫红区域持续出现，旁边的选框、字样与游标只承担设计语境。
- 最后去掉外围编辑元素，保留银白轮廓和一段粉色高光。新主题可更换媒介，但避免最后一帧比中段更复杂。

## 内容替换

- 替换基础标志与风格素材组；保留相同重心、尺度与外围留白。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "Adobe",
  "id": "V345",
  "palette": [
    "#ffffff",
    "#2b0b24",
    "#e5269c",
    "#8938cf",
    "#ece9e7"
  ],
  "typography": "以标志轮廓与材质为主；文字只是拼贴或编辑辅助",
  "sample": "Graphic Cloud",
  "objects": [
    "标志弧线",
    "材质层",
    "外围装饰",
    "局部光泽",
    "编辑线框"
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
      "path": "https://r.open-design.ai/files/4556137ca27b72ef73fc24fc6d44d857a85802e2017f4315d91f38a7f5b7775d",
      "timeSeconds": 0.475,
      "frameId": "K0002",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-3.jpg",
      "timeSeconds": 0.7125,
      "frameId": "K0003",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 0.9895833333333334,
      "frameId": "K0004",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 1.5041666666666667,
      "frameId": "K0008",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "立体切片",
      "end": 0.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.4,
      "label": "编辑拼贴",
      "end": 0.7,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 0.7,
      "label": "排版网格",
      "end": 1,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1,
      "label": "图形界面",
      "end": 1.45,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.45,
      "label": "银白收束",
      "end": 1.583333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 1.583333,
  "fontFamily": "Arial, sans-serif"
}
```
