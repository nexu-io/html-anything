# Universe 2023｜大会图形揭晓

从黑暗中的细轮廓瞬间展开一个多彩几何世界，再把所有东西收回中心标志。

```motion-demo
{
  "id": "sequence",
  "title": "整体编排",
  "src": "demos/sequence.html",
  "duration": 6.333333,
  "status": "authored",
  "description": "动作与构图示意",
  "initialTime": 3,
  "params": [
    {
      "key": "title",
      "label": "示例主文案",
      "type": "text",
      "value": "Universe",
      "maxLength": 60
    },
    {
      "key": "accent",
      "label": "强调色",
      "type": "color",
      "value": "#4df64e"
    }
  ],
  "presets": [
    {
      "label": "默认内容",
      "values": {
        "title": "Universe",
        "accent": "#4df64e"
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

## 爆发以前让轮廓足够安静

黑底中先描出中心标志的局部亮边，尺寸保持小。临界点直接扩大空间，亮度与物体数量一起提升，形成明确反差。

```motion-demo
{
  "id": "clip-1",
  "title": "爆发以前让轮廓足够安静",
  "src": "demos/clip-1.html",
  "duration": 1.8,
  "status": "authored",
  "description": "1.2–3 秒 · 动作示意",
  "initialTime": 0.6
}
```

## 几何群围绕中心分层

球、花瓣、环和长条沿径向展开，近处物体更大并允许裁出画幅。绿、紫、粉、青分配给不同形状，中心标志保持辨认空间。

## 收尾沿原路径回收

外围图形缩向中心并褪去色彩，最后只剩白色标志。替换时选择一个中心标志和少量重复几何，不让字句打断六秒的收放动作。

## 配色与字形

主角为品牌标与几何群；不额外加入长文字。

#090510 · #ffffff · #4df64e · #7754ea · #ef5ebc · #62d7ff

## 元素与制作规则

中心品牌圆 / 球体 / 花瓣 / 几何条 / 径向光线

- 黑底中先描出中心标志的局部亮边，尺寸保持小。临界点直接扩大空间，亮度与物体数量一起提升，形成明确反差。
- 球、花瓣、环和长条沿径向展开，近处物体更大并允许裁出画幅。绿、紫、粉、青分配给不同形状，中心标志保持辨认空间。
- 外围图形缩向中心并褪去色彩，最后只剩白色标志。替换时选择一个中心标志和少量重复几何，不让字句打断六秒的收放动作。

## 内容替换

- 替换中心标志及几何家族，保留安静→爆发→回收。

## 制作参数

[视觉与对象](style.json) · [段落时序](timeline.json) · [位置数据](tracks.json) · [文件清单](manifest.json)

此规范根据参考视频整理。HTML 为可编辑的编排示例；具体数据的来源、精度与有效区间随文件标注。

```motion-board
{
  "version": 1,
  "brand": "GitHub",
  "id": "V348",
  "palette": [
    "#090510",
    "#ffffff",
    "#4df64e",
    "#7754ea",
    "#ef5ebc",
    "#62d7ff"
  ],
  "typography": "主角为品牌标与几何群；不额外加入长文字",
  "sample": "Universe",
  "objects": [
    "中心品牌圆",
    "球体",
    "花瓣",
    "几何条",
    "径向光线"
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
      "timeSeconds": 1.8795698924731183,
      "frameId": "K0005",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "https://r.open-design.ai/files/8070bbca8c6f73cdee871e4896684c419d131443afe48ee53beade058a340707",
      "timeSeconds": 2.533333333333333,
      "frameId": "K0009",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-4.jpg",
      "timeSeconds": 4.494623655913979,
      "frameId": "K0017",
      "role": "reference-evidence",
      "status": "measured"
    },
    {
      "path": "assets/reference-5.jpg",
      "timeSeconds": 4.780645161290323,
      "frameId": "K0019",
      "role": "reference-evidence",
      "status": "measured"
    }
  ],
  "stages": [
    {
      "start": 0,
      "label": "暗场轮廓",
      "end": 1.9,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 1.9,
      "label": "图形爆发",
      "end": 2.5,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 2.5,
      "label": "空间展开",
      "end": 4.4,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.4,
      "label": "收回中心",
      "end": 4.8,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    },
    {
      "start": 4.8,
      "label": "白色标志",
      "end": 6.333333,
      "status": "inferred",
      "basis": "Representative-frame review; approximate boundaries"
    }
  ],
  "duration": 6.333333,
  "fontFamily": "Arial, sans-serif"
}
```
